/* ==============================
   LOAD ENV
============================== */
require("dotenv").config();

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
app.use(express.static("public"));

/* ==============================
   ENSURE UPLOAD FOLDER EXISTS
============================== */
fs.mkdirSync("uploads", { recursive: true });

/* ==============================
   DATABASE CONNECTION
============================== */
mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("✅ MongoDB Connected"))
.catch(err=>console.log("DB ERROR:",err));

/* ==============================
   USER MODEL
============================== */
const userSchema = new mongoose.Schema({
  email:{ type:String, required:true, unique:true },
  password:{ type:String, required:true },
  paid:{ type:Boolean, default:false },
  role:{ type:String, default:"user" }
});

const User = mongoose.model("User",userSchema);

/* ==============================
   AUTH MIDDLEWARE
============================== */
function auth(req,res,next){
  const header = req.headers.authorization;

  if(!header || !header.startsWith("Bearer "))
    return res.status(401).send("No token");

  const token = header.split(" ")[1];

  try{
    const verified = jwt.verify(token,process.env.JWT_SECRET);
    req.user = verified;
    next();
  }catch{
    res.status(403).send("Invalid token");
  }
}

/* ==============================
   ADMIN MIDDLEWARE
============================== */
function admin(req,res,next){
  if(req.user.role !== "admin")
    return res.status(403).send("Admin only");
  next();
}

/* ==============================
   MULTER CONFIG
============================== */
const storage = multer.diskStorage({
  destination:(req,file,cb)=>{
    cb(null,"uploads/");
  },
  filename:(req,file,cb)=>{
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
 storage,
 limits:{ fileSize:5*1024*1024 },
 fileFilter:(req,file,cb)=>{
   const allowed = [
     "image/png",
     "image/jpeg",
     "application/pdf"
   ];

   if(allowed.includes(file.mimetype))
     cb(null,true);
   else
     cb(new Error("File not allowed"));
 }
});

app.use("/uploads",express.static("uploads"));

/* ==============================
   REGISTER
============================== */
app.post("/api/register", async(req,res)=>{
try{
  const {email,password} = req.body;

  if(!email || !password)
    return res.status(400).send("Missing data");

  const exists = await User.findOne({email});
  if(exists)
    return res.status(400).send("User exists");

  const hashed = await bcrypt.hash(password,10);

  await User.create({email,password:hashed});

  res.json({message:"✅ User Registered"});

}catch{
  res.status(500).send("Server error");
}
});

/* ==============================
   LOGIN
============================== */
app.post("/api/login", async(req,res)=>{
try{
  const {email,password} = req.body;

  const user = await User.findOne({email});
  if(!user)
    return res.status(401).send("User not found");

  const valid = await bcrypt.compare(password,user.password);
  if(!valid)
    return res.status(401).send("Wrong password");

  if(!user.paid)
    return res.status(403).send("Payment required");

  const token = jwt.sign(
    {id:user._id,role:user.role},
    process.env.JWT_SECRET,
    {expiresIn:"7d"}
  );

  res.json({token});

}catch{
  res.status(500).send("Server error");
}
});

/* ==============================
   DASHBOARD
============================== */
app.get("/api/dashboard",auth,(req,res)=>{
  res.json({message:"🔥 Elite Member Access Granted"});
});

/* ==============================
   ADMIN PANEL
============================== */
app.get("/api/admin",auth,admin,(req,res)=>{
  res.json({message:"👑 Admin Panel Access"});
});

/* ==============================
   ALL USERS (ADMIN)
============================== */
app.get("/api/users",auth,admin,async(req,res)=>{
try{
  const users = await User.find().select("-password");
  res.json(users);
}catch{
  res.status(500).send("Server error");
}
});

/* ==============================
   FILE UPLOAD
============================== */
app.post("/api/upload",
 auth,
 upload.single("file"),
 (req,res)=>{
   res.json({
     message:"Upload success",
     file:req.file.filename,
     url:`/uploads/${req.file.filename}`
   });
});

/* ==============================
   TEST
============================== */
app.get("/api/test",(req,res)=>{
  res.json({message:"Server Working ✅"});
});

/* ==============================
   GLOBAL ERROR HANDLER
============================== */
app.use((err,req,res,next)=>{
  console.error(err);

  if(err instanceof multer.MulterError)
    return res.status(400).send(err.message);

  res.status(500).send(err.message || "Server error");
});

/* ==============================
   START SERVER
============================== */
const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
 console.log(`🚀 Server running on http://localhost:${PORT}`);
});