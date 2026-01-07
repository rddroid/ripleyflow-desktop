import { useState, useEffect } from "react";
import { useSettings } from "./useSettings";
import { useConversion } from "./useConversion";
import { useVideoSelection } from "./useVideoSelection";
import { useVideoOperations } from "./useVideoOperations";
import { PreviewType } from "./useConversion";

export function useAppState() {
  const [activeTab, setActiveTab] = useState<"converter" | "preview" | "denoiser">("converter");
  const [selectedFormat, setSelectedFormat] = useState("mp4");
  const [previewType, setPreviewType] = useState<PreviewType>("thumbnail");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { workspacePath, loadSettings } = useSettings();
  const {
    conversionProgress,
    conversionStatus,
    errorMessage,
    setConversionStatus,
    setConversionProgress,
    setErrorMessage,
    resetConversion,
    handleCancel,
  } = useConversion();

  const {
    selectedVideo,
    outputPath,
    previewPath,
    denoisedPath,
    setOutputPath,
    setPreviewPath,
    setDenoisedPath,
    handleVideoSelected: baseHandleVideoSelected,
    handleClearVideo: baseHandleClearVideo,
  } = useVideoSelection();

  // Clear preview when preview type changes
  useEffect(() => {
    setPreviewPath(null);
  }, [previewType, setPreviewPath]);

  const handleVideoSelected = (video: Parameters<typeof baseHandleVideoSelected>[0]) => {
    baseHandleVideoSelected(video, resetConversion);
  };

  const handleClearVideo = () => {
    baseHandleClearVideo(resetConversion);
  };

  const { handleConvertVideo, handleGeneratePreview } = useVideoOperations({
    selectedVideo,
    workspacePath,
    setConversionStatus,
    setConversionProgress,
    setErrorMessage,
    resetConversion,
    setOutputPath,
    setPreviewPath,
  });

  const handleSettingsSaved = async () => {
    await loadSettings();
  };

  const handleConvert = () => handleConvertVideo(selectedFormat);
  const handlePreview = () => handleGeneratePreview(previewType);

  return {
    // Tab state
    activeTab,
    setActiveTab,
    
    // Video selection
    selectedVideo,
    selectedFormat,
    setSelectedFormat,
    previewType,
    setPreviewType,
    handleVideoSelected,
    handleClearVideo,
    
    // Paths
    outputPath,
    previewPath,
    denoisedPath,
    setDenoisedPath,
    
    // Conversion state
    conversionProgress,
    conversionStatus,
    errorMessage,
    setConversionStatus,
    setConversionProgress,
    setErrorMessage,
    handleCancel,
    
    // Operations
    handleConvert,
    handlePreview,
    
    // Settings
    workspacePath,
    isSettingsOpen,
    setIsSettingsOpen,
    handleSettingsSaved,
  };
}

