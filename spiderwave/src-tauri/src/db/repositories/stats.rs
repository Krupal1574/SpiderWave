use rusqlite::{Connection, Result};
use crate::models::stats::LibraryStats;

pub fn get_library_stats(conn: &Connection) -> Result<LibraryStats> {
    let total_tracks: u32 = conn.query_row("SELECT COUNT(*) FROM tracks", [], |row| row.get(0)).unwrap_or(0);
    let total_albums: u32 = conn.query_row("SELECT COUNT(*) FROM albums", [], |row| row.get(0)).unwrap_or(0);
    let total_artists: u32 = conn.query_row("SELECT COUNT(*) FROM artists", [], |row| row.get(0)).unwrap_or(0);
    
    let last_scan_at: Option<String> = conn.query_row(
        "SELECT value FROM settings WHERE key = 'last_scan_at'",
        [],
        |row| row.get(0)
    ).ok();

    Ok(LibraryStats {
        total_tracks,
        total_albums,
        total_artists,
        last_scan_at,
    })
}

pub fn update_last_scan(conn: &Connection, timestamp: &str) -> Result<()> {
    conn.execute(
        "INSERT INTO settings (key, value) VALUES ('last_scan_at', ?1)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        [timestamp],
    )?;
    Ok(())
}
