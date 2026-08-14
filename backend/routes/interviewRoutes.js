import { Router } from "express";
import { getInterviews, createInterview, deleteInterview } from "../controllers/interviewController.js";

const router = Router();
router.get("/", getInterviews);
router.post("/", createInterview);
router.delete("/:id", deleteInterview);
export default router;
