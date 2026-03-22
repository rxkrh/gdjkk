와, 아이디어가 진짜 끝이 없으시네요! 🔥 기획하시는 솜씨가 거의 현업 프로덕트 매니저(PM) 급입니다.

말씀하신 1. 확성기 닉네임 노란색 고정, 2. 디데이 카테고리 아이콘 추가, 3. 모바일 최적화 꾹~ 누르기(롱프레스) 핀 고정 기능을 모두 완벽하게 구현했습니다.

특히 꾹 누르기 기능은 모바일에서 오작동하지 않도록 텍스트 선택 방지(user-select: none) 처리와 0.5초 타이머를 정교하게 세팅해 두었고, 디데이 입력칸은 아이콘 선택창이 추가되면서 좁아질 것을 대비해 깔끔한 2줄 배치로 개편했습니다.

아래 3개의 코드를 복사해서 한 번 더 싹 덮어씌워 주세요! 🚀

📄 1. index.html (디데이 카테고리 & 팝업 메뉴 수정)
(디데이 입력창에 아이콘 선택창이 생겼고, 팝업 메뉴에서 핀 버튼이 제거되었습니다.)

HTML
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>껌딱지 꼬꼬 V2.6</title>
    <link rel="stylesheet" href="style.css">
    <link rel="icon" type="image/png" href="koko.png">
