const Chat = require('../models/Chat');
const Investor = require('../models/Investor');
const Startup = require('../models/Startup');
const Incubator = require('../models/Incubator');
const User = require('../models/User');
const { success, error } = require('../utils/response');

// Get or Create Chat
const getOrCreateChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startupId, investorId, incubatorId } = req.body;
    
    console.log('Get/Create Chat - User ID:', userId);
    console.log('Request body:', { startupId, investorId, incubatorId });
    
    const user = await User.findById(userId);
    console.log('User found:', { id: user._id, userType: user.userType });
    
    let chatQuery = {};
    let chatType = '';
    let populateFields = [];
    
    // Determine chat type and participants based on user type
    if (user.userType === 'investor') {
      const investor = await Investor.findOne({ userId });
      if (!investor) {
        return error(res, 'Investor profile not found', 404);
      }
      
      if (!startupId) {
        return error(res, 'Startup ID is required', 400);
      }
      
      chatQuery = {
        investorId: investor._id,
        startupId: startupId,
        chatType: 'investor-startup'
      };
      chatType = 'investor-startup';
      populateFields = [
        { path: 'investorId', select: 'investorName investorType' },
        { path: 'startupId', select: 'companyName logoUrl industry stage' }
      ];
      
    } else if (user.userType === 'startup') {
      const startup = await Startup.findOne({ userId });
      if (!startup) {
        return error(res, 'Startup profile not found', 404);
      }
      
      // Startup can chat with investor OR incubator
      if (investorId) {
        chatQuery = {
          investorId: investorId,
          startupId: startup._id,
          chatType: 'investor-startup'
        };
        chatType = 'investor-startup';
        populateFields = [
          { path: 'investorId', select: 'investorName investorType' },
          { path: 'startupId', select: 'companyName logoUrl industry stage' }
        ];
      } else if (incubatorId) {
        chatQuery = {
          startupId: startup._id,
          incubatorId: incubatorId,
          chatType: 'startup-incubator'
        };
        chatType = 'startup-incubator';
        populateFields = [
          { path: 'startupId', select: 'companyName logoUrl industry stage' },
          { path: 'incubatorId', select: 'incubatorName logoUrl location' }
        ];
      } else {
        return error(res, 'Either Investor ID or Incubator ID is required', 400);
      }
      
    } else if (user.userType === 'incubator') {
      const incubator = await Incubator.findOne({ userId });
      if (!incubator) {
        return error(res, 'Incubator profile not found', 404);
      }
      
      if (!startupId) {
        return error(res, 'Startup ID is required', 400);
      }
      
      chatQuery = {
        startupId: startupId,
        incubatorId: incubator._id,
        chatType: 'startup-incubator'
      };
      chatType = 'startup-incubator';
      populateFields = [
        { path: 'startupId', select: 'companyName logoUrl industry stage' },
        { path: 'incubatorId', select: 'incubatorName logoUrl location' }
      ];
      
    } else {
      console.log('ERROR: Invalid userType -', user.userType);
      return error(res, `Invalid user type: ${user.userType}`, 400);
    }

    console.log('Chat query:', chatQuery);

    // Find or create chat
    let chat = await Chat.findOne(chatQuery);
    
    if (chat) {
      // Populate existing chat
      for (const field of populateFields) {
        await chat.populate(field);
      }
    } else {
      // Create new chat
      chat = new Chat({
        ...chatQuery,
        chatType,
        messages: []
      });
      await chat.save();
      
      // Populate after creation
      for (const field of populateFields) {
        await chat.populate(field);
      }
    }

    console.log('Chat found/created:', chat._id);

    success(res, 'Chat retrieved successfully', chat);
  } catch (err) {
    console.error('Get or create chat error:', err);
    error(res, err.message, 500);
  }
};

