import type { ModuleId } from "../types";

interface SidebarProps {
  activeModule: ModuleId;
  onModuleChange: (module: ModuleId) => void;
}

const MODULES: { id: ModuleId; label: string; icon: string }[] = [
  { id: "project-tree", label: "projects", icon: "▸" },
  { id: "ai-launcher", label: "ai-launch", icon: "▸" },
  { id: "backup-guardian", label: "backup", icon: "▸" },
];

export function Sidebar({ activeModule, onModuleChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-accent">J</span>MM
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-nav-label">modules</div>
        {MODULES.map((mod) => (
          <button
            key={mod.id}
            className={`sidebar-item ${activeModule === mod.id ? "active" : ""}`}
            onClick={() => onModuleChange(mod.id)}
          >
            <span className="sidebar-item-icon">
              {activeModule === mod.id ? ">" : mod.icon}
            </span>
            <span className="sidebar-item-label">{mod.label}</span>
          </button>
        ))}
      </nav>

      <style>{`
        .sidebar {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 16px 0;
        }

        .sidebar-logo {
          padding: 0 16px 20px;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 2px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 16px;
        }

        .sidebar-logo-accent {
          color: var(--accent);
        }

        .sidebar-nav-label {
          padding: 0 16px 8px;
          font-size: 10px;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 10px 16px;
          text-align: left;
          color: var(--muted);
          border-left: 2px solid transparent;
          transition: color 0.15s, border-color 0.15s, background 0.15s;
        }

        .sidebar-item:hover {
          color: var(--text);
          background: rgba(255, 255, 255, 0.02);
        }

        .sidebar-item.active {
          color: var(--accent);
          border-left-color: var(--accent);
          background: rgba(0, 200, 5, 0.04);
        }

        .sidebar-item-icon {
          width: 12px;
          font-size: 11px;
        }

        .sidebar-item-label {
          font-size: 12px;
        }
      `}</style>
    </aside>
  );
}
