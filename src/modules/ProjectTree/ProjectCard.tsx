import type { Project } from "../../types";
import { BlockProgress } from "../../components/BlockProgress";

interface ProjectCardProps {
  project: Project;
  warningBadge?: boolean;
}

const STATUS_LABELS: Record<Project["status"], string> = {
  active: "ACTIVE",
  shipped: "SHIPPED",
  paused: "PAUSED",
};

function formatCommitDate(date: string | null): string {
  if (!date) return "no commits";
  try {
    const d = new Date(date);
    return d.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return date;
  }
}

export function ProjectCard({ project, warningBadge }: ProjectCardProps) {
  const isActive = project.status === "active";

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
        <BlockProgress value={project.progress} />
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

        .project-card-progress {
          margin-top: 4px;
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
