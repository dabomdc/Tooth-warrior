// Version: 6.9.3 - UI Engine (Modals, Guild Tabs, Clipboard Save/Load)

window.currentView = 'mine';
window.currentDungeonTab = 'normal';

// 메인 탭 전환
window.switchView = function(viewId) {
    window.currentView = viewId;
    document.getElementById('mine-view').style.display = 'none';
    document.getElementById('refine-view').style.display = 'none';
    document.getElementById('war-view').style.display = 'none';
    
    document.getElementById('tab-mine').classList.remove('active');
    document.getElementById('tab-refine').classList.remove('active');
    document.getElementById('tab-war').classList.remove('active');
    
    document.getElementById(`${viewId}-view`).style.display = 'block';
    document.getElementById(`tab-${viewId}`).classList.add('active');
    
    if (viewId === 'mine') {
        if(window.renderInventory) window.renderInventory();
    } else if (viewId === 'refine') {
        if(window.renderRefineView) window.renderRefineView();
    } else if (viewId === 'war') {
        if(window.renderDungeonList) window.renderDungeonList();
        // 파트너 카드 렌더링 호출
        if(window.renderPartnerCard) window.renderPartnerCard(); 
    }
};

// 던전 원정 내부 탭 (일반/보스/헬)
window.switchDungeonTab = function(tabId) {
    window.currentDungeonTab = tabId;
    document.querySelectorAll('.war-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`d-tab-${tabId}`).classList.add('active');
    
    const rushInfo = document.getElementById('boss-rush-info');
    if (rushInfo) {
        rushInfo.style.display = (tabId === 'boss' || tabId === 'hellboss') ? 'block' : 'none';
    }
    
    if(window.renderDungeonList) window.renderDungeonList();
};

// --- 🌟 신규: 용병 길드 팝업창 및 탭 제어 ---
window.openGuildModal = function() {
    const m = document.getElementById('guild-modal');
    if(m) {
        m.style.display = 'flex';
        // 보유 재화 즉시 갱신
        document.getElementById('guild-gold-display').innerText = (window.fNum ? window.fNum(window.gold) : window.gold) + 'G';
        document.getElementById('guild-dia-display').innerText = window.dia + '♦️';
        // 열 때 기본적으로 '고용' 탭 표시
        window.switchGuildTab('hire'); 
    }
};

window.closeGuildModal = function() {
    const m = document.getElementById('guild-modal');
    if(m) m.style.display = 'none';
    // 길드를 닫을 때 메인 화면 파트너 카드 갱신
    if(window.renderPartnerCard) window.renderPartnerCard();
};

window.switchGuildTab = function(tabId) {
    document.getElementById('tab-hire').classList.remove('active');
    document.getElementById('tab-train').classList.remove('active');
    document.getElementById('guild-hire-view').style.display = 'none';
    document.getElementById('guild-train-view').style.display = 'none';
    
    document.getElementById(`tab-${tabId}`).classList.add('active');
    
    if (tabId === 'hire') {
        document.getElementById('guild-hire-view').style.display = 'block';
        if(window.renderMercenaryCamp) window.renderMercenaryCamp();
    } else if (tabId === 'train') {
        document.getElementById('guild-train-view').style.display = 'block';
        if(window.renderTrainingList) window.renderTrainingList();
    }
};

// --- 설정 팝업 및 데이터 관리 (클립보드 복사) ---
window.openSettings = function() {
    const m = document.getElementById('settings-modal');
    if(m) {
        m.style.display = 'flex';
        // 🌟 현재 닉네임 표기
        const nickDisp = document.getElementById('current-nickname-display');
        if(nickDisp) nickDisp.innerText = window.nickname || "미설정";
    }
};

window.closeSettings = function() {
    const m = document.getElementById('settings-modal');
    if(m) m.style.display = 'none';
};

// 🌟 [핵심] 세이브 코드 클립보드 복사 및 안내 기능
window.exportSave = function() {
    if(window.saveGame) window.saveGame();
    const saved = localStorage.getItem('toothSaveV690');
    if(saved) {
        const encoded = btoa(unescape(encodeURIComponent(saved)));
        // 최신 브라우저 클립보드 API 사용
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(encoded).then(() => {
                alert("✅ 클립보드에 코드가 복사되었습니다!\n\n다른 브라우저나 폰/PC에서 이어서 플레이하시려면, 해당 기기에서 [세이브 코드 붙여넣기] 버튼을 눌러 이 코드를 입력해 주세요.");
            }).catch(err => {
                prompt("클립보드 자동 복사에 실패했습니다. 아래 텍스트를 직접 전체 복사해 주세요.\n(다른 기기에서 [세이브 코드 붙여넣기]로 이어하기 가능)", encoded);
            });
        } else {
            // 구형 브라우저 또는 비보안(HTTP) 환경 대비책
            prompt("아래 텍스트를 전체 복사해 주세요.\n(다른 기기에서 [세이브 코드 붙여넣기]를 눌러 이어하기 가능)", encoded);
        }
    } else {
        alert("저장된 데이터가 없습니다.");
    }
};

