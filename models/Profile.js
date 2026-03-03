const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    unique: true,
    required: true
  },
  bio: {
    type: String,
    default: ""
  },
  links: [
    {
      title: {
        type: String,
        required: true
      },
      url: {
        type: String,
        required: true
      }
    }
  ]
});

module.exports = mongoose.model("Profile", ProfileSchema);