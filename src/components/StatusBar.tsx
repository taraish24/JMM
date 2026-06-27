import type { PreferredTool } from "../types";

interface StatusBarProps {
  activeTool: PreferredTool | null;
  backupHealth: "ok" | "warning" | "critical";
  backupSummary: string;
}

export function StatusBar({
  activeTool,
  backupHealth,
  backupSummary,
}: StatusBarProps) {
  const healthColor =
    backupHealth === "ok"
      ? "var(--accent)"
      : backupHealth === "warning"
        ? "#e6a800"
        : "#ff4444";

  return (
    <footer className="statusbar">
      <div className="statusbar-section">
        <span className="statusbar-label">tool</span>
        <span className="statusbar-value">
          {activeTool ?? "none"}
        </span>
      </div>

      <span className="statusbar-divider">|</span>

      <div className="statusbar-section">
        <span className="statusbar-label">pomodoro</span>
        <span className="statusbar-value muted">--:--</span>
      </div>

      <span className="statusbar-divider">|</span>

      <div className="statusbar-section">
        <span className="statusbar-label">backup</span>
        <span className="statusbar-value" style={{ color: healthColor }}>
          {backupSummary}
        </span>
      </div>

      <span className="statusbar-divider">|</span>

      <div className="statusbar-section">
        <span className="statusbar-label">income</span>
        <span className="statusbar-value muted">$---</span>
      </div>

      <style>{`
        .statusbar {
          display: flex;
          align-items: center;
          height: 100%;
          padding: 0 20px;
          background: var(--sidebar-bg);
          font-size: 11px;
          gap: 12px;
        }

        .statusbar-section {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .statusbar-label {
          color: var(--muted);
          text-transform: uppercase;
          font-size: 10px;
        }

        .statusbar-value {
          color: var(--text);
        }

        .statusbar-value.muted {
          color: var(--muted);
        }

        .statusbar-divider {
          color: var(--border);
        }
      `}</style>
    </footer>
  );
}
