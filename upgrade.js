// Version: 7.0.0 - Upgrade & Training & Refine (Complete & Retro Style)

// --- [ 1. Upgrade Lab (상점) ] ---
window.openShop = function() {
    const m = document.getElementById('shop-modal');
    if(m) { m.style.display = 'flex'; window.renderShop(); }
};
window.closeShop = function() {
    const m = document.getElementById('shop-modal');
    if(m) m.style.display = 'none';
};

window.renderShop = function() {
    const content = document.getElementById('shop-content');
    if(!content || typeof TOOTH_DATA === 'undefined') return;

    let html = `
        <div class="sticky-header">
            <h2 style="color:var(--gold); margin:0;">💰 Upgrade Lab</h2>
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:12px; color:#fff;">보유 💰 <span style="color:var(--gold); font-weight:bold;">${typeof safeFNum === 'function' ? safeFNum(window.gold) : window.gold}</span></span>
                <button onclick="closeShop()" style="background:none; border:none; color:#e74c3c; font-size:24px; font-weight:bold; cursor:pointer; padding:0;">✕</button>
            </div>
        </div>
        <div class="modal-content-area shop-grid">
    `;

    // 1. 곡괭이 업그레이드
    let nextPickaxe = window.pickaxeIdx + 1;
    if (nextPickaxe < TOOTH_DATA.pickaxes.length) {
        let pData = TOOTH_DATA.pickaxes[nextPickaxe];
        html += `
            <div class="shop-item">
                <div class="shop-info">
                    <span>${pData.icon} ${pData.name} 구매</span>
                    <span>${typeof safeFNum === 'function' ? safeFNum(pData.cost) : pData.cost}G</span>
                </div>
                <div class="shop-desc">채굴 시 +1레벨 추가 획득 확률: ${(pData.luck * 100).toFixed(0)}%</div>
                <button onclick="buyPickaxe(${nextPickaxe}, ${pData.cost})" class="btn-gold" style="width:100%; margin-top:5px;">구매하기</button>
            </div>
        `;
    } else {
        html += `<div class="shop-item"><div class="shop-info"><span>${TOOTH_DATA.pickaxes[window.pickaxeIdx].icon} 최고 등급 곡괭이 장착중</span></div><button class="btn-max" style="width:100%; margin-top:5px;" disabled>MAX</button></div>`;
    }

    // 2. 자동 채굴 속도
    let mineCost = Math.floor(100 * Math.pow(1.5, window.autoMineLevel - 1));
    let isMineMax = window.autoMineLevel >= 45; 
    html += `
        <div class="shop-item">
            <div class="shop-info">
                <span>⛏️ 자동 채굴 속도 (Lv.${window.autoMineLevel})</span>
                <span>${isMineMax ? 'MAX' : (typeof safeFNum === 'function' ? safeFNum(mineCost) : mineCost) + 'G'}</span>
            </div>
            <div class="shop-desc">현재: ${(Math.max(1, 10 - ((window.autoMineLevel - 1) * 0.2))).toFixed(1)}초마다 채굴</div>
            <button onclick="buyAutoMine(${mineCost})" class="${isMineMax ? 'btn-max' : 'btn-gold'}" style="width:100%; margin-top:5px;" ${isMineMax ? 'disabled' : ''}>업그레이드</button>
        </div>
    `;

    // 3. 자동 합성 속도
    let mergeCost = Math.floor(500 * Math.pow(1.6, window.autoMergeSpeedLevel - 1));
    let isMergeMax = window.autoMergeSpeedLevel >= 56; 
    let currentMergeTime = Math.max(2, 30 - ((window.autoMergeSpeedLevel - 1) * 0.5));
    html += `
        <div class="shop-item">
            <div class="shop-info">
                <span>⚡ 자동 합성 속도 (Lv.${window.autoMergeSpeedLevel})</span>
                <span>${isMergeMax ? 'MAX' : (typeof safeFNum === 'function' ? safeFNum(mergeCost) : mergeCost) + 'G'}</span>
            </div>
            <div class="shop-desc">현재: ${currentMergeTime.toFixed(1)}초마다 1회 합성</div>
            <button onclick="buyAutoMerge(${mergeCost})" class="${isMergeMax ? 'btn-max' : 'btn-gold'}" style="width:100%; margin-top:5px;" ${isMergeMax ? 'disabled' : ''}>업그레이드</button>
        </div>
    `;

    // 4. 합성 대성공 확률
    let greatCost = Math.floor(1000 * Math.pow(1.8, window.greatChanceLevel));
    let isGreatMax = window.greatChanceLevel >= 25; 
    html += `
        <div class="shop-item">
            <div class="shop-info">
                <span>✨ 합성 대성공 확률 (Lv.${window.greatChanceLevel})</span>
                <span>${isGreatMax ? 'MAX' : (typeof safeFNum === 'function' ? safeFNum(greatCost) : greatCost) + 'G'}</span>
            </div>
            <div class="shop-desc">현재 확률: ${window.greatChanceLevel * 2}% (성공 시 통쾌한 +2업!)</div>
            <button onclick="buyGreatChance(${greatCost})" class="${isGreatMax ? 'btn-max' : 'btn-gold'}" style="width:100%; margin-top:5px;" ${isGreatMax ? 'disabled' : ''}>업그레이드</button>
        </div>
    `;

    // 5. 인벤토리 확장
    let slotCost = TOOTH_DATA.invExpansion[(window.maxSlots - 24) / 8];
    let isSlotMax = window.maxSlots >= 56;
    if (!isSlotMax) {
        html += `
            <div class="shop-item">
                <div class="shop-info">
                    <span>🎒 인벤토리 확장 (${window.maxSlots} ➔ ${window.maxSlots + 8}칸)</span>
                    <span>${typeof safeFNum === 'function' ? safeFNum(slotCost) : slotCost}G</span>
                </div>
                <div class="shop-desc">더 많은 무기를 전장에 배치할 수 있습니다.</div>
                <button onclick="buyInventorySlot(${slotCost})" class="btn-gold" style="width:100%; margin-top:5px;">확장하기</button>
            </div>
        `;
    }

    html += `</div>`;
    content.innerHTML = html;
};

