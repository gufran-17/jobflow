import React, { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const STATUS = [
  ["wishlist", "Wishlist"],
  ["applied", "Applied"],
  ["screening", "Screening"],
  ["interview", "Interview"],
  ["offer", "Offer"],
  ["accepted", "Accepted"],
  ["rejected", "Rejected"]
];

const initialForm = {
  company_name: "", job_title: "", location: "", work_type: "Remote",
  employment_type: "Full-time", salary: "", job_url: "", status: "wishlist",
  priority: "medium", source: "LinkedIn", application_date: "",
  deadline: "", resume_version: "", description: "", notes: ""
};

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "Request failed");
  return body;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function initials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join("").toUpperCase() || "?";
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function App() {
  const [page, setPage] = useState("dashboard");
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [filters, setFilters] = useState({ search: "", status: "", location: "", work_type: "", priority: "", employment_type: "", sort: "created_at", order: "desc" });
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [followups, setFollowups] = useState([]);

  const notify = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2800);
  };

  const loadJobs = async () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    const result = await api(`/jobs?${params.toString()}`);
    setJobs(result.data);
  };

  const loadStats = async () => {
    const result = await api("/dashboard/stats");
    setStats(result.data);
    setInterviews(result.data.upcomingInterviews || []);
    setFollowups(result.data.followups || []);
  };

  const refresh = async () => {
    try {
      setLoading(true);
      await Promise.all([loadJobs(), loadStats()]);
    } catch (e) {
      notify(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    const timer = setTimeout(() => loadJobs().catch(e => notify(e.message)), 250);
    return () => clearTimeout(timer);
  }, [filters.search, filters.status, filters.location, filters.work_type, filters.priority, filters.employment_type, filters.sort, filters.order]);

  const filteredJobs = jobs;

  const openAdd = () => {
    setEditId(null);
    setForm({ ...initialForm, application_date: today() });
    setModal("job");
  };

  const openEdit = (job) => {
    setEditId(job.id);
    setForm(Object.fromEntries(Object.keys(initialForm).map(k => [k, job[k] ?? ""])));
    setModal("job");
  };

  const saveJob = async (e) => {
    e.preventDefault();
    try {
      if (!form.company_name.trim() || !form.job_title.trim()) return notify("Company and job title are required.");
      if (editId) await api(`/jobs/${editId}`, { method: "PUT", body: JSON.stringify(form) });
      else await api("/jobs", { method: "POST", body: JSON.stringify(form) });
      setModal(null);
      notify(editId ? "Job updated successfully." : "Job added successfully.");
      await refresh();
    } catch (e) { notify(e.message); }
  };

  const deleteJob = async (id) => {
    if (!confirm("Delete this job and its related activities, interviews and follow-ups?")) return;
    try {
      await api(`/jobs/${id}`, { method: "DELETE" });
      setSelectedJob(null);
      notify("Job deleted.");
      await refresh();
    } catch (e) { notify(e.message); }
  };

  const changeStatus = async (id, status) => {
    try {
      await api(`/jobs/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
      await refresh();
    } catch (e) { notify(e.message); }
  };

  const openDetails = async (id) => {
    try {
      const result = await api(`/jobs/${id}`);
      setSelectedJob(result.data);
    } catch (e) { notify(e.message); }
  };

  const addActivity = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api("/activities", {
        method: "POST",
        body: JSON.stringify({
          job_id: selectedJob.id,
          activity_type: fd.get("activity_type"),
          title: fd.get("title"),
          description: fd.get("description"),
          activity_date: fd.get("activity_date") || today()
        })
      });
      const result = await api(`/jobs/${selectedJob.id}`);
      setSelectedJob(result.data);
      e.currentTarget.reset();
      notify("Activity added.");
      await refresh();
    } catch (e) { notify(e.message); }
  };

  const addInterview = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api("/interviews", {
        method: "POST",
        body: JSON.stringify({
          job_id: selectedJob.id,
          interview_date: fd.get("interview_date"),
          interview_time: fd.get("interview_time"),
          interview_type: fd.get("interview_type"),
          interviewer: fd.get("interviewer"),
          meeting_link: fd.get("meeting_link"),
          notes: fd.get("notes"),
          preparation_status: fd.get("preparation_status")
        })
      });
      const result = await api(`/jobs/${selectedJob.id}`);
      setSelectedJob(result.data);
      e.currentTarget.reset();
      notify("Interview added.");
      await refresh();
    } catch (e) { notify(e.message); }
  };

  const addFollowup = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api("/followups", {
        method: "POST",
        body: JSON.stringify({ job_id: selectedJob.id, followup_date: fd.get("followup_date"), note: fd.get("note") })
      });
      const result = await api(`/jobs/${selectedJob.id}`);
      setSelectedJob(result.data);
      e.currentTarget.reset();
      notify("Follow-up added.");
      await refresh();
    } catch (e) { notify(e.message); }
  };

  const toggleFollowup = async (item) => {
    try {
      await api(`/followups/${item.id}`, { method: "PUT", body: JSON.stringify({ completed: !item.completed }) });
      await refresh();
      if (selectedJob) {
        const result = await api(`/jobs/${selectedJob.id}`);
        setSelectedJob(result.data);
      }
    } catch (e) { notify(e.message); }
  };

  const clearFilters = () => setFilters({ search: "", status: "", location: "", work_type: "", priority: "", employment_type: "", sort: "created_at", order: "desc" });

  const total = stats?.totals?.total || 0;
  const activeApplications = (stats?.totals?.applied || 0) + (stats?.totals?.screening || 0) + (stats?.totals?.interview || 0) + (stats?.totals?.offer || 0);
  const responseRate = total ? Math.round(((activeApplications + (stats?.totals?.accepted || 0)) / total) * 100) : 0;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">JF</div>
          <div><strong>JobFlow</strong><span>Smart Job Tracker</span></div>
        </div>
        <nav>
          {[
            ["dashboard", "⌂", "Dashboard"],
            ["board", "▦", "Job Board"],
            ["applications", "▤", "Applications"],
            ["interviews", "◷", "Interviews"],
            ["followups", "✓", "Follow-ups"],
            ["analytics", "◒", "Analytics"],
            ["settings", "⚙", "Settings"]
          ].map(([key, icon, label]) => (
            <button key={key} className={page === key ? "nav-item active" : "nav-item"} onClick={() => setPage(key)}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="profile-avatar">GU</div>
          <div><b>Job Seeker</b><small>Career workspace</small></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="eyebrow">CAREER WORKSPACE</div>
            <h1>{page === "board" ? "Job Board" : page === "applications" ? "Applications" : page === "interviews" ? "Interview Tracker" : page === "followups" ? "Follow-ups" : page === "analytics" ? "Analytics" : page === "settings" ? "Settings" : "Good evening 👋"}</h1>
          </div>
          <div className="top-actions">
            <button className="icon-btn" onClick={() => refresh()} title="Refresh">↻</button>
            <button className="primary-btn" onClick={openAdd}>+ Add Job</button>
          </div>
        </header>

        {page === "dashboard" && (
          <Dashboard stats={stats} total={total} responseRate={responseRate} onOpenJob={openDetails} />
        )}

        {page === "board" && (
          <JobBoard jobs={filteredJobs} onOpen={openDetails} onEdit={openEdit} onDragStart={setDraggedId} onDrop={id => { if (draggedId) changeStatus(draggedId, id); }} />
        )}

        {page === "applications" && (
          <Applications jobs={filteredJobs} filters={filters} setFilters={setFilters} clearFilters={clearFilters} onOpen={openDetails} onEdit={openEdit} onDelete={deleteJob} />
        )}

        {page === "interviews" && (
          <InterviewPage interviews={interviews} jobs={jobs} onOpen={openDetails} />
        )}

        {page === "followups" && (
          <FollowupPage followups={followups} onToggle={toggleFollowup} onOpen={openDetails} />
        )}

        {page === "analytics" && <Analytics stats={stats} />}

        {page === "settings" && (
          <section className="settings-card">
            <div className="section-heading"><div><h2>Workspace settings</h2><p>Configuration is environment-driven and ready for later containerization.</p></div></div>
            <div className="setting-row"><div><b>API endpoint</b><span>Frontend reads VITE_API_URL at build time.</span></div><code>{API}</code></div>
            <div className="setting-row"><div><b>Database</b><span>Backend reads DB_HOST, DB_PORT, DB_USER, DB_PASSWORD and DB_NAME.</span></div><span className="status-pill success">Configured by .env</span></div>
            <div className="setting-row"><div><b>Demo data</b><span>Sample jobs are inserted by database/init.sql and can be removed later.</span></div><button className="secondary-btn" onClick={() => notify("Sample data is managed through database/init.sql.")}>Info</button></div>
          </section>
        )}

        {loading && <div className="loading-overlay"><div className="spinner"></div>Loading workspace…</div>}
        {toast && <div className="toast">{toast}</div>}
      </main>

      {modal === "job" && <JobModal form={form} setForm={setForm} editId={editId} onClose={() => setModal(null)} onSave={saveJob} />}
      {selectedJob && <JobDetails job={selectedJob} onClose={() => setSelectedJob(null)} onEdit={openEdit} onDelete={deleteJob} onActivity={addActivity} onInterview={addInterview} onFollowup={addFollowup} onToggleFollowup={toggleFollowup} />}
    </div>
  );
}

function StatCard({ label, value, icon, tone = "" }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>;
}

function Dashboard({ stats, total, responseRate, onOpenJob }) {
  const t = stats?.totals || {};
  return (
    <div className="page-content">
      <div className="welcome-row">
        <div><h2>Your job search at a glance</h2><p>Track every opportunity, stay on top of follow-ups, and keep your search organized.</p></div>
        <div className="health-banner"><span>Search response rate</span><b>{responseRate}%</b><small>Based on active and accepted applications</small></div>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Applications" value={total} icon="▤" />
        <StatCard label="Saved Jobs" value={t.wishlist || 0} icon="☆" tone="purple" />
        <StatCard label="Applications Sent" value={t.applied || 0} icon="↗" tone="blue" />
        <StatCard label="Interviews" value={t.interview || 0} icon="◷" tone="orange" />
        <StatCard label="Offers" value={t.offer || 0} icon="★" tone="green" />
        <StatCard label="Rejected" value={t.rejected || 0} icon="×" tone="red" />
      </div>

      <div className="dashboard-grid">
        <section className="panel pipeline-panel">
          <div className="section-heading"><div><h2>Application pipeline</h2><p>Where your applications stand right now.</p></div></div>
          <div className="pipeline">
            {STATUS.map(([key, label]) => {
              const count = t[key] || 0;
              const width = total ? Math.max(4, Math.round((count / total) * 100)) : 4;
              return <div className="pipeline-row" key={key}><span>{label}</span><div className="bar-track"><div className={`bar bar-${key}`} style={{ width: `${width}%` }}></div></div><b>{count}</b></div>;
            })}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading"><div><h2>Upcoming interviews</h2><p>Prepare before the next conversation.</p></div></div>
          <div className="mini-list">
            {(stats?.upcomingInterviews || []).length ? stats.upcomingInterviews.slice(0, 4).map(i =>
              <button className="mini-item" key={i.id} onClick={() => onOpenJob(i.job_id)}>
                <div className="date-box"><b>{new Date(`${i.interview_date}T00:00:00`).getDate()}</b><small>{new Date(`${i.interview_date}T00:00:00`).toLocaleString("en", { month: "short" })}</small></div>
                <div><b>{i.job_title}</b><span>{i.company_name} · {i.interview_type}</span></div><span className="chevron">›</span>
              </button>
            ) : <Empty text="No upcoming interviews." />}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading"><div><h2>Follow-up queue</h2><p>Don't let recruiters slip through the cracks.</p></div></div>
          <div className="mini-list">
            {(stats?.followups || []).length ? stats.followups.slice(0, 4).map(f =>
              <button className="mini-item" key={f.id} onClick={() => onOpenJob(f.job_id)}>
                <div className={`date-box ${f.followup_date === new Date().toISOString().slice(0,10) ? "today" : ""}`}><b>{new Date(`${f.followup_date}T00:00:00`).getDate()}</b><small>{new Date(`${f.followup_date}T00:00:00`).toLocaleString("en", { month: "short" })}</small></div>
                <div><b>{f.company_name}</b><span>{f.note || "Follow up"}</span></div><span className="chevron">›</span>
              </button>
            ) : <Empty text="No pending follow-ups." />}
          </div>
        </section>

        <section className="panel source-panel">
          <div className="section-heading"><div><h2>Top job sources</h2><p>See where your opportunities are coming from.</p></div></div>
          {(stats?.bySource || []).length ? stats.bySource.slice(0, 5).map(s => {
            const max = stats.bySource[0]?.count || 1;
            return <div className="source-row" key={s.source}><span>{s.source}</span><div className="bar-track"><div className="bar bar-blue" style={{width: `${Math.max(5, (s.count/max)*100)}%`}}></div></div><b>{s.count}</b></div>;
          }) : <Empty text="Add jobs to see source analytics." />}
        </section>
      </div>
    </div>
  );
}

function JobBoard({ jobs, onOpen, onEdit, onDragStart, onDrop }) {
  return (
    <div className="page-content">
      <div className="board-toolbar"><div><p className="muted">Drag a card between columns to update its application status.</p></div></div>
      <div className="kanban">
        {STATUS.map(([key, label]) => {
          const cards = jobs.filter(j => j.status === key);
          return (
            <section className="kanban-column" key={key} onDragOver={e => e.preventDefault()} onDrop={() => onDrop(key)}>
              <div className="column-head"><span className={`dot dot-${key}`}></span><b>{label}</b><span className="count">{cards.length}</span></div>
              <div className="column-cards">
                {cards.map(job => <JobCard key={job.id} job={job} onOpen={onOpen} onEdit={onEdit} onDragStart={onDragStart} />)}
                {!cards.length && <div className="drop-empty">Drop jobs here</div>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function JobCard({ job, onOpen, onEdit, onDragStart }) {
  return (
    <article className="job-card" draggable onDragStart={() => onDragStart(job.id)} onClick={() => onOpen(job.id)}>
      <div className="card-top"><div className="company-avatar">{initials(job.company_name)}</div><span className={`priority ${job.priority}`}>{job.priority}</span></div>
      <h3>{job.job_title}</h3><p className="company-name">{job.company_name}</p>
      <div className="card-meta"><span>⌖ {job.location || "Location not set"}</span><span>◉ {job.work_type}</span></div>
      <div className="card-bottom"><span>{job.salary || "Salary not listed"}</span><button onClick={e => { e.stopPropagation(); onEdit(job); }} className="more-btn">•••</button></div>
      <div className="health-line"><span>Health</span><b>{job.health_score}%</b><div><i style={{width: `${job.health_score}%`}}></i></div></div>
    </article>
  );
}

function Applications({ jobs, filters, setFilters, clearFilters, onOpen, onEdit, onDelete }) {
  return (
    <div className="page-content">
      <div className="filters panel">
        <div className="search-wrap"><span>⌕</span><input placeholder="Search company or job title…" value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})}/></div>
        <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}><option value="">All statuses</option>{STATUS.map(([k,l]) => <option key={k} value={k}>{l}</option>)}</select>
        <select value={filters.work_type} onChange={e => setFilters({...filters, work_type: e.target.value})}><option value="">Work type</option><option>Remote</option><option>Hybrid</option><option>On-site</option></select>
        <select value={filters.priority} onChange={e => setFilters({...filters, priority: e.target.value})}><option value="">Priority</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
        <select value={filters.sort} onChange={e => setFilters({...filters, sort: e.target.value})}><option value="created_at">Newest</option><option value="application_date">Application date</option><option value="deadline">Deadline</option><option value="company">Company</option><option value="priority">Priority</option></select>
        <button className="secondary-btn" onClick={clearFilters}>Clear</button>
      </div>

      <section className="panel table-panel">
        <div className="section-heading"><div><h2>All applications</h2><p>{jobs.length} result{jobs.length === 1 ? "" : "s"} matching your filters.</p></div></div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Company</th><th>Role</th><th>Status</th><th>Location</th><th>Applied</th><th>Deadline</th><th>Priority</th><th>Health</th><th></th></tr></thead>
            <tbody>{jobs.map(job => <tr key={job.id}>
              <td><button className="company-cell" onClick={() => onOpen(job.id)}><span className="company-avatar small">{initials(job.company_name)}</span><b>{job.company_name}</b></button></td>
              <td>{job.job_title}</td>
              <td><span className={`status-pill ${job.status}`}>{job.status}</span></td>
              <td>{job.location || "—"}</td><td>{formatDate(job.application_date)}</td><td>{formatDate(job.deadline)}</td>
              <td><span className={`priority ${job.priority}`}>{job.priority}</span></td><td><b>{job.health_score}%</b></td>
              <td><div className="row-actions"><button onClick={() => onEdit(job)}>Edit</button><button onClick={() => onDelete(job.id)}>Delete</button></div></td>
            </tr>)}</tbody>
          </table>
          {!jobs.length && <Empty text="No applications match your filters."/>}
        </div>
      </section>
    </div>
  );
}

function InterviewPage({ interviews, onOpen }) {
  return <div className="page-content"><section className="panel"><div className="section-heading"><div><h2>Upcoming interviews</h2><p>Keep every conversation and preparation task in one place.</p></div></div><div className="interview-grid">
    {interviews.length ? interviews.map(i => <button className="interview-card" key={i.id} onClick={() => onOpen(i.job_id)}>
      <div className="interview-date"><b>{new Date(`${i.interview_date}T00:00:00`).getDate()}</b><span>{new Date(`${i.interview_date}T00:00:00`).toLocaleString("en", {month:"short"})}</span></div>
      <div><h3>{i.job_title}</h3><p>{i.company_name}</p><div className="tags"><span>{i.interview_type}</span><span>{i.interviewer || "Hiring team"}</span></div></div><span className="chevron">›</span>
    </button>) : <Empty text="No upcoming interviews. Add an interview from a job's details."/>}
  </div></section></div>;
}

function FollowupPage({ followups, onToggle, onOpen }) {
  const now = new Date().toISOString().slice(0,10);
  return <div className="page-content"><section className="panel"><div className="section-heading"><div><h2>Follow-up queue</h2><p>Prioritize upcoming, due today and overdue follow-ups.</p></div></div><div className="follow-list">
    {followups.length ? followups.map(f => {
      const overdue = f.followup_date < now && !f.completed;
      const todayDue = f.followup_date === now;
      return <div className={`follow-row ${overdue ? "overdue" : todayDue ? "due-today" : ""}`} key={f.id}>
        <button className="check-btn" onClick={() => onToggle(f)}>{f.completed ? "✓" : ""}</button>
        <div className="follow-main"><button onClick={() => onOpen(f.job_id)}><b>{f.company_name}</b><span>{f.job_title}</span></button><p>{f.note || "Follow up with recruiter"}</p></div>
        <div className="follow-date"><b>{formatDate(f.followup_date)}</b><span>{overdue ? "Overdue" : todayDue ? "Due today" : "Upcoming"}</span></div>
      </div>;
    }) : <Empty text="No follow-ups found."/>}
  </div></section></div>;
}

function Analytics({ stats }) {
  const monthly = [...(stats?.monthly || [])].reverse();
  const max = Math.max(1, ...monthly.map(x => Number(x.count)));
  return <div className="page-content"><div className="analytics-grid">
    <section className="panel"><div className="section-heading"><div><h2>Applications by month</h2><p>Recent application activity.</p></div></div><div className="chart"><div className="chart-y"><span>{max}</span><span>{Math.ceil(max/2)}</span><span>0</span></div><div className="bars">{monthly.map(m => <div className="bar-col" key={m.month}><div className="bar-value">{m.count}</div><div className="chart-bar" style={{height: `${Math.max(8, Number(m.count)/max*180)}px`}}></div><small>{m.month.slice(5)}</small></div>)}</div></div></section>
    <section className="panel"><div className="section-heading"><div><h2>Source performance</h2><p>Number of opportunities per source.</p></div></div>{(stats?.bySource || []).map(s => <div className="source-row big" key={s.source}><span>{s.source}</span><div className="bar-track"><div className="bar bar-purple" style={{width: `${Math.min(100, Number(s.count)*20)}%`}}></div></div><b>{s.count}</b></div>)}</section>
  </div></div>;
}

function JobModal({ form, setForm, editId, onClose, onSave }) {
  const set = (key, value) => setForm(f => ({...f, [key]: value}));
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal large" onMouseDown={e => e.stopPropagation()}>
    <div className="modal-head"><div><span className="eyebrow">APPLICATION</span><h2>{editId ? "Edit job" : "Add a new job"}</h2></div><button onClick={onClose}>×</button></div>
    <form onSubmit={onSave} className="form-grid">
      <label>Company Name*<input required value={form.company_name} onChange={e => set("company_name", e.target.value)} placeholder="e.g. Microsoft"/></label>
      <label>Job Title*<input required value={form.job_title} onChange={e => set("job_title", e.target.value)} placeholder="e.g. DevOps Engineer"/></label>
      <label>Location<input value={form.location} onChange={e => set("location", e.target.value)} placeholder="Mumbai, India"/></label>
      <label>Work Type<select value={form.work_type} onChange={e => set("work_type", e.target.value)}><option>Remote</option><option>Hybrid</option><option>On-site</option></select></label>
      <label>Employment Type<select value={form.employment_type} onChange={e => set("employment_type", e.target.value)}><option>Full-time</option><option>Part-time</option><option>Internship</option><option>Contract</option></select></label>
      <label>Salary<input value={form.salary} onChange={e => set("salary", e.target.value)} placeholder="₹6–9 LPA"/></label>
      <label>Job URL<input type="url" value={form.job_url} onChange={e => set("job_url", e.target.value)} placeholder="https://…"/></label>
      <label>Source<select value={form.source} onChange={e => set("source", e.target.value)}>{["LinkedIn","Naukri","Indeed","Company Website","Referral","Email","Other"].map(x => <option key={x}>{x}</option>)}</select></label>
      <label>Application Date<input type="date" value={form.application_date || ""} onChange={e => set("application_date", e.target.value)}/></label>
      <label>Deadline<input type="date" value={form.deadline || ""} onChange={e => set("deadline", e.target.value)}/></label>
      <label>Priority<select value={form.priority} onChange={e => set("priority", e.target.value)}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
      <label>Status<select value={form.status} onChange={e => set("status", e.target.value)}>{STATUS.map(([k,l]) => <option key={k} value={k}>{l}</option>)}</select></label>
      <label>Resume Version<input value={form.resume_version} onChange={e => set("resume_version", e.target.value)} placeholder="DevOps Resume v1"/></label>
      <label>Job Description<textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Paste or summarize the job description…"/></label>
      <label>Notes<textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Recruiter notes, reminders, preparation…"/></label>
      <div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn">{editId ? "Save Changes" : "Add Job"}</button></div>
    </form>
  </div></div>;
}

function JobDetails({ job, onClose, onEdit, onDelete, onActivity, onInterview, onFollowup, onToggleFollowup }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal details-modal" onMouseDown={e => e.stopPropagation()}>
    <div className="details-head"><div className="company-avatar large">{initials(job.company_name)}</div><div><span className="eyebrow">{job.company_name}</span><h2>{job.job_title}</h2><p>{job.location || "Location not set"} · {job.work_type} · {job.employment_type}</p></div><button className="close-btn" onClick={onClose}>×</button></div>
    <div className="detail-actions"><span className={`status-pill ${job.status}`}>{job.status}</span><span className={`priority ${job.priority}`}>{job.priority} priority</span><span className="health-badge">Health {job.health_score}/100</span><div className="spacer"></div><button className="secondary-btn" onClick={() => onEdit(job)}>Edit</button><button className="danger-btn" onClick={() => onDelete(job.id)}>Delete</button></div>
    <div className="details-layout">
      <div>
        <div className="detail-stats"><div><span>Salary</span><b>{job.salary || "Not listed"}</b></div><div><span>Applied</span><b>{formatDate(job.application_date)}</b></div><div><span>Deadline</span><b>{formatDate(job.deadline)}</b></div><div><span>Resume</span><b>{job.resume_version || "Not specified"}</b></div></div>
        <DetailBlock title="Job description"><p className="preline">{job.description || "No description added."}</p></DetailBlock>
        <DetailBlock title="Notes"><p className="preline">{job.notes || "No notes added."}</p></DetailBlock>
        <DetailBlock title="Activity timeline">
          <div className="timeline">{(job.activities || []).map(a => <div className="timeline-item" key={a.id}><div className="timeline-dot"></div><div><b>{a.title}</b><span>{formatDate(a.activity_date)}</span><p>{a.description}</p></div></div>)}{!job.activities?.length && <Empty text="No activity yet."/>}</div>
          <form className="inline-form" onSubmit={onActivity}><select name="activity_type"><option value="note">Note</option><option value="application">Application</option><option value="screening">Screening</option><option value="interview">Interview</option><option value="offer">Offer</option></select><input name="title" required placeholder="Activity title"/><input name="description" placeholder="Short description"/><button className="primary-btn">Add</button></form>
        </DetailBlock>
      </div>
      <aside>
        <DetailBlock title="Interviews"><div className="side-list">{(job.interviews || []).map(i => <div className="side-item" key={i.id}><b>{formatDate(i.interview_date)} {i.interview_time || ""}</b><span>{i.interview_type} · {i.interviewer || "Hiring team"}</span></div>)}{!job.interviews?.length && <Empty text="No interview scheduled."/>}</div>
          <form className="compact-form" onSubmit={onInterview}><input type="date" name="interview_date" required/><input type="time" name="interview_time"/><select name="interview_type"><option>Video</option><option>Phone</option><option>Technical</option><option>HR</option><option>In-person</option></select><input name="interviewer" placeholder="Interviewer"/><input name="meeting_link" placeholder="Meeting link"/><select name="preparation_status"><option>Not Started</option><option>In Progress</option><option>Ready</option></select><textarea name="notes" placeholder="Preparation notes"/><button className="secondary-btn">+ Add interview</button></form>
        </DetailBlock>
        <DetailBlock title="Follow-ups"><div className="side-list">{(job.followups || []).map(f => <label className="follow-mini" key={f.id}><input type="checkbox" checked={!!f.completed} onChange={() => onToggleFollowup(f)}/><span><b>{formatDate(f.followup_date)}</b>{f.note || "Follow up"}</span></label>)}{!job.followups?.length && <Empty text="No follow-up scheduled."/>}</div>
          <form className="compact-form" onSubmit={onFollowup}><input type="date" name="followup_date" required/><input name="note" placeholder="Follow-up note"/><button className="secondary-btn">+ Add follow-up</button></form>
        </DetailBlock>
        {job.job_url && <a className="external-link" href={job.job_url} target="_blank" rel="noreferrer">Open job posting ↗</a>}
      </aside>
    </div>
  </div></div>;
}

function DetailBlock({ title, children }) { return <section className="detail-block"><div className="block-title">{title}</div>{children}</section>; }
function Empty({ text }) { return <div className="empty">{text}</div>; }

export default App;
