use std::sync::mpsc::Receiver;
use std::time::{Duration, Instant};
use std::fs::File;
use std::io::BufReader;
use rodio::{Decoder, OutputStream, Sink};
use tauri::{AppHandle, Emitter};

use crate::audio::state::AudioCommand;

#[derive(Clone, serde::Serialize)]
pub struct PositionPayload {
    pub position: u64,
}

pub fn start_audio_thread(rx: Receiver<AudioCommand>, app_handle: AppHandle) {
    std::thread::spawn(move || {
        // Initialize the audio stream. We must keep `_stream` alive on this thread.
        let (_stream, stream_handle) = match OutputStream::try_default() {
            Ok(res) => res,
            Err(e) => {
                eprintln!("Failed to initialize audio device: {}", e);
                return;
            }
        };
        
        let mut sink = Sink::try_new(&stream_handle).unwrap();
        
        let mut is_playing = false;
        let mut start_time: Option<Instant> = None;
        let mut accumulated_time = Duration::from_secs(0);

        loop {
            match rx.recv_timeout(Duration::from_millis(500)) {
                Ok(command) => {
                    match command {
                        AudioCommand::Play(path) => {
                            let file = match File::open(&path) {
                                Ok(f) => f,
                                Err(e) => {
                                    eprintln!("Failed to open audio file {}: {}", path, e);
                                    continue;
                                }
                            };
                            
                            let source = match Decoder::new(BufReader::new(file)) {
                                Ok(s) => s,
                                Err(e) => {
                                    eprintln!("Failed to decode audio file {}: {}", path, e);
                                    continue;
                                }
                            };
                            
                            // Stop current sink and recreate to ensure a clean queue
                            sink.stop();
                            sink = Sink::try_new(&stream_handle).unwrap();
                            
                            sink.append(source);
                            sink.play();
                            
                            is_playing = true;
                            accumulated_time = Duration::from_secs(0);
                            start_time = Some(Instant::now());
                            
                            let _ = app_handle.emit("playback-started", ());
                        }
                        AudioCommand::Pause => {
                            if is_playing {
                                sink.pause();
                                is_playing = false;
                                if let Some(t) = start_time {
                                    accumulated_time += t.elapsed();
                                }
                                start_time = None;
                                let _ = app_handle.emit("playback-paused", ());
                            }
                        }
                        AudioCommand::Resume => {
                            if !is_playing && !sink.empty() {
                                sink.play();
                                is_playing = true;
                                start_time = Some(Instant::now());
                                let _ = app_handle.emit("playback-resumed", ());
                            }
                        }
                        AudioCommand::Stop => {
                            sink.stop();
                            sink = Sink::try_new(&stream_handle).unwrap();
                            is_playing = false;
                            accumulated_time = Duration::from_secs(0);
                            start_time = None;
                            let _ = app_handle.emit("playback-stopped", ());
                        }
                        AudioCommand::SetVolume(vol) => {
                            sink.set_volume(vol);
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
            if is_playing && sink.empty() {
                is_playing = false;
                if let Some(t) = start_time {
                    accumulated_time += t.elapsed();
                }
                start_time = None;
                let _ = app_handle.emit("playback-ended", ());
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
