/*************************
 * 工具：SHA-256 密碼雜湊
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
 * 登入 / 註冊
 *************************/
document.getElementById("register-btn").onclick = async () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const msg = document.getElementById("login-msg");

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
  users[username] = {
    passwordHash,
    habits: [],
    schedules: []
  };

  saveUsers(users);
  msg.textContent = "註冊成功，請登入";
};

document.getElementById("login-btn").onclick = async () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const msg = document.getElementById("login-msg");

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
  initApp();
};

/*************************
 * 習慣 / 行程（依使用者）
 *************************/
function getUserData() {
  const users = getUsers();
  return users[getCurrentUser()];
}

function saveUserData(data) {
  const users = getUsers();
  users[getCurrentUser()] = data;
  saveUsers(users);
}

/*************************
 * 習慣
 *************************/
function renderHabits() {
  const list = document.getElementById("habit-list");
  list.innerHTML = "";
  const data = getUserData();

  data.habits.forEach((h, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${h}</span>
      <button class="delete-btn">✕</button>
    `;
    li.querySelector("button").onclick = () => {
      data.habits.splice(i, 1);
      saveUserData(data);
      renderHabits();
    };
    list.appendChild(li);
  });
}

/*************************
 * 行程
 *************************/
function renderSchedules() {
  const list = document.getElementById("schedule-list");
  list.innerHTML = "";
  const data = getUserData();

  data.schedules.forEach((s, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>[${s.date} ${s.time}] ${s.text}</span>
      <button class="delete-btn">✕</button>
    `;
    li.querySelector("button").onclick = () => {
      data.schedules.splice(i, 1);
      saveUserData(data);
      renderSchedules();
    };
    list.appendChild(li);
  });
}

/*************************
 * 初始化 APP
 *************************/
function initApp() {
  document.getElementById("login-page").classList.add("hidden");
  document.getElementById("app-page").classList.remove("hidden");

  renderHabits();
  renderSchedules();

  document.getElementById("add-habit-btn").onclick = () => {
    const input = document.getElementById("new-habit-input");
    if (!input.value.trim()) return;
    const data = getUserData();
    data.habits.push(input.value);
    saveUserData(data);
    input.value = "";
    renderHabits();
  };

  document.getElementById("add-schedule-btn").onclick = () => {
    const date = document.getElementById("schedule-date").value;
    const time = document.getElementById("schedule-time").value;
    const text = document.getElementById("new-schedule-input").value.trim();
    if (!date || !time || !text) return;

    const data = getUserData();
    data.schedules.push({ date, time, text });
    saveUserData(data);
    renderSchedules();
  };
}

/*************************
 * 啟動
 *************************/
document.addEventListener("DOMContentLoaded", () => {
  if (getCurrentUser()) {
    initApp();
  }
});
