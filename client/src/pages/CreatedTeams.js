// src/pages/CreatedTeams.js
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

export default function CreatedTeams({ user }) {
  const [teams, setTeams] = useState([]);
  const [requestsMap, setRequestsMap] = useState({}); // teamId -> [requests]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // fetch teams created by logged in user's email
  const fetchTeamsAndRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!user || !user.email) {
      setError("You are not logged in.");
      setLoading(false);
      return;
    }

    try {
      const url = `${process.env.REACT_APP_API_URL}/api/teams/created/${encodeURIComponent(user.email)}`;
      const res = await axios.get(url);
      const fetchedTeams = Array.isArray(res.data) ? res.data : [];

      // sort newest first (if not already)
      fetchedTeams.sort((a, b) => {
        // try to use created time from Mongo _id
        const aT = parseInt(a._id?.slice(0, 8) || "0", 16) * 1000;
        const bT = parseInt(b._id?.slice(0, 8) || "0", 16) * 1000;
        return bT - aT;
      });

      setTeams(fetchedTeams);

      // fetch requests for each team in parallel
      const reqs = await Promise.all(
        fetchedTeams.map(async (team) => {
          try {
            const r = await axios.get(`${process.env.REACT_APP_API_URL}/api/requests/team/${team._id}`);
            const body = r.data;

            const requests = Array.isArray(body?.requests)
              ? body.requests
              : Array.isArray(body)
                ? body
                : [];

            return { teamId: team._id, requests };
          } catch (err) {
            console.error("Error fetching requests for team", team._id, err);
            return { teamId: team._id, requests: [] };
          }
        })
      );

      const map = {};
      reqs.forEach(r => { map[r.teamId] = r.requests; });
      setRequestsMap(map);
      setLoading(false);
    } catch (err) {
      console.error("Fetch created teams error:", err);
      setError(err.response?.data?.message || err.message || "Network or server error while fetching teams.");
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTeamsAndRequests();
  }, [fetchTeamsAndRequests]);

  const handleAccept = async (requestId) => {
    try {
      const url = `${process.env.REACT_APP_API_URL}/api/requests/${requestId}/accept`;
      await axios.post(url);
      // refresh
      await fetchTeamsAndRequests();
    } catch (err) {
      console.error("Accept request error:", err);
      alert(err.response?.data?.message || "Server error accepting request.");
    }
  };

  const handleDecline = async (requestId) => {
    try {
      const url = `${process.env.REACT_APP_API_URL}/api/requests/${requestId}/decline`;
      await axios.post(url);
      await fetchTeamsAndRequests();
    } catch (err) {
      console.error("Decline request error:", err);
      alert(err.response?.data?.message || "Server error declining request.");
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm("Delete this team? This removes all requests too.")) return;
    try {
      const url = `${process.env.REACT_APP_API_URL}/api/teams/${teamId}`;
      await axios.delete(url);
      await fetchTeamsAndRequests();
    } catch (err) {
      console.error("Delete team error:", err);
      alert(err.response?.data?.message || "Server error deleting team.");
    }
  };

  if (loading) return <p style={{ textAlign: "center" }}>Loading...</p>;
  if (error) return <div style={{ color: "crimson", padding: 16 }}>{error}</div>;

  return (
    <div style={{ maxWidth: 900, margin: "20px auto", padding: 12 }}>
      <h2>📂 Created Teams</h2>
      {teams.length === 0 && <p>No teams created yet.</p>}

      {teams.map(team => {
        const teamRequests = requestsMap[team._id] || [];
        const accepted = teamRequests.filter(r => r.status === "accepted");
        const pending = teamRequests.filter(r => r.status === "pending");

        return (
          <div key={team._id} style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0 }}>{team.problemStatement || "(No problem statement)"}</h3>
                <div style={{ color: "#555", fontSize: 14 }}>
                  <span><b>Hackathon:</b> {team.hackathonName || "-"}</span> ·{" "}
                  <span><b>Place:</b> {team.hackathonPlace || "-"}</span> ·{" "}
                  <span><b>Last Date:</b> {team.lastDate || "-"}</span>
                </div>
                <div style={{ marginTop: 6, color: "#333" }}>
                  <b>Leader:</b> {team.leaderName || team.leader} ({team.leader}) · Dept: {team.leaderDept || "-"} · Year: {team.leaderYear || "-"} · Gender: {team.leaderGender || "-"}
                </div>
                <div style={{ marginTop: 6 }}>
                  <b>Members:</b> {team.members?.length || 0}/{team.maxMembers || 0} · <b>Preferred Gender:</b> {team.preferredGender || "No Preference"}
                </div>
                <div style={{ marginTop: 6, color: "#444" }}>
                  <b>Skills:</b> {(team.skillsNeeded && team.skillsNeeded.join(", ")) || "Not specified"}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <button onClick={() => handleDeleteTeam(team._id)} style={{ background: "#ef4444", color: "#fff", border: "none", padding: "8px 10px", borderRadius: 6, cursor: "pointer" }}>
                  🗑 Delete
                </button>
              </div>
            </div>

            {/* Accepted members */}
            <div style={{ marginTop: 12 }}>
              <strong>Accepted Members:</strong>
              {accepted.length === 0 ? <div>No accepted members yet.</div> : (
                <ul>
                  {accepted.map(m => (
                    <li key={m._id}>
                      {m.userName} ({m.userEmail}) · Dept: {m.userDept || "-"} · Year: {m.userYear || "-"} · Gender: {m.userGender || "-"}
                      {m.userWhatsapp ? <><br />📱 {m.userWhatsapp}</> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Pending requests */}
            <div style={{ marginTop: 12 }}>
              <strong>Pending Requests:</strong>
              {pending.length === 0 ? <div>No pending requests.</div> : (
                pending.map(r => (
                  <div key={r._id} style={{ padding: 8, border: "1px solid #eee", borderRadius: 6, marginTop: 8 }}>
                    <div><b>{r.userName}</b> ({r.userEmail})</div>
                    <div style={{ fontSize: 13, color: "#444" }}>
                      Dept: {r.userDept || "-"} · Year: {r.userYear || "-"} · Gender: {r.userGender || "-"}
                    </div>
                    <div style={{ marginTop: 6 }}>Strengths: {r.userStrengths || "Not provided"}</div>
                    <div style={{ marginTop: 8 }}>
                      <button onClick={() => handleAccept(r._id)} style={{ marginRight: 8, background: "#16a34a", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 6 }}>✅ Accept</button>
                      <button onClick={() => handleDecline(r._id)} style={{ background: "#ef4444", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 6 }}>❌ Decline</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
