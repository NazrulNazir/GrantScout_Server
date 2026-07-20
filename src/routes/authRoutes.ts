import express from "express";
import { registerUser, loginUser, logoutUser, getMe, updateProfile, googleLogin } from "../controllers/authController";
import { protect } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { z } from "zod";

const router = express.Router();

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  })
});

router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);
router.post("/logout", logoutUser);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.post("/google", googleLogin);

export default router;
