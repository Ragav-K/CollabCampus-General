// src/App.js
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import CreateTeam from "./pages/CreateTeam";
import JoinTeam from "./pages/JoinTeam";
import CreatedTeams from "./pages/CreatedTeams";
import RequestedTeams from "./pages/RequestedTeams";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load persisted user from localStorage on app start
  useEffect(() => {
    try {
      const saved = localStorage.getItem("user");
      if (saved) setUser(JSON.parse(saved));
    } catch (e) {
      console.warn("Failed to parse saved user:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Central logout helper
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  if (loading) return <div style={{ textAlign: "center", marginTop: 60 }}>Loading...</div>;

  return (
    <Router>
      <NavBar user={user} onLogout={handleLogout} />

      <div style={{ paddingTop: 16 }}>
        <Routes>
          {/* Public / Home */}
          <Route path="/" element={<Home user={user} />} />

          {/* Auth routes: pass setUser so Login/Signup update global state */}
          <Route
            path="/login"
            element={user ? <Navigate to="/" replace /> : <Login setUser={setUser} />}
          />
          <Route
            path="/signup"
            element={user ? <Navigate to="/" replace /> : <Signup setUser={setUser} />}
          />
          <Route path="/reset" element={<ResetPassword />} />

          {/* Protected routes */}
          <Route
            path="/create"
            element={user ? <CreateTeam user={user} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/join"
            element={user ? <JoinTeam user={user} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/created"
            element={user ? <CreatedTeams user={user} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/requested"
            element={user ? <RequestedTeams user={user} /> : <Navigate to="/login" replace />}
          />

          {/* fallback */}
          <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
        </Routes>
      </div>
    </Router>
  );
}
