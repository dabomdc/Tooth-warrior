// Version: 8.0.1 - UI Core (View Switching, Layout, Buff Bar, Intro, Stats)

window.currentView = 'mine';
window.currentDungeonTab = 'normal';

// --- [ 1. 메인 뷰 전환 ] ---
window.switchView = function(viewName) {
    window.currentView = viewName;
    document.getElementById('mine-view').style.display = 'none';
    document.getElementById('inventory-section').style.display = 'none';
    document.getElementById('refine-view').style.display = 'none';
    document.getElementById('war-view').style.display = 'none';
    
    document.getElementById('tab-mine').classList.remove('active');
    document.getElementById('tab-refine').classList.remove('active');
    document.getElementById('tab-war').classList.remove('active');
    
    if (viewName === 'mine') {
        document.getElementById('mine-view').style.display = 'flex';
        document.getElementById('inventory-section').style.display = 'flex';
        document.getElementById('tab-mine').classList.add('active');
        if(window.renderInventory) window.renderInventory();
    } else if (viewName === 'refine') {
        document.getElementById('refine-view').style.display = 'flex';
        document.getElementById('tab-refine').classList.add('active');
        if(window.renderRefineView) window.renderRefineView();
    } else if (viewName === 'war') {
        document.getElementById('war-view').style.display = 'flex';
        document.getElementById('tab-war').classList.add('active');
        
        if (window.unlockedDungeon > 20) {
            document.getElementById('d-tab-hell').style.display = 'inline-block';
            document.getElementById('d-tab-hellboss').style.display = 'inline-block';
        }
        
        if(window.renderMercenaryCamp) window.renderMercenaryCamp();
        window.switchDungeonTab(window.currentDungeonTab); 
    }
    
    try { if(typeof playSfx === 'function') playSfx('hit'); } catch(e){}
};

