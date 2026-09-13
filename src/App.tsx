import { useEffect, useState } from "react";
import type { ModuleId } from "./types";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { StatusBar } from "./components/StatusBar";
import { ProjectTree } from "./modules/ProjectTree";
import { AILauncher } from "./modules/AILauncher";
import { BackupGuardian } from "./modules/BackupGuardian";
import { IncomeTracker } from "./modules/IncomeTracker";
import { useAppStore } from "./store/appStore";
import { useBackupMonitor } from "./hooks/useBackupMonitor";

function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>("project-tree");
  const {
    activeTool,
    backupHealth,
    backupSummary,
    incomeMonthTotal,
    refreshIncome,
  } = useAppStore();

  useBackupMonitor();

  useEffect(() => {
    void refreshIncome();
  }, [refreshIncome]);

  function renderModule() {
    switch (activeModule) {
      case "project-tree":
        return <ProjectTree />;
      case "ai-launcher":
        return <AILauncher />;
      case "backup-guardian":
        return <BackupGuardian />;
      case "income":
        return <IncomeTracker />;
    }
  }

  return (
    <div className="app-shell">
      <div className="app-sidebar">
        <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />
      </div>

      <div className="app-topbar">
        <TopBar />
      </div>

      <main className="app-main">{renderModule()}</main>

      <div className="app-statusbar">
        <StatusBar
          activeTool={activeTool}
          backupHealth={backupHealth}
          backupSummary={backupSummary}
          incomeMonthTotal={incomeMonthTotal}
        />
      </div>
    </div>
  );
}

export default App;
