# JobFlow — Smart Job Application Tracker

A professional, beginner-friendly full-stack Job Application Tracker built for a DevOps internship project.

## Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MySQL
- API: REST
- Future-ready: Docker Compose, network and volume can be added later

## Features
- Dashboard with application metrics
- Kanban board with drag-and-drop status changes
- Add, edit and delete jobs
- Job details modal
- Activity timeline
- Interview tracker
- Follow-up reminders
- Search, filters and sorting
- Application Health Score
- Resume version tracking
- Job source tracking
- Priority system
- Responsive SaaS-style UI
- MySQL foreign keys
- Environment-based configuration
- Sample data

## Project structure

```text
jobflow/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── config/db.js
│   ├── controllers/
│   │   ├── activityController.js
│   │   ├── dashboardController.js
│   │   ├── followupController.js
│   │   ├── interviewController.js
│   │   └── jobController.js
│   ├── middleware/errorHandler.js
│   ├── routes/
│   │   ├── activityRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── followupRoutes.js
│   │   ├── interviewRoutes.js
│   │   └── jobRoutes.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── database/init.sql
├── .gitignore
└── README.md
```

## 1. Requirements

Install:
- Node.js 20+
- MySQL 8+

Check:

```bash
node -v
npm -v
mysql --version
```

## 2. Create the database

Open MySQL:

```bash
mysql -u root -p
```

Then:

```sql
SOURCE /absolute/path/to/jobflow/database/init.sql;
```

Or from your terminal:

```bash
mysql -u root -p < database/init.sql
```

The SQL creates the `jobflow` database, tables and sample data.

## 3. Configure backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=jobflow
FRONTEND_URL=http://localhost:5173
```

## 4. Start backend

```bash
cd backend
npm install
npm run dev
```

Backend:
`http://localhost:5000`

Health check:
`http://localhost:5000/api/health`

## 5. Start frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open:
`http://localhost:5173`

## 6. API summary

### Jobs
- `GET /api/jobs`
- `GET /api/jobs/:id`
- `POST /api/jobs`
- `PUT /api/jobs/:id`
- `DELETE /api/jobs/:id`
- `PUT /api/jobs/:id/status`

### Interviews
- `GET /api/interviews`
- `POST /api/interviews`
- `DELETE /api/interviews/:id`

### Activities
- `GET /api/activities`
- `POST /api/activities`
- `DELETE /api/activities/:id`

### Follow-ups
- `GET /api/followups`
- `POST /api/followups`
- `PUT /api/followups/:id`
- `DELETE /api/followups/:id`

### Dashboard
- `GET /api/dashboard/stats`

## 7. Test flow

1. Start MySQL.
2. Start backend.
3. Start frontend.
4. Open Dashboard.
5. Add a job.
6. Open Job Board.
7. Drag the job from Wishlist to Applied.
8. Open the card and add an activity.
9. Add an interview.
10. Add a follow-up.
11. Refresh the page and confirm MySQL retained the data.
12. Edit and delete a job.

## 8. Dockerization later

This project is intentionally separated into frontend, backend and database layers.

Later architecture:

```text
Browser
   |
   v
Frontend Container
   |
   v
Backend Container
   |
   v
MySQL Container
   |
   v
Docker Volume
```

For Docker:
- Frontend API URL becomes configurable.
- Backend uses `DB_HOST=mysql`.
- MySQL data is persisted using a named Docker volume.
- A custom Docker network connects the services.

Kubernetes, Jenkins, Terraform and AWS are intentionally not included in this first version.
