use crate::models::track::Track;
use crate::scanner::music_scanner::scan_directory;

#[tauri::command]
pub async fn scan_music_library(folder_path: String) -> Result<Vec<Track>, String> {
    scan_directory(&folder_path).map_err(|e| e.to_string())
}
