import { IoSettingsOutline } from "react-icons/io5";

interface HeaderProps {
  onSettingsClick: () => void;
}

export default function Header({ onSettingsClick }: HeaderProps) {
  return (
    <header className="sticky top-0 flex items-center justify-between px-4 py-1.5 border-b border-vscode-border bg-vscode-panel">
      <h1 className="text-lg font-bold text-vscode-text">
        RipleyFlow
      </h1>
      <button
        onClick={onSettingsClick}
        className="p-1.5 text-vscode-text-secondary hover:text-vscode-text hover:bg-vscode-bg rounded-lg transition-colors"
        aria-label="Settings"
        title="Settings"
      >
        <IoSettingsOutline className="h-4 w-4" />
      </button>
    </header>
  );
}

