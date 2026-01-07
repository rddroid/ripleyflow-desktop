mod commands;
mod utils;

use std::sync::{Arc, Mutex};
use std::process::Child;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Shared state for FFmpeg process cancellation
    let ffmpeg_process: Arc<Mutex<Option<Child>>> = Arc::new(Mutex::new(None));

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .manage(ffmpeg_process.clone())
        .invoke_handler(tauri::generate_handler![
            commands::video::select_video,
            commands::video::convert_video,
            commands::video::get_video_url,
            commands::video::read_video_file,
            commands::video::open_file_externally,
            commands::video::cancel_operation,
            commands::preview::generate_preview,
            commands::preview::read_preview_file,
            commands::settings::load_settings,
            commands::settings::save_settings,
            commands::settings::select_workspace_folder,
            commands::denoise::denoise_video,
        ])
        .setup(|app| {
            // Center the main window on startup
            // Try to get the primary window (first window or window with label "main")
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.center();
            } else if let Some(window) = app.webview_windows().values().next() {
                let _ = window.center();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

