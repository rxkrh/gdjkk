// --- 0. Firebase 설정 (자동화 완료 ✨) ---
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

// 개발자 관리자 UID (자동화 완료 ✨)
const ADMIN_UID = "2WlMcOeAJoRHRg28Mqw2oXK0Jia2"; 

const kokoSpeech = document.getElementById('koko-speech');
const kokoChar = document.getElementById('koko');
let myUid = localStorage.getItem('koko_uid') || ('user_' + Date.now());
localStorage.setItem('koko_uid', myUid);

function syncToCloud() {
    if (auth.currentUser) db.collection('users').doc(auth.currentUser.uid).set({ 
        todos: todos, 
        ddays: ddays,
        schedules: schedules,
        attendance: attendance
    }, { merge: true });
}

// ==========================================
// 📱 1. 새로운 UI 동작 로직
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
    chatToggleIcon.innerHTML = chatDrawer.classList.contains('expanded') ? '<img src="icon-down.png" class="ui-icon">' : '<img src="icon-up.png" class="ui-icon">';
    if(chatDrawer.classList.contains('expanded')) {
        const chatBox = document.getElementById('chat-box');
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});

// ==========================================
// 🔐 2. 로그인, 프로필, 피드백
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
                if (data.schedules) { schedules = data.schedules; renderSchedules(); }
                if (data.attendance) { attendance = data.attendance; checkAttendanceUI(); }
                
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