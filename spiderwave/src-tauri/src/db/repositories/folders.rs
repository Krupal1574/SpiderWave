use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct LibraryFolder {
    pub id: i64,
    pub path: String,
    pub last_scanned: String,
}

pub fn add_library_folder(conn: &Connection, path: &str) -> Result<()> {
    conn.execute(
        "INSERT OR IGNORE INTO library_folders (path) VALUES (?1)",
        params![path],
    )?;
    Ok(())
}

pub fn remove_library_folder(conn: &Connection, path: &str) -> Result<()> {
    conn.execute(
        "DELETE FROM library_folders WHERE path = ?1",
        params![path],
    )?;
    
    // Cleanup tracks that start with this path
    let path_pattern = format!("{}%", path);
    conn.execute(
        "DELETE FROM tracks WHERE path LIKE ?1",
        params![path_pattern],
    )?;
    
    Ok(())
}

pub fn get_library_folders(conn: &Connection) -> Result<Vec<LibraryFolder>> {
    let mut stmt = conn.prepare("SELECT id, path, last_scanned FROM library_folders ORDER BY id ASC")?;
    
    let folder_iter = stmt.query_map([], |row| {
        Ok(LibraryFolder {
            id: row.get(0)?,
            path: row.get(1)?,
            last_scanned: row.get::<_, Option<String>>(2)?.unwrap_or_else(|| "".to_string()),
        })
    })?;
    
    let mut folders = Vec::new();
    for f in folder_iter {
        folders.push(f?);
    }
    
    Ok(folders)
}
