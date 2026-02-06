import React, { useState } from 'react';
import axios from 'axios';

function CreateTeam({ user }) {
  const [leaderName, setLeaderName] = useState('');
  const [leaderDept, setLeaderDept] = useState('');
  const [leaderYear, setLeaderYear] = useState('');
  const [leaderGender, setLeaderGender] = useState('');

  const [hackathonName, setHackathonName] = useState('');
  const [hackathonPlace, setHackathonPlace] = useState('');
  const [hackathonDate, setHackathonDate] = useState('');
  const [lastDate, setLastDate] = useState('');
  const [preferredGender, setPreferredGender] = useState('No Preference');

  const [problemStatement, setProblemStatement] = useState('');
  const [skillsNeeded, setSkillsNeeded] = useState('');
  const [maxMembers, setMaxMembers] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newTeam = {
      leader: user.email,
      leaderName,
      leaderDept,
      leaderYear,
      leaderGender,
      hackathonName,
      hackathonPlace,
      hackathonDate,
      lastDate,
      preferredGender,
      problemStatement,
      skillsNeeded: skillsNeeded
        .split(',')
        .map(skill => skill.trim())
        .filter(Boolean),
      maxMembers: parseInt(maxMembers)
    };

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/teams`, newTeam);

      alert('✅ Team created successfully!');
      // Reset form
      setLeaderName('');
      setLeaderDept('');
      setLeaderYear('');
      setLeaderGender('');
      setHackathonName('');
      setHackathonPlace('');
      setHackathonDate('');
      setLastDate('');
      setPreferredGender('No Preference');
      setProblemStatement('');
      setSkillsNeeded('');
      setMaxMembers('');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || '❌ Failed to create team.');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2>Create a Team</h2>
      <form onSubmit={handleSubmit}>
        <h4>👤 Your Info</h4>
        <input type="text" placeholder="Your Name" value={leaderName} onChange={e => setLeaderName(e.target.value)} required />
        <input type="text" placeholder="Your Department" value={leaderDept} onChange={e => setLeaderDept(e.target.value)} required />
        <select value={leaderYear} onChange={e => setLeaderYear(e.target.value)} required>
          <option value="">Select Year</option>
          <option value="I">I</option>
          <option value="II">II</option>
          <option value="III">III</option>
          <option value="IV">IV</option>
        </select>
        <select value={leaderGender} onChange={e => setLeaderGender(e.target.value)} required>
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>

        <h4>🏆 Hackathon Info</h4>
        <input type="text" placeholder="Hackathon Name" value={hackathonName} onChange={e => setHackathonName(e.target.value)} required />
        <input type="text" placeholder="Hackathon Place" value={hackathonPlace} onChange={e => setHackathonPlace(e.target.value)} required />
        <label>Hackathon Date:</label>
        <input type="date" value={hackathonDate} onChange={e => setHackathonDate(e.target.value)} required />
        <label>Last Date to Join:</label>
        <input type="date" value={lastDate} onChange={e => setLastDate(e.target.value)} required />

        <label>Preferred Gender:</label>
        <select value={preferredGender} onChange={e => setPreferredGender(e.target.value)}>
          <option value="No Preference">No Preference</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>

        <h4>📋 Team Details</h4>
        <textarea placeholder="Problem Statement" value={problemStatement} onChange={e => setProblemStatement(e.target.value)} required rows={3} />
        <input type="text" placeholder="Skills Needed (comma separated)" value={skillsNeeded} onChange={e => setSkillsNeeded(e.target.value)} required />
        <input type="number" placeholder="Max Members" value={maxMembers} onChange={e => setMaxMembers(e.target.value)} required min={1} />

        <button type="submit" style={{ marginTop: '20px' }}>Create Team</button>
      </form>
    </div>
  );
}

export default CreateTeam;
