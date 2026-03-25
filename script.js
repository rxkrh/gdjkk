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

let currentChatMode = 'global'; let currentRoomCode = ''; let chatUnsubscribe = null;

let todoData = JSON.parse(localStorage.getItem('koko_todo_data')) || { "기본": [] };
let currentTodoFolder = "기본";
let vocabData = JSON.parse(localStorage.getItem('koko_vocab_data')) || { "기본": [] };
let currentVocabFolder = "기본";
let isVocabBlindMode = false;

let ddays = JSON.parse(localStorage.getItem('koko_ddays')) || [];
let attendance = JSON.parse(localStorage.getItem('koko_attendance')) || { lastDate: "", streak: 0 };
let dailyQuests = { q1: false, q2: false, q3: false }; 
let schedules = JSON.parse(localStorage.getItem('koko_schedules')) || {};

let currentCalDate = new Date();
let selectedDateStr = `${currentCalDate.getFullYear()}-${String(currentCalDate.getMonth()+1).padStart(2,'0')}-${String(currentCalDate.getDate()).padStart(2,'0')}`;

const kokoSpeech = document.getElementById('koko-speech');
const kokoChar = document.getElementById('koko');

function syncToCloud() {
    if (auth.currentUser) {
        db.collection('users').doc(auth.currentUser.uid).set({ 
            todoData: todoData, vocabData: vocabData, ddays: ddays, schedules: schedules, attendance: attendance 
        }, { merge: true });
    }
}

function loadCustomFonts() {
    let customFonts = JSON.parse(localStorage.getItem('koko_custom_fonts')) || [];
    const select = document.getElementById('font-select');
    customFonts.forEach(f => {
        const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = f.url; document.head.appendChild(link);
        if(select) { const opt = document.createElement('option'); opt.value = `'${f.name}', sans-serif`; opt.text = `✨ ${f.name}`; select.appendChild(opt); }
    });
}
loadCustomFonts();

// 🌟 상단 퀵 메뉴 관리 로직
const shortcuts = JSON.parse(localStorage.getItem('koko_shortcuts')) || { weather: true, fortune: true, game: false };
function applyShortcuts() {
    document.getElementById('icon-weather').style.display = shortcuts.weather ? 'inline-flex' : 'none';
    document.getElementById('icon-fortune').style.display = shortcuts.fortune ? 'flex' : 'none';
    document.getElementById('icon-game').style.display = shortcuts.game ? 'flex' : 'none';
    document.querySelectorAll('.chk-shortcut').forEach(chk => { chk.checked = shortcuts[chk.dataset.key]; });
}
applyShortcuts();
document.querySelectorAll('.chk-shortcut').forEach(chk => {
    chk.addEventListener('change', (e) => {
        shortcuts[e.target.dataset.key] = e.target.checked;
        localStorage.setItem('koko_shortcuts', JSON.stringify(shortcuts)); applyShortcuts();
    });
});
document.getElementById('icon-game')?.addEventListener('click', () => { document.getElementById('game-modal').style.display = 'flex'; initMinesweeper(); });

// 🌟 탭 메뉴 편집 로직
const defaultTabs = [
    { id: 'tab-todo', label: '할 일', icon: 'icon-todo.png', enabled: true },
    { id: 'tab-schedule', label: '스케줄', icon: 'icon-schedule.png', enabled: true },
    { id: 'tab-dday', label: '디데이', icon: 'icon-dday.png', enabled: true },
    { id: 'tab-vocab', label: '단어장', icon: 'icon-book.png', enabled: true },
    { id: 'tab-quest', label: '퀘스트', icon: 'icon-sparkle.png', enabled: true }
];
let tabConfig = JSON.parse(localStorage.getItem('koko_tab_config')) || defaultTabs;

function renderTabEditor() {
    const list = document.getElementById('tab-edit-list'); if(!list) return;
    list.innerHTML = '';
    tabConfig.forEach((tab, index) => {
        const li = document.createElement('li');
        li.className = 'tab-edit-item'; li.dataset.index = index; li.draggable = true;
        li.innerHTML = `
            <span style="color:#aaa; cursor:grab; margin-right:5px;">🟰</span>
            <label style="display:flex; align-items:center; gap:5px; flex-grow:1; cursor:pointer;">
                <input type="checkbox" class="tab-enable-chk" data-index="${index}" ${tab.enabled ? 'checked' : ''}>
                <img src="${tab.icon}" class="ui-icon" style="width:16px;height:16px;"> ${tab.label}
            </label>
        `;
        list.appendChild(li);
    });
    bindTabDragEvents();
}

function renderTabButtons() {
    const container = document.getElementById('main-tab-buttons'); if(!container) return;
    container.innerHTML = '';
    const enabledTabs = tabConfig.filter(t => t.enabled);
    
    enabledTabs.forEach((tab, i) => {
        const btn = document.createElement('button');
        btn.className = `tab-btn ${i === 0 ? 'active' : ''}`;
        btn.dataset.target = tab.id;
        btn.innerHTML = `<img src="${tab.icon}" class="ui-icon"> ${tab.label}`;
        container.appendChild(btn);
    });

    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    if(enabledTabs.length > 0) { document.getElementById(enabledTabs[0].id)?.classList.add('active'); }

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const targetId = btn.dataset.target;
            if(targetId && document.getElementById(targetId)) document.getElementById(targetId).classList.add('active');
            
            if(targetId === 'tab-schedule') { renderCalendar(); kokoScheduleCheck(); } 
            else if (targetId === 'tab-vocab') { renderVocabFolders(); if(kokoSpeech) kokoSpeech.innerHTML = "단어 암기 화이팅! 📖 <img src='icon-sparkle.png' class='ui-icon'>"; } 
            else { updateKokoAppearance(); }
        });
    });
}

