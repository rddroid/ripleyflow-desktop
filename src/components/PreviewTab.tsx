import VideoSelector from "./VideoSelector";
import VideoList from "./VideoList";
import PreviewSelector from "./PreviewSelector";
import PreviewDisplay from "./PreviewDisplay";
import { VideoInfo, ConversionStatus, PreviewType } from "../hooks/useConversion";

interface PreviewTabProps {
  selectedVideo: VideoInfo | null;
  previewType: PreviewType;
  previewPath: string | null;
  conversionStatus: ConversionStatus;
  errorMessage: string | null;
  onVideoSelected: (video: VideoInfo) => void;
  onClearVideo: () => void;
  onPreviewTypeChange: (type: PreviewType) => void;
  onGeneratePreview: () => void;
}

export default function PreviewTab({
  selectedVideo,
  previewType,
  previewPath,
  conversionStatus,
  errorMessage,
  onVideoSelected,
  onClearVideo,
  onPreviewTypeChange,
  onGeneratePreview,
}: PreviewTabProps) {

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0 overflow-hidden">
        {/* Left Side - Controls */}
        <div className="space-y-4 overflow-auto min-h-0">
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

          {/* Preview Type Selection */}
          <div className={selectedVideo ? "" : "opacity-50 pointer-events-none"}>
            <h2 className="text-base font-semibold text-vscode-text mb-2">
              Preview Options
            </h2>
            <PreviewSelector
              previewType={previewType}
              onPreviewTypeChange={onPreviewTypeChange}
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

        {/* Right Side - Preview Display */}
        <div className="overflow-auto min-h-0 flex flex-col">
          {previewPath ? (
            <div className="flex flex-col min-h-0">
              <div className="flex-shrink-0">
                <PreviewDisplay
                  previewPath={previewPath}
                  previewType={previewType}
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-vscode-bg/50 border border-vscode-border rounded-lg p-4 min-h-[200px]">
              <p className="text-sm text-vscode-text-secondary text-center">
                {selectedVideo
                  ? "Click 'Generate Preview' to see the preview here"
                  : "Select a video to generate preview"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Button at bottom center - always visible to prevent jumping */}
      <div className="mt-auto pt-4 flex justify-center flex-shrink-0">
        <button
          onClick={onGeneratePreview}
          disabled={!selectedVideo || conversionStatus === "converting"}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
        >
          Generate Preview
        </button>
      </div>
    </div>
  );
}

