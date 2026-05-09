const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config();

const authRoutes = require('./routes/authRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);

// Debug
console.log('========================================');
console.log('📁 Current Directory:', __dirname);
console.log('========================================');
console.log('🔍 Environment Variables Check:');
console.log('PORT:', process.env.PORT || '❌ Not set');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Loaded' : '❌ Not loaded');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Loaded' : '❌ Not loaded');
console.log('========================================');

if (!process.env.MONGODB_URI) {
    console.error('\n❌ ERROR: MONGODB_URI not found in .env file!');
    process.exit(1);
}

// MongoDB Connection with better options
const connectDB = async () => {
    try {
        console.log('📡 Connecting to MongoDB Atlas...');
        
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
            socketTimeoutMS: 45000,
            family: 4, // Use IPv4, skip trying IPv6
        };
        
        await mongoose.connect(process.env.MONGODB_URI, options);
        
        console.log('✅ MongoDB Atlas Connected Successfully!');
        console.log(`📀 Host: ${mongoose.connection.host}`);
        console.log(`📀 Database: ${mongoose.connection.name}`);
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        console.log('\n💡 Troubleshooting Tips:');
        console.log('1. Go to MongoDB Atlas → Network Access → Add IP Address 0.0.0.0/0');
        console.log('2. Check your internet connection');
        console.log('3. Try using: mongodb:// (instead of mongodb+srv://)');
        console.log('4. Run: ipconfig /flushdns');
        console.log('5. Restart your router');
        console.log('\n⚠️ Server will continue without database...');
    }
};

// Connect to database
connectDB();

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('📀 MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
    console.log('❌ MongoDB error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
});

// Default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend available at http://localhost:${PORT}\n`);
});