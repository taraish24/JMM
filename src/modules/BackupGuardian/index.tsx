import { useEffect, useState } from "react";
import { useAppStore } from "../../store/appStore";
import { TerminalHeader } from "../../components/BlockProgress";
import { ProjectBackupRow } from "./ProjectBackupRow";

function formatMinutesAgo(date: Date): string {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes === 1) return "1 minute ago";
  return `${minutes} minutes ago`;
}

export function BackupGuardian() {
  const { backupItems, backupScanning, lastBackupScan, runBackupScan } =
    useAppStore();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!lastBackupScan) return;
    const intervalId = window.setInterval(() => {
      setTick((tick) => tick + 1);
    }, 60_000);
    return () => window.clearInterval(intervalId);
  }, [lastBackupScan]);

  const criticalCount = backupItems.filter(
    (item) => item.status === "critical",
  ).length;
  const staleCount = backupItems.filter((item) => item.status === "stale").length;
  const loading = backupScanning && backupItems.length === 0;

  return (
    <div className="backup-guardian">
      <div className="backup-guardian-header">
        <TerminalHeader command="git status --all-projects" />
        <div className="backup-guardian-actions">
          {lastBackupScan && (
            <span className="backup-guardian-meta">
              last scanned: {formatMinutesAgo(lastBackupScan)}
              {criticalCount > 0 && (
                <span className="backup-guardian-critical">
                  {" "}
                  · {criticalCount} critical
                </span>
              )}
              {staleCount > 0 && (
                <span className="backup-guardian-stale">
                  {" "}
                  · {staleCount} stale
                </span>
              )}
            </span>
          )}
          <button
            type="button"
            className="btn"
            disabled={backupScanning}
            onClick={() => runBackupScan?.({ manual: true })}
          >
            {backupScanning ? "scanning..." : "refresh"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="backup-empty">
          <span className="prompt">[t4sh@jmm ~]$</span> scanning git metadata...
        </div>
      )}

      {!loading && backupItems.length === 0 && (
        <div className="backup-empty">
          <span className="prompt">[t4sh@jmm ~]$</span> no projects found. add
          projects in the project tree first.
        </div>
      )}

      {!loading && backupItems.length > 0 && (
        <div className="backup-list">
          {backupItems.map((item) => (
            <ProjectBackupRow key={item.projectId} info={item} />
          ))}
        </div>
      )}

      <style>{`
        .backup-guardian {
          padding: 24px;
          min-height: 100%;
        }

        .backup-guardian-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 8px;
        }

        .backup-guardian-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
        }

        .backup-guardian-meta {
          font-size: 11px;
          color: var(--muted);
        }

        .backup-guardian-critical {
          color: #ff4444;
        }

        .backup-guardian-stale {
          color: #e6a800;
        }

        .backup-list {
          margin-top: 8px;
        }

        .backup-empty {
          padding: 48px 0;
          color: var(--muted);
          font-size: 13px;
        }

        .backup-empty .prompt {
          color: var(--accent);
        }
      `}</style>
    </div>
  );
}
