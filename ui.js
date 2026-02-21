// Version: 6.7.0 - UI & Modals
let currentView = 'mine';

// 1. 메인 화면 전환 (채굴 / 제련 / 던전)
function switchView(view) {
    currentView = view;
    const battleScreen = document.getElementById('battle-screen');
    if (battleScreen) battleScreen.style.display = 'none';
    
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) gameContainer.style.display = 'flex';
    
    document.getElementById('mine-view').style.display = (view === 'mine') ? 'flex' : 'none';
    document.getElementById('inventory-section').style.display = (view === 'mine') ? 'flex' : 'none';
    document.getElementById('refine-view').style.display = (view === 'refine') ? 'flex' : 'none';
    document.getElementById('war-view').style.display = (view === 'war') ? 'flex' : 'none';
    
    document.getElementById('tab-mine').classList.toggle('active', view === 'mine');
    document.getElementById('tab-refine').classList.toggle('active', view === 'refine');
    document.getElementById('tab-war').classList.toggle('active', view === 'war');
    
    if (view === 'war') {
        if(window.renderDungeonList) window.renderDungeonList();
        if(window.renderMercenaryCamp) window.renderMercenaryCamp();
    } else if (view === 'refine') {
        if(window.renderRefineView) window.renderRefineView();
    } else {
        if(window.renderInventory) window.renderInventory();
    }
}

// 2. 하단 3버튼: 설정 모달
function openSettings() { 
    document.getElementById('settings-modal').style.display = 'flex'; 
    updateSoundBtn(); 
    const slider = document.getElementById('volume-slider');
    if(slider) slider.value = window.masterVolume || 2;
}
function closeSettings() { document.getElementById('settings-modal').style.display = 'none'; }

// 3. 하단 3버튼: 도감 모달
function openCodex() { 
    document.getElementById('codex-modal').style.display = 'flex'; 
    renderCodex(); 
}
function closeCodex() { document.getElementById('codex-modal').style.display = 'none'; }

// 4. 하단 3버튼: 랭킹 모달
function openRanking() { 
    document.getElementById('ranking-modal').style.display = 'flex'; 
    if(window.generateRankings) window.generateRankings(); 
}
function closeRanking() { document.getElementById('ranking-modal').style.display = 'none'; }

// 5. 기타: 가이드 모달
function openGuide() { 
    closeSettings();
    const content = document.getElementById('guide-scroll-content');
    content.innerHTML = `
        <h3>1. 💎 다이아몬드와 훈련소</h3>
        <p>던전 보스를 처치하면 대량의 다이아몬드를 얻습니다. 용병 훈련소에서 용병을 영구적으로 강화하세요.</p>
        <h3>2. ☠️ HELL 모드</h3>
        <p>36레벨 신성 치아를 획득하면 지옥문이 열립니다. 엄청난 난이도와 어마어마한 보상이 기다립니다.</p>
        <h3>3. ⚡ 빠른 조작 꿀팁</h3>
        <p>인벤토리 치아를 더블 탭하면 같은 레벨이 모두 합성됩니다. (Top 8 제외)</p>
    `;
    document.getElementById('guide-modal').style.display = 'flex'; 
}
function closeGuide() { document.getElementById('guide-modal').style.display = 'none'; }

// 6. 설정 세부 기능 (소리, 쿠폰, 초기화)
function toggleSound() {
    window.isMuted = !window.isMuted;
    updateSoundBtn();
    if(window.saveGame) window.saveGame();
}
function updateSoundBtn() {
    const btn = document.getElementById('sound-toggle-btn');
    if(btn) {
        btn.innerText = window.isMuted ? "🔇 BGM/SFX OFF" : "🔊 BGM/SFX ON";
        btn.style.background = window.isMuted ? "#555" : "#f1c40f";
        btn.style.color = window.isMuted ? "#ccc" : "black";
    }
}
function changeVolume() {
    const slider = document.getElementById('volume-slider');
    if(slider) {
        window.masterVolume = parseInt(slider.value);
        if(window.saveGame) window.saveGame();
    }
}

function promptCoupon() {
    const code = prompt("쿠폰 코드를 입력하세요:");
    if (code && window.checkCoupon) {
        window.checkCoupon(code);
    }
}

