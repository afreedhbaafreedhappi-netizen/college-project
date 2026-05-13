const path = require('path');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Load dotenv
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'my_jwt_secret_key_2024', {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

// Register Student
exports.registerStudent = async (req, res) => {
    try {
        console.log('📝 Student registration request received');
        
        const { name, rollNumber, department, email, password } = req.body;
        
        // Validate required fields
        if (!name || !rollNumber || !department || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }
        
        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists with this email' 
            });
        }
        
        // Get voice sample path
        let voiceSamplePath = '';
        if (req.file) {
            voiceSamplePath = req.file.path;
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
        
        console.log('✅ Student registered successfully:', user.email);
        
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
        console.error('❌ Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error', 
            error: error.message 
        });
    }
};

// Register Lecturer
exports.registerLecturer = async (req, res) => {
    try {
        console.log('📝 Lecturer registration request received');
        
        const { name, employeeId, email, password } = req.body;
        
        if (!name || !employeeId || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }
        
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists with this email' 
            });
        }
        
        const user = await User.create({
            name,
            email,
            password,
            role: 'lecturer',
            employeeId
        });
        
        console.log('✅ Lecturer registered successfully:', user.email);
        
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
        console.error('❌ Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error', 
            error: error.message 
        });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        console.log('🔐 Login request received:', req.body.email);
        
        const { email, password, role } = req.body;
        
        if (!email || !password || !role) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email, password and role are required' 
            });
        }
        
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            console.log('❌ User not found:', email);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
        
        const isPasswordMatch = await user.matchPassword(password);
        
        if (!isPasswordMatch) {
            console.log('❌ Password mismatch for:', email);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
        
        if (user.role !== role) {
            console.log('❌ Role mismatch. Expected:', role, 'Got:', user.role);
            return res.status(401).json({ 
                success: false, 
                message: `Invalid credentials for ${role} account` 
            });
        }
        
        console.log('✅ Login successful for:', email);
        
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
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error' 
        });
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