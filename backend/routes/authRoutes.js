const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { registerStudent, registerLecturer, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for audio uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'voice-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /audio\/mp3|audio\/wav|audio\/mpeg|audio\/webm|audio\/ogg/;
    if (allowedTypes.test(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only audio files are allowed (MP3, WAV, WEBM)'));
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter
});

// Routes
router.post('/register/student', upload.single('voiceSample'), registerStudent);
router.post('/register/lecturer', registerLecturer);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;