interface TabsProps {
  activeTab: "converter" | "preview";
  onTabChange: (tab: "converter" | "preview") => void;
}

export default function Tabs({ activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex border-b border-gray-700 mb-4">
      <button
        onClick={() => onTabChange("converter")}
        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
          activeTab === "converter"
            ? "text-blue-400 border-b-2 border-blue-400"
            : "text-gray-400 hover:text-gray-200"
        }`}
      >
        Video Converter
      </button>
      <button
        onClick={() => onTabChange("preview")}
        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
          activeTab === "preview"
            ? "text-blue-400 border-b-2 border-blue-400"
            : "text-gray-400 hover:text-gray-200"
        }`}
      >
        Preview Generation
      </button>
    </div>
  );
}

