// Version: 7.5.1 - UI Core Controllers (View Switching, Rendering Dynamic Lists)

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
        document.getElementById('mine-view').style.display = 'block';
        document.getElementById('inventory-section').style.display = 'flex';
        document.getElementById('tab-mine').classList.add('active');
        if(typeof window.renderInventory === 'function') window.renderInventory();
    } else if (viewName === 'refine') {
        document.getElementById('refine-view').style.display = 'flex';
        document.getElementById('tab-refine').classList.add('active');
        if(typeof window.renderRefineView === 'function') window.renderRefineView();
    } else if (viewName === 'war') {
        document.getElementById('war-view').style.display = 'flex';
        document.getElementById('tab-war').classList.add('active');
        
        if (window.unlockedDungeon > 20) {
            document.getElementById('d-tab-hell').style.display = 'inline-block';
            document.getElementById('d-tab-hellboss').style.display = 'inline-block';
        }
        
        if(typeof window.renderMercenaryCamp === 'function') window.renderMercenaryCamp();
        window.switchDungeonTab(window.currentDungeonTab); 
    }
    
    try { if(typeof window.playSfx === 'function') window.playSfx('hit'); } catch(e){}
};

window.switchDungeonTab = function(tabName) {
    window.currentDungeonTab = tabName;
    
    document.querySelectorAll('.war-tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeTab = document.getElementById('d-tab-' + tabName);
    if(activeTab) activeTab.classList.add('active');
    
    const bossInfo = document.getElementById('boss-rush-info');
    if(bossInfo) {
        if(tabName === 'boss' || tabName === 'hellboss') {
            bossInfo.style.display = 'block';
        } else {
            bossInfo.style.display = 'none';
        }
    }
    
    if(typeof window.renderDungeonList === 'function') window.renderDungeonList();
};

// --- [ 2. 용병 캠프 관리 (고급 스탯 표기 추가) ] ---
window.renderMercenaryCamp = function() { 
    const display = document.getElementById('current-mercenary-display');
    if(!display || typeof window.TOOTH_DATA === 'undefined') return;

    const curId = window.mercenaryIdx;
    const merc = window.TOOTH_DATA.mercenaries[curId];
    if(!merc) return;

    let bonusText = "";
    if (window.highestToothLevel >= 16) {
        bonusText = `<div style="color:#2ecc71; font-size:10px; font-weight:bold; margin-top:3px;">✨ 16치아 보너스: 공격력 x2 적용 중!</div>`;
    }

    let trainAtk = (window.trainingLevels && window.trainingLevels.atk)? window.trainingLevels.atk * 10 : 0;
    let trainHp = (window.trainingLevels && window.trainingLevels.hp)? window.trainingLevels.hp * 5 : 0;
    let trainSpd = (window.trainingLevels && window.trainingLevels.spd)? window.trainingLevels.spd * 10 : 0;

    let atkStr = trainAtk > 0? `<span style="color:#2ecc71; font-weight:bold;">(+${trainAtk}%)</span>` : '';
    let hpStr = trainHp > 0? `<span style="color:#2ecc71; font-weight:bold;">(+${trainHp}%)</span>` : '';
    let spdStr = trainSpd > 0? `<span style="color:#2ecc71; font-weight:bold;">(+${trainSpd}%)</span>` : '';

    let critLv = (window.trainingLevels && window.trainingLevels.crit)? window.trainingLevels.crit : 0;
    let splashDmgLv = (window.trainingLevels && window.trainingLevels.splashDmg)? window.trainingLevels.splashDmg : 0;
    let splashRangeLv = (window.trainingLevels && window.trainingLevels.splashRange)? window.trainingLevels.splashRange : 0;

    let critChance = 5 + (critLv * 2); 
    let critMul = 2.0 + (critLv * 0.2);
    let splashRatio = 20 + (splashDmgLv * 5); 
    let splashRange = 50 + (splashRangeLv * 10); 

    let advStatsHtml = "";
    if (window.highestToothLevel >= 7 || critLv > 0 || splashDmgLv > 0) {
        advStatsHtml = `<div style="font-size:10px; color:#f1c40f; margin-top:3px; font-weight:bold;">
            ⚡치명타: ${critChance}% (x${critMul.toFixed(1)}) | 💥광역: ${splashRatio}% (${splashRange}px)
        </div>`;
    }

    display.innerHTML = `
        <div style="font-size:40px; background:#1a1a2e; width:60px; height:60px; display:flex; align-items:center; justify-content:center; border:2px solid #555; box-shadow: 2px 2px 0 #000;">${merc.icon}</div>
        <div style="flex:1;">
            <div style="font-size:16px; font-weight:bold; color:white;">${merc.name} <span style="font-size:12px; color:#aaa; font-weight:normal;">(Lv.${curId})</span></div>
            <div style="font-size:11px; color:#ccc; margin-top:2px;">
                공격 x<span style="color:var(--gold);">${merc.atkMul}</span> ${atkStr} | 
                체력 <span style="color:#ff4757;">${window.fNum? window.fNum(merc.baseHp) : merc.baseHp}</span> ${hpStr} | 
                이동속도 <span style="color:#3498db;">${merc.spd.toFixed(1)}</span> ${spdStr}
            </div>
            ${advStatsHtml}
            ${bonusText}
        </div>
    `;
};

// --- [ 3. 던전 리스트 렌더링 ] ---
window.renderDungeonList = function() { 
    const list = document.getElementById('dungeon-list'); 
    if(!list || typeof window.TOOTH_DATA === 'undefined') return;
    list.innerHTML = ''; 
    
    const tab = window.currentDungeonTab || 'normal';
    const isHell = (tab === 'hell' || tab === 'hellboss');
    const isBoss = (tab === 'boss' || tab === 'hellboss');
    const currentUnlocked = isHell? window.unlockedHellDungeon : window.unlockedDungeon;
    
    if (isBoss) {
        const rushNames = isHell? 
            ["HELL 1~5구간", "HELL 6~10구간", "HELL 11~15구간", "HELL 16~20구간"] :
            ["일반 1~5구간", "일반 6~10구간", "일반 11~15구간", "일반 16~20구간"];
        
        rushNames.forEach((name, i) => {
            const reqLevel = (i * 5) + 6; 
            const isUnlocked = currentUnlocked >= reqLevel;
            const div = document.createElement('div'); 
            div.className = `dungeon-card ${isUnlocked? 'unlocked' : 'locked'}`; 
            
            let goldFee = Math.floor(5000 * Math.pow(2.0, i * 5));
            let diaFee = 5 + ((i * 5) * 5);
            if (isHell) { goldFee *= 10; diaFee *= 5; }

            if (isUnlocked) {
                div.innerHTML = `<h4 style="margin:0;">🔥 ${name} 보스 토벌전</h4>
                <p style="margin:5px 0 0 0; font-size:12px; color:#ff8888;">입장료: <span style="color:var(--gold);">${window.fNum? window.fNum(goldFee) : goldFee}G</span>, ♦️${diaFee}</p>
                <p style="color:#f1c40f; font-size:11px; margin:5px 0 0 0;">보스 5연속 처치 시 엄청난 보상 & 보스 징표 획득!</p>`;
                div.onclick = () => { if(typeof window.startDungeon === 'function') window.startDungeon(i * 5); };
            } else {
                div.innerHTML = `<h4 style="margin:0;">🔒 잠김</h4><p style="margin:5px 0 0 0; font-size:12px; color:#888;">${isHell? 'HELL ' : '일반 '}던전 ${reqLevel-1}단계 클리어 시 열림</p>`;
            }
            list.appendChild(div);
        });
    } else {
        const dungeonData = isHell? window.TOOTH_DATA.hellDungeons : window.TOOTH_DATA.dungeons;
        dungeonData.forEach((name, idx) => { 
            const div = document.createElement('div'); 
            const isUnlocked = idx < currentUnlocked; 
            div.className = `dungeon-card ${isUnlocked? 'unlocked' : 'locked'}`; 
            
            let baseHp = Math.floor(100 * Math.pow(isHell? 2.5 : 2.2, idx));
            if (isHell) baseHp *= 50;
            const recAtk = (baseHp * 30) / 40;

            let artifactIdx = isHell? idx + 20 : idx;
            let artifactHtml = "";
            if (window.artifactCounts === undefined) window.artifactCounts = new Array(30).fill(0);
            if (window.TOOTH_DATA.artifacts[artifactIdx]) {
                const art = window.TOOTH_DATA.artifacts[artifactIdx];
                const myCount = window.artifactCounts[artifactIdx] || 0;
                artifactHtml = `<div style="margin-top:8px; padding-top:8px; border-top:1px dashed #555; font-size:11px; color:#ccc; display:flex; justify-content:space-between; align-items:center;">
                    <span>드랍 유물: ${art.icon} ${art.name}</span>
                    <span style="color:${myCount >= 1? '#2ecc71' : '#f39c12'};">보유: ${myCount}/1</span>
                </div>`;
            }

            if (isUnlocked) { 
                div.innerHTML = `<h4 style="margin:0;">⚔️ Lv.${idx+1} ${name}</h4>
                <p style="margin:5px 0 0 0; font-size:12px; color:#aaa;">권장 공격력: ${window.fNum? window.fNum(recAtk) : recAtk}+</p>
                ${artifactHtml}`;
                div.onclick = () => { if(typeof window.startDungeon === 'function') window.startDungeon(idx); };
            } else { 
                div.innerHTML = `<h4 style="margin:0;">🔒 잠김</h4><p style="margin:5px 0 0 0; font-size:12px; color:#888;">이전 던전 클리어 시 열림</p>`; 
            } 
            list.appendChild(div); 
        }); 
    }
};

// --- [ 4. 도감 및 유물 도감 렌더링 ] ---
window.renderCodex = function() {
    const grid = document.getElementById('codex-grid');
    if(!grid || typeof window.TOOTH_DATA === 'undefined') return;
    grid.innerHTML = '';
    
    let unlockedCount = 0;
    for(let i = 1; i <= 24; i++) {
        const item = document.createElement('div');
        item.className = 'codex-item';
        
        const isUnlocked = i <= window.highestToothLevel;
        if(isUnlocked) unlockedCount++;
        else item.classList.add('locked');
        
        const badge = `<div class="codex-badge">${i}</div>`;
        const iconHtml = isUnlocked? (typeof window.getToothIcon === 'function'? window.getToothIcon(i) : "🦷") : `<div class="codex-icon" style="color:#555;">?</div>`;
        const nameText = isUnlocked? (typeof window.getToothName === 'function'? window.getToothName(i) : `Lv.${i}`) : "미발견";
        
        let abilityText = "";
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
            ${abilityText? `<div class="codex-ability">${abilityText}</div>` : ""}
        `;
        grid.appendChild(item);
    }
    
    const progress = document.getElementById('codex-progress');
    if(progress) progress.innerText = `수집률: ${unlockedCount}/24`;
};

window.renderArtifacts = function() {
    const grid = document.getElementById('artifact-grid');
    if(!grid || typeof window.TOOTH_DATA === 'undefined') return;
    grid.innerHTML = '';
    
    if (window.artifactCounts === undefined) window.artifactCounts = new Array(30).fill(0);
    
    let completedSets = 0;
    
    for(let i = 0; i < 30; i++) {
        const art = window.TOOTH_DATA.artifacts[i];
        if(!art) continue;
        
        const count = window.artifactCounts[i];
        const isCompleted = count >= 1; 
        if(isCompleted) completedSets++;
        
        const item = document.createElement('div');
        item.className = 'artifact-item';
        if(count === 0) item.classList.add('locked');
        
        item.innerHTML = `
            <div class="artifact-count" style="background:${isCompleted? '#2ecc71' : '#e74c3c'}">${count}/1</div>
            <div class="artifact-icon">${art.icon}</div>
            <div class="artifact-name">${art.name}</div>
            ${isCompleted? `<div style="font-size:8px; color:var(--gold); margin-top:3px;">완성</div>` : `<div style="font-size:8px; color:#555; margin-top:3px;">미완성</div>`}
        `;
        grid.appendChild(item);
    }
    
    let extraMiningLv = Math.floor(completedSets / 3); 
    const progress = document.getElementById('artifact-progress');
    if(progress) progress.innerText = `완성: ${completedSets}/30 (채굴 Lv +${extraMiningLv})`;
};

// --- [ 5. 듀얼 다이얼 버튼 시각화(회색/컬러) 완벽 연동 ] ---
window.updateToggleButtons = function() {
    const mineBtn = document.getElementById('auto-mine-btn');
    const mineDial = document.getElementById('mine-dial');
    if(mineBtn) {
        mineBtn.innerText = window.isAutoMineOn? "자동 ON" : "자동 OFF"; 
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
        mergeBtn.innerText = window.isAutoMergeOn? "자동 ON" : "자동 OFF"; 
        if(!window.isAutoMergeOn) {
            mergeBtn.classList.add('off');
            if(mergeDial) mergeDial.classList.add('dial-off');
        } else {
            mergeBtn.classList.remove('off');
            if(mergeDial) mergeDial.classList.remove('dial-off');
        }
    }
};
