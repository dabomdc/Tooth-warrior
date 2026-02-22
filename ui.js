// Version: 6.8.0 - UI Controllers (Codex 24-Level & Dungeon Tabs)

window.currentView = 'mine';
window.currentDungeonTab = 'normal'; // normal, boss, hell, hellboss

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
        
        // 헬 모드 해금 체크 (일반 20단계 클리어 시 헬 탭 노출)
        if (window.unlockedDungeon > 20) {
            document.getElementById('d-tab-hell').style.display = 'inline-block';
            document.getElementById('d-tab-hellboss').style.display = 'inline-block';
        }
        
        if(window.renderMercenaryCamp) window.renderMercenaryCamp();
        window.switchDungeonTab(window.currentDungeonTab); // 현재 선택된 탭 렌더링
    }
    
    try { if(typeof playSfx === 'function') playSfx('hit'); } catch(e){}
};

// --- [ 2. 신규 던전 탭 전환 (토벌전/헬모드) ] ---
window.switchDungeonTab = function(tabName) {
    window.currentDungeonTab = tabName;
    
    // 탭 UI 활성화 처리
    document.querySelectorAll('.war-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('d-tab-' + tabName).classList.add('active');
    
    // 토벌전 경고 문구 표시 여부
    const bossInfo = document.getElementById('boss-rush-info');
    if(tabName === 'boss' || tabName === 'hellboss') {
        bossInfo.style.display = 'block';
    } else {
        bossInfo.style.display = 'none';
    }
    
    if(window.renderDungeonList) window.renderDungeonList();
};

// --- [ 3. 치아 도감 (24단계 압축 반영 및 능력 설명 추가) ] ---
window.openCodex = function() {
    const m = document.getElementById('codex-modal');
    if(m) { m.style.display = 'flex'; renderCodex(); }
};
window.closeCodex = function() {
    const m = document.getElementById('codex-modal');
    if(m) m.style.display = 'none';
};

function renderCodex() {
    const grid = document.getElementById('codex-grid');
    if(!grid || typeof TOOTH_DATA === 'undefined') return;
    grid.innerHTML = '';
    
    let unlockedCount = 0;
    // 24단계로 고정
    for(let i = 1; i <= 24; i++) {
        const item = document.createElement('div');
        item.className = 'codex-item';
        
        const isUnlocked = i <= window.highestToothLevel;
        if(isUnlocked) unlockedCount++;
        else item.classList.add('locked');
        
        const badge = `<div class="codex-badge">${i}</div>`;
        const iconHtml = isUnlocked ? (typeof getToothIcon === 'function' ? getToothIcon(i) : "🦷") : `<div class="codex-icon" style="color:#555;">?</div>`;
        const nameText = isUnlocked ? (typeof getToothName === 'function' ? getToothName(i) : `Lv.${i}`) : "미발견";
        
        // 능력 텍스트 추가
        let abilityText = "";
        if (isUnlocked) {
            const tier = Math.floor((i - 1) / 3) + 1; // 1~8 티어
            if (tier === 2) abilityText = "채굴력 1.2배 상승";
            else if (tier === 3) abilityText = "💥 광역 훈련 개방";
            else if (tier === 4) abilityText = "⚡ 치명타 훈련 개방";
            else if (tier === 5) abilityText = "♦️ 다이아 획득 2배";
            else if (tier === 6) abilityText = "⚔️ 용병 공격력 2배";
            else if (tier === 7) abilityText = "🔥 치아 공격력 10배";
            else if (tier === 8) abilityText = "👑 보상 5배 증폭";
        }

        item.innerHTML = `
            ${badge}
            ${iconHtml}
            <div class="codex-name">${nameText}</div>
            ${abilityText ? `<div class="codex-ability">${abilityText}</div>` : ""}
        `;
        grid.appendChild(item);
    }
    
    const progress = document.getElementById('codex-progress');
    if(progress) progress.innerText = `수집률: ${unlockedCount}/24`;
}
window.renderCodex = renderCodex;

// --- [ 4. 기타 모달 창 컨트롤 ] ---
window.openRanking = function() {
    const m = document.getElementById('ranking-modal');
    if(m) { m.style.display = 'flex'; if(window.generateRankings) window.generateRankings(); }
};
window.closeRanking = function() {
    const m = document.getElementById('ranking-modal');
    if(m) m.style.display = 'none';
};

window.openSettings = function() {
    const m = document.getElementById('settings-modal');
    if(m) m.style.display = 'flex';
};
window.closeSettings = function() {
    const m = document.getElementById('settings-modal');
    if(m) m.style.display = 'none';
};

window.showTierUnlock = function(level) {
    const m = document.getElementById('tier-unlock-modal');
    if(!m) return;
    try { if(typeof playSfx === 'function') playSfx('unlock'); } catch(e){}
    m.style.display = 'flex';
    document.getElementById('tier-unlock-icon').innerHTML = typeof getToothIcon === 'function' ? getToothIcon(level) : "🦷";
    document.getElementById('tier-unlock-name').innerText = typeof getToothName === 'function' ? getToothName(level) : `Lv.${level}`;
    
    let desc = "새로운 힘이 눈을 떴습니다!";
    const tier = Math.floor((level - 1) / 3) + 1;
    if (tier === 2) desc = "기본 채굴력이 1.2배 상승합니다!";
    else if (tier === 3) desc = "[광역 훈련] 슬롯이 개방되었습니다! 적들을 한 번에 쓸어버리세요!";
    else if (tier === 4) desc = "[치명타 훈련] 슬롯이 개방되었습니다! 폭발적인 데미지를 경험하세요!";
    else if (tier === 5) desc = "모든 다이아 획득량이 2배로 증가합니다!";
    else if (tier === 6) desc = "모든 용병의 기본 공격력이 2배 증폭됩니다!";
    else if (tier === 7) desc = "모든 치아의 공격력이 10배로 폭증합니다! 헬 모드를 정복하세요!";
    else if (tier === 8) desc = "던전 클리어 보상(골드/다이아)이 5배 증가합니다!";

    document.getElementById('tier-unlock-desc').innerText = desc;
};
window.closeTierUnlock = function() {
    const m = document.getElementById('tier-unlock-modal');
    if(m) m.style.display = 'none';
};

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

window.checkReset = function() {
    if(confirm("정말로 모든 데이터를 삭제하시겠습니까? 복구할 수 없습니다!")) {
        window.isResetting = true;
        localStorage.removeItem('toothSaveV680');
        localStorage.removeItem('toothSaveV674');
        localStorage.removeItem('toothSaveV673');
        localStorage.removeItem('toothSaveV672');
        localStorage.removeItem('toothSaveV671');
        localStorage.removeItem('toothSaveV670');
        localStorage.removeItem('toothIntroSeen_v3');
        location.reload();
    }
};

window.openGuide = function() {
    const m = document.getElementById('guide-modal');
    if(m) {
        m.style.display = 'flex';
        document.getElementById('guide-scroll-content').innerHTML = `
            <div style="padding-top:10px;">
                <h3 style="color:var(--gold);">🦷 치아 연대기 가이드</h3>
                <p><strong>1. 채굴과 합성 (24단계)</strong><br>화면을 터치하거나 방치하여 치아를 얻고, 같은 레벨을 합쳐 더 강한 치아를 만드세요.<br>특정 레벨(티어)에 도달하면 강력한 특수 능력이 해방됩니다!</p>
                <p><strong>2. 보스 토벌전 & 헬 모드</strong><br>일반 던전 5단계를 넘으면 '보스 토벌전'이 열리며, 일반 던전을 20단계까지 모두 깨면 극악의 난이도를 자랑하는 'HELL 모드'가 개방됩니다.</p>
                <p><strong>3. 훈련장 (광역/치명타)</strong><br>다이아를 모아 용병 훈련장에서 특수 능력을 강화하세요. 광역(스플래시) 훈련은 적들이 뭉쳐있을 때 엄청난 위력을 발휘합니다.</p>
            </div>
        `;
    }
};
window.closeGuide = function() {
    const m = document.getElementById('guide-modal');
    if(m) m.style.display = 'none';
};

window.promptCoupon = function() {
    const code = prompt("쿠폰 코드를 입력하세요:");
    if (code && window.checkCoupon) window.checkCoupon(code);
};

window.skipHellIntro = function() {
    const vid = document.getElementById('hell-video');
    if(vid) vid.pause();
    document.getElementById('hell-video-layer').style.display = 'none';
    
    // HELL 탭 강제 렌더링
    if(window.currentView === 'war') window.switchView('war');
};
