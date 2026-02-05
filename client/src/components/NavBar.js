// src/components/NavBar.js
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

export default function NavBar({ user, onLogout }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    // clear local storage + call parent handler
    localStorage.removeItem("user");
    if (typeof onLogout === "function") onLogout();
    navigate("/login");
  };

  const activeStyle = {
    color: "#0ea5a4",
    fontWeight: 700,
    borderBottom: "2px solid #0ea5a4",
    paddingBottom: 6,
  };

  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <div style={styles.brand} onClick={() => { navigate("/"); setOpen(false); }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#06b6d4" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 17l10 5 10-5" stroke="#7c3aed" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12l10 5 10-5" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={styles.title}>CollabCampus</span>
        </div>

        {/* Desktop nav */}
        <nav style={styles.nav}>
          <NavLink to="/create" style={({ isActive }) => (isActive ? activeStyle : styles.link)}>Create Team</NavLink>
          <NavLink to="/join" style={({ isActive }) => (isActive ? activeStyle : styles.link)}>Join Team</NavLink>
          <NavLink to="/created" style={({ isActive }) => (isActive ? activeStyle : styles.link)}>Created Teams</NavLink>
          <NavLink to="/requested" style={({ isActive }) => (isActive ? activeStyle : styles.link)}>Requested Teams</NavLink>
        </nav>
      </div>

      {/* Right side: user actions */}
      <div style={styles.right}>
        {!user ? (
          <div style={styles.authBtns}>
            <button style={styles.loginBtn} onClick={() => navigate("/login")}>Login</button>
            <button style={styles.signupBtn} onClick={() => navigate("/signup")}>Sign up</button>
          </div>
        ) : (
          <div style={styles.userBox}>
            <div style={styles.userInfo}>
              <div style={styles.avatar}>{(user.name || user.email || "U").charAt(0).toUpperCase()}</div>
              <div style={{ marginLeft: 8, textAlign: "left" }}>
                <div style={{ fontWeight: 700 }}>{user.name || user.email}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{user.email}</div>
              </div>
            </div>
            <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
          </div>
        )}

        {/* Mobile hamburger */}
        <button aria-label="Menu" onClick={() => setOpen(v => !v)} style={styles.hamburger}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <div style={styles.mobileMenu}>
          <NavLink to="/create" onClick={() => setOpen(false)} style={styles.mobileLink}>Create Team</NavLink>
          <NavLink to="/join" onClick={() => setOpen(false)} style={styles.mobileLink}>Join Team</NavLink>
          <NavLink to="/created" onClick={() => setOpen(false)} style={styles.mobileLink}>Created Teams</NavLink>
          <NavLink to="/requested" onClick={() => setOpen(false)} style={styles.mobileLink}>Requested Teams</NavLink>
          <div style={{ height: 8 }} />
          {!user ? (
            <>
              <button onClick={() => { setOpen(false); navigate("/login"); }} style={styles.mobileBtn}>Login</button>
              <button onClick={() => { setOpen(false); navigate("/signup"); }} style={{ ...styles.mobileBtn, marginTop: 8 }}>Sign up</button>
            </>
          ) : (
            <>
              <div style={{ padding: "12px 16px", borderTop: "1px solid #eee" }}>
                <div style={{ fontWeight: 700 }}>{user.name || user.email}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{user.email}</div>
              </div>
              <button onClick={() => { setOpen(false); handleLogout(); }} style={{ ...styles.mobileBtn, marginTop: 8, background: "#ef4444" }}>Logout</button>
            </>
          )}
        </div>
      )}
    </header>
  );
}

/* Inline styles */
const styles = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 18px",
    background: "linear-gradient(90deg,#0f172a,#0b1220)",
    color: "#fff",
    position: "relative",
    zIndex: 40,
  },
  left: { display: "flex", alignItems: "center", gap: 20 },
  brand: { display: "flex", alignItems: "center", cursor: "pointer", userSelect: "none" },
  title: { fontSize: 18, fontWeight: 800, color: "#fff" },

  nav: {
    display: "flex",
    gap: 14,
    alignItems: "center",
  },
  link: {
    color: "#e6eef0",
    textDecoration: "none",
    padding: "6px 6px",
    borderRadius: 6,
    fontWeight: 600,
  },

  right: { display: "flex", alignItems: "center", gap: 12 },

  authBtns: { display: "flex", gap: 8 },
  loginBtn: {
    background: "transparent",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.12)",
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
  },
  signupBtn: {
    background: "#06b6d4",
    color: "#05262a",
    border: "none",
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 700,
  },

  userBox: { display: "flex", alignItems: "center", gap: 12 },
  userInfo: { display: "flex", alignItems: "center" },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "#7c3aed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 800,
    fontSize: 14,
  },
  logoutBtn: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "8px 10px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 700,
  },

  hamburger: {
    width: 38,
    height: 38,
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 8,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    cursor: "pointer",
  },

  mobileMenu: {
    position: "absolute",
    top: "64px",
    right: 10,
    left: 10,
    background: "#fff",
    color: "#111",
    borderRadius: 8,
    padding: 12,
    boxShadow: "0 10px 30px rgba(2,6,23,0.15)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  mobileLink: {
    padding: "10px 12px",
    borderRadius: 6,
    color: "#0b1220",
    textDecoration: "none",
    fontWeight: 700,
  },
  mobileBtn: {
    padding: "10px 12px",
    background: "#06b6d4",
    color: "#05262a",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 700,
  },
};
