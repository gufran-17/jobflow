import { Router } from "express";
import { getActivities, createActivity, deleteActivity } from "../controllers/activityController.js";

const router = Router();
router.get("/", getActivities);
router.post("/", createActivity);
router.delete("/:id", deleteActivity);
export default router;