function checkReset() {
    if(confirm("정말 모든 데이터를 초기화하시겠습니까? 복구할 수 없습니다!")) {
        window.isResetting = true;
        localStorage.clear();
        location.reload();
    }
}

// 7. 도감 렌더링 엔진
function renderCodex() {
    const grid = document.getElementById('codex-grid');
    let html = '';
    let unlockedCount = 0;
    const highest = window.highestToothLevel || 1;

    for (let i = 1; i <= 40; i++) {
        const isUnlocked = i <= highest;
        if (isUnlocked) unlockedCount++;
        
        if (isUnlocked) {
            html += `
            <div class="codex-item">
                <div class="codex-badge">${i}</div>
                ${getToothIcon(i)}
                <div class="codex-name" style="margin-top:5px;">${getToothName(i)}</div>
            </div>`;
        } else {
            html += `
            <div class="codex-item locked">
                <div class="codex-badge" style="background:#555;">${i}</div>
                <div class="tooth-icon">❓</div>
                <div class="codex-name" style="margin-top:5px;">미발견</div>
            </div>`;
        }
    }
    grid.innerHTML = html;
    document.getElementById('codex-progress').innerText = `수집률: ${unlockedCount}/40`;
}

// 8. 신규 티어 해금 축하 연출
function showTierUnlock(level) {
    if(level < 6) return; // 6레벨(티어2)부터 축하
    const tier = Math.floor((level - 1) / 5) + 1; 
    let advText = "";
    
    // 영구 어드밴티지 텍스트
    switch(level) {
        case 6: advText = "💰 채굴 골드 획득량 +5%"; break;
        case 11: advText = "💰 채굴 골드 획득량 +5% & 수동 터치 시 골드 획득!"; break;
        case 16: advText = "⚔️ 던전 전투 치명타 확률 +5% (2배 데미지)"; break;
        case 21: advText = "💎 다이아 획득량 2배 증가"; break;
        case 26: advText = "💪 모든 용병 공격력 2배 증가"; break;
        case 31: advText = "🏰 던전 클리어 골드 보상 2배"; break;
        case 36: advText = "🔥 모든 치아 공격력 10배 & HELL 모드 오픈!"; openHellVideo(); break;
    }

    const modal = document.getElementById('tier-unlock-modal');
    document.getElementById('tier-unlock-icon').innerHTML = getToothIcon(level);
    document.getElementById('tier-unlock-name').innerText = `[티어 ${tier}] ${TOOTH_DATA.baseNames[tier-1]} 개방!`;
    document.getElementById('tier-unlock-desc').innerText = advText;
    
    playSfx('unlock'); // 축하 팡파레 소리
    modal.style.display = 'flex';
}
function closeTierUnlock() {
    document.getElementById('tier-unlock-modal').style.display = 'none';
}

// 9. HELL 모드 영상 연출 및 토글 시스템
function openHellVideo() {
    const seen = localStorage.getItem('hellVideoSeen_v670');
    if(seen === 'true') return;
    
    const layer = document.getElementById('hell-video-layer');
    const vid = document.getElementById('hell-video');
    const skip = document.getElementById('skip-hell-btn');
    
    layer.style.display = 'flex';
    vid.style.display = 'block';
    skip.style.display = 'block';
    
    vid.volume = window.masterVolume ? window.masterVolume * 0.3 : 0.6;
    vid.muted = window.isMuted;
    
    vid.play().catch(e => { finishHellIntro(); });
    vid.onended = () => { finishHellIntro(); };
}
function skipHellIntro() {
    const vid = document.getElementById('hell-video');
    vid.pause();
    finishHellIntro();
}
function finishHellIntro() {
    const layer = document.getElementById('hell-video-layer');
    layer.style.display = 'none';
    localStorage.setItem('hellVideoSeen_v670', 'true');
}

function toggleHellMode() {
    const checkbox = document.getElementById('hell-mode-checkbox');
    window.isHellMode = checkbox.checked;
    
    if(window.isHellMode) {
        document.body.classList.add('hell-mode');
    } else {
        document.body.classList.remove('hell-mode');
    }
    
    if(window.renderDungeonList) window.renderDungeonList();
}
