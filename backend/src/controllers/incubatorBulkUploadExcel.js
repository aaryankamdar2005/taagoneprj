const multer = require('multer');
const xlsx = require('xlsx');
const crypto = require('crypto');
const Startup = require('../models/Startup');
const Incubator = require('../models/Incubator');
const User = require('../models/User');
const { success, error } = require('../utils/response');

// Configure multer for Excel/CSV upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) and CSV files are allowed'));
    }
  }
});

// Map Excel columns to startup fields
const columnMapping = {
  'company name': 'companyName',
  'company': 'companyName',
  'startup name': 'companyName',
  'name': 'companyName',
  'startup': 'companyName',
  
  'industry': 'industry',
  'sector': 'industry',
  'domain': 'industry',
  
  'stage': 'stage',
  'startup stage': 'stage',
  'business stage': 'stage',
  
  'funding': 'fundingAmount',
  'funding amount': 'fundingAmount',
  'investment': 'fundingAmount',
  'amount': 'fundingAmount',
  'capital': 'fundingAmount',
  
  'description': 'description',
  'about': 'description',
  'details': 'description',
  'overview': 'description',
  
  'website': 'website',
  'url': 'website',
  'web': 'website',
  
  'email': 'email',
  'contact email': 'email',
  'email id': 'email',
  
  'phone': 'phone',
  'mobile': 'phone',
  'contact': 'phone',
  'phone number': 'phone',
  'contact number': 'phone',
  
  'founders': 'founders',
  'founder': 'founders',
  'founder name': 'founders',
  'co-founders': 'founders',
  
  'location': 'location',
  'city': 'location',
  'address': 'location',
  'place': 'location'
};

// Normalize column name
const normalizeColumnName = (colName) => {
  const normalized = colName.toLowerCase().trim();
  return columnMapping[normalized] || null;
};

// Parse Excel/CSV data
const parseExcelData = (buffer, filename) => {
  try {
    console.log('Parsing file:', filename);
    
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
    
    console.log('Raw rows parsed:', rawData.length);
    
    if (rawData.length === 0) {
      throw new Error('No data found in the file');
    }
    
    const headers = Object.keys(rawData[0]);
    console.log('Headers found:', headers);
    
    const fieldMapping = {};
    headers.forEach(header => {
      const mappedField = normalizeColumnName(header);
      if (mappedField) {
        fieldMapping[header] = mappedField;
      }
    });
    
    console.log('Field mapping:', fieldMapping);
    
    const startups = [];
    
    rawData.forEach((row, index) => {
      const startup = {};
      
      Object.keys(row).forEach(col => {
        const field = fieldMapping[col];
        if (field && row[col]) {
          let value = String(row[col]).trim();
          
          if (field === 'fundingAmount') {
            value = value.replace(/[₹Rs\.,]/g, '').trim();
            startup[field] = parseInt(value) || 0;
          } 
          else if (field === 'phone') {
            value = value.replace(/[^\d+]/g, '');
            if (value && value.length >= 10) {
              startup[field] = value;
            }
          }
          else if (field === 'stage') {
            const stageMap = {
              'idea': 'idea',
              'mvp': 'mvp',
              'early revenue': 'early-revenue',
              'early-revenue': 'early-revenue',
              'growth': 'growth',
              'scale': 'scale',
              'scaling': 'scale'
            };
            startup[field] = stageMap[value.toLowerCase()] || 'idea';
          }
          else {
            startup[field] = value;
          }
        }
      });
      
      if (startup.companyName && startup.companyName.length > 2) {
        startups.push(startup);
      } else {
        console.log(`Skipping row ${index + 2}: No company name`);
      }
    });
    
    console.log('Valid startups extracted:', startups.length);
    
    return startups;
    
  } catch (err) {
    console.error('Parse error:', err);
    throw new Error(`Failed to parse file: ${err.message}`);
  }
};

// Upload and parse Excel/CSV
const uploadStartupsExcel = async (req, res) => {
  try {
    if (!req.file) {
      return error(res, 'No Excel/CSV file uploaded', 400);
    }
    
    const userId = req.user.id;
    const incubator = await Incubator.findOne({ userId });
    
    if (!incubator) {
      return error(res, 'Incubator profile not found', 404);
    }
    
    console.log('Processing file:', req.file.originalname);
    console.log('File size:', req.file.size, 'bytes');
    
    const extractedStartups = parseExcelData(req.file.buffer, req.file.originalname);
    
    if (extractedStartups.length === 0) {
      return error(res, 'No valid startup data found in file', 400);
    }
    
    success(res, 'File parsed successfully', {
      totalExtracted: extractedStartups.length,
      fileName: req.file.originalname,
      startups: extractedStartups,
      preview: extractedStartups.slice(0, 5)
    });
    
  } catch (err) {
    console.error('Excel Upload Error:', err);
    error(res, err.message || 'Failed to process file', 500);
  }
};

