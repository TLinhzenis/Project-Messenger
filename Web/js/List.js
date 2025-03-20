document.addEventListener("DOMContentLoaded", () => {
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
    socket.on("refreshFriendList", (userId) => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user && user._id === userId) {
            loadFriends(); // Cập nhật danh sách bạn bè ngay lập tức
        }
    });
    
    loadFriends();
});