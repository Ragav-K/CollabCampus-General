import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function Login({ setUser }) {            // <-- accept setUser prop
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!form.email || !form.password) { setErr("Email & password required"); return; }

    setLoading(true);
    try {
      const url = `${process.env.REACT_APP_API_URL}/api/auth/login`;
      const res = await axios.post(url, {
        email: form.email.trim(),
        password: form.password
      });

      const user = res.data.user || { email: form.email.trim() };
      // persist for refresh
      localStorage.setItem("user", JSON.stringify(user));

      // IMPORTANT: update top-level React state so routes and nav show logged-in immediately
      if (typeof setUser === "function") setUser(user);

      // Navigate to home
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      setErr(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Login</h2>
        {err && <div style={styles.err}>{err}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input name="email" type="email" placeholder="College email" value={form.email} onChange={handleChange} style={styles.input} required />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} style={styles.input} required />
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div style={{ marginTop: 12 }}>
          <Link to="/signup">Sign up</Link> · <Link to="/reset">Forgot password?</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", justifyContent: "center", paddingTop: 60 },
  card: { width: 420, padding: 20, borderRadius: 8, boxShadow: "0 6px 18px rgba(0,0,0,0.08)" },
  form: { display: "flex", flexDirection: "column", gap: 10 },
  input: { padding: 10, borderRadius: 6, border: "1px solid #ddd" },
  btn: { padding: 10, background: "#2563eb", color: "white", border: "none", borderRadius: 6, cursor: "pointer" },
  err: { padding: 10, background: "#ffe6e6", color: "#a00", borderRadius: 6, marginBottom: 8 }
};
