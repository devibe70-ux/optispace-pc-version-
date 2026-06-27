use std::process::Command;
use std::path::{Path, PathBuf};
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct CompressionResult {
    pub original_file: String,
    pub compressed_file: String,
    pub original_size: u64,
    pub compressed_size: u64,
    pub space_saved: u64,
}

pub fn compress_video(input_path: &Path, output_dir: &Path) -> Result<CompressionResult, String> {
    if !input_path.exists() || !input_path.is_file() {
        return Err("Input video file does not exist".to_string());
    }

    let file_stem = input_path.file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("video");
    
    let mut output_path = PathBuf::from(output_dir);
    output_path.push(format!("{}_compressed.mp4", file_stem));

    // Call ffmpeg to compress using H.265 (HEVC)
    // We assume ffmpeg is available in the system PATH for this MVP.
    let status = Command::new("ffmpeg")
        .arg("-y") // Overwrite output files without asking
        .arg("-i").arg(input_path)
        .arg("-vcodec").arg("libx265")
        .arg("-crf").arg("28") // Constant Rate Factor (lower is better quality, 28 is default for x265)
        .arg("-preset").arg("fast")
        .arg(&output_path)
        .status()
        .map_err(|e| format!("Failed to execute ffmpeg. Is it installed? Error: {}", e))?;

    if !status.success() {
        return Err("FFmpeg process failed during compression".to_string());
    }

    let original_size = input_path.metadata().map(|m| m.len()).unwrap_or(0);
    let compressed_size = output_path.metadata().map(|m| m.len()).unwrap_or(0);
    let space_saved = if original_size > compressed_size { original_size - compressed_size } else { 0 };

    Ok(CompressionResult {
        original_file: input_path.to_string_lossy().to_string(),
        compressed_file: output_path.to_string_lossy().to_string(),
        original_size,
        compressed_size,
        space_saved,
    })
}
