// models/Link.js
const mongoose = require('mongoose');

// Define the Link schema
const linkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId, // reference to the User
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Export the Link model
module.exports = mongoose.model('Link', linkSchema);