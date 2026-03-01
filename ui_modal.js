// Version: 8.0.0 - UI Modals (Shop, Codex, Artifacts, Ranking, Items, Retreat Confirm, etc.)

// --- [ 1. 공통 모달 열기/닫기 유틸 ] ---
function openModal(id) {
    document.getElementById(id).style.display = 'flex';
    try { if(typeof playSfx === 'function') playSfx('hit'); } catch(e){}
}
function closeModal(id) {
    document.getElementById(id).style.display = 'none';
    try { if(typeof playSfx === 'function') playSfx('hit'); } catch(e){}
}

// --- [ 2. 신규: 후퇴 확인 모달 ] ---
window.promptRetreat = function() {
    openModal('retreat-confirm-modal');
};
window.closeRetreatConfirm = function() {
    closeModal('retreat-confirm-modal');
};
window.executeRetreat = function() {
    closeModal('retreat-confirm-modal');
    if(typeof window.exitDungeon === 'function') window.exitDungeon();
};

// --- [ 3. 신규: 소모품(물약) 가방 모달 ] ---
window.openItems = function() {
    openModal('item-modal');
    window.renderItems();
};
window.closeItems = function() {
    closeModal('item-modal');
};
window.renderItems = function() {
    const list = document.getElementById('item-list');
    if(!list) return;
    list.innerHTML = '';
    
    // 초기화 방어코드
    if(!window.inventoryItems) window.inventoryItems = {};
    
    let hasItem = false;
    TOOTH_DATA.consumables.forEach(item => {
        let count = window.inventoryItems[item.id] || 0;
        if (count > 0) {
            hasItem = true;
            let isActive = window.activeBuffs && window.activeBuffs[item.effectType] && window.activeBuffs[item.effectType].endTime > Date.now();
            
            let btnHtml = isActive 
                ? `<div class="buff-active-text">⚡ 활성화됨</div>`
                : `<button onclick="useItem('${item.id}')" class="btn-gold" style="padding:5px 15px; font-size:12px;">사용</button>`;

            list.innerHTML += `
                <div class="item-card">
                    <div class="item-info">
                        <div class="item-icon">${item.icon}</div>
                        <div>
                            <div style="font-weight:bold; color:var(--gold); font-size:13px;">${item.name} <span style="color:#fff; font-size:11px;">(보유: ${count}개)</span></div>
                            <div class="item-desc">${item.desc}</div>
                        </div>
                    </div>
                    <div>${btnHtml}</div>
                </div>
            `;
        }
    });

    if (!hasItem) {
        list.innerHTML = `<div style="text-align:center; padding:20px; color:#888; font-size:12px;">보유 중인 소모품이 없습니다.<br>던전을 클리어하여 획득해 보세요!</div>`;
    }
};

window.useItem = function(itemId) {
    if(!window.inventoryItems[itemId] || window.inventoryItems[itemId] <= 0) return;
    
    const itemData = TOOTH_DATA.consumables.find(i => i.id === itemId);
    if(!itemData) return;

    if(!window.activeBuffs) window.activeBuffs = {};
    
    // 버프 적용
    window.activeBuffs[itemData.effectType] = {
        endTime: Date.now() + (itemData.duration * 1000),
        multiplier: itemData.multiplier
    };
    
    // 개수 차감
    window.inventoryItems[itemId]--;
    
    try { if(typeof playSfx === 'function') playSfx('upgrade'); } catch(e){}
    window.renderItems();
    if(typeof window.renderActiveBuffs === 'function') window.renderActiveBuffs();
    if(typeof window.saveGame === 'function') window.saveGame();
};

// --- [ 4. 설정 및 기타 기본 모달 ] ---
window.openSettings = function() { 
    openModal('settings-modal'); 
    document.getElementById('current-nickname-display').innerText = window.nickname || "용감한치과의사";
    document.getElementById('volume-slider').value = window.masterVolume || 2;
    if(typeof window.updateSoundBtn === 'function') window.updateSoundBtn();
};
window.closeSettings = function() { closeModal('settings-modal'); };

window.openCodex = function() { openModal('codex-modal'); if(typeof window.renderCodex === 'function') window.renderCodex(); };
window.closeCodex = function() { closeModal('codex-modal'); };

window.openArtifacts = function() { openModal('artifact-modal'); if(typeof window.renderArtifacts === 'function') window.renderArtifacts(); };
window.closeArtifacts = function() { closeModal('artifact-modal'); };

