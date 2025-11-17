const express = require('express');
const router = express.Router();
const activationController = require('../controllers/startupActivation');

// Public routes - no authentication needed
router.get('/activate/verify/:token', activationController.verifyActivationToken);
router.post('/activate', activationController.activateStartup);
router.post('/activate/resend', activationController.resendActivation);

module.exports = router;
