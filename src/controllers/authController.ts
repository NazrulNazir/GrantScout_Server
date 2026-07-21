import { Request, Response, NextFunction, CookieOptions } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,                       // HTTPS only in production (Vercel is always HTTPS)
  sameSite: isProduction ? "none" : "lax",    // "none" for cross-site in prod, "lax" for localhost dev
  maxAge: 30 * 24 * 60 * 60 * 1000,          // 30 days
};

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: "30d" });
};

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error("User already exists");
    }

    const user = await User.create({ name, email, password });
    
    if (user) {
      const token = generateToken(user._id.toString());
      res.cookie("jwt", token, cookieOptions);
      res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role });
    } else {
      res.status(400);
      throw new Error("Invalid user data");
    }
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user: any = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id.toString());
      res.cookie("jwt", token, cookieOptions);
      res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
    } else {
      res.status(401);
      throw new Error("Invalid email or password");
    }
  } catch (error) {
    next(error);
  }
};

export const logoutUser = (req: Request, res: Response) => {
  res.cookie("jwt", "", { ...cookieOptions, maxAge: 0 });
  res.json({ message: "Logged out successfully" });
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (user) {
      res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById((req as any).user._id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
    user.name = req.body.name || user.name;
    if (req.body.password) {
      user.password = req.body.password;
    }
    const updatedUser = await user.save();
    res.json({ _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role });
  } catch (error) {
    next(error);
  }
};

export const googleLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      res.status(400);
      throw new Error("Google login details are incomplete");
    }

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      const generatedPassword = Math.random().toString(36).slice(-10);
      user = await User.create({ name, email, password: generatedPassword });
    }

    const token = generateToken(user._id.toString());
    res.cookie("jwt", token, cookieOptions);
    res.status(200).json({ _id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    next(error);
  }
};

