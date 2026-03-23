// --- 0. Firebase 설정 ---
const firebaseConfig = {
    apiKey: "AIzaSyCh75DKVXwnar_cUtl40vIzMt2134bxGVo",
    authDomain: "koko-app-d214b.firebaseapp.com",
    projectId: "koko-app-d214b",
    storageBucket: "koko-app-d214b.firebasestorage.app",
    messagingSenderId: "46047540893",
    appId: "1:46047540893:web:e9caf1fc44f9e6742a0674"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();
const ADMIN_UID = "2WlMcOeAJoRHRg28Mqw2oXK0Jia2"; 

// ==========================================
// 🌟 1. 전역 변수 선언
// ==========================================
let myUid = localStorage.getItem('koko_uid') || ('user_' + Date.now());
localStorage.setItem('koko_uid', myUid);
let myNickname = localStorage.getItem('koko_nickname') || '';
let lastChangeDate = null; 

let currentChatMode = 'global'; 
let currentRoomCode = ''; 
let chatUnsubscribe = null;

let todoData = JSON.parse(localStorage.getItem('koko_todo_data'));
if (!todoData) {
    let oldTodos = JSON.parse(localStorage.getItem('koko_todos'));
    if (oldTodos && Array.isArray(oldTodos)) { todoData = { "기본": oldTodos }; } 
    else { todoData = { "기본": [] }; }
    localStorage.setItem('koko_todo_data', JSON.stringify(todoData));
}
let currentTodoFolder = "기본";

let ddays = JSON.parse(localStorage.getItem('koko_ddays')) || [];
let attendance = JSON.parse(localStorage.getItem('koko_attendance')) || { lastDate: "", streak: 0 };
let dailyQuests = { q1: false, q2: false, q3: false }; 

let schedules = JSON.parse(localStorage.getItem('koko_schedules')) || {};
if (Array.isArray(schedules)) schedules = {}; 

let currentCalDate = new Date();
let selectedDateStr = `${currentCalDate.getFullYear()}-${String(currentCalDate.getMonth()+1).padStart(2,'0')}-${String(currentCalDate.getDate()).padStart(2,'0')}`;

const kokoSpeech = document.getElementById('koko-speech');
const kokoChar = document.getElementById('koko');

function syncToCloud() {
    if (auth.currentUser) {
        db.collection('users').doc(auth.currentUser.uid).set({ 
            todoData: todoData, ddays: ddays, schedules: schedules, attendance: attendance
        }, { merge: true });
    }
}

// ==========================================
// 📱 2. UI 동작 로직 
// ==========================================
const sideMenu = document.getElementById('side-menu');
const overlay = document.getElementById('side-menu-overlay');
const closeMenu = () => { if(sideMenu) sideMenu.classList.remove('open'); if(overlay) overlay.style.display = 'none'; };

document.getElementById('menu-open-btn')?.addEventListener('click', () => { if(sideMenu) sideMenu.classList.add('open'); if(overlay) overlay.style.display = 'block'; });
document.getElementById('menu-close-btn')?.addEventListener('click', closeMenu);
document.getElementById('side-menu-overlay')?.addEventListener('click', closeMenu);

const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const targetId = btn.dataset.target;
        if(targetId && document.getElementById(targetId)) document.getElementById(targetId).classList.add('active');
        if(targetId === 'tab-schedule') renderCalendar(); 
    });
});

const chatDrawer = document.getElementById('chat-drawer');
const chatToggleIcon = document.getElementById('chat-toggle-icon');
document.getElementById('chat-header-bar')?.addEventListener('click', () => {
    if(chatDrawer) {
        chatDrawer.classList.toggle('collapsed');
        chatDrawer.classList.toggle('expanded');
        if(chatToggleIcon) chatToggleIcon.innerHTML = chatDrawer.classList.contains('expanded') ? '<img src="icon-down.png" class="ui-icon">' : '<img src="icon-up.png" class="ui-icon">';
        if(chatDrawer.classList.contains('expanded')) { const chatBox = document.getElementById('chat-box'); if(chatBox) chatBox.scrollTop = chatBox.scrollHeight; }
    }
});

