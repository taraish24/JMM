import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { PreferredTool, Project } from "../../types";
import { fetchProjects, updateProject } from "../../store/projects";
import { TerminalHeader } from "../../components/BlockProgress";
import { ProjectLaunchRow } from "./ProjectLaunchRow";

export function AILauncher() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pathExistsMap, setPathExistsMap] = useState<Record<number, boolean>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      const data = await fetchProjects();
      setProjects(data);

      const existsEntries = await Promise.all(
        data.map(async (project) => {
          const exists = await invoke<boolean>("path_exists", {
            path: project.path,
          });
          return [project.id, exists] as const;
        }),
      );

      setPathExistsMap(Object.fromEntries(existsEntries));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  async function handleToolChange(id: number, tool: PreferredTool) {
    await updateProject(id, { preferred_tool: tool });
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, preferred_tool: tool } : p)),
    );
  }

  return (
    <div className="ai-launcher">
      <TerminalHeader command="ls ./ai-launcher --tools" />

      {loading && (
        <div className="launcher-empty">
          <span className="prompt">[t4sh@jmm ~]$</span> loading...
        </div>
      )}

      {error && (
        <div className="launcher-empty launcher-error">
          <span className="prompt">[t4sh@jmm ~]$</span> error: {error}
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="launcher-empty">
          <span className="prompt">[t4sh@jmm ~]$</span> no projects found. add
          projects in the project tree first.
        </div>
      )}

      {!loading && projects.length > 0 && (
        <div className="launcher-list">
          {projects.map((project) => (
            <ProjectLaunchRow
              key={project.id}
              project={project}
              pathExists={pathExistsMap[project.id] ?? false}
              onToolChange={handleToolChange}
            />
          ))}
        </div>
      )}

      <style>{`
        .ai-launcher {
          padding: 24px;
          min-height: 100%;
        }

        .launcher-list {
          margin-top: 8px;
        }

        .launcher-empty {
          padding: 48px 0;
          color: var(--muted);
          font-size: 13px;
        }

        .launcher-empty .prompt {
          color: var(--accent);
        }

        .launcher-error {
          color: #ff4444;
        }
      `}</style>
    </div>
  );
}
