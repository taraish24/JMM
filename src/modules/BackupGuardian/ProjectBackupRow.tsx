import { useState } from "react";
import type { ProjectBackupInfo } from "../../types";
import { formatDaysAgo } from "../../lib/gitMetadata";
import {
  openProjectTerminal,
  terminalErrorMessage,
} from "../../lib/terminal";

interface ProjectBackupRowProps {
  info: ProjectBackupInfo;
}

const STATUS_LABELS: Record<ProjectBackupInfo["status"], string> = {
  synced: "SYNCED",
  stale: "STALE",
  critical: "CRITICAL",
  unknown: "UNKNOWN",
};

const STATUS_COLORS: Record<ProjectBackupInfo["status"], string> = {
  synced: "var(--accent)",
  stale: "#e6a800",
  critical: "#ff4444",
  unknown: "var(--muted)",
};

export function ProjectBackupRow({ info }: ProjectBackupRowProps) {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const message = info.commitMessage ?? "no commit message";
  const daysLabel = formatDaysAgo(info.daysSinceCommit);
  const branchLabel = info.branch ?? "unknown";
  const statusUpdateLabel = info.hasStatusFile
    ? `updated ${formatDaysAgo(info.daysSinceStatusUpdate)}`
    : "no status file";

  async function handleOpenTerminal() {
    setOpening(true);
    setError(null);

    try {
      await openProjectTerminal(info.projectPath);
    } catch (err) {
      setError(terminalErrorMessage(err));
    } finally {
      setOpening(false);
    }
  }

  return (
    <article className="backup-row">
      <div className="backup-row-header">
        <span className="backup-prompt">&gt;</span>
        <span className="backup-name">{info.projectName}</span>
      </div>

      <div className="backup-row-detail">
        <span className="backup-indent" />
        branch: {branchLabel}
      </div>

      <div className="backup-row-detail">
        <span className="backup-indent" />
        last commit: &quot;{message}&quot; ({daysLabel})
      </div>

      <div className="backup-row-detail">
        <span className="backup-indent" />
        status: {statusUpdateLabel}
      </div>

      <div className="backup-row-footer">
        <div className="backup-row-detail">
          <span className="backup-indent" />
          status:{" "}
          <span
            className="backup-status"
            style={{ color: STATUS_COLORS[info.status] }}
          >
            [{STATUS_LABELS[info.status]}]
          </span>
        </div>

        <button
          type="button"
          className="backup-terminal-btn"
          disabled={opening}
          onClick={handleOpenTerminal}
        >
          {opening ? "[OPENING...]" : "[OPEN TERMINAL]"}
        </button>
      </div>

      {error && <div className="backup-row-error">{error}</div>}

      <style>{`
        .backup-row {
          border-bottom: 1px solid var(--border);
          padding: 14px 0;
          font-size: 12px;
        }

        .backup-row-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .backup-prompt {
          color: var(--accent);
        }

        .backup-name {
          color: var(--text);
          font-weight: 600;
        }

        .backup-row-detail {
          color: var(--muted);
          padding-left: 16px;
          margin-bottom: 4px;
          line-height: 1.6;
        }

        .backup-indent {
          display: inline-block;
          width: 0;
        }

        .backup-row-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-top: 4px;
        }

        .backup-status {
          font-weight: 600;
        }

        .backup-terminal-btn {
          padding: 2px 8px;
          border: 1px solid var(--border);
          color: var(--text);
          font-size: 11px;
          transition: border-color 0.15s, color 0.15s;
        }

        .backup-terminal-btn:hover:not(:disabled) {
          border-color: var(--accent);
          color: var(--accent);
        }

        .backup-terminal-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .backup-row-error {
          margin-top: 8px;
          padding-left: 16px;
          color: #ff4444;
          font-size: 11px;
        }
      `}</style>
    </article>
  );
}
