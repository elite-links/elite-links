// routes/links.js
const express = require('express');
const router = express.Router();
const Link = require('../models/Link');
const authMiddleware = require('../middleware/authMiddleware');

// Add a new link
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { title, url } = req.body;
    if (!title || !url) return res.status(400).send('Title and URL required');

    const newLink = new Link({
      title,
      url,
      user: req.session.user
    });

    await newLink.save();
    res.status(200).send('Link added successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Get all links for logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const links = await Link.find({ user: req.session.user }).sort({ createdAt: -1 });
    res.json(links);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;