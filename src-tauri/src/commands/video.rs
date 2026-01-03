use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::process::Child;
use tauri::{AppHandle, State};
use crate::utils::ffmpeg;

#[derive(Debug, Serialize, Deserialize)]
pub struct VideoInfo {
    pub path: String,
    pub name: String,
    pub size: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConvertOptions {
    pub input_path: String,
    pub output_path: String,
    pub format: String,
}

/// Open file dialog to select a video file
#[tauri::command]
pub async fn select_video(app: AppHandle) -> Result<VideoInfo, String> {
    use tauri_plugin_dialog::{DialogExt, FilePath};
    use tokio::sync::oneshot;

    let (tx, rx) = oneshot::channel();

    app.dialog()
        .file()
        .add_filter("Video Files", &["mp4", "avi", "mov", "mkv", "webm", "flv", "wmv", "m4v"])
        .pick_file(move |file_path_opt: Option<FilePath>| {
            let _ = tx.send(file_path_opt);
        });

    let file_path = rx.await
        .map_err(|_| "Dialog cancelled".to_string())?
        .ok_or_else(|| "No file selected".to_string())?;

    // Convert FilePath to PathBuf
    // FilePath implements Display, so we can convert via string
    let path_str = file_path.to_string();
    let path_buf = PathBuf::from(&path_str);
    let path = path_buf.to_string_lossy().to_string();
    let name = path_buf
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Unknown")
        .to_string();

    let metadata = std::fs::metadata(&path_buf)
        .map_err(|e| format!("Failed to read file metadata: {}", e))?;

    Ok(VideoInfo {
        path,
        name,
        size: metadata.len(),
    })
}

/// Convert video to specified format
#[tauri::command]
pub async fn convert_video(
    app: AppHandle,
    options: ConvertOptions,
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

    // Build FFmpeg command based on format
    let mut args = vec![
        "-i".to_string(),
        options.input_path.clone(),
    ];

    // Add format-specific encoding options
    match options.format.to_lowercase().as_str() {
        "mp4" => {
            args.extend(vec![
                "-c:v".to_string(),
                "libx264".to_string(),
                "-c:a".to_string(),
                "aac".to_string(),
                "-preset".to_string(),
                "medium".to_string(),
                "-crf".to_string(),
                "23".to_string(),
                "-movflags".to_string(),
                "+faststart".to_string(), // Enable fast start for web playback
                "-pix_fmt".to_string(),
                "yuv420p".to_string(), // Ensure browser-compatible pixel format
            ]);
        }
        "avi" => {
            args.extend(vec![
                "-c:v".to_string(),
                "libx264".to_string(),
                "-c:a".to_string(),
                "libmp3lame".to_string(),
            ]);
        }
        "mov" => {
            args.extend(vec![
                "-c:v".to_string(),
                "libx264".to_string(),
                "-c:a".to_string(),
                "aac".to_string(),
            ]);
        }
        "mkv" => {
            args.extend(vec![
                "-c:v".to_string(),
                "libx264".to_string(),
                "-c:a".to_string(),
                "aac".to_string(),
            ]);
        }
        "webm" => {
            args.extend(vec![
                "-c:v".to_string(),
                "libvpx-vp9".to_string(),
                "-crf".to_string(),
                "30".to_string(), // Quality setting (0-63, lower is better)
                "-b:v".to_string(),
                "0".to_string(), // Use CRF mode
                "-c:a".to_string(),
                "libopus".to_string(),
                "-b:a".to_string(),
                "128k".to_string(), // Audio bitrate
                "-pix_fmt".to_string(),
                "yuv420p".to_string(), // Pixel format for compatibility
            ]);
        }
        _ => {
            // Default encoding
            args.extend(vec![
                "-c:v".to_string(),
                "libx264".to_string(),
                "-c:a".to_string(),
                "aac".to_string(),
            ]);
        }
    }

    args.push("-y".to_string()); // Overwrite output file
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

/// Get a file URL for video playback
#[tauri::command]
pub async fn get_video_url(file_path: String) -> Result<String, String> {
    let path = PathBuf::from(&file_path);
    if !path.exists() {
        return Err("File does not exist".to_string());
    }

    // Return the file path as-is - we'll use convertFileSrc on the frontend
    // or create a file:// URL
    Ok(file_path)
}

/// Open file with system default application
#[tauri::command]
pub async fn open_file_externally(_app: AppHandle, file_path: String) -> Result<(), String> {
    use std::process::Command;
    
    let path = PathBuf::from(&file_path);
    if !path.exists() {
        return Err("File does not exist".to_string());
    }

    // Use platform-specific command to open file
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(["/C", "start", "", &file_path])
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }
    
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&file_path)
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }
    
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&file_path)
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }

    Ok(())
}

/// Cancel the current operation
#[tauri::command]
pub async fn cancel_operation(
    process_state: State<'_, Arc<Mutex<Option<Child>>>>,
) -> Result<(), String> {
    ffmpeg::cancel_ffmpeg_operation(process_state.inner().clone())
        .map_err(|e| e.message)
}

