Startup Platform API
A comprehensive platform connecting startups, investors, incubators, and mentors with features for fundraising, mentorship, and business development.

🚀 Features
Multi-role Authentication with OTP verification

Startup Management - Pitch creation, fundraising tracking

Investor Dashboard - Startup discovery, soft commitments, intro requests

Incubator Platform - Application management, mentor approval, funnel analytics

Mentor System - Profile management and startup assignment

📋 Prerequisites
Node.js (v14 or higher)

MongoDB

Twilio account (for SMS OTP)

🛠️ Installation
bash
git clone <repository-url>
cd startup-platform
npm install
🔧 Environment Setup
Create .env file:

text
PORT=5000
MONGODB_URI=mongodb://localhost:27017/startup-platform
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development

# OTP Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
OTP_EXPIRY_MINUTES=10
🚀 Running the Application
bash
npm run dev
Server runs on http://localhost:5000

📚 API Documentation
🔐 Authentication Routes
Send OTP for Registration
POST /api/auth/send-otp

json
{
  "phone": "+919876543210"
}
Response:

json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "phone": "+919876543210",
    "expiresIn": "10 minutes"
  }
}
Register User with OTP
POST /api/auth/register

json
{
  "username": "johndoe",
  "password": "password123",
  "phone": "+919876543210",
  "userType": "startup",
  "otp": "123456"
}
Response:

json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "username": "johndoe",
      "userType": "startup",
      "isPhoneVerified": true
    },
    "token": "jwt_token_here"
  }
}
Login
POST /api/auth/login

json
{
  "username": "johndoe",
  "password": "password123"
}
Resend OTP
POST /api/auth/resend-otp

json
{
  "phone": "+919876543210",
  "purpose": "registration"
}
Get User Profile
GET /api/auth/profile
Headers: Authorization: Bearer {token}

Update Profile
PUT /api/auth/profile
Headers: Authorization: Bearer {token}

json
{
  "phone": "+919876543211"
}
🏢 Startup Routes
All routes require Authentication with startup role

Update Investor Pitch
PUT /api/startup/pitch

json
{
  "videoUrl": "https://youtube.com/watch?v=abc123",
  "writtenPitch": "AI-powered healthcare platform revolutionizing diagnosis",
  "companyName": "HealthAI Solutions",
  "website": "https://healthai.com",
  "oneLineDescription": "AI-powered medical diagnosis platform",
  "fundingAmount": 20000000,
  "timeline": "3-6 months",
  "useOfFunds": "R&D 40%, Team expansion 35%, Marketing 15%",
  "monthlyRevenue": 800000,
  "growthRate": "30% Month-over-month",
  "customerCount": 200,
  "teamSize": 15,
  "marketSize": "Indian healthcare AI market worth ₹8000 Cr",
  "keyTractionPoints": "200+ hospitals, 1M+ patient scans"
}
Get Investor Pitch
GET /api/startup/pitch

Get Dashboard
GET /api/startup/dashboard

Add Funding Entry
POST /api/startup/fundraising

json
{
  "investorName": "Angel Investor ABC",
  "amount": 2500000,
  "equity": 10,
  "roundType": "seed",
  "investmentDate": "2025-09-15",
  "status": "received",
  "notes": "Great mentor and advisor"
}
Get Fundraising Details
GET /api/startup/fundraising

Get Available Incubators
GET /api/startup/incubators

Apply to Incubator
POST /api/startup/incubators/{incubatorId}/apply

json
{
  "whyJoinProgram": "We want to accelerate growth and get expert mentorship",
  "expectedOutcomes": "Product refinement, go-to-market strategy, investor connections",
  "currentChallenges": "Scaling customer acquisition and preparing for Series A",
  "fundingNeeds": 20000000,
  "timeCommitment": "Full-time commitment for 6-month program"
}
Get My Applications
GET /api/startup/applications

Get Intro Requests
GET /api/startup/intro-requests

Respond to Intro Request
PUT /api/startup/intro-requests/{requestId}

json
{
  "status": "approved",
  "meetingDate": "2025-10-05",
  "responseNotes": "Looking forward to discussing our solution!"
}
Get Soft Commitments
GET /api/startup/soft-commitments

Respond to Soft Commitment
PUT /api/startup/soft-commitments/{commitmentId}

json
{
  "action": "accept",
  "responseNotes": "Excited to have you as an investor!"
}
💰 Investor Routes
All routes require Authentication with investor role

Update Investor Profile
PUT /api/investor/profile

json
{
  "investorName": "Angel Investor ABC",
  "investorType": "angel",
  "investmentPreferences": {
    "industries": ["Technology", "Healthcare"],
    "stages": ["mvp", "early-revenue"],
    "minInvestment": 1000000,
    "maxInvestment": 20000000,
    "geography": ["Mumbai", "Bangalore"],
    "riskProfile": "moderate"
  },
  "investmentCapacity": {
    "totalFundsAvailable": 50000000,
    "availableFunds": 50000000,
    "avgTicketSize": 5000000
  }
}
Get Investor Dashboard
GET /api/investor/dashboard

Get Startup Details
GET /api/investor/startups/{startupId}

Request Introduction
POST /api/investor/startups/{startupId}/intro-request

json
{
  "notes": "Interested in learning more about your AI healthcare solution."
}
Make Soft Commitment
POST /api/investor/startups/{startupId}/soft-commit

json
{
  "amount": 5000000,
  "equityExpected": 8,
  "conditions": "Subject to due diligence and board seat",
  "expiryDays": 45
}
🏫 Incubator Routes
All routes require Authentication with incubator role

Update Incubator Profile
PUT /api/incubator/profile

json
{
  "incubatorName": "TechStart Incubator",
  "description": "Leading tech startup incubator",
  "website": "https://techstart.in",
  "location": "Bangalore, India",
  "foundedYear": 2020,
  "programDetails": {
    "duration": "6 months",
    "batchSize": 15,
    "equityTaken": 8,
    "investmentAmount": 2500000,
    "industries": ["Technology", "Healthcare"],
    "stages": ["idea", "mvp"]
  }
}
Get Incubator Dashboard
GET /api/incubator/dashboard

Get Pending Mentors
GET /api/incubator/mentors/pending

Review Mentor Application
PUT /api/incubator/mentors/{mentorId}/review

json
{
  "action": "approve",
  "reviewNotes": "Excellent background in FinTech. Approved for product strategy mentoring."
}
Get Applications
GET /api/incubator/applications

Get Applications by Status
GET /api/incubator/applications/{status}
Status: applied, viewed, closed-deal, rejected

Review Startup Application
PUT /api/incubator/applications/{applicationId}/review

json
{
  "action": "accept",
  "reviewNotes": "Great startup! Accepted into our program."
}
Get Funnel Analytics
GET /api/incubator/analytics/funnel

👨‍🏫 Mentor Routes
All routes require Authentication with mentor role

Apply as Mentor
POST /api/mentor/apply

json
{
  "mentorName": "Rajesh Kumar",
  "expertise": ["FinTech", "Product Strategy"],
  "experience": "15 years",
  "previousCompanies": ["Paytm", "Razorpay"],
  "linkedinUrl": "https://linkedin.com/in/rajeshkumar"
}
Get Mentor Dashboard
GET /api/mentor/dashboard

Get Mentor Profile
GET /api/mentor/profile

📊 Response Format
All API responses follow this structure:

Success Response:

json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ },
  "timestamp": "2025-09-29T18:00:00.000Z"
}
Error Response:

json
{
  "success": false,
  "message": "Error description",
  "timestamp": "2025-09-29T18:00:00.000Z"
}