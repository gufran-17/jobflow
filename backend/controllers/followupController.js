import pool from "../config/db.js";

export async function getFollowups(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT f.*, j.company_name, j.job_title
       FROM followups f JOIN jobs j ON j.id = f.job_id
       ORDER BY f.followup_date ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

export async function createFollowup(req, res, next) {
  try {
    const { job_id, followup_date, note = "" } = req.body;
    if (!job_id || !followup_date) {
      return res.status(400).json({ success: false, message: "Job and follow-up date are required" });
    }

    const [result] = await pool.query(
      "INSERT INTO followups (job_id, followup_date, note, completed) VALUES (?, ?, ?, 0)",
      [job_id, followup_date, note]
    );
    const [rows] = await pool.query("SELECT * FROM followups WHERE id = ?", [result.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
}

export async function updateFollowup(req, res, next) {
  try {
    const { completed, followup_date, note } = req.body;
    const [result] = await pool.query(
      "UPDATE followups SET completed = COALESCE(?, completed), followup_date = COALESCE(?, followup_date), note = COALESCE(?, note) WHERE id = ?",
      [completed ?? null, followup_date ?? null, note ?? null, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Follow-up not found" });
    const [rows] = await pool.query("SELECT * FROM followups WHERE id = ?", [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
}

export async function deleteFollowup(req, res, next) {
  try {
    const [result] = await pool.query("DELETE FROM followups WHERE id = ?", [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Follow-up not found" });
    res.json({ success: true, message: "Follow-up deleted" });
  } catch (err) { next(err); }
}
