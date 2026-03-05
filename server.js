/* ==============================
   LOAD ENV
============================== */
require("dotenv").config();

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error("❌ Missing MONGO_URI or JWT_SECRET");
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
const session = require("express-session");
const path = require("path");
const fs = require("fs");

const app = express();

/* ==============================
   MIDDLEWARE
============================== */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "elite-links-secret",
    resave: false,
    saveUninitialized: false
  })
);

/* ==============================
   STATIC FILES
============================== */

app.use(express.static(path.join(__dirname, "public")));

/* ==============================
   UPLOAD FOLDER
============================== */

const UPLOAD_DIR = path.join(__dirname, "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use("/uploads", express.static(UPLOAD_DIR));

/* ==============================
   DATABASE
============================== */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

/* ==============================
   MODELS
============================== */

const User = mongoose.model(
  "User",
  new mongoose.Schema({
    email: { type: String, unique: true },
    password: String,
    paid: { type: Boolean, default: false },
    role: { type: String, default: "user" }
  })
);

const Profile = mongoose.model(
  "Profile",
  new mongoose.Schema({
    userId: String,
    username: { type: String, unique: true },
    about: String,
    facebook: String,
    instagram: String,
    tiktok: String,
    youtube: String,
    shop: String,
    website: String,
    links: [{ title: String, url: String }]
  })
);

/* ==============================
   AUTH MIDDLEWARE
============================== */

function auth(req, res, next) {

  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer "))
    return res.status(401).json({ error: "No token" });

  try {
    const token = header.split(" ")[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: "Invalid token" });
  }
}

function sessionAuth(req, res, next) {

  if (!req.session.user) {
    return res.redirect("/login.html");
  }

  next();
}

function admin(req, res, next) {

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }

  next();
}

/* ==============================
   MULTER UPLOAD
============================== */

const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, UPLOAD_DIR),
    filename: (_, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }
});

/* ==============================
   ROUTES
============================== */

/* ---- HOME ---- */
app.get("/", (_, res) => {
  res.send("🔥 Elite Links running");
});

/* ---- REGISTER ---- */
app.post("/api/register", async (req, res, next) => {

  try {

    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Missing data" });

    if (await User.findOne({ email }))
      return res.status(400).json({ error: "User exists" });

    const hash = await bcrypt.hash(password, 10);

    await User.create({
      email,
      password: hash
    });

    res.json({ message: "✅ Registered" });

  } catch (err) {
    next(err);
  }
});

/* ---- LOGIN ---- */
app.post("/api/login", async (req, res, next) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user)
      return res.status(401).json({ error: "User not found" });

    if (!(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: "Wrong password" });

    if (!user.paid)
      return res.status(403).json({ error: "Payment required" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    req.session.user = user._id;

    res.json({ token });

  } catch (err) {
    next(err);
  }
});

/* ---- DASHBOARD API ---- */
app.get("/api/dashboard", auth, (req, res) => {
  res.json({ message: "🔥 Member Access Granted" });
});

/* ---- ADMIN PANEL ---- */
app.get("/api/admin", auth, admin, (_, res) => {
  res.json({ message: "👑 Admin Panel" });
});

/* ---- LIST USERS ---- */
app.get("/api/users", auth, admin, async (_, res) => {

  const users = await User.find().select("-password");

  res.json(users);
});

/* ---- FILE UPLOAD ---- */
app.post("/api/upload", auth, upload.single("file"), (req, res) => {

  res.json({
    url: `/uploads/${req.file.filename}`
  });

});

/* ---- CREATE PROFILE ---- */
app.post("/create-profile", sessionAuth, async (req, res, next) => {

  try {

    await Profile.create({
      userId: req.session.user,
      ...req.body
    });

    res.redirect("/dashboard.html");

  } catch (err) {
    next(err);
  }

});

/* ---- DASHBOARD PAGE ---- */
app.get("/dashboard.html", sessionAuth, (req, res) => {

  res.sendFile(
    path.join(__dirname, "public", "dashboard.html")
  );

});

/* ---- SITEMAP ---- */
app.get("/sitemap.xml", async (_, res) => {

  const profiles = await Profile.find();

  const urls = profiles.map(p => `
<url>
<loc>https://elite-links.onrender.com/${p.username}</loc>
</url>`).join("");

  res.header("Content-Type", "application/xml");

  res.send(`
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`);

});

/* ---- PUBLIC PROFILE ---- */
app.get("/:username", async (req, res) => {

  const profile = await Profile.findOne({
    username: req.params.username
  });

  if (!profile) {
    return res.status(404).send("Profile not found");
  }

  res.sendFile(
    path.join(__dirname, "public", "profile.html")
  );

});

/* ==============================
   ERROR HANDLER
============================== */

app.use((err, req, res, next) => {

  console.error(err);

  res.status(500).json({
    error: err.message
  });

});

/* ==============================
   START SERVER
============================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});