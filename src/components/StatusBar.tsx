import type { PreferredTool } from "../types";
import { formatCountdown, type Pomodoro } from "../hooks/usePomodoro";
import { formatAmount } from "../store/income";

interface StatusBarProps {
  activeTool: PreferredTool | null;
  backupHealth: "ok" | "warning" | "critical";
  backupSummary: string;
  pomodoro: Pomodoro;
  incomeMonthTotal: number;
}

export function StatusBar({
  activeTool,
  backupHealth,
  backupSummary,
  pomodoro,
  incomeMonthTotal,
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
        <span className="statusbar-value">{formatCountdown(pomodoro.remaining)}</span>
        <span
          className="statusbar-phase"
          style={{
            color: pomodoro.phase === "work" ? "var(--accent)" : "#e6a800",
          }}
        >
          {pomodoro.phase}
        </span>
        <button type="button" className="statusbar-btn" onClick={pomodoro.toggle}>
          {pomodoro.running ? "pause" : "start"}
        </button>
        <button type="button" className="statusbar-btn" onClick={pomodoro.reset}>
          reset
        </button>
        {pomodoro.completedSessions > 0 && (
          <span className="statusbar-value muted">
            ×{pomodoro.completedSessions}
          </span>
        )}
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
        <span
          className={`statusbar-value${incomeMonthTotal > 0 ? "" : " muted"}`}
          style={incomeMonthTotal > 0 ? { color: "var(--accent)" } : undefined}
          title="this month"
        >
          ${formatAmount(incomeMonthTotal)}
        </span>
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

        .statusbar-phase {
          font-size: 10px;
          text-transform: uppercase;
        }

        .statusbar-btn {
          background: none;
          border: none;
          padding: 0;
          font-family: inherit;
          font-size: 10px;
          color: var(--muted);
          cursor: pointer;
          text-decoration: underline;
        }

        .statusbar-btn:hover {
          color: var(--text);
        }
      `}</style>
    </footer>
  );
}
