use tauri::State;
use crate::models::track::Track;
use crate::models::album::Album;
use crate::models::artist::Artist;
use crate::models::stats::LibraryStats;
use crate::models::scan_result::ScanResult;
use crate::scanner::music_scanner::scan_directory;
use crate::db::database::Database;
use crate::db::repositories;
use crate::db::repositories::scan_failures::ScanFailure;

#[tauri::command]
pub async fn scan_music_library(state: State<'_, Database>, folder_path: String) -> Result<ScanResult, String> {
    let conn = state.conn.lock().map_err(|_| "Failed to lock database".to_string())?;
    scan_directory(&conn, &folder_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn rescan_all_folders(state: State<'_, Database>) -> Result<ScanResult, String> {
    let folders = {
        let conn = state.conn.lock().map_err(|_| "Failed to lock database".to_string())?;
        repositories::folders::get_library_folders(&conn).map_err(|e| e.to_string())?
    };

    let mut aggregate = ScanResult::default();
    for folder in &folders {
        let conn = state.conn.lock().map_err(|_| "Failed to lock database".to_string())?;
        match scan_directory(&conn, &folder.path) {
            Ok(result) => aggregate.merge(&result),
            Err(e) => eprintln!("[RESCAN] folder={} error={}", folder.path, e),
        }
    }
    Ok(aggregate)
}

#[tauri::command]
pub async fn get_scan_failures(state: State<'_, Database>) -> Result<Vec<ScanFailure>, String> {
    let conn = state.conn.lock().map_err(|_| "Failed to lock database".to_string())?;
    repositories::scan_failures::get_scan_failures(&conn).map_err(|e| e.to_string())
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

#[tauri::command]
pub async fn add_to_history(state: State<'_, Database>, track_id: i64) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|_| "Failed to lock database".to_string())?;
    repositories::history::add_to_history(&conn, track_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_recent_history(state: State<'_, Database>) -> Result<Vec<Track>, String> {
    let conn = state.conn.lock().map_err(|_| "Failed to lock database".to_string())?;
    repositories::history::get_recent_history(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_library(state: State<'_, Database>, query: String) -> Result<repositories::search::SearchResults, String> {
    let conn = state.conn.lock().map_err(|_| "Failed to lock database".to_string())?;
    repositories::search::search_library(&conn, &query).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_database_path(app_handle: tauri::AppHandle) -> Result<String, String> {
    use tauri::Manager;
    let app_dir = app_handle.path().app_data_dir().map_err(|_| "Could not determine app data dir".to_string())?;
    let db_path = app_dir.join("spiderwave.db");
    Ok(db_path.to_string_lossy().to_string())
}
