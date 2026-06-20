use rusqlite::{Connection, Result};
use crate::models::album::Album;

pub fn insert_or_get_album(conn: &Connection, title: &str, artist_id: i64) -> Result<i64> {
    conn.execute(
        "INSERT OR IGNORE INTO albums (title, artist_id) VALUES (?1, ?2)",
        rusqlite::params![title, artist_id],
    )?;
    
    let mut stmt = conn.prepare("SELECT id FROM albums WHERE title = ?1 AND artist_id = ?2")?;
    let id: i64 = stmt.query_row(rusqlite::params![title, artist_id], |row| row.get(0))?;
    Ok(id)
}

pub fn get_all_albums(conn: &Connection) -> Result<Vec<Album>> {
    let mut stmt = conn.prepare("
        SELECT al.id, al.title, ar.name, al.year, al.artwork_path 
        FROM albums al 
        LEFT JOIN artists ar ON al.artist_id = ar.id 
        ORDER BY al.title COLLATE NOCASE
    ")?;
    
    let album_iter = stmt.query_map([], |row| {
        Ok(Album {
            id: row.get::<_, i64>(0)?.to_string(),
            title: row.get(1)?,
            artist: row.get::<_, Option<String>>(2)?.unwrap_or_else(|| "Unknown Artist".to_string()),
            year: row.get(3)?,
            artwork_path: row.get(4)?,
        })
    })?;

    let mut albums = Vec::new();
    for album in album_iter {
        albums.push(album?);
    }
    Ok(albums)
}
