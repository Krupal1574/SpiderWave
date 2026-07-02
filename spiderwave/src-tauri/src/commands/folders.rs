use tauri::State;
use crate::db::database::Database;
use crate::db::repositories::folders::{
    add_library_folder as db_add, 
    remove_library_folder as db_remove, 
    get_library_folders as db_get,
    LibraryFolder
};

#[tauri::command]
pub async fn add_library_folder(state: State<'_, Database>, path: String) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();
    db_add(&conn, &path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn remove_library_folder(state: State<'_, Database>, path: String) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();
    db_remove(&conn, &path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_library_folders(state: State<'_, Database>) -> Result<Vec<LibraryFolder>, String> {
    let conn = state.conn.lock().unwrap();
    db_get(&conn).map_err(|e| e.to_string())
}
