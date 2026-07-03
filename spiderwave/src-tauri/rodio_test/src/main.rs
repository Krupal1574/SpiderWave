use std::fs::File;
use std::time::{Duration, Instant};
use rodio::{Decoder, Player, DeviceSinkBuilder};

fn test_file(path: &str, name: &str) {
    println!("--- Testing {} ({}) ---", name, path);
    let file = match File::open(path) {
        Ok(f) => f,
        Err(e) => {
            println!("Failed to open file: {}", e);
            return;
        }
    };
    let len = file.metadata().unwrap().len();
    
    let decoder = match Decoder::builder()
        .with_data(file)
        .with_byte_len(len)
        .with_seekable(true)
        .with_gapless(true)
        .build() 
    {
        Ok(d) => d,
        Err(e) => {
            println!("Failed to decode: {}", e);
            return;
        }
    };
    
    let handle = DeviceSinkBuilder::open_default_sink().unwrap();
    let player = Player::connect_new(&handle.mixer());
    
    player.append(decoder);
    
    let start = Instant::now();
    match player.try_seek(Duration::from_secs(30)) {
        Ok(_) => println!("try_seek(30s) SUCCESS in {:?}", start.elapsed()),
        Err(e) => println!("try_seek(30s) FAILED in {:?}: {:?}", start.elapsed(), e),
    }
    
    player.play();
    std::thread::sleep(Duration::from_millis(100));
    player.stop();
}

fn main() {
    test_file(r"C:\Users\Krupa\Music\HIGH QUALITY\2306120355.flac", "FLAC 1");
    test_file(r"C:\Users\Krupa\Music\HIGH QUALITY\Shaan - O Re Kanchi.flac", "FLAC 2");
}
