const multer = require('multer');
const pdfParse = require('pdf-parse');
const Startup = require('../models/Startup');
const Incubator = require('../models/Incubator');
const User = require('../models/User');
const { success, error } = require('../utils/response');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Parse startup data from PDF text
const parseStartupData = (text) => {
  const startups = [];
  
  // Split by startup entries
  const entries = text.split(/(?=Company:|Startup:|Name:)/gi);
  
  entries.forEach(entry => {
    if (entry.trim().length < 20) return;
    
    const startup = {};
    
    // Extract company name
    const nameMatch = entry.match(/(?:Company|Startup|Name):\s*([^\n]+)/i);
    if (nameMatch) startup.companyName = nameMatch[1].trim();
    
    // Extract industry
    const industryMatch = entry.match(/Industry:\s*([^\n]+)/i);
    if (industryMatch) startup.industry = industryMatch[1].trim();
    
    // Extract stage
    const stageMatch = entry.match(/Stage:\s*([^\n]+)/i);
    if (stageMatch) {
      const stage = stageMatch[1].trim().toLowerCase();
      // Map to valid enum values
      if (['idea', 'mvp', 'early-revenue', 'growth', 'scale'].includes(stage)) {
        startup.stage = stage;
      }
    }
    
    // Extract funding amount
    const fundingMatch = entry.match(/(?:Funding|Investment|Amount):\s*(?:₹|Rs\.?|INR)?\s*([\d,]+)/i);
    if (fundingMatch) {
      startup.fundingAmount = parseInt(fundingMatch[1].replace(/,/g, ''));
    }
    
    // Extract description
    const descMatch = entry.match(/(?:Description|About):\s*([^\n]{20,200})/i);
    if (descMatch) startup.description = descMatch[1].trim();
    
    // Extract website
    const websiteMatch = entry.match(/(?:Website|URL):\s*(https?:\/\/[^\s]+)/i);
    if (websiteMatch) startup.website = websiteMatch[1].trim();
    
    // Extract email
    const emailMatch = entry.match(/Email:\s*([^\s]+@[^\s]+)/i);
    if (emailMatch) startup.email = emailMatch[1].trim();
    
    // Extract phone
    const phoneMatch = entry.match(/(?:Phone|Mobile|Contact):\s*(\+?\d[\d\s-]{8,15})/i);
    if (phoneMatch) startup.phone = phoneMatch[1].replace(/\s|-/g, '').trim();
    
    // Extract founders
    const founderMatch = entry.match(/Founders?:\s*([^\n]+)/i);
    if (founderMatch) startup.founders = founderMatch[1].trim();
    
    // Extract location
    const locationMatch = entry.match(/Location:\s*([^\n]+)/i);
    if (locationMatch) startup.location = locationMatch[1].trim();
    
    // Only add if we have at least a company name
    if (startup.companyName && startup.companyName.length > 2) {
      startups.push(startup);
    }
  });
  
  return startups;
};

// Upload and parse PDF
const uploadStartupsPDF = async (req, res) => {
  try {
    if (!req.file) {
      return error(res, 'No PDF file uploaded', 400);
    }
    
    const userId = req.user.id;
    const incubator = await Incubator.findOne({ userId });
    
    if (!incubator) {
      return error(res, 'Incubator profile not found', 404);
    }
    
    console.log('Processing PDF:', req.file.originalname);
    
    // Parse PDF
    const pdfData = await pdfParse(req.file.buffer);
    const text = pdfData.text;
    
    console.log('PDF Text Length:', text.length);
    
    // Extract startup data
    const extractedStartups = parseStartupData(text);
    
    console.log('Extracted Startups:', extractedStartups.length);
    
    if (extractedStartups.length === 0) {
      return error(res, 'No startup data found in PDF. Please check the format.', 400);
    }
    
    success(res, 'PDF parsed successfully', {
      totalExtracted: extractedStartups.length,
      startups: extractedStartups,
      rawTextPreview: text.substring(0, 500)
    });
    
  } catch (err) {
    console.error('PDF Upload Error:', err);
    error(res, err.message || 'Failed to process PDF', 500);
  }
};

