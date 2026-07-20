import { Request, Response, NextFunction } from "express";
import { Project } from "../models/Project";

export const getProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await Project.find({ user: (req as any).user._id }).sort({ updatedAt: -1 });
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, tags } = req.body;
    const project = await Project.create({
      user: (req as any).user._id,
      name,
      description,
      tags
    });
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404);
      throw new Error("Project not found");
    }
    if (project.user.toString() !== (req as any).user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to delete this project");
    }
    await project.deleteOne();
    res.json({ message: "Project removed" });
  } catch (error) {
    next(error);
  }
};
