use tauri::State;
use crate::audio::state::{AudioCommand, AudioState};

#[tauri::command]
pub fn play_track(request_id: String, path: String, state: State<'_, AudioState>) -> Result<(), String> {
    let tx = state.tx.lock().map_err(|e| e.to_string())?;
    tx.send(AudioCommand::Play(request_id, path)).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn pause_playback(state: State<'_, AudioState>) -> Result<(), String> {
    let tx = state.tx.lock().map_err(|e| e.to_string())?;
    tx.send(AudioCommand::Pause).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn resume_playback(state: State<'_, AudioState>) -> Result<(), String> {
    let tx = state.tx.lock().map_err(|e| e.to_string())?;
    tx.send(AudioCommand::Resume).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn stop_playback(state: State<'_, AudioState>) -> Result<(), String> {
    let tx = state.tx.lock().map_err(|e| e.to_string())?;
    tx.send(AudioCommand::Stop).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn set_volume(volume: f32, state: State<'_, AudioState>) -> Result<(), String> {
    let tx = state.tx.lock().map_err(|e| e.to_string())?;
    tx.send(AudioCommand::SetVolume(volume)).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn seek_to(request_id: String, position: u64, state: State<'_, AudioState>) -> Result<(), String> {
    let tx = state.tx.lock().map_err(|e| e.to_string())?;
    tx.send(AudioCommand::Seek(request_id, position)).map_err(|e| e.to_string())?;
    Ok(())
}
