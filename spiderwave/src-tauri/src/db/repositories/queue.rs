use rusqlite::{Connection, Result, params};
use crate::models::track::Track;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueueItemPayload {
    pub id: String,
    pub track: Track,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueueStatePayload {
    pub queue: Vec<QueueItemPayload>,
    pub active_queue_item_id: Option<String>,
    pub shuffle: bool,
    pub repeat: String,
    pub volume: f64,
}

pub fn save_queue_state(conn: &Connection, items: Vec<(String, i64)>, active_id: Option<String>, shuffle: bool, repeat: &str, volume: f64) -> Result<()> {
    // Save settings
    if let Some(id) = active_id {
        conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)", params!["active_queue_item_id", id])?;
    } else {
        conn.execute("DELETE FROM settings WHERE key = 'active_queue_item_id'", [])?;
    }
    conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)", params!["shuffle", if shuffle { "true" } else { "false" }])?;
    conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)", params!["repeat", repeat])?;
    conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)", params!["volume", volume.to_string()])?;

    // Drop and recreate playback_queue to easily enforce schema changes during dev
    conn.execute("DROP TABLE IF EXISTS playback_queue", [])?;
    conn.execute("
        CREATE TABLE playback_queue (
            id TEXT PRIMARY KEY,
            position INTEGER NOT NULL,
            track_id INTEGER NOT NULL,
            FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
        );
    ", [])?;

    // Insert new queue
    let mut stmt = conn.prepare("INSERT INTO playback_queue (id, position, track_id) VALUES (?1, ?2, ?3)")?;
    for (pos, (item_id, track_id)) in items.iter().enumerate() {
        stmt.execute(params![item_id, pos as i64, track_id])?;
    }

    Ok(())
}

pub fn load_queue_state(conn: &Connection) -> Result<QueueStatePayload> {
    // Load settings
    let active_queue_item_id: Option<String> = conn.query_row("SELECT value FROM settings WHERE key = 'active_queue_item_id'", [], |row| row.get(0)).ok();
    let shuffle: bool = conn.query_row("SELECT value FROM settings WHERE key = 'shuffle'", [], |row| row.get::<_, String>(0))
        .unwrap_or_else(|_| "false".to_string()) == "true";
        
    let repeat: String = conn.query_row("SELECT value FROM settings WHERE key = 'repeat'", [], |row| row.get(0))
        .unwrap_or_else(|_| "off".to_string());
        
    let volume: f64 = conn.query_row("SELECT value FROM settings WHERE key = 'volume'", [], |row| row.get::<_, String>(0))
        .unwrap_or_else(|_| "1.0".to_string())
        .parse()
        .unwrap_or(1.0);

    // Load queue tracks
    let mut stmt = conn.prepare("
        SELECT q.id, t.id, t.title, ar.name, al.title, t.duration, t.track_number, t.path, t.artist_id, t.album_id
        FROM playback_queue q
        JOIN tracks t ON q.track_id = t.id
        LEFT JOIN artists ar ON t.artist_id = ar.id
        LEFT JOIN albums al ON t.album_id = al.id
        ORDER BY q.position ASC
    ")?;
    
    let track_iter = stmt.query_map([], |row| {
        Ok(QueueItemPayload {
            id: row.get(0)?,
            track: Track {
                id: row.get::<_, i64>(1)?.to_string(),
                title: row.get(2)?,
                artist: row.get::<_, Option<String>>(3)?.unwrap_or_else(|| "Unknown Artist".to_string()),
                album: row.get::<_, Option<String>>(4)?.unwrap_or_else(|| "Unknown Album".to_string()),
                duration: row.get::<_, i64>(5).unwrap_or(0) as u64,
                track_number: row.get(6)?,
                path: row.get(7)?,
                artist_id: row.get::<_, Option<i64>>(8)?.map(|id| id.to_string()),
                album_id: row.get::<_, Option<i64>>(9)?.map(|id| id.to_string()),
            }
        })
    })?;
    
    let mut queue = Vec::new();
    for t in track_iter {
        if let Ok(item) = t {
            queue.push(item);
        }
    }

    Ok(QueueStatePayload {
        queue,
        active_queue_item_id,
        shuffle,
        repeat,
        volume,
    })
}
