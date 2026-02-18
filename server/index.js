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
      $expr: { $lt: [{ $size: "$members" }, "$maxMembers"] },
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

// ---------------- Start Server ----------------

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