// --- [ 2. 던전 원정 탭 전환 ] ---
window.switchDungeonTab = function(tabName) {
    window.currentDungeonTab = tabName;
    
    document.querySelectorAll('.war-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('d-tab-' + tabName).classList.add('active');
    
    const bossInfo = document.getElementById('boss-rush-info');
    if(tabName === 'boss' || tabName === 'hellboss') {
        bossInfo.style.display = 'block';
    } else {
        bossInfo.style.display = 'none';
    }
    
    if(window.renderDungeonList) window.renderDungeonList();
};

// --- [ 3. 듀얼 다이얼 토글 버튼 시각화 완벽 연동 ] ---
window.updateToggleButtons = function() {
    const mineBtn = document.getElementById('auto-mine-btn');
    const mineDial = document.getElementById('mine-dial');
    if(mineBtn) {
        mineBtn.innerText = window.isAutoMineOn ? "AUTO ON" : "AUTO OFF"; 
        if(!window.isAutoMineOn) {
            mineBtn.classList.add('off');
            if(mineDial) mineDial.classList.add('dial-off');
        } else {
            mineBtn.classList.remove('off');
            if(mineDial) mineDial.classList.remove('dial-off');
        }
    }
    
    const mergeBtn = document.getElementById('auto-merge-btn');
    const mergeDial = document.getElementById('merge-dial');
    if(mergeBtn) {
        mergeBtn.innerText = window.isAutoMergeOn ? "AUTO ON" : "AUTO OFF"; 
        if(!window.isAutoMergeOn) {
            mergeBtn.classList.add('off');
            if(mergeDial) mergeDial.classList.add('dial-off');
        } else {
            mergeBtn.classList.remove('off');
            if(mergeDial) mergeDial.classList.remove('dial-off');
        }
    }
};

// --- [ 4. 사운드 및 시스템 볼륨 조절 UI 연동 ] ---
window.toggleSound = function() {
    window.isMuted = !window.isMuted;
    if(window.saveGame) window.saveGame();
    updateSoundBtn();
};

function updateSoundBtn() {
    const btn = document.getElementById('sound-toggle-btn');
    if(btn) btn.innerText = window.isMuted ? "🔇 BGM/SFX OFF" : "🔊 BGM/SFX ON";
}
window.updateSoundBtn = updateSoundBtn;

window.changeVolume = function() {
    const val = document.getElementById('volume-slider').value;
    window.masterVolume = parseInt(val);
    if(window.saveGame) window.saveGame();
    try { if(typeof playSfx === 'function') playSfx('hit'); } catch(e){}
};

// --- [ 5. 신규: 활성화된 버프(소모품) 상태 표시 바 렌더링 ] ---
window.renderActiveBuffs = function() {
    const buffBar = document.getElementById('active-buff-bar');
    if(!buffBar) return;
    
    if (!window.activeBuffs || Object.keys(window.activeBuffs).length === 0) {
        buffBar.style.display = 'none';
        buffBar.innerHTML = '';
        return;
    }

    let buffHtml = '';
    let hasActive = false;
    const now = Date.now();

    for (const [effectType, buff] of Object.entries(window.activeBuffs)) {
        if (buff.endTime > now) {
            hasActive = true;
            let remainSec = Math.ceil((buff.endTime - now) / 1000);
            let min = Math.floor(remainSec / 60);
            let sec = remainSec % 60;
            let timeStr = `${min}:${sec < 10 ? '0'+sec : sec}`;
            
            let icon = "⚡";
            if (effectType === 'mine_speed') icon = "🧪";
            else if (effectType === 'merge_speed') icon = "⏳";
            else if (effectType === 'manual_power') icon = "💪";
            else if (effectType === 'gold_boost') icon = "💰";

            buffHtml += `<span style="margin: 0 10px; animation: blink 1.5s infinite;">${icon} ${timeStr}</span>`;
        }
    }

    if (hasActive) {
        buffBar.style.display = 'block';
        buffBar.innerHTML = buffHtml;
    } else {
        buffBar.style.display = 'none';
    }
};

// --- [ 6. 삭제된 main.js 로직 완벽 복구 (인트로 영상 처리) ] ---
window.startIntro = function() {
    document.getElementById('start-btn-layer').style.display = 'none';
    const video = document.getElementById('intro-video');
    video.style.display = 'block';
    video.play().catch(e => skipIntro());
    document.getElementById('skip-btn').style.display = 'block';
    video.onended = () => skipIntro();
};

window.skipIntro = function() {
    document.getElementById('intro-layer').style.display = 'none';
    const video = document.getElementById('intro-video');
    video.pause();
    if(typeof window.startGameEngine === 'function') window.startGameEngine();
};

window.playHellIntro = function() {
    const layer = document.getElementById('hell-video-layer');
    const video = document.getElementById('hell-video');
    layer.style.display = 'flex';
    video.style.display = 'block';
    video.play().catch(e => skipHellIntro());
    document.getElementById('skip-hell-btn').style.display = 'block';
    video.onended = () => skipHellIntro();
};

window.skipHellIntro = function() {
    document.getElementById('hell-video-layer').style.display = 'none';
    const video = document.getElementById('hell-video');
    video.pause();
};

window.playAwakenIntro = function() {
    const layer = document.getElementById('awaken-video-layer');
    const video = document.getElementById('awaken-video');
    layer.style.display = 'flex';
    video.style.display = 'block';
    video.play().catch(e => skipAwakenIntro());
    document.getElementById('skip-awaken-btn').style.display = 'block';
    video.onended = () => skipAwakenIntro();
};

window.skipAwakenIntro = function() {
    document.getElementById('awaken-video-layer').style.display = 'none';
    const video = document.getElementById('awaken-video');
    video.pause();
    window.isToothAwakened = true;
    if(typeof window.updateStats === 'function') window.updateStats();
    if(typeof window.renderInventory === 'function') window.renderInventory();
};

// --- [ 7. 삭제된 main.js 로직 완벽 복구 (재화 표시 갱신, 24레벨 개방, 쿠폰) ] ---
window.updateStats = function() {
    const g = document.getElementById('gold-display');
    const d = document.getElementById('dia-display');
    if(g) g.innerText = fNum(window.gold);
    if(d) d.innerText = fNum(window.dia);
    
    const pickName = document.getElementById('pickaxe-name');
    if(pickName && TOOTH_DATA.pickaxes[window.pickaxeLevel]) {
        pickName.innerText = TOOTH_DATA.pickaxes[window.pickaxeLevel].name;
    }
};

window.attemptUnlockTooth = function() {
    const req = TOOTH_DATA.AWAKEN_REQ;
    if (window.gold >= req.gold && window.dia >= req.dia && (window.bossMarks||0) >= req.bossMarks) {
        window.gold -= req.gold;
        window.dia -= req.dia;
        window.bossMarks -= req.bossMarks;
        closeModal('locked-tooth-modal');
        try { if(typeof playSfx === 'function') playSfx('awaken'); } catch(e){}
        window.playAwakenIntro();
    } else {
        alert("재화가 부족하여 봉인을 해제할 수 없습니다!");
    }
};

window.promptCoupon = function() {
    const code = prompt("쿠폰 코드를 입력하세요:");
    // 원장님께서 회의 때 언급하셨던 "테스트쿠폰입력" 복구!
    if(code === "테스트쿠폰입력") { 
        window.gold += 1e15; // 1000조 골드
        window.dia += 100000; // 10만 다이아
        window.bossMarks = (window.bossMarks||0) + 100;
        alert("원장님 전용 테스트 재화가 무한히 지급되었습니다!");
        window.updateStats();
    } else if (code) {
        alert("유효하지 않은 쿠폰입니다.");
    }
};
