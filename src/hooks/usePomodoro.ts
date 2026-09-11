import { useCallback, useEffect, useRef, useState } from "react";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import type { PomodoroPhase } from "../types";

const PHASE_DURATIONS_S: Record<PomodoroPhase, number> = {
  work: 25 * 60,
  break: 5 * 60,
};

export interface Pomodoro {
  phase: PomodoroPhase;
  remaining: number;
  running: boolean;
  completedSessions: number;
  toggle: () => void;
  reset: () => void;
}

async function notifyPhaseEnd(finished: PomodoroPhase): Promise<void> {
  let granted = await isPermissionGranted();
  if (!granted) {
    granted = (await requestPermission()) === "granted";
  }
  if (!granted) return;

  sendNotification(
    finished === "work"
      ? { title: "JMM — work session done", body: "Take a 5 minute break." }
      : { title: "JMM — break over", body: "Back to it: 25 minute session." },
  );
}

export function usePomodoro(): Pomodoro {
  const [phase, setPhase] = useState<PomodoroPhase>("work");
  const [remaining, setRemaining] = useState(PHASE_DURATIONS_S.work);
  const [running, setRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const deadlineRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;

    const intervalId = window.setInterval(() => {
      const deadline = deadlineRef.current;
      if (deadline === null) return;

      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      if (left > 0) {
        setRemaining(left);
        return;
      }

      const next: PomodoroPhase = phase === "work" ? "break" : "work";
      if (phase === "work") setCompletedSessions((count) => count + 1);
      deadlineRef.current = Date.now() + PHASE_DURATIONS_S[next] * 1000;
      setPhase(next);
      setRemaining(PHASE_DURATIONS_S[next]);
      void notifyPhaseEnd(phase);
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [running, phase]);

  const toggle = useCallback(() => {
    setRunning((wasRunning) => {
      if (!wasRunning) {
        deadlineRef.current = Date.now() + remaining * 1000;
      }
      return !wasRunning;
    });
  }, [remaining]);

  const reset = useCallback(() => {
    deadlineRef.current = null;
    setRunning(false);
    setPhase("work");
    setRemaining(PHASE_DURATIONS_S.work);
  }, []);

  return { phase, remaining, running, completedSessions, toggle, reset };
}

export function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
