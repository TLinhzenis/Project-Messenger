const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const router = express.Router();

// Đăng ký người dùng
router.post("/register", async (req, res) => {
    try {
        const { username, password, name } = req.body;
        if (!username || !password || !name) {
            return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin!" });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: "Tên đăng nhập đã tồn tại!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword, name });
        await newUser.save();

        res.status(201).json({ message: "Đăng ký thành công!", user: newUser });
    } catch (error) {
        res.status(500).json({ error: "Lỗi máy chủ, vui lòng thử lại sau!" });
    }
});

// Xử lý đăng nhập
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin!" });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: "Tên đăng nhập hoặc mật khẩu không đúng" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Tên đăng nhập hoặc mật khẩu không đúng" });
        }

        res.json({ message: "Đăng nhập thành công!", user });
    } catch (error) {
        res.status(500).json({ error: "Lỗi máy chủ, vui lòng thử lại sau!" });
    }
});

// Tìm kiếm người dùng theo tên
router.get("/search", async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.json([]);

        // Tìm kiếm tên chứa ký tự nhập vào (không phân biệt hoa thường)
        const users = await User.find({ name: { $regex: query, $options: "i" } });

        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Lỗi máy chủ" });
    }
});

module.exports = router; // Đảm bảo export đúng
