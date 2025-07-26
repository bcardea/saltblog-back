const express = require('express');
const router = express.Router();
const blogService = require('../services/blogService');

router.post('/generate', async (req, res) => {
  try {
    const { title, primaryKeywords, angle, cta } = req.body;
    
    if (!title || !primaryKeywords || !angle || !cta) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const socketId = req.headers['x-socket-id'];
    
    const result = await blogService.generateBlog({
      title,
      primaryKeywords,
      angle,
      cta
    }, socketId, req.io);

    res.json(result);
  } catch (error) {
    console.error('Blog generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/update', async (req, res) => {
  try {
    const { id, field, value } = req.body;
    
    if (!id || !field || value === undefined) {
      return res.status(400).json({ error: 'ID, field, and value are required' });
    }

    const result = await blogService.updateBlogField(id, field, value);
    res.json(result);
  } catch (error) {
    console.error('Blog update error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/regenerate-image', async (req, res) => {
  try {
    const { id, imageField, prompt } = req.body;
    
    if (!id || !imageField || !prompt) {
      return res.status(400).json({ error: 'ID, imageField, and prompt are required' });
    }

    const result = await blogService.regenerateImage(id, imageField, prompt);
    res.json(result);
  } catch (error) {
    console.error('Image regeneration error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;