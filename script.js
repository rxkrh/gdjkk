// --- 0. Firebase 설정 ---
// 🚨 아래 정보와 ADMIN_UID를 본인 것으로 꼭 변경하세요!
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

const kokoSpeech = document.getElementById('koko-speech');
const kokoChar = document.getElementById('koko');
let myUid = localStorage.getItem('koko_uid') || ('user_' + Date.now());
localStorage.setItem('koko_uid', myUid);

function syncToCloud() {
    if (auth.currentUser) db.collection('users').doc(auth.currentUser.uid).set({ todos: todos, ddays: ddays }, { merge: true });
}

// ==========================================
// 📱 1. 새로운 UI 동작 로직 (사이드메뉴, 탭, 채팅창)
// ==========================================
const menuBtn = document.getElementById('menu-open-btn');
const menuCloseBtn = document.getElementById('menu-close-btn');
const sideMenu = document.getElementById('side-menu');
const overlay = document.getElementById('side-menu-overlay');

menuBtn.addEventListener('click', () => { sideMenu.classList.add('open'); overlay.style.display = 'block'; });
const closeMenu = () => { sideMenu.classList.remove('open'); overlay.style.display = 'none'; };
menuCloseBtn.addEventListener('click', closeMenu);
overlay.addEventListener('click', closeMenu);

const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.target).classList.add('active');
    });
});

const chatDrawer = document.getElementById('chat-drawer');
const chatHeaderBar = document.getElementById('chat-header-bar');
const chatToggleIcon = document.getElementById('chat-toggle-icon');

chatHeaderBar.addEventListener('click', () => {
    chatDrawer.classList.toggle('collapsed');
    chatDrawer.classList.toggle('expanded');
    // 열림/닫힘 상태에 따라 아이콘 변경 (미리 준비하신 파일명으로 수정하세요)
    chatToggleIcon.innerHTML = chatDrawer.classList.contains('expanded') ? '<img src="icon-down.png" class="ui-icon">' : '<img src="icon-up.png" class="ui-icon">';
    if(chatDrawer.classList.contains('expanded')) {
        const chatBox = document.getElementById('chat-box');
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});


// ==========================================
// 🔐 2. 로그인, 프로필, 피드백, 설정
// ==========================================
let lastChangeDate = null; 
let myNickname = localStorage.getItem('koko_nickname') || '';

document.getElementById('google-login-btn').addEventListener('click', () => auth.signInWithPopup(provider));
document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());

auth.onAuthStateChanged((user) => {
    if (user) {
        document.getElementById('login-area').style.display = 'none';
        document.getElementById('user-profile-area').style.display = 'block';
        document.getElementById('user-email-display').innerText = `👋 ${user.email}`;
        myUid = user.uid; 

        if (user.uid === ADMIN_UID) {
            document.getElementById('admin-feedback-area').style.display = 'block';
            loadAdminFeedbacks();
        } else {
            document.getElementById('admin-feedback-area').style.display = 'none';
        }

        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                if (data.todos) { todos = data.todos; renderTodos(); }
                if (data.ddays) { ddays = data.ddays; renderDdays(); }
                if (data.nickname) {
                    myNickname = data.nickname; localStorage.setItem('koko_nickname', myNickname);
                    document.getElementById('nickname-input').value = myNickname;
                    document.getElementById('profile-status').innerText = "✅ 동기화 완료";
                    enableChat();
                }
                if (data.lastNicknameChange) lastChangeDate = data.lastNicknameChange.toDate();
                kokoSpeech.innerHTML = "동기화 완료! 보고 싶었어요 <img src='icon-cloud.png' class='ui-icon'>";
            } else {
                syncToCloud();
                kokoSpeech.innerHTML = "환영해요! 데이터를 안전하게 보관할게요 <img src='icon-heart.png' class='ui-icon'>";
            }
        });
    } else {
        document.getElementById('login-area').style.display = 'block';
        document.getElementById('user-profile-area').style.display = 'none';
        document.getElementById('admin-feedback-area').style.display = 'none';
    }
});

