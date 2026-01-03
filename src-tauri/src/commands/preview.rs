use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::process::Child;
use tauri::{AppHandle, State};
use crate::utils::ffmpeg;

#[derive(Debug, Serialize, Deserialize)]
pub struct PreviewOptions {
    pub input_path: String,
    pub output_path: String,
    pub preview_type: String, // "thumbnail" or "clip"
    pub timestamp: Option<f64>, // For thumbnail, time in seconds
}

/// Generate preview (thumbnail or clip)
#[tauri::command]
pub async fn generate_preview(
    app: AppHandle,
    options: PreviewOptions,
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

    let timestamp = options.timestamp.unwrap_or(1.0); // Default to 1 second
    let timestamp_str = format!("{:02}:{:02}:{:05.2}", 
        (timestamp as u64) / 3600,
        ((timestamp as u64) % 3600) / 60,
        timestamp % 60.0
    );

    let mut args = vec!["-i".to_string(), options.input_path.clone()];

    match options.preview_type.to_lowercase().as_str() {
        "thumbnail" => {
            // Extract single frame
            args.extend(vec![
                "-ss".to_string(),
                timestamp_str,
                "-vframes".to_string(),
                "1".to_string(),
                "-q:v".to_string(),
                "2".to_string(), // High quality
            ]);
        }
        "clip" => {
            // Extract 5-second clip
            args.extend(vec![
                "-ss".to_string(),
                timestamp_str,
                "-t".to_string(),
                "5".to_string(),
                "-c:v".to_string(),
                "libx264".to_string(),
                "-c:a".to_string(),
                "aac".to_string(),
            ]);
        }
        _ => {
            return Err("Invalid preview type. Use 'thumbnail' or 'clip'".to_string());
        }
    }

    args.push("-y".to_string()); // Overwrite output
    args.push(options.output_path.clone());

    // Clear any previous process
    {
        let mut state = process_state.lock().unwrap();
        *state = None;
    }

    // Execute FFmpeg with progress tracking
    ffmpeg::execute_ffmpeg_with_progress(&app, args, "conversion-progress", process_state.inner().clone())
        .map_err(|e| e.message)?;

    Ok(options.output_path)
}

/// Read preview file and return as base64 data URL
#[tauri::command]
pub async fn read_preview_file(file_path: String) -> Result<String, String> {
    use std::fs;
    use base64::{Engine, engine::general_purpose};
    
    let path = PathBuf::from(&file_path);
    if !path.exists() {
        return Err("File does not exist".to_string());
    }

    let file_data = fs::read(&path)
        .map_err(|e| format!("Failed to read file: {}", e))?;

    // Determine MIME type from file extension
    let mime_type = if file_path.to_lowercase().ends_with(".jpg") || file_path.to_lowercase().ends_with(".jpeg") {
        "image/jpeg"
    } else if file_path.to_lowercase().ends_with(".png") {
        "image/png"
    } else if file_path.to_lowercase().ends_with(".gif") {
        "image/gif"
    } else if file_path.to_lowercase().ends_with(".webp") {
        "image/webp"
    } else if file_path.to_lowercase().ends_with(".mp4") {
        "video/mp4"
    } else {
        "application/octet-stream"
    };

    // Convert to base64
    let base64 = general_purpose::STANDARD.encode(&file_data);
    let data_url = format!("data:{};base64,{}", mime_type, base64);

    Ok(data_url)
}

