/*************************
 * 工具：SHA-256 雜湊
 *************************/
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/*************************
 * 使用者資料
 *************************/
function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || {};
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function getCurrentUser() {
  return localStorage.getItem("currentUser");
}

function setCurrentUser(username) {
  localStorage.setItem("currentUser", username);
}

function logout() {
  localStorage.removeItem("currentUser");
  location.reload();
}

/*************************
 * 初始化
 *************************/
document.addEventListener("DOMContentLoaded", () => {
  const loginPage = document.getElementById("login-page");
  const appPage = document.getElementById("app-page");

  const loginBtn = document.getElementById("login-btn");
  const registerBtn = document.getElementById("register-btn");
  const logoutBtn = document.getElementById("logout-btn");

  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const msg = document.getElementById("login-msg");

  // 已登入就直接進主頁
  if (getCurrentUser()) {
    loginPage.classList.add("hidden");
    appPage.classList.remove("hidden");
  }

  // 註冊
  registerBtn.onclick = async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      msg.textContent = "請輸入帳號與密碼";
      return;
    }

    const users = getUsers();
    if (users[username]) {
      msg.textContent = "帳號已存在";
      return;
    }

    const passwordHash = await hashPassword(password);
    users[username] = { passwordHash };
    saveUsers(users);

    msg.textContent = "註冊成功，請登入";
  };

  // 登入
  loginBtn.onclick = async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    const users = getUsers();
    if (!users[username]) {
      msg.textContent = "帳號不存在";
      return;
    }

    const passwordHash = await hashPassword(password);
    if (passwordHash !== users[username].passwordHash) {
      msg.textContent = "密碼錯誤";
      return;
    }

    setCurrentUser(username);
    loginPage.classList.add("hidden");
    appPage.classList.remove("hidden");
  };

  // 登出
  logoutBtn.onclick = logout;
});
