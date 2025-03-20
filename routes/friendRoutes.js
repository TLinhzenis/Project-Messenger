const express = require("express");
const router = express.Router();
const ListFriend = require("../models/ListFriend");
const User = require("../models/User");

router.post("/request", async (req, res) => {
    const { userId1, userId2 } = req.body;

    try {
        const user1 = await User.findById(userId1);
        const user2 = await User.findById(userId2);

        if (!user1 || !user2) {
            return res.status(404).json({ error: "Người dùng không tồn tại." });
        }

        const friendRequest = new ListFriend({
            userId1,
            userId2,
            notification: `Có lời mời kết bạn từ ${user1.name}`,
            status: "waiting"
        });

        await friendRequest.save();

        // Gửi sự kiện realtime
        req.io.emit("receiveFriendRequest", { userId2, message: friendRequest.notification });

        res.status(200).json({ message: "Đã gửi lời mời kết bạn." });
    } catch (error) {
        console.error("Lỗi khi gửi lời mời kết bạn:", error);
        res.status(500).json({ error: "Lỗi máy chủ, vui lòng thử lại sau!" });
    }
});

router.get("/notifications", async (req, res) => {
    const { userId } = req.query;

    try {
        const notifications = await ListFriend.find({ userId2: userId, status: "waiting" });
        res.status(200).json(notifications);
    } catch (error) {
        console.error("Lỗi khi tải thông báo:", error);
        res.status(500).json({ error: "Lỗi máy chủ, vui lòng thử lại sau!" });
    }
});

router.post("/respond", async (req, res) => {
    const { notificationId, accept } = req.body;

    try {
        const notification = await ListFriend.findById(notificationId);

        if (!notification) {
            return res.status(404).json({ error: "Thông báo không tồn tại." });
        }

        if (accept) {
            notification.status = "friend";
            notification.notification = null;
            await notification.save();
        
            // Phát sự kiện cập nhật danh sách bạn bè
            req.io.emit("refreshFriendList", notification.userId1);
            req.io.emit("refreshFriendList", notification.userId2);
        }
         else {
            await ListFriend.findByIdAndDelete(notificationId);
        }

        res.status(200).json({ message: "Đã phản hồi lời mời kết bạn." });
    } catch (error) {
        console.error("Lỗi khi phản hồi lời mời kết bạn:", error);
        res.status(500).json({ error: "Lỗi máy chủ, vui lòng thử lại sau!" });
    }
});

router.get("/friends", async (req, res) => {
    const { userId } = req.query;

    try {
        const friends = await ListFriend.find({
            $or: [{ userId1: userId, status: "friend" }, { userId2: userId, status: "friend" }]
        }).populate("userId1 userId2", "name");

        const friendList = friends.map(friend => {
            const isUser1 = friend.userId1._id.toString() === userId;
            return isUser1 ? friend.userId2 : friend.userId1;
        });

        res.status(200).json(friendList);
    } catch (error) {
        console.error("Lỗi khi tải danh sách bạn bè:", error);
        res.status(500).json({ error: "Lỗi máy chủ, vui lòng thử lại sau!" });
    }
});

router.get("/waiting", async (req, res) => {
    const { userId1, userId2 } = req.query;

    try {
        const waitingRequests = await ListFriend.find({
            userId1,
            userId2,
            status: "waiting"
        });

        res.status(200).json(waitingRequests);
    } catch (error) {
        console.error("Lỗi khi kiểm tra lời mời kết bạn đang chờ:", error);
        res.status(500).json({ error: "Lỗi máy chủ, vui lòng thử lại sau!" });
    }
});

module.exports = router;