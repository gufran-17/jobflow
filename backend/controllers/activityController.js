import pool from "../config/db.js";

export async function getActivities(req, res, next) {
  try {
    const query = req.query.job_id
      ? "SELECT * FROM activities WHERE job_id = ? ORDER BY activity_date DESC, id DESC"
      : "SELECT a.*, j.company_name, j.job_title FROM activities a JOIN jobs j ON j.id = a.job_id ORDER BY a.activity_date DESC, a.id DESC";
    const [rows] = await pool.query(query, req.query.job_id ? [req.query.job_id] : []);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

export async function createActivity(req, res, next) {
  try {
    const { job_id, activity_type = "note", title, description = "", activity_date } = req.body;
    if (!job_id || !title?.trim()) {
      return res.status(400).json({ success: false, message: "Job and activity title are required" });
    }

    const [result] = await pool.query(
      `INSERT INTO activities (job_id, activity_type, title, description, activity_date)
       VALUES (?, ?, ?, ?, ?)`,
      [job_id, activity_type, title.trim(), description, activity_date || new Date().toISOString().slice(0, 10)]
    );

    const [rows] = await pool.query("SELECT * FROM activities WHERE id = ?", [result.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
}

export async function deleteActivity(req, res, next) {
  try {
    const [result] = await pool.query("DELETE FROM activities WHERE id = ?", [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Activity not found" });
    res.json({ success: true, message: "Activity deleted" });
  } catch (err) { next(err); }
}
