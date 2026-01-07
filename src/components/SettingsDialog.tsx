import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { IoMdClose } from "react-icons/io";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AppSettings {
  workspace_path: string;
}

export default function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [settings, setSettings] = useState<AppSettings>({ workspace_path: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const loadedSettings = await invoke<AppSettings>("load_settings");
      setSettings(loadedSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFolder = async () => {
    try {
      const folderPath = await invoke<string>("select_workspace_folder");
      setSettings({ ...settings, workspace_path: folderPath });
    } catch (err) {
      if (err instanceof Error && !err.message.includes("cancelled")) {
        setError(err.message);
      }
    }
  };

  const handleSave = async () => {
    if (!settings.workspace_path.trim()) {
      setError("Workspace path is required");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await invoke("save_settings", { settings });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-vscode-panel rounded-lg shadow-xl w-full max-w-md mx-4 border border-vscode-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-vscode-border">
          <h2 className="text-xl font-bold text-vscode-text">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 text-vscode-text-secondary hover:text-vscode-text hover:bg-vscode-bg rounded-lg transition-colors"
            aria-label="Close"
          >
            <IoMdClose className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-vscode-text-secondary">Loading settings...</p>
            </div>
          ) : (
            <>
              {/* Workspace Path */}
              <div>
                <label className="block text-sm font-medium text-vscode-text mb-2">
                  Workspace Path
                </label>
                <p className="text-xs text-vscode-text-secondary mb-2">
                  Location where converted videos and previews will be saved
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.workspace_path}
                    onChange={(e) =>
                      setSettings({ ...settings, workspace_path: e.target.value })
                    }
                    placeholder="Select a folder..."
                    className="flex-1 px-3 py-2 bg-vscode-bg text-vscode-text rounded-lg border border-vscode-border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <button
                    onClick={handleSelectFolder}
                    className="px-4 py-2 bg-vscode-bg text-vscode-text rounded-lg hover:bg-vscode-sidebar transition-colors text-sm font-medium border border-vscode-border"
                  >
                    Browse
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
                  <p className="text-xs text-green-400">Settings saved successfully!</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-vscode-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-vscode-text-secondary hover:text-vscode-text transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saving || !settings.workspace_path.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

