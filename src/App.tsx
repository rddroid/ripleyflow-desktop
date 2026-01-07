import { useState } from "react";
import Footer from "./components/Footer";
import Header from "./components/Header";
import SettingsDialog from "./components/SettingsDialog";
import TabContent from "./components/TabContent";
import ProgressOverlay from "./components/ProgressOverlay";
import { useSettings } from "./hooks/useSettings";
import { ConversionStatus } from "./hooks/useConversion";

function App() {
  const [conversionStatus, setConversionStatus] = useState<ConversionStatus>("idle");
  const [conversionProgress, setConversionProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [handleCancel, setHandleCancel] = useState<(() => void) | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { loadSettings } = useSettings();

  const handleSettingsSaved = async () => {
    await loadSettings();
  };

  return (
    <div className="h-full bg-vscode-bg overflow-hidden flex flex-col relative min-h-0">
      {conversionStatus !== "idle" && handleCancel && (
        <ProgressOverlay
          conversionStatus={conversionStatus}
          conversionProgress={conversionProgress}
          errorMessage={errorMessage}
          onCancel={handleCancel}
        />
      )}
      
      <div className="px-2 pt-1 relative z-50 flex-shrink-0">
        <div className="bg-vscode-panel rounded-lg border border-vscode-border">
          <Header onSettingsClick={() => setIsSettingsOpen(true)} />
        </div>
      </div>
      
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          handleSettingsSaved();
        }}
      />
      
      <div className="flex-1 px-2 py-2 relative z-10 min-h-0 overflow-hidden">
        <TabContent
          onConversionStateChange={(state) => {
            setConversionStatus(state.conversionStatus);
            setConversionProgress(state.conversionProgress);
            setErrorMessage(state.errorMessage);
            setHandleCancel(() => state.handleCancel);
          }}
        />
      </div>
      
      <div className="px-2 pb-2 relative z-50 flex-shrink-0">
        <div className="bg-vscode-panel rounded-lg border border-vscode-border">
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default App;

