use std::sync::mpsc::Receiver;
use std::time::{Duration, Instant};
use std::fs::File;

use rodio::{Decoder, Player, DeviceSinkBuilder};
use tauri::{AppHandle, Emitter};

use crate::audio::state::AudioCommand;

#[derive(Clone, serde::Serialize)]
pub struct PositionPayload {
    pub position: u64,
}

#[derive(Clone, serde::Serialize)]
struct TrackPayload {
    request_id: String,
}

#[derive(Clone, serde::Serialize)]
#[allow(non_snake_case)]
struct SeekFailedPayload {
    trackId: String,
    reason: String,
}

#[derive(Clone, serde::Serialize)]
pub struct SeekPayload {
    pub request_id: String,
    pub position: u64,
}

pub fn start_audio_thread(rx: Receiver<AudioCommand>, app_handle: AppHandle) {
    std::thread::spawn(move || {
        let stream_handle = match DeviceSinkBuilder::open_default_sink() {
            Ok(res) => res,
            Err(e) => {
                eprintln!("Failed to initialize audio device: {}", e);
                return;
            }
        };
        
        let mut player = Player::connect_new(&stream_handle.mixer());
        
        let mut is_playing = false;
        let mut start_time: Option<Instant> = None;
        let mut accumulated_time = Duration::from_secs(0);
        let mut current_request_id: Option<String> = None;
        let mut supports_seek: Option<bool> = None;

        loop {
            match rx.recv_timeout(Duration::from_millis(500)) {
                Ok(command) => {
                    match command {
                        AudioCommand::Play(request_id, path) => {
                            let file = match File::open(&path) {
                                Ok(f) => f,
                                Err(e) => {
                                    eprintln!("Failed to open audio file {}: {}", path, e);
                                    let _ = app_handle.emit("playback-failed", TrackPayload {
                                        request_id: request_id.clone()
                                    });
                                    continue;
                                }
                            };
                            
                            let len = file.metadata().map(|m| m.len()).unwrap_or(0);
                            let source = match Decoder::builder().with_data(file).with_byte_len(len).with_seekable(true).with_gapless(true).build() {
                                Ok(s) => s,
                                Err(e) => {
                                    eprintln!("Failed to decode audio file {}: {}", path, e);
                                    let _ = app_handle.emit("playback-failed", TrackPayload {
                                        request_id: request_id.clone()
                                    });
                                    continue;
                                }
                            };
                            
                            // Stop current sink and recreate to ensure a clean queue
                            player.stop();
                            player = Player::connect_new(&stream_handle.mixer());
                            
                            player.append(source);
                            player.play();
                            
                            is_playing = true;
                            start_time = Some(Instant::now());
                            accumulated_time = Duration::from_secs(0);
                            current_request_id = Some(request_id.clone());
                            supports_seek = None;
                            
                            let _ = app_handle.emit("playback-started", TrackPayload { request_id });
                        }
                        AudioCommand::Pause => {
                            if is_playing {
                                player.pause();
                                is_playing = false;
                                if let Some(t) = start_time {
                                    accumulated_time += t.elapsed();
                                }
                                start_time = None;
                                let _ = app_handle.emit("playback-paused", ());
                            }
                        }
                        AudioCommand::Resume => {
                            if !is_playing && !player.empty() {
                                player.play();
                                is_playing = true;
                                start_time = Some(Instant::now());
                                let _ = app_handle.emit("playback-resumed", ());
                            }
                        }
                        AudioCommand::Stop => {
                            player.stop();
                            player = Player::connect_new(&stream_handle.mixer());
                            is_playing = false;
                            accumulated_time = Duration::from_secs(0);
                            start_time = None;
                            let _ = app_handle.emit("playback-stopped", ());
                        }
                        AudioCommand::SetVolume(vol) => {
                            player.set_volume(vol);
                        }
                        AudioCommand::Seek(request_id, pos) => {
                            if current_request_id.as_deref() != Some(&request_id) {
                                eprintln!("Seek rejected: request_id mismatch (expected {:?}, got {})", current_request_id, request_id);
                                let _ = app_handle.emit("seek-acknowledged", SeekPayload {
                                    request_id: request_id.clone(),
                                    position: accumulated_time.as_secs(),
                                });
                                continue;
                            }

                            if is_playing || !player.empty() {
                                if supports_seek == Some(false) {
                                    let _ = app_handle.emit("seek-acknowledged", SeekPayload {
                                        request_id: request_id.clone(),
                                        position: accumulated_time.as_secs(),
                                    });
                                    continue;
                                }

                                let dur = Duration::from_secs(pos);
                                if let Err(err) = player.try_seek(dur) {
                                    println!("Track marked unseekable:\n{}\n{:?}", request_id, err);
                                    supports_seek = Some(false);
                                    let _ = app_handle.emit("seek-failed", SeekFailedPayload {
                                        trackId: request_id.clone(),
                                        reason: "unseekable".to_string(),
                                    });
                                } else {
                                    accumulated_time = dur;
                                    if is_playing {
                                        start_time = Some(Instant::now());
                                    } else {
                                        start_time = None;
                                    }
                                }
                                
                                // Always emit seek-acknowledged to prevent frontend freeze
                                let _ = app_handle.emit("seek-acknowledged", SeekPayload {
                                    request_id,
                                    position: accumulated_time.as_secs(),
                                });
                            }
                        }
                    }
                }
                Err(std::sync::mpsc::RecvTimeoutError::Timeout) => {
                    // Do nothing, proceed to emit position
                }
                Err(std::sync::mpsc::RecvTimeoutError::Disconnected) => {
                    // Channel closed, terminate thread
                    break;
                }
            }

            // Check if track ended naturally
            if is_playing && player.empty() {
                is_playing = false;
                if let Some(t) = start_time {
                    accumulated_time += t.elapsed();
                }
                start_time = None;
                if let Some(req_id) = &current_request_id {
                    let _ = app_handle.emit("playback-ended", TrackPayload { request_id: req_id.clone() });
                } else {
                    let _ = app_handle.emit("playback-ended", ());
                }
            }

            // Emit playback position
            if is_playing {
                let mut current_pos = accumulated_time;
                if let Some(t) = start_time {
                    current_pos += t.elapsed();
                }
                let _ = app_handle.emit("playback-position", PositionPayload {
                    position: current_pos.as_secs(),
                });
            }
        }
    });
}
