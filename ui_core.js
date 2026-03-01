// Version: 8.0.0 - UI Core (View Switching, Layout, Toggle Sync, Buff Bar)

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
        // 영문 라벨로 변경 적용 완료
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
        // 영문 라벨로 변경 적용 완료
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
ㅐ
    if (hasActive) {
        buffBar.style.display = 'block';
        buffBar.innerHTML = buffHtml;
    } else {
        buffBar.style.display = 'none';
    }
};
