use std::path::{Path, PathBuf};
use std::fs;
use sha2::{Sha256, Digest};
use std::io;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct FileInfo {
    pub path: PathBuf,
    pub size: u64,
    pub hash: Option<String>,
}

pub fn scan_directory(dir: &Path) -> Result<Vec<FileInfo>, io::Error> {
    let mut files = Vec::new();
    for entry in walkdir::WalkDir::new(dir).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            if let Ok(metadata) = entry.metadata() {
                files.push(FileInfo {
                    path: entry.path().to_path_buf(),
                    size: metadata.len(),
                    hash: None,
                });
            }
        }
    }
    Ok(files)
}

pub fn hash_file(path: &Path) -> Result<String, io::Error> {
    let mut file = fs::File::open(path)?;
    let mut hasher = Sha256::new();
    io::copy(&mut file, &mut hasher)?;
    let hash_bytes = hasher.finalize();
    Ok(hex::encode(hash_bytes))
}
