// Version: 7.0.0 - UI Controllers (Retro Style, Artifacts, Awake 24 Lv, Codex Fix)

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

// --- [ 2. 용병 캠프 및 모달 관리 ] ---
window.renderMercenaryCamp = function() { 
    const display = document.getElementById('current-mercenary-display');
    if(!display || typeof TOOTH_DATA === 'undefined') return;

    const curId = window.mercenaryIdx;
    const merc = TOOTH_DATA.mercenaries[curId];
    if(!merc) return;

    let bonusText = "";
    if (window.highestToothLevel >= 16) {
        bonusText = `<div style="color:#2ecc71; font-size:10px; font-weight:bold; margin-top:3px;">✨ 16치아 보너스: 공격력 x2 적용 중!</div>`;
    }

    display.innerHTML = `
        <div style="font-size:40px; background:#1a1a2e; width:60px; height:60px; display:flex; align-items:center; justify-content:center; border:2px solid #555; box-shadow: 2px 2px 0 #000;">${merc.icon}</div>
        <div style="flex:1;">
            <div style="font-size:16px; font-weight:bold; color:white;">${merc.name} <span style="font-size:12px; color:#aaa; font-weight:normal;">(Lv.${curId})</span></div>
            <div style="font-size:11px; color:#ccc; margin-top:2px;">공격 x<span style="color:var(--gold);">${merc.atkMul}</span> | 체력 <span style="color:#ff4757;">${safeFNum(merc.baseHp)}</span> | 이동속도 <span style="color:#3498db;">${merc.spd.toFixed(1)}</span></div>
            ${bonusText}
        </div>
    `;
};

window.openMercenaryModal = function() {
    const m = document.getElementById('mercenary-modal');
    if(m) { m.style.display = 'flex'; window.renderMercenaryModalList(); }
};
window.closeMercenaryModal = function() {
    const m = document.getElementById('mercenary-modal');
    if(m) m.style.display = 'none';
};

window.renderMercenaryModalList = function() {
    const list = document.getElementById('mercenary-list-modal');
    if(!list || typeof TOOTH_DATA === 'undefined') return;
    list.innerHTML = '';
    const maxOwned = Math.max(...window.ownedMercenaries);
    let tier6Text = (window.highestToothLevel >= 16) ? `<span style="color:yellow;">(x2)</span>` : "";

    TOOTH_DATA.mercenaries.forEach(merc => {
        if (merc.id > maxOwned + 1) return;
        const div = document.createElement('div');
        div.className = 'merc-card';
        const isOwned = window.ownedMercenaries.includes(merc.id);
        const isEquipped = window.mercenaryIdx === merc.id;

        div.innerHTML = `
            <div style="font-size:25px;">${merc.icon}</div>
            <div style="font-size:12px; font-weight:bold; margin:5px 0;">${merc.name}</div>
            <div style="font-size:10px; color:#aaa;">공격 x${merc.atkMul} ${tier6Text}</div>
            <div style="font-size:10px; color:#f55;">HP ${safeFNum(merc.baseHp)} <span style="color:#3498db;">| 속도 ${merc.spd.toFixed(1)}</span></div> 
        `;
        if (isEquipped) {
            div.style.border = '2px solid #2ecc71';
            div.innerHTML += `<button class="btn-sm" style="background:#2ecc71; color:white; width:100%; margin-top:5px; cursor:default; box-shadow:none;">장착중</button>`;
        } else if (isOwned) {
            div.innerHTML += `<button onclick="window.equipMerc(${merc.id})" class="btn-sm" style="background:#777; width:100%; margin-top:5px;">장착하기</button>`;
        } else {
            div.innerHTML += `<button onclick="window.buyMerc(${merc.id}, ${merc.cost})" class="btn-gold" style="padding:4px 5px; font-size:11px; width:100%; margin-top:5px;">${safeFNum(merc.cost)}G</button>`;
        }
        list.appendChild(div);
    });
};

