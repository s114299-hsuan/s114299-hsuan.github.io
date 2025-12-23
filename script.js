/*************************
 * SHA-256 密碼雜湊
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
  const u = username.value.trim();
  const p = password.value;
  const msg = login-msg;

  if (!u || !p) {
    login-msg.textContent = "請輸入帳號與密碼";
    return;
  }

  const users = getUsers();
  if (users[u]) {
    login-msg.textContent = "帳號已存在";
    return;
  }

  users[u] = {
    passwordHash: await hashPassword(p),
    habits: [],
    schedules: []
  };

  saveUsers(users);
  login-msg.textContent = "註冊成功，請登入";
};

document.getElementById("login-btn").onclick = async () => {
  const u = username.value.trim();
  const p = password.value;
  const users = getUsers();

  if (!users[u]) {
    login-msg.textContent = "帳號不存在";
    return;
  }

  const hash = await hashPassword(p);
  if (hash !== users[u].passwordHash) {
    login-msg.textContent = "密碼錯誤";
    return;
  }

  setCurrentUser(u);
  initApp();
};

/*************************
 * 使用者資料操作
 *************************/
function getUserData() {
  return getUsers()[getCurrentUser()];
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
    li.innerHTML = `<span>${h}</span><button class="delete-btn">✕</button>`;
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
    li.innerHTML = `<span>[${s.date} ${s.time}] ${s.text}</span>
                    <button class="delete-btn">✕</button>`;
    li.querySelector("button").onclick = () => {
      data.schedules.splice(i, 1);
      saveUserData(data);
      renderSchedules();
    };
    list.appendChild(li);
  });
}

/*************************
 * 啟動主系統
 *************************/
function initApp() {
  login-page.classList.add("hidden");
  app-page.classList.remove("hidden");

  renderHabits();
  renderSchedules();

  logout-btn.onclick = logout;

  add-habit-btn.onclick = () => {
    const v = new-habit-input.value.trim();
    if (!v) return;
    const d = getUserData();
    d.habits.push(v);
    saveUserData(d);
    new-habit-input.value = "";
    renderHabits();
  };

  add-schedule-btn.onclick = () => {
    const d = schedule-date.value;
    const t = schedule-time.value;
    const v = new-schedule-input.value.trim();
    if (!d || !t || !v) return;

    const data = getUserData();
    data.schedules.push({ date: d, time: t, text: v });
    saveUserData(data);
    renderSchedules();
  };
}

/*************************
 * 初始化
 *************************/
document.addEventListener("DOMContentLoaded", () => {
  if (getCurrentUser()) initApp();
});
