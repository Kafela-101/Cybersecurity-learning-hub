const express = require("express");
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");
const multer = require("multer");

const app = express();
const PORT = 3000;

const db = new Database("cyber_monitoring.db");

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const safeName = Date.now() + "-" + file.originalname.replace(/\s+/g, "-");
    cb(null, safeName);
  }
});

const upload = multer({ storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public")));

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reporter_name TEXT NOT NULL,
    content_url TEXT NOT NULL,
    platform TEXT NOT NULL,
    suspected_id TEXT,
    reason TEXT NOT NULL,
    evidence TEXT,
    screenshot TEXT,
    status TEXT NOT NULL DEFAULT 'Pending',
    auto_flag TEXT DEFAULT '',
    is_duplicate INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    report_id INTEGER,
    admin_email TEXT,
    created_at TEXT NOT NULL
  );
`);

const adminExists = db.prepare("SELECT * FROM admins WHERE email = ?").get("admin@cyberpanel.com");

if (!adminExists) {
  const hash = bcrypt.hashSync("Admin12345", 10);
  db.prepare(`
    INSERT INTO admins (email, password_hash, created_at)
    VALUES (?, ?, ?)
  `).run("admin@cyberpanel.com", hash, new Date().toISOString());
}

const sessions = new Map();

function createSession(email) {
  const token = "sess_" + Math.random().toString(36).slice(2) + Date.now();
  sessions.set(token, { email, createdAt: Date.now() });
  return token;
}

function requireAuth(req, res, next) {
  const token = req.cookies.admin_session;
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  req.admin = sessions.get(token);
  next();
}

function logAction(action, reportId, adminEmail) {
  db.prepare(`
    INSERT INTO activity_logs (action, report_id, admin_email, created_at)
    VALUES (?, ?, ?, ?)
  `).run(action, reportId || null, adminEmail || "", new Date().toISOString());
}

function detectFlags(text) {
  const keywords = [
    "porn",
    "nude",
    "obscene",
    "adult",
    "sexual",
    "explicit"
  ];

  const lowered = (text || "").toLowerCase();
  const matched = keywords.filter(word => lowered.includes(word));
  return matched.join(", ");
}

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const admin = db.prepare("SELECT * FROM admins WHERE email = ?").get(email);

  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  const token = createSession(admin.email);
  res.cookie("admin_session", token, {
    httpOnly: true,
    sameSite: "lax"
  });

  res.json({ success: true, email: admin.email });
});

app.post("/api/logout", requireAuth, (req, res) => {
  const token = req.cookies.admin_session;
  sessions.delete(token);
  res.clearCookie("admin_session");
  res.json({ success: true });
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ success: true, email: req.admin.email });
});

app.get("/api/reports", requireAuth, (req, res) => {
  const reports = db.prepare("SELECT * FROM reports ORDER BY id DESC").all();
  res.json({ success: true, reports });
});

app.get("/api/stats", requireAuth, (req, res) => {
  const total = db.prepare("SELECT COUNT(*) as count FROM reports").get().count;
  const pending = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'Pending'").get().count;
  const reviewing = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'Reviewing'").get().count;
  const actionTaken = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'Action Taken'").get().count;
  const rejected = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'Rejected'").get().count;

  res.json({
    success: true,
    stats: { total, pending, reviewing, actionTaken, rejected }
  });
});

app.get("/api/logs", requireAuth, (req, res) => {
  const logs = db.prepare("SELECT * FROM activity_logs ORDER BY id DESC LIMIT 50").all();
  res.json({ success: true, logs });
});

app.post("/api/reports", requireAuth, upload.single("screenshot"), (req, res) => {
  const {
    reporterName,
    contentUrl,
    platform,
    suspectedId,
    reason,
    evidence
  } = req.body;

  if (!reporterName || !contentUrl || !platform || !reason) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const existing = db.prepare("SELECT id FROM reports WHERE content_url = ?").get(contentUrl);
  const isDuplicate = existing ? 1 : 0;

  const autoFlag = detectFlags(`${platform} ${reason} ${evidence || ""}`);
  const screenshotPath = req.file ? `/uploads/${req.file.filename}` : "";

  const result = db.prepare(`
    INSERT INTO reports (
      reporter_name, content_url, platform, suspected_id,
      reason, evidence, screenshot, status, auto_flag, is_duplicate, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?)
  `).run(
    reporterName,
    contentUrl,
    platform,
    suspectedId || "",
    reason,
    evidence || "",
    screenshotPath,
    autoFlag,
    isDuplicate,
    new Date().toISOString()
  );

  logAction("Created report", result.lastInsertRowid, req.admin.email);

  res.json({
    success: true,
    id: result.lastInsertRowid,
    autoFlag,
    isDuplicate
  });
});

app.put("/api/reports/:id/status", requireAuth, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowed = ["Pending", "Reviewing", "Action Taken", "Rejected"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  db.prepare("UPDATE reports SET status = ? WHERE id = ?").run(status, id);
  logAction(`Updated status to ${status}`, id, req.admin.email);

  res.json({ success: true });
});

app.delete("/api/reports/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM reports WHERE id = ?").run(id);
  logAction("Deleted report", id, req.admin.email);
  res.json({ success: true });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "monitoring-panel.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});