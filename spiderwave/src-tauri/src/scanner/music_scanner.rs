use std::path::Path;
use walkdir::WalkDir;
use lofty::read_from_path;
use lofty::file::{TaggedFile, TaggedFileExt, AudioFile};
use lofty::tag::{Accessor, Tag, TagType};
use rusqlite::Connection;

use crate::db::repositories::artists::insert_or_get_artist;
use crate::db::repositories::albums::insert_or_get_album;
use crate::db::repositories::tracks::{insert_track, is_track_unchanged};
use crate::db::repositories::stats::update_last_scan;
use crate::db::repositories::scan_failures::{record_scan_failure, clear_failures_for_folder};
use crate::models::scan_result::ScanResult;

fn is_supported_audio_file(path: &Path) -> bool {
    if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
        matches!(ext.to_lowercase().as_str(), "mp3" | "flac" | "wav" | "m4a" | "ogg")
    } else {
        false
    }
}

/// Derive a human-readable title from the file stem when tag metadata is absent.
/// Replaces underscores and multiple spaces with single spaces, trims the result.
/// Example: "Love_me_not - Copy" → "Love me not - Copy"
fn title_from_filename(path: &Path) -> String {
    path.file_stem()
        .map(|s| s.to_string_lossy().into_owned())
        .map(|s| {
            s.replace('_', " ")
             .split_whitespace()
             .collect::<Vec<_>>()
             .join(" ")
        })
        .unwrap_or_else(|| "Unknown Title".to_string())
}

/// Resolve the best available tag for a file.
///
/// Priority order:
///   1. `TagType::Id3v2`   — catches MP3s with both ID3v1 and ID3v2, always prefer modern tag
///   2. `primary_tag()`    — format-native (VorbisComment for FLAC/OGG, MP4Ilst for M4A)
///   3. `first_tag()`      — last-resort fallback; logs a diagnostic when used
fn resolve_tag<'a>(tagged_file: &'a TaggedFile, file_path: &Path) -> Option<&'a Tag> {
    if let Some(tag) = tagged_file.tag(TagType::Id3v2) {
        return Some(tag);
    }
    if let Some(tag) = tagged_file.primary_tag() {
        return Some(tag);
    }
    // Third-tier fallback — log it so we know which files need attention.
    let tag = tagged_file.first_tag();
    if tag.is_some() {
        let available: Vec<String> = tagged_file.tags().iter()
            .map(|t| format!("{:?}", t.tag_type()))
            .collect();
        eprintln!(
            "[SCANNER] fallback=first_tag file={:?} available_tags=[{}]",
            file_path, available.join(", ")
        );
    }
    tag
}

/// Scan a single directory tree.
///
/// # Behaviour
/// - Skips files whose `(path, file_size, file_modified)` triple already exists in the DB.
/// - For files that fail to parse, records them in `scan_failures` and continues.
/// - For files where title/artist/album cannot be extracted, applies the fallback hierarchy:
///     title  → filename stem  →  "Unknown Title"
///     artist → "Unknown Artist"
///     album  → "Unknown Album"
/// - The transaction is committed once per folder-scan, not per-file.
///
/// Returns a `ScanResult` with counts of scanned/imported/skipped/failed files.
pub fn scan_directory(conn: &Connection, folder_path: &str) -> Result<ScanResult, Box<dyn std::error::Error>> {
    let mut result = ScanResult::default();

    // Clear stale failure records for this folder so fixed files don't linger.
    let _ = clear_failures_for_folder(conn, folder_path);

    // Single transaction for all inserts in this folder.
    conn.execute("BEGIN TRANSACTION", [])?;

    for entry in WalkDir::new(folder_path).into_iter().filter_map(|e| e.ok()) {
        let file_path = entry.path();
        if !file_path.is_file() || !is_supported_audio_file(file_path) {
            continue;
        }

        result.scanned += 1;
        let path_str = file_path.to_string_lossy();

        // --- Incremental skip: mtime + file_size ---
        let (file_size, file_modified) = match std::fs::metadata(file_path) {
            Ok(meta) => {
                let size = meta.len() as i64;
                let mtime = meta.modified()
                    .ok()
                    .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                    .map(|d| d.as_secs() as i64)
                    .unwrap_or(0);
                (size, mtime)
            }
            Err(e) => {
                eprintln!("[SCANNER] fs::metadata error file={:?} error={}", file_path, e);
                (0, 0)
            }
        };

        if is_track_unchanged(conn, &path_str, file_size, file_modified) {
            result.skipped += 1;
            continue;
        }

        // --- Tag parsing ---
        let tagged_file = match read_from_path(file_path) {
            Ok(tf) => tf,
            Err(e) => {
                // File could not be opened/parsed at all (e.g. os error 131 for malformed FLAC).
                let error_msg = e.to_string();
                let ext = file_path.extension()
                    .and_then(|s| s.to_str())
                    .map(|s| s.to_uppercase());
                eprintln!(
                    "[SCANNER] parse_error parser=lofty format={} file={:?} reason={}",
                    ext.as_deref().unwrap_or("unknown"),
                    file_path,
                    error_msg,
                );
                let _ = record_scan_failure(
                    conn,
                    &path_str,
                    ext.as_deref(),
                    &error_msg,
                );
                result.failed += 1;
                continue;  // Never abort — proceed to next file.
            }
        };

        let tag = resolve_tag(&tagged_file, file_path);
        let format_str = format!("{:?}", tagged_file.file_type());
        let duration = tagged_file.properties().duration().as_secs();

        // --- Title fallback hierarchy ---
        // 1. ID3/tag title field
        // 2. filename stem
        // 3. "Unknown Title"
        let title = tag.as_ref()
            .and_then(|t| t.title().map(|s| s.into_owned()))
            .filter(|s| !s.trim().is_empty())
            .unwrap_or_else(|| {
                let derived = title_from_filename(file_path);
                eprintln!(
                    "[SCANNER] missing_title fallback=filename format={} file={:?}",
                    format_str, file_path
                );
                derived
            });

        // --- Artist / Album fallbacks ---
        let artist_name = tag.as_ref()
            .and_then(|t| t.artist().map(|s| s.into_owned()))
            .filter(|s| !s.trim().is_empty())
            .unwrap_or_else(|| "Unknown Artist".to_string());

        let album_title = tag.as_ref()
            .and_then(|t| t.album().map(|s| s.into_owned()))
            .filter(|s| !s.trim().is_empty())
            .unwrap_or_else(|| "Unknown Album".to_string());

        let track_number = tag.as_ref().and_then(|t| t.track());

        // --- DB insert ---
        let artist_id = insert_or_get_artist(conn, &artist_name).unwrap_or(0);
        let album_id  = insert_or_get_album(conn, &album_title, artist_id).unwrap_or(0);

        match insert_track(conn, &title, artist_id, album_id, &path_str, duration, track_number, file_size, file_modified) {
            Ok(_)  => result.imported += 1,
            Err(e) => {
                eprintln!("[SCANNER] db_insert_error file={:?} error={}", file_path, e);
                let _ = record_scan_failure(conn, &path_str, Some(&format_str), &e.to_string());
                result.failed += 1;
            }
        }
    }

    conn.execute("COMMIT", [])?;

    // Update last_scan_at timestamp.
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
        .to_string();
    let _ = update_last_scan(conn, &now);

    eprintln!(
        "[SCANNER] complete folder={:?} scanned={} imported={} skipped={} failed={}",
        folder_path, result.scanned, result.imported, result.skipped, result.failed
    );

    Ok(result)
}
