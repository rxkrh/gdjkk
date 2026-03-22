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

let todos = JSON.parse(localStorage.getItem('koko_todos')) || [];
let ddays = JSON.parse(localStorage.getItem('koko_ddays')) || [];
let attendance = JSON.parse(localStorage.getItem('koko_attendance')) || { lastDate: "", streak: 0 };
let dailyQuests = { q1: false, q2: false, q3: false }; 

let schedules = JSON.parse(localStorage.getItem('koko_schedules')) || {};
if (Array.isArray(schedules)) schedules = {}; // 구버전 데이터 초기화

let currentCalDate = new Date();
let selectedDateStr = `${currentCalDate.getFullYear()}-${String(currentCalDate.getMonth()+1).padStart(2,'0')}-${String(currentCalDate.getDate()).padStart(2,'0')}`;

const kokoSpeech = document.getElementById('koko-speech');
const kokoChar = document.getElementById('koko');

function syncToCloud() {
    if (auth.currentUser) {
        db.collection('users').doc(auth.currentUser.uid).set({ 
            todos: todos, ddays: ddays, schedules: schedules, attendance: attendance
        }, { merge: true });
    }
}

// ==========================================
// 📱 2. UI 동작 로직 (방탄 코드 ?. 적용 완료)
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
        if(chatDrawer.classList.contains('expanded')) {
            const chatBox = document.getElementById('chat-box');
            if(chatBox) chatBox.scrollTop = chatBox.scrollHeight;
        }
    }
});

