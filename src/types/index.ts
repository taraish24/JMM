export type ModuleId = "project-tree" | "ai-launcher" | "backup-guardian";

export type ProjectStatus = "active" | "shipped" | "paused";

export type PreferredTool = "cursor" | "claude";

export type BackupStatus = "synced" | "stale" | "critical" | "unknown";

export type BackupHealth = "ok" | "warning" | "critical";

export interface Project {
  id: number;
  name: string;
  path: string;
  tech_stack: string[];
  progress: number;
  last_commit_date: string | null;
  status: ProjectStatus;
  preferred_tool: PreferredTool | null;
}

export interface ProjectRow {
  id: number;
  name: string;
  path: string;
  tech_stack: string;
  progress: number;
  last_commit_date: string | null;
  status: ProjectStatus;
  preferred_tool: PreferredTool | null;
}

export interface NewProject {
  name: string;
  path: string;
  tech_stack: string[];
  progress: number;
  status: ProjectStatus;
  last_commit_date?: string | null;
}

export interface AppContext {
  activeTool: PreferredTool | null;
  backupHealth: BackupHealth;
}

export interface ProjectBackupInfo {
  projectId: number;
  projectName: string;
  projectPath: string;
  branch: string | null;
  commitMessage: string | null;
  daysSinceCommit: number | null;
  status: BackupStatus;
}
