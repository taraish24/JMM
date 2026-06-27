import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import type { BackupHealth, BackupStatus, ProjectBackupInfo } from "../types";

export function computeOverallBackupHealth(
  statuses: BackupStatus[],
): BackupHealth {
  if (statuses.some((status) => status === "critical")) return "critical";
  if (statuses.some((status) => status === "stale" || status === "unknown")) {
    return "warning";
  }
  return "ok";
}

export function formatBackupSummary(items: ProjectBackupInfo[]): string {
  const critical = items.filter((item) => item.status === "critical").length;
  const stale = items.filter((item) => item.status === "stale").length;
  const unknown = items.filter((item) => item.status === "unknown").length;

  if (critical > 0) {
    const parts = [`${critical} critical`];
    if (stale > 0) parts.push(`${stale} stale`);
    return parts.join(" · ");
  }

  if (stale > 0) {
    return stale === 1 ? "1 stale" : `${stale} stale`;
  }

  if (unknown > 0) {
    return unknown === 1 ? "1 unknown" : `${unknown} unknown`;
  }

  return "all synced";
}

export async function notifyCriticalProjects(
  items: ProjectBackupInfo[],
): Promise<void> {
  const critical = items.filter((item) => item.status === "critical");
  if (critical.length === 0) return;

  let granted = await isPermissionGranted();
  if (!granted) {
    const permission = await requestPermission();
    granted = permission === "granted";
  }
  if (!granted) return;

  const body =
    critical.length === 1
      ? `${critical[0].projectName} — no commit in ${critical[0].daysSinceCommit} days`
      : critical
          .map(
            (item) =>
              `${item.projectName}: ${item.daysSinceCommit ?? "?"} days`,
          )
          .join(", ");

  sendNotification({
    title: "JMM Backup Guardian — CRITICAL",
    body,
  });
}
