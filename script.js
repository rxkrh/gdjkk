// --- 0. Firebase 서버 연결 세팅 ---
// 🚨 파이어베이스 정보로 다시 변경해주세요!
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

// 🚨 본인의 구글 UID로 반드시 교체하세요! (콘솔에서 확인한 값)
const ADMIN_UID = "2WlMcOeAJoRHRg28Mqw2oXK0Jia2"; 

const kokoSpeech = document.getElementById('koko-speech');
const kokoChar = document.getElementById('koko');

let myUid = localStorage.getItem('koko_uid');
if (!myUid) {
    myUid = 'user_' + Date.now() + Math.floor(Math.random() * 1000);
    localStorage.setItem('koko_uid', myUid);
}

function syncToCloud() {
    if (auth.currentUser) {
        db.collection('users').doc(auth.currentUser.uid).set({
            todos: todos, ddays: ddays
        }, { merge: true }).catch(err => console.error("동기화 에러:", err));
    }
}

// ==========================================
// 🔐 1. 로그인, 권한 체크 및 데이터 동기화
// ==========================================
const loginArea = document.getElementById('login-area');
const userProfileArea = document.getElementById('user-profile-area');
const googleLoginBtn = document.getElementById('google-login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userEmailDisplay = document.getElementById('user-email-display');
let lastChangeDate = null; 

googleLoginBtn.addEventListener('click', () => {
    auth.signInWithPopup(provider).catch(error => alert("로그인 중 문제가 발생했습니다."));
});
logoutBtn.addEventListener('click', () => auth.signOut());

auth.onAuthStateChanged((user) => {
    if (user) {
        loginArea.style.display = 'none';
        userProfileArea.style.display = 'block';
        userEmailDisplay.innerText = `👋 ${user.email}`;
        myUid = user.uid; 

        // 👑 관리자 권한 체크
        if (user.uid === ADMIN_UID) {
            document.getElementById('admin-feedback-area').style.display = 'block';
            loadAdminFeedbacks();
            kokoSpeech.innerText = "개발자님, 환영합니다! 도착한 쪽지를 확인해보세요 👑";
        } else {
            document.getElementById('admin-feedback-area').style.display = 'none';
        }

        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                if (data.todos) { todos = data.todos; localStorage.setItem('koko_todos', JSON.stringify(todos)); renderTodos(); }
                if (data.ddays) { ddays = data.ddays; localStorage.setItem('koko_ddays', JSON.stringify(ddays)); renderDdays(); }
                if (data.nickname) {
                    myNickname = data.nickname;
                    localStorage.setItem('koko_nickname', myNickname);
                    document.getElementById('nickname-input').value = myNickname;
                    document.getElementById('profile-status').innerText = "✅ 클라우드에서 닉네임을 불러왔어요.";
                    document.getElementById('profile-status').style.color = "#2ecc71";
                    enableChat();
                }
                if (data.lastNicknameChange) lastChangeDate = data.lastNicknameChange.toDate();
                if (user.uid !== ADMIN_UID) kokoSpeech.innerText = "클라우드 동기화 완료! 보고 싶었어요 🐥☁️";
            } else {
                syncToCloud();
                if (user.uid !== ADMIN_UID) kokoSpeech.innerText = "첫 로그인 환영해요! 데이터를 안전하게 보관할게요 🐥💖";
            }
        });
    } else {
        loginArea.style.display = 'block';
        userProfileArea.style.display = 'none';
        userEmailDisplay.innerText = '';
        document.getElementById('admin-feedback-area').style.display = 'none';
    }
});

// ==========================================
// 👤 2. 프로필 & 닉네임 7일 제한 로직
// ==========================================
const nicknameInput = document.getElementById('nickname-input');
const saveNicknameBtn = document.getElementById('save-nickname-btn');
const profileStatus = document.getElementById('profile-status');
let myNickname = localStorage.getItem('koko_nickname') || '';

