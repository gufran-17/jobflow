import { Router } from "express";
import { getFollowups, createFollowup, updateFollowup, deleteFollowup } from "../controllers/followupController.js";

const router = Router();
router.get("/", getFollowups);
router.post("/", createFollowup);
router.put("/:id", updateFollowup);
router.delete("/:id", deleteFollowup);
export default router;
