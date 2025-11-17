const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const incubatorController = require('../controllers/incubator');
const bulkUpload = require('../controllers/incubatorBulkUpload'); // ✅ ADD THIS LINE
const bulkUploadExcel = require('../controllers/incubatorBulkUploadExcel');
const activationController = require('../controllers/startupActivation');
// Test route
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Incubator routes are working!',
    timestamp: new Date()
  });
});

// Protected routes
router.use(authenticate);
router.use(authorize('incubator'));

router.get('/dashboard', incubatorController.getDashboard);
router.get('/profile', incubatorController.getProfile);
router.put('/profile', incubatorController.updateProfile);
router.get('/mentors/pending', incubatorController.getPendingMentors);
router.put('/mentors/:mentorId/review', incubatorController.reviewMentor);
router.get('/applications', incubatorController.getApplications);
router.put('/applications/:applicationId/review', incubatorController.reviewApplication);
router.get('/analytics/funnel', incubatorController.getFunnelAnalytics);

// ✅ Bulk Upload Routes - ADD THESE
router.post('/bulk-upload/parse-pdf', 
  bulkUpload.upload.single('pdfFile'), 
  bulkUpload.uploadStartupsPDF
);

router.post('/bulk-upload/import', 
  bulkUpload.bulkImportStartups
);

router.get('/bulk-upload/history', 
  bulkUpload.getImportHistory
);
router.post('/bulk-upload/parse-excel', 
  authenticate, 
  authorize('incubator'), 
  bulkUploadExcel.upload.single('excelFile'), 
  bulkUploadExcel.uploadStartupsExcel
);

router.post('/bulk-upload/import-excel', 
  authenticate, 
  authorize('incubator'), 
  bulkUploadExcel.bulkImportStartups
);
router.get('/startup-credentials', 
  authenticate, 
  authorize('incubator'), 
  activationController.getStartupCredentials
);

module.exports = router;
