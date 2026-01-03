import { IoSettingsOutline } from "react-icons/io5";

interface HeaderProps {
  onSettingsClick: () => void;
}

export default function Header({ onSettingsClick }: HeaderProps) {
  return (
    <header className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
      <h1 className="text-xl font-bold text-white">
        RipleyFlow
      </h1>
      <button
        onClick={onSettingsClick}
        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        aria-label="Settings"
        title="Settings"
      >
        <IoSettingsOutline className="h-5 w-5" />
      </button>
    </header>
  );
}

