import mongoose from "mongoose";

const matchSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  grant: { type: mongoose.Schema.Types.ObjectId, ref: "Grant", required: true, index: true },
  score: { type: Number, required: true, min: 0, max: 100 },
  explanation: { type: String, required: true }
}, { timestamps: true });

export const Match = mongoose.model("Match", matchSchema);
