import { createContext, useContext, useEffect, useState } from "react";

interface PreferencesContextType {
  showHiddenFiles: boolean;
  setShowHiddenFiles: (show: boolean) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [showHiddenFiles, setShowHiddenFiles] = useState<boolean>(() => {
    const saved = localStorage.getItem("showHiddenFiles");
    return saved ? (JSON.parse(saved) as boolean) : false;
  });

  useEffect(() => {
    localStorage.setItem("showHiddenFiles", JSON.stringify(showHiddenFiles));
  }, [showHiddenFiles]);

  return (
    <PreferencesContext.Provider value={{ showHiddenFiles, setShowHiddenFiles }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}
