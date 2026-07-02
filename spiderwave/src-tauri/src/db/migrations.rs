use rusqlite::Connection;

pub fn run_migrations(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS artists (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS albums (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            artist_id INTEGER,
            year INTEGER,
            artwork_path TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE SET NULL,
            UNIQUE(title, artist_id)
        );

        CREATE TABLE IF NOT EXISTS tracks (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            artist_id INTEGER,
            album_id INTEGER,
            path TEXT NOT NULL UNIQUE,
            duration INTEGER,
            bitrate INTEGER,
            sample_rate INTEGER,
            format TEXT,
            track_number INTEGER,
            disc_number INTEGER,
            file_size INTEGER DEFAULT 0,
            file_modified INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE SET NULL,
            FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS library_folders (
            id INTEGER PRIMARY KEY,
            path TEXT NOT NULL UNIQUE,
            last_scanned TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS playlists (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS playlist_tracks (
            playlist_id INTEGER,
            track_id INTEGER,
            position INTEGER,
            PRIMARY KEY (playlist_id, track_id),
            FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
            FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );

        CREATE TABLE IF NOT EXISTS recent_activity (
            id INTEGER PRIMARY KEY,
            track_id INTEGER,
            played_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS playback_queue (
            id INTEGER PRIMARY KEY,
            position INTEGER NOT NULL,
            track_id INTEGER NOT NULL,
            FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_tracks_artist_id ON tracks(artist_id);
        CREATE INDEX IF NOT EXISTS idx_tracks_album_id ON tracks(album_id);
        CREATE INDEX IF NOT EXISTS idx_tracks_path ON tracks(path);
        CREATE INDEX IF NOT EXISTS idx_playback_queue_position ON playback_queue(position);
        "
    )?;

    // V2 migration: add file-change detection columns to databases created before this version.
    // PRAGMA table_info guard makes this safe to run on every startup.
    let has_file_size: bool = conn.query_row(
        "SELECT COUNT(*) FROM pragma_table_info('tracks') WHERE name='file_size'",
        [],
        |row| row.get::<_, i64>(0),
    ).unwrap_or(0) > 0;

    if !has_file_size {
        conn.execute("ALTER TABLE tracks ADD COLUMN file_size INTEGER DEFAULT 0", [])?;
        conn.execute("ALTER TABLE tracks ADD COLUMN file_modified INTEGER DEFAULT 0", [])?;
    }

    // V3 migration: scan failure tracking table.
    let has_scan_failures: bool = conn.query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='scan_failures'",
        [],
        |row| row.get::<_, i64>(0),
    ).unwrap_or(0) > 0;

    if !has_scan_failures {
        conn.execute_batch(
            "CREATE TABLE scan_failures (
                id          INTEGER PRIMARY KEY,
                path        TEXT NOT NULL,
                format      TEXT,
                error       TEXT NOT NULL,
                scanned_at  INTEGER NOT NULL
            );
            CREATE INDEX idx_scan_failures_path ON scan_failures(path);"
        )?;
    }

    Ok(())
}
