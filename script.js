/*************************
 * 1. 加密與資料管理
 *************************/
async function hashPassword(password) {
  if (!window.crypto || !window.crypto.subtle) {
    return "dev_mode_" + password;
  }
  try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  } catch (e) {
      console.warn("加密失敗，使用明文 fallback");
      return "dev_mode_" + password;
  }
}

const storage = {
  getUsers: () => JSON.parse(localStorage.getItem("users")) || {},
  saveUsers: (u) => localStorage.setItem("users", JSON.stringify(u)),
  getCurrentUser: () => localStorage.getItem("currentUser")
};

/*************************
 * 2. 登入、註冊與導覽邏輯
 *************************/
document.addEventListener("DOMContentLoaded", () => {
  const currentUser = storage.getCurrentUser();
  if (currentUser) {
      showApp(currentUser);
  }

  addEnterListener("password", "login-btn");

  const registerBtn = document.getElementById("register-btn");
  if (registerBtn) {
      registerBtn.onclick = async () => {
        const u = document.getElementById("username").value.trim();
        const p = document.getElementById("password").value;
        const msg = document.getElementById("login-msg");
        
        if (!u || !p) {
            msg.style.color = "red";
            return msg.textContent = "請填寫完整資訊";
        }
        
        const users = storage.getUsers();
        if (users[u]) {
            msg.style.color = "red";
            return msg.textContent = "帳號已存在";
        }
        
        users[u] = { passwordHash: await hashPassword(p) };
        storage.saveUsers(users);
        msg.style.color = "green";
        msg.textContent = "註冊成功！請點擊登入";
      };
  }

  const loginBtn = document.getElementById("login-btn");
  if (loginBtn) {
      loginBtn.onclick = async () => {
        const u = document.getElementById("username").value.trim();
        const p = document.getElementById("password").value;
        const msg = document.getElementById("login-msg");
        const users = storage.getUsers();
        
        if (!users[u]) {
             msg.style.color = "red";
             return msg.textContent = "帳號不存在";
        }

        const hash = await hashPassword(p);
        if (hash !== users[u].passwordHash) {
          msg.style.color = "red";
          return msg.textContent = "密碼錯誤";
        }
        
        localStorage.setItem("currentUser", u);
        location.reload(); 
      };
  }

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
      logoutBtn.onclick = () => {
        localStorage.removeItem("currentUser");
        location.reload();
      };
  }

  const deleteAccountBtn = document.getElementById("delete-account-btn");
  if (deleteAccountBtn) {
      deleteAccountBtn.onclick = () => {
          const user = storage.getCurrentUser();
          if(!user) return;
          
          const confirmDelete = confirm(`🍊 確定要註銷「${user}」的帳號嗎？\n\n注意：所有的習慣與行程資料都將永久刪除！`);
          
          if(confirmDelete) {
              const users = storage.getUsers();
              delete users[user];
              storage.saveUsers(users);

              localStorage.removeItem(`habits_${user}`);
              localStorage.removeItem(`checks_${user}`);
              localStorage.removeItem(`schedules_${user}`);
              localStorage.removeItem("currentUser");
              
              alert("帳號已註銷。");
              location.reload();
          }
      };
  }
});

function showApp(user) {
  const loginPage = document.getElementById("login-page");
  const appPage = document.getElementById("app-page");
  
  if(loginPage) loginPage.classList.add("hidden");
  if(appPage) appPage.classList.remove("hidden");
  
  const userDisplay = document.getElementById("user-display");
  if(userDisplay) userDisplay.textContent = `👤 ${user}`;
  
  const welcomeUser = document.getElementById("welcome-user");
  if(welcomeUser) welcomeUser.textContent = user;
  
  const dateDisplay = document.getElementById("today-date-display");
  if(dateDisplay) dateDisplay.textContent = new Date().toLocaleDateString();
  
  setTimeout(() => {
      showSection('home-section');
      initHabits(user);
      initSchedules(user);
  }, 50);
}

function showSection(id) {
    const sections = document.querySelectorAll('.app-main > section');
    sections.forEach(s => s.classList.add('hidden'));
    
    const target = document.getElementById(id);
    if(target) {
        target.classList.remove('hidden');
    }
    
    if(id === 'habit-section') {
        setTimeout(() => document.getElementById("new-habit-input")?.focus(), 100);
    }
    if(id === 'schedule-section') {
        setTimeout(() => document.getElementById("new-schedule-input")?.focus(), 100);
    }
}

function addEnterListener(inputId, buttonId) {
    const input = document.getElementById(inputId);
    if(input) {
        input.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                const btn = document.getElementById(buttonId);
                if(btn) btn.click();
            }
        });
    }
}

/*************************
 * 3. 習慣追蹤
 *************************/
