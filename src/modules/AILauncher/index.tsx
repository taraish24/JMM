import { TerminalHeader } from "../../components/BlockProgress";

export function AILauncher() {
  return (
    <div className="module-placeholder">
      <TerminalHeader command="ai-launcher --status" />
      <p className="module-placeholder-text">
        Per-project Cursor / Claude Code launcher coming in Phase 1.
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