document.getElementById('save-nickname-btn').addEventListener('click', async () => {
    const name = document.getElementById('nickname-input').value.trim();
    if (!name || name === myNickname) return;
    const status = document.getElementById('profile-status');

    if (lastChangeDate) {
        const diff = (new Date() - lastChangeDate) / 86400000;
        if (diff < 7) { status.innerText = `⏳ 7일 제한 (${Math.ceil(7 - diff)}일 후 가능)`; return; }
    }
    const nameRef = db.collection('nicknames').doc(name);
    const doc = await nameRef.get();
    if (doc.exists && doc.data().uid !== myUid) { status.innerText = "❌ 사용 중인 이름!"; return; }

    if (myNickname) await db.collection('nicknames').doc(myNickname).delete();
    await nameRef.set({ uid: myUid });
    await db.collection('users').doc(myUid).set({ nickname: name, lastNicknameChange: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    
    myNickname = name; localStorage.setItem('koko_nickname', myNickname); lastChangeDate = new Date();
    status.innerText = "✅ 변경 완료!"; status.style.color = "#2ecc71"; enableChat();
    kokoSpeech.innerHTML = `새 이름 "${myNickname}", 맘에 들어요! <img src='icon-chat.png' class='ui-icon'>`;
});

const fontSelect = document.getElementById('font-select'); const sizeSelect = document.getElementById('size-select');
if (localStorage.getItem('koko_font')) { document.body.style.fontFamily = localStorage.getItem('koko_font'); fontSelect.value = localStorage.getItem('koko_font'); }
fontSelect.addEventListener('change', e => { document.body.style.fontFamily = e.target.value; localStorage.setItem('koko_font', e.target.value); });
if (localStorage.getItem('koko_font_size')) { document.body.className = localStorage.getItem('koko_font_size'); sizeSelect.value = localStorage.getItem('koko_font_size'); }
sizeSelect.addEventListener('change', e => { document.body.className = e.target.value; localStorage.setItem('koko_font_size', e.target.value); kokoSpeech.innerHTML = "글씨 크기 조절 완료! <img src='icon-sparkle.png' class='ui-icon'>"; });

document.getElementById('open-feedback-btn').addEventListener('click', () => { closeMenu(); document.getElementById('feedback-modal').style.display = 'flex'; });
document.getElementById('close-feedback-btn').addEventListener('click', () => document.getElementById('feedback-modal').style.display = 'none');
document.getElementById('send-feedback-btn').addEventListener('click', async () => {
    const txt = document.getElementById('feedback-text').value.trim(); if (!txt) return;
    await db.collection('feedbacks').add({ text: txt, senderUid: myUid, senderNickname: myNickname || '익명', timestamp: firebase.firestore.FieldValue.serverTimestamp() });
    alert("전송 완료! 🐥"); document.getElementById('feedback-modal').style.display = 'none'; document.getElementById('feedback-text').value = '';
});
function loadAdminFeedbacks() {
    db.collection('feedbacks').orderBy('timestamp', 'desc').onSnapshot(snap => {
        const list = document.getElementById('admin-feedback-list'); list.innerHTML = '';
        snap.forEach(doc => { const d = doc.data(); list.innerHTML += `<div style="background:white; padding:10px; border-radius:8px;"><div style="font-weight:bold;"><img src="icon-profile.png" class="ui-icon"> ${d.senderNickname}</div><div>${d.text}</div></div>`; });
    });
}

// ==========================================
// 💬 3. 팝업 채팅창 로직
// ==========================================
function enableChat() { document.getElementById('chat-input').disabled = false; document.getElementById('send-chat-btn').disabled = false; document.getElementById('chat-input').placeholder = "메시지 입력..."; loadMessages(); }
if(myNickname) enableChat();

let currentChatMode = 'global'; let currentRoomCode = ''; let chatUnsubscribe = null;
document.getElementById('tab-global').addEventListener('click', e => { currentChatMode = 'global'; e.target.classList.add('active'); document.getElementById('tab-room').classList.remove('active'); document.getElementById('room-code-area').style.display = 'none'; loadMessages(); });
document.getElementById('tab-room').addEventListener('click', e => { currentChatMode = 'room'; e.target.classList.add('active'); document.getElementById('tab-global').classList.remove('active'); document.getElementById('room-code-area').style.display = 'block'; document.getElementById('chat-box').innerHTML = '<div style="text-align:center; color:#888; font-size:12px; margin-top:30px;">코드를 입력하고 입장하세요 <img src="icon-lock.png" class="ui-icon"></div>'; if(chatUnsubscribe) chatUnsubscribe(); });
document.getElementById('join-room-btn').addEventListener('click', () => { currentRoomCode = document.getElementById('room-code-input').value.trim(); loadMessages(); kokoSpeech.innerHTML = `"${currentRoomCode}" 방 입장! 쉿! <img src="icon-shh.png" class="ui-icon">`; });

function loadMessages() {
    if (!myNickname) return;
    if (chatUnsubscribe) chatUnsubscribe(); document.getElementById('chat-box').innerHTML = ''; 
    let queryRef = currentChatMode === 'global' ? db.collection('global_messages') : (currentRoomCode ? db.collection('secret_rooms').doc(currentRoomCode).collection('messages') : null);
    if (!queryRef) return;
    let isInit = true; 

    chatUnsubscribe = queryRef.orderBy('timestamp').onSnapshot(snap => {
        snap.docChanges().forEach(change => {
            if (change.type === 'added') {
                const data = change.doc.data();
                
                document.getElementById('chat-preview-text').innerHTML = `<img src="icon-chat.png" class="ui-icon"> ${data.sender}: ${data.text}`;

                const isMe = data.uid ? (data.uid === myUid) : (data.sender === myNickname);
                const shakeClass = (data.megaphone && !isInit) ? 'shake' : '';
                const msgDiv = document.createElement('div');
                msgDiv.className = `chat-message ${isMe ? 'me' : 'other'} ${data.megaphone ? 'megaphone' : ''} ${shakeClass}`;
                if (!isMe) { const sDiv = document.createElement('div'); sDiv.className = 'chat-sender'; sDiv.innerText = data.sender; msgDiv.appendChild(sDiv); }
                
                const tDiv = document.createElement('div');
                // 확성기 메시지일 경우 아이콘을 추가하고 텍스트 삽입 (보안을 위해 innerText 사용)
                if (data.megaphone) {
                    tDiv.innerHTML = '<img src="icon-mega.png" class="ui-icon"> ';
                    tDiv.appendChild(document.createTextNode(data.text));
                } else {
                    tDiv.innerText = data.text;
                }
                msgDiv.appendChild(tDiv);
                document.getElementById('chat-box').appendChild(msgDiv);
            }
        });
        isInit = false; 
        document.getElementById('chat-box').scrollTop = document.getElementById('chat-box').scrollHeight;
    });
}
document.getElementById('send-chat-btn').addEventListener('click', () => {
    const text = document.getElementById('chat-input').value.trim(); if (!text || !myNickname) return;
    const isMega = document.getElementById('megaphone-check').checked;
    const data = { text: text, sender: myNickname, uid: myUid, megaphone: isMega, timestamp: firebase.firestore.FieldValue.serverTimestamp() };
    if (currentChatMode === 'global') db.collection('global_messages').add(data); else db.collection('secret_rooms').doc(currentRoomCode).collection('messages').add(data);
    document.getElementById('chat-input').value = ''; document.getElementById('megaphone-check').checked = false;
});

// ==========================================
// 📝 4. 투두, 디데이, 날씨, 운세 로직
// ==========================================
let todos = JSON.parse(localStorage.getItem('koko_todos')) || [];
function renderTodos() {
    const list = document.getElementById('todo-list'); list.innerHTML = ''; let anyChecked = false;
    todos.forEach((t, i) => { list.innerHTML += `<li><label style="cursor:pointer; display:flex; gap:8px;"><input type="checkbox" ${t.checked ? 'checked' : ''} onchange="toggleTodo(${i})"><span style="${t.checked ? 'text-decoration:line-through; color:#aaa;' : ''}">${t.text}</span></label><button class="delete-btn" onclick="deleteTodo(${i})">❌</button></li>`; if (t.checked) anyChecked = true; });
    document.getElementById('feed-btn').disabled = !anyChecked;
}
document.getElementById('add-todo-btn').addEventListener('click', () => { const txt = document.getElementById('new-todo-input').value.trim(); if (!txt) return; todos.push({ text: txt, checked: false }); document.getElementById('new-todo-input').value=''; renderTodos(); syncToCloud(); });
window.toggleTodo = i => { todos[i].checked = !todos[i].checked; renderTodos(); syncToCloud(); };
window.deleteTodo = i => { todos.splice(i, 1); renderTodos(); syncToCloud(); };
document.getElementById('feed-btn').addEventListener('click', () => { kokoSpeech.innerHTML="냠냠! 너무 맛있어요 <img src='icon-100.png' class='ui-icon'>"; todos = todos.filter(t => !t.checked); syncToCloud(); setTimeout(()=>{ renderTodos(); kokoSpeech.innerHTML="다음 할 일도 화이팅! <img src='icon-chick.png' class='ui-icon'>";}, 2000); });
renderTodos();

let ddays = JSON.parse(localStorage.getItem('koko_ddays')) || [];
function renderDdays() {
    const list = document.getElementById('dday-list-display'); list.innerHTML = ''; 
    if (ddays.length === 0) { document.querySelector('.d-day-info').innerHTML = "<img src='icon-flag.png' class='ui-icon'> 디데이를 추가해보세요!"; return; }
    const today = new Date(); today.setHours(0,0,0,0);
    const calc = ddays.map(d => { const t = new Date(d.date); t.setHours(0,0,0,0); return { ...d, diff: Math.ceil((t-today)/86400000) }; });
    calc.forEach((d, i) => { 
        let badge = d.diff === 0 ? `<span style="color:#ff6b6b;">D-Day<img src="icon-party.png" class="ui-icon"></span>` : (d.diff > 0 ? `<span style="color:#ff9f43;">D-${d.diff}</span>` : `<span style="color:#888;">D+${Math.abs(d.diff)}</span>`);
        list.innerHTML += `<li><span><strong>${d.title}</strong> <span style="font-size:12px;color:#999;">(${d.date})</span> ${badge}</span><button class="delete-btn" onclick="deleteDday(${i})">❌</button></li>`;
    });
    const cl = calc.reduce((p, c) => Math.abs(c.diff) < Math.abs(p.diff) ? c : p);
    document.querySelector('.d-day-info').innerHTML = cl.diff === 0 ? `<img src="icon-dday.png" class="ui-icon"> ${cl.title} D-Day!` : (cl.diff > 0 ? `<img src="icon-dday.png" class="ui-icon"> ${cl.title} D-${cl.diff}` : `<img src="icon-dday.png" class="ui-icon"> ${cl.title} D+${Math.abs(cl.diff)}`);
}
document.getElementById('save-dday-btn').addEventListener('click', () => { const t=document.getElementById('dday-title-input').value; const d=document.getElementById('dday-date-input').value; if(t&&d){ ddays.push({title:t, date:d}); renderDdays(); syncToCloud(); }});
window.deleteDday = i => { ddays.splice(i, 1); renderDdays(); syncToCloud(); };
renderDdays();

function getKokoWeather() { if(navigator.geolocation) navigator.geolocation.getCurrentPosition(p=>{ fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.coords.latitude}&longitude=${p.coords.longitude}&current_weather=true`).then(r=>r.json()).then(d=>{ document.querySelector('.weather-info').innerHTML=`<img src="${d.current_weather.weathercode<=1?'icon-sun.png':(d.current_weather.weathercode<=45?'icon-cloud.png':'icon-rain.png')}" class="ui-icon"> ${d.current_weather.temperature}°C`; }); }); }
getKokoWeather();

const fortunes = ["행운 컬러: 노랑💛", "기분 좋은 일 발생!✨", "소중한 사람에게 연락해봐요💌", "금전운 최고!💰"];
document.getElementById('fortune-btn').addEventListener('click', () => { kokoSpeech.innerText = fortunes[Math.floor(Math.random()*fortunes.length)]; kokoChar.style.transform="translateY(-20px)"; setTimeout(()=>kokoChar.style.transform="translateY(0)",200); });
kokoChar.addEventListener('click', () => { const h=new Date().getHours(); kokoSpeech.innerHTML= h<12?"아침 화이팅! <img src='icon-sun.png' class='ui-icon'>":(h<18?"나른한 오후 <img src='icon-cloud.png' class='ui-icon'>":"수고했어요! <img src='icon-moon.png' class='ui-icon'>"); kokoChar.style.transform="translateY(-20px)"; setTimeout(()=>kokoChar.style.transform="translateY(0)",200); });