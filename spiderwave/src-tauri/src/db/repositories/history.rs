use rusqlite::{Connection, Result};
use crate::models::track::Track;

pub fn add_to_history(conn: &Connection, track_id: i64) -> Result<()> {
    conn.execute(
        "INSERT INTO recent_activity (track_id) VALUES (?1)",
        rusqlite::params![track_id],
    )?;
    Ok(())
}

pub fn get_recent_history(conn: &Connection) -> Result<Vec<Track>> {
    let mut stmt = conn.prepare("
        SELECT t.id, t.title, ar.name, al.title, t.duration, t.track_number, t.path, t.artist_id, t.album_id
        FROM recent_activity ra
        JOIN tracks t ON ra.track_id = t.id
        LEFT JOIN artists ar ON t.artist_id = ar.id
        LEFT JOIN albums al ON t.album_id = al.id
        ORDER BY ra.played_at DESC
        LIMIT 20
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
