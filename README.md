# RipleyFlow Video Converter

A Tauri-based desktop application for converting videos and generating previews.

## Features

- Select video files via file dialog or drag-and-drop
- Convert videos to multiple formats (MP4, AVI, MOV, MKV, WebM)
- Generate preview thumbnails or short clips
- Real-time conversion progress tracking
- Modern, responsive UI built with React and Tailwind CSS

## Prerequisites

- Node.js (v18 or later)
- Rust (latest stable version)
- FFmpeg binary

## Setup

1. Install dependencies:
```bash
npm install
```

2. Place FFmpeg binary:
   - Download FFmpeg for your platform
   - Extract and place the `ffmpeg` executable (or `ffmpeg.exe` on Windows) in:
     ```
     src-tauri/binaries/ffmpeg/
     ```
   - The binary should be at: `src-tauri/binaries/ffmpeg/ffmpeg` (or `ffmpeg.exe` on Windows)

3. Run the development server:
```bash
npm run tauri dev
```

## Building

### Building for Windows

To build the Windows executable (.exe) with FFmpeg bundled:

1. **Ensure FFmpeg is in place:**
   - Make sure `ffmpeg.exe` is located at `src-tauri/binaries/ffmpeg/ffmpeg.exe`
   - If you haven't downloaded it yet:
     - Download FFmpeg for Windows from https://www.gyan.dev/ffmpeg/builds/ (recommended) or https://ffmpeg.org/download.html
     - Extract the archive and copy `ffmpeg.exe` to `src-tauri/binaries/ffmpeg/ffmpeg.exe`

2. **Build the application:**
   ```bash
   npm run tauri build
   ```

3. **Output location:**
   - The built installer will be in `src-tauri/target/release/bundle/msi/ripleyflow-app_0.1.0_x64_en-US.msi` (or similar)
   - The standalone executable will be in `src-tauri/target/release/ripleyflow-app.exe`
   - FFmpeg will be automatically bundled with the application in the resources directory

### Build Options

You can also build for specific targets:

```bash
# Build only the executable (no installer)
npm run tauri build -- --bundles none

# Build with specific bundle format
npm run tauri build -- --bundles msi
```

The FFmpeg binary is automatically included in the bundle via the `resources` configuration in `tauri.conf.json`.

### Important Notes for Windows Builds

1. **FFmpeg Static vs Shared Build:**
   - For a standalone executable, use a **static build** of FFmpeg (recommended)
   - Static builds don't require additional DLL files
   - Download static builds from: https://www.gyan.dev/ffmpeg/builds/ (select "ffmpeg-release-essentials.zip")
   - If using a shared build, you'll need to include all FFmpeg DLL files in the `binaries/ffmpeg/` directory

2. **Verifying the Build:**
   After building, you can verify FFmpeg is bundled:
   - The built executable will be in `src-tauri/target/release/ripleyflow-app.exe`
   - FFmpeg should be accessible at runtime via the resource directory
   - Test the application to ensure video conversion works without requiring FFmpeg in the system PATH

3. **Build Output:**
   - **Executable**: `src-tauri/target/release/ripleyflow-app.exe`
   - **Installer (MSI)**: `src-tauri/target/release/bundle/msi/ripleyflow-app_0.1.0_x64_en-US.msi`
   - Both include the FFmpeg binary in the resources directory

## Project Structure

```
ripleyflow-app/
├── src/                    # React frontend
│   ├── components/        # React components
│   ├── App.tsx           # Main app component
│   └── main.tsx          # React entry point
├── src-tauri/            # Tauri backend
│   ├── src/
│   │   ├── commands/     # Tauri commands
│   │   ├── utils/        # Utility functions
│   │   └── lib.rs        # Tauri app setup
│   └── binaries/
│       └── ffmpeg/       # FFmpeg binary location
└── package.json
```

## Usage

1. Click "Browse Files" or drag and drop a video file
2. Select your desired output format
3. Choose preview type (thumbnail or clip)
4. Click "Generate Preview" to create a preview
5. Click "Convert Video" to convert the video
6. Monitor progress in real-time
7. Find your converted file in the same directory as the input file

## Supported Formats

- **Input**: MP4, AVI, MOV, MKV, WebM, FLV, WMV, M4V
- **Output**: MP4, AVI, MOV, MKV, WebM

## Notes

- FFmpeg must be manually downloaded and placed in the `src-tauri/binaries/ffmpeg/` directory
- The app will fall back to system PATH if FFmpeg is not found in the binaries directory
- Conversion progress is tracked in real-time via FFmpeg output parsing

