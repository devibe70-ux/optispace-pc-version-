use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppState {
    pub cleanup_count: u32,
    pub used_pro_trial: bool,
    pub license_key: Option<String>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            cleanup_count: 0,
            used_pro_trial: false,
            license_key: None,
        }
    }
}

fn get_state_path() -> PathBuf {
    std::env::temp_dir().join("optispace_ai_state.json")
}

pub fn read_state() -> AppState {
    let path = get_state_path();
    if let Ok(content) = fs::read_to_string(path) {
        if let Ok(state) = serde_json::from_str(&content) {
            return state;
        }
    }
    AppState::default()
}

pub fn save_state(state: &AppState) -> Result<(), String> {
    let path = get_state_path();
    let content = serde_json::to_string(state).map_err(|e| e.to_string())?;
    fs::write(path, content).map_err(|e| e.to_string())
}

pub fn increment_cleanup() -> Result<AppState, String> {
    let mut state = read_state();
    state.cleanup_count += 1;
    save_state(&state)?;
    Ok(state)
}

pub fn use_pro_trial() -> Result<AppState, String> {
    let mut state = read_state();
    state.used_pro_trial = true;
    save_state(&state)?;
    Ok(state)
}

pub fn apply_license(key: String) -> Result<AppState, String> {
    let mut state = read_state();
    // Dummy verification for MVP
    if key.len() > 5 {
        state.license_key = Some(key);
        save_state(&state)?;
        Ok(state)
    } else {
        Err("Invalid License Key".to_string())
    }
}
