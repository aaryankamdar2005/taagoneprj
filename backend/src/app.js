const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Import routes
const authRoutes = require('./routes/auth');
const startupRoutes = require('./routes/startup');
const investorRoutes = require('./routes/investor'); 
const incubatorRoutes = require('./routes/incubator');
const mentorRoutes = require('./routes/mentor');
const chatRoutes = require('./routes/chat');

const app = express();
// Request logging middleware
app.use(morgan('dev'));



// CORS Configuration 
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3001',
  'https://taagoneprj.vercel.app', // Your Vercel URL
  process.env.FRONTEND_URL,
  process.env.PROD_FRONTEND_URL
].filter(Boolean); // Remove undefined values

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply CORS middleware - this handles OPTIONS automatically
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/startup', startupRoutes);
app.use('/api/investor', investorRoutes);
app.use('/api/incubator', incubatorRoutes);
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
      incubator: '/api/incubator',
      mentor: '/api/mentor',
      chat: '/api/chat'
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