// ==========================================
// 📅 3. 캘린더 및 스케줄 로직
// ==========================================
function renderCalendar() {
    const displayObj = document.getElementById('current-month-display');
    if (!displayObj) return; 

    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    displayObj.innerText = `${year}년 ${month + 1}월`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const grid = document.getElementById('calendar-grid');
    if(!grid) return;
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

window.selectDate = (dateStr) => {
    selectedDateStr = dateStr;
    renderCalendar(); 
};

function renderSchedulesForSelected() {
    const infoObj = document.getElementById('selected-date-info');
    if(infoObj) infoObj.innerText = `선택한 날짜: ${selectedDateStr}`;
    
    const list = document.getElementById('schedule-list'); 
    if(!list) return;
    list.innerHTML = '';
    
    const daySchedules = schedules[selectedDateStr] || [];
    daySchedules.sort((a, b) => a.time.localeCompare(b.time));
    
    if(daySchedules.length === 0) {
        list.innerHTML = `<li style="justify-content:center; color:#aaa;">등록된 일정이 없습니다.</li>`;
        return;
    }
    
    daySchedules.forEach((s, i) => { 
        list.innerHTML += `<li><span><span class="schedule-time-badge">${s.time}</span> ${s.task}</span><button class="delete-btn" onclick="deleteSchedule(${i})">❌</button></li>`; 
    });
}

document.getElementById('prev-month-btn')?.addEventListener('click', () => { currentCalDate.setMonth(currentCalDate.getMonth() - 1); renderCalendar(); });
document.getElementById('next-month-btn')?.addEventListener('click', () => { currentCalDate.setMonth(currentCalDate.getMonth() + 1); renderCalendar(); });

document.getElementById('add-schedule-btn')?.addEventListener('click', () => {
    const timeObj = document.getElementById('schedule-time-input');
    const taskObj = document.getElementById('schedule-task-input');
    if(!timeObj || !taskObj) return;
    
    const time = timeObj.value;
    const task = taskObj.value.trim();
    if (!time || !task) { alert("시간과 일정을 모두 입력해주세요!"); return; }
    
    if(!schedules[selectedDateStr]) schedules[selectedDateStr] = [];
    schedules[selectedDateStr].push({ time: time, task: task });
    
    localStorage.setItem('koko_schedules', JSON.stringify(schedules));
    timeObj.value = ''; taskObj.value = '';
    renderCalendar(); syncToCloud();
});

window.deleteSchedule = i => { 
    schedules[selectedDateStr].splice(i, 1); 
    localStorage.setItem('koko_schedules', JSON.stringify(schedules));
    renderCalendar(); syncToCloud(); 
};

// ==========================================
// 🔐 4. 로그인, 프로필, 피드백
// ==========================================
document.getElementById('google-login-btn')?.addEventListener('click', () => auth.signInWithPopup(provider));
document.getElementById('logout-btn')?.addEventListener('click', () => auth.signOut());

auth.onAuthStateChanged((user) => {
    if (user) {
        const loginArea = document.getElementById('login-area');
        const profileArea = document.getElementById('user-profile-area');
        const adminArea = document.getElementById('admin-feedback-area');
        const emailDisplay = document.getElementById('user-email-display');
        
        if(loginArea) loginArea.style.display = 'none';
        if(profileArea) profileArea.style.display = 'block';
        if(emailDisplay) emailDisplay.innerText = `👋 ${user.email}`;
        myUid = user.uid; 

        if (user.uid === ADMIN_UID) {
            if(adminArea) adminArea.style.display = 'block';
            loadAdminFeedbacks();
        } else {
            if(adminArea) adminArea.style.display = 'none';
        }

        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                if (data.todos) { todos = data.todos; renderTodos(); }
                if (data.ddays) { ddays = data.ddays; renderDdays(); }
                if (data.schedules) { schedules = data.schedules; renderCalendar(); }
                if (data.attendance) { attendance = data.attendance; checkAttendanceUI(); }
                if (data.nickname) { 
                    myNickname = data.nickname; 
                    localStorage.setItem('koko_nickname', myNickname); 
                    const nickInput = document.getElementById('nickname-input');
                    const statusObj = document.getElementById('profile-status');
                    if(nickInput) nickInput.value = myNickname; 
                    if(statusObj) statusObj.innerText = "✅ 동기화 완료"; 
                    enableChat(); 
                }
                if (data.lastNicknameChange) lastChangeDate = data.lastNicknameChange.toDate();
                if(kokoSpeech) kokoSpeech.innerHTML = "동기화 완료! 보고 싶었어요 <img src='icon-cloud.png' class='ui-icon'>";
            } else { 
                syncToCloud(); 
                if(kokoSpeech) kokoSpeech.innerHTML = "환영해요! 데이터를 안전하게 보관할게요 <img src='icon-heart.png' class='ui-icon'>"; 
            }
        });
    } else {
        const loginArea = document.getElementById('login-area');
        const profileArea = document.getElementById('user-profile-area');
        const adminArea = document.getElementById('admin-feedback-area');
        if(loginArea) loginArea.style.display = 'block';
        if(profileArea) profileArea.style.display = 'none';
        if(adminArea) adminArea.style.display = 'none';
    }
});

