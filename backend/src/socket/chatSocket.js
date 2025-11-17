const jwt = require('jsonwebtoken');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

// Socket.IO authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userType = decoded.userType;
    
    console.log(`✅ Socket authenticated: ${socket.userType} - ${socket.userId}`);
    next();
  } catch (err) {
    console.error('Socket auth error:', err.message);
    next(new Error('Authentication error'));
  }
};

// Initialize Socket.IO
const initializeSocket = (io) => {
  // Authentication middleware
  io.use(authenticateSocket);
  
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id} (${socket.userType})`);
    
    // Join user's personal room
    socket.join(`user:${socket.userId}`);
    
    // Join all user's chat rooms
    socket.on('join-chats', async () => {
      try {
        const chats = await Chat.find({
          participants: socket.userId
        }).select('_id');
        
        chats.forEach(chat => {
          socket.join(`chat:${chat._id}`);
          console.log(`📱 Joined chat room: ${chat._id}`);
        });
        
        socket.emit('chats-joined', { count: chats.length });
      } catch (err) {
        console.error('Join chats error:', err);
        socket.emit('error', { message: 'Failed to join chats' });
      }
    });
    
    // Send message
    socket.on('send-message', async (data) => {
      try {
        const { chatId, message } = data;
        
        console.log(`💬 Message from ${socket.userType}: ${message.substring(0, 50)}...`);
        
        // Verify user is participant
        const chat = await Chat.findById(chatId);
        if (!chat) {
          return socket.emit('error', { message: 'Chat not found' });
        }
        
        if (!chat.participants.includes(socket.userId)) {
          return socket.emit('error', { message: 'Not authorized' });
        }
        
        // Determine sender type
        let senderType;
        if (socket.userType === 'startup') {
          senderType = 'startup';
        } else if (socket.userType === 'investor') {
          senderType = 'investor';
        } else if (socket.userType === 'incubator') {
          senderType = 'incubator';
        } else if (socket.userType === 'mentor') {
          senderType = 'mentor';
        }
        
        // Create message
        const newMessage = new Message({
          chatId,
          senderId: socket.userId,
          senderType,
          message: message.trim(),
          timestamp: new Date()
        });
        
        await newMessage.save();
        
        // Update chat
        chat.lastMessage = message.trim();
        chat.lastMessageAt = new Date();
        chat.updatedAt = new Date();
        await chat.save();
        
        // Populate sender info
        const populatedMessage = await Message.findById(newMessage._id)
          .populate('senderId', 'companyName incubatorName name');
        
        // Emit to all participants in the chat room
        io.to(`chat:${chatId}`).emit('new-message', {
          chatId,
          message: {
            _id: populatedMessage._id,
            message: populatedMessage.message,
            senderId: populatedMessage.senderId,
            senderType: populatedMessage.senderType,
            timestamp: populatedMessage.timestamp,
            read: populatedMessage.read
          }
        });
        
        // Emit notification to other participants
        chat.participants.forEach(participantId => {
          if (participantId.toString() !== socket.userId) {
            io.to(`user:${participantId}`).emit('notification', {
              type: 'new-message',
              chatId,
              message: message.substring(0, 100),
              from: socket.userType
            });
          }
        });
        
        console.log(`✅ Message sent to chat: ${chatId}`);
        
      } catch (err) {
        console.error('Send message error:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Mark messages as read
    socket.on('mark-read', async (data) => {
      try {
        const { chatId } = data;
        
        await Message.updateMany(
          { 
            chatId, 
            senderId: { $ne: socket.userId },
            read: false 
          },
          { read: true }
        );
        
        // Notify sender that messages are read
        socket.to(`chat:${chatId}`).emit('messages-read', { chatId });
        
        console.log(`✅ Messages marked as read in chat: ${chatId}`);
        
      } catch (err) {
        console.error('Mark read error:', err);
      }
    });
    
    // Typing indicator
    socket.on('typing', (data) => {
      const { chatId, isTyping } = data;
      socket.to(`chat:${chatId}`).emit('user-typing', {
        chatId,
        userId: socket.userId,
        userType: socket.userType,
        isTyping
      });
    });
    
    // Disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.id}`);
    });
  });
  
  return io;
};

module.exports = { initializeSocket };