// ==========================================
// 📅 3. 캘린더 및 스케줄 로직
// ==========================================
function renderCalendar() {
    const displayObj = document.getElementById('current-month-display');
    if (!displayObj) return; 
    const year = currentCalDate.getFullYear(); const month = currentCalDate.getMonth();
    displayObj.innerText = `${year}년 ${month + 1}월`;
    const firstDay = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid = document.getElementById('calendar-grid'); if(!grid) return;
    grid.innerHTML = '';
    for(let i=0; i<firstDay; i++) grid.innerHTML += `<div class="calendar-day empty"></div>`;
    const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`;
    
    for(let i=1; i<=daysInMonth; i++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        let classes = "calendar-day";
        if(dateStr === todayStr) classes += " today";
        if(dateStr === selectedDateStr) classes += " selected";
        if(schedules[dateStr] && schedules[dateStr].length > 0) classes += " has-schedule"; 
        grid.innerHTML += `<div class="${classes}" onclick="selectDate('${dateStr}')">${i}</div>`;
    }
    renderSchedulesForSelected();
}

window.selectDate = (dateStr) => { selectedDateStr = dateStr; renderCalendar(); };

function renderSchedulesForSelected() {
    const infoObj = document.getElementById('selected-date-info');
    if(infoObj) infoObj.innerText = `선택한 날짜: ${selectedDateStr}`;
    const list = document.getElementById('schedule-list'); if(!list) return;
    list.innerHTML = '';
    const daySchedules = schedules[selectedDateStr] || [];
    
    daySchedules.sort((a, b) => {
        if (a.time === "종일") return -1;
        if (b.time === "종일") return 1;
        return a.time.localeCompare(b.time);
    });

    if(daySchedules.length === 0) { list.innerHTML = `<li style="justify-content:center; color:#aaa;">등록된 일정이 없습니다.</li>`; return; }
    
    daySchedules.forEach((s, i) => { 
        let badgeClass = s.time === "종일" ? "schedule-time-badge allday" : "schedule-time-badge";
        list.innerHTML += `<li><span><span class="${badgeClass}">${s.time}</span> ${s.task}</span><button class="delete-btn" onclick="deleteSchedule(${i})">❌</button></li>`; 
    });
}

document.getElementById('prev-month-btn')?.addEventListener('click', () => { currentCalDate.setMonth(currentCalDate.getMonth() - 1); renderCalendar(); });
document.getElementById('next-month-btn')?.addEventListener('click', () => { currentCalDate.setMonth(currentCalDate.getMonth() + 1); renderCalendar(); });

document.getElementById('add-schedule-btn')?.addEventListener('click', () => {
    const timeObj = document.getElementById('schedule-time-input'); const taskObj = document.getElementById('schedule-task-input');
    if(!timeObj || !taskObj) return;
    let time = timeObj.value; const task = taskObj.value.trim();
    if (!task) { alert("일정 내용을 입력해주세요!"); return; }
    if (!time) time = "종일";
    if(!schedules[selectedDateStr]) schedules[selectedDateStr] = [];
    schedules[selectedDateStr].push({ time: time, task: task });
    localStorage.setItem('koko_schedules', JSON.stringify(schedules));
    timeObj.value = ''; taskObj.value = ''; renderCalendar(); syncToCloud();
});

window.deleteSchedule = i => { schedules[selectedDateStr].splice(i, 1); localStorage.setItem('koko_schedules', JSON.stringify(schedules)); renderCalendar(); syncToCloud(); };

// ==========================================
// 🔐 4. 로그인, 프로필, 피드백 
// ==========================================
document.getElementById('google-login-btn')?.addEventListener('click', () => auth.signInWithPopup(provider));
document.getElementById('logout-btn')?.addEventListener('click', () => auth.signOut());

auth.onAuthStateChanged((user) => {
    if (user) {
        document.getElementById('login-area').style.display = 'none'; document.getElementById('user-profile-area').style.display = 'block'; document.getElementById('user-email-display').innerText = `👋 ${user.email}`;
        myUid = user.uid; 
        if (user.uid === ADMIN_UID) { document.getElementById('admin-feedback-area').style.display = 'block'; loadAdminFeedbacks(); } 
        else { document.getElementById('admin-feedback-area').style.display = 'none'; }

        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                if (data.todoData) { todoData = data.todoData; } 
                else if (data.todos) { todoData = { "기본": data.todos }; }
                if (data.ddays) { ddays = data.ddays; renderDdays(); }
                if (data.schedules) { schedules = data.schedules; }
                if (data.attendance) { attendance = data.attendance; checkAttendanceUI(); }
                
                renderTodoFolders(); renderCalendar(); 
                
                if (data.nickname) { 
                    myNickname = data.nickname; localStorage.setItem('koko_nickname', myNickname); 
                    document.getElementById('nickname-input').value = myNickname; 
                    const statusObj = document.getElementById('profile-status');
                    if(statusObj) { statusObj.innerText = "✅ 동기화 완료"; statusObj.style.color = "#2ecc71"; }
                    enableChat(); 
                }
                if (data.lastNicknameChange) lastChangeDate = data.lastNicknameChange.toDate();
                if(kokoSpeech) kokoSpeech.innerHTML = "동기화 완료! 보고 싶었어요 <img src='icon-cloud.png' class='ui-icon'>";
            } else { syncToCloud(); if(kokoSpeech) kokoSpeech.innerHTML = "환영해요! 데이터를 안전하게 보관할게요 <img src='icon-heart.png' class='ui-icon'>"; }
        });
    } else {
        document.getElementById('login-area').style.display = 'block'; document.getElementById('user-profile-area').style.display = 'none'; document.getElementById('admin-feedback-area').style.display = 'none';
    }
});

document.getElementById('save-nickname-btn')?.addEventListener('click', async () => {
    const nickInput = document.getElementById('nickname-input'); const statusObj = document.getElementById('profile-status');
    if(!nickInput || !statusObj) return;
    const name = nickInput.value.trim(); if (!name || name === myNickname) return;
    if (lastChangeDate) { const diff = (new Date() - lastChangeDate) / 86400000; if (diff < 7) { statusObj.innerText = `⏳ 7일 제한 (${Math.ceil(7 - diff)}일 후 가능)`; statusObj.style.color = "#ff6b6b"; return; } }
    const nameRef = db.collection('nicknames').doc(name); const doc = await nameRef.get();
    if (doc.exists && doc.data().uid !== myUid) { statusObj.innerText = "❌ 사용 중인 이름!"; statusObj.style.color = "#ff6b6b"; return; }

    if (myNickname) await db.collection('nicknames').doc(myNickname).delete();
    await nameRef.set({ uid: myUid }); await db.collection('users').doc(myUid).set({ nickname: name, lastNicknameChange: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    myNickname = name; localStorage.setItem('koko_nickname', myNickname); lastChangeDate = new Date();
    statusObj.innerText = "✅ 변경 완료!"; statusObj.style.color = "#2ecc71"; enableChat();
    if(kokoSpeech) kokoSpeech.innerHTML = `새 이름 "${myNickname}", 맘에 들어요! <img src='icon-chat.png' class='ui-icon'>`;
});

const fontSelect = document.getElementById('font-select'); const sizeSelect = document.getElementById('size-select');
if (localStorage.getItem('koko_font') && fontSelect) { document.body.style.fontFamily = localStorage.getItem('koko_font'); fontSelect.value = localStorage.getItem('koko_font'); }
fontSelect?.addEventListener('change', e => { document.body.style.fontFamily = e.target.value; localStorage.setItem('koko_font', e.target.value); });
if (localStorage.getItem('koko_font_size') && sizeSelect) { document.body.className = localStorage.getItem('koko_font_size'); sizeSelect.value = localStorage.getItem('koko_font_size'); }
sizeSelect?.addEventListener('change', e => { document.body.className = e.target.value; localStorage.setItem('koko_font_size', e.target.value); if(kokoSpeech) kokoSpeech.innerHTML = "글씨 크기 조절 완료! <img src='icon-sparkle.png' class='ui-icon'>"; });

document.getElementById('open-feedback-btn')?.addEventListener('click', () => { closeMenu(); document.getElementById('feedback-modal').style.display = 'flex'; });
document.getElementById('close-feedback-btn')?.addEventListener('click', () => { document.getElementById('feedback-modal').style.display = 'none'; });
document.getElementById('send-feedback-btn')?.addEventListener('click', async () => {
    const txtObj = document.getElementById('feedback-text'); if(!txtObj) return;
    const txt = txtObj.value.trim(); if (!txt) return;
    await db.collection('feedbacks').add({ text: txt, senderUid: myUid, senderNickname: myNickname || '익명', timestamp: firebase.firestore.FieldValue.serverTimestamp() });
    alert("전송 완료! 🐥"); document.getElementById('feedback-modal').style.display = 'none'; txtObj.value = '';
});

function loadAdminFeedbacks() {
    db.collection('feedbacks').orderBy('timestamp', 'desc').onSnapshot(snap => {
        const list = document.getElementById('admin-feedback-list'); if(!list) return; list.innerHTML = '';
        snap.forEach(doc => { const d = doc.data(); list.innerHTML += `<div style="background:white; padding:10px; border-radius:8px;"><div style="font-weight:bold;"><img src="icon-profile.png" class="ui-icon"> ${d.senderNickname}</div><div>${d.text}</div></div>`; });
    });
}

// ==========================================
// 💬 5. 채팅 로직
// ==========================================
function enableChat() { 
    const input = document.getElementById('chat-input'); const btn = document.getElementById('send-chat-btn');
    if(input) { input.disabled = false; input.placeholder = "메시지 입력..."; }
    if(btn) btn.disabled = false; loadMessages(); 
}
if(myNickname) enableChat();

document.getElementById('tab-global')?.addEventListener('click', e => { currentChatMode = 'global'; e.target.classList.add('active'); document.getElementById('tab-room')?.classList.remove('active'); document.getElementById('room-code-area').style.display = 'none'; document.getElementById('megaphone-label').style.display = 'flex'; loadMessages(); });
document.getElementById('tab-room')?.addEventListener('click', e => { currentChatMode = 'room'; e.target.classList.add('active'); document.getElementById('tab-global')?.classList.remove('active'); document.getElementById('room-code-area').style.display = 'flex'; document.getElementById('megaphone-label').style.display = 'none'; document.getElementById('chat-box').innerHTML = '<div style="text-align:center; color:#888; font-size:12px; margin-top:30px;">코드를 입력하고 입장하세요 <img src="icon-lock.png" class="ui-icon"></div>'; if(chatUnsubscribe) chatUnsubscribe(); });
document.getElementById('join-room-btn')?.addEventListener('click', () => { currentRoomCode = document.getElementById('room-code-input').value.trim(); loadMessages(); if(kokoSpeech) kokoSpeech.innerHTML = `"${currentRoomCode}" 방 입장! 쉿! <img src="icon-shh.png" class="ui-icon">`; });

function loadMessages() {
    if (!myNickname) return;
    if (chatUnsubscribe) chatUnsubscribe(); 
    const chatBox = document.getElementById('chat-box'); if(chatBox) chatBox.innerHTML = ''; 
    let queryRef = currentChatMode === 'global' ? db.collection('global_messages') : (currentRoomCode ? db.collection('secret_rooms').doc(currentRoomCode).collection('messages') : null);
    if (!queryRef) return;
    let isInit = true; 

    chatUnsubscribe = queryRef.orderBy('timestamp').onSnapshot(snap => {
        snap.docChanges().forEach(change => {
            if (change.type === 'added') {
                const data = change.doc.data();
                const isMe = data.uid ? (data.uid === myUid) : (data.sender === myNickname);
                const isDeveloper = data.uid === ADMIN_UID;

                const preview = document.getElementById('chat-preview-text');
                if(preview) {
                    const devMark = isDeveloper ? `<img src="icon-wrench.png" class="ui-icon" style="width:12px; height:12px;">` : '';
                    preview.innerHTML = `<img src="icon-chat.png" class="ui-icon"> ${devMark}${data.sender}: ${data.text}`;
                }
                
                const shakeClass = (data.megaphone && !isInit) ? 'shake' : '';
                const msgDiv = document.createElement('div');
                msgDiv.className = `chat-message ${isMe ? 'me' : 'other'} ${data.megaphone ? 'megaphone' : ''} ${shakeClass}`;
                
                if (!isMe) { 
                    const sDiv = document.createElement('div'); sDiv.className = 'chat-sender'; 
                    let devIcon = isDeveloper ? `<img src="icon-wrench.png" class="ui-icon" style="width:12px; height:12px; margin-right:2px; filter: grayscale(100%);">` : '';
                    
                    if (data.megaphone) { sDiv.innerHTML = `${devIcon} <span style="color:#FFFF00; text-shadow: 1px 1px 0px rgba(0,0,0,0.3); font-weight:bold;">${data.sender}</span>`; } 
                    else if (isDeveloper) { sDiv.innerHTML = `${devIcon} <span style="color:#e74c3c; font-weight:bold;">${data.sender}</span>`; } 
                    else { sDiv.innerHTML = `${devIcon} ${data.sender}`; }
                    msgDiv.appendChild(sDiv); 
                }
                const tDiv = document.createElement('div');
                if (data.megaphone) { tDiv.innerHTML = '<img src="icon-mega.png" class="ui-icon"> '; tDiv.appendChild(document.createTextNode(data.text)); } else { tDiv.innerText = data.text; }
                msgDiv.appendChild(tDiv); if(chatBox) chatBox.appendChild(msgDiv);
            }
        });
        isInit = false; if(chatBox) chatBox.scrollTop = chatBox.scrollHeight;
    });
}
document.getElementById('send-chat-btn')?.addEventListener('click', () => {
    const chatInput = document.getElementById('chat-input'); if(!chatInput) return;
    const text = chatInput.value.trim(); if (!text || !myNickname) return;
    const megaCheck = document.getElementById('megaphone-check'); const isMega = megaCheck ? megaCheck.checked : false;
    const data = { text: text, sender: myNickname, uid: myUid, megaphone: isMega, timestamp: firebase.firestore.FieldValue.serverTimestamp() };
    if (currentChatMode === 'global') db.collection('global_messages').add(data); else db.collection('secret_rooms').doc(currentRoomCode).collection('messages').add(data);
    chatInput.value = ''; if(megaCheck) megaCheck.checked = false;
});

// ==========================================
// 🏆 6. 퀘스트, 투두(🌟터치모이 기능 추가), 디데이, 날씨
// ==========================================
function checkAttendanceUI() {
    const todayStr = new Date().toDateString();
    const btn = document.getElementById('attendance-btn');
    const streak = document.getElementById('attendance-streak');
    if(streak) streak.innerText = attendance.streak;
    
    if(btn) {
        if (attendance.lastDate === todayStr) { btn.innerHTML = `오늘 출석 완료! <img src="icon-fire.png" class="ui-icon" style="margin-left:4px;">`; btn.disabled = true; btn.style.backgroundColor = "#aaa"; completeQuest(2); } 
        else { btn.innerHTML = `오늘의 출석체크 도장 찍기 <img src="icon-check.png" class="ui-icon" style="filter: brightness(0) invert(1); margin-left:4px;">`; btn.disabled = false; btn.style.backgroundColor = "#2ecc71"; }
    }
}
document.getElementById('attendance-btn')?.addEventListener('click', () => { const todayStr = new Date().toDateString(); attendance.lastDate = todayStr; attendance.streak += 1; localStorage.setItem('koko_attendance', JSON.stringify(attendance)); syncToCloud(); checkAttendanceUI(); if(kokoSpeech) kokoSpeech.innerHTML = `출석 도장 꾹! 연속 ${attendance.streak}일째! <img src="icon-party.png" class="ui-icon">`; });
function completeQuest(questNum) { if (!dailyQuests[`q${questNum}`]) { dailyQuests[`q${questNum}`] = true; const qObj = document.getElementById(`quest-${questNum}`); if(qObj) qObj.innerHTML = `<span style="color:#2ecc71; font-weight:bold; text-decoration:line-through;"><img src="icon-check.png" class="ui-icon"> 퀘스트 완료!</span>`; if(kokoChar) { kokoChar.style.transform="scale(1.1)"; setTimeout(()=>kokoChar.style.transform="scale(1)",300); } } }
checkAttendanceUI(); 

// 🌟 투두리스트 폴더 로직
function renderTodoFolders() {
    const sel = document.getElementById('todo-folder-select'); if(!sel) return;
    sel.innerHTML = '';
    Object.keys(todoData).forEach(folder => {
        let opt = document.createElement('option'); opt.value = folder; opt.text = `📁 ${folder}`;
        if(folder === currentTodoFolder) opt.selected = true;
        sel.appendChild(opt);
    });
    renderTodos();
}

document.getElementById('todo-folder-select')?.addEventListener('change', (e) => { currentTodoFolder = e.target.value; renderTodos(); });
document.getElementById('add-folder-btn')?.addEventListener('click', () => {
    let name = prompt("새로운 폴더 이름을 입력하세요 (예: 장보기, 공부)");
    if(name && name.trim() !== '') {
        name = name.trim();
        if(!todoData[name]) { todoData[name] = []; currentTodoFolder = name; localStorage.setItem('koko_todo_data', JSON.stringify(todoData)); renderTodoFolders(); syncToCloud(); } 
        else { alert("이미 있는 폴더 이름입니다!"); }
    }
});

document.getElementById('del-folder-btn')?.addEventListener('click', () => {
    if(currentTodoFolder === "기본") { alert("'기본' 폴더는 지울 수 없어요! 🐣"); return; }
    if(todoData[currentTodoFolder].length > 0) { alert("폴더 안에 할 일이 남아있어요! 먼저 다 비워주세요."); return; }
    if(confirm(`"${currentTodoFolder}" 폴더를 정말 지울까요?`)) { delete todoData[currentTodoFolder]; currentTodoFolder = "기본"; localStorage.setItem('koko_todo_data', JSON.stringify(todoData)); renderTodoFolders(); syncToCloud(); }
});

// 🌟 꼬꼬 모이주기 인터랙션 로직
function renderTodos() { 
    const list = document.getElementById('todo-list'); if(!list) return;
    list.innerHTML = ''; let anyChecked = false; 
    let currentList = todoData[currentTodoFolder] || [];
    
    currentList.forEach((t, i) => { 
        list.innerHTML += `<li><label style="cursor:pointer; display:flex; align-items:center; gap:8px;"><input type="checkbox" ${t.checked ? 'checked' : ''} onchange="toggleTodo(${i})"><span style="${t.checked ? 'text-decoration:line-through; color:#aaa;' : ''}">${t.text}</span></label><button class="delete-btn" onclick="deleteTodo(${i})">❌</button></li>`; 
        if (t.checked) anyChecked = true; 
    }); 
    
    // 할일 체크 여부에 따라 꼬꼬 말풍선 노란색으로 변경!
    if(kokoSpeech) {
        if (anyChecked) {
            kokoSpeech.style.backgroundColor = "#ffd070";
            kokoSpeech.innerHTML = "꼬꼬를 터치하여 모이 주기 🌾";
            kokoSpeech.dataset.feedMode = "true";
        } else {
            if(kokoSpeech.dataset.feedMode === "true") {
                kokoSpeech.style.backgroundColor = "white";
                kokoSpeech.dataset.feedMode = "false";
                const h = new Date().getHours();
                kokoSpeech.innerHTML = h<12?"아침 화이팅! <img src='icon-sun.png' class='ui-icon'>":(h<18?"나른한 오후 <img src='icon-cloud.png' class='ui-icon'>":"수고했어요! <img src='icon-moon.png' class='ui-icon'>");
            }
        }
    }
}

document.getElementById('add-todo-btn')?.addEventListener('click', () => { 
    const input = document.getElementById('new-todo-input'); if(!input) return; 
    const txt = input.value.trim(); if (!txt) return; 
    if(!todoData[currentTodoFolder]) todoData[currentTodoFolder] = [];
    todoData[currentTodoFolder].push({ text: txt, checked: false }); 
    localStorage.setItem('koko_todo_data', JSON.stringify(todoData));
    input.value=''; renderTodos(); syncToCloud(); 
});
window.toggleTodo = i => { todoData[currentTodoFolder][i].checked = !todoData[currentTodoFolder][i].checked; localStorage.setItem('koko_todo_data', JSON.stringify(todoData)); renderTodos(); syncToCloud(); if(todoData[currentTodoFolder][i].checked) completeQuest(3); };
window.deleteTodo = i => { todoData[currentTodoFolder].splice(i, 1); localStorage.setItem('koko_todo_data', JSON.stringify(todoData)); renderTodos(); syncToCloud(); };

let currentDdayIndex = -1; let ddayPressTimer = null; let isPressing = false;
window.startDdayPress = (index, event) => { if(event.target.classList.contains('more-btn')) return; isPressing = true; ddayPressTimer = setTimeout(() => { if(isPressing) { ddays[index].pinned = !ddays[index].pinned; renderDdays(); syncToCloud(); if(navigator.vibrate) navigator.vibrate(50); } }, 500); };
window.cancelDdayPress = () => { isPressing = false; if(ddayPressTimer) clearTimeout(ddayPressTimer); };

const ddaySelect = document.getElementById('dday-icon-select');
const optTextFull = { "": "기본", "🎂": "🎂 생일", "🔥": "🔥 마감", "💖": "💖 기념", "✈️": "✈️ 여행", "🎓": "🎓 시험", "🎯": "🎯 목표" };
const optTextShort = { "": "기본", "🎂": "생일", "🔥": "마감", "💖": "기념", "✈️": "여행", "🎓": "시험", "🎯": "목표" };
function updateDdaySelectUI() { if(!ddaySelect) return; Array.from(ddaySelect.options).forEach(opt => { opt.text = opt.selected ? optTextShort[opt.value] : optTextFull[opt.value]; }); }
function openDdaySelectUI() { if(!ddaySelect) return; Array.from(ddaySelect.options).forEach(opt => { opt.text = optTextFull[opt.value]; }); }

if(ddaySelect) { ddaySelect.addEventListener('change', updateDdaySelectUI); ddaySelect.addEventListener('blur', updateDdaySelectUI); ddaySelect.addEventListener('mousedown', openDdaySelectUI); ddaySelect.addEventListener('touchstart', openDdaySelectUI, {passive:true}); updateDdaySelectUI(); }

const ddayDateInput = document.getElementById('dday-date-input');
const dateIconSpan = document.getElementById('date-square-icon');
if(ddayDateInput && dateIconSpan) {
    ddayDateInput.addEventListener('change', () => {
        if(ddayDateInput.value) { dateIconSpan.innerText = '✅'; dateIconSpan.parentElement.style.borderColor = '#2ecc71'; dateIconSpan.parentElement.style.background = '#eafaf1'; } 
        else { dateIconSpan.innerText = '📅'; dateIconSpan.parentElement.style.borderColor = '#ddd'; dateIconSpan.parentElement.style.background = '#f0f4f8'; }
    });
}

function renderDdays() { 
    const list = document.getElementById('dday-list-display'); const banner = document.getElementById('main-dday-banner');
    if(!list || !banner) return; list.innerHTML = ''; 
    if (ddays.length === 0) { banner.innerHTML = `<img src="icon-pin.png" class="ui-icon"> 디데이를 추가해보세요!`; return; } 
    
    ddays = ddays.map(d => ({...d, pinned: d.pinned || false, isMain: d.isMain || false, icon: d.icon || ''}));
    const today = new Date(); today.setHours(0,0,0,0); 
    
    let calc = ddays.map((d, i) => { const t = new Date(d.date); t.setHours(0,0,0,0); return { ...d, originalIndex: i, diff: Math.ceil((t-today)/86400000) }; }); 
    calc.sort((a, b) => { if (a.pinned === b.pinned) return a.diff - b.diff; return a.pinned ? -1 : 1; });

    calc.forEach((d) => { 
        let badgeText = d.diff === 0 ? `D-Day<img src="icon-party.png" class="ui-icon" style="margin-left:2px;">` : (d.diff > 0 ? `D-${d.diff}` : `D+${Math.abs(d.diff)}`); 
        let badgeColor = d.diff === 0 ? "#ff6b6b" : (d.diff > 0 ? "#ff9f43" : "#888");
        let badge = `<span style="color:${badgeColor}; font-weight:bold; font-size:14px;">${badgeText}</span>`;
        let pinIcon = d.pinned ? `<img src="icon-pin.png" class="ui-icon" style="width:14px; height:14px;"> ` : '';
        let customIcon = d.icon ? `<span style="margin-left:4px; font-size:14px;">${d.icon}</span>` : '';
        
        let li = document.createElement('li');
        li.innerHTML = `<div style="display:flex; flex-direction:column; gap:4px;"><div style="display:flex; align-items:center; gap:6px;">${pinIcon}<strong style="font-size:14px;">${d.title}</strong><div style="display:flex; align-items:center;">${badge}${customIcon}</div></div><span style="font-size:11px; color:#888;">${d.date}</span></div><button class="more-btn" onclick="openDdayMenu(${d.originalIndex}, event)">⋮</button>`;
        li.addEventListener('mousedown', (e) => startDdayPress(d.originalIndex, e)); li.addEventListener('touchstart', (e) => startDdayPress(d.originalIndex, e), {passive: true});
        li.addEventListener('mouseup', cancelDdayPress); li.addEventListener('mouseleave', cancelDdayPress); li.addEventListener('touchend', cancelDdayPress); li.addEventListener('touchcancel', cancelDdayPress);
        list.appendChild(li);
    }); 

    let mainDday = calc.find(d => d.isMain);
    if(!mainDday) { let upcoming = calc.filter(d => d.diff >= 0).sort((a,b) => a.diff - b.diff); mainDday = upcoming.length > 0 ? upcoming[0] : calc[0]; }
    let mainBadgeText = mainDday.diff === 0 ? `D-Day!` : (mainDday.diff > 0 ? `D-${mainDday.diff}` : `D+${Math.abs(mainDday.diff)}`);
    let crownIcon = mainDday.isMain ? `<img src="icon-crown.png" class="ui-icon"> ` : `<img src="icon-pin.png" class="ui-icon"> `;
    let mainCustomIcon = mainDday.icon ? ` <span style="font-size:14px;">${mainDday.icon}</span>` : '';
    banner.innerHTML = `${crownIcon} ${mainDday.title} ${mainBadgeText}${mainCustomIcon}`; 
}

document.getElementById('save-dday-btn')?.addEventListener('click', () => { 
    const tObj = document.getElementById('dday-title-input'); const dObj = document.getElementById('dday-date-input'); const iObj = document.getElementById('dday-icon-select');
    if(!tObj || !dObj) return; const t = tObj.value.trim(); const d = dObj.value; const iconVal = iObj ? iObj.value : '';
    if(t && d){ 
        ddays.push({title: t, date: d, pinned: false, isMain: false, icon: iconVal}); renderDdays(); syncToCloud(); 
        tObj.value=''; dObj.value=''; if(iObj) iObj.value=''; updateDdaySelectUI();
        if(dateIconSpan) { dateIconSpan.innerText = '📅'; dateIconSpan.parentElement.style.borderColor = '#ddd'; dateIconSpan.parentElement.style.background = '#f0f4f8'; }
    } else { alert("제목과 날짜를 모두 입력해주세요! 🐥"); }
});

window.openDdayMenu = (index, event) => {
    currentDdayIndex = index; const menu = document.getElementById('dday-dropdown'); if(!menu) return;
    const rect = event.target.getBoundingClientRect();
    menu.style.display = 'flex'; menu.style.top = `${rect.bottom + window.scrollY}px`; menu.style.left = `${rect.left - 100}px`; 
};
document.getElementById('dday-main-btn')?.addEventListener('click', () => { ddays.forEach(d => d.isMain = false); ddays[currentDdayIndex].isMain = true; renderDdays(); syncToCloud(); document.getElementById('dday-dropdown').style.display = 'none'; if(kokoSpeech) kokoSpeech.innerHTML = `"${ddays[currentDdayIndex].title}" 대표 지정 완료! <img src="icon-crown.png" class="ui-icon">`; });
document.getElementById('dday-del-btn')?.addEventListener('click', () => { ddays.splice(currentDdayIndex, 1); renderDdays(); syncToCloud(); document.getElementById('dday-dropdown').style.display = 'none'; });
document.addEventListener('click', (e) => { const menu = document.getElementById('dday-dropdown'); if (menu && menu.style.display === 'flex' && !e.target.classList.contains('more-btn')) menu.style.display = 'none'; });

renderDdays();

function getKokoWeather() { if(navigator.geolocation) { navigator.geolocation.getCurrentPosition(p=>{ fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.coords.latitude}&longitude=${p.coords.longitude}&current_weather=true`).then(r=>r.json()).then(d=>{ const wInfo = document.querySelector('.weather-info'); if(wInfo) wInfo.innerHTML=`<img src="${d.current_weather.weathercode<=1?'icon-sun.png':(d.current_weather.weathercode<=45?'icon-cloud.png':'icon-rain.png')}" class="ui-icon"> ${d.current_weather.temperature}°C`; }); }); } }
getKokoWeather();

