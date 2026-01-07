use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::process::Child;
use tauri::{AppHandle, State, Emitter};
use crate::utils::ffmpeg;
use crate::utils::deep_filter;

#[derive(Debug, Serialize, Deserialize)]
pub struct DenoiseOptions {
    pub input_path: String,
    pub output_path: String,
}

/// Denoise video audio using deep-filter
#[tauri::command]
pub async fn denoise_video(
    app: AppHandle,
    options: DenoiseOptions,
    process_state: State<'_, Arc<Mutex<Option<Child>>>>,
) -> Result<String, String> {
    let input_path = PathBuf::from(&options.input_path);
    if !input_path.exists() {
        return Err("Input file does not exist".to_string());
    }

    let output_path = PathBuf::from(&options.output_path);
    let output_dir = output_path
        .parent()
        .ok_or_else(|| "Invalid output path".to_string())?;

    // Create output directory if it doesn't exist
    std::fs::create_dir_all(output_dir)
        .map_err(|e| format!("Failed to create output directory: {}", e))?;

    // Get base name without extension
    let base_name = input_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("video")
        .to_string();

    // Create temporary directories
    let temp_dir = std::env::temp_dir().join(format!("ripleyflow_denoise_{}", base_name));
    let denoised_dir = temp_dir.join("denoised");

    std::fs::create_dir_all(&temp_dir)
        .map_err(|e| format!("Failed to create temp directory: {}", e))?;
    std::fs::create_dir_all(&denoised_dir)
        .map_err(|e| format!("Failed to create denoised directory: {}", e))?;

    // Step 1: Extract audio from video (0-33%)
    let wav_file = temp_dir.join(format!("{}.wav", base_name));
    let denoised_wav = denoised_dir.join(format!("{}.wav", base_name));

    // Step 1: Extract audio from video (0-33%)
    app.emit("conversion-progress", 1.0).ok();

    let extract_args = vec![
        "-y".to_string(),
        "-i".to_string(),
        options.input_path.clone(),
        "-vn".to_string(), // No video
        "-ar".to_string(),
        "48000".to_string(), // Sample rate 48kHz
        wav_file.to_string_lossy().to_string(),
    ];

    // Clear any previous process
    {
        let mut state = process_state.lock().unwrap();
        *state = None;
    }

    // Execute audio extraction
    // Note: ffmpeg will emit its own progress, but we'll override with fixed values
    let extract_progress_state = process_state.inner().clone();
    ffmpeg::execute_ffmpeg_with_progress(
        &app,
        extract_args,
        "conversion-progress",
        extract_progress_state.clone(),
    )
    .map_err(|e| {
        // Cleanup on error
        let _ = std::fs::remove_dir_all(&temp_dir);
        format!("Failed to extract audio: {}", e.message)
    })?;

    // Emit progress for step 1 completion (33%)
    app.emit("conversion-progress", 33.0).ok();

    // Step 2: Run deep-filter on audio (33-66%)
    let deep_filter_args = vec![
        wav_file.to_string_lossy().to_string(),
        "-D".to_string(),
        "-o".to_string(),
        denoised_dir.to_string_lossy().to_string(),
    ];

    // Clear process state for deep-filter
    {
        let mut state = process_state.lock().unwrap();
        *state = None;
    }

    // Execute deep-filter
    deep_filter::execute_deep_filter(&app, deep_filter_args, process_state.inner().clone())
        .map_err(|e| {
            // Cleanup on error
            let _ = std::fs::remove_dir_all(&temp_dir);
            format!("Failed to denoise audio: {}", e.message)
        })?;

    // Emit progress for step 2 completion (66%)
    app.emit("conversion-progress", 66.0).ok();

    // Validate denoised WAV file exists and has valid size
    if !denoised_wav.exists() {
        let _ = std::fs::remove_dir_all(&temp_dir);
        return Err("Denoised WAV file is missing".to_string());
    }

    let metadata = std::fs::metadata(&denoised_wav)
        .map_err(|e| {
            let _ = std::fs::remove_dir_all(&temp_dir);
            format!("Failed to read denoised WAV metadata: {}", e)
        })?;

    if metadata.len() < 1000 {
        let _ = std::fs::remove_dir_all(&temp_dir);
        return Err("Denoised WAV file appears to be corrupted (size < 1000 bytes)".to_string());
    }

    // Step 3: Combine original video with denoised audio (66-100%)
    app.emit("conversion-progress", 66.0).ok();

    let combine_args = vec![
        "-y".to_string(),
        "-i".to_string(),
        options.input_path.clone(),
        "-i".to_string(),
        denoised_wav.to_string_lossy().to_string(),
        "-map".to_string(),
        "0:v".to_string(), // Map video from first input
        "-map".to_string(),
        "1:a".to_string(), // Map audio from second input
        "-c:v".to_string(),
        "libx264".to_string(), // Re-encode video for browser compatibility
        "-c:a".to_string(),
        "aac".to_string(), // Encode audio as AAC
        "-preset".to_string(),
        "medium".to_string(),
        "-crf".to_string(),
        "23".to_string(), // Quality setting
        "-movflags".to_string(),
        "+faststart".to_string(), // Enable fast start for web playback
        "-pix_fmt".to_string(),
        "yuv420p".to_string(), // Ensure browser-compatible pixel format
        "-profile:v".to_string(),
        "high".to_string(), // H.264 profile for better compatibility
        "-level".to_string(),
        "4.0".to_string(), // H.264 level
        "-b:a".to_string(),
        "192k".to_string(), // Audio bitrate
        "-strict".to_string(),
        "-2".to_string(), // Allow experimental codecs (for AAC)
        "-shortest".to_string(), // Finish encoding when the shortest input stream ends
        "-vf".to_string(),
        "scale=iw:ih".to_string(), // Keep original resolution but ensure compatibility
        "-max_muxing_queue_size".to_string(),
        "1024".to_string(), // Increase muxing queue size for large files
        options.output_path.clone(),
    ];

    // Clear process state for final ffmpeg
    {
        let mut state = process_state.lock().unwrap();
        *state = None;
    }

    // Execute video combination
    let combine_progress_state = process_state.inner().clone();
    ffmpeg::execute_ffmpeg_with_progress(
        &app,
        combine_args,
        "conversion-progress",
        combine_progress_state.clone(),
    )
    .map_err(|e| {
        // Cleanup on error
        let _ = std::fs::remove_dir_all(&temp_dir);
        format!("Failed to combine video and audio: {}", e.message)
    })?;

    // Validate output file exists and has valid size
    if !output_path.exists() {
        let _ = std::fs::remove_dir_all(&temp_dir);
        return Err("Output video file was not created".to_string());
    }

    let output_metadata = std::fs::metadata(&output_path)
        .map_err(|e| {
            let _ = std::fs::remove_dir_all(&temp_dir);
            format!("Failed to read output file metadata: {}", e)
        })?;

    if output_metadata.len() < 1000 {
        let _ = std::fs::remove_dir_all(&temp_dir);
        return Err("Output video file appears to be corrupted (size < 1000 bytes)".to_string());
    }

    // Clean up temporary directory
    if temp_dir.exists() {
        let _ = std::fs::remove_dir_all(&temp_dir);
    }

    // Emit final progress
    app.emit("conversion-progress", 100.0).ok();

    Ok(options.output_path)
}