window.buyMerc = function(id, cost) { 
    if(window.gold >= cost) { 
        window.gold -= cost; 
        try { if(typeof playSfx === 'function') playSfx('upgrade'); } catch(e){} 
        window.ownedMercenaries.push(id); 
        window.renderMercenaryModalList(); 
        if(window.renderMercenaryCamp) window.renderMercenaryCamp();
        if(window.updateUI) window.updateUI(); 
        if(window.saveGame) window.saveGame();
    } else { alert("골드가 부족합니다!"); } 
};
window.equipMerc = function(id) { 
    window.mercenaryIdx = id; 
    window.renderMercenaryModalList(); 
    if(window.renderMercenaryCamp) window.renderMercenaryCamp();
    if(window.saveGame) window.saveGame(); 
};

// --- [ 3. 던전 리스트 렌더링 (유물 표시 추가) ] ---
window.renderDungeonList = function() { 
    const list = document.getElementById('dungeon-list'); 
    if(!list || typeof TOOTH_DATA === 'undefined') return;
    list.innerHTML = ''; 
    
    const tab = window.currentDungeonTab || 'normal';
    const isHell = (tab === 'hell' || tab === 'hellboss');
    const isBoss = (tab === 'boss' || tab === 'hellboss');
    const currentUnlocked = isHell ? window.unlockedHellDungeon : window.unlockedDungeon;
    
    if (isBoss) {
        const rushNames = isHell ? 
            ["HELL 1~5구간", "HELL 6~10구간", "HELL 11~15구간", "HELL 16~20구간"] :
            ["일반 1~5구간", "일반 6~10구간", "일반 11~15구간", "일반 16~20구간"];
        
        rushNames.forEach((name, i) => {
            const reqLevel = (i * 5) + 6; 
            const isUnlocked = currentUnlocked >= reqLevel;
            const div = document.createElement('div'); 
            div.className = `dungeon-card ${isUnlocked ? 'unlocked' : 'locked'}`; 
            
            let goldFee = Math.floor(5000 * Math.pow(2.0, i * 5));
            let diaFee = 5 + ((i * 5) * 5);
            if (isHell) { goldFee *= 10; diaFee *= 5; }

            if (isUnlocked) {
                div.innerHTML = `<h4 style="margin:0;">🔥 ${name} 보스 토벌전</h4>
                <p style="margin:5px 0 0 0; font-size:12px; color:#ff8888;">입장료: <span style="color:var(--gold);">${safeFNum(goldFee)}G</span>, ♦️${diaFee}</p>
                <p style="color:#f1c40f; font-size:11px; margin:5px 0 0 0;">보스 5연속 처치 시 엄청난 보상 & 보스 징표 획득!</p>`;
                div.onclick = () => { if(typeof startDungeon === 'function') startDungeon(i * 5); };
            } else {
                div.innerHTML = `<h4 style="margin:0;">🔒 잠김</h4><p style="margin:5px 0 0 0; font-size:12px; color:#888;">${isHell ? 'HELL ' : '일반 '}던전 ${reqLevel-1}단계 클리어 시 열림</p>`;
            }
            list.appendChild(div);
        });
    } else {
        const dungeonData = isHell ? TOOTH_DATA.hellDungeons : TOOTH_DATA.dungeons;
        dungeonData.forEach((name, idx) => { 
            const div = document.createElement('div'); 
            const isUnlocked = idx < currentUnlocked; 
            div.className = `dungeon-card ${isUnlocked ? 'unlocked' : 'locked'}`; 
            
            let baseHp = Math.floor(100 * Math.pow(isHell ? 2.5 : 2.2, idx));
            if (isHell) baseHp *= 50;
            const recAtk = (baseHp * 30) / 40;

            // 🌟 신규: 드랍되는 유물 표시
            let artifactIdx = isHell ? idx + 20 : idx;
            let artifactHtml = "";
            if (window.artifactCounts === undefined) window.artifactCounts = new Array(30).fill(0);
            if (TOOTH_DATA.artifacts[artifactIdx]) {
                const art = TOOTH_DATA.artifacts[artifactIdx];
                const myCount = window.artifactCounts[artifactIdx] || 0;
                artifactHtml = `<div style="margin-top:8px; padding-top:8px; border-top:1px dashed #555; font-size:11px; color:#ccc; display:flex; justify-content:space-between; align-items:center;">
                    <span>드랍 유물: ${art.icon} ${art.name}</span>
                    <span style="color:${myCount >= 2 ? '#2ecc71' : '#f39c12'};">보유: ${myCount}/2</span>
                </div>`;
            }

            if (isUnlocked) { 
                div.innerHTML = `<h4 style="margin:0;">⚔️ Lv.${idx+1} ${name}</h4>
                <p style="margin:5px 0 0 0; font-size:12px; color:#aaa;">권장 공격력: ${safeFNum(recAtk)}+</p>
                ${artifactHtml}`;
                div.onclick = () => { if(typeof startDungeon === 'function') startDungeon(idx); };
            } else { 
                div.innerHTML = `<h4 style="margin:0;">🔒 잠김</h4><p style="margin:5px 0 0 0; font-size:12px; color:#888;">이전 던전 클리어 시 열림</p>`; 
            } 
            list.appendChild(div); 
        }); 
    }
};

