import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface CircularProgressProps {
  progress: number;
  status: "idle" | "converting" | "completed" | "error";
  message?: string;
  onCancel?: () => void;
}

export default function CircularProgress({
  progress,
  status,
  message,
  onCancel,
}: CircularProgressProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Smooth progress updates with animation
  useEffect(() => {
    // Reset display progress when status changes to idle or completed
    if (status === "idle" || status === "completed") {
      setDisplayProgress(0);
      setIsAnimating(false);
      return;
    }

    if (status === "converting") {
      setIsAnimating(true);
      // If progress is very low or stuck, add a subtle pulsing animation
      if (progress < 5) {
        // Gradually increase display progress even if real progress is slow
        const interval = setInterval(() => {
          setDisplayProgress((prev) => {
            if (prev < progress) {
              return progress;
            }
            // Slowly increment if stuck at low values
            if (prev < 5 && progress < 5) {
              return Math.min(prev + 0.1, 5);
            }
            return prev;
          });
        }, 100);
        return () => clearInterval(interval);
      } else {
        // Smooth transition to actual progress
        const targetProgress = Math.max(displayProgress, progress);
        const diff = targetProgress - displayProgress;
        if (diff > 0) {
          const interval = setInterval(() => {
            setDisplayProgress((prev) => {
              if (prev >= progress) {
                setIsAnimating(false);
                return progress;
              }
              return Math.min(prev + diff * 0.1, progress);
            });
          }, 50);
          return () => clearInterval(interval);
        }
      }
    } else {
      setDisplayProgress(progress);
      setIsAnimating(false);
    }
  }, [progress, status]);

  const getStatusColor = () => {
    switch (status) {
      case "converting":
        return "text-blue-400";
      case "completed":
        return "text-green-400";
      case "error":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusBgColor = () => {
    switch (status) {
      case "converting":
        return "stroke-blue-400";
      case "completed":
        return "stroke-green-400";
      case "error":
        return "stroke-red-400";
      default:
        return "stroke-gray-400";
    }
  };

  const handleCancel = async () => {
    try {
      await invoke("cancel_operation");
    } catch (error) {
      console.error("Failed to cancel operation:", error);
    }
    // Always call onCancel to update UI state, even if cancel fails
    if (onCancel) {
      onCancel();
    }
  };

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayProgress / 100) * circumference;

  // Don't show if idle or completed
  if (status === "idle" || status === "completed") {
    return null;
  }

  return (
    <div className="fixed left-0 right-0 top-0 bottom-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative w-32 h-32">
          <svg className="transform -rotate-90 w-32 h-32">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-700/50"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={`transition-all duration-300 ${getStatusBgColor()}`}
            />
          </svg>
          {/* Percentage text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${getStatusColor()} ${isAnimating && displayProgress < 5 ? 'animate-pulse' : ''}`}>
              {Math.round(displayProgress)}%
            </span>
          </div>
        </div>
        {/* Status text */}
        <div className="text-center">
          <p className={`text-lg font-semibold ${getStatusColor()}`}>
            {status === "converting"
              ? "Converting..."
              : "Error"}
          </p>
          {message && (
            <p className="text-sm text-gray-300 mt-2 max-w-xs">{message}</p>
          )}
        </div>
        {/* Cancel Button */}
        {status === "converting" && (
          <button
            onClick={handleCancel}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

