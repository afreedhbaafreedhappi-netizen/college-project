const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const MONGODB_URI = 'mongodb+srv://afreedhbaafreedhappi_db_user:Afreedh123@cluster0.zf3gpng.mongodb.net/classroom_monitoring?retryWrites=true&w=majority';

async function testConnection() {
    try {
        console.log('📡 Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected successfully!');
        
        // Test creating a collection
        const testSchema = new mongoose.Schema({ name: String, test: Boolean });
        const Test = mongoose.model('Test', testSchema);
        await Test.create({ name: 'Test Entry', test: true });
        console.log('✅ Test data inserted');
        
        const count = await Test.countDocuments();
        console.log(`📊 Total test documents: ${count}`);
        
        await mongoose.disconnect();
        console.log('✅ Connection test successful!');
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
    }
}

testConnection();