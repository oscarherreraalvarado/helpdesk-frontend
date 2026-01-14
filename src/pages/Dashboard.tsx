import { useEffect, useState } from "react";
import { api } from "../api/axios";

type Summary = {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  createdLast7Days: number;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
};

function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>{title}</div>
      <div style={styles.cardValue}>{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    api.get<Summary>("/api/dashboard/summary")
      .then((r) => setSummary(r.data))
      .catch(() => setError("No se pudo cargar el dashboard."));
  }, []);

  const high = summary?.byPriority?.High ?? 0;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={{ margin: 0 }}>Dashboard</h2>
          <div style={styles.sub}>Bienvenido, {user?.nombre ?? "Usuario"}</div>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {!summary && !error && <div style={styles.loading}>Cargando...</div>}

      {summary && (
        <>
          <div style={styles.grid}>
            <Card title="Total Tickets" value={summary.totalTickets} />
            <Card title="Open Tickets" value={summary.openTickets} />
            <Card title="In Progress" value={summary.inProgressTickets} />
            <Card title="High Priority" value={high} />
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>Resumen (debug)</div>
            <pre style={styles.pre}>{JSON.stringify(summary, null, 2)}</pre>
          </div>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    width: "100%",
    color: "#e9eefc",
    padding: 0,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sub: { opacity: 0.75, marginTop: 4 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
    marginTop: 14,
  },
  card: {
    background: "#111a2e",
    border: "1px solid #1f2a44",
    borderRadius: 14,
    padding: 14,
    boxShadow: "0 10px 30px rgba(0,0,0,.25)",
  },
  cardTitle: { fontSize: 13, opacity: 0.75, marginBottom: 8 },
  cardValue: { fontSize: 26, fontWeight: 800 },
  section: { marginTop: 16, paddingBottom: 24 },
  sectionTitle: { opacity: 0.8, marginBottom: 8 },
  pre: {
    background: "#111a2e",
    border: "1px solid #1f2a44",
    borderRadius: 14,
    padding: 12,
    overflow: "auto",
    maxHeight : 250,
  },
  error: {
    background: "rgba(239,68,68,.15)",
    border: "1px solid rgba(239,68,68,.35)",
    color: "#fecaca",
    padding: 10,
    borderRadius: 10,
  },
  loading: { opacity: 0.8, paddingTop: 10 },
};
