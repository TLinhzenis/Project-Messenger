const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User'); // Import User model

// Lưu trữ tin nhắn
router.post('/messages', async (req, res) => {
    const { senderId, receiverId, message } = req.body;
    try {
        const newMessage = new Message({ senderId, receiverId, message });
        await newMessage.save();
        res.status(201).send(newMessage);
    } catch (error) {
        res.status(500).send({ error: 'Lỗi khi lưu trữ tin nhắn' });
    }
});

// Lấy tin nhắn giữa hai người dùng
router.get('/messages', async (req, res) => {
    const { userId1, userId2 } = req.query;
    try {
        const messages = await Message.find({
            $or: [
                { senderId: userId1, receiverId: userId2 },
                { senderId: userId2, receiverId: userId1 }
            ]
        }).sort({ timestamp: 1 }).lean();

        // Lấy thông tin người dùng
        const userIds = [...new Set(messages.flatMap(msg => [msg.senderId, msg.receiverId]))];
        const users = await User.find({ _id: { $in: userIds } }).lean();
        const userMap = users.reduce((acc, user) => {
            acc[user._id] = user.name;
            return acc;
        }, {});

        // Thêm tên người dùng vào tin nhắn
        const messagesWithUserNames = messages.map(msg => ({
            ...msg,
            senderName: userMap[msg.senderId],
            receiverName: userMap[msg.receiverId]
        }));

        res.send(messagesWithUserNames);
    } catch (error) {
        res.status(500).send({ error: 'Lỗi khi lấy tin nhắn' });
    }
});

module.exports = router;