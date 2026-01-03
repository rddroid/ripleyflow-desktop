import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface PreviewDisplayProps {
  previewPath: string;
  previewType: "thumbnail" | "clip";
}

export default function PreviewDisplay({
  previewPath,
  previewType,
}: PreviewDisplayProps) {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    // Load preview file using Tauri command
    const loadPreview = async () => {
      try {
        // Use Tauri command to read file and get data URL
        const dataUrl = await invoke<string>("read_preview_file", {
          filePath: previewPath,
        });
        
        setPreviewUrl(dataUrl);
        setHasError(false);
        setErrorMessage("");
      } catch (error) {
        console.error("Failed to load preview:", error);
        setHasError(true);
        setErrorMessage(error instanceof Error ? error.message : "Failed to load preview");
      }
    };

    if (previewPath) {
      loadPreview();
    }
  }, [previewPath, previewType]);

  if (hasError) {
    return (
      <div className="bg-gray-700 border border-gray-600 rounded-lg p-3">
        <p className="text-xs text-red-400 font-medium mb-1">Failed to load preview</p>
        {errorMessage && (
          <p className="text-xs text-red-300 mb-1">{errorMessage}</p>
        )}
        <p className="text-xs text-gray-400 mt-1 break-all truncate" title={previewPath}>
          {previewPath}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-700 border border-gray-600 rounded-lg p-2">
      <div className="mb-1.5">
        <h3 className="text-xs font-semibold text-gray-200">
          {previewType === "thumbnail" ? "Preview Thumbnail" : "Preview Clip"}
        </h3>
      </div>
      <div className="flex justify-center items-center bg-black rounded overflow-hidden min-h-[120px]">
        {previewType === "thumbnail" ? (
          <img
            src={previewUrl}
            alt="Video thumbnail preview"
            className="max-w-full max-h-48 object-contain"
            onError={() => {
              console.error("Failed to load preview image:", previewPath);
              setHasError(true);
            }}
          />
        ) : (
          <video
            src={previewUrl}
            controls
            className="max-w-full max-h-48"
            onError={() => {
              console.error("Failed to load preview video:", previewPath);
              setHasError(true);
            }}
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-1.5 break-all truncate" title={previewPath}>
        {previewPath}
      </p>
    </div>
  );
}

