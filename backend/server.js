import express from "express";
import cors from "cors";
import "dotenv/config";
import pool from "./config/db.js";
import jobRoutes from "./routes/jobRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import followupRoutes from "./routes/followupRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors({
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",") : true
}));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", async (req, res, next) => {
  try {
    await pool.query("SELECT 1");
    res.json({ success: true, message: "JobFlow API is healthy", database: "connected" });
  } catch (err) {
    next(err);
  }
});

app.use("/api/jobs", jobRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/followups", followupRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`JobFlow API running on http://localhost:${PORT}`);
});
