import pool from "../config/db.js";

export async function getDashboardStats(req, res, next) {
  try {
    const [[totals]] = await pool.query(`
      SELECT
        COUNT(*) total,
        SUM(status='wishlist') wishlist,
        SUM(status='applied') applied,
        SUM(status='screening') screening,
        SUM(status='interview') interview,
        SUM(status='offer') offer,
        SUM(status='accepted') accepted,
        SUM(status='rejected') rejected
      FROM jobs
    `);

    const [bySource] = await pool.query(`
      SELECT source, COUNT(*) count
      FROM jobs GROUP BY source ORDER BY count DESC
    `);

    const [monthly] = await pool.query(`
      SELECT DATE_FORMAT(COALESCE(application_date, created_at), '%Y-%m') month, COUNT(*) count
      FROM jobs
      GROUP BY month ORDER BY month DESC LIMIT 6
    `);

    const [upcomingInterviews] = await pool.query(`
      SELECT i.*, j.company_name, j.job_title
      FROM interviews i JOIN jobs j ON j.id = i.job_id
      WHERE i.interview_date >= CURDATE()
      ORDER BY i.interview_date ASC, i.interview_time ASC LIMIT 8
    `);

    const [followups] = await pool.query(`
      SELECT f.*, j.company_name, j.job_title
      FROM followups f JOIN jobs j ON j.id = f.job_id
      WHERE f.completed = 0
      ORDER BY f.followup_date ASC LIMIT 8
    `);

    const [deadlines] = await pool.query(`
      SELECT id, company_name, job_title, deadline, status
      FROM jobs
      WHERE deadline IS NOT NULL AND deadline >= CURDATE()
        AND status NOT IN ('accepted','rejected')
      ORDER BY deadline ASC LIMIT 8
    `);

    res.json({
      success: true,
      data: {
        totals: {
          total: Number(totals.total || 0),
          wishlist: Number(totals.wishlist || 0),
          applied: Number(totals.applied || 0),
          screening: Number(totals.screening || 0),
          interview: Number(totals.interview || 0),
          offer: Number(totals.offer || 0),
          accepted: Number(totals.accepted || 0),
          rejected: Number(totals.rejected || 0)
        },
        bySource,
        monthly,
        upcomingInterviews,
        followups,
        deadlines
      }
    });
  } catch (err) { next(err); }
}