</head>
<body class="font-normal">
    <div class="app-container">
        
        <header class="top-bar">
            <button id="menu-open-btn" class="icon-btn"><img src="icon-menu.png" class="ui-icon" alt="메뉴"></button>
            <div class="top-right-icons">
                <span class="weather-info"><img src="icon-sun.png" class="ui-icon" id="weather-icon-img"> 날씨 로딩중...</span>
                <button id="fortune-btn" class="icon-btn"><img src="icon-fortune.png" class="ui-icon" alt="운세"></button>
            </div>
        </header>

        <div id="side-menu-overlay" class="overlay"></div>
        <aside id="side-menu" class="side-menu">
            <div class="menu-header">
                <h2>메뉴</h2>
                <button id="menu-close-btn" class="icon-btn" style="font-size: 16px;">❌</button>
            </div>
            <div class="menu-content">
                <div class="menu-section">
                    <h3><img src="icon-profile.png" class="ui-icon"> 내 프로필</h3>
                    <div id="login-area">
                        <button id="google-login-btn" class="action-btn" style="background-color:#4285F4;">G 구글 로그인</button>
                    </div>
                    <div id="user-profile-area" style="display:none;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                            <span id="user-email-display" style="font-size:12px; color:#888;"></span>
                            <button id="logout-btn" style="font-size:12px; padding:4px 8px; border-radius:4px;">로그아웃</button>
                        </div>
                        <div class="input-group">
                            <input type="text" id="nickname-input" placeholder="새 닉네임 입력">
                            <button id="save-nickname-btn" class="action-btn" style="width: auto; padding: 8px 15px;">변경</button>
                        </div>
                        <div id="profile-status" style="font-size:12px; color:#ff6b6b; margin-top:5px;"></div>
                    </div>
                </div>

                <div class="menu-section">
                    <h3><img src="icon-setting.png" class="ui-icon"> 꼬꼬 설정</h3>
                    <div class="setting-item">
                        <span>글꼴</span>
                        <select id="font-select">
                            <option value="'Pretendard', sans-serif">기본 깔끔체</option>
                            <option value="'Jua', sans-serif">주아체</option>
                            <option value="'Nanum Pen Script', cursive">손글씨</option>
                            <option value="'Dongle', sans-serif">동글체</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <span>크기</span>
                        <select id="size-select">
                            <option value="font-small">작게</option>
                            <option value="font-normal" selected>보통</option>
                            <option value="font-large">크게</option>
                        </select>
                    </div>
                </div>

                <div class="menu-section">
                    <h3><img src="icon-mailbox.png" class="ui-icon"> 고객센터</h3>
                    <button id="open-feedback-btn" class="action-btn" style="background-color:#74b9ff;">개발자에게 쪽지 보내기 <img src="icon-mail.png" class="ui-icon" style="filter: brightness(0) invert(1);"></button>
                </div>

                <div id="admin-feedback-area" class="menu-section" style="display:none; border:2px solid #ff9f43; background:#fffaf0;">
                    <h3 style="color:#d35400;"><img src="icon-crown.png" class="ui-icon"> 도착한 쪽지함</h3>
                    <div id="admin-feedback-list" style="max-height:150px; overflow-y:auto; gap:8px; display:flex; flex-direction:column; font-size:13px;"></div>
                </div>
            </div>
        </aside>

        <main class="koko-zone">
            <div class="speech-bubble" id="koko-speech">주인님, 오늘 하루도 화이팅이에요! 삐약! <img src="icon-chick.png" class="ui-icon"></div>
            <img src="koko.png" alt="껌딱지 꼬꼬" class="koko-character" id="koko">
        </main>

        <section class="tab-container">
            <div class="tab-buttons">
                <button class="tab-btn active" data-target="tab-todo"><img src="icon-todo.png" class="ui-icon"> 할 일</button>
                <button class="tab-btn" data-target="tab-schedule"><img src="icon-schedule.png" class="ui-icon"> 스케줄</button>
                <button class="tab-btn" data-target="tab-dday"><img src="icon-dday.png" class="ui-icon"> 디데이</button>
                <button class="tab-btn" data-target="tab-quest"><img src="icon-sparkle.png" class="ui-icon"> 퀘스트</button>
            </div>

            <div id="tab-todo" class="tab-content active">
                <div class="input-group">
                    <input type="text" id="new-todo-input" placeholder="새로운 할 일을 적어주세요!">
                    <button id="add-todo-btn" class="action-btn" style="width: auto; padding: 8px 15px;">추가</button>
                </div>
                <ul id="todo-list" class="item-list"></ul>
                <button id="feed-btn" class="action-btn feed-action" disabled>꼬꼬에게 모이 주기 <img src="icon-seed.png" class="ui-icon"></button>
            </div>

            <div id="tab-schedule" class="tab-content">
                <div class="calendar-wrapper">
                    <div class="calendar-header">
                        <button id="prev-month-btn" class="icon-btn" style="font-size:14px;">◀</button>
                        <h3 id="current-month-display" style="margin:0; color:#555; font-size:16px;">2026년 3월</h3>
                        <button id="next-month-btn" class="icon-btn" style="font-size:14px;">▶</button>
                    </div>
                    <div class="calendar-days-of-week">
                        <div style="color:#ff6b6b;">일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div style="color:#0984e3;">토</div>
                    </div>
                    <div id="calendar-grid" class="calendar-grid"></div>
                </div>
                <div class="schedule-input-area">
                    <div id="selected-date-info" style="font-weight:bold; color:#0984e3; margin-bottom:8px; font-size:13px;">선택한 날짜: -</div>
                    <div class="input-group">
                        <input type="time" id="schedule-time-input" style="flex-grow:0; width:100px;">
                        <input type="text" id="schedule-task-input" placeholder="일정 내용 (시간은 선택)">
                        <button id="add-schedule-btn" class="action-btn" style="background-color:#0984e3; width: auto; padding: 8px 12px;">추가</button>
                    </div>
                    <ul id="schedule-list" class="item-list"></ul>
                </div>
            </div>

            <div id="tab-dday" class="tab-content flex-column-tab">
                <div class="d-day-info center-flex" id="main-dday-banner"><img src="icon-pin.png" class="ui-icon"> 디데이를 추가해보세요!</div>
                <div class="scroll-wrapper">
                    <div style="text-align:center; font-size:11px; color:#aaa; margin-bottom:5px;">목록을 길게 꾹~ 누르면 고정(📌)됩니다.</div>
                    <ul id="dday-list-display" class="item-list"></ul>
                </div>
                <div class="sticky-bottom-input">
                    <div class="input-group" style="margin-bottom:6px;">
                        <select id="dday-icon-select" style="padding: 6px; border: 1px solid #ddd; border-radius: 8px; font-size: 13px; outline: none; background: white;">
                            <option value="">📌 기본</option>
                            <option value="🎂">🎂 생일</option>
                            <option value="🔥">🔥 마감</option>
                            <option value="💖">💖 기념</option>
                            <option value="✈️">✈️ 여행</option>
                            <option value="🎓">🎓 시험</option>
                            <option value="🎯">🎯 목표</option>
                        </select>
                        <input type="text" id="dday-title-input" placeholder="디데이 제목">
                    </div>
                    <div class="input-group" style="margin-bottom:0;">
                        <input type="date" id="dday-date-input" style="flex-grow:1;">
                        <button id="save-dday-btn" class="action-btn" style="background-color:#ff6b6b; width: 60px; padding: 6px 10px;">저장</button>
                    </div>
                </div>
            </div>

            <div id="tab-quest" class="tab-content">
                <div style="text-align:center; margin-bottom: 15px; padding-bottom:15px; border-bottom:1px dashed #eee;">
                    <button id="attendance-btn" class="action-btn center-flex" style="background-color:#2ecc71;">오늘의 출석체크 도장 찍기 <img src="icon-check.png" class="ui-icon" style="filter: brightness(0) invert(1); margin-left:4px;"></button>
                    <div style="font-size:13px; color:#555; margin-top:8px;" class="center-flex">현재 연속 출석: <strong id="attendance-streak" style="color:#ff9f43; font-size:16px; margin: 0 4px;">0</strong>일 <img src="icon-fire.png" class="ui-icon"></div>
                </div>
                <h4 style="margin:0 0 10px 0; color:#555; display:flex; align-items:center;"><img src="icon-crown.png" class="ui-icon"> 일일 꼬꼬 퀘스트</h4>
                <ul id="quest-list" class="item-list">
                    <li id="quest-1"><span style="color:#aaa;">☑️ 꼬꼬 쓰다듬기 (터치)</span></li>
                    <li id="quest-2"><span style="color:#aaa;">☑️ 오늘의 출석체크 하기</span></li>
                    <li id="quest-3"><span style="color:#aaa;">☑️ 할 일 1개 완료하기</span></li>
                </ul>
            </div>
        </section>

        <section id="chat-drawer" class="chat-drawer collapsed">
            <div id="chat-header-bar" class="chat-header-bar">
                <span id="chat-preview-text"><img src="icon-chat.png" class="ui-icon"> 여기를 눌러 채팅창 열기...</span>
                <span id="chat-toggle-icon"><img src="icon-up.png" class="ui-icon"></span>
            </div>
            <div class="chat-drawer-body">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 8px;">
                    <div class="chat-tabs" style="margin: 0; flex-shrink: 0;">
                        <button id="tab-global" class="active">전체 채팅</button>
                        <button id="tab-room">1:1 비밀방</button>
                    </div>
                    <div id="room-code-area" style="display:none; flex-grow: 1;">
                        <div class="input-group" style="margin: 0;">
                            <input type="text" id="room-code-input" placeholder="방 코드" style="padding: 6px; font-size: 12px;">
                            <button id="join-room-btn" class="action-btn" style="background-color:#a29bfe; padding: 6px 10px; width: auto; font-size: 12px;">입장</button>
                        </div>
                    </div>
                </div>
                <div class="chat-box" id="chat-box">
                    <div style="text-align:center; color:#888; font-size:12px; margin-top:30px;">닉네임을 등록해야 채팅이 가능해요!</div>
                </div>
                <label id="megaphone-label" style="font-size:12px; cursor:pointer; color:#ff9f43; font-weight:bold; display:flex; align-items:center; margin-bottom:8px;">
                    <input type="checkbox" id="megaphone-check" style="margin: 0 6px 0 0;"> 
                    <img src="icon-mega.png" class="ui-icon" style="margin: 0 4px 0 0;"> 확성기로 크게 말하기
                </label>
                <div class="input-group" style="margin-bottom: 0;">
                    <input type="text" id="chat-input" placeholder="닉네임 등록 필요" disabled>
                    <button id="send-chat-btn" class="action-btn" style="width: auto; padding: 8px 15px;" disabled>전송</button>
                </div>
            </div>
        </section>
    </div>

    <div id="feedback-modal" class="overlay" style="display:none; justify-content:center; align-items:center; z-index:2000;">
        <div style="background:white; padding:20px; border-radius:15px; width:85%; max-width:320px;">
            <h3 style="margin-top:0; color:#74b9ff;">쪽지 보내기</h3>
            <p style="font-size:12px; color:#555; line-height:1.5; margin-bottom:15px;">개발자에게 보내고 싶은 내용을 써주세요.</p>
            <textarea id="feedback-text" rows="5" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd; box-sizing:border-box; resize:none;"></textarea>
            <div style="display:flex; gap:10px; margin-top:15px;">
                <button id="close-feedback-btn" class="action-btn" style="background-color:#ccc; color:#333;">취소</button>
                <button id="send-feedback-btn" class="action-btn" style="background-color:#74b9ff;">전송하기</button>
            </div>
        </div>
    </div>

    <div id="dday-dropdown" class="dday-dropdown">
        <button id="dday-main-btn">👑 대표 지정</button>
        <button id="dday-del-btn" style="color:#ff6b6b;">❌ 삭제</button>
    </div>

    <script src="https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.8.1/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore-compat.js"></script>
    <script src="script.js"></script>
