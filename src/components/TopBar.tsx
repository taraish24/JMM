import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function TopBar() {
  const [now, setNow] = useState(new Date());
  const [uptime, setUptime] = useState("—");

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    invoke<string>("get_system_uptime")
      .then(setUptime)
      .catch(() => setUptime("—"));

    const interval = setInterval(() => {
      invoke<string>("get_system_uptime")
        .then(setUptime)
        .catch(() => setUptime("—"));
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-prompt">[t4sh@jmm ~]$</span>
        <span className="topbar-title">just-make-money</span>
        <span className="topbar-version">v0.1.0</span>
      </div>

      <div className="topbar-right">
        <span className="topbar-stat">
          <span className="topbar-stat-label">date</span>
          {formatDate(now)}
        </span>
        <span className="topbar-divider">|</span>
        <span className="topbar-stat">
          <span className="topbar-stat-label">time</span>
          {formatTime(now)}
        </span>
        <span className="topbar-divider">|</span>
        <span className="topbar-stat">
          <span className="topbar-stat-label">uptime</span>
          {uptime}
        </span>
      </div>

      <style>{`
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 100%;
          padding: 0 20px;
          background: var(--bg);
        }

        .topbar-left {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .topbar-prompt {
          color: var(--accent);
          font-size: 12px;
        }

        .topbar-title {
          color: var(--text);
          font-weight: 600;
        }

        .topbar-version {
          color: var(--muted);
          font-size: 11px;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
        }

        .topbar-stat {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .topbar-stat-label {
          color: var(--muted);
          font-size: 10px;
          text-transform: uppercase;
        }

        .topbar-divider {
          color: var(--border);
        }
      `}</style>
    </header>
  );
}
