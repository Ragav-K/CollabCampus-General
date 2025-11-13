import express from 'express';
import Team from '../models/Team.js';

const router = express.Router();

// Create new team
router.post('/', async (req, res) => {
  try {
    const team = new Team(req.body);
    await team.save();
    res.status(201).json(team);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create team' });
  }
});

// Get all teams
router.get('/', async (req, res) => {
  try {
    const teams = await Team.find();
    res.json(teams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load teams' });
  }
});

// Get teams created by a specific user
router.get('/created/:email', async (req, res) => {
  try {
    const teams = await Team.find({ leader: req.params.email });
    res.json(teams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load teams' });
  }
});

// Delete a team
router.delete('/:id', async (req, res) => {
  try {
    await Team.findByIdAndDelete(req.params.id);
    res.json({ message: 'Team deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete team' });
  }
});

// Request to join a team (NEW ENDPOINT required for frontend)
router.post('/:id/request', async (req, res) => {
  try {
    const teamId = req.params.id;
    const requestDetails = req.body;
    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    // Ensure requests array exists
    if (!team.requests) team.requests = [];
    team.requests.push(requestDetails); // Push request data
    await team.save();
    res.status(200).json({ message: 'Request sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send join request.' });
  }
});

export default router;