// --- [ 4. 던전 결과 팝업 (3버튼 + 유물 연출) ] ---
window.showResultModal = function() {
    const modal = document.getElementById('dungeon-result-modal');
    if(!modal || typeof TOOTH_DATA === 'undefined') return;
    modal.style.display = 'flex';
    
    let dName = window.isHellMode ? TOOTH_DATA.hellDungeons[window.currentDungeonIdx] : TOOTH_DATA.dungeons[window.currentDungeonIdx];
    if (window.isBossRush) dName = `[토벌전] ` + dName;
    document.getElementById('result-title').innerText = `${dName} CLEAR!`;
    
    let nextStr = "";
    
    // 던전 오픈 로직 (기존 자동 채굴렙 상승 제거)
    if (!window.isBossRush) {
        if (window.isHellMode) {
            if (window.unlockedHellDungeon <= window.currentDungeonIdx + 1 && window.currentDungeonIdx < 19) {
                window.unlockedHellDungeon = window.currentDungeonIdx + 2;
                nextStr = `신규 HELL 던전 오픈!`;
            }
        } else {
            if (window.currentDungeonIdx === 19 && window.unlockedDungeon === 20) {
                window.unlockedDungeon = 21;
                nextStr = `🔥 경고: 지옥문이 열렸습니다... 🔥`;
                setTimeout(() => {
                    const layer = document.getElementById('hell-video-layer');
                    const vid = document.getElementById('hell-video');
                    const skipBtn = document.getElementById('skip-hell-btn');
                    if(layer && vid) {
                        layer.style.display = 'flex';
                        vid.style.display = 'block';
                        if(skipBtn) skipBtn.style.display = 'block';
                        vid.volume = window.masterVolume ? window.masterVolume * 0.3 : 0.6;
                        vid.muted = window.isMuted;
                        vid.play().catch(e => { window.skipHellIntro(); });
                        vid.onended = () => { setTimeout(window.skipHellIntro, 500); };
                    }
                }, 1500);
            } 
            else if (window.unlockedDungeon <= window.currentDungeonIdx + 1 && window.currentDungeonIdx < 19) {
                window.unlockedDungeon = window.currentDungeonIdx + 2;
                nextStr = `신규 던전 오픈!`;
            }
        }
    }

    let markHtml = "";
    if (window.isBossRush) {
        let earnedMarks = window.isHellMode ? 2 : 1;
        if(window.bossMarks === undefined) window.bossMarks = 0;
        window.bossMarks += earnedMarks;
        markHtml = `<div style="color:#e74c3c; font-weight:bold; margin-top:5px;">획득한 보스 징표: +${earnedMarks}개 (총 ${window.bossMarks}개)</div>`;
    }

    document.getElementById('result-desc').innerHTML = `
        <div style="margin: 15px 0; font-size:16px;">
            골드: <span style="color:var(--gold); font-weight:bold;">+${safeFNum(window.dungeonGoldEarned)}G</span><br>
            다이아: <span style="color:#ff4757; font-weight:bold;">+${window.dungeonDiaEarned}♦️</span>
            ${markHtml}
        </div>
        <div style="color:#2ecc71; font-weight:bold; font-size:12px;">${nextStr}</div>
    `;

    // 🌟 획득 유물 표시
    const artArea = document.getElementById('result-artifact-area');
    if (window.dungeonArtifactDropped && window.dungeonArtifactDropped.count > 0) {
        artArea.innerHTML = `<div style="background:#222; border:2px dashed var(--gold); padding:10px; border-radius:4px; display:inline-block; animation: pulse 1s infinite alternate;">
            <div style="font-size:10px; color:#aaa; margin-bottom:5px;">🎊 유물 발견! 🎊</div>
            <div style="font-size:20px;">${window.dungeonArtifactDropped.icon} <span style="font-size:14px; color:white;">${window.dungeonArtifactDropped.name}</span></div>
        </div>`;
    } else {
        artArea.innerHTML = `<div style="font-size:11px; color:#555;">(발견된 유물 없음)</div>`;
    }

    // 다음 단계 버튼 활성화 제어
    const btnNext = document.getElementById('btn-next-dungeon');
    if (window.isBossRush || window.currentDungeonIdx >= 19) {
        btnNext.style.display = 'none';
    } else {
        btnNext.style.display = 'block';
    }

    saveGame();
};

