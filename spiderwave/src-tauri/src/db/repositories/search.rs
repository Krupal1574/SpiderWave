use rusqlite::{Connection, Result};
use crate::models::track::Track;
use crate::models::album::Album;
use crate::models::artist::Artist;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResults {
    pub tracks: Vec<Track>,
    pub albums: Vec<Album>,
    pub artists: Vec<Artist>,
}

pub fn search_library(conn: &Connection, query: &str) -> Result<SearchResults> {
    let pattern = format!("%{}%", query);
    
    // Search Tracks
    let mut stmt = conn.prepare("
        SELECT t.id, t.title, ar.name, al.title, t.duration, t.track_number, t.path, t.artist_id, t.album_id
        FROM tracks t
        LEFT JOIN artists ar ON t.artist_id = ar.id
        LEFT JOIN albums al ON t.album_id = al.id
        WHERE t.title LIKE ?1
        ORDER BY t.title COLLATE NOCASE
        LIMIT 25
    ")?;
    
    let track_iter = stmt.query_map([&pattern], |row| {
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
    for t in track_iter { tracks.push(t?); }

    // Search Albums
    let mut stmt = conn.prepare("
        SELECT al.id, al.title, al.artist_id, ar.name, al.year, al.artwork_path, 
               (SELECT COUNT(*) FROM tracks WHERE album_id = al.id) as track_count
        FROM albums al
        LEFT JOIN artists ar ON al.artist_id = ar.id
        WHERE al.title LIKE ?1
        ORDER BY al.title COLLATE NOCASE
        LIMIT 12
    ")?;
    
    let album_iter = stmt.query_map([&pattern], |row| {
        Ok(Album {
            id: row.get::<_, i64>(0)?.to_string(),
            title: row.get(1)?,
            artist_id: row.get::<_, Option<i64>>(2)?.map(|id| id.to_string()),
            artist_name: row.get::<_, Option<String>>(3)?.unwrap_or_else(|| "Unknown Artist".to_string()),
            year: row.get(4)?,
            artwork_path: row.get(5)?,
            track_count: row.get::<_, i64>(6).unwrap_or(0) as u32,
        })
    })?;
    let mut albums = Vec::new();
    for a in album_iter { albums.push(a?); }

    // Search Artists
    let mut stmt = conn.prepare("
        SELECT id, name
        FROM artists
        WHERE name LIKE ?1
        ORDER BY name COLLATE NOCASE
        LIMIT 8
    ")?;
    
    let artist_iter = stmt.query_map([&pattern], |row| {
        Ok(Artist {
            id: row.get::<_, i64>(0)?.to_string(),
            name: row.get(1)?,
        })
    })?;
    let mut artists = Vec::new();
    for a in artist_iter { artists.push(a?); }

    Ok(SearchResults { tracks, albums, artists })
}
