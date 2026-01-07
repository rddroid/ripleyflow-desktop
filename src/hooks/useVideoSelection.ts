import { useState } from "react";
import { VideoInfo } from "./useConversion";

export function useVideoSelection() {
  const [selectedVideo, setSelectedVideo] = useState<VideoInfo | null>(null);
  const [outputPath, setOutputPath] = useState<string | null>(null);
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [denoisedPath, setDenoisedPath] = useState<string | null>(null);

  const handleVideoSelected = (video: VideoInfo, onReset: () => void) => {
    setSelectedVideo(video);
    onReset();
    setOutputPath(null);
    setPreviewPath(null);
    setDenoisedPath(null);
  };

  const handleClearVideo = (onReset: () => void) => {
    setSelectedVideo(null);
    onReset();
    setOutputPath(null);
    setPreviewPath(null);
    setDenoisedPath(null);
  };

  return {
    selectedVideo,
    outputPath,
    previewPath,
    denoisedPath,
    setOutputPath,
    setPreviewPath,
    setDenoisedPath,
    handleVideoSelected,
    handleClearVideo,
  };
}



