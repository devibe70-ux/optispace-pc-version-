#[tauri::command]
async fn scan_directory(dir: String) -> Result<Vec<core::scanner::FileInfo>, String> {
    core::scanner::scan_directory(std::path::Path::new(&dir))
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn clean_temp_folders() -> Result<core::cleaner::CleanResult, String> {
    Ok(core::cleaner::clean_temp_folders())
}

#[tauri::command]
async fn find_similar_images(dir: String, tolerance: u32) -> Result<Vec<core::fuzzy_matcher::FuzzyMatchGroup>, String> {
    core::fuzzy_matcher::find_similar_images(std::path::Path::new(&dir), tolerance)
}

#[tauri::command]
async fn compress_video(input_path: String, output_dir: String) -> Result<core::video_compressor::CompressionResult, String> {
    core::video_compressor::compress_video(
        std::path::Path::new(&input_path), 
        std::path::Path::new(&output_dir)
    )
}

#[tauri::command]
async fn get_state() -> Result<optispace_core::state::AppState, String> {
    Ok(optispace_core::state::read_state())
}

#[tauri::command]
async fn increment_cleanup() -> Result<optispace_core::state::AppState, String> {
    optispace_core::state::increment_cleanup()
}

#[tauri::command]
async fn use_pro_trial() -> Result<optispace_core::state::AppState, String> {
    optispace_core::state::use_pro_trial()
}

#[tauri::command]
async fn apply_license(key: String) -> Result<optispace_core::state::AppState, String> {
    optispace_core::state::apply_license(key)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::default().build())
    .invoke_handler(tauri::generate_handler![
        scan_directory, 
        clean_temp_folders, 
        find_similar_images, 
        compress_video,
        get_state,
        increment_cleanup,
        use_pro_trial,
        apply_license
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
