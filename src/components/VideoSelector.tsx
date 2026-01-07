import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface VideoInfo {
  path: string;
  name: string;
  size: number;
}

interface VideoSelectorProps {
  onVideoSelected: (video: VideoInfo) => void;
}

export default function VideoSelector({ onVideoSelected }: VideoSelectorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectVideo = async () => {
    setIsLoading(true);
    try {
      const video = await invoke<VideoInfo>("select_video");
      onVideoSelected(video);
    } catch (error) {
      console.error("Error selecting video:", error);
      alert(`Error selecting video: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => 
      file.type.startsWith('video/') || 
      /\.(mp4|avi|mov|mkv|webm|flv|wmv|m4v)$/i.test(file.name)
    );

    if (videoFile) {
      // For drag and drop, we'll use the file path directly
      // Note: Tauri's file dialog is more reliable, but we can handle dropped files
      const videoInfo: VideoInfo = {
        path: (videoFile as any).path || videoFile.name,
        name: videoFile.name,
        size: videoFile.size,
      };
      onVideoSelected(videoInfo);
    } else {
      alert("Please drop a valid video file");
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
        isDragging
          ? "border-blue-500 bg-blue-900/20"
          : "border-vscode-border bg-vscode-bg hover:border-vscode-text-secondary"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center space-y-2">
        <svg
          className="w-12 h-12 text-vscode-text-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <div>
          <p className="text-sm font-medium text-vscode-text">
            Select a video file
          </p>
          <p className="text-xs text-vscode-text-secondary mt-1">
            Drag and drop a video file here, or click to browse
          </p>
        </div>
        <button
          onClick={handleSelectVideo}
          disabled={isLoading}
          className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Loading..." : "Browse Files"}
        </button>
      </div>
    </div>
  );
}

