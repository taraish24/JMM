export type ModuleId = "project-tree" | "ai-launcher" | "backup-guardian";

export type ProjectStatus = "active" | "shipped" | "paused";

export type PreferredTool = "cursor" | "claude";

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
  backupHealth: "ok" | "warning" | "critical";
}
