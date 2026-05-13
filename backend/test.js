console.log('Testing imports...');

try {
    const path = require('path');
    console.log('✅ path module loaded');
    
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
    console.log('✅ dotenv loaded');
    
    console.log('PORT:', process.env.PORT);
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Loaded' : '❌ Not loaded');
    
} catch (error) {
    console.error('Error:', error.message);
}