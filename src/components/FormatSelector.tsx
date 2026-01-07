import { useState, useRef, useEffect } from "react";

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
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedFormatData = formats.find(f => f.value === selectedFormat);

  // Get display text for input
  const getDisplayText = () => {
    if (isFocused) {
      return searchQuery;
    }
    if (selectedFormatData) {
      return `${selectedFormatData.label} - ${selectedFormatData.description} ${selectedFormatData.browserCompatible ? "✓ Browser" : "▲ External Player"}`;
    }
    return "";
  };

  // Filter formats based on search query
  const filteredFormats = formats.filter(format => {
    if (!searchQuery.trim()) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      format.label.toLowerCase().includes(searchLower) ||
      format.description.toLowerCase().includes(searchLower) ||
      format.value.toLowerCase().includes(searchLower)
    );
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFocused(false);
        setSearchQuery("");
        setHighlightedIndex(-1);
      }
    };

    if (isFocused) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFocused]);

  // Reset highlighted index when filtered results change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchQuery]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.children;
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsFocused(false);
      setSearchQuery("");
      setHighlightedIndex(-1);
      inputRef.current?.blur();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < filteredFormats.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredFormats.length) {
        handleSelectFormat(filteredFormats[highlightedIndex].value);
      } else if (filteredFormats.length === 1) {
        handleSelectFormat(filteredFormats[0].value);
      }
    }
  };

  const handleSelectFormat = (formatValue: string) => {
    onFormatChange(formatValue);
    setIsFocused(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsFocused(true);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    setSearchQuery("");
  };

  // Highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <>
        {parts.map((part, index) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={index} className="bg-blue-600/30 text-vscode-text px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const showSuggestions = isFocused && filteredFormats.length > 0;

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-vscode-text">
        Output Format
      </label>
      <div className="relative" ref={dropdownRef}>
        {/* Search Input */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={getDisplayText()}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder="Search formats (e.g., MP4, WebM, H.264)..."
            className="w-full px-3 py-1.5 pr-10 text-sm border border-vscode-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-vscode-bg text-vscode-text placeholder-vscode-text-secondary outline-none"
          />
          {/* Search Icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className="w-4 h-4 text-vscode-text-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Autocomplete Suggestions */}
        {showSuggestions && (
          <div className="absolute z-50 w-full mt-1 bg-vscode-panel border border-vscode-border rounded-lg shadow-lg max-h-48 overflow-hidden">
            <div ref={listRef} className="overflow-y-auto max-h-48">
              {filteredFormats.map((format, index) => {
                const isSelected = format.value === selectedFormat;
                const isHighlighted = index === highlightedIndex;
                const fullText = `${format.label} - ${format.description}`;
                
                return (
                  <button
                    key={format.value}
                    type="button"
                    onClick={() => handleSelectFormat(format.value)}
                    className={`w-full px-2 py-1 text-xs text-left transition-colors ${
                      isHighlighted || isSelected
                        ? "bg-blue-600/20 text-vscode-text"
                        : "text-vscode-text hover:bg-vscode-bg"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs">
                          {searchQuery ? highlightText(format.label, searchQuery) : format.label}
                        </div>
                        <div className="text-[10px] text-vscode-text-secondary leading-tight">
                          {searchQuery ? highlightText(format.description, searchQuery) : format.description}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {format.browserCompatible ? (
                          <span className="text-green-400 text-[10px]">✓ Browser</span>
                        ) : (
                          <span className="text-yellow-400 text-[10px]">▲ External Player</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {selectedFormatData && !selectedFormatData.browserCompatible && (
        <p className="text-xs text-yellow-400 mt-1">
          ⚠ This format cannot be played in the browser. Use "Open in External Player" button after conversion.
        </p>
      )}
    </div>
  );
}

