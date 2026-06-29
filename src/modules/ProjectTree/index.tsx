import { useCallback, useEffect, useState } from "react";
import type { NewProject, Project } from "../../types";
import { fetchProjects, createProject } from "../../store/projects";
import { setupNewProject } from "../../lib/projectSetup";
import { TerminalHeader } from "../../components/BlockProgress";
import { ProjectCard } from "./ProjectCard";
import { AddProjectModal } from "./AddProjectModal";

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  const diff = Date.now() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function hasCommitWarning(project: Project): boolean {
  const days = daysSince(project.last_commit_date);
  if (days === null) return project.status === "active";
  return days >= 3;
}

export function ProjectTree() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      const data = await fetchProjects();
      setProjects(data);
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

  async function handleAddProject(project: NewProject) {
    await createProject(project);
    try {
      await setupNewProject(project.path);
    } catch (err) {
      console.warn("[ProjectTree] project setup failed:", err);
    }
    await loadProjects();
  }

  const activeCount = projects.filter((p) => p.status === "active").length;
  const warningCount = projects.filter(hasCommitWarning).length;

  return (
    <div className="project-tree">
      <div className="project-tree-header">
        <TerminalHeader command="ls ./projects --grid" />
        <div className="project-tree-actions">
          <span className="project-tree-stats">
            {activeCount} active · {projects.length} total
            {warningCount > 0 && (
              <span className="project-tree-warn">
                {" "}
                · {warningCount} stale
              </span>
            )}
          </span>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            + add project
          </button>
        </div>
      </div>

      {loading && (
        <div className="project-tree-empty">
          <span className="prompt">[t4sh@jmm ~]$</span> loading...
        </div>
      )}

      {error && (
        <div className="project-tree-empty project-tree-error">
          <span className="prompt">[t4sh@jmm ~]$</span> error: {error}
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="project-tree-empty">
          <span className="prompt">[t4sh@jmm ~]$</span> no projects found.
          run{" "}
          <button className="inline-btn" onClick={() => setShowAddModal(true)}>
            add-project
          </button>{" "}
          to get started.
        </div>
      )}

      {!loading && projects.length > 0 && (
        <div className="project-grid">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              warningBadge={hasCommitWarning(project)}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddProjectModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddProject}
        />
      )}

      <style>{`
        .project-tree {
          padding: 24px;
          min-height: 100%;
        }

        .project-tree-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
        }

        .project-tree-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
        }

        .project-tree-stats {
          font-size: 11px;
          color: var(--muted);
        }

        .project-tree-warn {
          color: #e6a800;
        }

        .project-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .project-tree-empty {
          padding: 48px 0;
          color: var(--muted);
          font-size: 13px;
        }

        .project-tree-empty .prompt {
          color: var(--accent);
        }

        .project-tree-error {
          color: #ff4444;
        }

        .inline-btn {
          color: var(--accent);
          text-decoration: underline;
          cursor: pointer;
          background: none;
          border: none;
          font-family: inherit;
          font-size: inherit;
          padding: 0;
        }

        .inline-btn:hover {
          color: var(--text);
        }
      `}</style>
    </div>
  );
}
