import { useEffect } from "react";
import Tabs from "./Tabs";
import ConverterTab from "./ConverterTab";
import PreviewTab from "./PreviewTab";
import Denoiser from "./Denoiser";
import { useAppState } from "../hooks/useAppState";
import { ConversionStatus } from "../hooks/useConversion";

interface TabContentProps {
  onConversionStateChange?: (state: {
    conversionStatus: ConversionStatus;
    conversionProgress: number;
    errorMessage: string | null;
    handleCancel: () => void;
  }) => void;
}

export default function TabContent({ onConversionStateChange }: TabContentProps) {
  const {
    activeTab,
    setActiveTab,
    selectedVideo,
    selectedFormat,
    setSelectedFormat,
    previewType,
    setPreviewType,
    outputPath,
    previewPath,
    denoisedPath,
    setDenoisedPath,
    conversionProgress,
    conversionStatus,
    errorMessage,
    setConversionStatus,
    setConversionProgress,
    setErrorMessage,
    handleCancel,
    handleVideoSelected,
    handleClearVideo,
    handleConvert,
    handlePreview,
    workspacePath,
  } = useAppState();

  useEffect(() => {
    onConversionStateChange?.({
      conversionStatus,
      conversionProgress,
      errorMessage,
      handleCancel,
    });
  }, [conversionStatus, conversionProgress, errorMessage, handleCancel, onConversionStateChange]);
  return (
    <div className="bg-vscode-panel rounded-lg p-4 flex flex-col h-full border border-vscode-border overflow-hidden min-h-0">
      <div className="flex-shrink-0">
        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden mt-4">
      {activeTab === "converter" && (
        <ConverterTab
          selectedVideo={selectedVideo}
          selectedFormat={selectedFormat}
          outputPath={outputPath}
          conversionStatus={conversionStatus}
          errorMessage={errorMessage}
          onVideoSelected={handleVideoSelected}
          onClearVideo={handleClearVideo}
          onFormatChange={setSelectedFormat}
          onConvert={handleConvert}
        />
      )}

      {activeTab === "preview" && (
        <PreviewTab
          selectedVideo={selectedVideo}
          previewType={previewType}
          previewPath={previewPath}
          conversionStatus={conversionStatus}
          errorMessage={errorMessage}
          onVideoSelected={handleVideoSelected}
          onClearVideo={handleClearVideo}
          onPreviewTypeChange={setPreviewType}
          onGeneratePreview={handlePreview}
        />
      )}

      {activeTab === "denoiser" && (
        <Denoiser
          selectedVideo={selectedVideo}
          conversionStatus={conversionStatus}
          errorMessage={errorMessage}
          denoisedPath={denoisedPath}
          workspacePath={workspacePath}
          onVideoSelected={handleVideoSelected}
          onClearVideo={handleClearVideo}
          onStatusChange={setConversionStatus}
          onProgressChange={setConversionProgress}
          onErrorChange={setErrorMessage}
          onDenoisedPathChange={setDenoisedPath}
        />
      )}
      </div>
    </div>
  );
}
