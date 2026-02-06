import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

export default function RequestedTeams({ user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const email = user?.email?.trim()?.toLowerCase() || "";

  const fetchRequestedTeams = useCallback(async () => {
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/requests/user/${encodeURIComponent(email)}`);

      const sorted = Array.isArray(res.data)
        ? res.data.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        )
        : [];
      setRequests(sorted);
    } catch (err) {
      console.error("Error fetching requested teams", err);
      setError(err.response?.data?.message || err.message || "Network error fetching requests.");
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    fetchRequestedTeams();
  }, [fetchRequestedTeams]);

  const handleWithdraw = useCallback(
    async (teamId) => {
      try {
        await axios.delete(
          `${process.env.REACT_APP_API_URL}/api/requests/${encodeURIComponent(teamId)}/${encodeURIComponent(email)}`
        );
        setRequests((prev) => prev.filter((req) => String(req.teamId) !== String(teamId)));
      } catch (err) {
        console.error("Error withdrawing request", err);
        alert("Could not withdraw. Try again.");
      }
    },
    [email]
  );

  const content = useMemo(() => {
    if (loading) return <p>Loading your requests…</p>;
    if (error) return <div style={{ color: "crimson" }}>{error}</div>;
    if (!requests.length) return <p>You haven’t requested to join any teams yet.</p>;

    return requests.map((request) => {
      const { team = {} } = request;
      return (
        <div
          key={request._id}
          style={{
            border: "1px solid #ccc",
            padding: 16,
            marginBottom: 12,
            borderRadius: 6,
            background: "#fafafa",
          }}
        >
          <p>
            <strong>Hackathon:</strong> {team.hackathonName || "Unknown"}
          </p>
          <p>
            <strong>Problem:</strong>{" "}
            {team.problemStatement || request.userProblemStatement || "Not provided"}
          </p>
          <p>
            <strong>Status:</strong> {request.status}
          </p>
          <p>
            <strong>Leader:</strong>{" "}
            {team.leaderName ? `${team.leaderName} (${team.leader})` : team.leader || "—"}
          </p>
          {request.status === "pending" ? (
            <button
              onClick={() => handleWithdraw(request.teamId)}
              style={{
                color: "white",
                background: "#dc2626",
                padding: "6px 12px",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Withdraw Request 🗑️
            </button>
          ) : (
            <div style={{ marginTop: 8, fontSize: 12, color: "#555" }}>
              You can no longer withdraw this request.
            </div>
          )}
        </div>
      );
    });
  }, [error, handleWithdraw, loading, requests]);

  return (
    <div>
      <h3>📌 Requested Teams</h3>
      {content}
    </div>
  );
}
