import express from "express";
import { getAIChatResponse, getGrantMatches, generateProposal } from "../controllers/aiController";
import { protect } from "../middlewares/auth";

const router = express.Router();

router.post("/chat", protect, getAIChatResponse);
router.post("/matches", protect, getGrantMatches);
router.post("/proposal", protect, generateProposal);

export default router;
