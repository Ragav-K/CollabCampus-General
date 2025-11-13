// server/index.js
// ESM style (package.json "type":"module")
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import crypto from "crypto";
import { sendPasswordResetEmail, sendSignupOTPEmail } from "./utils/emailService.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "";

app.use(cors()); // allow CORS from react dev server
app.use(express.json());

console.log("🚨 MONGO_URI:", MONGO_URI);
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ---------------- Models ----------------
const { Schema, model } = mongoose;

const userSchema = new Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dept: { type: String },
  year: { type: String },
  gender: { type: String },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
  otp: { type: String },
  otpExpiry: { type: Date },
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
  preferredGender: { type: String, enum: ["Male", "Female", "No Preference"], default: "No Preference" },
  problemStatement: String,
  skillsNeeded: [String],
  maxMembers: Number,
  members: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});
const Team = model("Team", teamSchema);

const joinRequestSchema = new Schema({
  teamId: String, // stored as stringified ObjectId
  userEmail: String,
  userName: String,
  userDept: String,
  userYear: String,
  userGender: String,
  userWhatsapp: String,
  userStrengths: String,
  userProblemStatement: String,
  status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});
const JoinRequest = model("JoinRequest", joinRequestSchema);

// ---------------- Utility ----------------
async function removeExpiredTeams() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const result = await Team.deleteMany({ lastDate: { $lt: today } });
    if (result.deletedCount > 0) console.log(`🧹 Removed ${result.deletedCount} expired teams`);
  } catch (err) {
    console.error("Error removing expired teams:", err);
  }
}

// ---------------- Auth Router ----------------
const authRouter = express.Router();

// signup - send OTP email (user not created yet)
authRouter.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });
    if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

    // Check if user already exists and is verified
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing && existing.isVerified) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 600000; // 10 minutes from now

    // Hash password for temporary storage
    const hashed = await bcrypt.hash(password, 10);

    // If user exists but not verified, update OTP; otherwise create new user
    if (existing) {
      existing.password = hashed;
      existing.name = name || existing.name || email.split("@")[0];
      existing.otp = otp;
      existing.otpExpiry = otpExpiry;
      existing.isVerified = false;
      await existing.save();
    } else {
      const user = new User({
        name: name || email.split("@")[0],
        email: email.toLowerCase(),
        password: hashed,
        otp: otp,
        otpExpiry: otpExpiry,
        isVerified: false,
      });
      await user.save();
    }

    // Send OTP email
    try {
      await sendSignupOTPEmail(email.toLowerCase(), otp, name || email.split("@")[0]);
      return res.json({
        message: "OTP sent to your email. Please verify to complete signup.",
        email: email.toLowerCase(),
      });
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      // Fallback: return OTP if email fails (for development)
      return res.json({
        message: "Email service unavailable. Use this OTP to verify:",
        email: email.toLowerCase(),
        otp: otp,
        note: "Configure email service in .env to send emails automatically.",
      });
    }
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// verify OTP and complete signup
authRouter.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });

    const user = await User.findOne({
      email: email.toLowerCase(),
      otp: otp,
      otpExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const safeUser = { _id: user._id, email: user.email, name: user.name };
    return res.json({ message: "Email verified successfully. Account created!", user: safeUser });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// resend OTP
authRouter.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "Email already verified" });

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 600000; // 10 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP email
    try {
      await sendSignupOTPEmail(user.email, otp, user.name || user.email.split("@")[0]);
      return res.json({ message: "OTP resent to your email." });
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      return res.json({
        message: "Email service unavailable. Use this OTP:",
        otp: otp,
        note: "Configure email service in .env to send emails automatically.",
      });
    }
  } catch (err) {
    console.error("Resend OTP error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// login
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: "User not found" });

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(400).json({ message: "Please verify your email first. Check your inbox for OTP." });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Invalid credentials" });

    const safeUser = { _id: user._id, email: user.email, name: user.name };
    return res.json({ message: "Login successful", user: safeUser });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// forgot password - generate reset token
authRouter.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if user exists for security
      return res.json({ message: "If that email exists, a password reset email has been sent." });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Construct reset URL
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetUrl = `${frontendUrl}/reset?token=${resetToken}`;

    // Send email with reset link
    try {
      await sendPasswordResetEmail(user.email, resetToken, resetUrl);
      return res.json({
        message: "Password reset email sent! Please check your inbox.",
      });
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      // Fallback: return token if email fails (for development)
      return res.json({
        message: "Email service unavailable. Use this token to reset your password:",
        resetToken: resetToken,
        resetUrl: resetUrl,
        note: "Configure email service in .env to send emails automatically."
      });
    }
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// reset password - use token to set new password
authRouter.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return res.json({ message: "Password reset successful. You can now login with your new password." });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// mount auth routes on both /auth and /api/auth so frontend variations work
app.use("/auth", authRouter);
app.use("/api/auth", authRouter);

// ---------------- API routes (/api) ----------------
app.get("/api/health", (req, res) => res.json({ ok: true }));

// create team
app.post("/api/teams", async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.leader || !payload.maxMembers) return res.status(400).json({ message: "leader and maxMembers are required" });
    const team = new Team(payload);
    await team.save();
    res.status(201).json({ message: "Team created!", team });
  } catch (err) {
    console.error("Error creating team:", err);
    res.status(500).json({ message: "Error creating team" });
  }
});

