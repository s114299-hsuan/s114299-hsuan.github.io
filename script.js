// --- Helper Functions for Date and Storage ---

// 取得今日日期字串 (YYYYMMDD 格式) 以便比較
function getTodayDateString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // 月份從 0 開始
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
}

// 取得所有習慣的打卡紀錄
function getHabitCheckinData() {
    const data = localStorage.getItem('dailyHabitTracker');
    return data ? JSON.parse(data) : {};
}

// 儲存習慣的打卡紀錄
function saveHabitCheckinData(data) {
    localStorage.setItem('dailyHabitTracker', JSON.stringify(data));
}

// 取得所有習慣列表 (持久化儲存，新增後不會消失)
function getHabitsList() {
    return JSON.parse(localStorage.getItem('habitsList')) || ["晨讀 30 分鐘", "喝水 8 杯", "完成期末專題"]; // 預設的習慣
}

// 儲存習慣列表
function saveHabitsList(habits) {
    localStorage.setItem('habitsList', JSON.stringify(habits));
}


// --- 核心渲染與邏輯功能 ---

// 建立單個習慣項目 (包含所有邏輯)
function createHabitListItem(text) {
    const todayStr = getTodayDateString();
    const habitData = getHabitCheckinData();
    const lastCheckInDate = habitData[text];
    const isCheckedInToday = lastCheckInDate === todayStr;

    const listItem = document.createElement('li');
    listItem.innerHTML = `${text} <button class="check-btn"></button>`;
    
    const checkBtn = listItem.querySelector('.check-btn');

    // 設定初始狀態
    if (isCheckedInToday) {
        checkBtn.textContent = '已打卡';
        checkBtn.disabled = true;
        listItem.classList.add('completed');
    } else {
        checkBtn.textContent = '打卡';
        checkBtn.disabled = false;
        listItem.classList.remove('completed');
    }

    // 打卡按鈕點擊事件
    checkBtn.addEventListener('click', () => {
        if (!checkBtn.disabled) {
            // 執行打卡動作
            const updatedData = getHabitCheckinData();
            updatedData[text] = todayStr;
            saveHabitCheckinData(updatedData);
            
            // 更新 UI
            checkBtn.textContent = '已打卡';
            checkBtn.disabled = true;
            listItem.classList.add('completed');
            alert(`習慣: "${text}" 已打卡成功！明天見！`);
        }
        // 如果按鈕已被禁用，則不執行任何操作
    });
    
    return listItem;
}

// 渲染所有習慣列表
function renderHabits() {
    const habitList = document.getElementById('habit-list');
    habitList.innerHTML = ''; // 清空現有的列表
    
    const habits = getHabitsList();
    habits.forEach(habitText => {
        const listItem = createHabitListItem(habitText);
        habitList.appendChild(listItem);
    });
}


// 建立單個行程項目 (不移除，只標記完成)
function createScheduleListItem(text) {
    const listItem = document.createElement('li');
    listItem.innerHTML = `${text} <button class="schedule-done-btn">完成</button>`;
    
    const doneBtn = listItem.querySelector('.schedule-done-btn');

    // 行程完成按鈕點擊事件 (不刪除，只切換完成狀態)
    doneBtn.addEventListener('click', () => {
        listItem.classList.toggle('completed-schedule'); // 切換完成樣式
        
        // 根據狀態切換按鈕文字
        if (listItem.classList.contains('completed-schedule')) {
            doneBtn.textContent = '已完成';
            alert(`行程: "${text}" 已標記完成！`);
        } else {
            doneBtn.textContent = '完成';
            alert(`行程: "${text}" 取消標記完成。`);
        }
    });
    
    return listItem;
}

// 渲染所有行程列表 (為了簡單，這裡假設行程不會被持久化，每次載入都顯示預設)
function renderSchedules() {
    const scheduleList = document.getElementById('schedule-list');
    scheduleList.innerHTML = ''; // 清空列表
    
    // 預設行程
    const defaultSchedules = ["[10:00] 寫期末報告", "[14:30] 運動"];
    
    defaultSchedules.forEach(scheduleText => {
        const listItem = createScheduleListItem(scheduleText);
        scheduleList.appendChild(listItem);
    });
}

// --- 區塊切換功能 ---
function showSection(id) {
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('hidden');
        section.classList.remove('active');
    });
    document.getElementById(id).classList.remove('hidden');
    document.getElementById(id).classList.add('active');
}


// --- 網站初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    // 預設顯示 'home' 區塊
    showSection('home'); 

    // 初始渲染習慣和行程
    renderHabits();
    renderSchedules();

    // ------------------------------------
    // 習慣追蹤功能 - 新增按鈕邏輯
    // ------------------------------------
    const addHabitBtn = document.getElementById('add-habit-btn');
    const newHabitInput = document.getElementById('new-habit-input');

    addHabitBtn.addEventListener('click', () => {
        const text = newHabitInput.value.trim();
        if (text) {
            // 1. 更新 localStorage 中的習慣列表
            const habits = getHabitsList();
            if (!habits.includes(text)) { // 避免重複加入
                habits.push(text);
                saveHabitsList(habits);
                
                // 2. 重新渲染整個列表 (包括新項目)
                renderHabits();
                
                newHabitInput.value = ''; // 清空輸入框
                alert(`習慣 "${text}" 已加入清單！`);
            } else {
                 alert(`習慣 "${text}" 已存在！`);
            }
        }
    });

    // ------------------------------------
    // 行程排定功能 - 新增按鈕邏輯
    // ------------------------------------
    const addScheduleBtn = document.getElementById('add-schedule-btn');
    const newScheduleInput = document.getElementById('new-schedule-input');
    const scheduleList = document.getElementById('schedule-list');

    addScheduleBtn.addEventListener('click', () => {
        const text = newScheduleInput.value.trim();
        if (text) {
            // 這裡我們直接在 DOM 上新增，因為我們沒有為行程做 localStorage 持久化
            const listItem = createScheduleListItem(text); 
            scheduleList.appendChild(listItem);
            newScheduleInput.value = ''; // 清空輸入框
        }
    });
    // ------------------------------------
    
});
