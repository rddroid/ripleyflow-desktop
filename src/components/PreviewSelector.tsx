interface PreviewSelectorProps {
  previewType: "thumbnail" | "clip";
  onPreviewTypeChange: (type: "thumbnail" | "clip") => void;
}

export default function PreviewSelector({
  previewType,
  onPreviewTypeChange,
}: PreviewSelectorProps) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-300">
        Preview Type
      </label>
      <div className="flex space-x-3">
        <label className="flex items-center space-x-1.5 cursor-pointer">
          <input
            type="radio"
            name="previewType"
            value="thumbnail"
            checked={previewType === "thumbnail"}
            onChange={() => onPreviewTypeChange("thumbnail")}
            className="w-3.5 h-3.5 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-200">Thumbnail (Single Frame)</span>
        </label>
        <label className="flex items-center space-x-1.5 cursor-pointer">
          <input
            type="radio"
            name="previewType"
            value="clip"
            checked={previewType === "clip"}
            onChange={() => onPreviewTypeChange("clip")}
            className="w-3.5 h-3.5 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-200">Clip (5 seconds)</span>
        </label>
      </div>
    </div>
  );
}

