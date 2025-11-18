const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const app = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taagone';
if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
  console.warn('Warning: MONGODB_URI not set; using local fallback mongodb://127.0.0.1:27017/taagone');
}
console.log('Attempting MongoDB connection...');

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log(' MongoDB connected');
    app.listen(PORT, () => {
      console.log(` Server running on http://localhost:${PORT}`);
    }); 
  }) 
  .catch(err => {
    console.error(' MongoDB connection error:', err);
    process.exit(1);
  }); 