/* ==============================
   LOAD ENV
============================== */
require("dotenv").config();

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error("❌ Missing MONGO_URI or JWT_SECRET in .env");
  process.exit(1);
}

/* ==============================
   IMPORTS
============================== */
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

/* ==============================
   MIDDLEWARE
============================== */
app.use(express.json());

/* serve public folder */
app.use(express.static(path.join(__dirname, "public")));

/* ==============================
   ENSURE UPLOAD FOLDER EXISTS
============================== */
const UPLOAD_DIR = path.join(__dirname, "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use("/uploads", express.static(UPLOAD_DIR));

/* ==============================
   DATABASE CONNECTION
============================== */
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => {
  console.error("❌ DB ERROR:", err);
  process.exit(1);
});

/* ==============================
   USER MODEL
============================== */
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  paid: { type: Boolean, default: false },
  role: { type: String, default: "user" }
});

const User = mongoose.model("User", userSchema);

/* ==============================
   AUTH MIDDLEWARE
============================== */
function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer "))
    return res.status(401).json({ error: "No token" });

  try {
    const token = header.split(" ")[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: "Invalid token" });
  }
}

/* ==============================
   ADMIN MIDDLEWARE
============================== */
function admin(req, res, next) {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Admin only" });
  next();
}

/* ==============================
   MULTER CONFIG
============================== */
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = [
      "image/png",
      "image/jpeg",
      "application/pdf"
    ];

    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("File not allowed"));
  }
});

/* ==============================
   ROUTES
============================== */

// Home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Register
app.post("/api/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Missing data" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ error: "User exists" });

    const hashed = await bcrypt.hash(password, 10);

    await User.create({ email, password: hashed });

    res.json({ message: "✅ User Registered" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ error: "Wrong password" });

    if (!user.paid)
      return res.status(403).json({ error: "Payment required" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// Dashboard
app.get("/api/dashboard", auth, (req, res) => {
  res.json({ message: "🔥 Elite Member Access Granted" });
});

// Admin
app.get("/api/admin", auth, admin, (req, res) => {
  res.json({ message: "👑 Admin Panel Access" });
});

// Users list
app.get("/api/users", auth, admin, async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

// Upload
app.post("/api/upload", auth, upload.single("file"), (req, res) => {
  res.json({
    message: "Upload success",
    file: req.file.filename,
    url: `/uploads/${req.file.filename}`
  });
});

// Test
app.get("/api/test", (_, res) => {
  res.json({ message: "Server Working ✅" });
});

/* ==============================
   GLOBAL ERROR HANDLER
============================== */
app.use((err, req, res, next) => {
  console.error(err);

  if (err instanceof multer.MulterError)
    return res.status(400).json({ error: err.message });

  res.status(500).json({ error: err.message || "Server error" });
});

/* ==============================
   START SERVER
============================== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});