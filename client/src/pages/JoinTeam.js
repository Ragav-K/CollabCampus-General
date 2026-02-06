// src/pages/JoinTeam.js
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

// API URL from env
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function JoinTeam({ user }) {
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [showForm, setShowForm] = useState({});
  const [formData, setFormData] = useState({
    userName: "",
    userDept: "",
    userYear: "",
    userGender: "",
    userStrengths: "",
    userWhatsapp: "",
  });

  // Filters
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedGenderPref, setSelectedGenderPref] = useState("");
  const [selectedHackathon, setSelectedHackathon] = useState("");

  const fetchTeams = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/teams`, {
        params: {
          email: user.email,
          excludeRequested: user.email,
        },
      });

      let all = Array.isArray(res.data)
        ? res.data.filter((team) => team.leader !== user.email)
        : [];

      // Sort teams by newest first using _id timestamp
      all.sort(
        (a, b) =>
          new Date(parseInt(b._id.toString().substring(0, 8), 16) * 1000) -
          new Date(parseInt(a._id.toString().substring(0, 8), 16) * 1000)
      );

      // Set the teams (Can add alreadyRequested logic if backend supports it)
      setTeams(all);
      setFilteredTeams(all);
    } catch (err) {
      console.error("Error fetching teams:", err);
      alert("Error loading teams.");
    }
  }, [user.email]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const toggleForm = (teamId) => {
    setShowForm((prev) => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRequest = async (e, teamId) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/teams/${teamId}/request`, {
        ...formData,
        userEmail: user.email,
      });
      alert("✅ Request Sent!");
      setFormData({
        userName: "",
        userDept: "",
        userYear: "",
        userGender: "",
        userStrengths: "",
        userWhatsapp: "",
      });
      setShowForm((prev) => ({ ...prev, [teamId]: false }));
      fetchTeams();
    } catch (err) {
      console.error("Error sending request:", err);
      alert("❌ Error sending request.");
    }
  };

  // Filter logic
  useEffect(() => {
    let filtered = [...teams];
    if (selectedSkill)
      filtered = filtered.filter((team) =>
        team.skillsNeeded?.includes(selectedSkill)
      );
    if (selectedGenderPref)
      filtered = filtered.filter(
        (team) =>
          team.preferredGender === selectedGenderPref ||
          team.preferredGender === "No Preference"
      );
    if (selectedHackathon)
      filtered = filtered.filter(
        (team) => team.hackathonName === selectedHackathon
      );
    setFilteredTeams(filtered);
  }, [selectedSkill, selectedGenderPref, selectedHackathon, teams]);

  const uniqueSkills = [...new Set(teams.flatMap((t) => t.skillsNeeded || []))];
  const uniqueHackathons = [...new Set(teams.map((t) => t.hackathonName))];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <h2>🚀 Join a Team</h2>

      {/* Filters */}
      <div
        style={{
          marginBottom: 20,
          border: "1px solid #ccc",
          padding: 10,
          borderRadius: 8,
        }}
      >
        <h4>🔍 Filter Teams</h4>
        <select
          onChange={(e) => setSelectedSkill(e.target.value)}
          value={selectedSkill}
        >
          <option value="">All Skills</option>
          {uniqueSkills.map((skill) => (
            <option key={skill} value={skill}>
              {skill}
            </option>
          ))}
        </select>{" "}
        <select
          onChange={(e) => setSelectedGenderPref(e.target.value)}
          value={selectedGenderPref}
        >
          <option value="">All Genders</option>
          <option value="Male">Male Preference</option>
          <option value="Female">Female Preference</option>
          <option value="No Preference">No Preference</option>
        </select>{" "}
        <select
          onChange={(e) => setSelectedHackathon(e.target.value)}
          value={selectedHackathon}
        >
          <option value="">All Hackathons</option>
          {uniqueHackathons.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      </div>

      {/* Team Cards */}
      {filteredTeams.length === 0 ? (
        <p>No teams match your filters.</p>
      ) : (
        filteredTeams.map((team) => (
          <div
            key={team._id}
            style={{
              border: "1px solid #ccc",
              padding: 16,
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            <h3>{team.problemStatement}</h3>
            <p>
              <strong>Hackathon:</strong> {team.hackathonName} |{" "}
              <strong>Place:</strong> {team.hackathonPlace}
            </p>
            <p>
              <strong>Date:</strong> {team.hackathonDate} |{" "}
              <strong>Last Date to Join:</strong> {team.lastDate}
            </p>
            <p>
              <strong>Preferred Gender:</strong> {team.preferredGender}
            </p>
            <p>
              <strong>Required Skills:</strong>{" "}
              {team.skillsNeeded?.join(", ") || "Not specified"}
            </p>
            <p>
              <strong>Leader:</strong> {team.leaderName} ({team.leader}) | Dept:{" "}
              {team.leaderDept} | Year: {team.leaderYear}
            </p>
            <p>
              <strong>Members:</strong> {team.members.length}/{team.maxMembers}
            </p>

            {/* Mark if already requested if you implement frontend logic */}
            {/* {team.alreadyRequested ? (
              <p style={{ marginTop: "10px", color: "green" }}>
                ✅ Request Already Sent
              </p>
            ) : ( */}
            <>
              <button
                onClick={() => toggleForm(team._id)}
                style={{
                  background: "#2563eb",
                  color: "white",
                  padding: "6px 10px",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                {showForm[team._id]
                  ? "🔼 Hide Join Form"
                  : "🔽 Show Join Form"}
              </button>

              {showForm[team._id] && (
                <form
                  onSubmit={(e) => handleRequest(e, team._id)}
                  style={{
                    marginTop: "10px",
                    borderTop: "1px solid #ddd",
                    paddingTop: "10px",
                  }}
                >
                  <input
                    type="text"
                    name="userName"
                    placeholder="Your Name"
                    value={formData.userName}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="text"
                    name="userDept"
                    placeholder="Department"
                    value={formData.userDept}
                    onChange={handleChange}
                    required
                  />
                  <select
                    name="userYear"
                    value={formData.userYear}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Year</option>
                    <option value="I">I</option>
                    <option value="II">II</option>
                    <option value="III">III</option>
                    <option value="IV">IV</option>
                  </select>
                  <select
                    name="userGender"
                    value={formData.userGender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <input
                    type="text"
                    name="userWhatsapp"
                    placeholder="WhatsApp Number"
                    value={formData.userWhatsapp}
                    onChange={handleChange}
                    required
                  />
                  <textarea
                    name="userStrengths"
                    placeholder="Your Strengths or Skills"
                    value={formData.userStrengths}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="submit"
                    style={{
                      marginTop: "10px",
                      background: "#10b981",
                      color: "#fff",
                      padding: "8px 12px",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    Request to Join
                  </button>
                </form>
              )}
            </>
            {/* )} */}
          </div>
        ))
      )}
    </div>
  );
}
