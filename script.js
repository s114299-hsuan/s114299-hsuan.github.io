/*************************
 * 1. 加密與資料管理 (確保本地也能執行)
 *************************/
async function hashPassword(password) {
  if (!window.crypto || !window.crypto.subtle) {
    return "dev_mode_" + password; // 本地測試模式
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

const storage = {
  getUsers: () => JSON.parse(localStorage.getItem("users")) || {},
  saveUsers: (u) => localStorage.setItem("users", JSON.stringify(u)),
  getCurrentUser: () => localStorage.getItem("currentUser")
};

/*************************
 * 2. 登入與導覽邏輯
 *************************/
document.addEventListener("DOMContentLoaded", () => {
  const currentUser = storage.getCurrentUser();
  if (currentUser) showApp(currentUser);

  // 註冊
  document.getElementById("register-btn").onclick = async () => {
    const u = document.getElementById("username").value.trim();
    const p = document.getElementById("password").value;
    const msg = document.getElementById("login-msg");
    if (!u || !p) return msg.textContent = "請填寫完整資訊";
    
    const users = storage.getUsers();
    if (users[u]) return msg.textContent = "帳號已存在";
    
    users[u] = { passwordHash: await hashPassword(p) };
    storage.saveUsers(users);
    msg.style.color = "green";
    msg.textContent = "註冊成功！請點擊登入";
  };

  // 登入
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

function showApp(user) {
  document.getElementById("login-page").classList.add("hidden");
  document.getElementById("app-page").classList.remove("hidden");
  document.getElementById("user-display").textContent = `👤 ${user}`;
  document.getElementById("welcome-user").textContent = user;
  document.getElementById("today-date-display").textContent = new Date().toLocaleDateString();
  
  showSection('home-section');
  initHabits(user);
  initSchedules(user);
}

function showSection(id) {
  const sections = document.querySelectorAll('.app-main > section');
  sections.forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

/*************************
 * 3. 核心功能：習慣追蹤 (每日限一次)
 *************************/
function initHabits(user) {
  const habitList = document.getElementById("habit-list");
  const render = () => {
    habitList.innerHTML = "";
    const habits = JSON.parse(localStorage.getItem(`habits_${user}`)) || [];
    const checks = JSON.parse(localStorage.getItem(`checks_${user}`)) || {};
    const today = new Date().toLocaleDateString();

    habits.forEach(h => {
      const li = document.createElement("li");
      const isDone = checks[h] === today;
      if (isDone) li.className = "completed";
      
      li.innerHTML = `
        <span>${h}</span>
        <button class="check-btn" ${isDone ? 'disabled' : ''}>
          ${isDone ? '本日已打卡' : '打卡'}
        </button>
      `;
      
      li.querySelector("button").onclick = () => {
        checks[h] = today;
        localStorage.setItem(`checks_${user}`, JSON.stringify(checks));
        render();
      };
      habitList.appendChild(li);
    });
  };

  document.getElementById("add-habit-btn").onclick = () => {
    const input = document.getElementById("new-habit-input");
    const val = input.value.trim();
    if (val) {
      const habits = JSON.parse(localStorage.getItem(`habits_${user}`)) || [];
      if (!habits.includes(val)) {
        habits.push(val);
        localStorage.setItem(`habits_${user}`, JSON.stringify(habits));
        input.value = "";
        render();
      }
    }
  };
  render();
}

/*************************
 * 4. 核心功能：行程排定 (按小時排序)
 *************************/
function initSchedules(user) {
  const dateInput = document.getElementById("schedule-date-input");
  dateInput.value = new Date().toISOString().split('T')[0];

  const render = () => {
    const date = dateInput.value;
    document.getElementById("current-view-date-label").textContent = `📅 ${date} 的清單`;
    const list = document.getElementById("schedule-list");
    list.innerHTML = "";
    
    const all = JSON.parse(localStorage.getItem(`schedules_${user}`)) || {};
    const dayData = all[date] || [];
    
    dayData.sort((a,b) => a.hour - b.hour).forEach((item, idx) => {
      const li = document.createElement("li");
      if (item.done) li.className = "completed-schedule";
      li.innerHTML = `
        <span><b>${String(item.hour).padStart(2, '0')}:00</b> - ${item.text}</span>
        <button class="check-btn" ${item.done ? 'disabled' : ''}>${item.done ? '已完成' : '完成'}</button>
      `;
      
      li.querySelector("button").onclick = () => {
        item.done = true;
        localStorage.setItem(`schedules_${user}`, JSON.stringify(all));
        render();
      };
      list.appendChild(li);
    });
  };

  document.getElementById("add-schedule-btn").onclick = () => {
    const text = document.getElementById("new-schedule-input").value.trim();
    const hour = document.getElementById("schedule-hour-input").value;
    const date = dateInput.value;

    if (text && hour !== "") {
      const all = JSON.parse(localStorage.getItem(`schedules_${user}`)) || {};
      if (!all[date]) all[date] = [];
      all[date].push({ hour: parseInt(hour), text, done: false });
      localStorage.setItem(`schedules_${user}`, JSON.stringify(all));
      document.getElementById("new-schedule-input").value = "";
      document.getElementById("schedule-hour-input").value = "";
      render();
    }
  };

  dateInput.onchange = render;
  render();
}
