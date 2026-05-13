const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Import routes
const authRoutes = require('./routes/authRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 Created uploads directory');
}

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);

// Debug: Check if .env loaded
console.log('========================================');
console.log('🔍 Environment Variables Check:');
console.log('PORT:', process.env.PORT || '❌ Not set');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Loaded' : '❌ Not loaded');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Loaded' : '❌ Not loaded');
console.log('========================================');

// Get MongoDB URI from .env
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env file!');
    process.exit(1);
}

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log('✅ MongoDB Atlas Connected Successfully!');
    console.log(`📀 Database: ${mongoose.connection.name}`);
    console.log(`🌍 Host: ${mongoose.connection.host}`);
})
.catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check your internet connection');
    console.log('2. Verify MongoDB Atlas IP whitelist (add 0.0.0.0/0)');
    console.log('3. Check your .env file format');
});

// Handle connection events
mongoose.connection.on('error', err => {
    console.log('❌ MongoDB error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
});

// Default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date()
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend available at http://localhost:${PORT}`);
    console.log(`🔍 Health check: http://localhost:${PORT}/api/health\n`);
});