const fortunes = ["행운 컬러: 노랑💛", "기분 좋은 일 발생!✨", "소중한 사람에게 연락해봐요💌", "금전운 최고!💰"];
document.getElementById('fortune-btn')?.addEventListener('click', () => { 
    // 모이주기 모드일 때는 운세 버튼도 막기 (선택사항이지만 자연스럽게)
    if(kokoSpeech && kokoSpeech.dataset.feedMode === "true") return; 
    if(kokoSpeech) kokoSpeech.innerText = fortunes[Math.floor(Math.random()*fortunes.length)]; 
    if(kokoChar) { kokoChar.style.transform="translateY(-20px)"; setTimeout(()=>kokoChar.style.transform="translateY(0)",200); } 
});

// 🌟 대망의 꼬꼬 클릭 로직 (모이주기 상호작용 적용)
kokoChar?.addEventListener('click', () => { 
    if (kokoSpeech && kokoSpeech.dataset.feedMode === "true") {
        // 모이 먹기 액션 발동!
        kokoSpeech.style.backgroundColor = "white";
        kokoSpeech.innerHTML = "냠냠! 너무 맛있어요 <img src='icon-100.png' class='ui-icon'>";
        kokoSpeech.dataset.feedMode = "false";
        
        // 체크된 할 일 삭제
        if (todoData[currentTodoFolder]) {
            todoData[currentTodoFolder] = todoData[currentTodoFolder].filter(t => !t.checked);
            localStorage.setItem('koko_todo_data', JSON.stringify(todoData));
            syncToCloud();
        }
        
        if(kokoChar) { kokoChar.style.transform="scale(1.2)"; setTimeout(()=>kokoChar.style.transform="scale(1)", 300); }
        
        setTimeout(() => {
            renderTodos();
            if(kokoSpeech) kokoSpeech.innerHTML = "다음 할 일도 화이팅! <img src='icon-chick.png' class='ui-icon'>";
        }, 2000);
        return; // 모이주기가 발동되면 아래 기본 클릭 액션은 무시함
    }

    // 기본 클릭 액션 (쓰다듬기)
    completeQuest(1); 
    const h=new Date().getHours(); 
    if(kokoSpeech) kokoSpeech.innerHTML= h<12?"아침 화이팅! <img src='icon-sun.png' class='ui-icon'>":(h<18?"나른한 오후 <img src='icon-cloud.png' class='ui-icon'>":"수고했어요! <img src='icon-moon.png' class='ui-icon'>"); 
    if(kokoChar) { kokoChar.style.transform="translateY(-20px)"; setTimeout(()=>kokoChar.style.transform="translateY(0)",200); } 
});