saveNicknameBtn.addEventListener('click', async () => {
    const name = nicknameInput.value.trim();
    if (!name || name === myNickname) return;

    if (lastChangeDate) {
        const now = new Date();
        const diffDays = (now.getTime() - lastChangeDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays < 7) {
            profileStatus.innerText = `⏳ 닉네임은 7일에 한 번만 변경 가능해요! (${Math.ceil(7 - diffDays)}일 후 가능)`;
            profileStatus.style.color = "#ff6b6b";
            return; 
        }
    }

    try {
        const nameRef = db.collection('nicknames').doc(name);
        const doc = await nameRef.get();
        if (doc.exists && doc.data().uid !== myUid) {
            profileStatus.innerText = "❌ 이미 누군가 사용 중인 닉네임이에요! 삐약!";
            profileStatus.style.color = "#ff6b6b"; return;
        }

        if (myNickname) await db.collection('nicknames').doc(myNickname).delete();
        await nameRef.set({ uid: myUid });
        await db.collection('users').doc(myUid).set({
            nickname: name, lastNicknameChange: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        myNickname = name; localStorage.setItem('koko_nickname', myNickname); lastChangeDate = new Date();
        profileStatus.innerText = "✅ 닉네임이 성공적으로 변경되었어요!"; profileStatus.style.color = "#2ecc71";
        kokoSpeech.innerText = `새로운 이름 "${myNickname}", 마음에 쏙 들어요! 💬`;
        enableChat();
    } catch (err) { console.error("닉네임 변경 에러:", err); }
});

function enableChat() {
    document.getElementById('chat-input').disabled = false; document.getElementById('send-chat-btn').disabled = false;
    document.getElementById('chat-input').placeholder = "메시지를 입력하세요..."; loadMessages();
}

// ==========================================
// 💬 3. 채팅 로직 (동일 인물 인식 기능)
// ==========================================
const chatBox = document.getElementById('chat-box'); const chatInput = document.getElementById('chat-input'); const sendChatBtn = document.getElementById('send-chat-btn');
const tabGlobal = document.getElementById('tab-global'); const tabRoom = document.getElementById('tab-room');
const roomCodeArea = document.getElementById('room-code-area'); const roomCodeInput = document.getElementById('room-code-input'); const joinRoomBtn = document.getElementById('join-room-btn');
const megaphoneArea = document.getElementById('megaphone-area'); const megaphoneCheck = document.getElementById('megaphone-check');

let currentChatMode = 'global'; let currentRoomCode = ''; let chatUnsubscribe = null;

tabGlobal.addEventListener('click', () => { currentChatMode = 'global'; tabGlobal.classList.add('active'); tabRoom.classList.remove('active'); roomCodeArea.style.display = 'none'; megaphoneArea.style.display = 'block'; loadMessages(); });
tabRoom.addEventListener('click', () => { currentChatMode = 'room'; tabRoom.classList.add('active'); tabGlobal.classList.remove('active'); roomCodeArea.style.display = 'block'; megaphoneArea.style.display = 'none'; megaphoneCheck.checked = false; chatBox.innerHTML = '<div style="text-align:center; color:#888; font-size:12px; margin-top:50px;">비밀방 코드를 입력하고 입장해주세요 🔒</div>'; if(chatUnsubscribe) chatUnsubscribe(); });
joinRoomBtn.addEventListener('click', () => { const code = roomCodeInput.value.trim(); if (!code) { alert("방 코드를 입력해주세요!"); return; } currentRoomCode = code; kokoSpeech.innerText = `"${code}" 방에 입장했습니다! 쉿! 🤫`; loadMessages(); });

function loadMessages() {
    if (!myNickname) return;
    if (chatUnsubscribe) chatUnsubscribe(); chatBox.innerHTML = ''; 

    let queryRef = currentChatMode === 'global' ? db.collection('global_messages') : (currentRoomCode ? db.collection('secret_rooms').doc(currentRoomCode).collection('messages') : null);
    if (!queryRef) return;
    let isInitialLoad = true; 

    chatUnsubscribe = queryRef.orderBy('timestamp').onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const data = change.doc.data(); const msgDiv = document.createElement('div');
                const isMe = data.uid ? (data.uid === myUid) : (data.sender === myNickname);
                const shakeClass = (data.megaphone && !isInitialLoad) ? 'shake' : '';
                msgDiv.className = `chat-message ${isMe ? 'me' : 'other'} ${data.megaphone ? 'megaphone' : ''} ${shakeClass}`;
                
                if (!isMe) { const senderDiv = document.createElement('div'); senderDiv.className = 'chat-sender'; senderDiv.innerText = data.sender; msgDiv.appendChild(senderDiv); }
                const textDiv = document.createElement('div'); textDiv.innerText = (data.megaphone ? '📢 ' : '') + data.text; msgDiv.appendChild(textDiv);
                chatBox.appendChild(msgDiv);
            }
        });
        isInitialLoad = false; chatBox.scrollTop = chatBox.scrollHeight;
    });
}