// get public teams (optional ?email to exclude own teams, optional ?excludeRequested=email to hide already-requested teams)
app.get("/api/teams", async (req, res) => {
  try {
    await removeExpiredTeams();
    const today = new Date().toISOString().split("T")[0];
    const filter = { lastDate: { $gte: today }, $expr: { $lt: [{ $size: "$members" }, "$maxMembers"] } };

    // exclude my own teams
    if (req.query.email) filter.leader = { $ne: req.query.email };

    // base query
    let teams = await Team.find(filter).sort({ createdAt: -1 }).lean();

    // --- NEW: exclude teams the user has already requested ---
    if (req.query.excludeRequested) {
      const existingReqs = await JoinRequest.find(
        { userEmail: req.query.excludeRequested },
        { teamId: 1, _id: 0 }
      ).lean();
      const excludeIds = new Set(existingReqs.map(r => String(r.teamId)));
      teams = teams.filter(t => !excludeIds.has(String(t._id)));
    }
    // ---------------------------------------------------------

    res.json(teams);
  } catch (err) {
    console.error("Fetch error (GET /api/teams):", err);
    res.status(500).json({ message: "Error fetching teams" });
  }
});

// get user-created teams
app.get("/api/teams/created/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const teams = await Team.find({ leader: email }).sort({ createdAt: -1 });
    res.json(teams);
  } catch (err) {
    console.error("Error fetching created teams:", err);
    res.status(500).json({ message: "Error fetching created teams" });
  }
});

// send join request (IDEMPOTENT)
app.post("/api/teams/:id/request", async (req, res) => {
  const { id: teamId } = req.params;
  const {
    userEmail,
    userName,
    userDept,
    userYear,
    userGender,
    userWhatsapp,
    userStrengths,
    userProblemStatement,
  } = req.body;

  try {
    if (!userEmail) return res.status(400).json({ message: "userEmail required" });

    // Idempotency: if already requested, return 200 with existing request
    const exists = await JoinRequest.findOne({ teamId, userEmail });
    if (exists) {
      return res.status(200).json({ message: "Join request already exists.", request: exists });
    }

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    const today = new Date().toISOString().split("T")[0];
    if (team.lastDate < today) return res.status(400).json({ message: "Team expired" });
    if ((team.members?.length || 0) >= (team.maxMembers || 0)) return res.status(400).json({ message: "Team is full" });

    const request = new JoinRequest({
      teamId,
      userEmail,
      userName,
      userDept,
      userYear,
      userGender,
      userWhatsapp,
      userStrengths,
      userProblemStatement,
    });
    await request.save();
    return res.status(201).json({ message: "Join request sent.", request });
  } catch (err) {
    // If race condition creates a duplicate, treat as idempotent success
    if (err && err.code === 11000) {
      const request = await JoinRequest.findOne({ teamId, userEmail });
      return res.status(200).json({ message: "Join request already exists.", request });
    }
    console.error("Error sending join request:", err);
    return res.status(500).json({ message: "Error sending join request" });
  }
});

// NEW: get my join requests (enriched with basic team info)
app.get("/api/requests/user/:email", async (req, res) => {
  try {
    const userEmail = req.params.email;
    const requests = await JoinRequest.find({ userEmail }).sort({ createdAt: -1 }).lean();

    const teamIds = requests.map(r => r.teamId);
    const teams = await Team.find({ _id: { $in: teamIds } })
      .select("leader leaderName hackathonName hackathonPlace lastDate problemStatement")
      .lean();

    const teamsById = Object.fromEntries(teams.map(t => [String(t._id), t]));
    const enriched = requests.map(r => ({
      ...r,
      team: teamsById[String(r.teamId)] || null,
    }));

    res.json(enriched);
  } catch (err) {
    console.error("Error fetching user requests:", err);
    res.status(500).json({ message: "Error fetching user requests" });
  }
});

// accept / decline / list requests
app.post("/api/requests/:id/accept", async (req, res) => {
  try {
    const request = await JoinRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    const team = await Team.findById(request.teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });
    if (!team.members.includes(request.userEmail)) {
      if ((team.members.length || 0) >= (team.maxMembers || 0)) return res.status(400).json({ message: "Team already full" });
      team.members.push(request.userEmail);
      await team.save();
    }
    request.status = "accepted";
    await request.save();
    res.json({ message: "Request accepted", request });
  } catch (err) {
    console.error("Error accepting request:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/requests/:id/decline", async (req, res) => {
  try {
    const request = await JoinRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    request.status = "declined";
    await request.save();
    res.json({ message: "Request declined", request });
  } catch (err) {
    console.error("Error declining request:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// get requests for a team (returns { team, requests })
app.get("/api/requests/team/:teamId", async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });
    const requests = await JoinRequest.find({ teamId }).sort({ createdAt: -1 });
    res.json({ team, requests });
  } catch (err) {
    console.error("Error fetching team join requests:", err);
    res.status(500).json({ message: "Error fetching team join requests" });
  }
});

// withdraw
app.delete("/api/requests/:teamId/:email", async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const email = req.params.email;
    const r = await JoinRequest.deleteOne({ teamId, userEmail: email });
    res.json({ message: "Request withdrawn", deletedCount: r.deletedCount });
  } catch (err) {
    console.error("Error withdrawing request:", err);
    res.status(500).json({ message: "Error withdrawing request" });
  }
});

// delete team
app.delete("/api/teams/:id", async (req, res) => {
  try {
    const teamId = req.params.id;
    await JoinRequest.deleteMany({ teamId });
    await Team.findByIdAndDelete(teamId);
    res.json({ message: "Team deleted successfully" });
  } catch (err) {
    console.error("Error deleting team:", err);
    res.status(500).json({ message: "Error deleting team" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
