use std::path::PathBuf;
use std::process::{Command, Stdio, Child};
use std::io::{BufRead, BufReader};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[derive(Debug, Clone)]
pub struct FFmpegError {
    pub message: String,
}

impl std::fmt::Display for FFmpegError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for FFmpegError {}

/// Find FFmpeg binary in the app's resource directory
pub fn find_ffmpeg_binary(app_handle: &AppHandle) -> Result<PathBuf, FFmpegError> {
    let resource_dir = app_handle
        .path()
        .resource_dir()
        .map_err(|e| FFmpegError {
            message: format!("Failed to get resource directory: {}", e),
        })?;

    // Check for FFmpeg in binaries/ffmpeg directory
    let ffmpeg_dir = resource_dir.join("binaries").join("ffmpeg");
    
    // Try different executable names based on platform
    let executable_name = if cfg!(target_os = "windows") {
        "ffmpeg.exe"
    } else if cfg!(target_os = "macos") {
        "ffmpeg"
    } else {
        "ffmpeg"
    };

    let ffmpeg_path = ffmpeg_dir.join(executable_name);

    if ffmpeg_path.exists() {
        Ok(ffmpeg_path)
    } else {
        // Fallback: try to find ffmpeg in PATH
        if let Ok(path) = which::which(executable_name) {
            Ok(path)
        } else {
            Err(FFmpegError {
                message: format!(
                    "FFmpeg not found. Please place ffmpeg binary at: {}",
                    ffmpeg_path.display()
                ),
            })
        }
    }
}

// Shared state for FFmpeg process cancellation is managed in lib.rs

/// Execute FFmpeg command and parse progress
pub fn execute_ffmpeg_with_progress(
    app_handle: &AppHandle,
    args: Vec<String>,
    event_name: &str,
    process_state: Arc<Mutex<Option<Child>>>,
) -> Result<String, FFmpegError> {
    let ffmpeg_path = find_ffmpeg_binary(app_handle)?;

    let mut cmd = Command::new(&ffmpeg_path);
    cmd.args(&args);
    cmd.stderr(Stdio::piped());
    cmd.stdout(Stdio::piped());
    
    // Hide console window on Windows (CREATE_NO_WINDOW = 0x08000000)
    #[cfg(target_os = "windows")]
    cmd.creation_flags(0x08000000);

    let mut child = cmd
        .spawn()
        .map_err(|e| FFmpegError {
            message: format!("Failed to spawn FFmpeg process: {}", e),
        })?;

    // Store the process handle for cancellation
    let stderr = child.stderr.take().ok_or_else(|| FFmpegError {
        message: "Failed to capture stderr".to_string(),
    })?;
    
    {
        let mut state = process_state.lock().unwrap();
        *state = Some(child);
    }

    let reader = BufReader::new(stderr);
    let mut duration: Option<f64> = None;
    let mut last_progress = 0.0;
    let mut last_emit_time = std::time::Instant::now();

    // Emit initial progress to show activity
    app_handle.emit(event_name, 1.0).ok();

    for line in reader.lines() {
        // Check if process was cancelled
        {
            let state = process_state.lock().unwrap();
            if state.is_none() {
                return Err(FFmpegError {
                    message: "Operation cancelled by user".to_string(),
                });
            }
        }

        let line_result = line;
        if let Ok(line) = line_result {
            // Parse duration
            if duration.is_none() {
                if let Some(dur) = parse_duration(&line) {
                    duration = Some(dur);
                    // Emit a small progress when duration is found
                    app_handle.emit(event_name, 2.0).ok();
                }
            }

            // Parse current time and calculate progress
            if let Some(current_time) = parse_time(&line) {
                if let Some(dur) = duration {
                    if dur > 0.0 {
                        let progress = (current_time / dur * 100.0).min(100.0);
                        // Emit progress more frequently (every 0.5% or every 200ms)
                        let time_since_last_emit = last_emit_time.elapsed();
                        if (progress - last_progress).abs() > 0.5 || time_since_last_emit.as_millis() > 200 {
                            app_handle.emit(event_name, progress).ok();
                            last_progress = progress;
                            last_emit_time = std::time::Instant::now();
                        }
                    }
                } else {
                    // If we have current_time but no duration yet, emit a small progress
                    // to show that processing has started
                    if last_progress < 5.0 {
                        app_handle.emit(event_name, 3.0).ok();
                        last_progress = 3.0;
                    }
                }
            }
        }
    }

    // Clear the process state
    let mut state = process_state.lock().unwrap();
    let mut child = state.take().ok_or_else(|| FFmpegError {
        message: "Process handle not found".to_string(),
    })?;

    let output = child.wait().map_err(|e| FFmpegError {
        message: format!("Failed to wait for FFmpeg process: {}", e),
    })?;

    if output.success() {
        Ok("Conversion completed successfully".to_string())
    } else {
        Err(FFmpegError {
            message: format!("FFmpeg process exited with code: {:?}", output.code()),
        })
    }
}

/// Cancel the current FFmpeg operation
#[allow(dead_code)]
pub fn cancel_ffmpeg_operation(process_state: Arc<Mutex<Option<Child>>>) -> Result<(), FFmpegError> {
    let mut state = process_state.lock().unwrap();
    if let Some(mut child) = state.take() {
        #[cfg(target_os = "windows")]
        {
            child.kill().map_err(|e| FFmpegError {
                message: format!("Failed to kill process: {}", e),
            })?;
        }
        #[cfg(not(target_os = "windows"))]
        {
            child.kill().map_err(|e| FFmpegError {
                message: format!("Failed to kill process: {}", e),
            })?;
        }
        Ok(())
    } else {
        Err(FFmpegError {
            message: "No active process to cancel".to_string(),
        })
    }
}


/// Parse duration from FFmpeg output line
fn parse_duration(line: &str) -> Option<f64> {
    if let Some(start) = line.find("Duration: ") {
        let duration_str = &line[start + 10..];
        if let Some(end) = duration_str.find(',') {
            let time_str = &duration_str[..end].trim();
            parse_time_string(time_str)
        } else {
            None
        }
    } else {
        None
    }
}

/// Parse current time from FFmpeg output line
fn parse_time(line: &str) -> Option<f64> {
    if let Some(start) = line.find("time=") {
        let time_str = &line[start + 5..];
        if let Some(end) = time_str.find(' ') {
            parse_time_string(&time_str[..end])
        } else {
            parse_time_string(time_str.trim())
        }
    } else {
        None
    }
}

/// Parse time string (HH:MM:SS.mmm) to seconds
fn parse_time_string(time_str: &str) -> Option<f64> {
    let parts: Vec<&str> = time_str.split(':').collect();
    if parts.len() == 3 {
        let hours: f64 = parts[0].parse().ok()?;
        let minutes: f64 = parts[1].parse().ok()?;
        let seconds: f64 = parts[2].parse().ok()?;
        Some(hours * 3600.0 + minutes * 60.0 + seconds)
    } else {
        None
    }
}

