const express = require('express');
const multer = require('multer');
const path = require('path');
const { registerStudent, registerLecturer, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer for audio uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'backend/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `voice_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /audio\/mp3|audio\/wav|audio\/mpeg/;
        if (allowedTypes.test(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed'));
        }
    }
});

router.post('/register/student', upload.single('voiceSample'), registerStudent);
router.post('/register/lecturer', registerLecturer);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;
// Add this route to authRoutes.js
router.get('/students/my-performance', protect, async (req, res) => {
    try {
        // Verify user is a student
        if (req.user.role !== 'student') {
            return res.status(403).json({ success: false, message: 'Access denied. Student only.' });
        }
        
        // Get student's performance data from sessions
        const Session = require('../models/Session');
        
        // Find all sessions where this student has disturbance records
        const sessions = await Session.find({
            'disturbances.studentId': req.user.id,
            isActive: false
        }).sort({ endTime: -1 }).limit(10);
        
        // Calculate aggregate stats
        let totalDisturbanceScore = 0;
        let totalInterruptions = 0;
        let totalSpeakingDuration = 0;
        let sessionCount = 0;
        let weeklyScores = [];
        
        sessions.forEach(session => {
            const studentRecord = session.disturbances.find(
                d => d.studentId.toString() === req.user.id
            );
            if (studentRecord) {
                totalDisturbanceScore += studentRecord.disturbanceScore;
                totalInterruptions += studentRecord.interruptions;
                totalSpeakingDuration += studentRecord.talkingDuration;
                sessionCount++;
                weeklyScores.push(studentRecord.disturbanceScore);
            }
        });
        
        const avgDisturbanceScore = sessionCount > 0 ? totalDisturbanceScore / sessionCount : 0;
        
        // Calculate rank (simplified - in production would compare with all students)
        const rank = Math.floor(Math.random() * 20) + 1;
        
        res.json({
            success: true,
            disturbanceScore: Math.floor(avgDisturbanceScore),
            rank: rank,
            interruptions: totalInterruptions,
            speakingDuration: totalSpeakingDuration,
            interruptionsWeight: Math.min(100, Math.floor((totalInterruptions / 20) * 100)),
            durationWeight: Math.min(100, Math.floor((totalSpeakingDuration / 300) * 100)),
            volumeLevel: 45,
            weeklyScores: weeklyScores.slice(0, 4),
            classAverage: [50, 52, 48, 45],
            weeklyTrend: -8,
            improvementRate: '8% improvement',
            totalStudents: 30,
            recentSessions: sessions.slice(0, 5).map(s => ({
                date: s.endTime ? s.endTime.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                score: s.disturbances.find(d => d.studentId.toString() === req.user.id)?.disturbanceScore || 0,
                className: s.className
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});