// server/index.js
// ESM style (package.json "type":"module")

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import crypto from "crypto";

import {
  sendPasswordResetEmail,
  sendSignupOTPEmail,
  testEmailConnection,
} from "./utils/emailService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// ---------------- Middleware ----------------

// Safe CORS (allow only your frontend)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);

app.use(express.json());

// ---------------- MongoDB ----------------

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in environment variables");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ---------------- Models ----------------

const { Schema, model } = mongoose;

const userSchema = new Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  dept: String,
  year: String,
  gender: String,

  resetToken: String,
  resetTokenExpiry: Date,

  otp: String,
  otpExpiry: Date,

  isVerified: { type: Boolean, default: false },

  // ── Matching Engine Profile ──
  skillStrengths: { type: Map, of: Number, default: {} }, // { Python: 4, React: 3 }
  preferredRoles: { type: [String], default: [] },        // Frontend, Backend, AI, PPT…
  hackathonInterests: { type: [String], default: [] },

  createdAt: { type: Date, default: Date.now },
});

const User = model("User", userSchema);

const teamSchema = new Schema({
  leader: String,
  leaderName: String,
  leaderDept: String,
  leaderYear: String,
  leaderGender: String,

  hackathonName: String,
  hackathonPlace: String,
  hackathonDate: String,
  lastDate: String,

  preferredGender: {
    type: String,
    enum: ["Male", "Female", "No Preference"],
    default: "No Preference",
  },

  problemStatement: String,
  skillsNeeded: [String],

  maxMembers: Number,

  members: { type: [String], default: [] },

  // ── Matching Engine Requirements ──
  requiredSkills: { type: Map, of: Number, default: {} }, // { Python: 3, React: 2 }
  requiredRoles: { type: [String], default: [] },

  // ── Custom Matching Weights (legacy exact-% system) ──
  matchingWeights: {
    skill: { type: Number, default: 35 },
    role: { type: Number, default: 20 },
    exp: { type: Number, default: 15 },
    diversity: { type: Number, default: 20 },
    gender: { type: Number, default: 10 },
  },

  // ── Auto-normalized Matching Preferences (3-factor system) ──
  // score = skill + role + diversity (normalized); gender is a hard filter, not a weight
  matchingPreferences: {
    skill: { enabled: { type: Boolean, default: true }, weight: { type: Number, default: 8 } },
    role: { enabled: { type: Boolean, default: true }, weight: { type: Number, default: 6 } },
    diversity: { enabled: { type: Boolean, default: true }, weight: { type: Number, default: 4 } },
  },

  createdAt: { type: Date, default: Date.now },
});

const Team = model("Team", teamSchema);

const joinRequestSchema = new Schema({
  teamId: String,

  userEmail: String,
  userName: String,
  userDept: String,
  userYear: String,
  userGender: String,

  userWhatsapp: String,
  userStrengths: String,
  userProblemStatement: String,

  status: {
    type: String,
    enum: ["pending", "accepted", "declined"],
    default: "pending",
  },

  createdAt: { type: Date, default: Date.now },
});

const JoinRequest = model("JoinRequest", joinRequestSchema);

// ---------------- Utils ----------------

async function removeExpiredTeams() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const result = await Team.deleteMany({
      lastDate: { $lt: today },
    });

    if (result.deletedCount > 0) {
      console.log(`🧹 Removed ${result.deletedCount} expired teams`);
    }
  } catch (err) {
    console.error("Remove expired teams error:", err);
  }
}

// ---------------- Auth Router ----------------

const authRouter = express.Router();

