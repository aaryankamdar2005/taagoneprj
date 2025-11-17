const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const startupController = require('../controllers/startup');
const activationController = require('../controllers/startupActivation');
// All routes require authentication and startup role
router.use(authenticate);
router.use(authorize('startup'));

// Dashboard
router.get('/dashboard', startupController.getDashboard);

// Investor Pitch
router.get('/pitch', startupController.getInvestorPitch);
router.put('/pitch', startupController.updateInvestorPitch);

// Tasks
router.post('/tasks', startupController.addTask);
router.put('/tasks/:taskId', startupController.updateTask);

router.get('/intro-requests', startupController.getIntroRequests);
router.put('/intro-requests/:requestId', startupController.respondToIntroRequest);

router.get('/soft-commitments', startupController.getSoftCommitments);
router.put('/soft-commitments/:commitmentId', startupController.respondToSoftCommitment);

router.get('/incubators', startupController.getAvailableIncubators);
router.post('/incubators/:incubatorId/apply', startupController.applyToIncubator);
router.get('/applications', startupController.getMyApplications);

router.get('/activate/verify/:token', activationController.verifyActivationToken);
router.post('/activate', activationController.activateStartup);
router.post('/activate/resend', activationController.resendActivation);
module.exports = router;