// Get All Chats for User
const getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('Get User Chats - User ID:', userId);
    
    const user = await User.findById(userId);
    
    if (!user) {
      return error(res, 'User not found', 404);
    }
    
    console.log('User type:', user.userType);
    
    let chats = [];
    
    if (user.userType === 'investor') {
      const investor = await Investor.findOne({ userId });
      if (!investor) {
        return error(res, 'Investor profile not found', 404);
      }
      
      chats = await Chat.find({ 
        investorId: investor._id,
        chatType: 'investor-startup'
      })
        .populate('startupId', 'companyName logoUrl industry stage')
        .sort({ lastMessageDate: -1 });
        
    } else if (user.userType === 'startup') {
      const startup = await Startup.findOne({ userId });
      if (!startup) {
        return error(res, 'Startup profile not found', 404);
      }
      
      // Get both investor and incubator chats
      const investorChats = await Chat.find({ 
        startupId: startup._id,
        chatType: 'investor-startup'
      })
        .populate('investorId', 'investorName investorType')
        .sort({ lastMessageDate: -1 });
        
      const incubatorChats = await Chat.find({
        startupId: startup._id,
        chatType: 'startup-incubator'
      })
        .populate('incubatorId', 'incubatorName logoUrl location')
        .sort({ lastMessageDate: -1 });
        
      chats = [...investorChats, ...incubatorChats].sort((a, b) => 
        new Date(b.lastMessageDate) - new Date(a.lastMessageDate)
      );
      
    } else if (user.userType === 'incubator') {
      const incubator = await Incubator.findOne({ userId });
      if (!incubator) {
        return error(res, 'Incubator profile not found', 404);
      }
      
      chats = await Chat.find({ 
        incubatorId: incubator._id,
        chatType: 'startup-incubator'
      })
        .populate('startupId', 'companyName logoUrl industry stage')
        .sort({ lastMessageDate: -1 });
        
    } else {
      return error(res, `Invalid user type: ${user.userType}`, 400);
    }

    const formattedChats = chats.map(chat => {
      let participant = {};
      
      if (chat.chatType === 'investor-startup') {
        if (user.userType === 'investor') {
          participant = {
            _id: chat.startupId?._id,
            name: chat.startupId?.companyName,
            logoUrl: chat.startupId?.logoUrl,
            type: 'startup'
          };
        } else {
          participant = {
            _id: chat.investorId?._id,
            name: chat.investorId?.investorName,
            type: 'investor'
          };
        }
      } else if (chat.chatType === 'startup-incubator') {
        if (user.userType === 'startup') {
          participant = {
            _id: chat.incubatorId?._id,
            name: chat.incubatorId?.incubatorName,
            logoUrl: chat.incubatorId?.logoUrl,
            type: 'incubator'
          };
        } else {
          participant = {
            _id: chat.startupId?._id,
            name: chat.startupId?.companyName,
            logoUrl: chat.startupId?.logoUrl,
            type: 'startup'
          };
        }
      }
      
      return {
        _id: chat._id,
        chatType: chat.chatType,
        participant,
        lastMessage: chat.lastMessage,
        lastMessageDate: chat.lastMessageDate,
        unreadCount: chat.unreadCount[user.userType] || 0,
        messageCount: chat.messages.length
      };
    });

    success(res, 'Chats retrieved successfully', {
      total: formattedChats.length,
      chats: formattedChats
    });
  } catch (err) {
    console.error('Get user chats error:', err);
    error(res, err.message, 500);
  }
};

// Get Chat Messages
const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const user = await User.findById(userId);

    const chat = await Chat.findById(chatId)
      .populate('investorId', 'investorName investorType')
      .populate('startupId', 'companyName logoUrl industry stage')
      .populate('incubatorId', 'incubatorName logoUrl location');

    if (!chat) {
      return error(res, 'Chat not found', 404);
    }

    // Verify user has access to this chat
    let hasAccess = false;
    if (user.userType === 'investor') {
      const investor = await Investor.findOne({ userId });
      hasAccess = investor && chat.investorId?._id.toString() === investor._id.toString();
    } else if (user.userType === 'startup') {
      const startup = await Startup.findOne({ userId });
      hasAccess = startup && chat.startupId._id.toString() === startup._id.toString();
    } else if (user.userType === 'incubator') {
      const incubator = await Incubator.findOne({ userId });
      hasAccess = incubator && chat.incubatorId?._id.toString() === incubator._id.toString();
    }

    if (!hasAccess) {
      return error(res, 'Access denied', 403);
    }

    // Mark messages as read
    chat.messages.forEach(msg => {
      if (msg.senderType !== user.userType && !msg.isRead) {
        msg.isRead = true;
      }
    });
    chat.unreadCount[user.userType] = 0;

    await chat.save();

    // Get participant info
    let participant = {};
    if (chat.chatType === 'investor-startup') {
      if (user.userType === 'investor') {
        participant = {
          _id: chat.startupId._id,
          name: chat.startupId.companyName,
          logoUrl: chat.startupId.logoUrl,
          type: 'startup'
        };
      } else {
        participant = {
          _id: chat.investorId._id,
          name: chat.investorId.investorName,
          type: 'investor'
        };
      }
    } else if (chat.chatType === 'startup-incubator') {
      if (user.userType === 'startup') {
        participant = {
          _id: chat.incubatorId._id,
          name: chat.incubatorId.incubatorName,
          logoUrl: chat.incubatorId.logoUrl,
          type: 'incubator'
        };
      } else {
        participant = {
          _id: chat.startupId._id,
          name: chat.startupId.companyName,
          logoUrl: chat.startupId.logoUrl,
          type: 'startup'
        };
      }
    }

    success(res, 'Messages retrieved successfully', {
      chatId: chat._id,
      chatType: chat.chatType,
      participant,
      messages: chat.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    });
  } catch (err) {
    console.error('Get chat messages error:', err);
    error(res, err.message, 500);
  }
};

