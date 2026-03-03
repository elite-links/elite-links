const express = require("express");
const router = express.Router();
const Profile = require("../models/Profile");

router.post("/profile", async(req,res)=>{
  const profile = new Profile(req.body);
  await profile.save();
  res.json({message:"Profile saved"});
});

router.get("/:username", async(req,res)=>{
  const profile = await Profile.findOne({
    username:req.params.username
  });

  res.json(profile);
});

module.exports = router;