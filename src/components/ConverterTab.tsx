import VideoSelector from "./VideoSelector";
import VideoList from "./VideoList";
import FormatSelector from "./FormatSelector";
import VideoPlayer from "./VideoPlayer";
import { VideoInfo, ConversionStatus } from "../hooks/useConversion";

interface ConverterTabProps {
  selectedVideo: VideoInfo | null;
  selectedFormat: string;
  outputPath: string | null;
  conversionStatus: ConversionStatus;
  errorMessage: string | null;
  onVideoSelected: (video: VideoInfo) => void;
  onClearVideo: () => void;
  onFormatChange: (format: string) => void;
  onConvert: () => void;
}

export default function ConverterTab({
  selectedVideo,
  selectedFormat,
  outputPath,
  conversionStatus,
  errorMessage,
  onVideoSelected,
  onClearVideo,
  onFormatChange,
  onConvert,
}: ConverterTabProps) {

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

          {/* Format Selection */}
          <div className={selectedVideo ? "" : "opacity-50 pointer-events-none"}>
            <h2 className="text-base font-semibold text-vscode-text mb-2">
              Choose Output Format
            </h2>
            <FormatSelector
              selectedFormat={selectedFormat}
              onFormatChange={onFormatChange}
            />
          </div>

          {/* Error Display */}
          {errorMessage && conversionStatus === "error" && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
              <p className="text-xs font-medium text-red-400 mb-1">Error</p>
              <p className="text-xs text-red-300">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Right Side - Video Player */}
        <div className="overflow-hidden min-h-0 flex flex-col">
          {outputPath ? (
            <div className="flex flex-col min-h-0 overflow-hidden">
              <div className="flex-shrink-0 overflow-hidden" style={{ height: '400px', maxHeight: '400px', minHeight: '400px' }}>
                <VideoPlayer videoPath={outputPath} />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-vscode-bg/50 border border-vscode-border rounded-lg p-4">
              <p className="text-xs text-vscode-text-secondary text-center">
                {selectedVideo
                  ? "Click 'Convert Video' to see the converted video here"
                  : "Select a video to convert"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Button at bottom center - always visible to prevent jumping */}
      <div className="mt-4 pt-4 flex justify-center flex-shrink-0 border-t border-vscode-border">
        <button
          onClick={onConvert}
          disabled={!selectedVideo || conversionStatus === "converting"}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
        >
          Convert Video
        </button>
      </div>
    </div>
  );
}

