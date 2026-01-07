import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export interface VideoInfo {
  path: string;
  name: string;
  size: number;
}

export type ConversionStatus = "idle" | "converting" | "completed" | "error";
export type PreviewType = "thumbnail" | "clip";

export function useConversion() {
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionStatus, setConversionStatus] = useState<ConversionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Listen for conversion progress events
  useEffect(() => {
    const progressUnlisten = listen<number>("conversion-progress", (event) => {
      setConversionProgress(event.payload);
    });

    return () => {
      progressUnlisten.then((unlisten) => unlisten());
    };
  }, []);

  const resetConversion = () => {
    setConversionStatus("idle");
    setConversionProgress(0);
    setErrorMessage(null);
  };

  const handleCancel = () => {
    resetConversion();
  };

  return {
    conversionProgress,
    conversionStatus,
    errorMessage,
    setConversionProgress,
    setConversionStatus,
    setErrorMessage,
    resetConversion,
    handleCancel,
  };
}



