import { exists, readTextFile } from "@tauri-apps/plugin-fs";

export interface ProjectStatusInfo {
  progress: number;
  updatedAt: string | null;
  branch: string | null;
}

function joinPath(base: string, segment: string): string {
  return `${base.replace(/\/+$/, "")}/${segment}`;
}

export function parseStatusContent(content: string): ProjectStatusInfo {
  const progressMatch = content.match(/\*\*Progress:\*\*\s*(\d+)\s*%/i);
  const updatedMatch = content.match(/\*\*Updated:\*\*\s*(.+)/i);
  const branchMatch = content.match(/\*\*Branch:\*\*\s*(.+)/i);

  const progress = progressMatch
    ? Math.max(0, Math.min(100, Number.parseInt(progressMatch[1], 10)))
    : 0;

  return {
    progress,
    updatedAt: updatedMatch?.[1]?.trim() ?? null,
    branch: branchMatch?.[1]?.trim() ?? null,
  };
}

export async function readStatus(
  projectPath: string,
): Promise<ProjectStatusInfo | null> {
  const statusPath = joinPath(projectPath, "STATUS.md");

  try {
    if (!(await exists(statusPath))) return null;
    const content = await readTextFile(statusPath);
    return parseStatusContent(content);
  } catch {
    return null;
  }
}

export function daysSinceUpdated(updatedAt: string | null): number | null {
  if (!updatedAt) return null;
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return null;
  const diff = Date.now() - date.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}
