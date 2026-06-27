import { exists, readDir, readTextFile, stat } from "@tauri-apps/plugin-fs";
import type { BackupStatus } from "../types";

export interface GitMetadata {
  branch: string | null;
  commitMessage: string | null;
  daysSinceCommit: number | null;
  status: BackupStatus;
}

export const NO_GIT_METADATA: GitMetadata = {
  branch: null,
  commitMessage: null,
  daysSinceCommit: null,
  status: "unknown",
};

const BRANCH_CANDIDATES = ["main", "master"];

function joinPath(base: string, segment: string): string {
  return `${base.replace(/\/+$/, "")}/${segment}`;
}

function parseReflogTimestamp(line: string): number | null {
  const match = line.match(/\s(\d{10})\s[+-]\d{4}\t/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function parseReflogMessage(line: string): string | null {
  const tabIndex = line.indexOf("\t");
  if (tabIndex === -1) return null;

  const actionPart = line.slice(tabIndex + 1);
  const colonIndex = actionPart.indexOf(": ");
  if (colonIndex === -1) return actionPart.trim() || null;

  return actionPart.slice(colonIndex + 2).trim() || null;
}

function daysSince(date: Date): number {
  const diff = Date.now() - date.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function classifyBackupStatus(
  daysSinceCommit: number | null,
): BackupStatus {
  if (daysSinceCommit === null) return "unknown";
  if (daysSinceCommit <= 2) return "synced";
  if (daysSinceCommit <= 6) return "stale";
  return "critical";
}

async function safeExists(path: string): Promise<boolean> {
  try {
    console.log("[gitMetadata] checking exists:", path);
    return await exists(path);
  } catch (err) {
    console.log("[gitMetadata] exists failed:", path, err);
    return false;
  }
}

async function readBranchFromHead(gitDir: string): Promise<string | null> {
  try {
    const headPath = joinPath(gitDir, "HEAD");
    console.log("[gitMetadata] reading HEAD:", headPath);
    const content = (await readTextFile(headPath)).trim();
    const refMatch = content.match(/^ref: refs\/heads\/(.+)$/);
    if (refMatch) {
      console.log("[gitMetadata] branch from HEAD:", refMatch[1]);
      return refMatch[1];
    }
    return null;
  } catch (err) {
    console.log("[gitMetadata] HEAD read failed:", err);
    return null;
  }
}

async function readRefMtime(
  gitDir: string,
  branch: string,
): Promise<number | null> {
  const refPath = joinPath(gitDir, `refs/heads/${branch}`);
  try {
    console.log("[gitMetadata] stat ref file:", refPath);
    const info = await stat(refPath);
    if (!info.mtime) return null;
    return Math.floor(info.mtime.getTime() / 1000);
  } catch (err) {
    console.log("[gitMetadata] stat failed:", refPath, err);
    return null;
  }
}

async function detectBranch(gitDir: string): Promise<string | null> {
  console.log("[gitMetadata] detecting branch in:", gitDir);

  for (const candidate of BRANCH_CANDIDATES) {
    const refPath = joinPath(gitDir, `refs/heads/${candidate}`);
    if (await safeExists(refPath)) {
      console.log("[gitMetadata] found branch:", candidate);
      return candidate;
    }
  }

  const headsDir = joinPath(gitDir, "refs/heads");
  if (!(await safeExists(headsDir))) {
    console.log("[gitMetadata] no refs/heads directory");
    return null;
  }

  try {
    console.log("[gitMetadata] reading heads directory:", headsDir);
    const entries = await readDir(headsDir);
    const firstBranch = entries.find((entry) => entry.isFile)?.name ?? null;
    console.log("[gitMetadata] first branch from heads:", firstBranch);
    return firstBranch;
  } catch (err) {
    console.log("[gitMetadata] readDir failed:", headsDir, err);
    return null;
  }
}

async function readLastReflogEntry(
  logPath: string,
): Promise<{ timestamp: number; message: string | null } | null> {
  try {
    console.log("[gitMetadata] reading reflog:", logPath);
    const content = await readTextFile(logPath);
    const lines = content.trim().split("\n").filter(Boolean);
    if (lines.length === 0) return null;

    const lastLine = lines[lines.length - 1];
    const timestamp = parseReflogTimestamp(lastLine);
    if (timestamp === null) return null;

    return {
      timestamp,
      message: parseReflogMessage(lastLine),
    };
  } catch (err) {
    console.log("[gitMetadata] reflog read failed:", logPath, err);
    return null;
  }
}

export async function readGitMetadata(
  projectPath: string,
): Promise<GitMetadata> {
  console.log("[gitMetadata] start:", projectPath);

  try {
    const gitDir = joinPath(projectPath, ".git");
    const gitDirExists = await safeExists(gitDir);

    if (!gitDirExists) {
      // exists() can fail on .git dirs even when readable — probe HEAD directly
      const headBranch = await readBranchFromHead(gitDir);
      if (!headBranch) {
        console.log("[gitMetadata] no .git folder:", projectPath);
        return NO_GIT_METADATA;
      }
    }

    let branch = await readBranchFromHead(gitDir);
    if (!branch) {
      branch = await detectBranch(gitDir);
    }

    let commitMessage: string | null = null;
    try {
      const editMsgPath = joinPath(gitDir, "COMMIT_EDITMSG");
      console.log("[gitMetadata] reading commit message:", editMsgPath);
      const editMsg = await readTextFile(editMsgPath);
      commitMessage =
        editMsg
          .split("\n")
          .map((line) => line.trim())
          .find(Boolean) ?? null;
    } catch (err) {
      console.log("[gitMetadata] COMMIT_EDITMSG read failed:", err);
      commitMessage = null;
    }

    let timestamp: number | null = null;

    if (branch) {
      const branchLog = await readLastReflogEntry(
        joinPath(gitDir, `logs/refs/heads/${branch}`),
      );
      if (branchLog) {
        timestamp = branchLog.timestamp;
        if (!commitMessage && branchLog.message) {
          commitMessage = branchLog.message;
        }
      }
    }

    if (timestamp === null) {
      const headLog = await readLastReflogEntry(joinPath(gitDir, "logs/HEAD"));
      if (headLog) {
        timestamp = headLog.timestamp;
        if (!commitMessage && headLog.message) {
          commitMessage = headLog.message;
        }
      }
    }

    if (timestamp === null && branch) {
      timestamp = await readRefMtime(gitDir, branch);
    }

    const daysSinceCommit =
      timestamp === null ? null : daysSince(new Date(timestamp * 1000));

    const result: GitMetadata = {
      branch,
      commitMessage,
      daysSinceCommit,
      status: classifyBackupStatus(daysSinceCommit),
    };
    console.log("[gitMetadata] done:", projectPath, result.status);
    return result;
  } catch (err) {
    console.log("[gitMetadata] unexpected error:", projectPath, err);
    return NO_GIT_METADATA;
  }
}

export function formatDaysAgo(days: number | null): string {
  if (days === null) return "unknown";
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}