// 상점 구매 로직
window.buyPickaxe = function(idx, cost) {
    if(window.gold >= cost) { window.gold -= cost; window.pickaxeIdx = idx; try{if(typeof playSfx === 'function') playSfx('upgrade');}catch(e){} window.renderShop(); if(window.updatePickaxeVisual) window.updatePickaxeVisual(); if(window.updateUI) window.updateUI(); if(window.saveGame) window.saveGame(); } else alert("골드가 부족합니다!");
};
window.buyAutoMine = function(cost) {
    if(window.gold >= cost) { window.gold -= cost; window.autoMineLevel++; try{if(typeof playSfx === 'function') playSfx('upgrade');}catch(e){} window.renderShop(); if(window.updateUI) window.updateUI(); if(window.saveGame) window.saveGame(); } else alert("골드가 부족합니다!");
};
window.buyAutoMerge = function(cost) {
    if(window.gold >= cost) { window.gold -= cost; window.autoMergeSpeedLevel++; try{if(typeof playSfx === 'function') playSfx('upgrade');}catch(e){} window.renderShop(); if(window.updateUI) window.updateUI(); if(window.saveGame) window.saveGame(); } else alert("골드가 부족합니다!");
};
window.buyGreatChance = function(cost) {
    if(window.gold >= cost) { window.gold -= cost; window.greatChanceLevel++; try{if(typeof playSfx === 'function') playSfx('upgrade');}catch(e){} window.renderShop(); if(window.updateUI) window.updateUI(); if(window.saveGame) window.saveGame(); } else alert("골드가 부족합니다!");
};
window.buyInventorySlot = function(cost) {
    if(window.gold >= cost) { window.gold -= cost; window.maxSlots += 8; try{if(typeof playSfx === 'function') playSfx('upgrade');}catch(e){} window.renderShop(); if(window.renderInventory) window.renderInventory(); if(window.updateUI) window.updateUI(); if(window.saveGame) window.saveGame(); } else alert("골드가 부족합니다!");
};


// --- [ 2. 용병 훈련장 (다이아 소모) ] ---
window.openTrainingCamp = function() {
    const m = document.getElementById('training-modal');
    if(m) { m.style.display = 'flex'; window.renderTrainingCamp(); }
};
window.closeTrainingCamp = function() {
    const m = document.getElementById('training-modal');
    if(m) m.style.display = 'none';
};

