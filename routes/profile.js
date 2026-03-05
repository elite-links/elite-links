const express = require("express");
const router = express.Router();

const Profile = require("../models/Profile");

/* CREATE PROFILE */

router.post("/profile", async (req,res)=>{

try{

const profile = new Profile(req.body);

await profile.save();

res.json({message:"Profile saved"});

}catch(err){
res.status(500).json({message:"Server error"});
}

});


/* GET PROFILE */

router.get("/profile/:username", async(req,res)=>{

try{

const profile = await Profile.findOne({
username:req.params.username
});

if(!profile){
return res.status(404).json({message:"Not found"});
}

res.json(profile);

}catch(err){
res.status(500).json({message:"Server error"});
}

});

module.exports = router;