// Send Message
const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!message || message.trim() === '') {
      return error(res, 'Message cannot be empty', 400);
    }

    const user = await User.findById(userId);
    const chat = await Chat.findById(chatId)
      .populate('investorId', 'investorName')
      .populate('startupId', 'companyName')
      .populate('incubatorId', 'incubatorName');

    if (!chat) {
      return error(res, 'Chat not found', 404);
    }

    // Verify user has access
    let hasAccess = false;
    let senderType = '';
    
    if (user.userType === 'investor') {
      const investor = await Investor.findOne({ userId });
      hasAccess = investor && chat.investorId?._id.toString() === investor._id.toString();
      senderType = 'investor';
    } else if (user.userType === 'startup') {
      const startup = await Startup.findOne({ userId });
      hasAccess = startup && chat.startupId._id.toString() === startup._id.toString();
      senderType = 'startup';
    } else if (user.userType === 'incubator') {
      const incubator = await Incubator.findOne({ userId });
      hasAccess = incubator && chat.incubatorId?._id.toString() === incubator._id.toString();
      senderType = 'incubator';
    }

    if (!hasAccess) {
      return error(res, 'Access denied', 403);
    }

    // Add message
    const newMessage = {
      senderId: userId,
      senderType,
      message: message.trim(),
      timestamp: new Date(),
      isRead: false
    };

    chat.messages.push(newMessage);
    chat.lastMessage = message.trim();
    chat.lastMessageDate = new Date();

    // Update unread count for recipient(s)
    if (chat.chatType === 'investor-startup') {
      if (senderType === 'investor') {
        chat.unreadCount.startup += 1;
      } else {
        chat.unreadCount.investor += 1;
      }
    } else if (chat.chatType === 'startup-incubator') {
      if (senderType === 'startup') {
        chat.unreadCount.incubator += 1;
      } else {
        chat.unreadCount.startup += 1;
      }
    }

    await chat.save();

    const savedMessage = chat.messages[chat.messages.length - 1];

    success(res, 'Message sent successfully', {
      message: savedMessage,
      chatId: chat._id
    });
  } catch (err) {
    console.error('Send message error:', err);
    error(res, err.message, 500);
  }
};

// Delete Chat
const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const user = await User.findById(userId);

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return error(res, 'Chat not found', 404);
    }

    // Verify access
    let hasAccess = false;
    if (user.userType === 'investor') {
      const investor = await Investor.findOne({ userId });
      hasAccess = investor && chat.investorId?.toString() === investor._id.toString();
    } else if (user.userType === 'startup') {
      const startup = await Startup.findOne({ userId });
      hasAccess = startup && chat.startupId.toString() === startup._id.toString();
    } else if (user.userType === 'incubator') {
      const incubator = await Incubator.findOne({ userId });
      hasAccess = incubator && chat.incubatorId?.toString() === incubator._id.toString();
    }

    if (!hasAccess) {
      return error(res, 'Access denied', 403);
    }

    await Chat.findByIdAndDelete(chatId);

    success(res, 'Chat deleted successfully', { chatId });
  } catch (err) {
    console.error('Delete chat error:', err);
    error(res, err.message, 500);
  }
};

module.exports = {
  getOrCreateChat,
  getUserChats,
  getChatMessages,
  sendMessage,
  deleteChat
};
