pub mod models;
pub mod scanner;
pub mod commands;
pub mod db;

pub mod audio;

use db::database::Database;
use tauri::Manager;
use tauri::Emitter;
use std::sync::Mutex;
use std::sync::mpsc;
use audio::state::AudioState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let db = Database::new(app.handle()).expect("Failed to initialize database");
            app.manage(db);
            
            // Set up audio channel and background thread
            let (tx, rx) = mpsc::channel();
            app.manage(AudioState { tx: Mutex::new(tx) });
            
            audio::player::start_audio_thread(rx, app.handle().clone());

            // Startup incremental scan: runs on a background thread so it
            // does not block app launch. Emits 'library-updated' when done
            // so the frontend can refresh without polling.
            let startup_handle = app.handle().clone();
            std::thread::spawn(move || {
                // Brief delay so the UI has time to mount before we begin.
                std::thread::sleep(std::time::Duration::from_millis(800));

                let db = startup_handle.state::<Database>();

                // Fetch folders without holding the lock across scans.
                let folders = {
                    match db.conn.lock() {
                        Ok(conn) => {
                            crate::db::repositories::folders::get_library_folders(&conn)
                                .unwrap_or_default()
                        }
                        Err(_) => return,
                    }
                };

                if folders.is_empty() {
                    return;
                }

                for folder in &folders {
                    match db.conn.lock() {
                        Ok(conn) => {
                            if let Err(e) = crate::scanner::music_scanner::scan_directory(&conn, &folder.path) {
                                eprintln!("[STARTUP] Scan failed for {}: {}", folder.path, e);
                            }
                        }
                        Err(_) => eprintln!("[STARTUP] Failed to acquire DB lock for {}", folder.path),
                    }
                }

                // Notify frontend to reload the library.
                let _ = startup_handle.emit("library-updated", ());
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::library::scan_music_library,
            commands::library::rescan_all_folders,
            commands::library::get_scan_failures,
            commands::library::get_tracks,
            commands::library::get_albums,
            commands::library::get_artists,
            commands::library::get_library_stats,
            commands::library::add_to_history,
            commands::library::get_recent_history,
            commands::library::search_library,
            commands::library::get_database_path,
            commands::queue::save_queue_state,
            commands::queue::load_queue_state,
            commands::folders::add_library_folder,
            commands::folders::remove_library_folder,
            commands::folders::get_library_folders,
            audio::commands::play_track,
            audio::commands::pause_playback,
            audio::commands::resume_playback,
            audio::commands::stop_playback,
            audio::commands::set_volume,
            audio::commands::seek_to,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
