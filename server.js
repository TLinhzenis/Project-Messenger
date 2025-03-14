const express = require("express");
const axios = require("axios");
const cors = require("cors");
const mongoose = require('mongoose');

const app = express();
const port = 3000;

// Kết nối MongoDB Atlas
const mongoURI = "mongodb+srv://btuanlinh715:Btuanlinh715@cluster0.krja2.mongodb.net/MessagerApp?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(mongoURI)
    .then(() => console.log("✅ Kết nối MongoDB thành công!"))
    .catch(err => console.error("❌ Lỗi kết nối MongoDB:", err));
const GOOGLE_API_KEY = "AIzaSyA_iOgOvxaY9BHnNPxSrMLoSEr7LADFTs4";  
const MODEL_NAME = "models/gemini-1.5-pro-latest"; // Đổi sang model mới nhất

app.use(express.json());
app.use(cors());

app.post("/chat", async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Vui lòng nhập tin nhắn!" });
        }

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/${MODEL_NAME}:generateContent`,
            {
                contents: [{ role: "user", parts: [{ text: message }] }]
            },
            {
                headers: { "Content-Type": "application/json" },
                params: { key: GOOGLE_API_KEY },
            }
        );

        res.json({ reply: response.data.candidates[0].content.parts[0].text });
    } catch (error) {
        console.error("Lỗi khi gọi Gemini API:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Lỗi máy chủ, vui lòng thử lại sau!" });
    }
});

const userRoutes = require("./routes/UserRoute");
app.use("/api", userRoutes);
const friendRoutes = require("./routes/friendRoutes");

app.use("/api/friends", friendRoutes);



app.listen(port, () => {
    console.log(`✅ Server đang chạy tại http://localhost:${port}`);
});
