import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BackupHealth, PreferredTool, ProjectBackupInfo } from "../types";

interface AppStore {
  activeTool: PreferredTool | null;
  setActiveTool: (tool: PreferredTool | null) => void;
  backupHealth: BackupHealth;
  backupSummary: string;
  setBackupStatus: (health: BackupHealth, summary: string) => void;
  backupItems: ProjectBackupInfo[];
  setBackupItems: (items: ProjectBackupInfo[]) => void;
  backupScanning: boolean;
  setBackupScanning: (scanning: boolean) => void;
  lastBackupScan: Date | null;
  setLastBackupScan: (date: Date | null) => void;
  runBackupScan: ((options?: { manual?: boolean }) => Promise<void>) | null;
  registerBackupScan: (
    fn: (options?: { manual?: boolean }) => Promise<void>,
  ) => void;
}

const AppStoreContext = createContext<AppStore | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeTool, setActiveTool] = useState<PreferredTool | null>(null);
  const [backupHealth, setBackupHealth] = useState<BackupHealth>("ok");
  const [backupSummary, setBackupSummary] = useState("all synced");
  const [backupItems, setBackupItems] = useState<ProjectBackupInfo[]>([]);
  const [backupScanning, setBackupScanning] = useState(false);
  const [lastBackupScan, setLastBackupScan] = useState<Date | null>(null);
  const [runBackupScan, setRunBackupScan] = useState<
    ((options?: { manual?: boolean }) => Promise<void>) | null
  >(null);

  function setBackupStatus(health: BackupHealth, summary: string) {
    setBackupHealth(health);
    setBackupSummary(summary);
  }

  const registerBackupScan = useCallback(
    (fn: (options?: { manual?: boolean }) => Promise<void>) => {
      setRunBackupScan(() => fn);
    },
    [],
  );

  const value = useMemo(
    () => ({
      activeTool,
      setActiveTool,
      backupHealth,
      backupSummary,
      setBackupStatus,
      backupItems,
      setBackupItems,
      backupScanning,
      setBackupScanning,
      lastBackupScan,
      setLastBackupScan,
      runBackupScan,
      registerBackupScan,
    }),
    [
      activeTool,
      backupHealth,
      backupSummary,
      backupItems,
      backupScanning,
      lastBackupScan,
      runBackupScan,
      registerBackupScan,
    ],
  );

  return (
    <AppStoreContext.Provider value={value}>
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore(): AppStore {
  const ctx = useContext(AppStoreContext);
  if (!ctx) {
    throw new Error("useAppStore must be used within AppProvider");
  }
  return ctx;
}