// Bulk import startups to database
const bulkImportStartups = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startups } = req.body;
    
    if (!startups || !Array.isArray(startups) || startups.length === 0) {
      return error(res, 'No startup data provided', 400);
    }
    
    const incubator = await Incubator.findOne({ userId });
    
    if (!incubator) {
      return error(res, 'Incubator profile not found', 404);
    }
    
    const results = {
      success: [],
      failed: [],
      updated: [],
      skipped: []
    };
    
    for (const startupData of startups) {
      try {
        if (!startupData.companyName) {
          results.skipped.push({ data: startupData, reason: 'Missing company name' });
          continue;
        }
        
        // Check if startup already exists
        let existingStartup = await Startup.findOne({
          companyName: { $regex: new RegExp(`^${startupData.companyName}$`, 'i') }
        });
        
        if (existingStartup) {
          // Update existing startup
          if (startupData.industry) existingStartup.industry = startupData.industry;
          if (startupData.stage) existingStartup.stage = startupData.stage;
          if (startupData.website) existingStartup.website = startupData.website;
          if (startupData.description) existingStartup.oneLineDescription = startupData.description;
          if (startupData.email) existingStartup.email = startupData.email;
          if (startupData.phone) existingStartup.phone = startupData.phone;
          if (startupData.founders) existingStartup.founders = startupData.founders;
          if (startupData.location) existingStartup.location = startupData.location;
          
          if (startupData.fundingAmount) {
            existingStartup.fundingAsk = existingStartup.fundingAsk || {};
            existingStartup.fundingAsk.amount = startupData.fundingAmount;
          }
          
          // Mark as verified by incubator
          if (!existingStartup.verifiedBy) {
            existingStartup.verifiedBy = [];
          }
          if (!existingStartup.verifiedBy.includes(incubator._id)) {
            existingStartup.verifiedBy.push(incubator._id);
          }
          
          await existingStartup.save();
          results.updated.push(existingStartup.companyName);
          
        } else {
          // Generate phone if not provided
          const phoneNumber = startupData.phone 
            ? startupData.phone.replace(/\D/g, '').slice(-10)
            : `9${Math.floor(100000000 + Math.random() * 900000000)}`;
          
          // Create new user account for startup
          const randomPassword = Math.random().toString(36).slice(-8);
          
          const newUser = new User({
            phoneNumber: phoneNumber,
            password: randomPassword,
            userType: 'startup'
          });
          
          await newUser.save();
          
          // Create new startup profile
          const newStartup = new Startup({
            userId: newUser._id,
            companyName: startupData.companyName,
            industry: startupData.industry || 'Not specified',
            stage: startupData.stage || 'idea',
            oneLineDescription: startupData.description || '',
            website: startupData.website || '',
            email: startupData.email || '',
            phone: startupData.phone || '',
            founders: startupData.founders || '',
            location: startupData.location || '',
            fundingAsk: {
              amount: startupData.fundingAmount || 0
            },
            verifiedBy: [incubator._id],
            importedBy: incubator._id,
            importedAt: new Date()
          });
          
          await newStartup.save();
          results.success.push(newStartup.companyName);
        }
        
      } catch (err) {
        console.error('Error importing startup:', startupData.companyName, err.message);
        results.failed.push({
          companyName: startupData.companyName,
          reason: err.message
        });
      }
    }
    
    success(res, 'Bulk import completed', {
      total: startups.length,
      imported: results.success.length,
      updated: results.updated.length,
      failed: results.failed.length,
      skipped: results.skipped.length,
      details: results
    });
    
  } catch (err) {
    console.error('Bulk Import Error:', err);
    error(res, err.message || 'Bulk import failed', 500);
  }
};

// Get import history
const getImportHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const incubator = await Incubator.findOne({ userId });
    
    if (!incubator) {
      return error(res, 'Incubator profile not found', 404);
    }
    
    const importedStartups = await Startup.find({
      importedBy: incubator._id
    }).select('companyName industry stage importedAt verifiedBy').sort({ importedAt: -1 });
    
    success(res, 'Import history retrieved', {
      total: importedStartups.length,
      startups: importedStartups
    });
    
  } catch (err) {
    error(res, err.message, 500);
  }
};

module.exports = {
  upload,
  uploadStartupsPDF,
  bulkImportStartups,
  getImportHistory
};
