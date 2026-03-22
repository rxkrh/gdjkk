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
// 사이드 메뉴 토글
const menuBtn = document.getElementById('menu-open-btn');
const menuCloseBtn = document.getElementById('menu-close-btn');
const sideMenu = document.getElementById('side-menu');
const overlay = document.getElementById('side-menu-overlay');

menuBtn.addEventListener('click', () => { sideMenu.classList.add('open'); overlay.style.display = 'block'; });
const closeMenu = () => { sideMenu.classList.remove('open'); overlay.style.display = 'none'; };
menuCloseBtn.addEventListener('click', closeMenu);
overlay.addEventListener('click', closeMenu);

// 하단 탭 메뉴 토글
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

// 미니 팝업 채팅창 열고 닫기
const chatDrawer = document.getElementById('chat-drawer');
const chatHeaderBar = document.getElementById('chat-header-bar');
const chatToggleIcon = document.getElementById('chat-toggle-icon');

chatHeaderBar.addEventListener('click', () => {
    chatDrawer.classList.toggle('collapsed');
    chatDrawer.classList.toggle('expanded');
    chatToggleIcon.innerText = chatDrawer.classList.contains('expanded') ? '🔽' : '🔼';
    if(chatDrawer.classList.contains('expanded')) {
        const chatBox = document.getElementById('chat-box');
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});


// ==========================================
// 🔐 2. 로그인, 프로필, 피드백, 설정 (기존 로직 유지)
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
            document.getElementById('admin-feedback-area').style.display =