window.renderTrainingCamp = function() {
    const list = document.getElementById('training-list');
    const diaDisp = document.getElementById('training-dia-display');
    if(!list || !diaDisp) return;

    diaDisp.innerText = window.fNum ? window.fNum(window.dia) : window.dia;
    list.innerHTML = '';

    const trainings = [
        { id: 'hp', name: "체력 단련", icon: "❤️", desc: "용병 최대 체력 +5%", baseCost: 10, costMul: 1.5, max: 100, currentEffect: `체력 +${(window.trainingLevels.hp || 0) * 5}%` },
        { id: 'atk', name: "무기 연마", icon: "⚔️", desc: "기본 공격력 +10%", baseCost: 15, costMul: 1.6, max: 100, currentEffect: `공격력 +${(window.trainingLevels.atk || 0) * 10}%` },
        { id: 'spd', name: "신속 훈련", icon: "💨", desc: "이동 속도 +10%", baseCost: 20, costMul: 1.7, max: 50, currentEffect: `이동 속도 +${(window.trainingLevels.spd || 0) * 10}%` },
        { id: 'crit', name: "급소 타격", icon: "⚡", desc: "치명타 확률 +2%, 데미지 +20%", baseCost: 50, costMul: 2.0, max: 20, reqLv: 10, currentEffect: `치명타 확률 +${(window.trainingLevels.crit || 0) * 2}%` },
        { id: 'splashDmg', name: "폭발 탄두", icon: "💥", desc: "광역 데미지 비율 +5%", baseCost: 100, costMul: 2.2, max: 12, reqLv: 7, currentEffect: `광역 데미지 +${(window.trainingLevels.splashDmg || 0) * 5}%` },
        { id: 'splashRange', name: "화약 증량", icon: "🧨", desc: "광역 폭발 범위 증가", baseCost: 150, costMul: 2.5, max: 10, reqLv: 7, currentEffect: `폭발 범위 +${(window.trainingLevels.splashRange || 0) * 10}px` }
    ];

    trainings.forEach(t => {
        const div = document.createElement('div');
        div.style.cssText = "background:#222; border:2px solid #555; padding:10px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; box-shadow:2px 2px 0 #000;";

        let lv = window.trainingLevels[t.id] || 0;
        let isMax = lv >= t.max;
        let cost = Math.floor(t.baseCost * Math.pow(t.costMul, lv));
        let locked = t.reqLv && window.highestToothLevel < t.reqLv;

        // 🌟 현재 적용된 스탯 명확히 표시 (레트로 감성 색상)
        let effectText = `<div style="color:var(--gold); font-size:10px; margin-top:5px; font-weight:bold;">[현재 적용: ${t.currentEffect}]</div>`;

        if (locked) {
            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px; opacity:0.5;">
                    <div style="font-size:24px;">🔒</div>
                    <div>
                        <div style="font-size:14px; color:#aaa; font-weight:bold;">미해금 훈련</div>
                        <div style="font-size:10px; color:#888; margin-top:2px;">치아 Lv.${t.reqLv} 달성 시 개방</div>
                    </div>
                </div>
            `;
        } else {
            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px; flex:1;">
                    <div style="font-size:28px;">${t.icon}</div>
                    <div>
                        <div style="font-size:14px; font-weight:bold; color:white;">${t.name} <span style="font-size:11px; color:#aaa;">(Lv.${lv}${isMax ? ' MAX' : ''})</span></div>
                        <div style="font-size:11px; color:#ccc; margin-top:2px;">${t.desc}</div>
                        ${effectText}
                    </div>
                </div>
                ${isMax ? `<button class="btn-max" disabled>MAX</button>` : `<button onclick="window.buyTraining('${t.id}', ${cost})" class="btn-sm" style="background:#ff4757; color:white; border-color:#800000; box-shadow:2px 2px 0 #000; white-space:nowrap;">♦️ ${window.fNum ? window.fNum(cost) : cost}</button>`}
            `;
        }
        list.appendChild(div);
    });
};

window.buyTraining = function(id, cost) {
    if (window.dia >= cost) {
        window.dia -= cost;
        if (!window.trainingLevels[id]) window.trainingLevels[id] = 0;
        window.trainingLevels[id]++;
        
        try { if(typeof playSfx === 'function') playSfx('upgrade'); } catch(e){}
        window.renderTrainingCamp();
        
        if(window.updateUI) window.updateUI();
        if(window.renderMercenaryCamp) window.renderMercenaryCamp(); 
        if(window.saveGame) window.saveGame();
    } else {
        alert("다이아가 부족합니다!");
    }
};