// ==========================================
// 🎮 7. 꼬꼬 게임 (달걀 지뢰찾기) 로직
// ==========================================
document.getElementById('open-game-btn')?.addEventListener('click', () => { closeMenu(); document.getElementById('game-modal').style.display = 'flex'; initMinesweeper(); });
document.getElementById('close-game-btn')?.addEventListener('click', () => { document.getElementById('game-modal').style.display = 'none'; });
document.getElementById('reset-game-btn')?.addEventListener('click', () => { initMinesweeper(); });

let mineBoard = []; let mineRevealed = []; let mineGameOver = false; let safeCellsCount = 0; const MINE_SIZE = 6; const MINES_COUNT = 5;

function initMinesweeper() {
    const grid = document.getElementById('minesweeper-grid'); if(!grid) return; grid.innerHTML = '';
    document.getElementById('game-status').innerText = `안전한 달걀을 찾아주세요! (폭탄 ${MINES_COUNT}개)`; document.getElementById('game-status').style.color = "#555";
    mineBoard = Array(MINE_SIZE).fill().map(()=>Array(MINE_SIZE).fill(0)); mineRevealed = Array(MINE_SIZE).fill().map(()=>Array(MINE_SIZE).fill(false));
    mineGameOver = false; safeCellsCount = (MINE_SIZE * MINE_SIZE) - MINES_COUNT;
    let placed = 0; while(placed < MINES_COUNT) { let r = Math.floor(Math.random()*MINE_SIZE); let c = Math.floor(Math.random()*MINE_SIZE); if(mineBoard[r][c] !== 'M') { mineBoard[r][c] = 'M'; placed++; } }
    for(let r=0; r<MINE_SIZE; r++) { for(let c=0; c<MINE_SIZE; c++) { if(mineBoard[r][c] === 'M') continue; let count=0; for(let dr=-1; dr<=1; dr++){ for(let dc=-1; dc<=1; dc++){ let nr=r+dr, nc=c+dc; if(nr>=0 && nr<MINE_SIZE && nc>=0 && nc<MINE_SIZE && mineBoard[nr][nc]==='M') count++; } } mineBoard[r][c] = count; } }
    for(let r=0; r<MINE_SIZE; r++) { for(let c=0; c<MINE_SIZE; c++) { let cell = document.createElement('div'); cell.className = 'mine-cell'; cell.id = `mine-${r}-${c}`; cell.innerText = '🥚'; cell.addEventListener('click', () => revealMine(r,c)); grid.appendChild(cell); } }
}

