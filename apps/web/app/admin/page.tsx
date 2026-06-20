"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Overview {
  chunksIndexed: number;
  traceCount: number;
  ai: Record<string, unknown>;
  mutation: Record<string, unknown>;
}

interface RagTrace {
  id: string;
  query: string;
  rejected: boolean;
  confidence: number | null;
  validatorPassed: boolean;
  createdAt: string;
}

interface Mutation {
  id: string;
  mutationType: string;
  triggerMetric: string;
  applied: boolean;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [traces, setTraces] = useState<RagTrace[]>([]);
  const [mutations, setMutations] = useState<Mutation[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/overview").then((r) => r.json()),
      fetch("/api/admin/traces?limit=20").then((r) => r.json()),
      fetch("/api/admin/mutations?limit=20").then((r) => r.json()),
    ])
      .then(([ov, tr, mu]) => {
        if (ov.error) throw new Error(ov.error);
        setOverview(ov);
        setTraces(tr.traces ?? []);
        setMutations(mu.mutations ?? []);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const logout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    window.location.href = "/admin/login";
  };

  if (error) {
    return (
      <main className="admin-page">
        <h1>Admin</h1>
        <p className="admin-error">{error}</p>
        <Link href="/">← Về trang chủ</Link>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="admin-subtitle">RAG traces · mutations · system health</p>
        </div>
        <button type="button" className="admin-logout" onClick={logout}>
          Đăng xuất
        </button>
      </header>

      {overview && (
        <section className="admin-cards">
          <div className="admin-card">
            <span className="admin-card-label">Chunks indexed</span>
            <strong>{overview.chunksIndexed}</strong>
          </div>
          <div className="admin-card">
            <span className="admin-card-label">RAG traces</span>
            <strong>{overview.traceCount}</strong>
          </div>
          <div className="admin-card">
            <span className="admin-card-label">LLM provider</span>
            <strong>{String(overview.ai.active ?? "—")}</strong>
          </div>
          <div className="admin-card">
            <span className="admin-card-label">Retrieval</span>
            <strong>{String(overview.ai.embedProvider ?? "—")}</strong>
          </div>
        </section>
      )}

      <section className="admin-section">
        <h2>Recent RAG queries</h2>
        {traces.length === 0 ? (
          <p className="admin-empty">Chưa có trace nào</p>
        ) : (
          <ul className="admin-list">
            {traces.map((t) => (
              <li key={t.id} className={t.rejected ? "admin-list--fail" : "admin-list--ok"}>
                <strong>{t.query}</strong>
                <span>
                  {t.rejected ? "✗ rejected" : "✓ ok"} · conf{" "}
                  {t.confidence != null ? t.confidence.toFixed(2) : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-section">
        <h2>System mutations</h2>
        {mutations.length === 0 ? (
          <p className="admin-empty">Chưa có mutation nào</p>
        ) : (
          <ul className="admin-list">
            {mutations.map((m) => (
              <li key={m.id}>
                <strong>{m.mutationType}</strong>
                <span>
                  {m.triggerMetric} · {m.applied ? "applied" : "pending"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href="/" className="admin-back">
        ← Về trang chủ
      </Link>
    </main>
  );
}
