const express = require('express');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth');
const startupRoutes = require('./routes/startup');
const investorRoutes = require('./routes/investor'); 
const incubatorRoutes = require('./routes/incubator');// Add this
const mentorRoutes = require('./routes/mentor');
const chatRoutes = require('./routes/chat');
const app = express();

// Basic middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3001'], // Add your frontend URLs
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/startup', startupRoutes);
app.use('/api/investor', investorRoutes);
app.use('/api/incubator', incubatorRoutes); // Add this
app.use('/api/mentor', mentorRoutes); 
app.use('/api/chat', chatRoutes);
// Basic routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Startup Platform API is working!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      startup: '/api/startup',
      investor: '/api/investor',
      incubator: '/api/incubator' // Add this
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Simple 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

module.exports = app;