function revealMine(r, c) {
    if(mineGameOver || mineRevealed[r][c]) return;
    mineRevealed[r][c] = true; let cell = document.getElementById(`mine-${r}-${c}`); cell.classList.add('revealed');
    
    if(mineBoard[r][c] === 'M') {
        cell.innerText = '💥'; mineGameOver = true;
        document.getElementById('game-status').innerText = "앗! 상한 달걀이에요! 😭"; document.getElementById('game-status').style.color = "#e74c3c";
        for(let ir=0; ir<MINE_SIZE; ir++){ for(let ic=0; ic<MINE_SIZE; ic++){ if(mineBoard[ir][ic]==='M' && !mineRevealed[ir][ic]) { let c = document.getElementById(`mine-${ir}-${ic}`); c.innerText = '💥'; c.classList.add('revealed'); } } }
    } else {
        safeCellsCount--; cell.innerText = mineBoard[r][c] > 0 ? mineBoard[r][c] : '';
        if(mineBoard[r][c] === 0) { for(let dr=-1; dr<=1; dr++){ for(let dc=-1; dc<=1; dc++){ let nr=r+dr, nc=c+dc; if(nr>=0 && nr<MINE_SIZE && nc>=0 && nc<MINE_SIZE) revealMine(nr,nc); } } }
        if(safeCellsCount === 0) { mineGameOver = true; document.getElementById('game-status').innerText = "대성공! 맛있는 달걀을 다 찾았어요! 🐣✨"; document.getElementById('game-status').style.color = "#2ecc71"; if(kokoSpeech) kokoSpeech.innerHTML = "와! 지뢰찾기 고수시네요! <img src='icon-party.png' class='ui-icon'>"; }
    }
}

console.log("🛠️ 껌딱지 꼬꼬 V3.0 로드 완료! (터치 모이주기 인터랙션 적용, 팝업버튼 오버플로우 수정)");
// --- 파일 끝 ---