// Signup
authRouter.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const lowerEmail = email.toLowerCase();

    let user = await User.findOne({ email: lowerEmail });

    if (user && user.isVerified) {
      return res.status(400).json({ message: "User already exists" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000;

    const hashed = await bcrypt.hash(password, 10);

    if (user) {
      user.password = hashed;
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      user.isVerified = false;
      user.name = name || user.name;
      await user.save();
    } else {
      user = new User({
        name: name || lowerEmail.split("@")[0],
        email: lowerEmail,
        password: hashed,
        otp,
        otpExpiry,
      });

      await user.save();
    }

    try {
      await sendSignupOTPEmail(lowerEmail, otp, user.name);
      res.json({
        message: "OTP sent to your email",
        email: lowerEmail,
      });
    } catch (emailErr) {
      console.warn("⚠️ Email service failed, returning OTP for fallback:", emailErr.message);
      res.json({
        message: "Email service failed. Use this OTP.",
        email: lowerEmail,
        otp: otp, // Fallback: return OTP to client so user isn't stuck
      });
    }
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Verify OTP
authRouter.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
      otp,
      otpExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    res.json({
      message: "Account verified",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Resend OTP
authRouter.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    const lowerEmail = email.toLowerCase();
    const user = await User.findOne({ email: lowerEmail });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000;

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    try {
      await sendSignupOTPEmail(lowerEmail, otp, user.name);
      res.json({ message: "OTP resent to your email" });
    } catch (emailErr) {
      console.warn("⚠️ Email service failed on resend:", emailErr.message);
      res.json({
        message: "Email service failed. Use this OTP.",
        otp: otp,
      });
    }
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (!user.isVerified) {
      return res
        .status(400)
        .json({ message: "Verify email first" });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user profile (called after OTP or from Profile page)
authRouter.patch("/profile", async (req, res) => {
  try {
    const { email, dept, year, gender, skillStrengths, preferredRoles, hackathonInterests } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { dept, year, gender, skillStrengths, preferredRoles, hackathonInterests },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    // Return ALL profile fields so the client can update localStorage correctly
    res.json({
      message: "Profile updated",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        dept: user.dept,
        year: user.year,
        gender: user.gender,
        preferredRoles: user.preferredRoles || [],
        hackathonInterests: user.hackathonInterests || [],
        // Convert Mongoose Map to plain object for JSON serialization
        skillStrengths: user.skillStrengths
          ? Object.fromEntries(user.skillStrengths)
          : {},
      },
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Mount Auth
app.use("/auth", authRouter);
app.use("/api/auth", authRouter);

// ---------------- API ----------------

// Health
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// Test Email Connection (Debug)
app.get("/api/test-email", async (req, res) => {
  const result = await testEmailConnection();
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// Create Team
app.post("/api/teams", async (req, res) => {
  try {
    if (!req.body.leader || !req.body.maxMembers) {
      return res
        .status(400)
        .json({ message: "leader and maxMembers required" });
    }

    const team = new Team(req.body);

    await team.save();

    res.status(201).json({
      message: "Team created",
      team,
    });
  } catch (err) {
    console.error("Create team error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Teams
app.get("/api/teams", async (req, res) => {
  try {
    await removeExpiredTeams();

    const today = new Date().toISOString().split("T")[0];

    const filter = {
      lastDate: { $gte: today },
      // members.length < maxMembers - 1  (1 slot is reserved for the leader)
      $expr: { $lt: [{ $size: "$members" }, { $subtract: ["$maxMembers", 1] }] },
    };

    if (req.query.email) {
      filter.leader = { $ne: req.query.email };
    }

    let teams = await Team.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    if (req.query.excludeRequested) {
      const reqs = await JoinRequest.find(
        { userEmail: req.query.excludeRequested },
        { teamId: 1 }
      );

      const ids = new Set(reqs.map((r) => r.teamId));

      teams = teams.filter((t) => !ids.has(String(t._id)));
    }

    res.json(teams);
  } catch (err) {
    console.error("Get teams error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Teams created by a specific leader
app.get("/api/teams/created/:email", async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).toLowerCase();
    const teams = await Team.find({ leader: email }).sort({ createdAt: -1 }).lean();
    res.json(teams);
  } catch (err) {
    console.error("Get created teams error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a team (and its requests)
app.delete("/api/teams/:teamId", async (req, res) => {
  try {
    await Team.findByIdAndDelete(req.params.teamId);
    await JoinRequest.deleteMany({ teamId: req.params.teamId });
    res.json({ message: "Team deleted" });
  } catch (err) {
    console.error("Delete team error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get leader + member profiles for a team (used by detail modal)
app.get("/api/teams/:teamId/members", async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId).lean();
    if (!team) return res.status(404).json({ message: "Team not found" });

    const leaderUser = await User.findOne({ email: team.leader }).lean();
    const memberUsers = team.members?.length
      ? await User.find({ email: { $in: team.members } }, {
        name: 1, email: 1, dept: 1, year: 1, gender: 1,
        preferredRoles: 1, skillStrengths: 1
      }).lean()
      : [];

    res.json({
      leader: leaderUser ? {
        name: leaderUser.name, email: leaderUser.email,
        dept: leaderUser.dept, year: leaderUser.year,
        gender: leaderUser.gender, preferredRoles: leaderUser.preferredRoles,
        skillStrengths: leaderUser.skillStrengths,
      } : null,
      members: memberUsers,
    });
  } catch (err) {
    console.error("Get members error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Edit a team (leader only)
app.patch("/api/teams/:teamId", async (req, res) => {
  try {
    const { leaderEmail, ...updates } = req.body;
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });
    if (team.leader !== leaderEmail)
      return res.status(403).json({ message: "Only the leader can edit this team" });

    const allowed = [
      'hackathonName', 'hackathonPlace', 'hackathonDate', 'lastDate',
      'problemStatement', 'maxMembers', 'preferredGender',
      'skillsNeeded', 'requiredRoles', 'requiredSkills', 'matchingWeights', 'matchingPreferences',
    ];
    allowed.forEach(k => { if (updates[k] !== undefined) team[k] = updates[k]; });
    await team.save();
    res.json({ message: "Team updated", team });
  } catch (err) {
    console.error("Edit team error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Submit a join request
app.post("/api/requests", async (req, res) => {
  try {
    const request = new JoinRequest(req.body);
    await request.save();
    res.status(201).json({ message: "Request submitted", request });
  } catch (err) {
    console.error("Submit request error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all requests for a specific team
app.get("/api/requests/team/:teamId", async (req, res) => {
  try {
    const requests = await JoinRequest.find({ teamId: req.params.teamId }).lean();
    res.json(requests);
  } catch (err) {
    console.error("Get team requests error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all requests by a specific user
app.get("/api/requests/user/:email", async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).toLowerCase();
    const requests = await JoinRequest.find({ userEmail: email }).sort({ createdAt: -1 }).lean();

    // Attach team info to each request
    const enriched = await Promise.all(
      requests.map(async (req) => {
        const team = await Team.findById(req.teamId).lean();
        return { ...req, team: team || {} };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error("Get user requests error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Accept a join request
app.post("/api/requests/:requestId/accept", async (req, res) => {
  try {
    const request = await JoinRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    request.status = "accepted";
    await request.save();

    // Add user to team members
    await Team.findByIdAndUpdate(request.teamId, {
      $addToSet: { members: request.userEmail },
    });

    res.json({ message: "Request accepted" });
  } catch (err) {
    console.error("Accept request error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Decline a join request
app.post("/api/requests/:requestId/decline", async (req, res) => {
  try {
    const request = await JoinRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    request.status = "declined";
    await request.save();

    res.json({ message: "Request declined" });
  } catch (err) {
    console.error("Decline request error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Withdraw a join request (user cancels their own pending request)
app.delete("/api/requests/:teamId/:email", async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).toLowerCase();
    await JoinRequest.findOneAndDelete({
      teamId: req.params.teamId,
      userEmail: email,
      status: "pending",
    });
    res.json({ message: "Request withdrawn" });
  } catch (err) {
    console.error("Withdraw request error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- Compatibility Engine ----------------

// Default weights used as fallback (fractions, 3-factor system)
const DEFAULT_WEIGHTS = { skill: 0.45, role: 0.35, diversity: 0.20 };
const YEAR_NUM = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4 };

function toObj(map) {
  if (!map) return {};
  if (map instanceof Map) return Object.fromEntries(map);
  if (typeof map === 'object') return map;
  return {};
}

/**
 * Resolve per-team weights as normalised fractions over 3 factors.
 * Priority: matchingPreferences (auto-normalized) > hard defaults
 */
function resolveWeights(team) {
  const mp = team.matchingPreferences;
  const keys = ['skill', 'role', 'diversity'];
  if (mp && typeof mp === 'object') {
    const total = keys.reduce((s, k) => s + (mp[k]?.enabled ? (mp[k]?.weight || 0) : 0), 0);
    if (total > 0) {
      const w = {};
      keys.forEach(k => { w[k] = (mp[k]?.enabled) ? (mp[k].weight / total) : 0; });
      return w;
    }
  }
  return { ...DEFAULT_WEIGHTS };
}

function computeCompatibility(team, user, members) {
  // Gender is a hard FILTER — not a weighted factor
  if (team.preferredGender === 'Male' && user.gender !== 'Male')
    return { score: 0, label: 'No Match', breakdown: { skillComp: 0, diversity: 0, roleFit: 0 }, filtered: true };
  if (team.preferredGender === 'Female' && user.gender !== 'Female')
    return { score: 0, label: 'No Match', breakdown: { skillComp: 0, diversity: 0, roleFit: 0 }, filtered: true };

  const w = resolveWeights(team);

  // ─ 1. Skill Coverage Complementarity ─
  const reqSkills = toObj(team.requiredSkills);
  const userSkills = toObj(user.skillStrengths);
  const reqKeys = Object.keys(reqSkills);
  let skillMatch = 0, missingBonus = 0, redundancyPen = 0;
  if (reqKeys.length > 0) {
    for (const skill of reqKeys) {
      const required = reqSkills[skill] || 1;
      const userLevel = userSkills[skill] || 0;
      skillMatch += Math.min(userLevel / required, 1.0);
      const membersWithSkill = members.filter(m => (toObj(m.skillStrengths)[skill] || 0) >= required).length;
      if (membersWithSkill === 0 && userLevel >= required) missingBonus++;
      if (membersWithSkill >= 2) redundancyPen++;
    }
    skillMatch /= reqKeys.length;
    missingBonus /= reqKeys.length;
    redundancyPen = Math.min(redundancyPen / reqKeys.length, 0.3);
  } else {
    skillMatch = 0.7;
  }
  const skillComp = Math.max(0, Math.min(1, skillMatch + missingBonus - redundancyPen));

  // ─ 2. Role Fit ─
  const reqRoles = team.requiredRoles || [];
  const userRoles = user.preferredRoles || [];
  const roleFit = reqRoles.length === 0 ? 1.0
    : userRoles.length === 0 ? 0.5
      : reqRoles.filter(r => userRoles.includes(r)).length / reqRoles.length;

  // ─ 3. Simpson Diversity Index ─
  const depts = [...members.map(m => m.dept), user.dept].filter(Boolean);
  let diversity = 0.5;
  if (depts.length > 0) {
    const counts = {};
    depts.forEach(d => { counts[d] = (counts[d] || 0) + 1; });
    const n = depts.length;
    diversity = 1 - Object.values(counts).reduce((s, c) => s + (c / n) ** 2, 0);
  }

  const raw = w.skill * skillComp + w.role * roleFit + w.diversity * diversity;
  const score = Math.round(raw * 100);

  return {
    score,
    label: score >= 75 ? 'Highly Compatible' : score >= 50 ? 'Moderate Match' : 'Weak Match',
    breakdown: {
      skillComp: Math.round(skillComp * 100),
      roleFit: Math.round(roleFit * 100),
      diversity: Math.round(diversity * 100),
    },
    weights: {
      skill: Math.round(w.skill * 100),
      role: Math.round(w.role * 100),
      diversity: Math.round(w.diversity * 100),
    },
  };
}

// Single team compatibility
app.get("/api/compatibility/:teamId/:userEmail", async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId).lean();
    if (!team) return res.status(404).json({ message: "Team not found" });

    const email = decodeURIComponent(req.params.userEmail).toLowerCase();
    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const memberEmails = [...(team.members || []), team.leader].filter(Boolean);
    const members = await User.find({ email: { $in: memberEmails } }).lean();

    res.json(computeCompatibility(team, user, members));
  } catch (err) {
    console.error("Compatibility error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Batch compatibility (used by JoinTeam page to score all teams in one request)
app.post("/api/compatibility/batch", async (req, res) => {
  try {
    const { teamIds, userEmail } = req.body;
    if (!teamIds?.length || !userEmail) return res.status(400).json({ message: "teamIds and userEmail required" });

    const email = userEmail.toLowerCase();
    const user = await User.findOne({ email }).lean();
    if (!user) return res.json({});

    const teams = await Team.find({ _id: { $in: teamIds } }).lean();
    const result = {};

    for (const team of teams) {
      const memberEmails = [...(team.members || []), team.leader].filter(Boolean);
      const members = await User.find({ email: { $in: memberEmails } }).lean();
      result[String(team._id)] = computeCompatibility(team, user, members);
    }

    res.json(result);
  } catch (err) {
    console.error("Batch compatibility error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Auto-suggestions: top 5 compatible users for a team
app.get("/api/teams/:teamId/suggestions", async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId).lean();
    if (!team) return res.status(404).json({ message: "Team not found" });

    const existingReqs = await JoinRequest.find({ teamId: req.params.teamId }, { userEmail: 1 }).lean();
    const excluded = new Set([
      team.leader,
      ...(team.members || []),
      ...existingReqs.map(r => r.userEmail),
    ]);

    const memberEmails = [...(team.members || []), team.leader].filter(Boolean);
    const members = await User.find({ email: { $in: memberEmails } }).lean();

    const candidates = await User.find({
      isVerified: true,
      email: { $nin: [...excluded] },
    }).lean();

    const scored = candidates
      .map(u => ({
        user: {
          name: u.name, email: u.email, dept: u.dept, year: u.year,
          gender: u.gender,
          preferredRoles: u.preferredRoles,
          skillStrengths: u.skillStrengths ? Object.fromEntries(u.skillStrengths) : {},
        },
        ...computeCompatibility(team, u, members),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    res.json(scored);
  } catch (err) {
    console.error("Suggestions error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- Start Server ----------------

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

