import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/axios";

type Ticket = {
  id: number;
  ticketId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  requesterId: number;
  createdAt: string;
  updatedAt: string;
};

type Activity = {
  id: number;
  type: string;
  message: string;
  fromStatus: string | null;
  toStatus: string | null;
  createdById: number | null;
  createdByName: string | null;
  createdAt: string;
};

const STATUS = ["Open", "InProgress", "Resolved", "Closed"];

export default function TicketDetail() {
  const { id } = useParams();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [timeline, setTimeline] = useState<Activity[]>([]);
  const [error, setError] = useState("");

  const [newStatus, setNewStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [okMsg, setOkMsg] = useState("");

  // ✅ evita race conditions: solo aplica la última respuesta
  const lastReq = useRef(0);

  const load = async () => {
    if (!id) return;

    const reqId = ++lastReq.current;
    setError("");
    setOkMsg("");

    try {
      const [t, tl] = await Promise.all([
        api.get<Ticket>(`/api/tickets/${id}`),
        api.get<Activity[]>(`/api/tickets/${id}/timeline`),
      ]);

      // ✅ si llegó una respuesta vieja, la ignoramos
      if (reqId !== lastReq.current) return;

      setTicket(t.data);
      setTimeline(tl.data);

      // si aún no han seleccionado, setea el status actual
      setNewStatus((prev) => (prev ? prev : t.data.status));
    } catch {
      if (reqId !== lastReq.current) return;
      setError("No se pudo cargar el ticket.");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateStatus = async () => {
    if (!id) return;
    if (!newStatus.trim()) return;

    setSaving(true);
    setError("");
    setOkMsg("");

    try {
      await api.put(`/api/tickets/${id}/status`, { status: newStatus });
      setOkMsg("Estado actualizado ✅");
      await load(); // refresca ticket + timeline
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data ||
        "No se pudo actualizar el estado.";
      setError(String(msg));
    } finally {
      setSaving(false);
    }
  };

  if (error && !ticket) return <div style={styles.page}>{error}</div>;
  if (!ticket) return <div style={styles.page}>Cargando...</div>;

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => window.history.back()}>
        ← Atras
      </button>
      <div style={styles.headerRow}>
        <div>
          <h2 style={{ marginTop: 0 }}>{ticket.title}</h2>

          <div style={styles.meta}>
            <span style={styles.badge}>{ticket.ticketId}</span>

            {/* ✅ badge de status con color */}
            <span style={{ ...styles.badge, ...statusPillStyle(ticket.status) }}>
              {ticket.status}
            </span>

            <span style={styles.badge}>{ticket.priority}</span>
            <span style={styles.badge}>{ticket.category}</span>
          </div>
        </div>

        {/* ✅ Panel de cambio de estado */}
        <div style={styles.statusBox}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
            Cambiar estado
          </div>

          <div style={styles.statusRow}>
            <select
              style={{
                ...styles.select,
                ...statusSelectStyle(newStatus),
                opacity: saving ? 0.7 : 1,
                cursor: saving ? "not-allowed" : "pointer",
              }}
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              disabled={saving}
              title="Cambiar estado"
            >
              {STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <button style={styles.btn} onClick={updateStatus} disabled={saving}>
              {saving ? "Guardando..." : "Actualizar"}
            </button>
          </div>

          {okMsg && <div style={styles.ok}>{okMsg}</div>}
          {error && <div style={styles.error}>{error}</div>}
        </div>
      </div>

      <div style={styles.card}>
        <div style={{ opacity: 0.8, marginBottom: 8 }}>Descripción</div>
        <div>{ticket.description}</div>
      </div>

      <div style={{ marginTop: 16, fontWeight: 800 }}>Activity Timeline</div>

      <div style={styles.timelineCard}>
        <div style={styles.timelineScroll}>
          {timeline.length === 0 && (
            <div style={{ opacity: 0.7 }}>Sin actividades.</div>
          )}

          {timeline.map((a) => {
            const theme = activityTheme(a.type);
            return (
              <div key={a.id} style={{ ...styles.item, ...theme.item }}>
                <div style={styles.itemTop}>
                  <span style={{ ...styles.pill, ...theme.pill }}>{a.type}</span>

                  {a.type === "StatusChanged" && (
                    <span style={styles.change}>
                      {a.fromStatus ?? "?"} → {a.toStatus ?? "?"}
                    </span>
                  )}
                </div>

                <div style={{ opacity: 0.9 }}>{a.message}</div>

                <div style={styles.small}>
                  {new Date(a.createdAt).toLocaleString()} ·{" "}
                  {a.createdByName ?? "N/A"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

/* ====== Colores por estado (mismo tema que Tickets.tsx) ====== */
function statusTheme(status: string) {
  switch (status) {
    case "Open":
      return { bg: "rgba(234,179,8,.18)", bd: "rgba(234,179,8,.45)", tx: "#eab308" }; // amarillo
    case "InProgress":
      return { bg: "rgba(59,130,246,.18)", bd: "rgba(59,130,246,.45)", tx: "#3b82f6" }; // azul
    case "Resolved":
      return { bg: "rgba(34,197,94,.18)", bd: "rgba(34,197,94,.45)", tx: "#22c55e" }; // verde
    case "Closed":
      return { bg: "rgba(148,163,184,.16)", bd: "rgba(148,163,184,.35)", tx: "#94a3b8" }; // gris
    default:
      return { bg: "#0c1427", bd: "#2a3b63", tx: "#e9eefc" };
  }
}

function statusSelectStyle(status: string): React.CSSProperties {
  const t = statusTheme(status);
  return { background: t.bg, border: `1px solid ${t.bd}`, color: t.tx };
}

function statusPillStyle(status: string): React.CSSProperties {
  const t = statusTheme(status);
  return { background: t.bg, border: `1px solid ${t.bd}`, color: t.tx, fontWeight: 800 };
}

function activityTheme(type: string) {
  switch (type) {
    case "Created":
      return {
        pill: { background: "rgba(34,197,94,.16)", borderColor: "rgba(34,197,94,.35)", color: "#22c55e" },
        item: { borderBottomColor: "rgba(34,197,94,.18)" },
      };
    case "StatusChanged":
      return {
        pill: { background: "rgba(59,130,246,.16)", borderColor: "rgba(59,130,246,.35)", color: "#3b82f6" },
        item: { borderBottomColor: "rgba(59,130,246,.18)" },
      };
    default:
      return {
        pill: { background: "rgba(148,163,184,.12)", borderColor: "rgba(148,163,184,.28)", color: "#94a3b8" },
        item: { borderBottomColor: "rgba(148,163,184,.14)" },
      };
  }
}

// Estilos
const styles: Record<string, React.CSSProperties> = {
  page: { width: "100%", color: "#e9eefc" },

  headerRow: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },

  statusBox: {
    minWidth: 260,
    background: "#111a2e",
    border: "1px solid #1f2a44",
    borderRadius: 14,
    padding: 12,
  },
  statusRow: { display: "flex", gap: 10, alignItems: "center" },

  select: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #2a3b63",
    background: "#0c1427",
    color: "#e9eefc",
    outline: "none",
    fontWeight: 800,
  },

  btn: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "none",
    background: "#22c55e",
    color: "#06230f",
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  ok: {
    marginTop: 10,
    background: "rgba(34,197,94,.12)",
    border: "1px solid rgba(34,197,94,.35)",
    color: "#bbf7d0",
    padding: 10,
    borderRadius: 10,
    fontSize: 13,
  },
  error: {
    marginTop: 10,
    background: "rgba(239,68,68,.15)",
    border: "1px solid rgba(239,68,68,.35)",
    color: "#fecaca",
    padding: 10,
    borderRadius: 10,
    fontSize: 13,
  },

  card: {
    marginTop: 10,
    background: "#111a2e",
    border: "1px solid #1f2a44",
    borderRadius: 14,
    padding: 14,
  },

  meta: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 },
  badge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid #2a3b63",
    background: "#0c1427",
    fontSize: 12,
  },

  item: { padding: "10px 0", borderBottom: "1px solid #1f2a44" },
  small: { marginTop: 4, fontSize: 12, opacity: 0.7 },

  backBtn: {
    marginBottom: 10,
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid #2a3b63",
    background: "#0c1427",
    color: "#e9eefc",
    cursor: "pointer",
    fontWeight: 800,
  },

  itemTop: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: 6,
  },

  pill: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid #2a3b63",
    background: "#0c1427",
    fontSize: 12,
    fontWeight: 900,
  },

  change: {
    fontSize: 12,
    opacity: 0.9,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px dashed #2a3b63",
    background: "rgba(12,20,39,.6)",
  },

  timelineCard: {
    marginTop: 10,
  background: "#111a2e",
  border: "1px solid #1f2a44",
  borderRadius: 14,
  padding: 10},

  timelineScroll: {
    maxHeight: 420, // controla altura del scroll
    overflowY: "auto",
    paddingRight: 4, // espacio para scrollbar
  },
};