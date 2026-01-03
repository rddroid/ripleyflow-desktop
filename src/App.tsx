import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import VideoSelector from "./components/VideoSelector";
import FormatSelector from "./components/FormatSelector";
import PreviewSelector from "./components/PreviewSelector";
import CircularProgress from "./components/CircularProgress";
import VideoList from "./components/VideoList";
import PreviewDisplay from "./components/PreviewDisplay";
import VideoPlayer from "./components/VideoPlayer";
import Tabs from "./components/Tabs";
import Footer from "./components/Footer";
import Header from "./components/Header";
import SettingsDialog from "./components/SettingsDialog";

interface VideoInfo {
  path: string;
  name: string;
  size: number;
}

type ConversionStatus = "idle" | "converting" | "completed" | "error";
type PreviewType = "thumbnail" | "clip";

interface AppSettings {
  workspace_path: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<"converter" | "preview">("converter");
  const [selectedVideo, setSelectedVideo] = useState<VideoInfo | null>(null);
  const [selectedFormat, setSelectedFormat] = useState("mp4");
  const [previewType, setPreviewType] = useState<PreviewType>("thumbnail");
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionStatus, setConversionStatus] = useState<ConversionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [outputPath, setOutputPath] = useState<string | null>(null);
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [workspacePath, setWorkspacePath] = useState<string>("");

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Listen for conversion progress events
  useEffect(() => {
    const progressUnlisten = listen<number>("conversion-progress", (event) => {
      setConversionProgress(event.payload);
    });

    return () => {
      progressUnlisten.then((unlisten) => unlisten());
    };
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await invoke<AppSettings>("load_settings");
      setWorkspacePath(settings.workspace_path || "");
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const handleSettingsSaved = async () => {
    await loadSettings();
  };

  const handleVideoSelected = (video: VideoInfo) => {
    setSelectedVideo(video);
    setConversionStatus("idle");
    setConversionProgress(0);
    setErrorMessage(null);
    setOutputPath(null);
    setPreviewPath(null);
  };

  const handleClearVideo = () => {
    setSelectedVideo(null);
    setConversionStatus("idle");
    setConversionProgress(0);
    setErrorMessage(null);
    setOutputPath(null);
    setPreviewPath(null);
  };

  const getOutputPath = (inputPath: string, format: string): string => {
    if (!workspacePath) {
      // Fallback to original location if workspace path is not set
      const lastDotIndex = inputPath.lastIndexOf(".");
      if (lastDotIndex > 0 && lastDotIndex < inputPath.length - 1) {
        return inputPath.substring(0, lastDotIndex) + "." + format;
      } else {
        return inputPath + "." + format;
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
    
    return workspace + fileNameWithoutExt + "." + format;
  };

  const getPreviewPath = (inputPath: string, previewType: PreviewType): string => {
    const extension = previewType === "thumbnail" ? "jpg" : "mp4";
    
    if (!workspacePath) {
      // Fallback to original location if workspace path is not set
      const pathParts = inputPath.split(".");
      return pathParts.slice(0, -1).join(".") + `_preview.${extension}`;
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
    
    return workspace + fileNameWithoutExt + `_preview.${extension}`;
  };

  const handleGeneratePreview = async () => {
    if (!selectedVideo) {
      setErrorMessage("Please select a video first");
      return;
    }

    setConversionStatus("converting");
    setConversionProgress(0);
    setErrorMessage(null);
    setPreviewPath(null);

    try {
      const previewPath = getPreviewPath(selectedVideo.path, previewType);
      const result = await invoke<string>("generate_preview", {
        options: {
          input_path: selectedVideo.path,
          output_path: previewPath,
          preview_type: previewType,
          timestamp: 1.0,
        },
      });

      setPreviewPath(result);
      setConversionStatus("completed");
      setConversionProgress(100);
      // Reset progress after a short delay
      setTimeout(() => {
        setConversionStatus("idle");
        setConversionProgress(0);
      }, 500);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      // Check if operation was cancelled
      if (errorMsg.includes("Operation cancelled by user") || errorMsg.includes("cancelled")) {
        // Silently handle cancellation - overlay already disappeared via onCancel
        setConversionStatus("idle");
        setConversionProgress(0);
        setErrorMessage(null);
      } else {
        setErrorMessage(`Error generating preview: ${errorMsg}`);
        setConversionStatus("error");
        setConversionProgress(0);
      }
    }
  };

  const handleConvertVideo = async () => {
    if (!selectedVideo) {
      setErrorMessage("Please select a video first");
      return;
    }

    setConversionStatus("converting");
    setConversionProgress(0);
    setErrorMessage(null);
    setOutputPath(null);

    try {
      const outputPath = getOutputPath(selectedVideo.path, selectedFormat);
      const result = await invoke<string>("convert_video", {
        options: {
          input_path: selectedVideo.path,
          output_path: outputPath,
          format: selectedFormat,
        },
      });

      setOutputPath(result);
      setConversionStatus("completed");
      setConversionProgress(100);
      // Reset progress after a short delay
      setTimeout(() => {
        setConversionStatus("idle");
        setConversionProgress(0);
      }, 500);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      // Check if operation was cancelled
      if (errorMsg.includes("Operation cancelled by user") || errorMsg.includes("cancelled")) {
        // Silently handle cancellation - overlay already disappeared via onCancel
        setConversionStatus("idle");
        setConversionProgress(0);
        setErrorMessage(null);
      } else {
        setErrorMessage(`Error converting video: ${errorMsg}`);
        setConversionStatus("error");
        setConversionProgress(0);
      }
    }
  };

  return (
    <div className="h-screen bg-gray-900 overflow-auto flex flex-col relative">
      {/* Circular Progress Overlay */}
      {conversionStatus !== "idle" && (
        <CircularProgress
          progress={conversionProgress}
          status={conversionStatus}
          message={errorMessage || undefined}
          onCancel={() => {
            setConversionStatus("idle");
            setConversionProgress(0);
            setErrorMessage(null);
          }}
        />
      )}
      
      {/* Sticky Header */}
      <div className="px-2 pt-2 relative z-50">
        <div className="bg-gray-800 rounded-lg shadow-lg">
          <Header onSettingsClick={() => setIsSettingsOpen(true)} />
        </div>
      </div>
      
      {/* Settings Dialog */}
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          handleSettingsSaved();
        }}
      />
      
      <div className="flex-1 px-2 py-2 relative z-10">
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 space-y-4 flex flex-col min-h-full">
          {/* Tabs */}
          <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Video Converter Tab */}
          {activeTab === "converter" && (
            <div className="grid grid-cols-2 gap-4">
              {/* Left Side - Controls */}
              <div className="space-y-4">
                {/* Video Selection */}
                <div>
                  <h2 className="text-base font-semibold text-gray-200 mb-2">
                    Select Video
                  </h2>
                  {!selectedVideo ? (
                    <VideoSelector onVideoSelected={handleVideoSelected} />
                  ) : (
                    <VideoList video={selectedVideo} onClear={handleClearVideo} />
                  )}
                </div>

                {/* Format Selection */}
                {selectedVideo && (
                  <div>
                    <h2 className="text-base font-semibold text-gray-200 mb-2">
                      Choose Output Format
                    </h2>
                    <FormatSelector
                      selectedFormat={selectedFormat}
                      onFormatChange={setSelectedFormat}
                    />
                  </div>
                )}

                {/* Convert Button */}
                {selectedVideo && (
                  <button
                    onClick={handleConvertVideo}
                    disabled={conversionStatus === "converting"}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                  >
                    Convert Video
                  </button>
                )}


                {/* Error Display */}
                {errorMessage && conversionStatus === "error" && (
                  <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
                    <p className="text-xs font-medium text-red-400 mb-1">Error</p>
                    <p className="text-xs text-red-300">{errorMessage}</p>
                  </div>
                )}
              </div>

              {/* Right Side - Video Player */}
              <div>
                {outputPath ? (
                  <div>
                    <h2 className="text-base font-semibold text-gray-200 mb-2">
                      Converted Video
                    </h2>
                    <VideoPlayer videoPath={outputPath} />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-700/50 border border-gray-600 rounded-lg p-4 min-h-[200px]">
                    <p className="text-sm text-gray-400 text-center">
                      {selectedVideo
                        ? "Click 'Convert Video' to see the converted video here"
                        : "Select a video to convert"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preview Generation Tab */}
          {activeTab === "preview" && (
            <div className="grid grid-cols-2 gap-4">
              {/* Left Side - Controls */}
              <div className="space-y-4">
                {/* Video Selection */}
                <div>
                  <h2 className="text-base font-semibold text-gray-200 mb-2">
                    Select Video
                  </h2>
                  {!selectedVideo ? (
                    <VideoSelector onVideoSelected={handleVideoSelected} />
                  ) : (
                    <VideoList video={selectedVideo} onClear={handleClearVideo} />
                  )}
                </div>

                {/* Preview Type Selection */}
                {selectedVideo && (
                  <div>
                    <h2 className="text-base font-semibold text-gray-200 mb-2">
                      Preview Options
                    </h2>
                    <PreviewSelector
                      previewType={previewType}
                      onPreviewTypeChange={setPreviewType}
                    />
                  </div>
                )}

                {/* Generate Preview Button */}
                {selectedVideo && (
                  <button
                    onClick={handleGeneratePreview}
                    disabled={conversionStatus === "converting"}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                  >
                    Generate Preview
                  </button>
                )}


                {/* Error Display */}
                {errorMessage && conversionStatus === "error" && (
                  <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
                    <p className="text-xs font-medium text-red-400 mb-1">Error</p>
                    <p className="text-xs text-red-300">{errorMessage}</p>
                  </div>
                )}
              </div>

              {/* Right Side - Preview Display */}
              <div>
                {previewPath ? (
                  <div>
                    <h2 className="text-base font-semibold text-gray-200 mb-2">
                      Preview
                    </h2>
                    <PreviewDisplay
                      previewPath={previewPath}
                      previewType={previewType}
                    />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-700/50 border border-gray-600 rounded-lg p-4 min-h-[200px]">
                    <p className="text-sm text-gray-400 text-center">
                      {selectedVideo
                        ? "Click 'Generate Preview' to see the preview here"
                        : "Select a video to generate preview"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
      {/* Sticky Footer */}
      <div className="px-2 pb-2 relative z-50">
        <div className="bg-gray-800 rounded-lg shadow-lg">
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default App;

