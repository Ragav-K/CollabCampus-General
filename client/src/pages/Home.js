import React from "react";
import { useNavigate } from "react-router-dom";

const Home = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "60px" }}>
      <h2>👋 Welcome, {user?.email}</h2>
      <p>Explore your dashboard and collaborate with peers!</p>

      <div style={{ marginTop: "30px" }}>
        <button onClick={() => navigate("/create")}>🛠️ Create Team</button>
        <button onClick={() => navigate("/join")} style={{ marginLeft: "10px" }}>
          🚀 Join Team
        </button>
        <button onClick={() => navigate("/created")} style={{ marginLeft: "10px" }}>
          👥 Created Teams
        </button>
        <button onClick={() => navigate("/requested")} style={{ marginLeft: "10px" }}>
          📥 Requested Teams
        </button>
      </div>
    </div>
  );
};

export default Home;
