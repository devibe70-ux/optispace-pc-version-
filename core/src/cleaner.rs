use std::path::PathBuf;
use std::fs;
use std::env;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct CleanResult {
    pub files_deleted: u64,
    pub bytes_freed: u64,
    pub errors: u64,
}

pub fn get_temp_folders() -> Vec<PathBuf> {
    let mut folders = Vec::new();
    
    // Windows Global Temp
    folders.push(PathBuf::from(r"C:\Windows\Temp"));
    
    // User Local Temp (%LOCALAPPDATA%\Temp)
    if let Some(local_app_data) = env::var_os("LOCALAPPDATA") {
        let mut path = PathBuf::from(local_app_data);
        path.push("Temp");
        folders.push(path);
    }
    
    folders
}

pub fn clean_temp_folders() -> CleanResult {
    let mut result = CleanResult {
        files_deleted: 0,
        bytes_freed: 0,
        errors: 0,
    };

    let folders = get_temp_folders();
    for folder in folders {
        if folder.exists() && folder.is_dir() {
            if let Ok(entries) = fs::read_dir(folder) {
                for entry in entries.filter_map(Result::ok) {
                    let path = entry.path();
                    let size = entry.metadata().map(|m| m.len()).unwrap_or(0);
                    
                    if path.is_dir() {
                        if fs::remove_dir_all(&path).is_ok() {
                            result.files_deleted += 1;
                            result.bytes_freed += size; // Size of dir metadata is small, real size requires walkdir
                        } else {
                            result.errors += 1;
                        }
                    } else {
                        if fs::remove_file(&path).is_ok() {
                            result.files_deleted += 1;
                            result.bytes_freed += size;
                        } else {
                            result.errors += 1;
                        }
                    }
                }
            }
        }
    }
    
    result
}
