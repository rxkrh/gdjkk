/* 🌟 5.5 지뢰찾기 전면 개편 로직 */

let timerInterval;
let gameTime = 0;
let remainingMines = 0;
let gridData = [];
let boardSize = 10;
let mineCount = 10;
let isFirstClick = true;

// 게임 열기
document.getElementById('play-minesweeper-list-btn').addEventListener('click', () => {
    document.getElementById('fullscreen-game-overlay').style.display = 'flex';
    document.getElementById('difficulty-popup').style.display = 'block';
    document.getElementById('game-stage').innerHTML = ''; // 초기화
});

// 게임 닫기
document.getElementById('game-close-x').addEventListener('click', () => {
    document.getElementById('fullscreen-game-overlay').style.display = 'none';
    clearInterval(timerInterval);
});

// 커스텀 레인지 표시
document.getElementById('input-size').oninput = function() { document.getElementById('val-size').innerText = this.value; };
document.getElementById('input-mines').oninput = function() { document.getElementById('val-mines').innerText = this.value; };

function initMinesweeper(diff) {
    if(diff === 'easy') { boardSize = 6; mineCount = 4; }
    else if(diff === 'normal') { boardSize = 10; mineCount = 15; }
    else if(diff === 'hard') { boardSize = 12; mineCount = 30; }
    else if(diff === 'custom') {
        boardSize = parseInt(document.getElementById('input-size').value);
        mineCount = parseInt(document.getElementById('input-mines').value);
    }
    
    document.getElementById('difficulty-popup').style.display = 'none';
    remainingMines = mineCount;
    gameTime = 0;
    isFirstClick = true;
    updateHeader();
    createBoard();
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        gameTime++;
        document.getElementById('game-timer').innerText = String(gameTime).padStart(3, '0');
    }, 1000);
}

function updateHeader() {
    document.getElementById('game-mine-count').innerText = remainingMines;
    document.getElementById('game-timer').innerText = "000";
}

function createBoard() {
    const stage = document.getElementById('game-stage');
    stage.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
    stage.innerHTML = '';
    gridData = Array(boardSize).fill().map(() => Array(boardSize).fill(0));

    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            const cell = document.createElement('div');
            cell.className = 'egg-cell';
            cell.dataset.r = r;
            cell.dataset.c = c;
            
            // 터치 이벤트
            cell.onclick = () => revealCell(r, c);
            
            // 꾹 누르기 (우클릭 대용)
            let timer;
            cell.onmousedown = cell.ontouchstart = (e) => {
                timer = setTimeout(() => {
                    toggleFlag(cell);
                    if(navigator.vibrate) navigator.vibrate(30); // 햅틱 반응
                }, 500);
            };
            cell.onmouseup = cell.onmouseleave = cell.ontouchend = () => clearTimeout(timer);
            
            stage.appendChild(cell);
        }
    }
}

function revealCell(r, c) {
    const cell = document.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if(cell.classList.contains('revealed') || cell.classList.contains('flagged')) return;

    if(isFirstClick) {
        placeMines(r, c);
        isFirstClick = false;
    }

    if(gridData[r][c] === 'M') {
        gameOver(false);
    } else {
        const count = countMines(r, c);
        cell.classList.add('revealed');
        if(count > 0) cell.innerText = count;
        else {
            // 주변 자동 열기 (BFS)
            for(let dr=-1; dr<=1; dr++){
                for(let dc=-1; dc<=1; dc++){
                    let nr = r+dr, nc = c+dc;
                    if(nr>=0 && nr<boardSize && nc>=0 && nc<boardSize) revealCell(nr, nc);
                }
            }
        }
    }
    checkWin();
}

function toggleFlag(cell) {
    if(cell.classList.contains('revealed')) return;
    if(cell.classList.toggle('flagged')) remainingMines--;
    else remainingMines++;
    document.getElementById('game-mine-count').innerText = remainingMines;
}

function placeMines(exR, exC) {
    let placed = 0;
    while(placed < mineCount) {
        let r = Math.floor(Math.random()*boardSize);
        let c = Math.floor(Math.random()*boardSize);
        if(gridData[r][c] !== 'M' && (r !== exR || c !== exC)) {
            gridData[r][c] = 'M';
            placed++;
        }
    }
}

function countMines(r, c) {
    let count = 0;
    for(let dr=-1; dr<=1; dr++){
        for(let dc=-1; dc<=1; dc++){
            let nr = r+dr, nc = c+dc;
            if(nr>=0 && nr<boardSize && nc>=0 && nc<boardSize && gridData[nr][nc] === 'M') count++;
        }
    }
    return count;
}

function gameOver(win) {
    clearInterval(timerInterval);
    if(win) alert(`대성공! ${gameTime}초 만에 완료했습니다! 🎉`);
    else {
        alert("앗! 상한 달걀이에요! 💥");
        // 모든 지뢰 공개 로직 생략
    }
    document.getElementById('fullscreen-game-overlay').style.display = 'none';
}

function checkWin() {
    const revealedCount = document.querySelectorAll('.egg-cell.revealed').length;
    if(revealedCount === (boardSize * boardSize) - mineCount) gameOver(true);
}