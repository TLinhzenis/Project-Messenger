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
            this.value = ""; 
        } catch (error) {
            console.error("Lỗi tìm kiếm:", error);
            chatTitle.innerHTML = "Lỗi khi tải dữ liệu";
            searchResults.innerHTML = "";
        }
    });