document.getElementById('save-nickname-btn')?.addEventListener('click', async () => {
    const nickInput = document.getElementById('nickname-input');
    const statusObj = document.getElementById('profile-status');
    if(!nickInput || !statusObj) return;
    
    const name = nickInput.value.trim();
    if (!name || name === myNickname) return;
    
    if (lastChangeDate) {
        const diff = (new Date() - lastChangeDate) / 86400000;
        if (diff < 7) { statusObj.innerText = `⏳ 7일 제한 (${Math.ceil(7 - diff)}일 후 가능)`; return; }
    }
    const nameRef = db.collection('nicknames').doc(name);
    const doc = await nameRef.get();
    if (doc.exists && doc.data().uid !== myUid) { statusObj.innerText = "❌ 사용 중인 이름!"; return; }

    if (myNickname) await db.collection('nicknames').doc(myNickname).delete();
    await nameRef.set({ uid: myUid });
    await db.collection('users').doc(myUid).set({ nickname: name, lastNicknameChange: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    myNickname = name; localStorage.setItem('koko_nickname', myNickname); lastChangeDate = new Date();
    statusObj.innerText = "✅ 변경 완료!"; statusObj.style.color = "#2ecc71"; enableChat();
    if(kokoSpeech) kokoSpeech.innerHTML = `새 이름 "${myNickname}", 맘에 들어요! <img src='icon-chat.png' class='ui-icon'>`;
});

const fontSelect = document.getElementById('font-select'); 
const sizeSelect = document.getElementById('size-select');
if (localStorage.getItem('koko_font') && fontSelect) { document.body.style.fontFamily = localStorage.getItem('koko_font'); fontSelect.value = localStorage.getItem('koko_font'); }
fontSelect?.addEventListener('change', e => { document.body.style.fontFamily = e.target.value; localStorage.setItem('koko_font', e.target.value); });
if (localStorage.getItem('koko_font_size') && sizeSelect) { document.body.className = localStorage.getItem('koko_font_size'); sizeSelect.value = localStorage.getItem('koko_font_size'); }
sizeSelect?.addEventListener('change', e => { document.body.className = e.target.value; localStorage.setItem('koko_font_size', e.target.value); if(kokoSpeech) kokoSpeech.innerHTML = "글씨 크기 조절 완료! <img src='icon-sparkle.png' class='ui-icon'>"; });

document.getElementById('open-feedback-btn')?.addEventListener('click', () => { closeMenu(); const modal = document.getElementById('feedback-modal'); if(modal) modal.style.display = 'flex'; });
document.getElementById('close-feedback-btn')?.addEventListener('click', () => { const modal = document.getElementById('feedback-modal'); if(modal) modal.style.display = 'none'; });
document.getElementById('send-feedback-btn')?.addEventListener('click', async () => {
    const txtObj = document.getElementById('feedback-text');
    if(!txtObj) return;
    const txt = txtObj.value.trim(); if (!txt) return;
    await db.collection('feedbacks').add({ text: txt, senderUid: myUid, senderNickname: myNickname || '익명', timestamp: firebase.firestore.FieldValue.serverTimestamp() });
    alert("전송 완료! 🐥"); 
    const modal = document.getElementById('feedback-modal'); if(modal) modal.style.display = 'none'; 
    txtObj.value = '';
});

function loadAdminFeedbacks() {
    db.collection('feedbacks').orderBy('timestamp', 'desc').onSnapshot(snap => {
        const list = document.getElementById('admin-feedback-list'); 
        if(!list) return;
        list.innerHTML = '';
        snap.forEach(doc => { const d = doc.data(); list.innerHTML += `<div style="background:white; padding:10px; border-radius:8px;"><div style="font-weight:bold;"><img src="icon-profile.png" class="ui-icon"> ${d.senderNickname}</div><div>${d.text}</div></div>`; });
    });
}

// ==========================================
// 💬 5. 채팅 로직
// ==========================================
function enableChat() { 
    const input = document.getElementById('chat-input');
    const btn = document.getElementById('send-chat-btn');
    if(input) { input.disabled = false; input.placeholder = "메시지 입력..."; }
    if(btn) btn.disabled = false; 
    loadMessages(); 
}
if(myNickname) enableChat();

document.getElementById('tab-global')?.addEventListener('click', e => { 
    currentChatMode = 'global'; e.target.classList.add('active'); 
    const roomTab = document.getElementById('tab-room'); if(roomTab) roomTab.classList.remove('active'); 
    const codeArea = document.getElementById('room-code-area'); if(codeArea) codeArea.style.display = 'none'; 
    const megaLabel = document.getElementById('megaphone-label'); if(megaLabel) megaLabel.style.display = 'flex'; 
    loadMessages(); 
});

document.getElementById('tab-room')?.addEventListener('click', e => { 
    currentChatMode = 'room'; e.target.classList.add('active'); 
    const globalTab = document.getElementById('tab-global'); if(globalTab) globalTab.classList.remove('active'); 
    const codeArea = document.getElementById('room-code-area'); if(codeArea) codeArea.style.display = 'flex'; 
    const megaLabel = document.getElementById('megaphone-label'); if(megaLabel) megaLabel.style.display = 'none'; 
    const chatBox = document.getElementById('chat-box');
    if(chatBox) chatBox.innerHTML = '<div style="text-align:center; color:#888; font-size:12px; margin-top:30px;">코드를 입력하고 입장하세요 <img src="icon-lock.png" class="ui-icon"></div>'; 
    if(chatUnsubscribe) chatUnsubscribe(); 
});

document.getElementById('join-room-btn')?.addEventListener('click', () => { 
    const codeInput = document.getElementById('room-code-input');
    if(!codeInput) return;
    currentRoomCode = codeInput.value.trim(); 
    loadMessages(); 
    if(kokoSpeech) kokoSpeech.innerHTML = `"${currentRoomCode}" 방 입장! 쉿! <img src="icon-shh.png" class="ui-icon">`; 
});

function loadMessages() {
    if (!myNickname) return;
    if (chatUnsubscribe) chatUnsubscribe(); 
    const chatBox = document.getElementById('chat-box');
    if(chatBox) chatBox.innerHTML = ''; 

    let queryRef = currentChatMode === 'global' ? db.collection('global_messages') : (currentRoomCode ? db.collection('secret_rooms').doc(currentRoomCode).collection('messages') : null);
    if (!queryRef) return;
    let isInit = true; 

    chatUnsubscribe = queryRef.orderBy('timestamp').onSnapshot(snap => {
        snap.docChanges().forEach(change => {
            if (change.type === 'added') {
                const data = change.doc.data();
                const preview = document.getElementById('chat-preview-text');
                if(preview) preview.innerHTML = `<img src="icon-chat.png" class="ui-icon"> ${data.sender}: ${data.text}`;
                
                const isMe = data.uid ? (data.uid === myUid) : (data.sender === myNickname);
                const shakeClass = (data.megaphone && !isInit) ? 'shake' : '';
                const msgDiv = document.createElement('div');
                msgDiv.className = `chat-message ${isMe ? 'me' : 'other'} ${data.megaphone ? 'megaphone' : ''} ${shakeClass}`;
                
                if (!isMe) { const sDiv = document.createElement('div'); sDiv.className = 'chat-sender'; sDiv.innerText = data.sender; msgDiv.appendChild(sDiv); }
                const tDiv = document.createElement('div');
                if (data.megaphone) { tDiv.innerHTML = '<img src="icon-mega.png" class="ui-icon"> '; tDiv.appendChild(document.createTextNode(data.text)); } 
                else { tDiv.innerText = data.text; }
                msgDiv.appendChild(tDiv); 
                if(chatBox) chatBox.appendChild(msgDiv);
            }
        });
        isInit = false; 
        if(chatBox) chatBox.scrollTop = chatBox.scrollHeight;
    });
}

document.getElementById('send-chat-btn')?.addEventListener('click', () => {
    const chatInput = document.getElementById('chat-input');
    if(!chatInput) return;
    const text = chatInput.value.trim(); 
    if (!text || !myNickname) return;
    
    const megaCheck = document.getElementById('megaphone-check');
    const isMega = megaCheck ? megaCheck.checked : false;
    
    const data = { text: text, sender: myNickname, uid: myUid, megaphone: isMega, timestamp: firebase.firestore.FieldValue.serverTimestamp() };
    if (currentChatMode === 'global') db.collection('global_messages').add(data); 
    else db.collection('secret_rooms').doc(currentRoomCode).collection('messages').add(data);
    
    chatInput.value = ''; 
    if(megaCheck) megaCheck.checked = false;
});

// ==========================================
// 🏆 6. 퀘스트, 투두, 디데이, 날씨 로직
// ==========================================
function checkAttendanceUI() {
    const todayStr = new Date().toDateString();
    const btn = document.getElementById('attendance-btn');
    const streak = document.getElementById('attendance-streak');
    if(streak) streak.innerText = attendance.streak;
    
    if(btn) {
        if (attendance.lastDate === todayStr) { 
            btn.innerHTML = `오늘 출석 완료! <img src="icon-fire.png" class="ui-icon">`; 
            btn.disabled = true; btn.style.backgroundColor = "#aaa"; 
            completeQuest(2); 
        } else { 
            btn.innerHTML = `오늘의 출석체크 도장 찍기 <img src="icon-check.png" class="ui-icon" style="filter: brightness(0) invert(1);">`; 
            btn.disabled = false; btn.style.backgroundColor = "#2ecc71"; 
        }
    }
}

document.getElementById('attendance-btn')?.addEventListener('click', () => { 
    const todayStr = new Date().toDateString(); 
    attendance.lastDate = todayStr; 
    attendance.streak += 1; 
    localStorage.setItem('koko_attendance', JSON.stringify(attendance)); 
    syncToCloud(); 
    checkAttendanceUI(); 
    if(kokoSpeech) kokoSpeech.innerHTML = `출석 도장 꾹! 연속 ${attendance.streak}일째! <img src="icon-party.png" class="ui-icon">`; 
});

function completeQuest(questNum) { 
    if (!dailyQuests[`q${questNum}`]) { 
        dailyQuests[`q${questNum}`] = true; 
        const qObj = document.getElementById(`quest-${questNum}`);
        if(qObj) qObj.innerHTML = `<span style="color:#2ecc71; font-weight:bold; text-decoration:line-through;"><img src="icon-check.png" class="ui-icon"> 퀘스트 완료!</span>`; 
        if(kokoChar) { kokoChar.style.transform="scale(1.1)"; setTimeout(()=>kokoChar.style.transform="scale(1)",300); }
    } 
}
checkAttendanceUI(); 

function renderTodos() { 
    const list = document.getElementById('todo-list'); 
    const btn = document.getElementById('feed-btn');
    if(!list) return;
    list.innerHTML = ''; let anyChecked = false; 
    todos.forEach((t, i) => { 
        list.innerHTML += `<li><label style="cursor:pointer; display:flex; gap:8px;"><input type="checkbox" ${t.checked ? 'checked' : ''} onchange="toggleTodo(${i})"><span style="${t.checked ? 'text-decoration:line-through; color:#aaa;' : ''}">${t.text}</span></label><button class="delete-btn" onclick="deleteTodo(${i})">❌</button></li>`; 
        if (t.checked) anyChecked = true; 
    }); 
    if(btn) btn.disabled = !anyChecked; 
}

document.getElementById('add-todo-btn')?.addEventListener('click', () => { 
    const input = document.getElementById('new-todo-input');
    if(!input) return;
    const txt = input.value.trim(); 
    if (!txt) return; 
    todos.push({ text: txt, checked: false }); 
    input.value=''; renderTodos(); syncToCloud(); 
});

window.toggleTodo = i => { todos[i].checked = !todos[i].checked; renderTodos(); syncToCloud(); if(todos[i].checked) completeQuest(3); };
window.deleteTodo = i => { todos.splice(i, 1); renderTodos(); syncToCloud(); };

document.getElementById('feed-btn')?.addEventListener('click', () => { 
    if(kokoSpeech) kokoSpeech.innerHTML="냠냠! 너무 맛있어요 <img src='icon-100.png' class='ui-icon'>"; 
    todos = todos.filter(t => !t.checked); syncToCloud(); 
    setTimeout(()=>{ renderTodos(); if(kokoSpeech) kokoSpeech.innerHTML="다음 할 일도 화이팅! <img src='icon-chick.png' class='ui-icon'>";}, 2000); 
});
renderTodos();

function renderDdays() { 
    const list = document.getElementById('dday-list-display'); 
    const info = document.querySelector('.d-day-info');
    if(!list || !info) return;
    list.innerHTML = ''; 
    if (ddays.length === 0) { info.innerHTML = "<img src='icon-pin.png' class='ui-icon'> 디데이를 추가해보세요!"; return; } 
    
    const today = new Date(); today.setHours(0,0,0,0); 
    const calc = ddays.map(d => { const t = new Date(d.date); t.setHours(0,0,0,0); return { ...d, diff: Math.ceil((t-today)/86400000) }; }); 
    calc.forEach((d, i) => { 
        let badge = d.diff === 0 ? `<span style="color:#ff6b6b;font-weight:bold;">D-Day<img src="icon-party.png" class="ui-icon"></span>` : (d.diff > 0 ? `<span style="color:#ff9f43;font-weight:bold;">D-${d.diff}</span>` : `<span style="color:#888;font-weight:bold;">D+${Math.abs(d.diff)}</span>`); 
        list.innerHTML += `<li><span><strong>${d.title}</strong> <span style="font-size:12px;color:#999;">(${d.date})</span> ${badge}</span><button class="delete-btn" onclick="deleteDday(${i})">❌</button></li>`; 
    }); 
    const cl = calc.reduce((p, c) => Math.abs(c.diff) < Math.abs(p.diff) ? c : p); 
    info.innerHTML = cl.diff === 0 ? `<img src="icon-pin.png" class="ui-icon"> ${cl.title} D-Day!` : (cl.diff > 0 ? `<img src="icon-pin.png" class="ui-icon"> ${cl.title} D-${cl.diff}` : `<img src="icon-pin.png" class="ui-icon"> ${cl.title} D+${Math.abs(cl.diff)}`); 
}

document.getElementById('save-dday-btn')?.addEventListener('click', () => { 
    const tObj = document.getElementById('dday-title-input');
    const dObj = document.getElementById('dday-date-input');
    if(!tObj || !dObj) return;
    const t=tObj.value; const d=dObj.value; 
    if(t&&d){ ddays.push({title:t, date:d}); renderDdays(); syncToCloud(); }
});
window.deleteDday = i => { ddays.splice(i, 1); renderDdays(); syncToCloud(); };
renderDdays();

function getKokoWeather() { 
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(p=>{ 
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.coords.latitude}&longitude=${p.coords.longitude}&current_weather=true`)
            .then(r=>r.json())
            .then(d=>{ 
                const wInfo = document.querySelector('.weather-info');
                if(wInfo) wInfo.innerHTML=`<img src="${d.current_weather.weathercode<=1?'icon-sun.png':(d.current_weather.weathercode<=45?'icon-cloud.png':'icon-rain.png')}" class="ui-icon"> ${d.current_weather.temperature}°C`; 
            }); 
        }); 
    }
}
getKokoWeather();

const fortunes = ["행운 컬러: 노랑💛", "기분 좋은 일 발생!✨", "소중한 사람에게 연락해봐요💌", "금전운 최고!💰"];
document.getElementById('fortune-btn')?.addEventListener('click', () => { 
    if(kokoSpeech) kokoSpeech.innerText = fortunes[Math.floor(Math.random()*fortunes.length)]; 
    if(kokoChar) { kokoChar.style.transform="translateY(-20px)"; setTimeout(()=>kokoChar.style.transform="translateY(0)",200); }
});

kokoChar?.addEventListener('click', () => { 
    completeQuest(1); 
    const h=new Date().getHours(); 
    if(kokoSpeech) kokoSpeech.innerHTML= h<12?"아침 화이팅! <img src='icon-sun.png' class='ui-icon'>":(h<18?"나른한 오후 <img src='icon-cloud.png' class='ui-icon'>":"수고했어요! <img src='icon-moon.png' class='ui-icon'>"); 
    if(kokoChar) { kokoChar.style.transform="translateY(-20px)"; setTimeout(()=>kokoChar.style.transform="translateY(0)",200); }
});

// 초기 렌더링 호출
renderCalendar();

console.log("🛡️ 방탄 자바스크립트 V2.3 완벽 로드 완료! HTML 버튼이 누락되어도 에러 없이 작동합니다! 🛡️");
// --- 파일 끝 ---