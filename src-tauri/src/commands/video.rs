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
                "-profile:v".to_string(),
                "high".to_string(), // H.264 profile for better compatibility
                "-level".to_string(),
                "4.0".to_string(), // H.264 level
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

/// Read video file and return as base64 data URL for browser playback
/// This allows playing any video file in the browser
#[tauri::command]
pub async fn read_video_file(file_path: String) -> Result<String, String> {
    use std::fs;
    use base64::{Engine, engine::general_purpose};
    
    let path = PathBuf::from(&file_path);
    if !path.exists() {
        return Err("File does not exist".to_string());
    }

    // Check file size - warn if too large (over 100MB)
    let metadata = fs::metadata(&path)
        .map_err(|e| format!("Failed to read file metadata: {}", e))?;
    
    if metadata.len() > 100 * 1024 * 1024 {
        return Err("File is too large (>100MB) to load in browser. Please use 'Open in External Player' instead.".to_string());
    }

    let file_data = fs::read(&path)
        .map_err(|e| format!("Failed to read file: {}", e))?;

    // Determine MIME type from file extension
    let mime_type = if file_path.to_lowercase().ends_with(".mp4") {
        "video/mp4"
    } else if file_path.to_lowercase().ends_with(".webm") {
        "video/webm"
    } else if file_path.to_lowercase().ends_with(".ogg") || file_path.to_lowercase().ends_with(".ogv") {
        "video/ogg"
    } else if file_path.to_lowercase().ends_with(".avi") {
        "video/x-msvideo"
    } else if file_path.to_lowercase().ends_with(".mov") {
        "video/quicktime"
    } else if file_path.to_lowercase().ends_with(".mkv") {
        "video/x-matroska"
    } else {
        "video/mp4" // Default to mp4
    };

    // Convert to base64
    let base64 = general_purpose::STANDARD.encode(&file_data);
    let data_url = format!("data:{};base64,{}", mime_type, base64);

    Ok(data_url)
}

/// Get a file URL for video playback
/// Returns the file path for use with convertFileSrc or other methods
#[tauri::command]
pub async fn get_video_url(file_path: String) -> Result<String, String> {
    let path = PathBuf::from(&file_path);
    if !path.exists() {
        return Err("File does not exist".to_string());
    }

    // Return normalized path
    let normalized = file_path.replace('\\', "/");
    Ok(normalized)
}

/// Open file with system default application
#[tauri::command]
pub async fn open_file_externally(_app: AppHandle, file_path: String) -> Result<(), String> {
    use std::process::Command;
    
    let path = PathBuf::from(&file_path);
    if !path.exists() {
        return Err("File does not exist".to_string());
    }

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

/// Cancel ongoing FFmpeg operation
#[tauri::command]
pub async fn cancel_operation(process_state: State<'_, Arc<Mutex<Option<Child>>>>) -> Result<(), String> {
    let mut state = process_state.lock().unwrap();
    if let Some(mut child) = state.take() {
        #[cfg(target_os = "windows")]
        {
            use std::process::Command;
            // On Windows, we need to kill the process tree
            if let Ok(output) = Command::new("taskkill")
                .args(["/F", "/T", "/PID", &child.id().to_string()])
                .output()
            {
                if !output.status.success() {
                    let _ = child.kill();
                }
            } else {
                let _ = child.kill();
            }
        }
        #[cfg(not(target_os = "windows"))]
        {
            let _ = child.kill();
        }
    }
    Ok(())
}