function sendMessage() {
    const text = chatInput.value.trim(); if (!text || !myNickname) return;
    if (currentChatMode === 'room' && !currentRoomCode) { alert("비밀방 코드를 먼저 입력하고 입장해주세요!"); return; }

    const isMegaphone = (currentChatMode === 'global' && megaphoneCheck.checked);
    const msgData = { text: text, sender: myNickname, uid: myUid, megaphone: isMegaphone, timestamp: firebase.firestore.FieldValue.serverTimestamp() };

    if (currentChatMode === 'global') db.collection('global_messages').add(msgData); else db.collection('secret_rooms').doc(currentRoomCode).collection('messages').add(msgData);
    chatInput.value = ''; megaphoneCheck.checked = false; 
}
sendChatBtn.addEventListener('click', sendMessage); chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

// ==========================================
// 📮 4. 피드백 쪽지 기능 & 관리자 로직
// ==========================================
const openFeedbackBtn = document.getElementById('open-feedback-btn'); const closeFeedbackBtn = document.getElementById('close-feedback-btn');
const sendFeedbackBtn = document.getElementById('send-feedback-btn'); const feedbackModal = document.getElementById('feedback-modal');
const feedbackText = document.getElementById('feedback-text'); const adminFeedbackList = document.getElementById('admin-feedback-list');

openFeedbackBtn.addEventListener('click', () => {
    if (!myNickname) { alert("프로필에서 닉네임을 먼저 등록해야 쪽지를 보낼 수 있어요!"); return; }
    feedbackModal.style.display = 'flex';
});
closeFeedbackBtn.addEventListener('click', () => { feedbackModal.style.display = 'none'; feedbackText.value = ''; });

sendFeedbackBtn.addEventListener('click', async () => {
    const text = feedbackText.value.trim(); if (!text) { alert("내용을 입력해주세요!"); return; }
    try {
        sendFeedbackBtn.disabled = true; sendFeedbackBtn.innerText = "전송 중...";
        await db.collection('feedbacks').add({ text: text, senderUid: myUid, senderNickname: myNickname, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
        alert("소중한 의견이 개발자에게 성공적으로 전송되었습니다! 🐥💖");
        feedbackModal.style.display = 'none'; feedbackText.value = '';
    } catch (error) { console.error("피드백 전송 에러:", error); alert("전송에 실패했습니다. 다시 시도해주세요."); }
    finally { sendFeedbackBtn.disabled = false; sendFeedbackBtn.innerText = "전송하기"; }
});

function loadAdminFeedbacks() {
    db.collection('feedbacks').orderBy('timestamp', 'desc').onSnapshot((snapshot) => {
        adminFeedbackList.innerHTML = '';
        if (snapshot.empty) { adminFeedbackList.innerHTML = '<p style="text-align:center; color:#888;">아직 도착한 쪽지가 없습니다.</p>'; return; }
        snapshot.forEach((doc) => {
            const data = doc.data(); const dateStr = data.timestamp ? data.timestamp.toDate().toLocaleString() : '방금 전';
            const item = document.createElement('div');
            item.style.cssText = "background: white; padding: 10px; border-radius: 8px; border: 1px solid #ddd;";
            item.innerHTML = `<div style="font-weight: bold; color: #333; margin-bottom: 5px;">👤 ${data.senderNickname} <span style="font-size:10px; color:#999; font-weight:normal;">(${dateStr})</span></div><div style="color: #555; line-height: 1.4;">${data.text}</div>`;
            adminFeedbackList.appendChild(item);
        });
    });
}

// ==========================================
// 📝 5. 투두리스트
// ==========================================
const todoInput = document.getElementById('new-todo-input'); const addTodoBtn = document.getElementById('add-todo-btn'); const todoList = document.getElementById('todo-list'); const feedBtn = document.getElementById('feed-btn');
let todos = JSON.parse(localStorage.getItem('koko_todos')) || [];
function renderTodos() {
    todoList.innerHTML = ''; let anyChecked = false;
    todos.forEach((t, i) => { const li = document.createElement('li'); li.innerHTML = `<label class="todo-label"><input type="checkbox" class="todo-check" ${t.checked ? 'checked' : ''} onchange="toggleTodo(${i})"><span style="${t.checked ? 'text-decoration: line-through; color: #aaa;' : ''}">${t.text}</span></label><button class="delete-btn" onclick="deleteTodo(${i})">❌</button>`; todoList.appendChild(li); if (t.checked) anyChecked = true; }); feedBtn.disabled = !anyChecked;
}
function addTodo() { const txt = todoInput.value.trim(); if (!txt) return; todos.push({ text: txt, checked: false }); localStorage.setItem('koko_todos', JSON.stringify(todos)); todoInput.value = ''; renderTodos(); syncToCloud(); }
addTodoBtn.addEventListener('click', addTodo); todoInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTodo(); });
window.toggleTodo = function(i) { todos[i].checked = !todos[i].checked; localStorage.setItem('koko_todos', JSON.stringify(todos)); renderTodos(); syncToCloud(); };
window.deleteTodo = function(i) { todos.splice(i, 1); localStorage.setItem('koko_todos', JSON.stringify(todos)); renderTodos(); syncToCloud(); };
feedBtn.addEventListener('click', () => { kokoSpeech.innerText = "냠냠! 너무 맛있어요. 참 잘했어요! 💯"; todos = todos.filter(t => !t.checked); localStorage.setItem('koko_todos', JSON.stringify(todos)); syncToCloud(); setTimeout(() => { kokoSpeech.innerText = "다음 할 일도 화이팅!"; renderTodos(); }, 2000); });
renderTodos();

