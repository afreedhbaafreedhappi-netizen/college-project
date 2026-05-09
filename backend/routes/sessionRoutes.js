const express = require('express');
const { createSession, endSession, addDisturbance, getReport, getActiveSession } = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All session routes require authentication

router.post('/create', createSession);
router.put('/:id/end', endSession);
router.post('/:id/disturbance', addDisturbance);
router.get('/:id/report', getReport);
router.get('/active/current', getActiveSession);

module.exports = router;