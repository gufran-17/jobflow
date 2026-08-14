import { Router } from "express";
import { getJobs, getJobById, createJob, updateJob, updateJobStatus, deleteJob } from "../controllers/jobController.js";

const router = Router();
router.get("/", getJobs);
router.get("/:id", getJobById);
router.post("/", createJob);
router.put("/:id/status", updateJobStatus);
router.put("/:id", updateJob);
router.delete("/:id", deleteJob);

export default router;
