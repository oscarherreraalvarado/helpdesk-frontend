import { useState } from "react";
import { api } from "../api/axios";
import { useNavigate } from "react-router-dom";

type RegisterResponse = {
  token: string;
  user: { id: number; nombre: string; email: string; role: string };
};

export default function Register() {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nombre.trim() || !email.trim() || !password.trim()) {
      setError("Nombre, Email y Password son requeridos.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      await api.post<RegisterResponse>("/api/auth/register", {
        nombre,
        email,
        password,
      });

      // ✅ NO guardamos token ni user (que inicie sesión manualmente)
      // localStorage.setItem("token", res.data.token);
      // localStorage.setItem("user", JSON.stringify(res.data.user));

      // Opcional: guardar un mensajito para mostrar en Login
      localStorage.setItem("register_ok", "Cuenta creada. Inicia sesión.");

      navigate("/", { replace: true });
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data;

      if (status === 400) setError(String(msg || "Completa los campos requeridos."));
      else if (status === 409) setError(String(msg || "Ya existe un usuario con ese email."));
      else setError(String(msg || "Error del servidor. Intenta de nuevo."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.title}>Crear cuenta</div>

        <form onSubmit={onSubmit} style={styles.form}>
          <label style={styles.label}>Nombre</label>
          <input
            style={styles.input}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />

          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label style={styles.label}>Confirm Password</label>
          <input
            style={styles.input}
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          {error && <div style={styles.error}>{error}</div>}

          <button style={styles.button} disabled={loading}>
            {loading ? "Creando..." : "Register"}
          </button>

          <div style={styles.back} onClick={() => navigate("/")}>
            Volver al login
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", display: "grid", placeItems: "center", background: "#0b1220", padding: 16 },
  card: { width: "100%", maxWidth: 460, background: "#111a2e", border: "1px solid #1f2a44", borderRadius: 16, padding: 20, color: "#e9eefc" },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 12 },
  form: { display: "grid", gap: 10 },
  label: { fontSize: 13, opacity: 0.85 },
  input: { padding: "10px 12px", borderRadius: 10, border: "1px solid #2a3b63", outline: "none", background: "#0c1427", color: "#e9eefc" },
  button: { marginTop: 8, padding: "10px 12px", borderRadius: 10, border: "none", background: "#22c55e", color: "#06230f", fontWeight: 700, cursor: "pointer" },
  error: { background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.35)", color: "#fecaca", padding: 10, borderRadius: 10, fontSize: 13 },
  back: { marginTop: 10, fontSize: 12, opacity: 0.85, cursor: "pointer", textDecoration: "underline" },
};