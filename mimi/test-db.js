require('dotenv').config();
const { connectDatabase } = require('./src/database/connection');

console.log('Testing connection with resolved URI from .env...');

connectDatabase()
    .then(() => {
        console.log('✅ Connection Test Successful!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ Connection Test Failed:', err);
        process.exit(1);
    });
