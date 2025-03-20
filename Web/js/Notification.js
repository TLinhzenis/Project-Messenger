document.addEventListener("DOMContentLoaded", () => {
    const socket = io("http://localhost:3000");
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
loadNotifications();
    // Sự kiện cho biểu tượng thông báo
    document.getElementById('notificationBell').addEventListener('click', () => {
        const dropdown = document.getElementById('notificationDropdown');
        dropdown.classList.toggle('hidden');
    });
    socket.on("receiveFriendRequest", (data) => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user && user._id === data.userId2) {
            loadNotifications();
        }
    });
    
});