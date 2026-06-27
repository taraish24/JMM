interface BlockProgressProps {
  value: number;
  total?: number;
}

export function BlockProgress({
  value,
  total = 20,
}: BlockProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const filled = Math.round((clamped / 100) * total);
  const empty = total - filled;

  const bar =
    "█".repeat(filled) + "░".repeat(empty);

  return (
    <div className="block-progress">
      <span className="block-progress-bar">[{bar}]</span>
      <span className="block-progress-pct">{clamped}%</span>
    </div>
  );
}

interface TerminalHeaderProps {
  command: string;
}

export function TerminalHeader({ command }: TerminalHeaderProps) {
  return (
    <div className="terminal-header">
      <span className="prompt">[t4sh@jmm ~]$</span>{" "}
      <span className="command">{command}</span>
    </div>
  );
}
