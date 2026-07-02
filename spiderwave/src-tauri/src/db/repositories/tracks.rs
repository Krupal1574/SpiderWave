use rusqlite::{Connection, Result, params};
use crate::models::track::Track;

/// Returns true if a track exists in the database and both its file_size
/// and file_modified timestamp match. Used to skip reprocessing unchanged files.
pub fn is_track_unchanged(conn: &Connection, path: &str, file_size: i64, file_modified: i64) -> bool {
    conn.query_row(
        "SELECT 1 FROM tracks WHERE path = ?1 AND file_size = ?2 AND file_modified = ?3",
        params![path, file_size, file_modified],
        |_| Ok(true),
    ).unwrap_or(false)
}

pub fn insert_track(
    conn: &Connection,
    title: &str,
    artist_id: i64,
    album_id: i64,
    path: &str,
    duration: u64,
    track_number: Option<u32>,
    file_size: i64,
    file_modified: i64,
) -> Result<i64> {
    conn.execute(
        "INSERT INTO tracks (title, artist_id, album_id, path, duration, track_number, file_size, file_modified)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
         ON CONFLICT(path) DO UPDATE SET
            title=excluded.title,
            artist_id=excluded.artist_id,
            album_id=excluded.album_id,
            duration=excluded.duration,
            track_number=excluded.track_number,
            file_size=excluded.file_size,
            file_modified=excluded.file_modified",
        params![title, artist_id, album_id, path, duration, track_number, file_size, file_modified],
    )?;

    let mut stmt = conn.prepare("SELECT id FROM tracks WHERE path = ?1")?;
    let id: i64 = stmt.query_row([path], |row| row.get(0))?;
    Ok(id)
}


pub fn get_all_tracks(conn: &Connection) -> Result<Vec<Track>> {
    let mut stmt = conn.prepare("
        SELECT t.id, t.title, ar.name, al.title, t.duration, t.track_number, t.path, t.artist_id, t.album_id
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
            artist_id: row.get::<_, Option<i64>>(7)?.map(|id| id.to_string()),
            album_id: row.get::<_, Option<i64>>(8)?.map(|id| id.to_string()),
        })
    })?;

    let mut tracks = Vec::new();
    for track in track_iter {
        tracks.push(track?);
    }
    Ok(tracks)
}
