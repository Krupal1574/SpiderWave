use rusqlite::Connection;
use tauri::AppHandle;
use tauri::Manager;
use std::sync::Mutex;
use std::fs;
use std::path::PathBuf;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new(app_handle: &AppHandle) -> Result<Self, Box<dyn std::error::Error>> {
        let app_data_dir = app_handle.path().app_data_dir().expect("Failed to get app data dir");
        
        if !app_data_dir.exists() {
            fs::create_dir_all(&app_data_dir)?;
        }

        let db_path = app_data_dir.join("spiderwave.db");
        let conn = Connection::open(db_path)?;
        
        // Optimize SQLite performance
        conn.execute_batch(
            "PRAGMA journal_mode = WAL;
             PRAGMA synchronous = NORMAL;
             PRAGMA foreign_keys = ON;"
        )?;

        // Run migrations
        crate::db::migrations::run_migrations(&conn)?;

        Ok(Database {
            conn: Mutex::new(conn)
        })
    }
}
