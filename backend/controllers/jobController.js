import pool from "../config/db.js";

const allowedStatuses = [
  "wishlist", "applied", "screening", "interview",
  "offer", "accepted", "rejected"
];

const allowedPriorities = ["low", "medium", "high"];

function healthScore(job) {
  let score = 0;
  if (job.description) score += 20;
  if (job.resume_version) score += 20;
  if (job.application_date) score += 20;
  if (job.interview_count > 0) score += 15;
  if (job.followup_count > 0) score += 15;
  if (job.notes) score += 10;
  return score;
}

function mapJob(row) {
  return {
    ...row,
    health_score: healthScore(row),
    interview_count: Number(row.interview_count || 0),
    followup_count: Number(row.followup_count || 0)
  };
}

export async function getJobs(req, res, next) {
  try {
    const {
      search = "",
      status,
      location,
      work_type,
      priority,
      employment_type,
      sort = "created_at",
      order = "desc"
    } = req.query;

    const safeSorts = {
      application_date: "j.application_date",
      deadline: "j.deadline",
      company: "j.company_name",
      priority: "FIELD(j.priority, 'high','medium','low')",
      created_at: "j.created_at"
    };

    const sortSql = safeSorts[sort] || safeSorts.created_at;
    const orderSql = order.toLowerCase() === "asc" ? "ASC" : "DESC";

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push("(j.company_name LIKE ? OR j.job_title LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status) { conditions.push("j.status = ?"); params.push(status); }
    if (location) { conditions.push("j.location LIKE ?"); params.push(`%${location}%`); }
    if (work_type) { conditions.push("j.work_type = ?"); params.push(work_type); }
    if (priority) { conditions.push("j.priority = ?"); params.push(priority); }
    if (employment_type) { conditions.push("j.employment_type = ?"); params.push(employment_type); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `SELECT j.*,
        (SELECT COUNT(*) FROM interviews i WHERE i.job_id = j.id) AS interview_count,
        (SELECT COUNT(*) FROM followups f WHERE f.job_id = j.id AND f.completed = 0) AS followup_count
       FROM jobs j ${where}
       ORDER BY ${sortSql} ${orderSql}`,
      params
    );

    res.json({ success: true, data: rows.map(mapJob) });
  } catch (err) {
    next(err);
  }
}

export async function getJobById(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT j.*,
        (SELECT COUNT(*) FROM interviews i WHERE i.job_id = j.id) AS interview_count,
        (SELECT COUNT(*) FROM followups f WHERE f.job_id = j.id AND f.completed = 0) AS followup_count
       FROM jobs j WHERE j.id = ?`,
      [req.params.id]
    );

    if (!rows.length) return res.status(404).json({ success: false, message: "Job not found" });

    const [activities] = await pool.query(
      "SELECT * FROM activities WHERE job_id = ? ORDER BY activity_date DESC, id DESC",
      [req.params.id]
    );
    const [interviews] = await pool.query(
      "SELECT * FROM interviews WHERE job_id = ? ORDER BY interview_date ASC, interview_time ASC",
      [req.params.id]
    );
    const [followups] = await pool.query(
      "SELECT * FROM followups WHERE job_id = ? ORDER BY followup_date ASC",
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        ...mapJob(rows[0]),
        activities,
        interviews,
        followups
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function createJob(req, res, next) {
  try {
    const {
      company_name, job_title, location = "", work_type = "Remote",
      employment_type = "Full-time", salary = "", job_url = "",
      status = "wishlist", priority = "medium", source = "Other",
      application_date = null, deadline = null, resume_version = "",
      description = "", notes = ""
    } = req.body;

    if (!company_name?.trim() || !job_title?.trim()) {
      return res.status(400).json({ success: false, message: "Company name and job title are required" });
    }
    if (!allowedStatuses.includes(status) || !allowedPriorities.includes(priority)) {
      return res.status(400).json({ success: false, message: "Invalid status or priority" });
    }

    const [result] = await pool.query(
      `INSERT INTO jobs
      (company_name, job_title, location, work_type, employment_type, salary, job_url,
       status, priority, source, application_date, deadline, resume_version, description, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [company_name.trim(), job_title.trim(), location, work_type, employment_type, salary,
       job_url, status, priority, source, application_date || null, deadline || null,
       resume_version, description, notes]
    );

    const [rows] = await pool.query("SELECT * FROM jobs WHERE id = ?", [result.insertId]);
    res.status(201).json({ success: true, data: mapJob(rows[0]) });
  } catch (err) {
    next(err);
  }
}

export async function updateJob(req, res, next) {
  try {
    const fields = [
      "company_name", "job_title", "location", "work_type", "employment_type",
      "salary", "job_url", "status", "priority", "source", "application_date",
      "deadline", "resume_version", "description", "notes"
    ];
    const updates = [];
    const params = [];

    for (const field of fields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates.push(`${field} = ?`);
        params.push(req.body[field] === "" ? null : req.body[field]);
      }
    }

    if (!updates.length) {
      return res.status(400).json({ success: false, message: "No fields supplied" });
    }

    if (req.body.status && !allowedStatuses.includes(req.body.status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    if (req.body.priority && !allowedPriorities.includes(req.body.priority)) {
      return res.status(400).json({ success: false, message: "Invalid priority" });
    }

    params.push(req.params.id);
    const [result] = await pool.query(
      `UPDATE jobs SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );

    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Job not found" });

    const [rows] = await pool.query("SELECT * FROM jobs WHERE id = ?", [req.params.id]);
    res.json({ success: true, data: mapJob(rows[0]) });
  } catch (err) {
    next(err);
  }
}

export async function updateJobStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const [result] = await pool.query(
      "UPDATE jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [status, req.params.id]
    );

    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Job not found" });

    await pool.query(
      "INSERT INTO activities (job_id, activity_type, title, description, activity_date) VALUES (?, 'status_change', ?, ?, CURRENT_DATE)",
      [req.params.id, `Moved to ${status}`, `Application status changed to ${status}.`]
    );

    res.json({ success: true, message: "Status updated" });
  } catch (err) {
    next(err);
  }
}

export async function deleteJob(req, res, next) {
  try {
    const [result] = await pool.query("DELETE FROM jobs WHERE id = ?", [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, message: "Job deleted" });
  } catch (err) {
    next(err);
  }
}