window.promptCoupon = function() {
    const code = prompt("쿠폰 코드를 입력하세요:");
    if(code && window.checkCoupon) window.checkCoupon(code);
};

window.checkReset = function() {
    const ans = prompt("정말로 모든 데이터를 초기화하시겠습니까?\n복구할 수 없습니다! 진행하려면 '초기화'를 입력하세요.");
    if(ans === "초기화") {
        window.isResetting = true;
        localStorage.removeItem('toothSaveV690');
        localStorage.removeItem('toothIntroSeen_v5');
        alert("데이터가 초기화되었습니다.");
        location.reload();
    }
};

// --- 도감 팝업 ---
window.openCodex = function() {
    const m = document.getElementById('codex-modal');
    if(m) { m.style.display = 'flex'; if(window.renderCodex) window.renderCodex(); }
};
window.closeCodex = function() {
    const m = document.getElementById('codex-modal');
    if(m) m.style.display = 'none';
};

// --- 랭킹 팝업 ---
window.openRanking = function() {
    const m = document.getElementById('ranking-modal');
    if(m) { m.style.display = 'flex'; if(window.generateRankings) window.generateRankings(); }
};
window.closeRanking = function() {
    const m = document.getElementById('ranking-modal');
    if(m) m.style.display = 'none';
};

// --- 가이드 팝업 ---
window.openGuide = function() {
    const m = document.getElementById('guide-modal');
    if(m) { m.style.display = 'flex'; if(window.renderGuide) window.renderGuide(); }
};
window.closeGuide = function() {
    const m = document.getElementById('guide-modal');
    if(m) m.style.display = 'none';
};

// --- 티어 해금 팝업 ---
window.showTierUnlock = function(level) {
    if(typeof TOOTH_DATA === 'undefined') return;
    const name = typeof getToothName === 'function' ? getToothName(level) : `Lv.${level} 치아`;
    const icon = typeof getToothIcon === 'function' ? getToothIcon(level) : "🦷";
    
    document.getElementById('tier-unlock-name').innerText = name;
    document.getElementById('tier-unlock-icon').innerText = icon;
    
    let desc = "놀라운 발견입니다!";
    if (level === 4) desc = "이제부터 수동 채굴 시 일정 확률로 골드가 드랍됩니다!";
    else if (level === 7) desc = "제련소에서 치명타 확률을 강화할 수 있습니다!";
    else if (level === 10) desc = "최상위 스킬 제련이 가능해졌습니다!";
    
    document.getElementById('tier-unlock-desc').innerText = desc;
    document.getElementById('tier-unlock-modal').style.display = 'flex';
    
    try { if(typeof playSfx === 'function') playSfx('tier_unlock'); } catch(e){}
};

window.closeTierUnlock = function() {
    document.getElementById('tier-unlock-modal').style.display = 'none';
};

// --- 헬 모드 인트로 팝업 ---
window.skipHellIntro = function() {
    const vid = document.getElementById('hell-video');
    if(vid) vid.pause();
    const layer = document.getElementById('hell-video-layer');
    if(layer) {
        layer.style.transition = 'opacity 1.5s ease';
        layer.style.opacity = '0';
        setTimeout(() => {
            layer.style.display = 'none';
            document.getElementById('d-tab-hell').style.display = 'inline-block';
            document.getElementById('d-tab-hellboss').style.display = 'inline-block';
            if(window.switchDungeonTab) window.switchDungeonTab('hell');
            if(window.saveGame) window.saveGame();
        }, 1500);
    }
};

// --- 사운드 제어 ---
window.toggleSound = function() {
    window.isMuted = !window.isMuted;
    window.updateSoundBtn();
    if(window.saveGame) window.saveGame();
};

window.changeVolume = function() {
    const s = document.getElementById('volume-slider');
    if(s) {
        window.masterVolume = parseInt(s.value);
        if(window.saveGame) window.saveGame();
    }
};

window.updateSoundBtn = function() {
    const btn = document.getElementById('sound-toggle-btn');
    if(btn) btn.innerText = window.isMuted ? "🔇 BGM/SFX OFF" : "🔊 BGM/SFX ON";
    const s = document.getElementById('volume-slider');
    if(s) s.value = window.masterVolume;
};
