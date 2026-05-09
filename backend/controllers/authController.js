const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

// Register Student
exports.registerStudent = async (req, res) => {
    try {
        const { name, rollNumber, department, email, password } = req.body;
        
        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        
        // Get voice sample path
        let voiceSamplePath = '';
        if (req.file) {
            voiceSamplePath = req.file.path;
        } else {
            return res.status(400).json({ success: false, message: 'Voice sample is required' });
        }
        
        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role: 'student',
            rollNumber,
            department,
            voiceSamplePath: voiceSamplePath
        });
        
        res.status(201).json({
            success: true,
            token: generateToken(user._id),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// Register Lecturer
exports.registerLecturer = async (req, res) => {
    try {
        const { name, employeeId, email, password } = req.body;
        
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        
        const user = await User.create({
            name,
            email,
            password,
            role: 'lecturer',
            employeeId
        });
        
        res.status(201).json({
            success: true,
            token: generateToken(user._id),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        
        const user = await User.findOne({ email }).select('+password');
        
        if (!user || !(await user.matchPassword(password)) || user.role !== role) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        res.json({
            success: true,
            token: generateToken(user._id),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get Current User
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};