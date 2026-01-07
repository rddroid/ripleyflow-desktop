interface PreviewSelectorProps {
  previewType: "thumbnail" | "clip";
  onPreviewTypeChange: (type: "thumbnail" | "clip") => void;
}

export default function PreviewSelector({
  previewType,
  onPreviewTypeChange,
}: PreviewSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-vscode-text-secondary uppercase tracking-wide">
        Preview Type
      </label>
      <div className="relative inline-flex bg-vscode-bg border border-vscode-border rounded-lg p-1 gap-1">
        <button
          type="button"
          onClick={() => onPreviewTypeChange("thumbnail")}
          className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-in-out min-w-[140px] ${
            previewType === "thumbnail"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-vscode-text-secondary hover:text-vscode-text hover:bg-vscode-panel"
          }`}
        >
          <span className="relative z-10">Thumbnail</span>
          <span className="relative z-10 block text-xs opacity-80 mt-0.5">Single Frame</span>
        </button>
        <button
          type="button"
          onClick={() => onPreviewTypeChange("clip")}
          className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-in-out min-w-[140px] ${
            previewType === "clip"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-vscode-text-secondary hover:text-vscode-text hover:bg-vscode-panel"
          }`}
        >
          <span className="relative z-10">Clip</span>
          <span className="relative z-10 block text-xs opacity-80 mt-0.5">5 seconds</span>
        </button>
      </div>
    </div>
  );
}

