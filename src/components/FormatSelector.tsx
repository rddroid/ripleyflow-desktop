interface FormatSelectorProps {
  selectedFormat: string;
  onFormatChange: (format: string) => void;
}

const formats = [
  { value: "mp4", label: "MP4", description: "H.264/AAC", browserCompatible: true },
  { value: "avi", label: "AVI", description: "H.264/MP3", browserCompatible: false },
  { value: "mov", label: "MOV", description: "H.264/AAC", browserCompatible: false },
  { value: "mkv", label: "MKV", description: "H.264/AAC", browserCompatible: false },
  { value: "webm", label: "WebM", description: "VP9/Opus", browserCompatible: true },
];

export default function FormatSelector({
  selectedFormat,
  onFormatChange,
}: FormatSelectorProps) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-300">
        Output Format
      </label>
      <select
        value={selectedFormat}
        onChange={(e) => onFormatChange(e.target.value)}
        className="w-full px-3 py-1.5 text-sm border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-gray-100"
      >
        {formats.map((format) => (
          <option key={format.value} value={format.value} className="bg-gray-700">
            {format.label} - {format.description} {format.browserCompatible ? "✓ Browser" : "⚠ External Player"}
          </option>
        ))}
      </select>
      {!formats.find(f => f.value === selectedFormat)?.browserCompatible && (
        <p className="text-xs text-yellow-400 mt-1">
          ⚠ This format cannot be played in the browser. Use "Open in External Player" button after conversion.
        </p>
      )}
    </div>
  );
}