document.getElementById('tab-edit-list')?.addEventListener('change', (e) => {
    if(e.target.classList.contains('tab-enable-chk')) {
        const index = e.target.dataset.index;
        tabConfig[index].enabled = e.target.checked;
        localStorage.setItem('koko_tab_config', JSON.stringify(tabConfig));
        renderTabButtons();
    }
});

function bindTabDragEvents() {
    const list = document.getElementById('tab-edit-list');
    let dragEl = null;

    list.addEventListener('dragstart', e => {
        dragEl = e.target.closest('li');
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => dragEl.style.opacity = '0.5', 0);
    });
    list.addEventListener('dragover', e => {
        e.preventDefault();
        const target = e.target.closest('li');
        if(target && target !== dragEl) {
            const rect = target.getBoundingClientRect();
            const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
            list.insertBefore(dragEl, next && target.nextSibling || target);
        }
    });
    list.addEventListener('dragend', e => {
        dragEl.style.opacity = '1';
        const newConfig = [];
        list.querySelectorAll('li').forEach(li => { newConfig.push(tabConfig[+li.dataset.index]); });
        tabConfig = newConfig;
        localStorage.setItem('koko_tab_config', JSON.stringify(tabConfig));
        renderTabEditor(); renderTabButtons();
    });
}

// ==========================================
// 📱 2. UI 동작 로직
// ==========================================
const sideMenu = document.getElementById('side-menu'); const overlay = document.getElementById('side-menu-overlay');
const closeMenu = () => { if(sideMenu) sideMenu.classList.remove('open'); if(overlay) overlay.style.display = 'none'; };
document.getElementById('menu-open-btn')?.addEventListener('click', () => { if(sideMenu) sideMenu.classList.add('open'); if(overlay) overlay.style.display = 'block'; });
document.getElementById('menu-close-btn')?.addEventListener('click', closeMenu);
document.getElementById('side-menu-overlay')?.addEventListener('click', closeMenu);

document.getElementById('tab-drag-handle')?.addEventListener('click', () => {
    const container = document.getElementById('main-tab-container');
    const zone = document.getElementById('koko-zone-main');
    const icon = document.getElementById('tab-drag-icon');
    if(!container || !zone || !icon) return;
    
    container.classList.toggle('expanded');
    zone.classList.toggle('compact');
    
    if(container.classList.contains('expanded')) {
        icon.src = 'icon-down.png';
        if(kokoChar) kokoChar.style.animation = 'none'; 
    } else {
        icon.src = 'icon-up.png';
        if(kokoChar) kokoChar.style.animation = 'floating 2s ease-in-out infinite'; 
    }
});

