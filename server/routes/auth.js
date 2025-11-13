// server/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

// POST /auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      password: hashed
    });

    await user.save();

    // Return a safe user object (no password)
    const safeUser = { _id: user._id, email: user.email, name: user.name };
    return res.status(201).json({ message: 'User created', user: safeUser });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials' });

    const safeUser = { _id: user._id, email: user.email, name: user.name };
    return res.json({ message: 'Login successful', user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
