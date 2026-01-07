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
  const getStatusColor = () => {
    switch (status) {
      case "converting":
        return "text-blue-400";
      case "completed":
        return "text-green-400";
      case "error":
        return "text-red-400";
      default:
        return "text-vscode-text-secondary";
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

  // Don't show if idle or completed
  if (status === "idle" || status === "completed") {
    return null;
  }

  return (
    <div className="fixed left-0 right-0 top-0 bottom-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        {/* Infinite spinning circle */}
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 animate-spin">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray="40 100"
              strokeLinecap="round"
              className={status === "error" ? "text-red-400" : "text-blue-400"}
              opacity="0.3"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray="20 120"
              strokeLinecap="round"
              className={status === "error" ? "text-red-400" : "text-blue-400"}
            />
          </svg>
        </div>
        {/* Status text */}
        <div className="text-center">
          <p className={`text-lg font-semibold ${getStatusColor()}`}>
            {status === "converting"
              ? "Processing..."
              : "Error"}
          </p>
          {message && (
            <p className="text-sm text-vscode-text-secondary mt-2 max-w-xs break-words">{message}</p>
          )}
        </div>
        {/* Cancel/Close Button */}
        {status === "converting" && (
          <button
            onClick={handleCancel}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
          >
            Cancel
          </button>
        )}
        {status === "error" && (
          <button
            onClick={handleCancel}
            className="mt-4 px-6 py-2 bg-vscode-button-bg text-vscode-button-text rounded-lg hover:bg-vscode-button-hover transition-colors font-medium text-sm"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}

