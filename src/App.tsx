import { useState } from "react";
import type { ModuleId } from "./types";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { StatusBar } from "./components/StatusBar";
import { ProjectTree } from "./modules/ProjectTree";
import { AILauncher } from "./modules/AILauncher";
import { BackupGuardian } from "./modules/BackupGuardian";
import { useAppStore } from "./store/appStore";
import { useBackupMonitor } from "./hooks/useBackupMonitor";

function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>("project-tree");
  const { activeTool, backupHealth, backupSummary } = useAppStore();

  useBackupMonitor();

  function renderModule() {
    switch (activeModule) {
      case "project-tree":
        return <ProjectTree />;
      case "ai-launcher":
        return <AILauncher />;
      case "backup-guardian":
        return <BackupGuardian />;
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
        />
      </div>
    </div>
  );
}

export default App;
