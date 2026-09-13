import { useCallback, useEffect, useState } from "react";
import type { IncomeEntry, Project } from "../../types";
import { fetchProjects } from "../../store/projects";
import {
  createIncomeEntry,
  currentMonthPrefix,
  deleteIncomeEntry,
  fetchIncomeEntries,
  formatAmount,
  todayIsoDate,
} from "../../store/income";
import { useAppStore } from "../../store/appStore";
import { TerminalHeader } from "../../components/BlockProgress";

export function IncomeTracker() {
  const { refreshIncome } = useAppStore();
  const [entries, setEntries] = useState<IncomeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [receivedAt, setReceivedAt] = useState(todayIsoDate());
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [entryRows, projectRows] = await Promise.all([
        fetchIncomeEntries(),
        fetchProjects(),
      ]);
      setEntries(entryRows);
      setProjects(projectRows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load income");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number.parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be a positive number");
      return;
    }
    if (!source.trim()) {
      setError("Source is required");
      return;
    }

    setSubmitting(true);
    try {
      await createIncomeEntry({
        project_id: projectId === "" ? null : Number.parseInt(projectId, 10),
        amount: parsedAmount,
        source: source.trim(),
        received_at: receivedAt,
      });
      setAmount("");
      setSource("");
      await load();
      await refreshIncome();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log income");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setError(null);
    try {
      await deleteIncomeEntry(id);
      await load();
      await refreshIncome();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove entry");
    }
  }

  const monthPrefix = currentMonthPrefix();
  const monthTotal = entries
    .filter((entry) => entry.received_at.startsWith(monthPrefix))
    .reduce((sum, entry) => sum + entry.amount, 0);
  const allTimeTotal = entries.reduce((sum, entry) => sum + entry.amount, 0);

  function projectName(id: number | null): string {
    if (id === null) return "—";
    return projects.find((project) => project.id === id)?.name ?? "—";
  }

  return (
    <div className="income">
      <div className="income-header">
        <TerminalHeader command="cat ./income --this-month" />
        <div className="income-totals">
          <span className="income-total-label">this month</span>
          <span className="income-total">${formatAmount(monthTotal)}</span>
          <span className="income-total-label">all time</span>
          <span className="income-total muted">
            ${formatAmount(allTimeTotal)}
          </span>
        </div>
      </div>

      <form className="income-form" onSubmit={handleSubmit}>
        <input
          className="income-input income-input--amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          inputMode="decimal"
        />
        <input
          className="income-input income-input--source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="source (client, sale, sponsor...)"
        />
        <select
          className="income-input"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        >
          <option value="">no project</option>
          {projects.map((project) => (
            <option key={project.id} value={String(project.id)}>
              {project.name}
            </option>
          ))}
        </select>
        <input
          className="income-input"
          type="date"
          value={receivedAt}
          onChange={(e) => setReceivedAt(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "logging..." : "log income"}
        </button>
      </form>

      {error && <p className="income-error">{error}</p>}

      {loading && (
        <div className="income-empty">
          <span className="prompt">[t4sh@jmm ~]$</span> loading...
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div className="income-empty">
          <span className="prompt">[t4sh@jmm ~]$</span> no income logged yet.
          every number starts at zero.
        </div>
      )}

      {!loading && entries.length > 0 && (
        <div className="income-list">
          {entries.map((entry) => (
            <div key={entry.id} className="income-row">
              <span className="income-row-date">{entry.received_at}</span>
              <span className="income-row-amount">
                ${formatAmount(entry.amount)}
              </span>
              <span className="income-row-source">{entry.source}</span>
              <span className="income-row-project">
                {projectName(entry.project_id)}
              </span>
              <button
                type="button"
                className="income-row-remove"
                onClick={() => handleDelete(entry.id)}
              >
                rm
              </button>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .income {
          padding: 24px;
          min-height: 100%;
        }

        .income-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
        }

        .income-totals {
          display: flex;
          align-items: baseline;
          gap: 8px;
          flex-shrink: 0;
        }

        .income-total-label {
          font-size: 10px;
          color: var(--muted);
          text-transform: uppercase;
        }

        .income-total {
          font-size: 14px;
          color: var(--accent);
          margin-right: 8px;
        }

        .income-total.muted {
          color: var(--muted);
        }

        .income-form {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          margin-bottom: 20px;
        }

        .income-input {
          background: var(--card);
          border: 1px solid var(--border);
          color: var(--text);
          font-family: inherit;
          font-size: 12px;
          padding: 8px 10px;
        }

        .income-input:focus {
          outline: none;
          border-color: var(--accent);
        }

        .income-input--amount {
          width: 90px;
        }

        .income-input--source {
          flex: 1;
          min-width: 160px;
        }

        .income-error {
          color: #ff4444;
          font-size: 11px;
          margin-bottom: 12px;
        }

        .income-row {
          display: grid;
          grid-template-columns: 100px 100px 1fr 140px 30px;
          gap: 12px;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid var(--border);
          font-size: 12px;
        }

        .income-row-date {
          color: var(--muted);
          font-size: 11px;
        }

        .income-row-amount {
          color: var(--accent);
        }

        .income-row-project {
          color: var(--muted);
          font-size: 11px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .income-row-remove {
          background: none;
          border: none;
          padding: 0;
          font-family: inherit;
          font-size: 10px;
          color: var(--muted);
          cursor: pointer;
          text-decoration: underline;
        }

        .income-row-remove:hover {
          color: #ff4444;
        }

        .income-empty {
          padding: 48px 0;
          color: var(--muted);
          font-size: 13px;
        }

        .income-empty .prompt {
          color: var(--accent);
        }
      `}</style>
    </div>
  );
}
