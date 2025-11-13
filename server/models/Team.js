import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
  leader: { type: String, required: true },
  leaderName: String,
  leaderDept: String,
  leaderYear: String,
  leaderGender: String,
  hackathonName: String,
  hackathonPlace: String,
  hackathonDate: String,
  lastDate: String,
  preferredGender: String,
  problemStatement: String,
  skillsNeeded: [String],
  maxMembers: Number,
  members: { type: [String], default: [] },
});

export default mongoose.model("Team", teamSchema);
