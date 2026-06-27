import { TerminalHeader } from "../../components/BlockProgress";

export function BackupGuardian() {
  return (
    <div className="module-placeholder">
      <TerminalHeader command="backup-guardian --scan" />
      <p className="module-placeholder-text">
        Git push tracking and backup health monitoring coming in Phase 1.
      </p>

      <style>{`
        .module-placeholder {
          padding: 24px;
        }

        .module-placeholder-text {
          color: var(--muted);
          margin-top: 16px;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
