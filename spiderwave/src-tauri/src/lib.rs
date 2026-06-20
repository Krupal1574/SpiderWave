pub mod models;
pub mod scanner;
pub mod commands;
pub mod db;

pub mod audio;

use db::database::Database;
use tauri::Manager;
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
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::library::scan_music_library,
            commands::library::get_tracks,
            commands::library::get_albums,
            commands::library::get_artists,
            commands::library::get_library_stats,
            audio::commands::play_track,
            audio::commands::pause_playback,
            audio::commands::resume_playback,
            audio::commands::stop_playback,
            audio::commands::set_volume,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
