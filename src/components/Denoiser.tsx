import { invoke } from "@tauri-apps/api/core";
import VideoSelector from "./VideoSelector";
import VideoList from "./VideoList";
import VideoPlayer from "./VideoPlayer";

interface VideoInfo {
  path: string;
  name: string;
  size: number;
}

type ConversionStatus = "idle" | "converting" | "completed" | "error";

interface DenoiserProps {
  selectedVideo: VideoInfo | null;
  conversionStatus: ConversionStatus;
  errorMessage: string | null;
  denoisedPath: string | null;
  workspacePath: string;
  onVideoSelected: (video: VideoInfo) => void;
  onClearVideo: () => void;
  onStatusChange: (status: ConversionStatus) => void;
  onProgressChange: (progress: number) => void;
  onErrorChange: (error: string | null) => void;
  onDenoisedPathChange: (path: string | null) => void;
}

export default function Denoiser({
  selectedVideo,
  conversionStatus,
  errorMessage,
  denoisedPath,
  workspacePath,
  onVideoSelected,
  onClearVideo,
  onStatusChange,
  onProgressChange,
  onErrorChange,
  onDenoisedPathChange,
}: DenoiserProps) {
  const getDenoisedPath = (inputPath: string): string => {
    if (!workspacePath) {
      // Fallback to original location if workspace path is not set
      const lastDotIndex = inputPath.lastIndexOf(".");
      if (lastDotIndex > 0 && lastDotIndex < inputPath.length - 1) {
        return inputPath.substring(0, lastDotIndex) + "_denoised.mp4";
      } else {
        return inputPath + "_denoised.mp4";
      }
    }

    // Use workspace path
    const inputFileName = inputPath.split(/[/\\]/).pop() || "video";
    const fileNameWithoutExt = inputFileName.lastIndexOf(".") > 0
      ? inputFileName.substring(0, inputFileName.lastIndexOf("."))
      : inputFileName;
    
    // Ensure workspace path ends with a separator
    const workspace = workspacePath.endsWith("/") || workspacePath.endsWith("\\")
      ? workspacePath
      : workspacePath + (workspacePath.includes("\\") ? "\\" : "/");
    
    return workspace + fileNameWithoutExt + "_denoised.mp4";
  };

  const handleDenoiseVideo = async () => {
    if (!selectedVideo) {
      onErrorChange("Please select a video first");
      return;
    }

    onStatusChange("converting");
    onProgressChange(0);
    onErrorChange(null);
    onDenoisedPathChange(null);

    try {
      const denoisedPath = getDenoisedPath(selectedVideo.path);
      const result = await invoke<string>("denoise_video", {
        options: {
          input_path: selectedVideo.path,
          output_path: denoisedPath,
        },
      });

      onDenoisedPathChange(result);
      onStatusChange("completed");
      onProgressChange(100);
      // Reset progress after a short delay
      setTimeout(() => {
        onStatusChange("idle");
        onProgressChange(0);
      }, 500);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      // Check if operation was cancelled
      if (errorMsg.includes("Operation cancelled by user") || errorMsg.includes("cancelled")) {
        // Silently handle cancellation
        onStatusChange("idle");
        onProgressChange(0);
        onErrorChange(null);
      } else {
        onErrorChange(`Error denoising video: ${errorMsg}`);
        onStatusChange("error");
        onProgressChange(0);
      }
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden min-h-0">
      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0 overflow-hidden">
        {/* Left Side - Controls */}
        <div className="space-y-4 overflow-y-auto overflow-x-hidden">
          {/* Video Selection */}
          <div>
            <div className="min-h-[140px]">
              {!selectedVideo ? (
                <VideoSelector onVideoSelected={onVideoSelected} />
              ) : (
                <VideoList video={selectedVideo} onClear={onClearVideo} />
              )}
            </div>
          </div>

          {/* Error Display */}
          {errorMessage && conversionStatus === "error" && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
              <p className="text-xs font-medium text-red-400 mb-1">Error</p>
              <p className="text-xs text-red-300">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Right Side - Denoised Video Player */}
        <div className="overflow-hidden min-h-0 flex flex-col">
          {denoisedPath ? (
            <div className="flex flex-col min-h-0 overflow-hidden">
              <h2 className="text-base font-semibold text-vscode-text mb-2 flex-shrink-0">
                Denoised Video
              </h2>
              <div className="flex-shrink-0 overflow-hidden" style={{ height: '400px', maxHeight: '400px', minHeight: '400px' }}>
                <VideoPlayer videoPath={denoisedPath} />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-vscode-bg/50 border border-vscode-border rounded-lg p-4" style={{ minHeight: '300px' }}>
              <p className="text-sm text-vscode-text-secondary text-center">
                {selectedVideo
                  ? "Click 'Denoise Video' to see the denoised video here"
                  : "Select a video to denoise"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Button at bottom center - always visible to prevent jumping */}
      <div className="mt-auto pt-4 flex justify-center flex-shrink-0">
        <button
          onClick={handleDenoiseVideo}
          disabled={!selectedVideo || conversionStatus === "converting"}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
        >
          Denoise Video
        </button>
      </div>
    </div>
  );
}