function initHabits(user) {
  const habitList = document.getElementById("habit-list");
  if(!habitList) return;
  
  addEnterListener("new-habit-input", "add-habit-btn");

  const render = () => {
    habitList.innerHTML = "";
    const habits = JSON.parse(localStorage.getItem(`habits_${user}`)) || [];
    const checks = JSON.parse(localStorage.getItem(`checks_${user}`)) || {};
    const today = new Date().toLocaleDateString();

    habits.forEach((h, index) => {
      const li = document.createElement("li");
      const isDone = checks[h] === today;
      if (isDone) li.className = "completed";
      
      li.innerHTML = `
        <span>${h}</span>
        <div class="action-buttons">
            <button class="check-btn" ${isDone ? 'disabled' : ''}>
              ${isDone ? '已完成' : '打卡'}
            </button>
            <button class="delete-btn">刪除</button>
        </div>
      `;
      
      li.querySelector(".check-btn").onclick = () => {
        checks[h] = today;
        localStorage.setItem(`checks_${user}`, JSON.stringify(checks));
        render();
      };

      li.querySelector(".delete-btn").onclick = () => {
          if(confirm(`確定不再追蹤「${h}」這個習慣嗎？`)) {
              habits.splice(index, 1);
              localStorage.setItem(`habits_${user}`, JSON.stringify(habits));
              render();
          }
      };

      habitList.appendChild(li);
    });
  };

  const addBtn = document.getElementById("add-habit-btn");
  if(addBtn) {
      addBtn.onclick = () => {
        const input = document.getElementById("new-habit-input");
        const val = input.value.trim();
        if (val) {
          const habits = JSON.parse(localStorage.getItem(`habits_${user}`)) || [];
          if (!habits.includes(val)) {
            habits.push(val);
            localStorage.setItem(`habits_${user}`, JSON.stringify(habits));
            input.value = "";
            render();
          } else {
            alert("這個習慣已經存在囉！");
          }
        }
      };
  }
  render();
}

/*************************
 * 4. 行程排定 (時間線版 + HH:mm)
 *************************/
function initSchedules(user) {
  const dateInput = document.getElementById("schedule-date-input");
  const timeInput = document.getElementById("schedule-time-input");
  
  if(!dateInput || !timeInput) return;
  
  // 預設日期為今天
  if(!dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
  }

  addEnterListener("new-schedule-input", "add-schedule-btn");

  const render = () => {
    const date = dateInput.value;
    const label = document.getElementById("current-view-date-label");
    if(label) label.textContent = `📅 ${date} 的時間軸`;
    
    const list = document.getElementById("schedule-list");
    list.innerHTML = "";
    
    // 讀取資料
    const all = JSON.parse(localStorage.getItem(`schedules_${user}`)) || {};
    const dayData = all[date] || [];
    
    // 依時間排序 (HH:mm 字串比對即可)
    dayData.sort((a, b) => a.time.localeCompare(b.time));

    dayData.forEach((item, index) => {
      const li = document.createElement("li");
      if (item.done) li.className = "completed-schedule";
      
      li.innerHTML = `
        <div style="display: flex; align-items: center;">
            <span class="time-tag">${item.time}</span>
            <span>${item.text}</span>
        </div>
        <div class="action-buttons">
            <button class="check-btn" ${item.done ? 'disabled' : ''}>${item.done ? '✓' : '完成'}</button>
            <button class="delete-btn">刪除</button>
        </div>
      `;
      
      // 完成
      li.querySelector(".check-btn").onclick = () => {
        item.done = true;
        all[date] = dayData; 
        localStorage.setItem(`schedules_${user}`, JSON.stringify(all));
        render();
      };

      // 刪除
      li.querySelector(".delete-btn").onclick = () => {
        if(confirm("確定刪除此行程？")) {
            dayData.splice(index, 1);
            all[date] = dayData;
            localStorage.setItem(`schedules_${user}`, JSON.stringify(all));
            render();
        }
      };

      list.appendChild(li);
    });
  };

  const addSchBtn = document.getElementById("add-schedule-btn");
  if(addSchBtn) {
      addSchBtn.onclick = () => {
        const inputCtx = document.getElementById("new-schedule-input");
        const text = inputCtx.value.trim();
        const time = timeInput.value; // 取得 HH:mm
        const date = dateInput.value;

        if (text && time) {
          const all = JSON.parse(localStorage.getItem(`schedules_${user}`)) || {};
          if (!all[date]) all[date] = [];
          
          // 儲存格式改為 { time: "14:30", text: "..." }
          all[date].push({ time: time, text, done: false });
          
          localStorage.setItem(`schedules_${user}`, JSON.stringify(all));
          inputCtx.value = "";
          // 不清空時間，方便連續輸入相近時間
          render();
        } else {
            alert("請務必選擇「時間」並輸入「內容」！");
        }
      };
  }

  dateInput.onchange = render;
  render();
}
