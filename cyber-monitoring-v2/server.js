const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");

const app = express();
const PORT = 3000;

const db = new Database("cyber_monitoring.db");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
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
    status TEXT NOT NULL DEFAULT 'Pending',
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
  console.log("Default admin created: admin@cyberpanel.com / Admin12345");
}

const sessions = new Map();

function createSession(email) {
  const token = "sess_" + Math.random().toString(36).slice(2) + Date.now();
  sessions.set(token, {
    email,
    createdAt: Date.now()
  });
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

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password required" });
  }

  const admin = db.prepare("SELECT * FROM admins WHERE email = ?").get(email);

  if (!admin) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  const ok = bcrypt.compareSync(password, admin.password_hash);

  if (!ok) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  const token = createSession(admin.email);

  res.cookie("admin_session", token, {
    httpOnly: true,
    sameSite: "lax"
  });

  res.json({
    success: true,
    email: admin.email
  });
});

app.post("/api/logout", requireAuth, (req, res) => {
  const token = req.cookies.admin_session;
  sessions.delete(token);
  res.clearCookie("admin_session");
  res.json({ success: true });
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({
    success: true,
    email: req.admin.email
  });
});

app.get("/api/reports", requireAuth, (req, res) => {
  const reports = db.prepare(`
    SELECT * FROM reports
    ORDER BY id DESC
  `).all();

  res.json({ success: true, reports });
});

app.post("/api/reports", requireAuth, (req, res) => {
  const {
    reporterName,
    contentUrl,
    platform,
    suspectedId,
    reason,
    evidence
  } = req.body;

  if (!reporterName || !contentUrl || !platform || !reason) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields"
    });
  }

  const result = db.prepare(`
    INSERT INTO reports (
      reporter_name, content_url, platform, suspected_id, reason, evidence, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?)
  `).run(
    reporterName,
    contentUrl,
    platform,
    suspectedId || "",
    reason,
    evidence || "",
    new Date().toISOString()
  );

  res.json({
    success: true,
    id: result.lastInsertRowid
  });
});

app.put("/api/reports/:id/status", requireAuth, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowed = ["Pending", "Reviewing", "Action Taken", "Rejected"];
  if (!allowed.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status"
    });
  }

  db.prepare(`
    UPDATE reports
    SET status = ?
    WHERE id = ?
  `).run(status, id);

  res.json({ success: true });
});

app.delete("/api/reports/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM reports WHERE id = ?").run(id);
  res.json({ success: true });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "monitoring-panel.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
