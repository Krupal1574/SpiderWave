use std::path::Path;
use walkdir::WalkDir;
use lofty::read_from_path;
use lofty::file::TaggedFileExt;
use lofty::file::AudioFile;
use lofty::tag::Accessor;
use std::hash::{Hash, Hasher};
use std::collections::hash_map::DefaultHasher;

use crate::models::track::Track;

fn is_supported_audio_file(path: &Path) -> bool {
    if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
        matches!(ext.to_lowercase().as_str(), "mp3" | "flac" | "wav" | "m4a")
    } else {
        false
    }
}

pub fn scan_directory(path: &str) -> Result<Vec<Track>, Box<dyn std::error::Error>> {
    let mut tracks = Vec::new();
    
    for entry in WalkDir::new(path).into_iter().filter_map(|e| e.ok()) {
        let file_path = entry.path();
        if file_path.is_file() && is_supported_audio_file(file_path) {
            // Read metadata using lofty
            if let Ok(tagged_file) = read_from_path(file_path) {
                let tag = tagged_file.primary_tag().or_else(|| tagged_file.first_tag());
                let properties = tagged_file.properties();

                let duration = properties.duration().as_secs();
                
                let title = tag.and_then(|t| t.title().map(|s| s.into_owned())).unwrap_or_else(|| "Unknown Title".to_string());
                let artist = tag.and_then(|t| t.artist().map(|s| s.into_owned())).unwrap_or_else(|| "Unknown Artist".to_string());
                let album = tag.and_then(|t| t.album().map(|s| s.into_owned())).unwrap_or_else(|| "Unknown Album".to_string());
                let track_number = tag.and_then(|t| t.track());

                // Generate deterministic ID from path
                let mut hasher = DefaultHasher::new();
                file_path.to_string_lossy().hash(&mut hasher);
                let id = format!("{:x}", hasher.finish());

                tracks.push(Track {
                    id,
                    title,
                    artist,
                    album,
                    duration,
                    track_number,
                    path: file_path.to_string_lossy().into_owned(),
                });
            }
        }
    }
    
    Ok(tracks)
}
