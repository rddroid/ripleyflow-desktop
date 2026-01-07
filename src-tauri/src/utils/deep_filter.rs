use std::path::PathBuf;
use std::process::{Command, Stdio, Child};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[derive(Debug, Clone)]
pub struct DeepFilterError {
    pub message: String,
}

impl std::fmt::Display for DeepFilterError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for DeepFilterError {}

/// Find deep-filter binary in the app's resource directory
pub fn find_deep_filter_binary(app_handle: &AppHandle) -> Result<PathBuf, DeepFilterError> {
    let resource_dir = app_handle
        .path()
        .resource_dir()
        .map_err(|e| DeepFilterError {
            message: format!("Failed to get resource directory: {}", e),
        })?;

    // Check for deep-filter in binaries/deep-filter directory
    let deep_filter_dir = resource_dir.join("binaries").join("deep-filter");
    
    // Try different executable names based on platform
    let executable_name = if cfg!(target_os = "windows") {
        "deep-filter.exe"
    } else if cfg!(target_os = "macos") {
        "deep-filter"
    } else {
        "deep-filter"
    };

    let deep_filter_path = deep_filter_dir.join(executable_name);

    if deep_filter_path.exists() {
        Ok(deep_filter_path)
    } else {
        // Fallback: try to find deep-filter in PATH
        if let Ok(path) = which::which(executable_name) {
            Ok(path)
        } else {
            Err(DeepFilterError {
                message: format!(
                    "Deep-filter not found. Please place deep-filter binary at: {}",
                    deep_filter_path.display()
                ),
            })
        }
    }
}

/// Execute deep-filter command
pub fn execute_deep_filter(
    app_handle: &AppHandle,
    args: Vec<String>,
    process_state: Arc<Mutex<Option<Child>>>,
) -> Result<(), DeepFilterError> {
    let deep_filter_path = find_deep_filter_binary(app_handle)?;

    let mut cmd = Command::new(&deep_filter_path);
    cmd.args(&args);
    cmd.stderr(Stdio::piped());
    cmd.stdout(Stdio::piped());
    
    // Hide console window on Windows (CREATE_NO_WINDOW = 0x08000000)
    #[cfg(target_os = "windows")]
    cmd.creation_flags(0x08000000);

    let child = cmd
        .spawn()
        .map_err(|e| DeepFilterError {
            message: format!("Failed to spawn deep-filter process: {}", e),
        })?;

    // Store the process handle for cancellation
    {
        let mut state = process_state.lock().unwrap();
        *state = Some(child);
    }

    // Wait for process to complete
    // Use try_wait in a loop to allow cancellation checks
    let output = loop {
        // Check if process was cancelled
        {
            let state = process_state.lock().unwrap();
            if state.is_none() {
                return Err(DeepFilterError {
                    message: "Operation cancelled by user".to_string(),
                });
            }
        }

        // Try to wait for the process
        let mut state = process_state.lock().unwrap();
        if let Some(ref mut child) = *state {
            match child.try_wait() {
                Ok(Some(status)) => {
                    // Process completed
                    let _ = state.take();
                    break status;
                }
                Ok(None) => {
                    // Process still running, release lock and check again
                    drop(state);
                    std::thread::sleep(std::time::Duration::from_millis(100));
                }
                Err(e) => {
                    let _ = state.take();
                    return Err(DeepFilterError {
                        message: format!("Failed to wait for deep-filter process: {}", e),
                    });
                }
            }
        } else {
            return Err(DeepFilterError {
                message: "Process handle not found".to_string(),
            });
        }
    };

    if output.success() {
        Ok(())
    } else {
        Err(DeepFilterError {
            message: format!(
                "Deep-filter process exited with code: {:?}",
                output.code()
            ),
        })
    }
}

