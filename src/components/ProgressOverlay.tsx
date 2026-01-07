import CircularProgress from "./CircularProgress";
import { ConversionStatus } from "../hooks/useConversion";

interface ProgressOverlayProps {
  conversionStatus: ConversionStatus;
  conversionProgress: number;
  errorMessage: string | null;
  onCancel: () => void;
}

export default function ProgressOverlay({
  conversionStatus,
  conversionProgress,
  errorMessage,
  onCancel,
}: ProgressOverlayProps) {
  if (conversionStatus === "idle") {
    return null;
  }

  return (
    <CircularProgress
      progress={conversionProgress}
      status={conversionStatus}
      message={errorMessage || undefined}
      onCancel={onCancel}
    />
  );
}



