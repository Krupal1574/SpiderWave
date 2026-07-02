use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Album {
    pub id: String,
    pub title: String,
    pub artist_id: Option<String>,
    pub artist_name: String,
    pub year: Option<u32>,
    pub artwork_path: Option<String>,
    pub track_count: u32,
}
