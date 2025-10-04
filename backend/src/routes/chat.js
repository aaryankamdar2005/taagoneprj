const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const chatController = require('../controllers/chat');

// All routes require authentication
router.use(authenticate);

// Get all chats for user
router.get('/chats', chatController.getUserChats);

// Get or create a specific chat
router.post('/chats', chatController.getOrCreateChat);

// Get messages for a specific chat
router.get('/chats/:chatId/messages', chatController.getChatMessages);

// Send a message
router.post('/chats/:chatId/messages', chatController.sendMessage);

// Delete chat
router.delete('/chats/:chatId', chatController.deleteChat);

module.exports = router;
