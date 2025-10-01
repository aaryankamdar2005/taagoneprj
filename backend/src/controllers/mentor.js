const Mentor = require('../models/Mentor');
const { success, error } = require('../utils/response');

// Apply as Mentor (Simple)
const applyAsMentor = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      mentorName,
      expertise,
      experience,
      previousCompanies,
      linkedinUrl
    } = req.body;

    // Check if mentor already exists
    let mentor = await Mentor.findOne({ userId });
    if (mentor) {
      return error(res, 'Mentor application already exists', 400);
    }

    // Create new mentor application
    mentor = new Mentor({
      userId,
      mentorName: mentorName || req.user.username,
      expertise: expertise || [],
      experience: experience || '',
      previousCompanies: previousCompanies || [],
      linkedinUrl
    });

    await mentor.save();

    success(res, 'Mentor application submitted successfully', {
      mentorId: mentor._id,
      status: mentor.status,
      message: 'Your application is under review'
    });
  } catch (err) {
    error(res, err.message, 400);
  }
};

// Get Mentor Profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const mentor = await Mentor.findOne({ userId });

    if (!mentor) {
      return error(res, 'Mentor profile not found', 404);
    }

    success(res, 'Mentor profile retrieved successfully', mentor);
  } catch (err) {
    error(res, err.message, 500);
  }
};

// Simple Dashboard
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const mentor = await Mentor.findOne({ userId });
    
    if (!mentor) {
      return error(res, 'Mentor profile not found. Please apply first.', 404);
    }

    const dashboardData = {
      mentorInfo: {
        mentorName: mentor.mentorName,
        expertise: mentor.expertise,
        experience: mentor.experience,
        previousCompanies: mentor.previousCompanies,
        linkedinUrl: mentor.linkedinUrl
      },
      applicationStatus: {
        status: mentor.status,
        appliedDate: mentor.createdAt,
        reviewedAt: mentor.reviewedAt,
        reviewNotes: mentor.reviewNotes
      }
    };

    success(res, 'Mentor dashboard retrieved successfully', dashboardData);
  } catch (err) {
    error(res, err.message, 500);
  }
};

module.exports = {
  applyAsMentor,
  getProfile,
  getDashboard
};
