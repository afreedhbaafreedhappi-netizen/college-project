const path = require('path');
const dotenv = require('dotenv');

// Try different paths
console.log('Testing .env file loading...\n');

// Method 1: Current directory
dotenv.config();
console.log('Method 1 (current dir):', process.env.MONGODB_URI ? '✅ Found' : '❌ Not found');

// Method 2: Explicit path to root
dotenv.config({ path: path.join(__dirname, '.env') });
console.log('Method 2 (root path):', process.env.MONGODB_URI ? '✅ Found' : '❌ Not found');

// Method 3: Check if file exists
const fs = require('fs');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    console.log('✅ .env file exists at:', envPath);
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('File content preview:', content.substring(0, 100) + '...');
} else {
    console.log('❌ .env file NOT found at:', envPath);
    console.log('Please create .env file in:', __dirname);
}