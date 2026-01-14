import { useState } from "react";
import { api } from "../api/axios";
import { useNavigate } from "react-router-dom";

type LoginResponse = {
  token: string;
  user: {
    id: number;
    nombre: string;
    email: string;
    role: string;
  };
};

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("oscar@example.com");
  const [password, setPassword] = useState("1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post<LoginResponse>("/api/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      // Guardar sesión (simple)
      //localStorage.setItem("user", JSON.stringify(res.data));

      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data ||
        "No se pudo iniciar sesión.";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <div style={styles.logo}>🎫</div>
          <div>
            <div style={styles.title}>TicketManager</div>
            <div style={styles.subtitle}>Inicia sesión para acceder</div>
          </div>
        </div>

        <form onSubmit={onSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="oscar@example.com"
            type="email"
            required
          />

          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••"
            type="password"
            required
          />

          {error && <div style={styles.error}>{error}</div>}

          <button style={styles.button} disabled={loading}>
            {loading ? "Ingresando..." : "Sign In"}
          </button>
        </form>

        <div style={styles.footer}>
          Tip: usa el usuario que creaste en tu API.
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#0b1220",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "#111a2e",
    border: "1px solid #1f2a44",
    borderRadius: 16,
    padding: 20,
    color: "#e9eefc",
    boxShadow: "0 10px 30px rgba(0,0,0,.35)",
  },
  brand: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    background: "#1b2a52",
    fontSize: 20,
  },
  title: { fontSize: 18, fontWeight: 700 },
  subtitle: { fontSize: 13, opacity: 0.75 },
  form: { display: "grid", gap: 10 },
  label: { fontSize: 13, opacity: 0.85 },
  input: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #2a3b63",
    outline: "none",
    background: "#0c1427",
    color: "#e9eefc",
  },
  button: {
    marginTop: 8,
    padding: "10px 12px",
    borderRadius: 10,
    border: "none",
    background: "#22c55e",
    color: "#06230f",
    fontWeight: 700,
    cursor: "pointer",
  },
  error: {
    background: "rgba(239,68,68,.15)",
    border: "1px solid rgba(239,68,68,.35)",
    color: "#fecaca",
    padding: 10,
    borderRadius: 10,
    fontSize: 13,
  },
  footer: { marginTop: 14, fontSize: 12, opacity: 0.7 },
};