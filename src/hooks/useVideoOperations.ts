import { invoke } from "@tauri-apps/api/core";
import { VideoInfo, PreviewType, ConversionStatus } from "./useConversion";
import { getOutputPath, getPreviewPath } from "../utils/pathUtils";

interface UseVideoOperationsParams {
  selectedVideo: VideoInfo | null;
  workspacePath: string;
  setConversionStatus: (status: ConversionStatus) => void;
  setConversionProgress: (progress: number) => void;
  setErrorMessage: (error: string | null) => void;
  resetConversion: () => void;
  setOutputPath: (path: string | null) => void;
  setPreviewPath: (path: string | null) => void;
}

export function useVideoOperations({
  selectedVideo,
  workspacePath,
  setConversionStatus,
  setConversionProgress,
  setErrorMessage,
  resetConversion,
  setOutputPath,
  setPreviewPath,
}: UseVideoOperationsParams) {
  const handleConvertVideo = async (format: string) => {
    if (!selectedVideo) {
      setErrorMessage("Please select a video first");
      return;
    }

    setConversionStatus("converting");
    setConversionProgress(0);
    setErrorMessage(null);
    setOutputPath(null);

    try {
      const outputPathValue = getOutputPath(selectedVideo.path, format, workspacePath);
      const result = await invoke<string>("convert_video", {
        options: {
          input_path: selectedVideo.path,
          output_path: outputPathValue,
          format: format,
        },
      });

      setOutputPath(result);
      setConversionStatus("completed");
      setConversionProgress(100);
      setTimeout(() => {
        setConversionStatus("idle");
        setConversionProgress(0);
      }, 500);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes("Operation cancelled by user") || errorMsg.includes("cancelled")) {
        resetConversion();
      } else {
        setErrorMessage(`Error converting video: ${errorMsg}`);
        setConversionStatus("error");
        setConversionProgress(0);
      }
    }
  };

  const handleGeneratePreview = async (previewType: PreviewType) => {
    if (!selectedVideo) {
      setErrorMessage("Please select a video first");
      return;
    }

    setConversionStatus("converting");
    setConversionProgress(0);
    setErrorMessage(null);
    setPreviewPath(null);

    try {
      const previewPathValue = getPreviewPath(selectedVideo.path, previewType, workspacePath);
      const result = await invoke<string>("generate_preview", {
        options: {
          input_path: selectedVideo.path,
          output_path: previewPathValue,
          preview_type: previewType,
          timestamp: 1.0,
        },
      });

      setPreviewPath(result);
      setConversionStatus("completed");
      setConversionProgress(100);
      setTimeout(() => {
        setConversionStatus("idle");
        setConversionProgress(0);
      }, 500);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes("Operation cancelled by user") || errorMsg.includes("cancelled")) {
        resetConversion();
      } else {
        setErrorMessage(`Error generating preview: ${errorMsg}`);
        setConversionStatus("error");
        setConversionProgress(0);
      }
    }
  };

  return {
    handleConvertVideo,
    handleGeneratePreview,
  };
}



