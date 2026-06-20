use tauri::State;
use crate::models::track::Track;
use crate::models::album::Album;
use crate::models::artist::Artist;
use crate::models::stats::LibraryStats;
use crate::scanner::music_scanner::scan_directory;
use crate::db::database::Database;
use crate::db::repositories;

#[tauri::command]
pub async fn scan_music_library(state: State<'_, Database>, folder_path: String) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|_| "Failed to lock database".to_string())?;
    scan_directory(&conn, &folder_path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_tracks(state: State<'_, Database>) -> Result<Vec<Track>, String> {
    let conn = state.conn.lock().map_err(|_| "Failed to lock database".to_string())?;
    repositories::tracks::get_all_tracks(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_albums(state: State<'_, Database>) -> Result<Vec<Album>, String> {
    let conn = state.conn.lock().map_err(|_| "Failed to lock database".to_string())?;
    repositories::albums::get_all_albums(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_artists(state: State<'_, Database>) -> Result<Vec<Artist>, String> {
    let conn = state.conn.lock().map_err(|_| "Failed to lock database".to_string())?;
    repositories::artists::get_all_artists(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_library_stats(state: State<'_, Database>) -> Result<LibraryStats, String> {
    let conn = state.conn.lock().map_err(|_| "Failed to lock database".to_string())?;
    repositories::stats::get_library_stats(&conn).map_err(|e| e.to_string())
}
