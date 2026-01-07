import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface AppSettings {
  workspace_path: string;
}

export function useSettings() {
  const [workspacePath, setWorkspacePath] = useState<string>("");

  const loadSettings = async () => {
    try {
      const settings = await invoke<AppSettings>("load_settings");
      setWorkspacePath(settings.workspace_path || "");
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    workspacePath,
    loadSettings,
  };
}



