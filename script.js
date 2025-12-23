/*************************
 * 1. 工具：SHA-256 雜湊 (含相容性修復)
 *************************/
async function hashPassword(password) {
  if (!window.crypto || !window.crypto.subtle) {
    // 如果是本地檔案開啟，回傳簡易字串以便登入測試
    return "local_" + password;
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// 資料存取工具 (依據使用者隔離資料)
const storage = {
  getUsers: () => JSON.parse(localStorage.getItem("users")) || {},
  saveUsers: (users) => localStorage.setItem("users", JSON.stringify(users)),
  getCurrentUser: () => localStorage.getItem("currentUser"),
  getHabits: (user) => JSON.parse(localStorage.getItem(`habits_${user}`)) || [],
  saveHabits: (user, habits) => localStorage.setItem(`habits_${user}`, JSON.stringify(habits)),
  getHabitChecks: (user) => JSON.parse(localStorage.getItem(`checks_${user}`)) || {},
  saveHabitChecks: (user, checks) => localStorage.setItem(`checks_${user}`, JSON.stringify(checks)),
  getSchedules: (user) => JSON.parse(localStorage.getItem(`schedules_${user}`)) || {}
};

/*************************
 * 2. 初始化與登入邏輯
 *************************/
document.addEventListener("DOMContentLoaded", () => {
  const user = storage.getCurrentUser();
  if (user) {
    showApp(user);
  }

  // 註冊按鈕
  document.getElementById("register-btn").onclick = async () => {
    const u = document.getElementById("username").value.trim();
    const p = document.getElementById("password").value;
    const msg = document.getElementById("login-msg");
    if (!u || !p) return msg.textContent = "請輸入帳密";
    
    const users = storage.getUsers();
    if (users[u]) return msg.textContent = "帳號已存在";
    
    users[u] = { passwordHash: await hashPassword(p) };
    storage.saveUsers(users);
    msg.style.color = "green";
    msg.textContent = "註冊成功，請登入";
  };

  // 登入按鈕
  document.getElementById("login-btn").onclick = async () => {
    const u = document.getElementById("username").value.trim();
    const p = document.getElementById("password").value;
    const msg = document.getElementById("login-msg");
    const users = storage.getUsers();
    
    if (!users[u] || (await hashPassword(p)) !== users[u].passwordHash) {
      return msg.textContent = "帳號或密碼錯誤";
    }
    
    localStorage.setItem("currentUser", u);
    showApp(u);
  };

  document.getElementById("logout-btn").onclick = () => {
    localStorage.removeItem("currentUser");
    location.reload();
  };
});

/*************************
 * 3. App 核心功能
 *************************/
function showApp(username) {
  document.getElementById("login-page").classList.add("hidden");
  document.getElementById("app-page").classList.remove("hidden");
  document.getElementById("user-display").textContent = `你好，${username}`;
  
  initHabits(username);
  initSchedules(username);
}

// 區塊切換
function showSection(id) {
  document.getElementById("habit-section").classList.add("hidden");
  document.getElementById("schedule-section").classList.add("hidden");
  document.getElementById(id).classList.remove("hidden");
}

// --- 習慣功能 ---
function initHabits(user) {
  const list = document.getElementById("habit-list");
  const render = () => {
    list.innerHTML = "";
    const habits = storage.getHabits(user);
    const checks = storage.getHabitChecks(user);
    const today = new Date().toLocaleDateString();

    habits.forEach(h => {
      const li = document.createElement("li");
      const isDone = checks[h] === today;
      li.className = isDone ? "completed" : "";
      li.innerHTML = `<span>${h}</span> <button ${isDone ? 'disabled' : ''}>${isDone ? '已打卡' : '打卡'}</button>`;
      
      li.querySelector("button").onclick = () => {
        const currentChecks = storage.getHabitChecks(user);
        currentChecks[h] = today;
        storage.saveHabitChecks(user, currentChecks);
        render();
      };
      list.appendChild(li);
    });
  };

  document.getElementById("add-habit-btn").onclick = () => {
    const input = document.getElementById("new-habit-input");
    const val = input.value.trim();
    if (val) {
      const habits = storage.getHabits(user);
      if (!habits.includes(val)) {
        habits.push(val);
        storage.saveHabits(user, habits);
        input.value = "";
        render();
      }
    }
  };
  render();
}

// --- 行程功能 ---
function initSchedules(user) {
  const dateInput = document.getElementById("schedule-date-input");
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;

  const render = () => {
    const date = dateInput.value;
    document.getElementById("current-view-date").textContent = `${date} 的清單`;
    const list = document.getElementById("schedule-list");
    list.innerHTML = "";
    
    const allSchedules = JSON.parse(localStorage.getItem(`schedules_${user}`)) || {};
    const dayData = allSchedules[date] || [];
    
    dayData.sort((a,b) => a.hour - b.hour).forEach((item, idx) => {
      const li = document.createElement("li");
      li.className = item.done ? "completed-schedule" : "";
      li.innerHTML = `<b>${item.hour}:00</b> <span>${item.text}</span> <button>${item.done ? '已完成' : '完成'}</button>`;
      
      li.querySelector("button").onclick = () => {
        item.done = true;
        localStorage.setItem(`schedules_${user}`, JSON.stringify(allSchedules));
        render();
      };
      list.appendChild(li);
    });
  };

  document.getElementById("add-schedule-btn").onclick = () => {
    const text = document.getElementById("new-schedule-input").value;
    const hour = document.getElementById("schedule-hour-input").value;
    const date = dateInput.value;

    if (text && hour !== "") {
      const allSchedules = JSON.parse(localStorage.getItem(`schedules_${user}`)) || {};
      if (!allSchedules[date]) allSchedules[date] = [];
      allSchedules[date].push({ hour: parseInt(hour), text, done: false });
      localStorage.setItem(`schedules_${user}`, JSON.stringify(allSchedules));
      render();
    }
  };

  dateInput.onchange = render;
  render();
}