function kokoScheduleCheck() {
    const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`;
    const todaysSchedules = schedules[todayStr] || [];
    if(kokoSpeech) {
        kokoSpeech.style.backgroundColor = "white"; kokoSpeech.dataset.feedMode = "false";
        if(todaysSchedules.length === 0) { kokoSpeech.innerHTML = "오늘은 특별한 일정이 없어요 <img src='icon-chick.png' class='ui-icon'>"; } 
        else { kokoSpeech.innerHTML = `일정이 있습니다! '${todaysSchedules[0].task}' 🗓️`; }
    }
    if(kokoChar) { kokoChar.style.transform="translateY(-20px)"; setTimeout(()=>kokoChar.style.transform="translateY(0)",200); }
}

const chatDrawer = document.getElementById('chat-drawer'); const chatToggleIcon = document.getElementById('chat-toggle-icon');
document.getElementById('chat-header-bar')?.addEventListener('click', () => {
    if(chatDrawer) {
        chatDrawer.classList.toggle('collapsed'); chatDrawer.classList.toggle('expanded');
        if(chatToggleIcon) chatToggleIcon.innerHTML = chatDrawer.classList.contains('expanded') ? '<img src="icon-down.png" class="ui-icon">' : '<img src="icon-up.png" class="ui-icon">';
        if(chatDrawer.classList.contains('expanded')) { const chatBox = document.getElementById('chat-box'); if(chatBox) chatBox.scrollTop = chatBox.scrollHeight; }
    }
});

// ==========================================
// 📅 3. 캘린더 및 스케줄 로직
// ==========================================
function renderCalendar() {
    const displayObj = document.getElementById('current-month-display'); if (!displayObj) return; 
    const year = currentCalDate.getFullYear(); const month = currentCalDate.getMonth(); displayObj.innerText = `${year}년 ${month + 1}월`;
    const firstDay = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid = document.getElementById('calendar-grid'); if(!grid) return; grid.innerHTML = '';
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
    const infoObj = document.getElementById('selected-date-info'); if(infoObj) infoObj.innerText = `선택한 날짜: ${selectedDateStr}`;
    const list = document.getElementById('schedule-list'); if(!list) return; list.innerHTML = '';
    const daySchedules = schedules[selectedDateStr] || [];
    daySchedules.sort((a, b) => { if (a.time === "종일") return -1; if (b.time === "종일") return 1; return a.time.localeCompare(b.time); });
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
    if(!timeObj || !taskObj) return; let time = timeObj.value; const task = taskObj.value.trim();
    if (!task) { alert("일정 내용을 입력해주세요!"); return; } if (!time) time = "종일";
    if(!schedules[selectedDateStr]) schedules[selectedDateStr] = [];
    schedules[selectedDateStr].push({ time: time, task: task });
    localStorage.setItem('koko_schedules', JSON.stringify(schedules)); timeObj.value = ''; taskObj.value = ''; renderCalendar(); syncToCloud();
});
window.deleteSchedule = i => { schedules[selectedDateStr].splice(i, 1); localStorage.setItem('koko_schedules', JSON.stringify(schedules)); renderCalendar(); syncToCloud(); };

// ==========================================
// 🔐 4. 로그인, 프로필, 설정 
// ==========================================
document.getElementById('google-login-btn')?.addEventListener('click', () => auth.signInWithPopup(provider));
document.getElementById('logout-btn')?.addEventListener('click', () => auth.signOut());

auth.onAuthStateChanged((user) => {
    if (user) {
        document.getElementById('login-area').style.display = 'none'; document.getElementById('user-profile-area').style.display = 'block'; document.getElementById('user-email-display').innerText = `👋 ${user.email}`;
        myUid = user.uid; 
        if (user.uid === ADMIN_UID) { document.getElementById('admin-feedback-area').style.display = 'block'; loadAdminFeedbacks(); } else { document.getElementById('admin-feedback-area').style.display = 'none'; }

        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                if (data.todoData) { todoData = data.todoData; } 
                if (data.vocabData) { vocabData = data.vocabData; } 
                if (data.ddays) { ddays = data.ddays; renderDdays(); }
                if (data.schedules) { schedules = data.schedules; }
                if (data.attendance) { attendance = data.attendance; checkAttendanceUI(); }
                
                renderTodoFolders(); renderVocabFolders(); renderCalendar(); 
                if (data.nickname) { 
                    myNickname = data.nickname; localStorage.setItem('koko_nickname', myNickname); document.getElementById('nickname-input').value = myNickname; 
                    const statusObj = document.getElementById('profile-status'); if(statusObj) { statusObj.innerText = "✅ 동기화 완료"; statusObj.style.color = "#2ecc71"; }
                    enableChat(); 
                }
                if (data.lastNicknameChange) lastChangeDate = data.lastNicknameChange.toDate();
                if(kokoSpeech) kokoSpeech.innerHTML = "동기화 완료! 보고 싶었어요 <img src='icon-cloud.png' class='ui-icon'>";
            } else { syncToCloud(); if(kokoSpeech) kokoSpeech.innerHTML = "환영해요! 데이터를 안전하게 보관할게요 <img src='icon-heart.png' class='ui-icon'>"; }
        });
    } else { document.getElementById('login-area').style.display = 'block'; document.getElementById('user-profile-area').style.display = 'none'; document.getElementById('admin-feedback-area').style.display = 'none'; }
});

document.getElementById('save-nickname-btn')?.addEventListener('click', async () => {
    const nickInput = document.getElementById('nickname-input'); const statusObj = document.getElementById('profile-status'); if(!nickInput || !statusObj) return;
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

const chatFontSelect = document.getElementById('chat-font-size-select'); const chatBox = document.getElementById('chat-box');
if (localStorage.getItem('koko_chat_font') && chatFontSelect) { chatFontSelect.value = localStorage.getItem('koko_chat_font'); if(chatBox) chatBox.style.fontSize = chatFontSelect.value; }
chatFontSelect?.addEventListener('change', e => { localStorage.setItem('koko_chat_font', e.target.value); if(chatBox) chatBox.style.fontSize = e.target.value; });

document.getElementById('add-custom-font-btn')?.addEventListener('click', () => {
    const url = prompt("🔗 구글 폰트(Google Fonts) URL을 입력하세요.\n(예: https://fonts.googleapis.com/css2?family=Gowun+Dodum&display=swap)"); if (!url) return;
    const name = prompt("📝 폰트 이름(font-family)을 정확히 입력하세요.\n(예: Gowun Dodum)"); if (!name) return;
    let customFonts = JSON.parse(localStorage.getItem('koko_custom_fonts')) || []; customFonts.push({url, name}); localStorage.setItem('koko_custom_fonts', JSON.stringify(customFonts));
    alert("폰트가 추가되었습니다! 목록에서 선택해보세요. 🐣"); location.reload();
});

document.getElementById('open-feedback-btn')?.addEventListener('click', () => { closeMenu(); document.getElementById('feedback-modal').style.display = 'flex'; });
document.getElementById('close-feedback-btn')?.addEventListener('click', () => { document.getElementById('feedback-modal').style.display = 'none'; });
document.getElementById('send-feedback-btn')?.addEventListener('click', async () => {
    const txtObj = document.getElementById('feedback-text'); if(!txtObj) return; const txt = txtObj.value.trim(); if (!txt) return;
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
function enableChat() { const input = document.getElementById('chat-input'); const btn = document.getElementById('send-chat-btn'); if(input) { input.disabled = false; input.placeholder = "메시지 입력..."; } if(btn) btn.disabled = false; loadMessages(); }
if(myNickname) enableChat();

document.getElementById('tab-global')?.addEventListener('click', e => { currentChatMode = 'global'; e.target.classList.add('active'); document.getElementById('tab-room')?.classList.remove('active'); document.getElementById('room-code-area').style.display = 'none'; document.getElementById('megaphone-label').style.display = 'flex'; loadMessages(); });
document.getElementById('tab-room')?.addEventListener('click', e => { currentChatMode = 'room'; e.target.classList.add('active'); document.getElementById('tab-global')?.classList.remove('active'); document.getElementById('room-code-area').style.display = 'flex'; document.getElementById('megaphone-label').style.display = 'none'; document.getElementById('chat-box').innerHTML = '<div style="text-align:center; color:#888; font-size:0.85em; margin-top:30px;">코드를 입력하고 입장하세요 <img src="icon-lock.png" class="ui-icon"></div>'; if(chatUnsubscribe) chatUnsubscribe(); });
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
                if(preview) { const devMark = isDeveloper ? `<img src="icon-wrench.png" class="ui-icon" style="width:12px; height:12px;">` : ''; preview.innerHTML = `<img src="icon-chat.png" class="ui-icon"> ${devMark}${data.sender}: ${data.text}`; }
                
                const shakeClass = (data.megaphone && !isInit) ? 'shake' : '';
                const msgDiv = document.createElement('div'); msgDiv.className = `chat-message ${isMe ? 'me' : 'other'} ${data.megaphone ? 'megaphone' : ''} ${shakeClass}`;
                
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
    const chatInput = document.getElementById('chat-input'); if(!chatInput) return; const text = chatInput.value.trim(); if (!text || !myNickname) return;
    const megaCheck = document.getElementById('megaphone-check'); const isMega = megaCheck ? megaCheck.checked : false;
    const data = { text: text, sender: myNickname, uid: myUid, megaphone: isMega, timestamp: firebase.firestore.FieldValue.serverTimestamp() };
    if (currentChatMode === 'global') db.collection('global_messages').add(data); else db.collection('secret_rooms').doc(currentRoomCode).collection('messages').add(data);
    chatInput.value = ''; if(megaCheck) megaCheck.checked = false;
});

// ==========================================
// 🏆 6. 퀘스트, 투두, 디데이, 단어장
// ==========================================
function checkAttendanceUI() {
    const todayStr = new Date().toDateString(); const btn = document.getElementById('attendance-btn'); const streak = document.getElementById('attendance-streak');
    if(streak) streak.innerText = attendance.streak;
    if(btn) {
        if (attendance.lastDate === todayStr) { btn.innerHTML = `오늘 출석 완료! <img src="icon-fire.png" class="ui-icon" style="margin-left:4px;">`; btn.disabled = true; btn.style.backgroundColor = "#aaa"; completeQuest(2); } 
        else { btn.innerHTML = `오늘의 출석체크 도장 찍기 <img src="icon-check.png" class="ui-icon" style="filter: brightness(0) invert(1); margin-left:4px;">`; btn.disabled = false; btn.style.backgroundColor = "#2ecc71"; }
    }
}
document.getElementById('attendance-btn')?.addEventListener('click', () => { const todayStr = new Date().toDateString(); attendance.lastDate = todayStr; attendance.streak += 1; localStorage.setItem('koko_attendance', JSON.stringify(attendance)); syncToCloud(); checkAttendanceUI(); if(kokoSpeech) kokoSpeech.innerHTML = `출석 도장 꾹! 연속 ${attendance.streak}일째! <img src="icon-party.png" class="ui-icon">`; });
function completeQuest(questNum) { if (!dailyQuests[`q${questNum}`]) { dailyQuests[`q${questNum}`] = true; const qObj = document.getElementById(`quest-${questNum}`); if(qObj) qObj.innerHTML = `<span style="color:#2ecc71; font-weight:bold; text-decoration:line-through;"><img src="icon-check.png" class="ui-icon"> 퀘스트 완료!</span>`; if(kokoChar) { kokoChar.style.transform="scale(1.1)"; setTimeout(()=>kokoChar.style.transform="scale(1)",300); } } }
checkAttendanceUI(); 

function renderTodoFolders() {
    const sel = document.getElementById('todo-folder-select'); if(!sel) return; sel.innerHTML = '';
    Object.keys(todoData).forEach(folder => { let opt = document.createElement('option'); opt.value = folder; opt.text = `📁 ${folder}`; if(folder === currentTodoFolder) opt.selected = true; sel.appendChild(opt); }); renderTodos();
}
document.getElementById('todo-folder-select')?.addEventListener('change', (e) => { currentTodoFolder = e.target.value; renderTodos(); });
document.getElementById('add-folder-btn')?.addEventListener('click', () => { let name = prompt("새로운 폴더 이름을 입력하세요 (예: 장보기, 공부)"); if(name && name.trim() !== '') { name = name.trim(); if(!todoData[name]) { todoData[name] = []; currentTodoFolder = name; localStorage.setItem('koko_todo_data', JSON.stringify(todoData)); renderTodoFolders(); syncToCloud(); } else { alert("이미 있는 폴더 이름입니다!"); } } });
document.getElementById('del-folder-btn')?.addEventListener('click', () => { if(currentTodoFolder === "기본") { alert("'기본' 폴더는 지울 수 없어요! 🐣"); return; } if(todoData[currentTodoFolder].length > 0) { alert("폴더 안에 할 일이 남아있어요! 먼저 다 비워주세요."); return; } if(confirm(`"${currentTodoFolder}" 폴더를 정말 지울까요?`)) { delete todoData[currentTodoFolder]; currentTodoFolder = "기본"; localStorage.setItem('koko_todo_data', JSON.stringify(todoData)); renderTodoFolders(); syncToCloud(); } });

function renderTodos() { 
    const list = document.getElementById('todo-list'); if(!list) return; list.innerHTML = ''; let anyChecked = false; 
    let currentList = todoData[currentTodoFolder] || [];
    currentList.forEach((t, i) => { 
        list.innerHTML += `<li><label style="cursor:pointer; display:flex; align-items:center; gap:8px; width:100%;"><input type="checkbox" ${t.checked ? 'checked' : ''} onchange="toggleTodo(${i})"><span style="flex-grow:1; ${t.checked ? 'text-decoration:line-through; color:#aaa;' : ''}">${t.text}</span></label><button class="more-btn todo-more-btn" onclick="openTodoMenu(${i}, event)">⋮</button></li>`; 
        if (t.checked) anyChecked = true; 
    }); 
    if(kokoSpeech) {
        if (anyChecked) { kokoSpeech.style.backgroundColor = "#ffd070"; kokoSpeech.innerHTML = "꼬꼬를 터치하여 모이 주기 🌾"; kokoSpeech.dataset.feedMode = "true"; } 
        else { if(kokoSpeech.dataset.feedMode === "true") { kokoSpeech.style.backgroundColor = "white"; kokoSpeech.dataset.feedMode = "false"; updateKokoAppearance(); } }
    }
}
document.getElementById('add-todo-btn')?.addEventListener('click', () => { const input = document.getElementById('new-todo-input'); if(!input) return; const txt = input.value.trim(); if (!txt) return; if(!todoData[currentTodoFolder]) todoData[currentTodoFolder] = []; todoData[currentTodoFolder].push({ text: txt, checked: false }); localStorage.setItem('koko_todo_data', JSON.stringify(todoData)); input.value=''; renderTodos(); syncToCloud(); });
window.toggleTodo = i => { todoData[currentTodoFolder][i].checked = !todoData[currentTodoFolder][i].checked; localStorage.setItem('koko_todo_data', JSON.stringify(todoData)); renderTodos(); syncToCloud(); if(todoData[currentTodoFolder][i].checked) completeQuest(3); };

let currentTodoIndex = -1;
window.openTodoMenu = (index, event) => { currentTodoIndex = index; const menu = document.getElementById('todo-dropdown'); if(!menu) return; const rect = event.target.getBoundingClientRect(); menu.style.display = 'flex'; menu.style.top = `${rect.bottom + window.scrollY}px`; menu.style.left = `${rect.left - 80}px`; };
document.getElementById('todo-edit-btn')?.addEventListener('click', () => { const currentText = todoData[currentTodoFolder][currentTodoIndex].text; const newText = prompt("할 일을 수정하세요:", currentText); if(newText && newText.trim() !== "") { todoData[currentTodoFolder][currentTodoIndex].text = newText.trim(); localStorage.setItem('koko_todo_data', JSON.stringify(todoData)); renderTodos(); syncToCloud(); } document.getElementById('todo-dropdown').style.display = 'none'; });
document.getElementById('todo-del-btn')?.addEventListener('click', () => { todoData[currentTodoFolder].splice(currentTodoIndex, 1); localStorage.setItem('koko_todo_data', JSON.stringify(todoData)); renderTodos(); syncToCloud(); document.getElementById('todo-dropdown').style.display = 'none'; });

let currentDdayIndex = -1; let ddayPressTimer = null; let isPressing = false;
window.startDdayPress = (index, event) => { if(event.target.classList.contains('more-btn')) return; isPressing = true; ddayPressTimer = setTimeout(() => { if(isPressing) { ddays[index].pinned = !ddays[index].pinned; renderDdays(); syncToCloud(); if(navigator.vibrate) navigator.vibrate(50); } }, 500); };
window.cancelDdayPress = () => { isPressing = false; if(ddayPressTimer) clearTimeout(ddayPressTimer); };

const ddaySelect = document.getElementById('dday-icon-select');
const optTextFull = { "": "기본", "🎂": "🎂 생일", "🔥": "🔥 마감", "💖": "💖 기념", "✈️": "✈️ 여행", "🎓": "🎓 시험", "🎯": "🎯 목표" };
const optTextShort = { "": "기본", "🎂": "생일", "🔥": "마감", "💖": "기념", "✈️": "여행", "🎓": "시험", "🎯": "목표" };
function updateDdaySelectUI() { if(!ddaySelect) return; Array.from(ddaySelect.options).forEach(opt => { opt.text = opt.selected ? optTextShort[opt.value] : optTextFull[opt.value]; }); }
function openDdaySelectUI() { if(!ddaySelect) return; Array.from(ddaySelect.options).forEach(opt => { opt.text = optTextFull[opt.value]; }); }
if(ddaySelect) { ddaySelect.addEventListener('change', updateDdaySelectUI); ddaySelect.addEventListener('blur', updateDdaySelectUI); ddaySelect.addEventListener('mousedown', openDdaySelectUI); ddaySelect.addEventListener('touchstart', openDdaySelectUI, {passive:true}); updateDdaySelectUI(); }
const ddayDateInput = document.getElementById('dday-date-input'); const dateIconSpan = document.getElementById('date-square-icon');
if(ddayDateInput && dateIconSpan) { ddayDateInput.addEventListener('change', () => { if(ddayDateInput.value) { dateIconSpan.innerText = '✅'; dateIconSpan.parentElement.style.borderColor = '#2ecc71'; dateIconSpan.parentElement.style.background = '#eafaf1'; } else { dateIconSpan.innerText = '📅'; dateIconSpan.parentElement.style.borderColor = '#ddd'; dateIconSpan.parentElement.style.background = '#f0f4f8'; } }); }

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
        let badge = `<span style="color:${badgeColor}; font-weight:bold;">${badgeText}</span>`;
        let pinIcon = d.pinned ? `<img src="icon-pin.png" class="ui-icon" style="width:1em; height:1em;"> ` : '';
        let customIcon = d.icon ? `<span style="margin-left:4px;">${d.icon}</span>` : '';
        let li = document.createElement('li');
        li.innerHTML = `<div style="display:flex; flex-direction:column; gap:4px;"><div style="display:flex; align-items:center; gap:6px;">${pinIcon}<strong>${d.title}</strong><div style="display:flex; align-items:center;">${badge}${customIcon}</div></div><span style="font-size:0.85em; color:#888;">${d.date}</span></div><button class="more-btn" onclick="openDdayMenu(${d.originalIndex}, event)">⋮</button>`;
        li.addEventListener('mousedown', (e) => startDdayPress(d.originalIndex, e)); li.addEventListener('touchstart', (e) => startDdayPress(d.originalIndex, e), {passive: true});
        li.addEventListener('mouseup', cancelDdayPress); li.addEventListener('mouseleave', cancelDdayPress); li.addEventListener('touchend', cancelDdayPress); li.addEventListener('touchcancel', cancelDdayPress);
        list.appendChild(li);
    }); 
    let mainDday = calc.find(d => d.isMain);
    if(!mainDday) { let upcoming = calc.filter(d => d.diff >= 0).sort((a,b) => a.diff - b.diff); mainDday = upcoming.length > 0 ? upcoming[0] : calc[0]; }
    let mainBadgeText = mainDday.diff === 0 ? `D-Day!` : (mainDday.diff > 0 ? `D-${mainDday.diff}` : `D+${Math.abs(mainDday.diff)}`);
    let crownIcon = mainDday.isMain ? `<img src="icon-crown.png" class="ui-icon"> ` : `<img src="icon-pin.png" class="ui-icon"> `;
    let mainCustomIcon = mainDday.icon ? ` <span>${mainDday.icon}</span>` : '';
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
    const rect = event.target.getBoundingClientRect(); menu.style.display = 'flex'; menu.style.top = `${rect.bottom + window.scrollY}px`; menu.style.left = `${rect.left - 100}px`; 
};
document.getElementById('dday-main-btn')?.addEventListener('click', () => { ddays.forEach(d => d.isMain = false); ddays[currentDdayIndex].isMain = true; renderDdays(); syncToCloud(); document.getElementById('dday-dropdown').style.display = 'none'; if(kokoSpeech) kokoSpeech.innerHTML = `"${ddays[currentDdayIndex].title}" 대표 지정 완료! <img src="icon-crown.png" class="ui-icon">`; });
document.getElementById('dday-del-btn')?.addEventListener('click', () => { ddays.splice(currentDdayIndex, 1); renderDdays(); syncToCloud(); document.getElementById('dday-dropdown').style.display = 'none'; });

function renderVocabFolders() {
    const sel = document.getElementById('vocab-folder-select'); if(!sel) return; sel.innerHTML = '';
    Object.keys(vocabData).forEach(folder => {
        let opt = document.createElement('option'); opt.value = folder; opt.text = `📁 ${folder}`;
        if(folder === currentVocabFolder) opt.selected = true; sel.appendChild(opt);
    }); renderVocabs();
}

document.getElementById('vocab-folder-select')?.addEventListener('change', (e) => { currentVocabFolder = e.target.value; renderVocabs(); });
document.getElementById('add-vocab-folder-btn')?.addEventListener('click', () => {
    let name = prompt("새로운 단어장 폴더 이름을 입력하세요 (예: 영어, 역사)");
    if(name && name.trim() !== '') { name = name.trim(); if(!vocabData[name]) { vocabData[name] = []; currentVocabFolder = name; localStorage.setItem('koko_vocab_data', JSON.stringify(vocabData)); renderVocabFolders(); syncToCloud(); } else { alert("이미 있는 폴더 이름입니다!"); } }
});
document.getElementById('del-vocab-folder-btn')?.addEventListener('click', () => {
    if(currentVocabFolder === "기본") { alert("'기본' 폴더는 지울 수 없어요! 🐣"); return; }
    if(vocabData[currentVocabFolder].length > 0) { alert("폴더 안에 단어가 남아있어요! 먼저 다 비워주세요."); return; }
    if(confirm(`"${currentVocabFolder}" 폴더를 정말 지울까요?`)) { delete vocabData[currentVocabFolder]; currentVocabFolder = "기본"; localStorage.setItem('koko_vocab_data', JSON.stringify(vocabData)); renderVocabFolders(); syncToCloud(); }
});

document.getElementById('vocab-blind-check')?.addEventListener('change', (e) => { isVocabBlindMode = e.target.checked; renderVocabs(); });

function renderVocabs() { 
    const list = document.getElementById('vocab-list'); if(!list) return; list.innerHTML = ''; 
    let currentList = vocabData[currentVocabFolder] || [];
    
    currentList.forEach((v, i) => { 
        let li = document.createElement('li');
        li.className = `vocab-item ${v.memorized ? 'memorized' : ''}`;
        let meaningHtml = isVocabBlindMode ? `<span class="vocab-meaning blind" onclick="this.classList.toggle('revealed')">${v.mean}</span>` : `<span class="vocab-meaning">${v.mean}</span>`;
        li.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px; flex-grow:1; overflow:hidden;">
                <input type="checkbox" ${v.memorized ? 'checked' : ''} onchange="toggleVocab(${i})">
                <div style="display:flex; align-items:center; gap:6px; flex-grow:1; overflow:hidden; white-space:nowrap;">
                    <span style="flex-shrink:0;">${meaningHtml}</span>
                    <span class="vocab-word">${v.word}</span>
                </div>
            </div>
            <button class="more-btn vocab-more-btn" onclick="openVocabMenu(${i}, event)">⋮</button>
        `;
        list.appendChild(li);
    }); 
}

