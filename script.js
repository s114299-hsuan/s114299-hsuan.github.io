/*************************
 * 1. 加密與資料管理
 *************************/
async function hashPassword(password) {
  if (!window.crypto || !window.crypto.subtle) {
    return "dev_mode_" + password;
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
 * 2. 登入、註冊與導覽邏輯
 *************************/
document.addEventListener("DOMContentLoaded", () => {
  const currentUser = storage.getCurrentUser();
  if (currentUser) showApp(currentUser);

  // 支援 Enter 鍵登入
  addEnterListener("password", "login-btn");

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
      msg.style.color = "red"; // 修正：錯誤訊息顏色
      return msg.textContent = "帳號或密碼錯誤";
    }
    
    localStorage.setItem("currentUser", u);
    location.reload(); // 修正：登入後直接刷新確保乾淨狀態
  };

  // 登出
  document.getElementById("logout-btn").onclick = () => {
    localStorage.removeItem("currentUser");
    location.reload();
  };

  // --- 新功能：註銷帳號 ---
  const deleteAccountBtn = document.getElementById("delete-account-btn");
  if(deleteAccountBtn) {
      deleteAccountBtn.onclick = () => {
          const user = storage.getCurrentUser();
          if(!user) return;
          
          const confirmDelete = confirm(`⚠️ 警告：確定要永久刪除「${user}」的帳號嗎？\n所有的習慣與行程資料都將消失，無法復原！`);
          
          if(confirmDelete) {
              // 1. 刪除使用者列表中的帳號
              const users = storage.getUsers();
              delete users[user];
              storage.saveUsers(users);

              // 2. 刪除該使用者的專屬資料
              localStorage.removeItem(`habits_${user}`);
              localStorage.removeItem(`checks_${user}`);
              localStorage.removeItem(`schedules_${user}`);

              // 3. 清除登入狀態並登出
              localStorage.removeItem("currentUser");
              alert("帳號已註銷。");
              location.reload();
          }
      };
  }
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

// 輔助函式：綁定 Enter 鍵觸發按鈕
function addEnterListener(inputId, buttonId) {
    const input = document.getElementById(inputId);
    if(input) {
        input.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                document.getElementById(buttonId).click();
            }
        });
    }
}

/*************************
 * 3. 核心功能：習慣追蹤 (含刪除功能)
 *************************/
function initHabits(user) {
  const habitList = document.getElementById("habit-list");
  
  // 支援 Enter 新增習慣
  addEnterListener("new-habit-input", "add-habit-btn");

  const render = () => {
    habitList.innerHTML = "";
    const habits = JSON.parse(localStorage.getItem(`habits_${user}`)) || [];
    const checks = JSON.parse(localStorage.getItem(`checks_${user}`)) || {};
    const today = new Date().toLocaleDateString();

    habits.forEach((h, index) => { // 加入 index 用於刪除
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
      
      // 打卡功能
      li.querySelector(".check-btn").onclick = () => {
        checks[h] = today;
        localStorage.setItem(`checks_${user}`, JSON.stringify(checks));
        render();
      };

      // --- 新功能：刪除習慣 ---
      li.querySelector(".delete-btn").onclick = () => {
          if(confirm(`確定不再追蹤「${h}」這個習慣嗎？`)) {
              habits.splice(index, 1); // 從陣列移除
              // 可選：也要刪除這個習慣的打卡紀錄嗎？這裡暫時保留紀錄以免誤刪
              localStorage.setItem(`habits_${user}`, JSON.stringify(habits));
              render();
          }
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
      } else {
        alert("這個習慣已經存在囉！");
      }
    }
  };
  render();
}

/*************************
 * 4. 核心功能：行程排定 (含刪除功能)
 *************************/
function initSchedules(user) {
  const dateInput = document.getElementById("schedule-date-input");
  dateInput.value = new Date().toISOString().split('T')[0];

  // 支援 Enter 新增行程
  addEnterListener("new-schedule-input", "add-schedule-btn");

  const render = () => {
    const date = dateInput.value;
    document.getElementById("current-view-date-label").textContent = `📅 ${date} 的清單`;
    const list = document.getElementById("schedule-list");
    list.innerHTML = "";
    
    const all = JSON.parse(localStorage.getItem(`schedules_${user}`)) || {};
    const dayData = all[date] || [];
    
    // 注意：sort 會改變陣列順序，為了正確刪除，我們先排序顯示，但刪除時要對應正確的資料
    // 簡單解法：直接操作排序後的 dayData，然後存回 all[date]
    dayData.sort((a,b) => a.hour - b.hour);

    dayData.forEach((item, index) => {
      const li = document.createElement("li");
      if (item.done) li.className = "completed-schedule";
      
      li.innerHTML = `
        <span><b>${String(item.hour).padStart(2, '0')}:00</b> - ${item.text}</span>
        <div class="action-buttons">
            <button class="check-btn" ${item.done ? 'disabled' : ''}>${item.done ? '已完成' : '完成'}</button>
            <button class="delete-btn">刪除</button>
        </div>
      `;
      
      // 完成行程
      li.querySelector(".check-btn").onclick = () => {
        item.done = true;
        // 雖然 dayData 已經排序過，但因為物件是 reference，直接修改 item.done 有效
        // 但為了保險起見，我們將 dayData 寫回 all[date]
        all[date] = dayData; 
        localStorage.setItem(`schedules_${user}`, JSON.stringify(all));
        render();
      };

      // --- 新功能：刪除行程 ---
      li.querySelector(".delete-btn").onclick = () => {
        if(confirm("確定刪除此行程？")) {
            dayData.splice(index, 1); // 移除該項目
            all[date] = dayData;      // 更新當天資料
            localStorage.setItem(`schedules_${user}`, JSON.stringify(all));
            render();
        }
      };

      list.appendChild(li);
    });
  };

  document.getElementById("add-schedule-btn").onclick = () => {
    const inputCtx = document.getElementById("new-schedule-input");
    const inputHour = document.getElementById("schedule-hour-input");
    const text = inputCtx.value.trim();
    const hour = inputHour.value;
    const date = dateInput.value;

    if (text && hour !== "") {
      const all = JSON.parse(localStorage.getItem(`schedules_${user}`)) || {};
      if (!all[date]) all[date] = [];
      
      // 檢查是否同一個小時已經有行程 (選擇性功能，這裡先允許重疊)
      all[date].push({ hour: parseInt(hour), text, done: false });
      
      localStorage.setItem(`schedules_${user}`, JSON.stringify(all));
      inputCtx.value = "";
      // hour 不清空，方便連續輸入
      render();
    } else {
        alert("請輸入小時與內容！");
    }
  };

  dateInput.onchange = render;
  render();
}
