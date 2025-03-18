document.addEventListener("DOMContentLoaded", () => {
    const chatbox = document.getElementById("chatbox");
    const chatTitle = document.getElementById("chat-title");
    const socket = io("http://localhost:3000");
    // Hàm tải danh sách bạn bè
    window.loadFriends = async function () {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) return;
        try {
            const response = await fetch(`http://localhost:3000/api/friends/friends?userId=${user._id}`);
            const friends = await response.json();
            const friendList = document.getElementById("friendList");
            friendList.innerHTML = friends.map(friend => `
                <li onclick="startChat('${friend._id}', '${friend.name}')">${friend.name}</li>
            `).join("");
        } catch (error) {
            console.error("Lỗi khi tải danh sách bạn bè:", error);
        }
    };
    // Hàm tải danh sách đã nhắn tin
    window.loadRecentChats = async function () {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) return;
        try {
            const response = await fetch(`http://localhost:3000/api/messages/recent?userId=${user._id}`);
            const recentChats = await response.json();
            const recentChatsList = document.getElementById("recentChats");
            recentChatsList.innerHTML = recentChats.map(chat => `
                <li onclick="startChat('${chat.userId}', '${chat.userName}')">${chat.userName}</li>
            `).join("");
        } catch (error) {
            console.error("Lỗi khi tải danh sách đã nhắn tin:", error);
        }
    };
    socket.on("updateRecentChats", (receiverId, senderId) => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user && (user._id === receiverId || user._id === senderId)) {
            loadRecentChats(); // Gọi lại hàm để cập nhật danh sách
        }
    });
    loadRecentChats();
    // Hàm tải thông báo
    window.loadNotifications = async function () {
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
            const notificationBell = document.getElementById("notificationBell");
            const redDot = notificationBell.querySelector(".red-dot");
            redDot.style.display = notifications.length > 0 ? "block" : "none";
        } catch (error) {
            console.error("Lỗi khi tải thông báo:", error);
        }
    };
    // Hàm phản hồi lời mời kết bạn
    window.respondToFriendRequest = async function (notificationId, accept) {
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
    };
    // Hàm gửi lời mời kết bạn
    window.sendFriendRequest = async function (friendId) {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) {
            alert("Vui lòng đăng nhập để gửi lời mời kết bạn.");
            return;
        }
        try {
            const response = await fetch(`http://localhost:3000/api/friends/friends?userId=${user._id}`);
            const friends = await response.json();
            const isFriend = friends.some(friend => friend._id === friendId);
            if (isFriend) {
                alert("Người dùng này đã là bạn bè.");
                return;
            }
            const waitingResponse = await fetch(`http://localhost:3000/api/friends/waiting?userId1=${user._id}&userId2=${friendId}`);
            const waitingRequests = await waitingResponse.json();
            if (waitingRequests.length > 0) {
                alert("Bạn đã gửi lời mời kết bạn, vui lòng chờ đối phương xác nhận.");
                return;
            }
        } catch (error) {
            console.error("Lỗi khi kiểm tra danh sách bạn bè hoặc lời mời kết bạn:", error);
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
    };
    loadFriends();
    // Hàm bắt đầu trò chuyện
    window.startChat = async function (friendId, friendName) {
        const searchResults = document.getElementById("searchResults");
        const chatbox = document.getElementById("chatbox");
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
        let chatbox = document.getElementById("chatbox");
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
    // Xử lý đăng nhập/đăng xuất
    const user = JSON.parse(localStorage.getItem("user"));
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    if (user) {
        loginBtn.style.display = "none";
        const usernameDisplay = document.createElement("div");
        usernameDisplay.innerHTML = `<i class="fa-solid fa-user"></i>  ${user.name}`;
        usernameDisplay.style.fontWeight = "bold";
        usernameDisplay.style.margin = "10px 0";
        document.querySelector(".sidebar.left").appendChild(usernameDisplay);
    } else {
        logoutBtn.style.display = "none";
    }
    // Đăng xuất
    logoutBtn.addEventListener("click", function () {
        localStorage.removeItem("user");
        window.location.reload();
    });
    // Đăng nhập
    loginBtn.addEventListener("click", function () {
        window.location.href = "login.html";
    });
    // Tải danh sách bạn bè và thông báo khi trang được tải
    loadFriends();
    loadNotifications();
    // Xử lý sự kiện tìm kiếm
    document.getElementById("search").addEventListener("keypress", async function (event) {
        if (event.key !== 'Enter') return;
        const query = this.value.trim();
        const chatbox = document.getElementById("chatbox");
        const searchResults = document.getElementById("searchResults");
        const chatTitle = document.getElementById("chat-title");
        const inputArea = document.querySelector(".input-area");
        const user = JSON.parse(localStorage.getItem("user"));
        chatbox.style.display = "none";
        searchResults.style.display = "block";
        if (query.length === 0) {
            chatTitle.innerHTML = "Chọn một người để trò chuyện";
            searchResults.innerHTML = "";
            searchResults.style.display = "none";
            chatbox.style.display = "block";
            inputArea.style.display = "flex";
            return;
        }
        try {
            const response = await fetch(`http://localhost:3000/api/search?query=${query}&userId=${user._id}`);
            const users = await response.json();
            if (users.length === 0) {
                chatTitle.innerHTML = "Không tìm thấy kết quả";
                searchResults.innerHTML = "";
            } else {
                inputArea.style.display = "none";
                const friendsResponse = await fetch(`http://localhost:3000/api/friends/friends?userId=${user._id}`);
                const friends = await friendsResponse.json();
                searchResults.innerHTML = users.map(searchUser => {
                    const isFriend = friends.some(friend => friend._id === searchUser._id);
                    return `
                        <div class="user-result">
                            ${searchUser.name}
                            ${searchUser._id === user._id ? '' : `
                                <div class="button-group">
                                    <button class="button-container" onclick="sendFriendRequest('${searchUser._id}')"><i class="fa-solid fa-user-plus"></i></button>
                                    <button class="button-container" onclick="startChat('${searchUser._id}', '${searchUser.name}')"><i class="fa-solid fa-comments"></i></button>
                                </div>
                            `}
                        </div>
                    `;
                }).join("");
            }
        } catch (error) {
            console.error("Lỗi tìm kiếm:", error);
            chatTitle.innerHTML = "Lỗi khi tải dữ liệu";
            searchResults.innerHTML = "";
        }
    });
});

