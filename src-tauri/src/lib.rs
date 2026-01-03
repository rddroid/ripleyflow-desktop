mod commands;
mod utils;

use std::sync::{Arc, Mutex};
use std::process::Child;

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
            commands::video::open_file_externally,
            commands::video::cancel_operation,
            commands::preview::generate_preview,
            commands::preview::read_preview_file,
            commands::settings::load_settings,
            commands::settings::save_settings,
            commands::settings::select_workspace_folder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

