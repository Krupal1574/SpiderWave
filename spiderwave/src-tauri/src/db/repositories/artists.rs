use rusqlite::{Connection, Result};
use crate::models::artist::Artist;

pub fn insert_or_get_artist(conn: &Connection, name: &str) -> Result<i64> {
    conn.execute(
        "INSERT OR IGNORE INTO artists (name) VALUES (?1)",
        [name],
    )?;
    
    let mut stmt = conn.prepare("SELECT id FROM artists WHERE name = ?1")?;
    let id: i64 = stmt.query_row([name], |row| row.get(0))?;
    Ok(id)
}

pub fn get_all_artists(conn: &Connection) -> Result<Vec<Artist>> {
    let mut stmt = conn.prepare("SELECT id, name FROM artists ORDER BY name COLLATE NOCASE")?;
    let artist_iter = stmt.query_map([], |row| {
        Ok(Artist {
            id: row.get::<_, i64>(0)?.to_string(),
            name: row.get(1)?,
        })
    })?;

    let mut artists = Vec::new();
    for artist in artist_iter {
        artists.push(artist?);
    }
    Ok(artists)
}
