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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load preview file using Tauri command
    const loadPreview = async () => {
      setIsLoading(true);
      setHasError(false);
      setErrorMessage("");
      setPreviewUrl("");
      
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
      } finally {
        setIsLoading(false);
      }
    };

    if (previewPath) {
      loadPreview();
    } else {
      setIsLoading(false);
    }
  }, [previewPath, previewType]);

  if (hasError) {
    return (
      <div className="bg-vscode-bg border border-vscode-border rounded-lg p-3">
        <p className="text-xs text-red-400 font-medium mb-1">Failed to load preview</p>
        {errorMessage && (
          <p className="text-xs text-red-300 mb-1">{errorMessage}</p>
        )}
        <p className="text-xs text-vscode-text-secondary mt-1 break-all truncate" title={previewPath}>
          {previewPath}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-vscode-bg border border-vscode-border rounded-lg p-2">
      <div className="flex justify-center items-center bg-black rounded overflow-hidden min-h-[200px] max-h-[300px] h-[300px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-vscode-text-secondary">Loading preview...</p>
          </div>
        ) : previewUrl ? (
          previewType === "thumbnail" ? (
            <img
              src={previewUrl}
              alt="Video thumbnail preview"
              className="max-w-full max-h-full object-contain"
              onError={() => {
                console.error("Failed to load preview image:", previewPath);
                setHasError(true);
              }}
            />
          ) : (
            <video
              src={previewUrl}
              controls
              className="max-w-full max-h-full object-contain"
              style={{ maxHeight: '300px' }}
              onError={() => {
                console.error("Failed to load preview video:", previewPath);
                setHasError(true);
              }}
            >
              Your browser does not support the video tag.
            </video>
          )
        ) : null}
      </div>
      <p className="text-xs text-vscode-text-secondary mt-1.5 break-all truncate" title={previewPath}>
        {previewPath}
      </p>
    </div>
  );
}

