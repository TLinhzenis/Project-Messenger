document.addEventListener("DOMContentLoaded", () => {
    const friendList = document.getElementById("friendList");
    const chatbox = document.getElementById("chatbox");
    const chatTitle = document.getElementById("chat-title");
    const socket = io("http://localhost:3000");

    loadFriends();

    // Bắt đầu trò chuyện
    window.startChat = function(friendName) {
        chatTitle.textContent = `Trò chuyện với ${friendName}`;
        chatbox.innerHTML = ""; // Xóa tin nhắn cũ
    }

    // Nhận tin nhắn từ server
    socket.on("receiveMessage", (data) => {
        const user = JSON.parse(localStorage.getItem("user"));
        const className = data.sender === user.name ? "user" : "friend";
        addMessage(data.sender, data.message, className);
    });

    // Gửi tin nhắn
    window.sendMessage = async function() {
        let input = document.getElementById("userInput").value;
        if (!input.trim()) return;

        const user = JSON.parse(localStorage.getItem("user"));
        const messageData = {
            sender: user.name,
            message: input,
            className: "user"
        };


        // Gửi tin nhắn qua Socket.IO
        socket.emit("sendMessage", messageData);

        // Nếu tin nhắn có "@bot" thì gọi chatbot
        if (input.includes("@bot")) {
            try {
                let response = await fetch("http://localhost:3000/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: input }),
                });

                let data = await response.json();
                const botMessageData = {
                    sender: "Bot",
                    message: data.reply,
                    className: "bot"
                };

                // Gửi tin nhắn bot qua Socket.IO
                socket.emit("sendMessage", botMessageData);
            } catch (error) {
                const botErrorMessageData = {
                    sender: "Bot",
                    message: "Lỗi khi kết nối chatbot!",
                    className: "bot"
                };

                // Gửi tin nhắn lỗi bot qua Socket.IO
                socket.emit("sendMessage", botErrorMessageData);
            }
        }
    }

    // Hiển thị tin nhắn với giao diện mới
    function addMessage(sender, text, className) {
        let chatbox = document.getElementById("chatbox");
        let message = document.createElement("div");
        message.className = "message " + className;
        message.innerHTML = `<strong>${sender}:</strong><br>${formatMessage(text)}`;
        chatbox.appendChild(message);
        chatbox.scrollTop = chatbox.scrollHeight;
    }

    function formatMessage(text, maxLength = 150) {
        let formattedText = "";
        for (let i = 0; i < text.length; i += maxLength) {
            formattedText += text.substring(i, i + maxLength) + "<br>"; // Ngắt dòng mỗi 100 ký tự
        }
        return formattedText;
    }

    const user = JSON.parse(localStorage.getItem("user"));
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    if (user) {
        // Hiển thị tên người dùng thay vì nút đăng nhập
        loginBtn.style.display = "none"; // Ẩn nút đăng nhập
        const usernameDisplay = document.createElement("div");
        usernameDisplay.textContent = `Xin chào, ${user.name}`;
        usernameDisplay.style.fontWeight = "bold";
        usernameDisplay.style.margin = "10px 0";
        document.querySelector(".sidebar.left").appendChild(usernameDisplay);
    }

    // Đăng xuất
    logoutBtn.addEventListener("click", function () {
        localStorage.removeItem("user");
        window.location.reload(); // Load lại trang sau khi đăng xuất
    });
    loginBtn.addEventListener("click", function () {
        window.location.href = "login.html"; // Điều hướng đến trang đăng nhập
    });

    loadNotifications();

    document.getElementById("search").addEventListener("input", async function () {
        const query = this.value.trim();
        const chatbox = document.getElementById("chatbox");
        const chatTitle = document.getElementById("chat-title");
        const inputArea = document.querySelector(".input-area"); // Lấy phần nhập tin nhắn
        const user = JSON.parse(localStorage.getItem("user"));

        if (query.length === 0) {
            // Khi không nhập gì, hiển thị lại nội dung chat
            chatTitle.innerHTML = "Chọn một người để trò chuyện";
            chatbox.innerHTML = "";
            chatbox.style.display = "block";
            inputArea.style.display = "flex"; // Hiển thị lại ô nhập tin nhắn
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/search?query=${query}&userId=${user._id}`);
            const users = await response.json();

            if (users.length === 0) {
                chatTitle.innerHTML = "Không tìm thấy kết quả";
                chatbox.innerHTML = "";
            } else {
                // Ẩn chat khi tìm kiếm có kết quả
                chatbox.style.display = "block";
                inputArea.style.display = "none"; // Ẩn khung nhập tin nhắn
                chatTitle.innerHTML = "Kết quả tìm kiếm:";
                chatbox.innerHTML = users.map(user => `
                    <div class="user-result">
                        ${user.name}
                        <button onclick="sendFriendRequest('${user._id}')" ${user.isFriend ? 'disabled' : ''}>${user.isFriend ? 'Đã là bạn' : 'Kết bạn'}</button>
                    </div>
                `).join("");
            }
        } catch (error) {
            console.error("Lỗi tìm kiếm:", error);
            chatTitle.innerHTML = "Lỗi khi tải dữ liệu";
            chatbox.innerHTML = "";
        }
    });

    async function sendFriendRequest(friendId) {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) {
            alert("Vui lòng đăng nhập để gửi lời mời kết bạn.");
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/api/friends/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId1: user._id, userId2: friendId })
            });

            if (response.ok) {
                alert("Đã gửi lời mời kết bạn.");
            } else {
                const data = await response.json();
                alert(data.error);
            }
        } catch (error) {
            console.error("Lỗi khi gửi lời mời kết bạn:", error);
        }
    }

    async function loadNotifications() {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) return;

        try {
            const response = await fetch(`http://localhost:3000/api/friends/notifications?userId=${user._id}`);
            const notifications = await response.json();

            const notificationsContainer = document.getElementById("notifications");
            notificationsContainer.innerHTML = notifications.map(notification => `
                <li>
                    ${notification.notification}
                    <button onclick="respondToFriendRequest('${notification._id}', true)">Có</button>
                    <button onclick="respondToFriendRequest('${notification._id}', false)">Không</button>
                </li>
            `).join("");
        } catch (error) {
            console.error("Lỗi khi tải thông báo:", error);
        }
    }

    async function respondToFriendRequest(notificationId, accept) {
        try {
            const response = await fetch(`http://localhost:3000/api/friends/respond`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId, accept })
            });

            if (response.ok) {
                loadNotifications();
            } else {
                const data = await response.json();
                alert(data.error);
            }
        } catch (error) {
            console.error("Lỗi khi phản hồi lời mời kết bạn:", error);
        }
    }

    async function loadFriends() {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) return;

        try {
            const response = await fetch(`http://localhost:3000/api/friends/friends?userId=${user._id}`);
            const friends = await response.json();

            const friendList = document.getElementById("friendList");
            friendList.innerHTML = friends.map(friend => `
                <li onclick="startChat('${friend.name}')">${friend.name}</li>
            `).join("");
        } catch (error) {
            console.error("Lỗi khi tải danh sách bạn bè:", error);
        }
    }
});