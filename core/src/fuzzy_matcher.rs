use std::path::{Path, PathBuf};
use image_hasher::{HasherConfig, ImageHash};
use serde::Serialize;
use walkdir::WalkDir;

#[derive(Debug, Serialize)]
pub struct ImageMatch {
    pub file_path: String,
    pub similarity_score: f32, // 100.0 is perfect match
}

#[derive(Debug, Serialize)]
pub struct FuzzyMatchGroup {
    pub primary_image: String,
    pub similar_images: Vec<ImageMatch>,
}

pub fn find_similar_images(dir: &Path, tolerance: u32) -> Result<Vec<FuzzyMatchGroup>, String> {
    let hasher = HasherConfig::new().to_hasher();
    let mut image_hashes: Vec<(PathBuf, ImageHash)> = Vec::new();

    // 1. Scan directory for images and compute perceptual hash
    for entry in WalkDir::new(dir).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            let path = entry.path();
            if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                let ext_lower = ext.to_lowercase();
                if ext_lower == "jpg" || ext_lower == "jpeg" || ext_lower == "png" || ext_lower == "webp" {
                    if let Ok(img) = image::open(path) {
                        let hash = hasher.hash_image(&img);
                        image_hashes.push((path.to_path_buf(), hash));
                    }
                }
            }
        }
    }

    let mut groups: Vec<FuzzyMatchGroup> = Vec::new();
    let mut processed = vec![false; image_hashes.len()];

    // 2. Compare hashes to find fuzzy duplicates
    for i in 0..image_hashes.len() {
        if processed[i] { continue; }
        
        let mut similar = Vec::new();
        let (primary_path, primary_hash) = &image_hashes[i];
        processed[i] = true;

        for j in (i + 1)..image_hashes.len() {
            if processed[j] { continue; }
            
            let (compare_path, compare_hash) = &image_hashes[j];
            let dist = primary_hash.dist(compare_hash);
            
            if dist <= tolerance {
                processed[j] = true;
                // Calculate a basic similarity percentage based on max distance (e.g. 64 bits)
                let similarity = 100.0 * (1.0 - (dist as f32 / 64.0));
                
                similar.push(ImageMatch {
                    file_path: compare_path.to_string_lossy().to_string(),
                    similarity_score: similarity,
                });
            }
        }

        if !similar.is_empty() {
            groups.push(FuzzyMatchGroup {
                primary_image: primary_path.to_string_lossy().to_string(),
                similar_images: similar,
            });
        }
    }

    Ok(groups)
}
