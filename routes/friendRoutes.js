const express = require("express");
const router = express.Router();
const ListFriend = require("../models/ListFriend");

// Gửi lời mời kết bạn
router.post("/send-friend-request", async (req, res) => {
    try {
        const { senderId, receiverId } = req.body;

        const existingRequest = await ListFriend.findOne({ userId1: senderId, userId2: receiverId });
        if (existingRequest) {
            return res.status(400).json({ error: "Bạn đã gửi lời mời rồi!" });
        }

        await ListFriend.create({ userId1: senderId, userId2: receiverId, status: "pending" });
        res.json({ message: "Lời mời kết bạn đã được gửi!" });
    } catch (error) {
        console.error("Lỗi gửi kết bạn:", error);
        res.status(500).json({ error: "Lỗi máy chủ!" });
    }
});

// Lấy danh sách lời mời kết bạn
router.get("/get-friend-requests", async (req, res) => {
    try {
        const { userId } = req.query;

        const requests = await ListFriend.find({ userId2: userId, status: "pending" })
            .populate("userId1", "name");

        res.json(requests.map(r => ({
            _id: r._id,
            senderName: r.userId1.name
        })));
    } catch (error) {
        console.error("Lỗi tải danh sách:", error);
        res.status(500).json({ error: "Lỗi máy chủ!" });
    }
});

// Xử lý lời mời kết bạn
router.post("/respond-friend-request", async (req, res) => {
    try {
        const { requestId, action } = req.body;

        if (action === "accept") {
            await ListFriend.findByIdAndUpdate(requestId, { status: "friend" });
        } else {
            await ListFriend.findByIdAndDelete(requestId);
        }

        res.json({ message: "Xử lý thành công!" });
    } catch (error) {
        console.error("Lỗi xử lý lời mời:", error);
        res.status(500).json({ error: "Lỗi máy chủ!" });
    }
});

module.exports = router;
