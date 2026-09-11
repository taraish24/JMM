import { useEffect, useState } from "react";
import type { Project, ProjectStatus } from "../../types";
import { BlockProgress } from "../../components/BlockProgress";
import { readStatus } from "../../lib/readStatus";
import { describeProjectWriteError } from "../../store/projects";

interface ProjectCardProps {
  project: Project;
  warningBadge?: boolean;
  onRemove: (id: number) => Promise<void>;
  onUpdate: (id: number, updates: Partial<Project>) => Promise<void>;
}

const STATUS_LABELS: Record<Project["status"], string> = {
  active: "ACTIVE",
  shipped: "SHIPPED",
  paused: "PAUSED",
};

function formatCommitDate(date: string | null): string {
  if (!date) return "no commits";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "unknown";
  return parsed.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ProjectCard({
  project,
  warningBadge,
  onRemove,
  onUpdate,
}: ProjectCardProps) {
  const isActive = project.status === "active";
  const [progress, setProgress] = useState(0);
  const [hasStatusFile, setHasStatusFile] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [removing, setRemoving] = useState(false);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [draftName, setDraftName] = useState(project.name);
  const [draftPath, setDraftPath] = useState(project.path);
  const [draftStack, setDraftStack] = useState(project.tech_stack.join(", "));
  const [draftStatus, setDraftStatus] = useState<ProjectStatus>(project.status);

  function openEditor() {
    setDraftName(project.name);
    setDraftPath(project.path);
    setDraftStack(project.tech_stack.join(", "));
    setDraftStatus(project.status);
    setEditError(null);
    setEditing(true);
  }

  async function saveEdits(e: React.FormEvent) {
    e.preventDefault();
    if (!draftName.trim()) {
      setEditError("Name is required");
      return;
    }
    if (!draftPath.trim()) {
      setEditError("Path is required");
      return;
    }

    setSaving(true);
    setEditError(null);
    try {
      await onUpdate(project.id, {
        name: draftName.trim(),
        path: draftPath.trim(),
        tech_stack: draftStack
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        status: draftStatus,
      });
      setEditing(false);
    } catch (err) {
      setEditError(describeProjectWriteError(err, "Failed to save changes"));
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      const status = await readStatus(project.path);
      if (cancelled) return;
      setHasStatusFile(status !== null);
      setProgress(status?.progress ?? 0);
    }

    void loadStatus();
    return () => {
      cancelled = true;
    };
  }, [project.path]);

  return (
    <article
      className={`project-card ${isActive ? "project-card--active" : "project-card--inactive"}`}
    >
      {warningBadge && (
        <span className="project-card-badge" title="No commit in 3+ days">
          !
        </span>
      )}

      <div className="project-card-header">
        <h3 className="project-card-name">{project.name}</h3>
        <span
          className={`project-card-status project-card-status--${project.status}`}
        >
          [{STATUS_LABELS[project.status]}]
        </span>
      </div>

      {editing && (
        <form className="project-card-edit" onSubmit={saveEdits}>
          <label className="project-card-edit-label">name</label>
          <input
            className="project-card-edit-input"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            autoFocus
          />

          <label className="project-card-edit-label">path</label>
          <input
            className="project-card-edit-input"
            value={draftPath}
            onChange={(e) => setDraftPath(e.target.value)}
          />

          <label className="project-card-edit-label">tech stack</label>
          <input
            className="project-card-edit-input"
            value={draftStack}
            onChange={(e) => setDraftStack(e.target.value)}
            placeholder="react, typescript"
          />

          <label className="project-card-edit-label">status</label>
          <select
            className="project-card-edit-input"
            value={draftStatus}
            onChange={(e) => setDraftStatus(e.target.value as ProjectStatus)}
          >
            <option value="active">active</option>
            <option value="shipped">shipped</option>
            <option value="paused">paused</option>
          </select>

          {editError && <p className="project-card-edit-error">{editError}</p>}

          <div className="project-card-edit-actions">
            <button type="submit" className="inline-btn" disabled={saving}>
              {saving ? "saving..." : "save"}
            </button>
            <button
              type="button"
              className="inline-btn"
              disabled={saving}
              onClick={() => setEditing(false)}
            >
              cancel
            </button>
          </div>
        </form>
      )}

      <div className="project-card-remove">
        {!editing && !confirmingRemove && (
          <button type="button" className="inline-btn" onClick={openEditor}>
            edit
          </button>
        )}
        {confirmingRemove ? (
          <span className="project-card-confirm">
            remove from jmm? folder stays on disk.
            <button
              type="button"
              className="inline-btn inline-btn--danger"
              disabled={removing}
              onClick={async () => {
                setRemoving(true);
                try {
                  await onRemove(project.id);
                } finally {
                  setRemoving(false);
                  setConfirmingRemove(false);
                }
              }}
            >
              {removing ? "removing..." : "y"}
            </button>
            <button
              type="button"
              className="inline-btn"
              disabled={removing}
              onClick={() => setConfirmingRemove(false)}
            >
              n
            </button>
          </span>
        ) : (
          !editing && (
            <button
              type="button"
              className="inline-btn"
              onClick={() => setConfirmingRemove(true)}
            >
              rm
            </button>
          )
        )}
      </div>

      <div className="tag-list">
        {project.tech_stack.length > 0 ? (
          project.tech_stack.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))
        ) : (
          <span className="tag">—</span>
        )}
      </div>

      <div className="project-card-progress">
        <BlockProgress value={progress} />
        {!hasStatusFile && (
          <span className="project-card-no-status">no status file</span>
        )}
      </div>

      <div className="project-card-footer">
        <span className="project-card-meta">
          <span className="project-card-meta-label">last commit</span>
          {formatCommitDate(project.last_commit_date)}
        </span>
        <span className="project-card-path" title={project.path}>
          {project.path}
        </span>
      </div>

      <style>{`
        .project-card {
          position: relative;
          background: var(--card);
          border: 1px solid var(--border);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: border-color 0.15s;
        }

        .project-card--active {
          border-color: var(--accent);
        }

        .project-card--inactive {
          border-color: var(--muted);
        }

        .project-card--active:hover {
          box-shadow: 0 0 0 1px var(--accent);
        }

        .project-card-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 18px;
          height: 18px;
          background: #e6a800;
          color: var(--bg);
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0;
        }

        .project-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }

        .project-card-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
        }

        .project-card-status {
          font-size: 10px;
          white-space: nowrap;
        }

        .project-card-status--active {
          color: var(--accent);
        }

        .project-card-status--shipped,
        .project-card-status--paused {
          color: var(--muted);
        }

        .project-card-remove {
          font-size: 10px;
          min-height: 14px;
          margin-top: -6px;
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .project-card-edit {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: -4px;
        }

        .project-card-edit-label {
          font-size: 9px;
          color: var(--muted);
          text-transform: uppercase;
        }

        .project-card-edit-input {
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--text);
          font-family: inherit;
          font-size: 11px;
          padding: 5px 6px;
        }

        .project-card-edit-input:focus {
          outline: none;
          border-color: var(--accent);
        }

        .project-card-edit-error {
          color: #ff4444;
          font-size: 10px;
        }

        .project-card-edit-actions {
          display: flex;
          gap: 12px;
          margin-top: 4px;
          font-size: 10px;
        }

        .project-card-confirm {
          color: var(--muted);
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .project-card .inline-btn--danger {
          color: #ff4444;
        }

        .project-card-progress {
          margin-top: 4px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .project-card-no-status {
          font-size: 10px;
          color: var(--muted);
          opacity: 0.65;
        }

        .project-card-footer {
          display: flex;
          flex-direction: column;
          gap: 4px;
          border-top: 1px solid var(--border);
          padding-top: 10px;
          margin-top: auto;
        }

        .project-card-meta {
          font-size: 11px;
          color: var(--text);
        }

        .project-card-meta-label {
          color: var(--muted);
          margin-right: 6px;
        }

        .project-card-meta-label::before {
          content: ">";
          margin-right: 4px;
          color: var(--accent);
        }

        .project-card-path {
          font-size: 10px;
          color: var(--muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </article>
  );
}