window.retryDungeon = function() {
    const modal = document.getElementById('dungeon-result-modal');
    if(modal) modal.style.display = 'none';
    if(typeof exitDungeon === 'function') window.exitDungeon();
    
    setTimeout(() => {
        if(typeof startDungeon === 'function') window.startDungeon(window.currentDungeonIdx);
    }, 100);
};

window.nextDungeon = function() {
    const modal = document.getElementById('dungeon-result-modal');
    if(modal) modal.style.display = 'none';
    if(typeof exitDungeon === 'function') window.exitDungeon();
    
    setTimeout(() => {
        if(typeof startDungeon === 'function') window.startDungeon(window.currentDungeonIdx + 1);
    }, 100);
};

// --- [ 5. 도감 및 유물 도감 시스템 ] ---
window.openCodex = function() {
    const m = document.getElementById('codex-modal');
    if(m) { m.style.display = 'flex'; renderCodex(); }
};
window.closeCodex = function() {
    const m = document.getElementById('codex-modal');
    if(m) m.style.display = 'none';
};

window.openArtifacts = function() {
    const m = document.getElementById('artifact-modal');
    if(m) { m.style.display = 'flex'; renderArtifacts(); }
};
window.closeArtifacts = function() {
    const m = document.getElementById('artifact-modal');
    if(m) m.style.display = 'none';
};