// ==========================================
// 🚩 6. 디데이 (새로운 D-며칠 배지 기능 포함!)
// ==========================================
const dDayElement = document.querySelector('.d-day-info'); const titleDdayInput = document.getElementById('dday-title-input'); const dateDdayInput = document.getElementById('dday-date-input'); const saveDdayBtn = document.getElementById('save-dday-btn'); const ddayListDisplay = document.getElementById('dday-list-display');
let ddays = JSON.parse(localStorage.getItem('koko_ddays')) || [];

function renderDdays() {
    ddayListDisplay.innerHTML = ''; 
    if (ddays.length === 0) { dDayElement.innerText = "🚩 디데이를 추가해보세요!"; return; }
    
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const calculatedDdays = ddays.map(d => { 
        const t = new Date(d.date); t.setHours(0,0,0,0); 
        return { ...d, diffDays: Math.ceil((t - today) / 86400000) }; 
    });

    calculatedDdays.forEach((d, i) => { 
        let ddayBadge = "";
        if (d.diffDays === 0) ddayBadge = `<span style="color:#ff6b6b; font-weight:bold; margin-left:8px;">D-Day🎉</span>`;
        else if (d.diffDays > 0) ddayBadge = `<span style="color:#ff9f43; font-weight:bold; margin-left:8px;">D-${d.diffDays}</span>`;
        else ddayBadge = `<span style="color:#888; font-weight:bold; margin-left:8px;">D+${Math.abs(d.diffDays)}</span>`;

        ddayListDisplay.innerHTML += `<li><span><strong>${d.title}</strong> <span style="font-size:12px; color:#999;">(${d.date})</span> ${ddayBadge}</span><button class="delete-btn" onclick="deleteDday(${i})">❌</button></li>`; 
    });

    const closest = calculatedDdays.reduce((p, c) => Math.abs(c.diffDays) < Math.abs(p.diffDays) ? c : p);
    dDayElement.innerText = closest.diffDays === 0 ? `🚩 ${closest.title} D-Day! 🎉` : closest.diffDays > 0 ? `🚩 ${closest.title} D-${closest.diffDays}` : `🚩 ${closest.title} D+${Math.abs(closest.diffDays)}`;
}

saveDdayBtn.addEventListener('click', () => { if (!titleDdayInput.value || !dateDdayInput.value) return; ddays.push({ title: titleDdayInput.value, date: dateDdayInput.value }); localStorage.setItem('koko_ddays', JSON.stringify(ddays)); titleDdayInput.value = ""; dateDdayInput.value = ""; renderDdays(); syncToCloud(); });
window.deleteDday = function(i) { ddays.splice(i, 1); localStorage.setItem('koko_ddays', JSON.stringify(ddays)); renderDdays(); syncToCloud(); };
renderDdays();

