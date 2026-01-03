import { useState, useEffect } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { invoke } from "@tauri-apps/api/core";

interface VideoPlayerProps {
  videoPath: string;
}

export default function VideoPlayer({ videoPath }: VideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Check if format is browser-compatible
  const isBrowserCompatible = (path: string): boolean => {
    const ext = path.toLowerCase().split('.').pop() || '';
    // Only MP4, WebM, and OGG are natively supported by browsers
    return ext === 'mp4' || ext === 'webm' || ext === 'ogg';
  };

  const getFormatMessage = (path: string): string => {
    const ext = path.toLowerCase().split('.').pop() || '';
    const formatName = ext.toUpperCase();
    
    if (ext === 'avi' || ext === 'mov' || ext === 'mkv' || ext === 'flv' || ext === 'wmv' || ext === 'm4v') {
      return `${formatName} format is not supported by web browsers. Only MP4, WebM, and OGG formats can be played in browsers. Please use the "Open in External Player" button to play this file, or convert to MP4 format for browser playback.`;
    }
    return `Video format (${formatName}) is not supported by browser. Only MP4, WebM, and OGG formats can be played in browsers. Please convert to MP4 format for browser playback, or use the "Open in External Player" button.`;
  };

  useEffect(() => {
    // Convert file path to a URL that can be displayed
    const loadVideo = async () => {
      // Check if format is browser-compatible before attempting to load
      if (!isBrowserCompatible(videoPath)) {
        setHasError(true);
        setErrorMessage(getFormatMessage(videoPath));
        return;
      }

      try {
        // First, verify the file exists via Tauri command
        const verifiedPath = await invoke<string>("get_video_url", {
          filePath: videoPath,
        });

        // Use the verified path (might be different from input)
        const pathToUse = verifiedPath || videoPath;

        // Normalize the path - convert backslashes to forward slashes for Tauri
        // For Windows paths like C:\Users\..., we need to handle them specially
        let normalizedPath = pathToUse.replace(/\\/g, "/");
        
        // If it's a Windows absolute path (starts with drive letter), ensure it starts with /
        if (normalizedPath.match(/^[A-Za-z]:/)) {
          normalizedPath = "/" + normalizedPath;
        }
        
        // Use convertFileSrc to convert the file path to a Tauri asset URL
        const url = convertFileSrc(normalizedPath);
        console.log("Video URL:", url);
        console.log("Original path:", videoPath);
        console.log("Verified path:", verifiedPath);
        console.log("Normalized path:", normalizedPath);
        
        setVideoUrl(url);
        setHasError(false);
        setErrorMessage("");
      } catch (error) {
        console.error("Failed to load video:", error);
        setHasError(true);
        const errorMsg = error instanceof Error ? error.message : "Failed to load video";
        
        // Check if it's a file not found error
        if (errorMsg.includes("does not exist") || errorMsg.includes("File does not exist")) {
          setErrorMessage("Video file not found. The file may have been moved or deleted.");
        } else {
          setErrorMessage(errorMsg);
        }
      }
    };

    if (videoPath) {
      loadVideo();
    }
  }, [videoPath]);

  const handleOpenExternally = async () => {
    try {
      await invoke("open_file_externally", {
        filePath: videoPath,
      });
    } catch (error) {
      console.error("Failed to open file:", error);
      alert(`Failed to open file: ${error}`);
    }
  };

  if (hasError) {
    return (
      <div className="bg-gray-700 border border-gray-600 rounded-lg p-3">
        <p className="text-xs text-red-400 font-medium mb-1">Failed to load video</p>
        {errorMessage && (
          <p className="text-xs text-red-300 mb-1">{errorMessage}</p>
        )}
        <p className="text-xs text-gray-400 mt-1 mb-2 break-all truncate" title={videoPath}>
          {videoPath}
        </p>
        <button
          onClick={handleOpenExternally}
          className="w-full px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Open in External Player
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-700 border border-gray-600 rounded-lg p-2">
      <div className="mb-1.5">
        <h3 className="text-xs font-semibold text-gray-200">Converted Video</h3>
      </div>
      <div className="flex justify-center items-center bg-black rounded overflow-hidden min-h-[200px]">
        <video
          src={videoUrl}
          controls
          preload="metadata"
          className="max-w-full max-h-96 w-full"
          onError={(e) => {
            const video = e.target as HTMLVideoElement;
            const error = video.error;
            let errorMsg = "Failed to load video";
            
            if (error) {
              switch (error.code) {
                case error.MEDIA_ERR_ABORTED:
                  errorMsg = "Video loading was aborted";
                  break;
                case error.MEDIA_ERR_NETWORK:
                  errorMsg = "Network error while loading video";
                  break;
                case error.MEDIA_ERR_DECODE:
                  errorMsg = "Video codec not supported or corrupted file. Try converting to MP4 format.";
                  break;
                case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                  errorMsg = "Video format not supported by browser. Try converting to MP4 format.";
                  break;
                default:
                  errorMsg = `Video error: ${error.message || "Unknown error"}`;
              }
            }
            
            console.error("Video error:", error, errorMsg);
            setHasError(true);
            setErrorMessage(errorMsg);
          }}
          onLoadStart={() => {
            console.log("Video loading started");
            setHasError(false);
          }}
          onCanPlay={() => {
            console.log("Video can play");
            setHasError(false);
          }}
        >
          Your browser does not support the video tag.
        </video>
      </div>
      <p className="text-xs text-gray-400 mt-1.5 break-all truncate" title={videoPath}>
        {videoPath}
      </p>
    </div>
  );
}

