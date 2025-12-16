// ================================
// 工具：日期與 localStorage
// ================================
function getTodayDateString() {
    const d = new Date();
    return d.getFullYear() +
        String(d.getMonth() + 1).padStart(2, '0') +
        String(d.getDate()).padStart(2, '0');
}

// ================================
// 習慣資料處理
// ================================
function getHabits() {
    return JSON.parse(localStorage.getItem("habitsData")) || [
        { text: "晨讀 30 分鐘", streak: 0, lastDate: null },
        { text: "喝水 8 杯", streak: 0, lastDate: null }
    ];
}

function saveHabits(data) {
    localStorage.setItem("habitsData", JSON.stringify(data));
}

// ================================
// 渲染習慣
// ================================
function renderHabits() {
    const list = document.getElementById("habit-list");
    list.innerHTML = "";
    const today = getTodayDateString();

    getHabits().forEach((habit, index) => {
        const li = document.createElement("li");

        if (habit.lastDate === today) li.classList.add("completed");

        li.innerHTML = `
          <span>
            ${habit.text}
            <small>🔥 連續 ${habit.streak} 天</small>
          </span>
          <div>
            <button class="check-btn">打卡</button>
            <button class="delete-btn">✕</button>
          </div>
        `;

        const checkBtn = li.querySelector(".check-btn");
        const deleteBtn = li.querySelector(".delete-btn");

        if (habit.lastDate === today) {
            checkBtn.textContent = "已完成";
            checkBtn.disabled = true;
        }

        checkBtn.onclick = () => {
            const habits = getHabits();
            if (habit.lastDate === today) return;

            habit.streak = habit.lastDate === today - 1 ? habit.streak + 1 : habit.streak + 1;
            habit.lastDate = today;
            habits[index] = habit;
            saveHabits(habits);
            renderHabits();
        };

        deleteBtn.onclick = () => {
            const habits = getHabits();
            habits.splice(index, 1);
            saveHabits(habits);
            renderHabits();
        };

        list.appendChild(li);
    });
}

// ================================
// 行程資料（含日期與時間）
// ================================
function getSchedules() {
    return JSON.parse(localStorage.getItem("scheduleList")) || [];
}

function saveSchedules(data) {
    localStorage.setItem("scheduleList", JSON.stringify(data));
}

// ================================
// 渲染行程（依日期＋時間排序）
// ================================
function renderSchedules() {
    const list = document.getElementById("schedule-list");
    list.innerHTML = "";

    const schedules = getSchedules();

    schedules
        .sort((a, b) => {
            const aTime = new Date(`${a.date}T${a.time}`);
            const bTime = new Date(`${b.date}T${b.time}`);
            return aTime - bTime;
        })
        .forEach((item, index) => {
            const li = document.createElement("li");

            const span = document.createElement("span");
            span.textContent = `[${item.date} ${item.time}] ${item.text}`;

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "刪除";
            deleteBtn.className = "delete-btn";

            deleteBtn.onclick = () => {
                const data = getSchedules();
                data.splice(index, 1);   // 刪除對應行程
                saveSchedules(data);
                renderSchedules();
            };

            li.appendChild(span);
            li.appendChild(deleteBtn);
            list.appendChild(li);
        });
}

// ================================
// 新增行程（可選未來日期）
// ================================
document.getElementById("add-schedule-btn").onclick = () => {
    const date = document.getElementById("schedule-date").value;
    const time = document.getElementById("schedule-time").value;
    const text = document.getElementById("new-schedule-input").value.trim();

    if (!date || !time || !text) return;

    const schedules = getSchedules();
    schedules.push({ date, time, text });
    saveSchedules(schedules);

    document.getElementById("new-schedule-input").value = "";
    renderSchedules();
};

// ================================
// 分頁切換
// ================================
function showSection(id) {
    document.querySelectorAll("main section").forEach(sec => {
        sec.classList.add("hidden");
        sec.classList.remove("active");
    });
    document.getElementById(id).classList.remove("hidden");
    document.getElementById(id).classList.add("active");
}

// ================================
// 初始化
// ================================
document.addEventListener("DOMContentLoaded", () => {
    showSection("home");
    renderHabits();
    renderSchedules();

    document.getElementById("add-habit-btn").onclick = () => {
        const input = document.getElementById("new-habit-input");
        if (!input.value.trim()) return;
        const habits = getHabits();
        habits.push({ text: input.value, streak: 0, lastDate: null });
        saveHabits(habits);
        input.value = "";
        renderHabits();
    };

    document.getElementById("add-schedule-btn").onclick = () => {
        const input = document.getElementById("new-schedule-input");
        if (!input.value.trim()) return;
        const schedules = getSchedules();
        schedules.push(input.value);
        saveSchedules(schedules);
        input.value = "";
        renderSchedules();
    };
});

