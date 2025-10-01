const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const incubatorController = require('../controllers/incubator');

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Incubator routes are working!',
    timestamp: new Date()
  });
});

// Protected routes - require incubator authentication  
router.use(authenticate);
router.use(authorize('incubator'));

// Dashboard & Profile
router.get('/dashboard', incubatorController.getDashboard);
router.get('/profile', incubatorController.getProfile);
router.put('/profile', incubatorController.updateProfile);

// Mentor Management
router.get('/mentors/pending', incubatorController.getPendingMentors);
router.put('/mentors/:mentorId/review', incubatorController.reviewMentor);

// Startup Application Management
router.get('/applications', incubatorController.getApplications);
router.put('/applications/:applicationId/review', incubatorController.reviewApplication);

// Analytics
router.get('/analytics/funnel', incubatorController.getFunnelAnalytics);

// Add these in the protected section

// Startup Application Management (Enhanced)
router.get('/applications', incubatorController.getApplications);
router.get('/applications/:status', incubatorController.getApplicationsByStatus);
router.put('/applications/:applicationId/review', incubatorController.reviewApplication);


module.exports = router;
