const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");


// REGISTER
router.post("/register", async (req,res)=>{
  const { username, email, password } = req.body;

  const hash = await bcrypt.hash(password,10);

  const user = new User({
    username,
    email,
    password: hash
  });

  await user.save();

  res.json({message:"User created"});
});


// LOGIN
router.post("/login", async (req,res)=>{
  const { email,password } = req.body;

  const user = await User.findOne({email});

  if(!user) return res.status(400).send("User not found");

  const match = await bcrypt.compare(password,user.password);

  if(!match) return res.status(400).send("Wrong password");

  res.json({
    message:"Login success",
    username:user.username
  });
});

module.exports = router;