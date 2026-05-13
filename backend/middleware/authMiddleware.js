const jwt = require('jsonwebtoken');
const path = require('path');
const User = require('../models/User');

// Load dotenv with path
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const protect = async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'my_jwt_secret_key_2024');
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }
    
    if (!token) {
        res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

module.exports = { protect };