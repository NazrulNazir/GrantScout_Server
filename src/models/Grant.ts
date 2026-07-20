import mongoose from "mongoose";

const specSchema = new mongoose.Schema({
  label: { type: String, required: true },
  value: { type: String, required: true }
}, { _id: false });

const reviewSchema = new mongoose.Schema({
  author: { type: String, required: true },
  org: { type: String, required: true },
  text: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 }
}, { _id: false });

const grantSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  organization: { type: String, required: true, index: true },
  amount: { type: Number, required: true, index: true },
  deadline: { type: Date, required: true, index: true },
  tags: [{ type: String, index: true }],
  description: { type: String, required: true },
  specifications: [specSchema],
  reviews: [reviewSchema]
}, { timestamps: true });

export const Grant = mongoose.model("Grant", grantSchema);
