use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanFailure {
    pub id: i64,
    pub path: String,
    pub format: Option<String>,
    pub error: String,
    pub scanned_at: i64,
}

/// Record one file that could not be imported.
/// Clears any previous failure entry for the same path so retries are clean.
pub fn record_scan_failure(
    conn: &Connection,
    path: &str,
    format: Option<&str>,
    error: &str,
) -> Result<()> {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;

    conn.execute(
        "INSERT INTO scan_failures (path, format, error, scanned_at)
         VALUES (?1, ?2, ?3, ?4)
         ON CONFLICT DO NOTHING",
        params![path, format, error, now],
    )?;
    Ok(())
}

/// Remove all previous failures for paths under a given folder prefix.
/// Called at the start of each folder scan so fixed files don't linger.
pub fn clear_failures_for_folder(conn: &Connection, folder_path: &str) -> Result<()> {
    let prefix = format!("{}%", folder_path);
    conn.execute(
        "DELETE FROM scan_failures WHERE path LIKE ?1",
        params![prefix],
    )?;
    Ok(())
}

/// Retrieve all recorded scan failures (for diagnostics / future UI).
pub fn get_scan_failures(conn: &Connection) -> Result<Vec<ScanFailure>> {
    let mut stmt = conn.prepare(
        "SELECT id, path, format, error, scanned_at FROM scan_failures ORDER BY scanned_at DESC"
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(ScanFailure {
            id: row.get(0)?,
            path: row.get(1)?,
            format: row.get(2)?,
            error: row.get(3)?,
            scanned_at: row.get(4)?,
        })
    })?;

    let mut failures = Vec::new();
    for row in rows {
        failures.push(row?);
    }
    Ok(failures)
}
