import React, { useState } from 'react';
import CreateTeam from './CreateTeam';
import JoinTeam from './JoinTeam';
import CreatedTeams from './CreatedTeams';
import RequestedTeams from './RequestedTeams';

const Dashboard = ({ user, onLogout }) => {
  const [tab, setTab] = useState("join"); // default to join team

  const renderTab = () => {
    switch (tab) {
      case "create":
        return <CreateTeam user={user} />;
      case "join":
        return <JoinTeam user={user} />;
      case "created":
        return <CreatedTeams user={user} />;
      case "requested":
        return <RequestedTeams user={user} />;
      default:
        return <JoinTeam user={user} />;
    }
  };

  const tabButtonStyle = (active) => ({
    padding: '10px 15px',
    border: 'none',
    borderBottom: active ? '3px solid #007bff' : '2px solid transparent',
    backgroundColor: 'transparent',
    fontWeight: active ? 'bold' : 'normal',
    cursor: 'pointer',
  });

  return (
    <div style={{ maxWidth: '900px', margin: 'auto', padding: '30px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ margin: 0 }}>🎓 CollabCampus</h2>
        <button onClick={onLogout} style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px' }}>
          Logout
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '25px', borderBottom: '1px solid #ccc' }}>
        <button onClick={() => setTab("create")} style={tabButtonStyle(tab === "create")}>➕ Create Team</button>
        <button onClick={() => setTab("join")} style={tabButtonStyle(tab === "join")}>🤝 Join Team</button>
        <button onClick={() => setTab("created")} style={tabButtonStyle(tab === "created")}>📂 Created Teams</button>
        <button onClick={() => setTab("requested")} style={tabButtonStyle(tab === "requested")}>📌 Requested Teams</button>
      </div>

      {/* Main Tab Content */}
      <div style={{ border: '1px solid #ccc', padding: '25px', borderRadius: '8px', minHeight: '300px' }}>
        {renderTab()}
      </div>
    </div>
  );
};

export default Dashboard;
