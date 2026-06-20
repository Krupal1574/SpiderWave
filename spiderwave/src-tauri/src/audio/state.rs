use std::sync::mpsc::Sender;
use std::sync::Mutex;

pub enum AudioCommand {
    Play(String),
    Pause,
    Resume,
    Stop,
    SetVolume(f32),
}

pub struct AudioState {
    pub tx: Mutex<Sender<AudioCommand>>,
}
