interface TabsProps {
  activeTab: "converter" | "preview" | "denoiser";
  onTabChange: (tab: "converter" | "preview" | "denoiser") => void;
}

export default function Tabs({ activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex border-b border-vscode-border mb-4">
      <button
        onClick={() => onTabChange("converter")}
        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
          activeTab === "converter"
            ? "text-blue-400 border-b-2 border-blue-400"
            : "text-vscode-text-secondary hover:text-vscode-text"
        }`}
      >
        Video Converter
      </button>
      <button
        onClick={() => onTabChange("preview")}
        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
          activeTab === "preview"
            ? "text-blue-400 border-b-2 border-blue-400"
            : "text-vscode-text-secondary hover:text-vscode-text"
        }`}
      >
        Preview Generation
      </button>
      <button
        onClick={() => onTabChange("denoiser")}
        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
          activeTab === "denoiser"
            ? "text-blue-400 border-b-2 border-blue-400"
            : "text-vscode-text-secondary hover:text-vscode-text"
        }`}
      >
        Video Denoiser
      </button>
    </div>
  );
}

