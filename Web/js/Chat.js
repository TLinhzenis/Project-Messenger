document.addEventListener("DOMContentLoaded", () => {
    const chatbox = document.getElementById("chatbox");
    const chatTitle = document.getElementById("chat-title");
    const socket = io("http://localhost:3000");
    // Hàm bắt đầu trò chuyện
    window.startChat = async function (friendId, friendName) {
        const searchResults = document.getElementById("searchResults");
        searchResults.style.display = "none";
        chatbox.style.display = "block";
        chatTitle.textContent = `Trò chuyện với ${friendName}`;
        chatbox.innerHTML = "";
        document.getElementById("receiverId").value = friendId;
        const user = JSON.parse(localStorage.getItem("user"));
        await loadMessages(user._id, friendId);
        document.querySelector('.input-area').style.display = 'flex';
        chatbox.style.display = "flex";
        chatbox.style.flexDirection = "column";
        chatbox.style.overflowY = "auto";
        chatbox.style.border = "1px solid #ccc";
        chatbox.style.padding = "10px";
        chatbox.style.background = "#fafafa";
    };
    // Nhận tin nhắn từ server
    socket.on("receiveMessage", (data) => {
        const user = JSON.parse(localStorage.getItem("user"));
        const className = data.senderId === user._id ? "user" : "friend";
        addMessage(data.senderName, data.message, className);
    });
    // Hàm gửi tin nhắn
    window.sendMessage = async function () {
        let input = document.getElementById("userInput").value;
        if (!input.trim()) return;
        const user = JSON.parse(localStorage.getItem("user"));
        const receiverIdElement = document.getElementById("receiverId");
        if (!receiverIdElement || !receiverIdElement.value) {
            console.error("Không tìm thấy ID của người nhận.");
            return;
        }
        
        const receiverId = receiverIdElement.value;
        const messageData = {
            senderId: user._id,
            receiverId: receiverId,
            message: input
        };
        try {
            const response = await fetch("http://localhost:3000/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(messageData)
            });
            if (!response.ok) {
                console.error("Lỗi khi gửi tin nhắn:", await response.json());
            }
        } catch (error) {
            console.error("Lỗi khi gửi tin nhắn:", error);
        }
        socket.emit("sendMessage", {
            ...messageData,
            senderName: user.name
        });
        document.getElementById("userInput").value = "";
        // Kiểm tra nếu tin nhắn chứa "@bot"
        if (input.includes("@bot")) {
            try {
                let response = await fetch("http://localhost:3000/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: input }),
                });
                let data = await response.json();
                const botMessageData = {
                    senderId: "bot",
                    senderName: "Bot",
                    message: data.reply,
                    className: "bot"
                };
                socket.emit("sendMessage", botMessageData);
            } catch (error) {
                const botErrorMessageData = {
                    senderId: "bot",
                    senderName: "Bot",
                    message: "Lỗi khi kết nối chatbot!",
                    className: "bot"
                };
                socket.emit("sendMessage", botErrorMessageData);
            }
        }
    };
    // Hàm thêm tin nhắn vào giao diện
    function addMessage(senderName, text, className) {
        let message = document.createElement("div");
        message.className = "message " + className;
        message.innerHTML = `<strong>${senderName}:</strong><br>${formatMessage(text)}`;
        chatbox.appendChild(message);
        chatbox.scrollTop = chatbox.scrollHeight;
    }
    // Hàm định dạng tin nhắn
    function formatMessage(text, maxLength = 150) {
        let formattedText = "";
        for (let i = 0; i < text.length; i += maxLength) {
            formattedText += text.substring(i, i + maxLength) + "<br>";
        }
        return formattedText;
    }
    // Hàm tải tin nhắn
    async function loadMessages(userId1, userId2) {
        try {
            const response = await fetch(`http://localhost:3000/api/messages?userId1=${userId1}&userId2=${userId2}`);
            const messages = await response.json();
            chatbox.innerHTML = messages.map(message => `
                <div class="message ${message.senderId === userId1 ? 'user' : 'friend'}">
                    <strong>${message.senderName}:</strong><br>${message.message}
                </div>
            `).join("");
        } catch (error) {
            console.error("Lỗi khi tải tin nhắn:", error);
        }
    }
    // Sự kiện gửi tin nhắn khi nhấn Enter
    const userInput = document.getElementById('userInput');
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });
});