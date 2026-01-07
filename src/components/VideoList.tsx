import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSettings } from "../hooks/useSettings";
import { getPreviewPath } from "../utils/pathUtils";

interface VideoInfo {
  path: string;
  name: string;
  size: number;
}

interface VideoListProps {
  video: VideoInfo | null;
  onClear: () => void;
}

export default function VideoList({ video, onClear }: VideoListProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const { workspacePath } = useSettings();

  useEffect(() => {
    const loadThumbnail = async () => {
      if (!video) {
        setThumbnailUrl("");
        setThumbnailError(false);
        return;
      }

      setIsLoadingThumbnail(true);
      setThumbnailError(false);

      try {
        // Generate thumbnail path
        const thumbnailPath = getPreviewPath(video.path, "thumbnail", workspacePath);
        
        // First, try to read existing thumbnail
        try {
          const dataUrl = await invoke<string>("read_preview_file", {
            filePath: thumbnailPath,
          });
          setThumbnailUrl(dataUrl);
          setThumbnailError(false);
          setIsLoadingThumbnail(false);
          return; // Successfully loaded existing thumbnail
        } catch (error) {
          // Thumbnail doesn't exist, need to generate it
          console.log("Thumbnail not found, generating new one:", error);
        }

        // Generate thumbnail if it doesn't exist
        try {
          await invoke<string>("generate_preview", {
            options: {
              input_path: video.path,
              output_path: thumbnailPath,
              preview_type: "thumbnail",
              timestamp: 1.0,
            },
          });

          // Read the newly generated thumbnail
          const dataUrl = await invoke<string>("read_preview_file", {
            filePath: thumbnailPath,
          });
          setThumbnailUrl(dataUrl);
          setThumbnailError(false);
        } catch (error) {
          console.error("Failed to generate or read thumbnail:", error);
          setThumbnailError(true);
          setThumbnailUrl("");
        }
      } catch (error) {
        console.error("Failed to load thumbnail:", error);
        setThumbnailError(true);
        setThumbnailUrl("");
      } finally {
        setIsLoadingThumbnail(false);
      }
    };

    loadThumbnail();
  }, [video, workspacePath]);

  if (!video) {
    return null;
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="bg-vscode-bg border border-vscode-border rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            {/* Thumbnail or Icon */}
            <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-vscode-panel border border-vscode-border flex items-center justify-center">
              {isLoadingThumbnail ? (
                <div className="w-full h-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-vscode-text-secondary animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
              ) : thumbnailUrl && !thumbnailError ? (
                <img
                  src={thumbnailUrl}
                  alt="Video thumbnail"
                  className="w-full h-full object-cover"
                  onError={() => {
                    console.error("Failed to load thumbnail image");
                    setThumbnailError(true);
                  }}
                />
              ) : (
                <svg
                  className="w-8 h-8 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-vscode-text truncate">
                {video.name}
              </p>
              <p className="text-xs text-vscode-text-secondary">
                {formatFileSize(video.size)}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={onClear}
          className="ml-3 text-vscode-text-secondary hover:text-vscode-text transition-colors"
          title="Remove video"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

