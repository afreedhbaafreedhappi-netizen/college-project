const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected Successfully!');
        
        // Create a test collection
        const testSchema = new mongoose.Schema({ name: String, createdAt: Date });
        const Test = mongoose.model('Test', testSchema);
        
        await Test.create({ name: 'Test Entry', createdAt: new Date() });
        console.log('✅ Test data inserted successfully');
        
        const count = await Test.countDocuments();
        console.log(`📊 Total documents: ${count}`);
        
        await mongoose.disconnect();
        console.log('✅ Disconnected successfully');
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
    }
};

testConnection();