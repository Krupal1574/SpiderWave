use std::sync::mpsc::Sender;
use std::sync::Mutex;

pub enum AudioCommand {
    Play(String, String), // (request_id, path)
    Pause,
    Resume,
    Stop,
    SetVolume(f32),
    Seek(String, u64), // (request_id, position)
}

pub struct AudioState {
    pub tx: Mutex<Sender<AudioCommand>>,
}
