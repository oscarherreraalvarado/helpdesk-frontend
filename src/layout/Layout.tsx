import { NavLink, Outlet, useNavigate } from "react-router-dom";

export default function Layout() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.logo}>🎫</div>
          <div>
            <div style={styles.brandName}>TicketManager</div>
            <div style={styles.brandSub}>Helpdesk</div>
          </div>
        </div>

        <nav style={styles.nav}>
          <SideLink to="/dashboard" label="Dashboard" />
          <SideLink to="/tickets" label="All Tickets" />
        </nav>

        <div style={styles.footer}>
          <div style={styles.userBox}>
            <div style={styles.avatar}>
              {(user?.nombre ?? "U").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13 }}>
                {user?.nombre ?? "Usuario"}
              </div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>
                {user?.role ?? "User"}
              </div>
            </div>
          </div>

          <button style={styles.logout} onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <div style={styles.topbar}>
          <div style={{ opacity: 0.8, fontSize: 13 }}>
            {user?.email ?? ""}
          </div>
        </div>

        <div style={styles.content}>
          <div style={styles.container}>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

function SideLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...styles.link,
        ...(isActive ? styles.linkActive : {}),
      })}
    >
      {label}
    </NavLink>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: "100vh",
    background: "#0b1220",
    color: "#e9eefc",
    display: "grid",
    gridTemplateColumns: "260px minmax(0, 1fr)",
  },
  sidebar: {
    borderRight: "1px solid #1f2a44",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    background: "linear-gradient(180deg,#0b1220 0%, #091028 100%)",
  },
  brand: { display: "flex", gap: 12, alignItems: "center", padding: 8 },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 14,
    background: "#111a2e",
    border: "1px solid #1f2a44",
    display: "grid",
    placeItems: "center",
    fontSize: 20,
  },
  brandName: { fontWeight: 900, fontSize: 18, lineHeight: 1.1 },
  brandSub: { opacity: 0.7, fontSize: 12 },
  nav: { display: "flex", flexDirection: "column", gap: 8, marginTop: 6 },
  link: {
    padding: "10px 12px",
    borderRadius: 12,
    textDecoration: "none",
    color: "#e9eefc",
    border: "1px solid transparent",
    background: "transparent",
    opacity: 0.9,
    fontWeight: 700,
  },
  linkActive: {
    background: "#111a2e",
    border: "1px solid #1f2a44",
  },
  footer: { marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 },
  userBox: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    padding: 10,
    borderRadius: 14,
    border: "1px solid #1f2a44",
    background: "#111a2e",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    border: "1px solid #2a3b63",
    background: "#0c1427",
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
  },
  logout: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #2a3b63",
    background: "#0c1427",
    color: "#e9eefc",
    fontWeight: 800,
    cursor: "pointer",
  },
  main: { display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 },
  topbar: {
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: "0 16px",
    borderBottom: "1px solid #1f2a44",
    background: "rgba(17,26,46,.75)",
    backdropFilter: "blur(8px)",
  },

  content: { padding: 18, overflow: "auto", display: "flex"},
  container: {
    maxWidth: 1400,
    margin: "0 auto",
    width: "100%",
    minWidth: 0,
    paddingBottom: 24,
  },
};