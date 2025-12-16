// --- 1. 區塊切換功能 ---
function showSection(id) {
    // 隱藏所有區塊
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('hidden');
        section.classList.remove('active');
    });

    // 顯示目標區塊
    document.getElementById(id).classList.remove('hidden');
    document.getElementById(id).classList.add('active');
}

// 網站載入時，預設顯示 'home' 區塊
document.addEventListener('DOMContentLoaded', () => {
    showSection('home'); 

    // --- 2. 習慣追蹤功能 ---
    const addHabitBtn = document.getElementById('add-habit-btn');
    const newHabitInput = document.getElementById('new-habit-input');
    const habitList = document.getElementById('habit-list');

    addHabitBtn.addEventListener('click', () => {
        const text = newHabitInput.value.trim();
        if (text) {
            const listItem = document.createElement('li');
            listItem.innerHTML = `${text} <button class="check-btn">打卡</button>`;
            habitList.appendChild(listItem);
            newHabitInput.value = ''; // 清空輸入框

            // 為新的打卡按鈕添加事件
            listItem.querySelector('.check-btn').addEventListener('click', (e) => {
                e.target.parentElement.classList.toggle('completed'); // 切換完成樣式 (需要搭配 CSS)
                alert(`習慣: "${text}" 已打卡!`);
            });
        }
    });

    // --- 3. 行程排定功能 ---
    const addScheduleBtn = document.getElementById('add-schedule-btn');
    const newScheduleInput = document.getElementById('new-schedule-input');
    const scheduleList = document.getElementById('schedule-list');

    addScheduleBtn.addEventListener('click', () => {
        const text = newScheduleInput.value.trim();
        if (text) {
            const listItem = document.createElement('li');
            // 可以添加刪除按鈕
            listItem.innerHTML = `${text} <button class="check-btn">完成</button>`; 
            scheduleList.appendChild(listItem);
            newScheduleInput.value = ''; // 清空輸入框

            // 為新的完成按鈕添加事件
            listItem.querySelector('.check-btn').addEventListener('click', (e) => {
                e.target.parentElement.remove(); // 移除該行程
                alert(`行程: "${text}" 已完成並移除!`);
            });
        }
    });

    // 初始設定現有的打卡/完成按鈕事件 (如果您在 HTML 裡有預設項目)
    document.querySelectorAll('#habit-list .check-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
             e.target.parentElement.classList.toggle('completed');
             alert(`習慣已打卡!`);
        });
    });
    
    document.querySelectorAll('#schedule-list .check-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
             e.target.parentElement.remove();
             alert(`行程已完成並移除!`);
        });
    });

});