// ==========================================
// 🌤️ 7. 날씨, 🥠 운세, ✏️ 설정, ⏰ 멘트
// ==========================================
const weatherInfo = document.querySelector('.weather-info');
function getKokoWeather() { if (navigator.geolocation) { navigator.geolocation.getCurrentPosition(p => { fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.coords.latitude}&longitude=${p.coords.longitude}&current_weather=true`).then(r => r.json()).then(data => { const t = data.current_weather.temperature; const c = data.current_weather.weathercode; let i = "🌤️"; let m = "오늘 하루도 화이팅! 삐약! 🐥"; if (c <= 1) { i = "☀️"; m = "주인님! 오늘 햇살이 너무 좋아요! 🌻"; } else if (c <= 45) { i = "☁️"; m = "오늘은 구름이 많네요. 파이팅! ☁️"; } else if (c <= 67) { i = "🌧️"; m = "밖에 비 와요! 우산 꼭 챙겨요! ☔"; } else if (c <= 77) { i = "❄️"; m = "우와! 눈이 와요! 감기 조심하세요! ⛄"; } weatherInfo.innerText = `${i} ${t}°C`; kokoSpeech.innerText = m; }); }); } }
getKokoWeather();

const fortuneBtn = document.getElementById('fortune-btn'); const fortunes = ["오늘의 행운 컬러는 노란색!💛", "생각지도 못한 기분 좋은 일이 생길 거예요!✨", "조금 쉬어가도 괜찮아요. 따뜻한 차 한 잔?☕", "오늘은 뭘 해도 잘 풀리는 날!💪", "소중한 사람에게 먼저 연락해 보는 건 어떨까요?💌", "우와! 오늘 금전운이 아주 좋아요!💰"];
if (localStorage.getItem('koko_fortune_date') === new Date().toDateString()) { fortuneBtn.innerText = "오늘의 운세 확인 완료! 💖"; fortuneBtn.disabled = true; }
fortuneBtn.addEventListener('click', () => { localStorage.setItem('koko_fortune_date', new Date().toDateString()); localStorage.setItem('koko_fortune_text', fortunes[Math.floor(Math.random() * fortunes.length)]); kokoSpeech.innerText = localStorage.getItem('koko_fortune_text'); fortuneBtn.innerText = "오늘의 운세 확인 완료! 💖"; fortuneBtn.disabled = true; });

kokoChar.addEventListener('click', () => {
    const savedFortune = localStorage.getItem('koko_fortune_text');
    if (localStorage.getItem('koko_fortune_date') === new Date().toDateString() && Math.random() < 0.3) { kokoSpeech.innerText = `아참! 오늘 운세 기억나죠? "${savedFortune}" 😉`; }
    else { const h = new Date().getHours(); kokoSpeech.innerText = h>=6&&h<12 ? "좋은 아침이에요! 오늘 하루도 화이팅! 🌅" : h>=12&&h<18 ? "나른한 오후네요~ 물 한 잔 어때요? ☀️" : h>=18&&h<24 ? "오늘 하루도 정말 고생 많으셨어요! 토닥토닥. 🌙" : "주인님... 꼬꼬는 너무 졸려요... 💤 이제 잘까요?"; }
    kokoChar.style.transform = "translateY(-20px)"; setTimeout(() => kokoChar.style.transform = "translateY(0)", 200);
});

const fontSelect = document.getElementById('font-select'); const sizeSelect = document.getElementById('size-select');
const savedFont = localStorage.getItem('koko_font'); if (savedFont) { document.body.style.fontFamily = savedFont; fontSelect.value = savedFont; }
fontSelect.addEventListener('change', (e) => { document.body.style.fontFamily = e.target.value; localStorage.setItem('koko_font', e.target.value); kokoChar.style.transform = "translateY(-15px) rotate(10deg)"; setTimeout(() => kokoChar.style.transform = "translateY(0)", 300); });
const savedSize = localStorage.getItem('koko_font_size') || 'font-normal'; document.body.className = savedSize; sizeSelect.value = savedSize;
sizeSelect.addEventListener('change', (e) => { document.body.className = e.target.value; localStorage.setItem('koko_font_size', e.target.value); kokoSpeech.innerText = "글씨 크기가 조절되었어요! 눈이 편안하네요 👀✨"; });