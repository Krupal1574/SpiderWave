use tauri::State;
use crate::db::database::Database;
use crate::db::repositories::queue::{save_queue_state as db_save, load_queue_state as db_load, QueueStatePayload};

#[tauri::command]
pub async fn save_queue_state(
    state: State<'_, Database>, 
    items: Vec<(String, i64)>, 
    active_id: Option<String>, 
    shuffle: bool, 
    repeat: String,
    volume: f64
) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();
    db_save(&conn, items, active_id, shuffle, &repeat, volume).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn load_queue_state(state: State<'_, Database>) -> Result<QueueStatePayload, String> {
    let conn = state.conn.lock().unwrap();
    db_load(&conn).map_err(|e| e.to_string())
}
