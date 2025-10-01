// dropPhoneIndex.js
const mongoose = require('mongoose');
require('dotenv').config();

async function dropPhoneIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Drop the old phone index
    await mongoose.connection.db.collection('users').dropIndex('phone_1');
    console.log('Successfully dropped phone index');
    
    // List remaining indexes
    const indexes = await mongoose.connection.db.collection('users').indexes();
    console.log('Remaining indexes:', indexes);
    
  } catch (error) {
    if (error.code === 27) {
      console.log('Phone index does not exist - already cleaned up');
    } else {
      console.error('Error dropping index:', error);
    }
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed');
  }
}

dropPhoneIndex();
