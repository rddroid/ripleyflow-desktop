import { useState, useEffect, useRef } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { invoke } from "@tauri-apps/api/core";

interface VideoPlayerProps {
  videoPath: string;
}

export default function VideoPlayer({ videoPath }: VideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check if format is browser-compatible
  const isBrowserCompatible = (path: string): boolean => {
    const ext = path.toLowerCase().split('.').pop() || '';
    // Only MP4, WebM, and OGG are natively supported by browsers
    // If no extension, we'll still try to load it (might be MP4 without extension)
    if (!ext) {
      return true; // Allow files without extensions - let browser decide
    }
    return ext === 'mp4' || ext === 'webm' || ext === 'ogg';
  };

  const getFormatMessage = (path: string): string => {
    const ext = path.toLowerCase().split('.').pop() || '';
    const formatName = ext.toUpperCase() || 'UNKNOWN';
    
    if (ext === 'avi' || ext === 'mov' || ext === 'mkv' || ext === 'flv' || ext === 'wmv' || ext === 'm4v') {
      return `${formatName} format is not supported by web browsers. Only MP4, WebM, and OGG formats can be played in browsers. Please use the "Open in External Player" button to play this file, or convert to MP4 format for browser playback.`;
    }
    if (!ext) {
      return `Video file has no extension. The file may be an MP4 but the browser cannot determine the format. Please ensure the file has a .mp4 extension, or use the "Open in External Player" button.`;
    }
    return `Video format (${formatName}) is not supported by browser. Only MP4, WebM, and OGG formats can be played in browsers. Please convert to MP4 format for browser playback, or use the "Open in External Player" button.`;
  };

  useEffect(() => {
    // Convert file path to a URL that can be displayed
    const loadVideo = async () => {
      setIsLoading(true);
      setHasError(false);
      setErrorMessage("");
      setVideoUrl("");
      
      // Check if format is browser-compatible before attempting to load
      // But be lenient - allow files without extensions
      const ext = videoPath.toLowerCase().split('.').pop() || '';
      const knownIncompatible = ['avi', 'mov', 'mkv', 'flv', 'wmv', 'm4v'];
      
      if (ext && knownIncompatible.includes(ext)) {
        setHasError(true);
        setErrorMessage(getFormatMessage(videoPath));
        setIsLoading(false);
        return;
      }

      try {
        // First, try to read the file as a data URL (works for files < 100MB)
        // This allows playing any video format in the browser
        try {
          const dataUrl = await invoke<string>("read_video_file", {
            filePath: videoPath,
          });
          
          console.log("Video loaded as data URL, size:", dataUrl.length, "chars");
          setVideoUrl(dataUrl);
          setHasError(false);
          setErrorMessage("");
          return;
        } catch (dataUrlError) {
          const errorMsg = dataUrlError instanceof Error ? dataUrlError.message : String(dataUrlError);
          
          // If file is too large, fall back to convertFileSrc
          if (errorMsg.includes("too large")) {
            console.log("File too large for data URL, trying convertFileSrc:", errorMsg);
            // Continue to fallback below
          } else {
            // Other error - try convertFileSrc as fallback
            console.log("Data URL failed, trying convertFileSrc:", errorMsg);
          }
        }

        // Fallback: Try convertFileSrc for smaller files or as alternative
        const verifiedPath = await invoke<string>("get_video_url", {
          filePath: videoPath,
        });

        let url: string | null = null;
        const pathVariants = [
          verifiedPath,
          verifiedPath.replace(/^\/?([A-Za-z]:)/, "/$1"),
          verifiedPath.replace(/^\/+/, ""),
          videoPath.replace(/\\/g, "/"),
        ];

        for (const pathVariant of pathVariants) {
          try {
            const testUrl = convertFileSrc(pathVariant);
            if (testUrl && (testUrl.startsWith("asset://") || testUrl.startsWith("http://") || testUrl.startsWith("https://"))) {
              url = testUrl;
              console.log("Successfully generated URL with convertFileSrc:", pathVariant);
              break;
            }
          } catch (e) {
            continue;
          }
        }

        if (!url) {
          url = convertFileSrc(videoPath.replace(/\\/g, "/"));
        }
        
        console.log("Video loading details:", {
          originalPath: videoPath,
          verifiedPath: verifiedPath,
          generatedUrl: url,
          urlProtocol: url?.substring(0, url.indexOf(':') + 1) || 'unknown',
        });
        
        if (!url || url.length === 0) {
          throw new Error("Failed to generate video URL. The file might be too large (>100MB). Please use 'Open in External Player'.");
        }
        
        setVideoUrl(url);
        setHasError(false);
        setErrorMessage("");
      } catch (error) {
        console.error("Failed to load video:", error);
        setHasError(true);
        const errorMsg = error instanceof Error ? error.message : "Failed to load video";
        
        if (errorMsg.includes("does not exist") || errorMsg.includes("File does not exist")) {
          setErrorMessage("Video file not found. The file may have been moved or deleted.");
        } else if (errorMsg.includes("too large")) {
          setErrorMessage("Video file is too large (>100MB) to load in browser. Please use the 'Open in External Player' button to play the video.");
        } else if (errorMsg.includes("ERR_CONNECTION_REFUSED") || errorMsg.includes("connection")) {
          setErrorMessage("Cannot access video file. Please use the 'Open in External Player' button to play the video.");
        } else {
          setErrorMessage(errorMsg);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (videoPath) {
      loadVideo();
    } else {
      setIsLoading(false);
    }
  }, [videoPath]);

  // Enforce height constraints continuously using ResizeObserver
  useEffect(() => {
    if (!videoContainerRef.current) return;

    const enforceHeight = () => {
      // Force container to exactly 350px
      if (videoContainerRef.current) {
        const container = videoContainerRef.current;
        container.style.setProperty('height', '350px', 'important');
        container.style.setProperty('max-height', '350px', 'important');
        container.style.setProperty('min-height', '350px', 'important');
        container.style.setProperty('overflow', 'hidden', 'important');
        
        // Check actual height and force if needed
        if (container.offsetHeight > 350) {
          container.style.height = '350px';
          container.style.maxHeight = '350px';
        }
      }
      // Force video element to fit within container (accounting for controls ~20px)
      if (videoRef.current) {
        const video = videoRef.current;
        video.style.setProperty('max-height', '330px', 'important'); // 350px - 20px for controls
        video.style.setProperty('max-width', '100%', 'important');
        video.style.setProperty('height', 'auto', 'important');
        video.style.setProperty('width', 'auto', 'important');
        
        // Check actual height and force if needed
        if (video.offsetHeight > 330) {
          video.style.maxHeight = '330px';
          video.style.height = 'auto';
        }
      }
      // Also enforce parent wrapper
      const parent = videoContainerRef.current?.parentElement?.parentElement;
      if (parent && parent.offsetHeight > 400) {
        parent.style.setProperty('max-height', '400px', 'important');
        parent.style.setProperty('overflow', 'hidden', 'important');
      }
    };

    // Create ResizeObserver to watch for any size changes
    const resizeObserver = new ResizeObserver((entries) => {
      enforceHeight();
    });

    if (videoContainerRef.current) {
      resizeObserver.observe(videoContainerRef.current);
    }
    if (videoRef.current) {
      resizeObserver.observe(videoRef.current);
    }

    // Watch parent container too
    const parentContainer = videoContainerRef.current?.parentElement?.parentElement;
    if (parentContainer) {
      resizeObserver.observe(parentContainer);
    }

    // Also enforce on mount and when video loads - more frequently
    enforceHeight();
    const interval = setInterval(enforceHeight, 50);

    return () => {
      resizeObserver.disconnect();
      clearInterval(interval);
    };
  }, [videoUrl, isLoading]);

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
      <div className="bg-vscode-bg border border-vscode-border rounded-lg p-3 flex flex-col" style={{ height: '350px', maxHeight: '350px' }}>
        <p className="text-xs text-red-400 font-medium mb-1">Failed to load video</p>
        {errorMessage && (
          <p className="text-xs text-red-300 mb-1 flex-shrink-0">{errorMessage}</p>
        )}
        <p className="text-xs text-vscode-text-secondary mt-1 mb-2 break-all truncate flex-shrink-0" title={videoPath}>
          {videoPath}
        </p>
        <div className="mt-auto">
          <button
            onClick={handleOpenExternally}
            className="w-full px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Open in External Player
          </button>
        </div>
      </div>
    );
  }

  return (
      <div className="bg-vscode-bg border border-vscode-border rounded-lg p-2 flex flex-col">
      <div 
        id="video-player-container"
        ref={videoContainerRef}
        className="flex justify-center items-center bg-black rounded overflow-hidden flex-shrink-0"
        style={{ height: '350px', maxHeight: '350px', minHeight: '350px' }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-vscode-text-secondary">Loading video...</p>
          </div>
        ) : videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="max-w-full max-h-full object-contain"
            style={{ maxHeight: '330px', maxWidth: '100%', height: 'auto', width: 'auto' }}
            onLoadedMetadata={() => {
              // Force container to stay at 350px
              if (videoContainerRef.current) {
                videoContainerRef.current.style.setProperty('height', '350px', 'important');
                videoContainerRef.current.style.setProperty('max-height', '350px', 'important');
                videoContainerRef.current.style.setProperty('min-height', '350px', 'important');
              }
              if (videoRef.current) {
                videoRef.current.style.setProperty('max-height', '330px', 'important');
              }
            }}
            onLoadedData={() => {
              // Force container to stay at 350px
              if (videoContainerRef.current) {
                videoContainerRef.current.style.setProperty('height', '350px', 'important');
                videoContainerRef.current.style.setProperty('max-height', '350px', 'important');
                videoContainerRef.current.style.setProperty('min-height', '350px', 'important');
              }
              if (videoRef.current) {
                videoRef.current.style.setProperty('max-height', '330px', 'important');
              }
            }}
            onResize={() => {
              // Force container to stay at 350px on any resize
              if (videoContainerRef.current) {
                videoContainerRef.current.style.setProperty('height', '350px', 'important');
                videoContainerRef.current.style.setProperty('max-height', '350px', 'important');
              }
            }}
            onError={(e) => {
            const video = e.target as HTMLVideoElement;
            const error = video.error;
            let errorMsg = "Failed to load video";
            
            console.error("Video element error:", {
              code: error?.code,
              message: error?.message,
              networkState: video.networkState,
              readyState: video.readyState,
              src: video.src,
              currentSrc: video.currentSrc,
            });
            
            if (error) {
              switch (error.code) {
                case error.MEDIA_ERR_ABORTED:
                  errorMsg = "Video loading was aborted. The file path might be incorrect or the file was moved.";
                  break;
                case error.MEDIA_ERR_NETWORK:
                  errorMsg = "Network error while loading video. The file might not be accessible through the Tauri asset protocol.";
                  break;
                case error.MEDIA_ERR_DECODE:
                  errorMsg = "Video codec not supported. Even though the file is MP4, it may use an unsupported codec. Please ensure the video uses H.264 codec (not H.265/HEVC). Try re-converting with explicit H.264 settings or use the 'Open in External Player' button.";
                  break;
                case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                  errorMsg = "Video format or codec not supported by browser. The file may be MP4 but uses an unsupported codec (like H.265/HEVC) or the file path/URL is incorrect. Please verify the file uses H.264 codec or use the 'Open in External Player' button.";
                  break;
                default:
                  errorMsg = `Video error (code ${error.code}): ${error.message || "Unknown error"}. The file might be corrupted, use an unsupported codec, or the path might be incorrect.`;
              }
            } else {
              // No error object but video failed - might be path/URL issue
              errorMsg = "Video failed to load. The file path might be incorrect, the file might be corrupted, or the browser cannot access it. Try using the 'Open in External Player' button to verify the file works.";
            }
            
            console.error("Video error details:", errorMsg);
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
            // Force container to stay at 350px when video can play
            if (videoContainerRef.current) {
              videoContainerRef.current.style.setProperty('height', '350px', 'important');
              videoContainerRef.current.style.setProperty('max-height', '350px', 'important');
            }
          }}
        >
          Your browser does not support the video tag.
        </video>
        ) : null}
      </div>
      <p className="text-xs text-vscode-text-secondary mt-1.5 break-all flex-shrink-0" title={videoPath}>
        {videoPath}
      </p>
    </div>
  );
}

