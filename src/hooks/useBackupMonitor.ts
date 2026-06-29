import { useCallback, useEffect, useRef } from "react";
import type { Project, ProjectBackupInfo } from "../types";
import { fetchProjects } from "../store/projects";
import {
  computeOverallBackupHealth,
  formatBackupSummary,
  notifyCriticalProjects,
} from "../lib/backupStatus";
import { NO_GIT_METADATA, readGitMetadata } from "../lib/gitMetadata";
import { daysSinceUpdated, readStatus } from "../lib/readStatus";
import { useAppStore } from "../store/appStore";

const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 1800000ms — scan at most every 30 minutes
const SCAN_TIMEOUT_MS = 5000;

async function buildBackupInfo(project: Project): Promise<ProjectBackupInfo> {
  console.log("[BackupMonitor] scanning project:", project.name, project.path);

  try {
    const [metadata, statusInfo] = await Promise.all([
      readGitMetadata(project.path),
      readStatus(project.path),
    ]);
    console.log(
      "[BackupMonitor] scanned project:",
      project.name,
      metadata.status,
    );

    return {
      projectId: project.id,
      projectName: project.name,
      projectPath: project.path,
      branch: metadata.branch,
      commitMessage: metadata.commitMessage,
      daysSinceCommit: metadata.daysSinceCommit,
      status: metadata.status,
      daysSinceStatusUpdate: statusInfo
        ? daysSinceUpdated(statusInfo.updatedAt)
        : null,
      hasStatusFile: statusInfo !== null,
    };
  } catch (err) {
    console.log("[BackupMonitor] scan failed for project:", project.name, err);
    return {
      projectId: project.id,
      projectName: project.name,
      projectPath: project.path,
      branch: NO_GIT_METADATA.branch,
      commitMessage: NO_GIT_METADATA.commitMessage,
      daysSinceCommit: NO_GIT_METADATA.daysSinceCommit,
      status: NO_GIT_METADATA.status,
      daysSinceStatusUpdate: null,
      hasStatusFile: false,
    };
  }
}

export function useBackupMonitor() {
  const {
    setBackupStatus,
    setBackupItems,
    setBackupScanning,
    setLastBackupScan,
    registerBackupScan,
  } = useAppStore();
  const scanInFlight = useRef(false);
  const settersRef = useRef({
    setBackupStatus,
    setBackupItems,
    setBackupScanning,
    setLastBackupScan,
  });
  settersRef.current = {
    setBackupStatus,
    setBackupItems,
    setBackupScanning,
    setLastBackupScan,
  };

  const runBackupScan = useCallback(async (options?: { manual?: boolean }) => {
    if (scanInFlight.current) {
      console.log("[BackupMonitor] scan already in flight, skipping");
      return;
    }

    const {
      setBackupStatus: setStatus,
      setBackupItems: setItems,
      setBackupScanning: setScanning,
      setLastBackupScan: setLastScan,
    } = settersRef.current;

    scanInFlight.current = true;
    setScanning(true);
    console.log(
      "[BackupMonitor] scan started",
      options?.manual ? "(manual)" : "(scheduled)",
    );

    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      console.log(
        "[BackupMonitor] scan timed out after",
        SCAN_TIMEOUT_MS,
        "ms — showing no projects",
      );
      setItems([]);
      setStatus("ok", "all synced");
      setLastScan(new Date());
      scanInFlight.current = false;
      setScanning(false);
    }, SCAN_TIMEOUT_MS);

    try {
      console.log("[BackupMonitor] fetching projects");
      const projects = await fetchProjects();
      if (timedOut) return;

      console.log("[BackupMonitor] found", projects.length, "projects");
      if (projects.length === 0) {
        setItems([]);
        setStatus("ok", "all synced");
        setLastScan(new Date());
        return;
      }

      console.log("[BackupMonitor] scanning git metadata for all projects");
      const backupItems = await Promise.all(
        projects.map((project) => buildBackupInfo(project)),
      );
      if (timedOut) return;

      console.log("[BackupMonitor] scan complete,", backupItems.length, "items");
      setItems(backupItems);
      setLastScan(new Date());

      const health = computeOverallBackupHealth(
        backupItems.map((item) => item.status),
      );
      const summary = formatBackupSummary(backupItems);
      setStatus(health, summary);

      console.log("[BackupMonitor] notifying critical projects");
      try {
        await notifyCriticalProjects(backupItems);
      } catch (err) {
        console.log("[BackupMonitor] notification failed:", err);
      }
    } catch (err) {
      console.log("[BackupMonitor] scan error:", err);
      if (!timedOut) {
        setItems([]);
        setStatus("ok", "all synced");
        setLastScan(new Date());
      }
    } finally {
      window.clearTimeout(timeoutId);
      if (!timedOut) {
        scanInFlight.current = false;
        setScanning(false);
        console.log("[BackupMonitor] scan finished");
      }
    }
  }, []);

  useEffect(() => {
    registerBackupScan(runBackupScan);

    console.log("[BackupMonitor] initial scan on startup");
    void runBackupScan();

    console.log(
      "[BackupMonitor] scheduling interval every",
      REFRESH_INTERVAL_MS,
      "ms",
    );
    const intervalId = window.setInterval(() => {
      console.log("[BackupMonitor] scheduled 30-minute scan");
      void runBackupScan();
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [registerBackupScan, runBackupScan]);
}