document.getElementById('add-vocab-btn')?.addEventListener('click', () => { 
    const wInput = document.getElementById('new-vocab-word'); const mInput = document.getElementById('new-vocab-mean');
    if(!wInput || !mInput) return; const word = wInput.value.trim(); const mean = mInput.value.trim();
    if (!word || !mean) { alert("단어와 뜻을 모두 입력해주세요!"); return; } 
    if(!vocabData[currentVocabFolder]) vocabData[currentVocabFolder] = []; 
    vocabData[currentVocabFolder].push({ word: word, mean: mean, memorized: false }); 
    localStorage.setItem('koko_vocab_data', JSON.stringify(vocabData)); wInput.value=''; mInput.value=''; renderVocabs(); syncToCloud(); 
});
window.toggleVocab = i => { vocabData[currentVocabFolder][i].memorized = !vocabData[currentVocabFolder][i].memorized; localStorage.setItem('koko_vocab_data', JSON.stringify(vocabData)); renderVocabs(); syncToCloud(); };

let currentVocabIndex = -1;
window.openVocabMenu = (index, event) => { currentVocabIndex = index; const menu = document.getElementById('vocab-dropdown'); if(!menu) return; const rect = event.target.getBoundingClientRect(); menu.style.display = 'flex'; menu.style.top = `${rect.bottom + window.scrollY}px`; menu.style.left = `${rect.left - 80}px`; };
document.getElementById('vocab-edit-btn')?.addEventListener('click', () => { 
    const currentW = vocabData[currentVocabFolder][currentVocabIndex].word; const currentM = vocabData[currentVocabFolder][currentVocabIndex].mean;
    const newW = prompt("단어 수정:", currentW); if(newW === null) return;
    const newM = prompt("뜻 수정:", currentM); if(newM === null) return;
    if(newW.trim() && newM.trim()) { vocabData[currentVocabFolder][currentVocabIndex].word = newW.trim(); vocabData[currentVocabFolder][currentVocabIndex].mean = newM.trim(); localStorage.setItem('koko_vocab_data', JSON.stringify(vocabData)); renderVocabs(); syncToCloud(); } 
    document.getElementById('vocab-dropdown').style.display = 'none'; 
});
document.getElementById('vocab-del-btn')?.addEventListener('click', () => { vocabData[currentVocabFolder].splice(currentVocabIndex, 1); localStorage.setItem('koko_vocab_data', JSON.stringify(vocabData)); renderVocabs(); syncToCloud(); document.getElementById('vocab-dropdown').style.display = 'none'; });