// --- [ 3. Top 8 무기 제련 (Refine) ] --- (🌟 누락되었던 핵심 코드 복구 완료!)
window.renderRefineView = function() {
    const grid = document.getElementById('refine-grid');
    if(!grid) return;
    grid.innerHTML = '';

    for(let i=0; i<8; i++) {
        const upg = window.slotUpgrades[i];
        const costAtk = Math.floor(100 * Math.pow(1.5, upg.atk));
        
        let toothInfo = "없음";
        if (window.inventory[i] > 0) {
            let icon = typeof getToothIcon === 'function' ? getToothIcon(window.inventory[i]) : "🦷";
            toothInfo = `${icon} Lv.${window.inventory[i]}`;
        }

        const card = document.createElement('div');
        card.className = 'refine-card';
        card.innerHTML = `
            <div class="refine-header">슬롯 ${i+1} 제련</div>
            <div style="font-size:11px; color:#ccc; text-align:center; margin-bottom:5px;">현재 장착: ${toothInfo}</div>
            <button onclick="window.upgradeSlot(${i}, 'atk', ${costAtk})" class="refine-btn">
                <span>⚔️ 공격력 증폭 Lv.${upg.atk}</span>
                <span class="refine-val">+${upg.atk * 10}%</span>
                <span style="color:var(--gold); margin-top:3px;">${typeof safeFNum === 'function' ? safeFNum(costAtk) : costAtk}G</span>
            </button>
        `;
        grid.appendChild(card);
    }

    // 글로벌 제련 (사거리 / 쿨타임)
    const rngCost = Math.floor(500 * Math.pow(1.8, window.globalUpgrades.rng));
    const cdCost = Math.floor(1000 * Math.pow(2.0, window.globalUpgrades.cd));

    const globalCard = document.createElement('div');
    globalCard.className = 'refine-card';
    globalCard.style.gridColumn = '1 / -1';
    globalCard.style.border = '2px solid #3498db';
    globalCard.innerHTML = `
        <div class="refine-header" style="color:#3498db;">🌐 공통 시스템 제련</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <button onclick="window.upgradeGlobalRng(${rngCost})" class="refine-btn" style="border-color:#3498db;">
                <span>🎯 탐지 사거리 Lv.${window.globalUpgrades.rng}</span>
                <span class="refine-val">+${window.globalUpgrades.rng * 20}px</span>
                <span style="color:var(--gold); margin-top:3px;">${typeof safeFNum === 'function' ? safeFNum(rngCost) : rngCost}G</span>
            </button>
            <button onclick="window.upgradeGlobalCd(${cdCost})" class="refine-btn" style="border-color:#3498db;">
                <span>⚡ 연사 속도 Lv.${window.globalUpgrades.cd}</span>
                <span class="refine-val">대기시간 -${Math.min(90, window.globalUpgrades.cd * 2)}%</span>
                <span style="color:var(--gold); margin-top:3px;">${typeof safeFNum === 'function' ? safeFNum(cdCost) : cdCost}G</span>
            </button>
        </div>
    `;
    grid.appendChild(globalCard);
};

window.upgradeSlot = function(idx, type, cost) {
    if(window.gold >= cost) {
        window.gold -= cost;
        window.slotUpgrades[idx][type]++;
        try { if(typeof playSfx === 'function') playSfx('upgrade'); } catch(e){}
        window.renderRefineView();
        if(window.updateUI) window.updateUI();
        if(window.saveGame) window.saveGame();
    } else {
        alert("골드가 부족합니다!");
    }
};

window.upgradeGlobalRng = function(cost) {
    if(window.gold >= cost) {
        window.gold -= cost;
        window.globalUpgrades.rng++;
        try { if(typeof playSfx === 'function') playSfx('upgrade'); } catch(e){}
        window.renderRefineView();
        if(window.updateUI) window.updateUI();
        if(window.saveGame) window.saveGame();
    } else alert("골드가 부족합니다!");
};

window.upgradeGlobalCd = function(cost) {
    if(window.globalUpgrades.cd >= 45) { alert("최대 레벨입니다!"); return; }
    if(window.gold >= cost) {
        window.gold -= cost;
        window.globalUpgrades.cd++;
        try { if(typeof playSfx === 'function') playSfx('upgrade'); } catch(e){}
        window.renderRefineView();
        if(window.updateUI) window.updateUI();
        if(window.saveGame) window.saveGame();
    } else alert("골드가 부족합니다!");
};
