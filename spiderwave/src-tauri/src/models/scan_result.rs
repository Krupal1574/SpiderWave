use serde::{Deserialize, Serialize};

/// Returned by every scan_directory call.
/// Aggregated by rescan_all_folders across multiple folders.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ScanResult {
    /// Total audio files examined (including skipped unchanged files).
    pub scanned: u32,
    /// Files successfully inserted or updated in the database.
    pub imported: u32,
    /// Files that failed to parse or caused errors.
    pub failed: u32,
    /// Files skipped because mtime + size unchanged since last scan.
    pub skipped: u32,
}

impl ScanResult {
    pub fn merge(&mut self, other: &ScanResult) {
        self.scanned  += other.scanned;
        self.imported += other.imported;
        self.failed   += other.failed;
        self.skipped  += other.skipped;
    }
}
