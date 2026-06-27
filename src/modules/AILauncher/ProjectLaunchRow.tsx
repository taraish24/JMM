import { useState } from "react";
import type { PreferredTool, Project } from "../../types";
import { launchErrorMessage, launchInTool } from "../../lib/launch";
import { useAppStore } from "../../store/appStore";

interface ProjectLaunchRowProps {
  project: Project;
  pathExists: boolean;
  onToolChange: (id: number, tool: PreferredTool) => Promise<void>;
}

function effectiveTool(project: Project): PreferredTool {
  return project.preferred_tool ?? "cursor";
}

export function ProjectLaunchRow({
  project,
  pathExists,
  onToolChange,
}: ProjectLaunchRowProps) {
  const { setActiveTool } = useAppStore();
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tool = effectiveTool(project);

  async function handleToolSelect(next: PreferredTool) {
    if (next === tool) return;
    setError(null);
    await onToolChange(project.id, next);
  }

  async function handleLaunch() {
    if (!pathExists || launching) return;

    setLaunching(true);
    setError(null);

    try {
      await launchInTool(tool, project.path);
      setActiveTool(tool);
    } catch (err) {
      setError(launchErrorMessage(tool, err));
    } finally {
      setLaunching(false);
    }
  }

  return (
    <div className="launcher-row">
      <div className="launcher-row-main">
        <span className="launcher-prompt">&gt;</span>
        <span className="launcher-name">{project.name}</span>
        <span className="launcher-sep">|</span>
        <span className="launcher-path" title={project.path}>
          {project.path}
        </span>
        {!pathExists && (
          <>
            <span className="launcher-sep">|</span>
            <span className="launcher-path-missing">[PATH NOT FOUND]</span>
          </>
        )}
        <span className="launcher-sep">|</span>
        <div className="launcher-tools">
          <button
            type="button"
            className={`launcher-tool ${tool === "cursor" ? "launcher-tool--active" : ""}`}
            onClick={() => handleToolSelect("cursor")}
          >
            [CURSOR]
          </button>
          <button
            type="button"
            className={`launcher-tool ${tool === "claude" ? "launcher-tool--active" : ""}`}
            onClick={() => handleToolSelect("claude")}
          >
            [CLAUDE]
          </button>
        </div>
        <span className="launcher-sep">|</span>
        <button
          type="button"
          className="launcher-launch"
          disabled={!pathExists || launching}
          onClick={handleLaunch}
        >
          {launching ? "[LAUNCHING...]" : "[LAUNCH >>]"}
        </button>
      </div>

      {error && <div className="launcher-row-error">{error}</div>}

      <style>{`
        .launcher-row {
          border-bottom: 1px solid var(--border);
        }

        .launcher-row-main {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          padding: 10px 0;
          font-size: 12px;
        }

        .launcher-prompt {
          color: var(--accent);
          flex-shrink: 0;
        }

        .launcher-name {
          color: var(--text);
          font-weight: 600;
        }

        .launcher-sep {
          color: var(--muted);
        }

        .launcher-path {
          color: var(--muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 360px;
        }

        .launcher-path-missing {
          color: #e6a800;
          font-size: 11px;
        }

        .launcher-tools {
          display: flex;
          gap: 6px;
        }

        .launcher-tool {
          padding: 2px 6px;
          border: 1px solid var(--muted);
          color: var(--muted);
          font-size: 11px;
          transition: border-color 0.15s, color 0.15s;
        }

        .launcher-tool:hover {
          color: var(--text);
        }

        .launcher-tool--active {
          border-color: var(--accent);
          color: var(--accent);
        }

        .launcher-launch {
          padding: 2px 8px;
          border: 1px solid var(--border);
          color: var(--text);
          font-size: 11px;
          transition: border-color 0.15s, box-shadow 0.15s, color 0.15s;
        }

        .launcher-launch:hover:not(:disabled) {
          border-color: var(--accent);
          color: var(--accent);
          box-shadow: 0 0 8px rgba(0, 200, 5, 0.35);
        }

        .launcher-launch:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .launcher-row-error {
          padding: 0 0 10px 16px;
          color: #ff4444;
          font-size: 11px;
        }
      `}</style>
    </div>
  );
}
