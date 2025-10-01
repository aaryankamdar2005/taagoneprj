const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const mentorController = require('../controllers/mentor');

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Mentor routes are working!',
    timestamp: new Date()
  });
});

// Public application route
router.post('/apply', authenticate, mentorController.applyAsMentor);

// Protected routes
router.use(authenticate);
router.use(authorize('mentor'));

router.get('/dashboard', mentorController.getDashboard);
router.get('/profile', mentorController.getProfile);

module.exports = router;
