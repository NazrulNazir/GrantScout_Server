import express from "express";
import { getGrants, getGrantById, createGrant, deleteGrant } from "../controllers/grantController";
import { protect } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { z } from "zod";

const router = express.Router();

const grantSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    organization: z.string().min(2),
    amount: z.number().min(1),
    deadline: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    tags: z.array(z.string()).optional(),
    description: z.string().min(10),
    specifications: z.array(
      z.object({
        label: z.string(),
        value: z.string()
      })
    ).optional(),
    reviews: z.array(
      z.object({
        author: z.string(),
        org: z.string(),
        text: z.string(),
        rating: z.number().min(1).max(5)
      })
    ).optional()
  })
});

router.route("/")
  .get(getGrants)
  .post(protect, validate(grantSchema), createGrant);

router.route("/:id")
  .get(getGrantById)
  .delete(protect, deleteGrant);

export default router;
