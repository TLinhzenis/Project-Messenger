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
        search.style.display = "none";
        notificationsContainer.style.display = "none";
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