function renderCodex() {
    const grid = document.getElementById('codex-grid');
    if(!grid || typeof TOOTH_DATA === 'undefined') return;
    grid.innerHTML = '';
    
    let unlockedCount = 0;
    for(let i = 1; i <= 24; i++) {
        const item = document.createElement('div');
        item.className = 'codex-item';
        
        const isUnlocked = i <= window.highestToothLevel;
        if(isUnlocked) unlockedCount++;
        else item.classList.add('locked');
        
        const badge = `<div class="codex-badge">${i}</div>`;
        const iconHtml = isUnlocked ? (typeof getToothIcon === 'function' ? getToothIcon(i) : "🦷") : `<div class="codex-icon" style="color:#555;">?</div>`;
        const nameText = isUnlocked ? (typeof getToothName === 'function' ? getToothName(i) : `Lv.${i}`) : "미발견";
        
        let abilityText = "";
        // 🌟 수정됨: 도감 텍스트가 해당 레벨에만 정확히 표시되도록 고정
        if (isUnlocked) {
            if (i === 4) abilityText = "채굴력 1.2배 상승";
            else if (i === 7) abilityText = "💥 광역 훈련 개방";
            else if (i === 10) abilityText = "⚡ 치명타 훈련 개방";
            else if (i === 13) abilityText = "♦️ 다이아 획득 2배";
            else if (i === 16) abilityText = "⚔️ 용병 공격력 2배";
            else if (i === 19) abilityText = "🔥 치아 공격력 10배";
            else if (i === 22) abilityText = "👑 보상 5배 증폭";
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

function renderArtifacts() {
    const grid = document.getElementById('artifact-grid');
    if(!grid || typeof TOOTH_DATA === 'undefined') return;
    grid.innerHTML = '';
    
    if (window.artifactCounts === undefined) window.artifactCounts = new Array(30).fill(0);
    
    let completedSets = 0;
    
    for(let i = 0; i < 30; i++) {
        const art = TOOTH_DATA.artifacts[i];
        if(!art) continue;
        
        const count = window.artifactCounts[i];
        const isCompleted = count >= 2;
        if(isCompleted) completedSets++;
        
        const item = document.createElement('div');
        item.className = 'artifact-item';
        if(count === 0) item.classList.add('locked');
        
        item.innerHTML = `
            <div class="artifact-count" style="background:${isCompleted ? '#2ecc71' : '#e74c3c'}">${count}/2</div>
            <div class="artifact-icon">${art.icon}</div>
            <div class="artifact-name">${art.name}</div>
            ${isCompleted ? `<div style="font-size:8px; color:var(--gold); margin-top:3px;">채굴 Lv +1</div>` : `<div style="font-size:8px; color:#555; margin-top:3px;">미완성</div>`}
        `;
        grid.appendChild(item);
    }
    
    const progress = document.getElementById('artifact-progress');
    if(progress) progress.innerText = `완성된 유물: ${completedSets}/30 세트`;
}
window.renderArtifacts = renderArtifacts;

// --- [ 6. 24레벨 전설의 치아 봉인 해제 로직 ] ---
window.openLockedToothModal = function(slotIdx) {
    window.lockedToothSlotIdx = slotIdx;
    const m = document.getElementById('locked-tooth-modal');
    if(m) {
        m.style.display = 'flex';
        renderUnlockRequirements();
    }
};

window.closeLockedToothModal = function() {
    const m = document.getElementById('locked-tooth-modal');
    if(m) m.style.display = 'none';
};

function renderUnlockRequirements() {
    const reqDiv = document.getElementById('unlock-requirements');
    const btn = document.getElementById('btn-unlock-tooth');
    if(!reqDiv || !btn || typeof TOOTH_DATA === 'undefined') return;

    const req = TOOTH_DATA.AWAKEN_REQ;
    if(window.bossMarks === undefined) window.bossMarks = 0;
    
    const goldOk = window.gold >= req.gold;
    const diaOk = window.dia >= req.dia;
    const marksOk = window.bossMarks >= req.bossMarks;
    
    reqDiv.innerHTML = `
        <div style="margin-bottom:5px; color:${goldOk ? '#2ecc71' : '#e74c3c'};">
            💰 골드: ${safeFNum(window.gold)} / ${safeFNum(req.gold)}
        </div>
        <div style="margin-bottom:5px; color:${diaOk ? '#2ecc71' : '#e74c3c'};">
            ♦️ 다이아: ${window.fNum ? window.fNum(window.dia) : window.dia} / ${window.fNum ? window.fNum(req.dia) : req.dia}
        </div>
        <div style="color:${marksOk ? '#2ecc71' : '#e74c3c'};">
            🏅 토벌 징표: ${window.bossMarks} / ${req.bossMarks}
        </div>
    `;

    if (goldOk && diaOk && marksOk) {
        btn.disabled = false;
        btn.style.filter = "none";
        btn.innerText = "봉인 해제 시도!";
    } else {
        btn.disabled = true;
        btn.style.filter = "grayscale(1)";
        btn.innerText = "재화 부족";
    }
}

window.attemptUnlockTooth = function() {
    const req = TOOTH_DATA.AWAKEN_REQ;
    if (window.gold >= req.gold && window.dia >= req.dia && window.bossMarks >= req.bossMarks) {
        if(confirm("모든 재화를 소모하여 진정한 전설의 치아를 해방하시겠습니까?")) {
            window.gold -= req.gold;
            window.dia -= req.dia;
            window.bossMarks -= req.bossMarks;
            
            window.isToothAwakened = true;
            closeLockedToothModal();
            
            // 해방 축하 이펙트!
            try { if(typeof playSfx === 'function') playSfx('awaken'); } catch(e){}
            const body = document.body;
            const flash = document.createElement('div');
            flash.style.position = 'fixed';
            flash.style.top = '0'; flash.style.left = '0';
            flash.style.width = '100%'; flash.style.height = '100%';
            flash.style.background = 'white';
            flash.style.zIndex = '40000';
            flash.style.animation = 'splashFade 2s ease-out forwards';
            body.appendChild(flash);
            setTimeout(() => flash.remove(), 2000);
            
            if(window.renderInventory) window.renderInventory();
            if(window.updateUI) window.updateUI();
            saveGame();
            
            alert("👑 세계관 최강의 무기, [진(眞) 절대자의 치아]가 봉인을 깨고 강림했습니다! 👑\n공격력이 상상을 초월합니다!");
        }
    }
};

// --- [ 기타 기능 (랭킹, 설정 등) ] ---
window.generateRankings = function() {
    const list = document.getElementById('ranking-list');
    if(!list || typeof TOOTH_DATA === 'undefined') return;
    
    if (!window.fakeUsers || window.fakeUsers.length === 0) {
        window.fakeUsers = [];
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        for(let i=0; i<500; i++) {
            let hash = '';
            for(let j=0; j<4; j++) hash += chars.charAt(Math.floor(Math.random()*chars.length));
            let fakePower = Math.floor(Math.pow(Math.random(), 3) * 8000000) + 1000;
            let fakeD = Math.floor(Math.random() * 20) + 1;
            window.fakeUsers.push({ name: `User-${hash}`, d: fakeD, p: fakePower, isMe: false });
        }
    }

    let myPower = safeGetAtk(window.highestToothLevel);
    if (TOOTH_DATA.mercenaries[window.mercenaryIdx]) myPower *= TOOTH_DATA.mercenaries[window.mercenaryIdx].atkMul;
    
    let ranks = [...window.fakeUsers]; 
    let myData = { name: window.nickname || "나", d: window.unlockedDungeon, p: myPower, isMe: true };
    ranks.push(myData);
    
    ranks.sort((a, b) => b.p - a.p);
    
    let html = ''; 
    let myRankIdx = ranks.findIndex(r => r.isMe);
    let myRank = myRankIdx + 1;

    ranks.forEach((r, idx) => {
        let isTop10 = idx < 10;
        let isNearMe = Math.abs(idx - myRankIdx) <= 5;

        if (idx === 10 && myRankIdx > 15) {
            html += `<div style="text-align:center; color:#555; font-size:14px; padding:5px 0;">. . . . . .</div>`;
        }

        if (isTop10 || isNearMe) {
            let rankColor = r.isMe ? 'color:var(--gold); font-weight:bold; background:rgba(241, 196, 15, 0.1);' : 'color:#ccc;';
            if (idx === 0) rankColor += 'color:#ff4757; text-shadow:0 0 5px red; font-size:14px;'; 
            
            html += `<div style="display:flex; justify-content:space-between; padding:8px 5px; border-bottom:1px solid #333; ${rankColor}">
                <span style="width:15%; text-align:center;">${idx+1}</span><span style="flex:1; text-align:center;">${r.name}</span>
                <span style="width:20%; text-align:center;">Lv.${r.d}</span><span style="width:25%; text-align:right;">${safeFNum(r.p)}</span>
            </div>`;
        }
    });
    
    list.innerHTML = html;
    const rankDisp = document.getElementById('my-rank-display');
    if(rankDisp) rankDisp.innerText = `내 순위: ${myRank}위 / ${ranks.length}명 (전투력: ${safeFNum(myPower)})`;
};

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
    if(m) { 
        m.style.display = 'flex'; 
        const nickDisp = document.getElementById('current-nickname-display');
        if(nickDisp) nickDisp.innerText = window.nickname || "설정안됨";
    }
};
window.closeSettings = function() {
    const m = document.getElementById('settings-modal');
    if(m) m.style.display = 'none';
};

window.openNicknameChange = function() {
    const m = document.getElementById('nickname-modal');
    if(m) {
        m.style.display = 'flex';
        const input = document.getElementById('nickname-input');
        if(input) input.value = window.nickname || "";
    }
};

window.exportSaveCode = function() {
    const saveData = localStorage.getItem('toothSaveV700') || localStorage.getItem('toothSaveV695');
    if (saveData) {
        try {
            const encoded = btoa(encodeURIComponent(saveData));
            const textArea = document.getElementById('save-export-area');
            if (textArea) {
                textArea.style.display = 'block';
                textArea.value = encoded;
                textArea.select();
                alert("저장 코드가 발급되었습니다. 텍스트를 전체 복사하여 안전한 곳에 보관하세요.");
            }
        } catch (e) { alert("코드 생성 중 오류가 발생했습니다."); }
    } else {
        alert("저장된 데이터가 없습니다. 먼저 수동 저장을 해주세요.");
    }
};

window.promptCoupon = function() {
    setTimeout(() => {
        const code = prompt("쿠폰 코드를 입력하세요:");
        if (code && typeof window.checkCoupon === 'function') {
            window.checkCoupon(code);
        }
    }, 10);
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
        localStorage.clear(); 
        location.reload();
    }
};

window.openGuide = function() {
    const m = document.getElementById('guide-modal');
    if(m) {
        m.style.display = 'flex';
        document.getElementById('guide-scroll-content').innerHTML = `
            <div style="padding-top:10px;">
                <h3 style="color:var(--gold);">🦷 치아 연대기 레트로 가이드</h3>
                <p><strong>1. 채굴과 합성 (24단계)</strong><br>치아를 캐고 합쳐서 다음 단계로 나아가세요. 23레벨 2개를 합치면 전설의 치아가 탄생합니다!</p>
                <p><strong>2. 유물 파밍 시스템 (NEW)</strong><br>던전 보스를 잡고 '유물'을 2개 모을 때마다 여러분의 <strong>기본 채굴 레벨이 +1 영구 상승</strong>합니다. 노가다는 필수!</p>
                <p><strong>3. 보스 토벌전 & 봉인 해제</strong><br>토벌전에서 살아남아 '보스 징표'를 획득하세요. 24레벨 전설 무기의 봉인을 풀 수 있는 핵심 재료입니다.</p>
            </div>
        `;
    }
};
window.closeGuide = function() {
    const m = document.getElementById('guide-modal');
    if(m) m.style.display = 'none';
};

window.skipHellIntro = function() {
    const vid = document.getElementById('hell-video');
    if(vid) vid.pause();
    document.getElementById('hell-video-layer').style.display = 'none';
    if(window.currentView === 'war') window.switchView('war');
};

window.skipAwakenIntro = function() {
    const vid = document.getElementById('awaken-video');
    if(vid) vid.pause();
    document.getElementById('awaken-video-layer').style.display = 'none';
    
    alert("🔥 전설의 치아가 탄생했지만 강력한 봉인이 걸려있습니다. 봉인을 해제하세요!");
    if(window.renderInventory) window.renderInventory();
};
