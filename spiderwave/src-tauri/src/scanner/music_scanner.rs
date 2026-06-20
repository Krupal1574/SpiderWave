use std::path::Path;
use walkdir::WalkDir;
use lofty::read_from_path;
use lofty::file::TaggedFileExt;
use lofty::file::AudioFile;
use lofty::tag::Accessor;
use rusqlite::Connection;

use crate::db::repositories::artists::insert_or_get_artist;
use crate::db::repositories::albums::insert_or_get_album;
use crate::db::repositories::tracks::insert_track;
use crate::db::repositories::stats::update_last_scan;

fn is_supported_audio_file(path: &Path) -> bool {
    if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
        matches!(ext.to_lowercase().as_str(), "mp3" | "flac" | "wav" | "m4a")
    } else {
        false
    }
}

pub fn scan_directory(conn: &Connection, path: &str) -> Result<(), Box<dyn std::error::Error>> {
    // Start transaction for much faster insertions
    conn.execute("BEGIN TRANSACTION", [])?;

    for entry in WalkDir::new(path).into_iter().filter_map(|e| e.ok()) {
        let file_path = entry.path();
        if file_path.is_file() && is_supported_audio_file(file_path) {
            if let Ok(tagged_file) = read_from_path(file_path) {
                let tag = tagged_file.primary_tag().or_else(|| tagged_file.first_tag());
                let properties = tagged_file.properties();

                let duration = properties.duration().as_secs();
                
                let title = tag.as_ref().and_then(|t| t.title().map(|s| s.into_owned())).unwrap_or_else(|| "Unknown Title".to_string());
                let artist_name = tag.as_ref().and_then(|t| t.artist().map(|s| s.into_owned())).unwrap_or_else(|| "Unknown Artist".to_string());
                let album_title = tag.as_ref().and_then(|t| t.album().map(|s| s.into_owned())).unwrap_or_else(|| "Unknown Album".to_string());
                let track_number = tag.as_ref().and_then(|t| t.track());
                
                let artist_id = insert_or_get_artist(conn, &artist_name).unwrap_or(0);
                let album_id = insert_or_get_album(conn, &album_title, artist_id).unwrap_or(0);
                
                let _ = insert_track(
                    conn,
                    &title,
                    artist_id,
                    album_id,
                    &file_path.to_string_lossy(),
                    duration,
                    track_number,
                );
            }
        }
    }
    
    // Commit transaction
    conn.execute("COMMIT", [])?;

    // Update last_scan_at
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs()
        .to_string();
    let _ = update_last_scan(conn, &now);
    
    Ok(())
}
