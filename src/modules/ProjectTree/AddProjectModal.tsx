import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import type { NewProject, ProjectStatus } from "../../types";
import { TerminalHeader } from "../../components/BlockProgress";

interface AddProjectModalProps {
  onClose: () => void;
  onSubmit: (project: NewProject) => Promise<void>;
}

export function AddProjectModal({ onClose, onSubmit }: AddProjectModalProps) {
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [techStack, setTechStack] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBrowse() {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select project folder",
    });

    if (selected && typeof selected === "string") {
      setPath(selected);
      if (!name) {
        const folderName = selected.split(/[/\\]/).pop() ?? "";
        setName(folderName);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Project name is required");
      return;
    }
    if (!path.trim()) {
      setError("Project path is required");
      return;
    }

    setSubmitting(true);
    try {
      let lastCommitDate: string | null = null;
      try {
        lastCommitDate = await invoke<string | null>(
          "get_git_last_commit_date",
          { path },
        );
      } catch {
        lastCommitDate = null;
      }

      const tags = techStack
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await onSubmit({
        name: name.trim(),
        path: path.trim(),
        tech_stack: tags,
        progress: Math.max(0, Math.min(100, progress)),
        status,
        last_commit_date: lastCommitDate,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add project");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          <TerminalHeader command="add-project --new" />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-fields">
            <div className="field">
              <label htmlFor="project-name">name</label>
              <input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-project"
                autoFocus
              />
            </div>

            <div className="field">
              <label htmlFor="project-path">path</label>
              <div className="path-row">
                <input
                  id="project-path"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="/home/user/projects/my-project"
                />
                <button type="button" className="btn" onClick={handleBrowse}>
                  browse
                </button>
              </div>
            </div>

            <div className="field">
              <label htmlFor="project-stack">tech stack</label>
              <input
                id="project-stack"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="react, typescript, tauri"
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="project-progress">progress (%)</label>
                <input
                  id="project-progress"
                  type="number"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                />
              </div>

              <div className="field">
                <label htmlFor="project-status">status</label>
                <select
                  id="project-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                >
                  <option value="active">active</option>
                  <option value="shipped">shipped</option>
                  <option value="paused">paused</option>
                </select>
              </div>
            </div>
          </div>

          {error && <p className="modal-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "adding..." : "add project"}
            </button>
          </div>
        </form>

        <style>{`
          .modal-fields {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .field-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .path-row {
            display: flex;
            gap: 8px;
          }

          .path-row input {
            flex: 1;
          }

          .modal-error {
            margin-top: 12px;
            color: #ff4444;
            font-size: 11px;
          }
        `}</style>
      </div>
    </div>
  );
}