window.openLockedToothModal = function() {
    openModal('locked-tooth-modal');
    const reqDiv = document.getElementById('unlock-requirements');
    const cost = TOOTH_DATA.AWAKEN_REQ;
    const gColor = window.gold >= cost.gold ? '#2ecc71' : '#e74c3c';
    const dColor = window.dia >= cost.dia ? '#2ecc71' : '#e74c3c';
    const mColor = (window.bossMarks||0) >= cost.bossMarks ? '#2ecc71' : '#e74c3c';
    
    reqDiv.innerHTML = `
        <div style="font-size:13px; margin-bottom:5px;">💰 <span style="color:${gColor};">${fNum(window.gold)} / ${fNum(cost.gold)}</span> 골드</div>
        <div style="font-size:13px; margin-bottom:5px;">♦️ <span style="color:${dColor};">${fNum(window.dia)} / ${fNum(cost.dia)}</span> 다이아</div>
        <div style="font-size:13px;">🏅 <span style="color:${mColor};">${window.bossMarks||0} / ${cost.bossMarks}</span> 보스 징표</div>
    `;
};
window.closeLockedToothModal = function() { closeModal('locked-tooth-modal'); };

window.openMercenaryModal = function() { openModal('mercenary-modal'); if(typeof window.renderMercenaryModal === 'function') window.renderMercenaryModal(); };
window.closeMercenaryModal = function() { closeModal('mercenary-modal'); };

window.openTrainingCamp = function() { openModal('training-modal'); if(typeof window.renderTrainingCamp === 'function') window.renderTrainingCamp(); };
window.closeTrainingCamp = function() { closeModal('training-modal'); };

