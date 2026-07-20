import express from "express";
import { getProjects, createProject, deleteProject } from "../controllers/projectController";
import { protect } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { z } from "zod";

const router = express.Router();

const projectSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().min(10),
    tags: z.array(z.string()).optional()
  })
});

router.route("/")
  .get(protect, getProjects)
  .post(protect, validate(projectSchema), createProject);

router.route("/:id")
  .delete(protect, deleteProject);

export default router;
