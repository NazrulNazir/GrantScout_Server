import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  tags: [{ type: String, index: true }],
  status: { type: String, enum: ["active", "archived"], default: "active" }
}, { timestamps: true });

export const Project = mongoose.model("Project", projectSchema);