// --- [ 5. 랭킹 시스템 (전투력-던전 동기화 반영) ] ---
window.openRanking = function() {
    openModal('ranking-modal');
    const list = document.getElementById('ranking-list');
    list.innerHTML = '';
    
    // 나의 전투력 및 도달 층수 계산
    let myPower = getAtk(window.highestToothLevel) * (window.activeMercenary ? window.activeMercenary.atkMul : 1);
    let myFloor = window.unlockedDungeon > 20 ? (window.unlockedHellDungeon || 1) + 20 : window.unlockedDungeon;
    
    // 가짜 랭커 생성 (전투력과 던전 층수 비례 로직 적용)
    let fakeRankers = [];
    for(let i=0; i<30; i++) {
        let name = TOOTH_DATA.REAL_NICKNAMES[Math.floor(Math.random() * TOOTH_DATA.REAL_NICKNAMES.length)] + Math.floor(Math.random()*999);
        
        // 랭커의 던전 층수 랜덤 설정 (내 근처 + 상위권 위주)
        let fFloor = Math.max(1, Math.min(30, myFloor + Math.floor(Math.random() * 10 - 3)));
        
        // 층수에 비례하여 전투력 설정 (기본 100 * 1.5^층수 + 오차범위)
        let basePwr = 100 * Math.pow(1.5, fFloor);
        let variance = 0.8 + (Math.random() * 0.4); // 0.8배 ~ 1.2배
        let fPower = Math.floor(basePwr * variance);
        
        fakeRankers.push({ name: name, power: fPower, floor: fFloor });
    }
    
    fakeRankers.push({ name: window.nickname || "용감한치과의사", power: myPower, floor: myFloor, isMe: true });
    fakeRankers.sort((a,b) => b.power - a.power);
    
    let myRank = 0;
    fakeRankers.forEach((r, idx) => {
        let rankStr = (idx+1) + "위";
        if(idx===0) rankStr = "🥇"; else if(idx===1) rankStr = "🥈"; else if(idx===2) rankStr = "🥉";
        
        let dName = r.floor > 20 ? `HELL ${r.floor-20}층` : `일반 ${r.floor}층`;
        let color = r.floor > 20 ? '#ff4d4d' : '#aaa';
        
        let bg = r.isMe ? 'rgba(241, 196, 15, 0.2)' : 'transparent';
        let border = r.isMe ? '1px solid var(--gold)' : 'none';
        if(r.isMe) myRank = idx + 1;
        
        list.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 5px; border-bottom:1px solid #333; background:${bg}; border:${border};">
                <span style="width:15%; text-align:center; font-size:16px;">${rankStr}</span>
                <span style="flex:1; text-align:center; font-size:12px; color:${r.isMe?'var(--gold)':'#fff'};">${r.name}</span>
                <span style="width:20%; text-align:center; font-size:10px; color:${color};">${dName}</span>
                <span style="width:25%; text-align:right; font-size:11px; color:#2ecc71;">${fNum(r.power)}</span>
            </div>
        `;
    });
    
    document.getElementById('my-rank-display').innerText = `내 순위: ${myRank}위 (전투력: ${fNum(myPower)})`;
};
window.closeRanking = function() { closeModal('ranking-modal'); };

// --- [ 6. 닉네임 및 가이드 ] ---
window.openNicknameChange = function() { openModal('nickname-modal'); };
window.confirmNickname = function() {
    let input = document.getElementById('nickname-input').value.trim();
    if(input.length > 0 && input.length <= 10) {
        window.nickname = input;
        closeModal('nickname-modal');
        document.getElementById('current-nickname-display').innerText = window.nickname;
        if(typeof window.saveGame === 'function') window.saveGame();
    } else {
        alert("닉네임은 1~10자 사이로 입력해주세요.");
    }
};

window.openGuide = function() {
    openModal('guide-modal');
    const content = document.getElementById('guide-scroll-content');
    content.innerHTML = `
        <h3 style="color:var(--gold); margin-top:0;">1. 채굴과 합성</h3>
        <p style="font-size:11px; color:#ccc; line-height:1.4;">거대 치아를 터치하여 채굴하세요. 똑같은 치아를 드래그해서 겹치면 상위 치아로 진화합니다. 중앙 다이얼의 AUTO 버튼을 누르면 기계가 대신 해줍니다!</p>
        <h3 style="color:var(--gold);">2. 용병과 전투</h3>
        <p style="font-size:11px; color:#ccc; line-height:1.4;">던전 원정 탭에서 용병을 고용하세요. 용병의 공격력 배율이 치아의 기본 공격력을 증폭시킵니다. 높은 층일수록 보상이 기하급수적으로 늘어납니다.</p>
        <h3 style="color:var(--gold);">3. 유물과 소모품</h3>
        <p style="font-size:11px; color:#ccc; line-height:1.4;">던전 보스는 낮은 확률로 유물과 물약(소모품)을 드랍합니다. 유물은 영구적인 채굴 레벨을 올려주고, 물약은 엄청난 단기 버프를 제공합니다.</p>
    `;
};
window.closeGuide = function() { closeModal('guide-modal'); };

// --- [ 7. 결과창 (소모품 획득 렌더링 추가) ] ---
window.showDungeonResult = function(isWin, isHell, reward, diaReward, artifactDrop, itemDrop) {
    document.getElementById('battle-screen').style.display = 'none';
    openModal('dungeon-result-modal');
    
    const title = document.getElementById('result-title');
    const desc = document.getElementById('result-desc');
    const artiArea = document.getElementById('result-artifact-area');
    const itemArea = document.getElementById('result-item-area');
    const nextBtn = document.getElementById('btn-next-dungeon');
    
    artiArea.innerHTML = '';
    itemArea.innerHTML = '';
    
    if(isWin) {
        title.innerText = "VICTORY!";
        title.style.color = "#2ecc71";
        desc.innerHTML = `<span style="font-size:14px; color:#ccc;">전리품 획득</span><br><br><span style="font-size:20px; color:var(--gold);">💰 +${fNum(reward)}</span>`;
        if(diaReward > 0) {
            desc.innerHTML += `<br><span style="font-size:18px; color:#00fbff;">♦️ +${fNum(diaReward)}</span>`;
        }
        
        if(artifactDrop) {
            artiArea.innerHTML = `<div style="background:rgba(255,255,255,0.1); padding:10px; border:1px solid #f1c40f; display:inline-block;">
                <div style="font-size:10px; color:#f1c40f; margin-bottom:5px;">✨ 유물 발견!</div>
                <span style="font-size:24px;">${artifactDrop.icon}</span><br>
                <span style="font-size:12px; color:#fff;">${artifactDrop.name}</span>
            </div>`;
        }
        
        // 🌟 신규: 소모품 획득 렌더링
        if(itemDrop) {
            itemArea.innerHTML = `<div style="background:rgba(46,204,113,0.1); padding:10px; border:1px solid #2ecc71; display:inline-block; margin-top:5px;">
                <div style="font-size:10px; color:#2ecc71; margin-bottom:5px;">🎊 물약 획득!</div>
                <span style="font-size:24px;">${itemDrop.icon}</span><br>
                <span style="font-size:12px; color:#fff;">${itemDrop.name}</span>
            </div>`;
        }
        
        nextBtn.style.display = 'block';
    } else {
        title.innerText = "DEFEAT...";
        title.style.color = "#e74c3c";
        desc.innerHTML = `<span style="font-size:14px; color:#ccc;">용병이 쓰러졌습니다...</span>`;
        nextBtn.style.display = 'none';
    }
};

window.closeResultModal = function() { closeModal('dungeon-result-modal'); };
window.closeTierUnlock = function() { closeModal('tier-unlock-modal'); };
