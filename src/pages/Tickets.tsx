import { useEffect, useMemo, useState } from "react";
import { api } from "../api/axios";
import { useNavigate } from "react-router-dom";

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

const STATUS = ["Open", "InProgress", "Resolved", "Closed"];
const PRIORITY = ["Low", "Medium", "High"];
const CATEGORY = ["Soporte TI", "Hardware", "Software", "Red", "Otros"];

export default function Tickets() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [newCategory, setNewCategory] = useState("Soporte TI");
  const [newErr, setNewErr] = useState("");
  // Create Ticket Function
  const createTicket = async () => {
    setNewErr("");
    if (!newTitle.trim()) return setNewErr("El título es requerido.");
    if (!newDesc.trim()) return setNewErr("La descripción es requerida.");

    setCreating(true);
    try {
      await api.post("/api/tickets", {
        title: newTitle,
        description: newDesc,
        priority: newPriority,
        category: newCategory,
        status: "Open",
      });

      // reset + cerrar
      setNewTitle("");
      setNewDesc("");
      setNewPriority("Medium");
      setNewCategory("Soporte TI");
      setShowNew(false);

      // recargar lista
      await load();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data ||
        "No se pudo crear el ticket.";
      setNewErr(String(msg));
    } finally {
      setCreating(false);
    }
  };

  // ✅ control de updates por fila
  const [savingId, setSavingId] = useState<number | null>(null);
  const [rowMsg, setRowMsg] = useState<Record<number, string>>({});

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    const s = params.toString();
    return s ? `?${s}` : "";
  }, [q, status]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get<Ticket[]>(`/api/tickets${queryString}`);
      setItems(res.data);
    } catch {
      setError("No se pudo cargar la lista de tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  const updateStatusInline = async (ticketId: number, newStatus: string) => {
    setRowMsg((prev) => ({ ...prev, [ticketId]: "" }));
    setSavingId(ticketId);

    // Guardamos estado previo (por si hay rollback)
    const prevTicket = items.find((x) => x.id === ticketId);

    // Optimistic UI (instantáneo)
    setItems((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
    );

    try {
      await api.put(`/api/tickets/${ticketId}/status`, { status: newStatus });

      // ✅ "más fino": traer el ticket real de la BD (updatedAt real, etc.)
      const fresh = await api.get<Ticket>(`/api/tickets/${ticketId}`);

      setItems((prev) =>
        prev.map((t) => (t.id === ticketId ? fresh.data : t))
      );

      setRowMsg((prev) => ({ ...prev, [ticketId]: "✅ Guardado" }));
    } catch (err: any) {
      // rollback
      if (prevTicket) {
        setItems((prev) => prev.map((t) => (t.id === ticketId ? prevTicket : t)));
      }

      const msg =
        err?.response?.data?.error ||
        err?.response?.data ||
        "No se pudo actualizar el estado.";
      setRowMsg((prev) => ({ ...prev, [ticketId]: `❌ ${String(msg)}` }));
    } finally {
      setSavingId(null);
      setTimeout(() => {
        setRowMsg((prev) => {
          const copy = { ...prev };
          delete copy[ticketId];
          return copy;
        });
      }, 2500);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={{ margin: 0 }}>All Tickets</h2>
          <div style={styles.sub}>Ticket Queue</div>
        </div>

        <button style={styles.btn} onClick={() => setShowNew(true)}>
          + New Ticket
        </button>

      </div>

      <div style={styles.filters}>
        <input
          style={styles.input}
          placeholder="Search tickets, users, or IDs..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <select
          style={styles.select}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Status: All</option>
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button style={styles.btnSecondary} onClick={load} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {showNew && (
        <div style={styles.modalOverlay} onClick={() => !creating && setShowNew(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Crear nuevo ticket</div>

            <label style={styles.modalLabel}>Título</label>
            <input
              style={styles.modalInput}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ej: Error en guía de remisión"
              disabled={creating}
            />

            <label style={styles.modalLabel}>Descripción</label>
            <textarea
              style={styles.modalTextarea}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Describe el problema con detalle..."
              disabled={creating}
            />

            <div style={styles.modalRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.modalLabel}>Prioridad</label>
                <select
                  style={styles.modalSelect}
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  disabled={creating}
                >
                  {PRIORITY.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label style={styles.modalLabel}>Categoría</label>
                <select
                  style={styles.modalSelect}
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  disabled={creating}
                >
                  {CATEGORY.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {newErr && <div style={styles.error}>{newErr}</div>}

            <div style={styles.modalActions}>
              <button
                style={styles.btnSecondary}
                onClick={() => setShowNew(false)}
                disabled={creating}
              >
                Cancelar
              </button>

              <button style={styles.btn} onClick={createTicket} disabled={creating}>
                {creating ? "Creando..." : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Subject</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Priority</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Updated</th>
              <th style={styles.th}></th>
            </tr>
          </thead>

          <tbody>
            {items.map((t) => (
              <tr key={t.id} style={styles.tr}>
                <td style={styles.tdMono}>{t.ticketId}</td>

                <td style={styles.td}>
                  <div style={{ fontWeight: 800 }}>{t.title}</div>
                  <div style={styles.small}>{t.description}</div>
                  {!!rowMsg[t.id] && (
                    <div style={styles.rowMsg}>{rowMsg[t.id]}</div>
                  )}
                </td>

                {/* ✅ Status inline */}
                <td style={styles.td}>
                  <select
                    style={{ ...styles.selectInline, ...statusSelectStyle(t.status) }}
                    value={t.status}
                    disabled={savingId === t.id}
                    onChange={(e) => updateStatusInline(t.id, e.target.value)}
                    title="Cambiar estado"
                  >
                    {STATUS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>

                <td style={styles.td}>{badge(t.priority)}</td>
                <td style={styles.td}>{t.category}</td>
                <td style={styles.td}>
                  {new Date(t.updatedAt).toLocaleString()}
                </td>

                <td style={styles.td}>
                  <button
                    style={styles.linkBtn}
                    onClick={() => navigate(`/tickets/${t.id}`)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}

            {!loading && items.length === 0 && (
              <tr>
                <td style={styles.td} colSpan={7}>
                  No hay tickets con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function badge(text: string) {
  return <span style={styles.badge}>{text}</span>;
}

function statusTheme(status: string) {
  switch (status) {
    case "Open":
      return { bg: "rgba(234,179,8,.18)", bd: "rgba(234,179,8,.45)", tx: "#caba75ff" }; // amarillo
    case "InProgress":
      return { bg: "rgba(59,130,246,.18)", bd: "rgba(59,130,246,.45)", tx: "#8ebef9ff" }; // azul
    case "Resolved":
      return { bg: "rgba(34,197,94,.18)", bd: "rgba(34,197,94,.45)", tx: "#82f5aaff" }; // verde
    case "Closed":
      return { bg: "rgba(148,163,184,.16)", bd: "rgba(148,163,184,.35)", tx: "#507099ff" }; // gris
    default:
      return { bg: "#0c1427", bd: "#2a3b63", tx: "#e9eefc" };
  }
}

function statusSelectStyle(status: string): React.CSSProperties {
  const t = statusTheme(status);
  return {
    background: t.bg,
    border: `1px solid ${t.bd}`,
    color: t.tx,
  };
}


const styles: Record<string, React.CSSProperties> = {
  page: { width: "100%", color: "#e9eefc", padding: 0 },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  sub: { opacity: 0.7, marginTop: 4 },

  filters: { display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" },
  input: {
    flex: 1,
    minWidth: 260,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #2a3b63",
    background: "#0c1427",
    color: "#e9eefc",
    outline: "none",
  },
  select: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #2a3b63",
    background: "#0c1427",
    color: "#e9eefc",
    outline: "none",
  },
  btn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    background: "#22c55e",
    color: "#06230f",
    fontWeight: 800,
    cursor: "pointer",
  },
  btnSecondary: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #2a3b63",
    background: "#111a2e",
    color: "#e9eefc",
    fontWeight: 700,
    cursor: "pointer",
  },

  tableWrap: {
    marginTop: 14,
    background: "#111a2e",
    border: "1px solid #1f2a44",
    borderRadius: 14,
    overflow: "auto",
  },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 980 },
  th: { textAlign: "left", padding: 12, fontSize: 12, opacity: 0.75, borderBottom: "1px solid #1f2a44" },
  tr: { borderBottom: "1px solid #1f2a44" },
  td: { padding: 12, verticalAlign: "top" },
  tdMono: { padding: 12, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", whiteSpace: "nowrap" },
  small: { fontSize: 12, opacity: 0.7, marginTop: 4 },

  rowMsg: { marginTop: 6, fontSize: 12, opacity: 0.85 },

  badge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid #2a3b63",
    background: "#0c1427",
    fontSize: 12,
  },

  selectInline: {
    width: "100%",
    minWidth: 140,
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #2a3b63",
    background: "#0c1427",
    color: "#e9eefc",
    outline: "none",
    fontWeight: 700,
  },

  linkBtn: {
    padding: "6px 10px",
    borderRadius: 10,
    border: "1px solid #2a3b63",
    background: "#0c1427",
    color: "#e9eefc",
    cursor: "pointer",
    fontWeight: 700,
  },
  error: {
    marginTop: 12,
    background: "rgba(239,68,68,.15)",
    border: "1px solid rgba(239,68,68,.35)",
    color: "#fecaca",
    padding: 10,
    borderRadius: 10,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.55)",
    display: "grid",
    placeItems: "center",
    padding: 14,
    zIndex: 50,
  },
  modal: {
    width: "100%",
    maxWidth: 520,
    background: "#0c1427",
    border: "1px solid #1f2a44",
    borderRadius: 14,
    padding: 14,
    boxShadow: "0 18px 50px rgba(0,0,0,.5)",
  },
  modalTitle: { fontSize: 16, fontWeight: 900, marginBottom: 10 },
  modalLabel: { fontSize: 12, opacity: 0.8, display: "block", marginTop: 10, marginBottom: 6 },
  modalInput: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #2a3b63",
    background: "#111a2e",
    color: "#e9eefc",
    outline: "none",
  },
  modalTextarea: {
    width: "100%",
    minHeight: 110,
    resize: "vertical",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #2a3b63",
    background: "#111a2e",
    color: "#e9eefc",
    outline: "none",
  },
  modalRow: { display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" },
  modalSelect: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #2a3b63",
    background: "#111a2e",
    color: "#e9eefc",
    outline: "none",
  },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 },
};