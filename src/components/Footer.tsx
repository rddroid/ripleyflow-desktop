export default function Footer() {
  return (
    <footer className="sticky bottom-0 mt-auto pt-3 pb-2 border-t border-gray-700 bg-gray-800">
      <div className="text-center text-xs text-gray-400 space-y-1">
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
          .
        </p>
      </div>
    </footer>
  );
}