document.addEventListener('click', (e) => { 
    const dmenu = document.getElementById('dday-dropdown'); if (dmenu && dmenu.style.display === 'flex' && !e.target.classList.contains('more-btn')) dmenu.style.display = 'none'; 
    const tmenu = document.getElementById('todo-dropdown'); if (tmenu && tmenu.style.display === 'flex' && !e.target.classList.contains('todo-more-btn')) tmenu.style.display = 'none'; 
    const vmenu = document.getElementById('vocab-dropdown'); if (vmenu && vmenu.style.display === 'flex' && !e.target.classList.contains('vocab-more-btn')) vmenu.style.display = 'none'; 
});

let currentWeatherCode = -1;
function getKokoWeather() { if(navigator.geolocation) { navigator.geolocation.getCurrentPosition(p => { fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.coords.latitude}&longitude=${p.coords.longitude}&current_weather=true`).then(r=>r.json()).then(d=>{ const wInfo = document.querySelector('.weather-info'); currentWeatherCode = d.current_weather.weathercode; if(wInfo) wInfo.innerHTML=`<img src="${currentWeatherCode<=1?'icon-sun.png':(currentWeatherCode<=45?'icon-cloud.png':'icon-rain.png')}" class="ui-icon"> ${d.current_weather.temperature}°C`; updateKokoAppearance(); }); }, () => { updateKokoAppearance(); }); } else { updateKokoAppearance(); } }

function getDefaultSpeech() { const h = new Date().getHours(); return h<12?"아침 화이팅! <img src='icon-sun.png' class='ui-icon'>":(h<18?"나른한 오후 <img src='icon-cloud.png' class='ui-icon'>":"수고했어요! <img src='icon-moon.png' class='ui-icon'>"); }

function updateKokoAppearance() {
    const hour = new Date().getHours(); const kokoImg = document.getElementById('koko'); if(!kokoImg) return;
    if (hour >= 22 || hour < 6) { kokoImg.src = "koko-sleep.png"; if(kokoSpeech && kokoSpeech.dataset.feedMode !== "true") { kokoSpeech.innerHTML = "쿨쿨... 꼬꼬는 꿈나라 여행 중... 💤"; } return; }
    if (currentWeatherCode !== -1) {
        if (currentWeatherCode <= 1) kokoImg.src = "koko-cool.png"; else if (currentWeatherCode >= 51 && currentWeatherCode <= 67 || currentWeatherCode >= 80) kokoImg.src = "koko-umbrella.png"; else if (currentWeatherCode >= 71 && currentWeatherCode <= 77) kokoImg.src = "koko-snow.png"; else kokoImg.src = "koko.png";
    } else { kokoImg.src = "koko.png"; }
    if(kokoSpeech && kokoSpeech.dataset.feedMode !== "true") { kokoSpeech.innerHTML = getDefaultSpeech(); }
}

const fortunes = ["행운 컬러: 노랑💛", "기분 좋은 일 발생!✨", "소중한 사람에게 연락해봐요💌", "금전운 최고!💰"];
document.getElementById('fortune-btn')?.addEventListener('click', () => { if(kokoSpeech && kokoSpeech.dataset.feedMode === "true") return; if(kokoSpeech) kokoSpeech.innerText = fortunes[Math.floor(Math.random()*fortunes.length)]; if(kokoChar) { kokoChar.style.transform="translateY(-20px)"; setTimeout(()=>kokoChar.style.transform="translateY(0)",200); } });

kokoChar?.addEventListener('click', () => { 
    if (kokoSpeech && kokoSpeech.dataset.feedMode === "true") {
        kokoSpeech.style.backgroundColor = "white"; kokoSpeech.innerHTML = "냠냠! 너무 맛있어요 <img src='icon-100.png' class='ui-icon'>"; kokoSpeech.dataset.feedMode = "false";
        if (todoData[currentTodoFolder]) { todoData[currentTodoFolder] = todoData[currentTodoFolder].filter(t => !t.checked); localStorage.setItem('koko_todo_data', JSON.stringify(todoData)); syncToCloud(); }
        if(kokoChar) { kokoChar.style.transform="scale(1.2)"; setTimeout(()=>kokoChar.style.transform="scale(1)", 300); }
        setTimeout(() => { renderTodos(); updateKokoAppearance(); }, 2000); return; 
    }
    completeQuest(1); const h = new Date().getHours(); 
    if (h >= 22 || h < 6) {
        if(kokoSpeech) kokoSpeech.innerHTML = "음냐... 주인님도 얼른 주무세요... 💤"; kokoChar.src = "koko.png"; 
        if(kokoChar) { kokoChar.style.transform="translateY(-20px)"; setTimeout(()=>kokoChar.style.transform="translateY(0)",200); } 
        setTimeout(() => { updateKokoAppearance(); }, 2000); 
    } else {
        if(kokoSpeech) kokoSpeech.innerHTML = getDefaultSpeech();
        if(kokoChar) { kokoChar.style.transform="translateY(-20px)"; setTimeout(()=>kokoChar.style.transform="translateY(0)",200); } 
    }
});

// ==========================================
// 🎮 8. 꼬꼬 게임
// ==========================================
document.getElementById('open-game-btn')?.addEventListener('click', () => { closeMenu(); document.getElementById('game-modal').style.display = 'flex'; initMinesweeper(); });
document.getElementById('close-game-btn')?.addEventListener('click', () => { document.getElementById('game-modal').style.display = 'none'; });
document.getElementById('reset-game-btn')?.addEventListener('click', () => { initMinesweeper(); });

let mineBoard = []; let mineRevealed = []; let mineGameOver = false; let safeCellsCount = 0; const MINE_SIZE = 6; const MINES_COUNT = 5;
function initMinesweeper() {
    const grid = document.getElementById('minesweeper-grid'); if(!grid) return; grid.innerHTML = '';
    document.getElementById('game-status').innerText = `안전한 달걀을 찾아주세요! (폭탄 ${MINES_COUNT}개)`; document.getElementById('game-status').style.color = "#555";
    mineBoard = Array(MINE_SIZE).fill().map(()=>Array(MINE_SIZE).fill(0)); mineRevealed = Array(MINE_SIZE).fill().map(()=>Array(MINE_SIZE).fill(false)); mineGameOver = false; safeCellsCount = (MINE_SIZE * MINE_SIZE) - MINES_COUNT;
    let placed = 0; while(placed < MINES_COUNT) { let r = Math.floor(Math.random()*MINE_SIZE); let c = Math.floor(Math.random()*MINE_SIZE); if(mineBoard[r][c] !== 'M') { mineBoard[r][c] = 'M'; placed++; } }
    for(let r=0; r<MINE_SIZE; r++) { for(let c=0; c<MINE_SIZE; c++) { if(mineBoard[r][c] === 'M') continue; let count=0; for(let dr=-1; dr<=1; dr++){ for(let dc=-1; dc<=1; dc++){ let nr=r+dr, nc=c+dc; if(nr>=0 && nr<MINE_SIZE && nc>=0 && nc<MINE_SIZE && mineBoard[nr][nc]==='M') count++; } } mineBoard[r][c] = count; } }
    for(let r=0; r<MINE_SIZE; r++) { for(let c=0; c<MINE_SIZE; c++) { let cell = document.createElement('div'); cell.className = 'mine-cell'; cell.id = `mine-${r}-${c}`; cell.innerText = '🥚'; cell.addEventListener('click', () => revealMine(r,c)); grid.appendChild(cell); } }
}
function revealMine(r, c) {
    if(mineGameOver || mineRevealed[r][c]) return; mineRevealed[r][c] = true; let cell = document.getElementById(`mine-${r}-${c}`); cell.classList.add('revealed');
    if(mineBoard[r][c] === 'M') {
        cell.innerText = '💥'; mineGameOver = true; document.getElementById('game-status').innerText = "앗! 상한 달걀이에요! 😭"; document.getElementById('game-status').style.color = "#e74c3c";
        for(let ir=0; ir<MINE_SIZE; ir++){ for(let ic=0; ic<MINE_SIZE; ic++){ if(mineBoard[ir][ic]==='M' && !mineRevealed[ir][ic]) { let c = document.getElementById(`mine-${ir}-${ic}`); c.innerText = '💥'; c.classList.add('revealed'); } } }
    } else {
        safeCellsCount--; cell.innerText = mineBoard[r][c] > 0 ? mineBoard[r][c] : '';
        if(mineBoard[r][c] === 0) { for(let dr=-1; dr<=1; dr++){ for(let dc=-1; dc<=1; dc++){ let nr=r+dr, nc=c+dc; if(nr>=0 && nc>=0 && nr<MINE_SIZE && nc<MINE_SIZE) revealMine(nr,nc); } } }
        if(safeCellsCount === 0) { mineGameOver = true; document.getElementById('game-status').innerText = "대성공! 맛있는 달걀을 다 찾았어요! 🐣✨"; document.getElementById('game-status').style.color = "#2ecc71"; if(kokoSpeech) kokoSpeech.innerHTML = "와! 지뢰찾기 고수시네요! <img src='icon-party.png' class='ui-icon'>"; }
    }
}

getKokoWeather(); updateKokoAppearance(); renderTabEditor(); renderTabButtons();
console.log("🌟 껌딱지 꼬꼬 V3.5 로드 완료! (말풍선 고정 및 탭 비율, 확장 애니메이션 버그 수정 완료!)");
// --- 파일 끝 ---