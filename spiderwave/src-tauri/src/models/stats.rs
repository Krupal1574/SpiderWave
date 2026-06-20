use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LibraryStats {
    pub total_tracks: u32,
    pub total_albums: u32,
    pub total_artists: u32,
    pub last_scan_at: Option<String>,
}
