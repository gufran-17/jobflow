import pool from "../config/db.js";

export async function getInterviews(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT i.*, j.company_name, j.job_title
       FROM interviews i JOIN jobs j ON j.id = i.job_id
       ORDER BY i.interview_date ASC, i.interview_time ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

export async function createInterview(req, res, next) {
  try {
    const { job_id, interview_date, interview_time = null, interview_type = "Video",
      interviewer = "", meeting_link = "", notes = "", preparation_status = "Not Started" } = req.body;

    if (!job_id || !interview_date) {
      return res.status(400).json({ success: false, message: "Job and interview date are required" });
    }

    const [result] = await pool.query(
      `INSERT INTO interviews
       (job_id, interview_date, interview_time, interview_type, interviewer, meeting_link, notes, preparation_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [job_id, interview_date, interview_time || null, interview_type, interviewer, meeting_link, notes, preparation_status]
    );

    const [rows] = await pool.query("SELECT * FROM interviews WHERE id = ?", [result.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
}

export async function deleteInterview(req, res, next) {
  try {
    const [result] = await pool.query("DELETE FROM interviews WHERE id = ?", [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Interview not found" });
    res.json({ success: true, message: "Interview deleted" });
  } catch (err) { next(err); }
}
