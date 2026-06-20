use rusqlite::{Connection, Result};
use crate::models::track::Track;

pub fn insert_track(
    conn: &Connection,
    title: &str,
    artist_id: i64,
    album_id: i64,
    path: &str,
    duration: u64,
    track_number: Option<u32>,
) -> Result<i64> {
    conn.execute(
        "INSERT INTO tracks (title, artist_id, album_id, path, duration, track_number) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)
         ON CONFLICT(path) DO UPDATE SET 
            title=excluded.title,
            artist_id=excluded.artist_id,
            album_id=excluded.album_id,
            duration=excluded.duration,
            track_number=excluded.track_number",
        rusqlite::params![title, artist_id, album_id, path, duration, track_number],
    )?;
    
    let mut stmt = conn.prepare("SELECT id FROM tracks WHERE path = ?1")?;
    let id: i64 = stmt.query_row([path], |row| row.get(0))?;
    Ok(id)
}

pub fn get_all_tracks(conn: &Connection) -> Result<Vec<Track>> {
    let mut stmt = conn.prepare("
        SELECT t.id, t.title, ar.name, al.title, t.duration, t.track_number, t.path
        FROM tracks t
        LEFT JOIN artists ar ON t.artist_id = ar.id
        LEFT JOIN albums al ON t.album_id = al.id
        ORDER BY t.title COLLATE NOCASE
    ")?;
    
    let track_iter = stmt.query_map([], |row| {
        Ok(Track {
            id: row.get::<_, i64>(0)?.to_string(),
            title: row.get(1)?,
            artist: row.get::<_, Option<String>>(2)?.unwrap_or_else(|| "Unknown Artist".to_string()),
            album: row.get::<_, Option<String>>(3)?.unwrap_or_else(|| "Unknown Album".to_string()),
            duration: row.get::<_, i64>(4).unwrap_or(0) as u64,
            track_number: row.get(5)?,
            path: row.get(6)?,
        })
    })?;

    let mut tracks = Vec::new();
    for track in track_iter {
        tracks.push(track?);
    }
    Ok(tracks)
}
