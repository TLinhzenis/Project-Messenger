document.addEventListener("DOMContentLoaded", () => {
    const friendList = document.getElementById("friendList");
    const chatbox = document.getElementById("chatbox");
    const chatTitle = document.getElementById("chat-title");

    // Danh sách bạn bè giả lập
    const friends = ["Alice", "Bob", "Charlie"];

    // Hiển thị danh sách bạn bè
    friends.forEach(friend => {
        let li = document.createElement("li");
        li.textContent = friend;
        li.onclick = () => startChat(friend);
        friendList.appendChild(li);
    });

    // Bắt đầu trò chuyện
    function startChat(friend) {
        chatTitle.textContent = `Trò chuyện với ${friend}`;
        chatbox.innerHTML = ""; // Xóa tin nhắn cũ
    }
});

// Gửi tin nhắn
async function sendMessage() {
    let input = document.getElementById("userInput").value;
    if (!input.trim()) return;

    addMessage("Bạn", input, "user");
    document.getElementById("userInput").value = "";

    // Nếu tin nhắn có "@bot" thì gọi chatbot
    if (input.includes("@bot")) {
        try {
            let response = await fetch("http://localhost:3000/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: input }),
            });

            let data = await response.json();
            addMessage("Bot", data.reply, "bot");
        } catch (error) {
            addMessage("Bot", "Lỗi khi kết nối chatbot!", "bot");
        }
    }
}

// Hiển thị tin nhắn với giao diện mới
function addMessage(sender, text, className) {
    let chatbox = document.getElementById("chatbox");
    let message = document.createElement("div");
    message.className = "message " + className;
    message.innerHTML = `<strong>${sender}:</strong><br>${text}`;
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

function addMessage(sender, text, className) {
    let chatbox = document.getElementById("chatbox");
    let message = document.createElement("div");
    message.className = "message " + className;
    message.innerHTML = `<strong>${sender}:</strong><br>${formatMessage(text)}`;
    chatbox.appendChild(message);
    chatbox.scrollTop = chatbox.scrollHeight;
}

document.addEventListener("DOMContentLoaded", function () {
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
    document.getElementById("loginBtn").addEventListener("click", function () {
        window.location.href = "login.html"; // Điều hướng đến trang đăng nhập
    });
    
});

document.getElementById("search").addEventListener("input", async function () {
    const query = this.value.trim();
    const chatbox = document.getElementById("chatbox");
    const chatTitle = document.getElementById("chat-title");
    const inputArea = document.querySelector(".input-area"); // Lấy phần nhập tin nhắn

    if (query.length === 0) {
        // Khi không nhập gì, hiển thị lại nội dung chat
        chatTitle.innerHTML = "Chọn một người để trò chuyện";
        chatbox.innerHTML = "";
        chatbox.style.display = "block";
        inputArea.style.display = "flex"; // Hiển thị lại ô nhập tin nhắn
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/search?query=${query}`);
        const users = await response.json();

        if (users.length === 0) {
            chatTitle.innerHTML = "Không tìm thấy kết quả";
            chatbox.innerHTML = "";
        } else {
            // Ẩn chat khi tìm kiếm có kết quả
            chatbox.style.display = "block";
            inputArea.style.display = "none"; // Ẩn khung nhập tin nhắn
            chatTitle.innerHTML = "Kết quả tìm kiếm:";
            chatbox.innerHTML = users.map(user => `<div class="user-result">${user.name}</div>`).join("");
        }
    } catch (error) {
        console.error("Lỗi tìm kiếm:", error);
        chatTitle.innerHTML = "Lỗi khi tải dữ liệu";
        chatbox.innerHTML = "";
    }
});





