export default function Footer() {
  return (
    <footer className="pt-3 pb-2 border-t border-vscode-border bg-vscode-panel flex-shrink-0">
      <div className="text-center text-xs text-vscode-text-secondary space-y-1">
        <p>
          © 2025 RipleyFlow. Licensed under the{" "}
          <a
            href="https://opensource.org/licenses/MIT"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            MIT License
          </a>
          .
        </p>
        <p>
          This application uses{" "}
          <a
            href="https://ffmpeg.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            FFmpeg
          </a>
          , licensed under the{" "}
          <a
            href="https://www.gnu.org/licenses/lgpl-3.0.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            LGPL v3.0
          </a>
          {" "}and{" "}
          <a
            href="https://www.gnu.org/licenses/gpl-3.0.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            GPL v3.0
          </a>
          , and{" "}
          <a
            href="https://github.com/Rikorose/DeepFilterNet"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            DeepFilterNet
          </a>
          , licensed under the{" "}
          <a
            href="https://opensource.org/licenses/MIT"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            MIT License
          </a>
          {" "}and{" "}
          <a
            href="https://www.apache.org/licenses/LICENSE-2.0"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Apache 2.0
          </a>
          .
        </p>
      </div>
    </footer>
  );
}