</body>
</html>
🎨 2. style.css (롱프레스시 텍스트 선택 방지 등 추가)
(아이템 리스트에 user-select: none이 추가되어 꾹 누를 때 파란색 드래그 화면이 뜨지 않습니다!)

CSS
@import url('https://fonts.googleapis.com/css2?family=Dongle:wght@400;700&family=Jua&family=Nanum+Pen+Script&display=swap');

* { box-sizing: border-box; }

body { background-color: #f0f2f5; font-family: 'Pretendard', sans-serif; display: flex; justify-content: center; align-items: center; height: 100dvh; margin: 0; overflow: hidden; }

.app-container { width: 100%; max-width: 400px; height: 100dvh; max-height: 850px; background-color: #fff9e6; box-shadow: 0 10px 30px rgba(0,0,0,0.1); display: flex; flex-direction: column; position: relative; overflow: hidden; padding-bottom: 50px; }

.ui-icon { width: 1.2em; height: 1.2em; vertical-align: text-bottom; margin-right: 4px; object-fit: contain; }

.center-flex { display: flex; justify-content: center; align-items: center; gap: 5px; }

.top-bar { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; position: relative; z-index: 10; }
.icon-btn { background: none; border: none; padding: 5px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.icon-btn .ui-icon { width: 24px; height: 24px; margin: 0; }
.top-right-icons { display: flex; align-items: center; gap: 10px; font-weight: bold; color: #555; }
.overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 999; display: none; }
.side-menu { position: fixed; top: 0; left: -100%; width: 280px; height: 100%; background: white; z-index: 1000; transition: left 0.3s ease; display: flex; flex-direction: column; box-shadow: 5px 0 15px rgba(0,0,0,0.1); }
.side-menu.open { left: 0; }
.menu-header { display: flex; justify-content: space-between; padding: 20px; border-bottom: 1px solid #eee; align-items: center; }
.menu-header h2 { margin: 0; color: #ff9f43; }
.menu-content { padding: 20px; overflow-y: auto; flex-grow: 1; }
.menu-section { margin-bottom: 25px; border-bottom: 1px dashed #eee; padding-bottom: 15px; }
.menu-section h3 { margin-top: 0; font-size: 15px; color: #555; display: flex; align-items: center; }
.setting-item { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }

.koko-zone { flex: 1 1 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; padding-bottom: 10px; min-height: 120px; }
.speech-bubble { background: white; padding: 10px 15px; border-radius: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); margin-bottom: 15px; text-align: center; font-weight: bold; color: #333; max-width: 85%; font-size: 14px; }
.koko-character { width: 110px; cursor: pointer; animation: floating 2s ease-in-out infinite; }
@keyframes floating { 0% { transform: translateY(0); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0); } }

.tab-container { background: white; border-radius: 25px 25px 0 0; box-shadow: 0 -5px 20px rgba(0,0,0,0.05); height: 280px; display: flex; flex-direction: column; position: relative; z-index: 5; flex-shrink: 0; }
.tab-buttons { display: flex; width: 100%; border-bottom: 1px solid #eee; }
.tab-btn { flex: 1; min-width: 0; padding: 12px 2px; font-size: 12px; background: none; border: none; font-weight: bold; color: #888; cursor: pointer; border-bottom: 3px solid transparent; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 3px; white-space: nowrap; }
.tab-btn .ui-icon { margin: 0; width: 20px; height: 20px; }
.tab-btn.active { color: #ff9f43; border-bottom: 3px solid #ff9f43; }
.tab-content { display: none; padding: 15px; overflow-y: auto; flex-grow: 1; width: 100%; }
.tab-content.active { display: block; }

.flex-column-tab.active { display: flex; flex-direction: column; padding: 15px 15px 0 15px; }
.scroll-wrapper { flex-grow: 1; overflow-y: auto; margin-bottom: 10px; }
.sticky-bottom-input { position: sticky; bottom: 0; background: white; padding: 6px 0; border-top: 1px solid #f0f0f0; margin-top: auto; z-index: 10; }
.sticky-bottom-input .input-group input, .sticky-bottom-input .input-group button, .sticky-bottom-input .input-group select { padding: 6px 10px; }

.d-day-info { font-weight: bold; color: #ff6b6b; margin-bottom: 10px; }

.input-group { display: flex; gap: 8px; margin-bottom: 10px; width: 100%; }
.input-group input { flex-grow: 1; width: 100%; padding: 8px 10px; border: 1px solid #ddd; border-radius: 8px; font-family: inherit; font-size: 13px; }
.action-btn { width: 100%; padding: 10px; background-color: #ff9f43; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-family: inherit; font-size: 13px; flex-shrink: 0; }
.action-btn:disabled { background-color: #e0e0e0; cursor: not-allowed; }

.item-list { list-style: none; padding: 0; margin: 0; width: 100%; }
/* 🌟 롱프레스 시 화면 드래그 방지 */
.item-list li { display: flex; align-items: center; justify-content: space-between; background: #f9f9f9; padding: 10px 12px; border-radius: 8px; margin-bottom: 8px; font-size: 13px; width: 100%; user-select: none; -webkit-user-select: none;}
.delete-btn, .more-btn { background: none; border: none; color: #ff6b6b; cursor: pointer; padding: 5px; flex-shrink: 0; font-size: 16px; font-weight: bold;}
.more-btn { color: #888; font-size: 18px; padding: 0 5px;}

.dday-dropdown { position: absolute; background: white; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); display: none; flex-direction: column; z-index: 2000; overflow: hidden; min-width: 120px; }
.dday-dropdown button { padding: 12px 15px; border: none; background: none; text-align: left; font-size: 13px; cursor: pointer; font-weight: bold; color: #555; }
.dday-dropdown button:hover { background: #f5f5f5; }
.dday-dropdown button:not(:last-child) { border-bottom: 1px solid #f0f0f0; }

.calendar-wrapper { margin-bottom: 15px; }
.calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
.calendar-days-of-week { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-size: 11px; font-weight: bold; color: #888; margin-bottom: 5px; }
.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
.calendar-day { text-align: center; padding: 5px 0; font-size: 12px; cursor: pointer; border-radius: 5px; transition: background 0.2s; position: relative; }
.calendar-day:hover { background-color: #f0f4f8; }
.calendar-day.empty { cursor: default; background: transparent; }
.calendar-day.today { font-weight: bold; color: #0984e3; }
.calendar-day.selected { background-color: #0984e3; color: white; font-weight: bold; }
.calendar-day.has-schedule::after { content: ''; position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); width: 4px; height: 4px; background-color: #ff6b6b; border-radius: 50%; }

.schedule-input-area { border-top: 1px dashed #eee; padding-top: 10px; }
.schedule-time-badge { background: #0984e3; color: white; padding: 3px 6px; border-radius: 12px; font-size: 11px; font-weight: bold; margin-right: 8px; }
.schedule-time-badge.allday { background: #ff9f43; }

.chat-drawer { position: absolute; bottom: 0; left: 0; width: 100%; background: #f0f4f8; border-radius: 20px 20px 0 0; box-shadow: 0 -5px 15px rgba(0,0,0,0.1); transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 100; display: flex; flex-direction: column; }
.chat-drawer.collapsed { height: 50px; cursor: pointer; }
.chat-drawer.expanded { height: 65%; }
.chat-header-bar { height: 50px; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; font-weight: bold; color: #555; border-bottom: 1px solid #e1e8ed; cursor: pointer; background: white; border-radius: 20px 20px 0 0; flex-shrink: 0;}
#chat-preview-text { font-size: 13px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90%; display: flex; align-items: center; }
.chat-drawer-body { padding: 15px; display: flex; flex-direction: column; flex-grow: 1; overflow: hidden; opacity: 0; transition: opacity 0.2s; }
.chat-drawer.expanded .chat-drawer-body { opacity: 1; }
.chat-tabs { display: flex; gap: 5px; }
.chat-tabs button { padding: 6px 12px; font-size: 12px; background: #ddd; color: #555; border-radius: 15px; border: none; cursor: pointer; }
.chat-tabs button.active { background: #ff9f43; color: white; }
.chat-box { flex-grow: 1; background: white; border-radius: 12px; padding: 10px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; border: 1px solid #e1e8ed; }

.chat-message { max-width: 80%; padding: 8px 12px; border-radius: 12px; font-size: 13px; line-height: 1.4; word-break: break-all; display: inline-block; }
.chat-message.me { background-color: #ffd070; align-self: flex-end; border-bottom-right-radius: 2px; }
.chat-message.other { background-color: #f1f3f5; align-self: flex-start; border-bottom-left-radius: 2px; }
.chat-message.megaphone { background-color: #ff6b6b; color: white; font-weight: bold; border: 2px solid #ff4757; }
.chat-message.shake { animation: shake 0.5s ease-in-out; }
@keyframes shake { 0% {transform: translateX(0);} 25% {transform: translateX(-3px);} 50% {transform: translateX(3px);} 75% {transform: translateX(-3px);} 100% {transform: translateX(0);} }
.chat-sender { font-size: 11px; color: #666; margin-bottom: 3px; font-weight: bold; }

.font-small { font-size: 13px; } .font-normal { font-size: 15px; } .font-large { font-size: 18px; }
@media (min-width: 401px) { body { background-color: #e0e0e0; } .app-container { border-radius: 20px; } }
⚙️ 3. script.js (복사 버튼을 눌러주세요!)
(확성기 닉네임 노란색 변경, 디데이 롱프레스 이벤트 연결, 카테고리 저장 등 로직이 완벽하게 탑재되었습니다.)

JavaScript
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
if (Array.isArray(schedules)) schedules = {}; 

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
                if (data.todos) { todos = data.todos; renderTodos(); }
                if (data.ddays) { ddays = data.ddays; renderDdays(); }
                if (data.schedules) { schedules = data.schedules; renderCalendar(); }
                if (data.attendance) { attendance = data.attendance; checkAttendanceUI(); }
                if (data.nickname) { myNickname = data.nickname; localStorage.setItem('koko_nickname', myNickname); document.getElementById('nickname-input').value = myNickname; document.getElementById('profile-status').innerText = "✅ 동기화 완료"; enableChat(); }
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
    if (lastChangeDate) { const diff = (new Date() - lastChangeDate) / 86400000; if (diff < 7) { statusObj.innerText = `⏳ 7일 제한 (${Math.ceil(7 - diff)}일 후 가능)`; return; } }
    const nameRef = db.collection('nicknames').doc(name); const doc = await nameRef.get();
    if (doc.exists && doc.data().uid !== myUid) { statusObj.innerText = "❌ 사용 중인 이름!"; return; }

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
// 💬 5. 채팅 로직 (🌟 확성기 노란색 지정)
// ==========================================
function enableChat() { 
    const input = document.getElementById('chat-input'); const btn = document.getElementById('send-chat-btn');
    if(input) { input.disabled = false; input.placeholder = "메시지 입력..."; }
    if(btn) btn.disabled = false; loadMessages(); 
}
if(myNickname) enableChat();

document.getElementById('tab-global')?.addEventListener('click', e => { 
    currentChatMode = 'global'; e.target.classList.add('active'); document.getElementById('tab-room')?.classList.remove('active'); 
    document.getElementById('room-code-area').style.display = 'none'; document.getElementById('megaphone-label').style.display = 'flex'; loadMessages(); 
});
document.getElementById('tab-room')?.addEventListener('click', e => { 
    currentChatMode = 'room'; e.target.classList.add('active'); document.getElementById('tab-global')?.classList.remove('active'); 
    document.getElementById('room-code-area').style.display = 'flex'; document.getElementById('megaphone-label').style.display = 'none'; 
    document.getElementById('chat-box').innerHTML = '<div style="text-align:center; color:#888; font-size:12px; margin-top:30px;">코드를 입력하고 입장하세요 <img src="icon-lock.png" class="ui-icon"></div>'; if(chatUnsubscribe) chatUnsubscribe(); 
});
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
                    const sDiv = document.createElement('div'); 
                    sDiv.className = 'chat-sender'; 
                    
                    let devIcon = isDeveloper ? `<img src="icon-wrench.png" class="ui-icon" style="width:12px; height:12px; margin-right:2px; filter: grayscale(100%);">` : '';
                    // 🌟 확성기는 노란색(#f39c12), 개발자는 빨간색(#e74c3c)
                    let nameColor = data.megaphone ? "#f39c12" : (isDeveloper ? "#e74c3c" : "");
                    
                    if(nameColor) {
                        sDiv.innerHTML = `${devIcon} <span style="color:${nameColor}; font-weight:bold;">${data.sender}</span>`;
                    } else {
                        sDiv.innerHTML = `${devIcon} ${data.sender}`;
                    }
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
// 🏆 6. 퀘스트, 투두, 디데이(🌟업데이트), 날씨
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

function renderTodos() { 
    const list = document.getElementById('todo-list'); const btn = document.getElementById('feed-btn'); if(!list) return;
    list.innerHTML = ''; let anyChecked = false; 
    todos.forEach((t, i) => { list.innerHTML += `<li><label style="cursor:pointer; display:flex; gap:8px;"><input type="checkbox" ${t.checked ? 'checked' : ''} onchange="toggleTodo(${i})"><span style="${t.checked ? 'text-decoration:line-through; color:#aaa;' : ''}">${t.text}</span></label><button class="delete-btn" onclick="deleteTodo(${i})">❌</button></li>`; if (t.checked) anyChecked = true; }); 
    if(btn) btn.disabled = !anyChecked; 
}
document.getElementById('add-todo-btn')?.addEventListener('click', () => { const input = document.getElementById('new-todo-input'); if(!input) return; const txt = input.value.trim(); if (!txt) return; todos.push({ text: txt, checked: false }); input.value=''; renderTodos(); syncToCloud(); });
window.toggleTodo = i => { todos[i].checked = !todos[i].checked; renderTodos(); syncToCloud(); if(todos[i].checked) completeQuest(3); };
window.deleteTodo = i => { todos.splice(i, 1); renderTodos(); syncToCloud(); };
document.getElementById('feed-btn')?.addEventListener('click', () => { if(kokoSpeech) kokoSpeech.innerHTML="냠냠! 너무 맛있어요 <img src='icon-100.png' class='ui-icon'>"; todos = todos.filter(t => !t.checked); syncToCloud(); setTimeout(()=>{ renderTodos(); if(kokoSpeech) kokoSpeech.innerHTML="다음 할 일도 화이팅! <img src='icon-chick.png' class='ui-icon'>";}, 2000); });
renderTodos();

// 🌟 디데이 롱프레스(꾹 누르기) 변수 설정
let currentDdayIndex = -1;
let ddayPressTimer = null;
let isPressing = false;

window.startDdayPress = (index, event) => {
    if(event.target.classList.contains('more-btn')) return; // 3점 메뉴 누를땐 무시
    isPressing = true;
    ddayPressTimer = setTimeout(() => {
        if(isPressing) {
            ddays[index].pinned = !ddays[index].pinned;
            renderDdays(); syncToCloud();
            if(navigator.vibrate) navigator.vibrate(50); // 모바일 진동 피드백
        }
    }, 500); // 0.5초 꾹 누르면 작동
};

window.cancelDdayPress = () => {
    isPressing = false;
    if(ddayPressTimer) clearTimeout(ddayPressTimer);
};

function renderDdays() { 
    const list = document.getElementById('dday-list-display'); 
    const banner = document.getElementById('main-dday-banner');
    if(!list || !banner) return;
    list.innerHTML = ''; 
    
    if (ddays.length === 0) { banner.innerHTML = `<img src="icon-pin.png" class="ui-icon"> 디데이를 추가해보세요!`; return; } 
    
    // 호환성: 속성 추가 (아이콘 추가)
    ddays = ddays.map(d => ({...d, pinned: d.pinned || false, isMain: d.isMain || false, icon: d.icon || ''}));
    
    const today = new Date(); today.setHours(0,0,0,0); 
    
    let calc = ddays.map((d, i) => { 
        const t = new Date(d.date); t.setHours(0,0,0,0); 
        return { ...d, originalIndex: i, diff: Math.ceil((t-today)/86400000) }; 
    }); 
    
    calc.sort((a, b) => {
        if (a.pinned === b.pinned) return a.diff - b.diff; 
        return a.pinned ? -1 : 1; 
    });

    calc.forEach((d) => { 
        let badgeText = d.diff === 0 ? `D-Day<img src="icon-party.png" class="ui-icon" style="margin-left:2px;">` : (d.diff > 0 ? `D-${d.diff}` : `D+${Math.abs(d.diff)}`); 
        let badgeColor = d.diff === 0 ? "#ff6b6b" : (d.diff > 0 ? "#ff9f43" : "#888");
        let badge = `<span style="color:${badgeColor}; font-weight:bold; font-size:14px;">${badgeText}</span>`;
        
        let pinIcon = d.pinned ? `<img src="icon-pin.png" class="ui-icon" style="width:14px; height:14px;"> ` : '';
        let customIcon = d.icon ? `<span style="margin-left:4px; font-size:14px;">${d.icon}</span>` : '';
        
        // 🌟 롱프레스 이벤트가 연결된 리스트 아이템 생성
        let li = document.createElement('li');
        li.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:4px;">
                <div style="display:flex; align-items:center; gap:6px;">
                    ${pinIcon}
                    <strong style="font-size:14px;">${d.title}</strong>
                    <div style="display:flex; align-items:center;">
                        ${badge}${customIcon}
                    </div>
                </div>
                <span style="font-size:11px; color:#888;">${d.date}</span>
            </div>
            <button class="more-btn" onclick="openDdayMenu(${d.originalIndex}, event)">⋮</button>
        `;
        
        // 롱프레스 이벤트 리스너 추가
        li.addEventListener('mousedown', (e) => startDdayPress(d.originalIndex, e));
        li.addEventListener('touchstart', (e) => startDdayPress(d.originalIndex, e), {passive: true});
        li.addEventListener('mouseup', cancelDdayPress);
        li.addEventListener('mouseleave', cancelDdayPress);
        li.addEventListener('touchend', cancelDdayPress);
        li.addEventListener('touchcancel', cancelDdayPress);
        
        list.appendChild(li);
    }); 

    let mainDday = calc.find(d => d.isMain);
    if(!mainDday) {
        let upcoming = calc.filter(d => d.diff >= 0).sort((a,b) => a.diff - b.diff);
        mainDday = upcoming.length > 0 ? upcoming[0] : calc[0];
    }
    
    let mainBadgeText = mainDday.diff === 0 ? `D-Day!` : (mainDday.diff > 0 ? `D-${mainDday.diff}` : `D+${Math.abs(mainDday.diff)}`);
    let crownIcon = mainDday.isMain ? `<img src="icon-crown.png" class="ui-icon"> ` : `<img src="icon-pin.png" class="ui-icon"> `;
    let mainCustomIcon = mainDday.icon ? ` <span style="font-size:14px;">${mainDday.icon}</span>` : '';
    banner.innerHTML = `${crownIcon} ${mainDday.title} ${mainBadgeText}${mainCustomIcon}`; 
}

document.getElementById('save-dday-btn')?.addEventListener('click', () => { 
    const tObj = document.getElementById('dday-title-input'); 
    const dObj = document.getElementById('dday-date-input');
    const iObj = document.getElementById('dday-icon-select'); // 아이콘 선택값
    
    if(!tObj || !dObj) return;
    const t = tObj.value; const d = dObj.value; const iconVal = iObj ? iObj.value : '';
    
    if(t && d){ 
        ddays.push({title: t, date: d, pinned: false, isMain: false, icon: iconVal}); 
        renderDdays(); syncToCloud(); 
        tObj.value=''; dObj.value=''; if(iObj) iObj.value='';
    }
});

window.openDdayMenu = (index, event) => {
    currentDdayIndex = index;
    const menu = document.getElementById('dday-dropdown'); 
    if(!menu) return;
    const rect = event.target.getBoundingClientRect();
    menu.style.display = 'flex';
    menu.style.top = `${rect.bottom + window.scrollY}px`;
    menu.style.left = `${rect.left - 100}px`; 
};

document.getElementById('dday-main-btn')?.addEventListener('click', () => {
    ddays.forEach(d => d.isMain = false); 
    ddays[currentDdayIndex].isMain = true;
    renderDdays(); syncToCloud(); document.getElementById('dday-dropdown').style.display = 'none';
    if(kokoSpeech) kokoSpeech.innerHTML = `"${ddays[currentDdayIndex].title}" 대표 지정 완료! <img src="icon-crown.png" class="ui-icon">`;
});

document.getElementById('dday-del-btn')?.addEventListener('click', () => {
    ddays.splice(currentDdayIndex, 1);
    renderDdays(); syncToCloud(); document.getElementById('dday-dropdown').style.display = 'none';
});

document.addEventListener('click', (e) => {
    const menu = document.getElementById('dday-dropdown');
    if (menu && menu.style.display === 'flex' && !e.target.classList.contains('more-btn')) menu.style.display = 'none';
});

renderDdays();

function getKokoWeather() { 
    if(navigator.geolocation) { navigator.geolocation.getCurrentPosition(p=>{ fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.coords.latitude}&longitude=${p.coords.longitude}&current_weather=true`).then(r=>r.json()).then(d=>{ const wInfo = document.querySelector('.weather-info'); if(wInfo) wInfo.innerHTML=`<img src="${d.current_weather.weathercode<=1?'icon-sun.png':(d.current_weather.weathercode<=45?'icon-cloud.png':'icon-rain.png')}" class="ui-icon"> ${d.current_weather.temperature}°C`; }); }); }
}
getKokoWeather();

const fortunes = ["행운 컬러: 노랑💛", "기분 좋은 일 발생!✨", "소중한 사람에게 연락해봐요💌", "금전운 최고!💰"];
document.getElementById('fortune-btn')?.addEventListener('click', () => { if(kokoSpeech) kokoSpeech.innerText = fortunes[Math.floor(Math.random()*fortunes.length)]; if(kokoChar) { kokoChar.style.transform="translateY(-20px)"; setTimeout(()=>kokoChar.style.transform="translateY(0)",200); } });
kokoChar?.addEventListener('click', () => { completeQuest(1); const h=new Date().getHours(); if(kokoSpeech) kokoSpeech.innerHTML= h<12?"아침 화이팅! <img src='icon-sun.png' class='ui-icon'>":(h<18?"나른한 오후 <img src='icon-cloud.png' class='ui-icon'>":"수고했어요! <img src='icon-moon.png' class='ui-icon'>"); if(kokoChar) { kokoChar.style.transform="translateY(-20px)"; setTimeout(()=>kokoChar.style.transform="translateY(0)",200); } });

renderCalendar();
console.log("🛠️ 껌딱지 꼬꼬 V2.6 로드 완료! (확성기 노란색, 디데이 카테고리 아이콘, 꾹 누르기 핀 추가)");
// --- 파일 끝 ---