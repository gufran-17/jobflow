CREATE DATABASE IF NOT EXISTS jobflow;
USE jobflow;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS followups;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS interviews;
DROP TABLE IF EXISTS jobs;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(150) NOT NULL,
  job_title VARCHAR(180) NOT NULL,
  location VARCHAR(150),
  work_type ENUM('Remote','Hybrid','On-site') DEFAULT 'Remote',
  employment_type ENUM('Full-time','Part-time','Internship','Contract') DEFAULT 'Full-time',
  salary VARCHAR(100),
  job_url VARCHAR(500),
  status ENUM('wishlist','applied','screening','interview','offer','accepted','rejected') DEFAULT 'wishlist',
  priority ENUM('low','medium','high') DEFAULT 'medium',
  source VARCHAR(60) DEFAULT 'Other',
  application_date DATE NULL,
  deadline DATE NULL,
  resume_version VARCHAR(120),
  description TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jobs_status (status),
  INDEX idx_jobs_deadline (deadline),
  INDEX idx_jobs_company (company_name)
);

CREATE TABLE interviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  interview_date DATE NOT NULL,
  interview_time TIME NULL,
  interview_type VARCHAR(40) DEFAULT 'Video',
  interviewer VARCHAR(150),
  meeting_link VARCHAR(500),
  notes TEXT,
  preparation_status VARCHAR(40) DEFAULT 'Not Started',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_interviews_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE TABLE activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  activity_type VARCHAR(50) DEFAULT 'note',
  title VARCHAR(180) NOT NULL,
  description TEXT,
  activity_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activities_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE TABLE followups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  followup_date DATE NOT NULL,
  note VARCHAR(500),
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_followups_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

INSERT INTO jobs
(company_name, job_title, location, work_type, employment_type, salary, job_url, status, priority, source, application_date, deadline, resume_version, description, notes)
VALUES
('Microsoft', 'Junior Cloud / DevOps Engineer', 'Hyderabad', 'Hybrid', 'Full-time', '₹6–9 LPA', 'https://careers.microsoft.com/', 'applied', 'high', 'LinkedIn', DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 10 DAY), 'DevOps Resume v1', 'Entry-level cloud and DevOps opportunity focused on automation and Azure/AWS fundamentals.', 'Follow up after one week.'),
('Amazon', 'Cloud Support Associate', 'Bengaluru', 'On-site', 'Full-time', '₹5–8 LPA', 'https://www.amazon.jobs/', 'interview', 'high', 'Company Website', DATE_SUB(CURDATE(), INTERVAL 14 DAY), DATE_ADD(CURDATE(), INTERVAL 6 DAY), 'Cloud Resume v2', 'Cloud operations, troubleshooting and customer-facing technical support.', 'Prepare Linux, networking and AWS questions.'),
('Accenture', 'DevOps Intern', 'Mumbai', 'Hybrid', 'Internship', '₹25k/month', 'https://www.accenture.com/', 'screening', 'medium', 'Naukri', DATE_SUB(CURDATE(), INTERVAL 3 DAY), DATE_ADD(CURDATE(), INTERVAL 14 DAY), 'DevOps Resume v1', 'Internship involving CI/CD, containers and cloud deployment.', 'Recruiter screening pending.'),
('Infosys', 'AWS Cloud Trainee', 'Pune', 'Hybrid', 'Full-time', '₹4–6 LPA', 'https://www.infosys.com/careers/', 'wishlist', 'medium', 'Company Website', NULL, DATE_ADD(CURDATE(), INTERVAL 12 DAY), 'General Resume', 'Cloud trainee role with AWS fundamentals and infrastructure support.', 'Review job requirements before applying.'),
('Google', 'Site Reliability Engineering Intern', 'Bengaluru', 'Hybrid', 'Internship', 'Competitive', 'https://careers.google.com/', 'wishlist', 'high', 'Referral', NULL, DATE_ADD(CURDATE(), INTERVAL 20 DAY), 'Cloud Resume v2', 'SRE internship focused on reliability, automation and distributed systems.', 'Strong target role.')
;

INSERT INTO interviews
(job_id, interview_date, interview_time, interview_type, interviewer, meeting_link, notes, preparation_status)
SELECT id, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:00:00', 'Technical', 'Hiring Team', 'https://meet.google.com/example', 'Prepare Linux, Docker, AWS and CI/CD questions.', 'In Progress'
FROM jobs WHERE company_name = 'Amazon';

INSERT INTO activities
(job_id, activity_type, title, description, activity_date)
SELECT id, 'application', 'Application submitted', 'Application sent through LinkedIn.', application_date
FROM jobs WHERE company_name = 'Microsoft';

INSERT INTO activities
(job_id, activity_type, title, description, activity_date)
SELECT id, 'screening', 'Recruiter screening', 'Initial recruiter screening completed.', DATE_SUB(CURDATE(), INTERVAL 1 DAY)
FROM jobs WHERE company_name = 'Accenture';

INSERT INTO followups
(job_id, followup_date, note)
SELECT id, DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'Follow up with recruiter about application status.'
FROM jobs WHERE company_name = 'Microsoft';