// Bulk import startups with activation support
// Bulk import startups with activation support - FIXED VERSION
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
    
    console.log(`Starting import of ${startups.length} startups...`);
    
    const results = {
      success: [],
      failed: [],
      updated: [],
      skipped: []
    };
    
    let processed = 0;
    
    for (const startupData of startups) {
      try {
        processed++;
        console.log(`Processing ${processed}/${startups.length}: ${startupData.companyName}`);
        
        if (!startupData.companyName) {
          results.skipped.push({ data: startupData, reason: 'Missing company name' });
          continue;
        }
        
        // Check if startup already exists by company name
        let existingStartup = await Startup.findOne({
          companyName: { $regex: new RegExp(`^${startupData.companyName}$`, 'i') }
        }).populate('userId');
        
        if (existingStartup) {
          // UPDATE EXISTING STARTUP
          console.log(`Updating existing startup: ${existingStartup.companyName}`);
          
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
          
          // Update importedBy if not set
          if (!existingStartup.importedBy) {
            existingStartup.importedBy = incubator._id;
            existingStartup.importedAt = new Date();
          }
          
          // If not activated, regenerate activation credentials
          if (!existingStartup.activated) {
            const tempPassword = `${startupData.companyName.slice(0, 3).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;
            const activationToken = crypto.randomBytes(32).toString('hex');
            
            existingStartup.activationToken = activationToken;
            existingStartup.activationTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            existingStartup.tempPassword = tempPassword;
            
            // Update user password too
            if (existingStartup.userId) {
              existingStartup.userId.password = tempPassword;
              await existingStartup.userId.save();
            }
          }
          
          await existingStartup.save();
          results.updated.push(existingStartup.companyName);
          
        } else {
          // CREATE NEW STARTUP
          console.log(`Creating new startup: ${startupData.companyName}`);
          
          // Generate phone - check for duplicates
          let phoneNumber;
          let phoneExists = true;
          let attempts = 0;
          
          if (startupData.phone) {
            // Use provided phone
            phoneNumber = startupData.phone.replace(/\D/g, '').slice(-10);
            phoneExists = await User.findOne({ phoneNumber });
            
            // If phone exists, generate random one
            if (phoneExists) {
              console.log(`Phone ${phoneNumber} already exists, generating random...`);
              phoneNumber = null;
            }
          }
          
          // Generate unique random phone if needed
          while ((!phoneNumber || phoneExists) && attempts < 10) {
            phoneNumber = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
            phoneExists = await User.findOne({ phoneNumber });
            attempts++;
          }
          
          if (phoneExists) {
            throw new Error('Could not generate unique phone number after 10 attempts');
          }
          
          console.log(`Using phone number: ${phoneNumber}`);
          
          // Generate temporary password and activation token
          const tempPassword = `${startupData.companyName.slice(0, 3).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;
          const activationToken = crypto.randomBytes(32).toString('hex');
          
          // Create new user account for startup
          const newUser = new User({
            phoneNumber: phoneNumber,
            password: tempPassword,
            userType: 'startup'
          });
          
          await newUser.save();
          console.log(`Created user with phone: ${phoneNumber}`);
          
          // Create new startup profile with activation fields
          const newStartup = new Startup({
            userId: newUser._id,
            companyName: startupData.companyName,
            industry: startupData.industry || 'Not specified',
            stage: startupData.stage || 'idea',
            oneLineDescription: startupData.description || '',
            website: startupData.website || '',
            email: startupData.email || '',
            phone: phoneNumber, // Use the generated/verified phone
            founders: startupData.founders || '',
            location: startupData.location || '',
            fundingAsk: {
              amount: startupData.fundingAmount || 0
            },
            verifiedBy: [incubator._id],
            importedBy: incubator._id,
            importedAt: new Date(),
            activated: false,
            activationToken: activationToken,
            activationTokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            tempPassword: tempPassword
          });
          
          await newStartup.save();
          console.log(`Created startup: ${newStartup.companyName}`);
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
    
    console.log('Import complete!');
    console.log('Results:', {
      success: results.success.length,
      updated: results.updated.length,
      failed: results.failed.length,
      skipped: results.skipped.length
    });
    
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
    }).select('companyName industry stage importedAt verifiedBy activated').sort({ importedAt: -1 });
    
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
  uploadStartupsExcel,
  bulkImportStartups,
  getImportHistory
};
