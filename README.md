# RipleyFlow

A Tauri-based desktop application for converting videos, generating previews, and denoising video audio.

## Features

- Select video files via file dialog or drag-and-drop
- Convert videos to multiple formats (MP4, AVI, MOV, MKV, WebM)
- Generate preview thumbnails or short clips
- Denoise video audio using deep-filter
- Real-time conversion progress tracking
- Modern, responsive UI built with React and Tailwind CSS

## Prerequisites

- Node.js (v18 or later)
- Rust (latest stable version)
- FFmpeg binary
- Deep-filter binary (for audio denoising feature)

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

3. Place Deep-filter binary (optional, for denoising feature):
   - Download or obtain the `deep-filter` executable (or `deep-filter.exe` on Windows)
   - Place it in:
     ```
     src-tauri/binaries/deep-filter/
     ```
   - The binary should be at: `src-tauri/binaries/deep-filter/deep-filter` (or `deep-filter.exe` on Windows)
   - Note: The denoising feature will be unavailable if deep-filter is not present

4. Run the development server:
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

2. **Ensure Deep-filter is in place (optional):**
   - Make sure `deep-filter.exe` is located at `src-tauri/binaries/deep-filter/deep-filter.exe`
   - The denoising feature requires this binary to function

3. **Build the application:**
   ```bash
   npm run tauri build
   ```

4. **Output location:**
   - The built installer will be in `src-tauri/target/release/bundle/msi/ripleyflow-app_0.1.0_x64_en-US.msi` (or similar)
   - The standalone executable will be in `src-tauri/target/release/ripleyflow-app.exe`
   - FFmpeg and deep-filter will be automatically bundled with the application in the resources directory

### Build Options

You can also build for specific targets:

```bash
# Build only the executable (no installer)
npm run tauri build -- --bundles none

# Build with specific bundle format
npm run tauri build -- --bundles msi
```

The FFmpeg and deep-filter binaries are automatically included in the bundle via the `resources` configuration in `tauri.conf.json`.

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
│       ├── ffmpeg/       # FFmpeg binary location
│       └── deep-filter/ # Deep-filter binary location (for denoising)
└── package.json
```

## Usage

### Video Converter Tab
1. Click "Browse Files" or drag and drop a video file
2. Select your desired output format (MP4, AVI, MOV, MKV, WebM)
3. Click "Convert Video" button at the bottom
4. Monitor progress in real-time
5. Find your converted file in the workspace directory (or same directory as input if workspace is not set)

### Preview Generation Tab
1. Click "Browse Files" or drag and drop a video file
2. Choose preview type (thumbnail or clip)
3. Click "Generate Preview" button at the bottom
4. View the generated preview in the right panel

### Video Denoiser Tab
1. Click "Browse Files" or drag and drop a video file
2. Click "Denoise Video" button at the bottom
3. The process will:
   - Extract audio from the video
   - Denoise the audio using deep-filter
   - Combine the original video with the denoised audio
4. Monitor progress in real-time (0-33% audio extraction, 33-66% denoising, 66-100% combining)
5. View the denoised video in the right panel
6. The output file will be saved with `_denoised.mp4` suffix in the workspace directory

## Supported Formats

- **Input**: MP4, AVI, MOV, MKV, WebM, FLV, WMV, M4V
- **Output**: MP4, AVI, MOV, MKV, WebM

## Notes

- FFmpeg must be manually downloaded and placed in the `src-tauri/binaries/ffmpeg/` directory
- Deep-filter must be manually placed in the `src-tauri/binaries/deep-filter/` directory for the denoising feature
- The app will fall back to system PATH if binaries are not found in their respective directories
- Conversion progress is tracked in real-time via FFmpeg output parsing
- Denoising process re-encodes the video to H.264/AAC for browser compatibility
- All output files respect the workspace path setting (if configured) or default to the input file's directory

