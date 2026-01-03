# FFmpeg Binary Location

Place your FFmpeg executable here.

## Windows
- Download FFmpeg from https://ffmpeg.org/download.html
- Extract the archive
- Copy `ffmpeg.exe` to this directory: `src-tauri/binaries/ffmpeg/ffmpeg.exe`

## macOS
- Download FFmpeg from https://ffmpeg.org/download.html
- Extract the archive
- Copy `ffmpeg` to this directory: `src-tauri/binaries/ffmpeg/ffmpeg`
- Make sure it's executable: `chmod +x ffmpeg`

## Linux
- Download FFmpeg from https://ffmpeg.org/download.html
- Extract the archive
- Copy `ffmpeg` to this directory: `src-tauri/binaries/ffmpeg/ffmpeg`
- Make sure it's executable: `chmod +x ffmpeg`

The application will look for FFmpeg in this location first, then fall back to the system PATH if not found.

