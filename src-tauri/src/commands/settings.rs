use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    pub workspace_path: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        // Default to user's Documents folder
        let default_path = dirs::home_dir()
            .map(|p| p.join("Documents").join("RipleyFlow").to_string_lossy().to_string())
            .unwrap_or_else(|| "".to_string());
        
        AppSettings {
            workspace_path: default_path,
        }
    }
}

fn get_settings_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    Ok(app_data_dir)
}

fn get_settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    let settings_dir = get_settings_dir(app)?;
    Ok(settings_dir.join("settings.json"))
}

/// Load settings from file
#[tauri::command]
pub async fn load_settings(app: AppHandle) -> Result<AppSettings, String> {
    let settings_path = get_settings_path(&app)?;
    
    if !settings_path.exists() {
        // Return default settings if file doesn't exist
        return Ok(AppSettings::default());
    }
    
    let content = fs::read_to_string(&settings_path)
        .map_err(|e| format!("Failed to read settings file: {}", e))?;
    
    let settings: AppSettings = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse settings: {}", e))?;
    
    Ok(settings)
}

/// Save settings to file
#[tauri::command]
pub async fn save_settings(app: AppHandle, settings: AppSettings) -> Result<(), String> {
    let settings_path = get_settings_path(&app)?;
    let settings_dir = settings_path.parent()
        .ok_or_else(|| "Invalid settings path".to_string())?;
    
    // Create directory if it doesn't exist
    fs::create_dir_all(settings_dir)
        .map_err(|e| format!("Failed to create settings directory: {}", e))?;
    
    // Validate workspace path
    if !settings.workspace_path.is_empty() {
        let workspace_path = PathBuf::from(&settings.workspace_path);
        if !workspace_path.exists() {
            // Try to create the directory
            fs::create_dir_all(&workspace_path)
                .map_err(|e| format!("Failed to create workspace directory: {}", e))?;
        }
    }
    
    let content = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;
    
    fs::write(&settings_path, content)
        .map_err(|e| format!("Failed to write settings file: {}", e))?;
    
    Ok(())
}

/// Open folder dialog to select workspace path
#[tauri::command]
pub async fn select_workspace_folder(app: AppHandle) -> Result<String, String> {
    use tauri_plugin_dialog::{DialogExt, FilePath};
    use tokio::sync::oneshot;

    let (tx, rx) = oneshot::channel();

    // Use file dialog but allow directory selection
    app.dialog()
        .file()
        .pick_file(move |file_path_opt: Option<FilePath>| {
            let _ = tx.send(file_path_opt);
        });

    let file_path = rx.await
        .map_err(|_| "Dialog cancelled".to_string())?
        .ok_or_else(|| "No folder selected".to_string())?;

    // Convert FilePath to string
    let path_str = file_path.to_string();
    let path_buf = PathBuf::from(&path_str);
    
    // If it's a file, get the parent directory; if it's a directory, use it directly
    let folder_path = if path_buf.is_file() {
        path_buf.parent()
            .ok_or_else(|| "Invalid path".to_string())?
            .to_string_lossy()
            .to_string()
    } else {
        path_str
    };

    Ok(folder_path)
}

