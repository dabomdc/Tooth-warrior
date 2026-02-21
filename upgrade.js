// Version: 6.7.2 - Upgrade Systems (Shop, Refine, Training - Diamond Icon Fixed)

const MAX_AUTO_MINE_LV = 40;
const MAX_AUTO_MERGE_LV = 15;
const MAX_GREAT_LV = 25; 
const MAX_GLOBAL_CD = 45; 
const MAX_GLOBAL_RNG = 50; 

// --- [ 1. Upgrade Lab (골드 상점) ] ---
function renderShopItems() {
    const content = document.getElementById('shop-content');
    if(!content) return;
    
    let expansionCount = (window.maxSlots - 24) / 8;
    
    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #444; padding-bottom:10px; margin-bottom:10px;">
            <h2 style="color:var(--gold); margin:0; font-size:18px;">♦️ Upgrade Lab</h2>
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:12px; color:#fff;">보유: <span style="color:var(--gold); font-weight:bold;">${window.fNum ? window.fNum(window.gold) : window.gold}G</span></span>
                <button onclick="closeShop()" style="background:none; border:none; color:#e74c3c; font-size:24px; font-weight:bold; cursor:pointer; padding:0;">✕</button>
            </div>
        </div>
        <div class="shop-grid">
    `;

    // 1. 곡괭이 업그레이드
    const pick = TOOTH_DATA.pickaxes[window.pickaxeIdx];
    const pickNext = TOOTH_DATA.pickaxes[window.pickaxeIdx + 1];
    if (pickNext) {
        html += `
        <div class="shop-item">
            <div class="shop-info"><span>⚒️ 곡괭이 업그레이드</span> <button onclick="buyItem('pick', ${pickNext.cost})" class="btn-gold">💰 ${window.fNum ? window.fNum(pickNext.cost) : pickNext.cost}</button></div>
            <div class="shop-desc">채굴 시 +1레벨 더 높은 치아를 발견할 확률을 높입니다.<br>
            <span style="color:#2ecc71;">Lv+1 확률: ${Math.round(pick.luck*100)}% ➔ ${Math.round(pickNext.luck*100)}%</span></div>
        </div>`;
    } else {
        html += `
        <div class="shop-item">
            <div class="shop-info"><span>⚒️ 곡괭이 업그레이드 (MAX)</span> <button class="btn-max">MAX</button></div>
            <div class="shop-desc">최고 등급의 곡괭이입니다.<br><span style="color:#2ecc71;">Lv+1 확률: ${Math.round(pick.luck*100)}% (최대)</span></div>
        </div>`;
    }

    // 2. 합성 대성공 확률업
    const curGreat = window.greatChanceLevel * 2; 
    if (window.greatChanceLevel < MAX_GREAT_LV) {
        const amuletCost = Math.floor(5000 * Math.pow(1.5, window.greatChanceLevel));
        html += `
        <div class="shop-item">
            <div class="shop-info"><span>🍀 합성 대성공 확률업 (Lv.${window.greatChanceLevel})</span> <button onclick="buyItem('amulet', ${amuletCost})" class="btn-gold">💰 ${window.fNum ? window.fNum(amuletCost) : amuletCost}</button></div>
            <div class="shop-desc">치아 합성 시 2단계가 상승하는 대성공 확률을 증가시킵니다.<br>
            <span style="color:#2ecc71;">대성공 확률: ${curGreat}% ➔ ${curGreat+2}%</span></div>
        </div>`;
    } else {
        html += `
        <div class="shop-item">
            <div class="shop-info"><span>🍀 합성 대성공 확률업 (MAX)</span> <button class="btn-max">MAX</button></div>
            <div class="shop-desc">대성공 확률을 한계까지 끌어올렸습니다.<br><span style="color:#2ecc71;">대성공 확률: ${curGreat}% (최대)</span></div>
        </div>`;
    }
    
    // 3. 자동채굴 속도업
    const curSpd = Math.max(1, 10 - ((window.autoMineLevel-1) * 0.2)).toFixed(1);
    if (window.autoMineLevel < MAX_AUTO_MINE_LV) {
        const autoCost = Math.floor(500 * Math.pow(1.4, window.autoMineLevel - 1));
        const nextSpd = Math.max(1, 10 - (window.autoMineLevel * 0.2)).toFixed(1);
        html += `
        <div class="shop-item">
            <div class="shop-info"><span>🤖 자동채굴 속도업 (Lv.${window.autoMineLevel})</span> <button onclick="buyItem('auto', ${autoCost})" class="btn-gold">💰 ${window.fNum ? window.fNum(autoCost) : autoCost}</button></div>
            <div class="shop-desc">방치형 오프라인 상태에서도 치아가 쌓이는 주기를 단축합니다.<br>
            <span style="color:#2ecc71;">채굴 속도: ${curSpd}초 ➔ ${nextSpd}초</span></div>
        </div>`;
    } else {
        html += `
        <div class="shop-item">
            <div class="shop-info"><span>🤖 자동채굴 속도업 (MAX)</span> <button class="btn-max">MAX</button></div>
            <div class="shop-desc">채굴 속도가 극한에 달했습니다.<br><span style="color:#2ecc71;">채굴 속도: ${curSpd}초 (최대 효율)</span></div>
        </div>`;
    }
    
    // 4. 자동합성 속도업
    const curMerge = Math.max(2, 30 - ((window.autoMergeSpeedLevel-1) * 0.5)).toFixed(1);
    if (window.autoMergeSpeedLevel < MAX_AUTO_MERGE_LV) {
        const mergeCost = Math.floor(1000 * Math.pow(1.6, window.autoMergeSpeedLevel - 1));
        const nextMerge = Math.max(2, 30 - (window.autoMergeSpeedLevel * 0.5)).toFixed(1);
        html += `
        <div class="shop-item">
            <div class="shop-info"><span>⚡ 자동합성 속도업 (Lv.${window.autoMergeSpeedLevel})</span> <button onclick="buyItem('merge', ${mergeCost})" class="btn-gold">💰 ${window.fNum ? window.fNum(mergeCost) : mergeCost}</button></div>
            <div class="shop-desc">인벤토리 내의 하위 치아들을 자동으로 병합해 주는 대기 시간을 줄입니다.<br>
            <span style="color:#2ecc71;">합성 주기: ${curMerge}초 ➔ ${nextMerge}초</span></div>
        </div>`;
    } else {
        html += `
        <div class="shop-item">
            <div class="shop-info"><span>⚡ 자동합성 속도업 (MAX)</span> <button class="btn-max">MAX</button></div>
            <div class="shop-desc">자동 합성 시스템이 완벽히 가동 중입니다.<br><span style="color:#2ecc71;">합성 주기: ${curMerge}초 (최대 효율)</span></div>
        </div>`;
    }
    
    // 5. 인벤토리 확장
    if (expansionCount < 4) {
        const expCost = TOOTH_DATA.invExpansion[expansionCount];
        html += `
        <div class="shop-item">
            <div class="shop-info"><span>🎒 인벤토리 확장 (${expansionCount+1}/4)</span> <button onclick="buyItem('exp', ${expCost})" class="btn-gold">💰 ${window.fNum ? window.fNum(expCost) : expCost}</button></div>
            <div class="shop-desc">치아를 보관할 수 있는 슬롯을 8칸 추가로 개방합니다. (최대 56칸)</div>
        </div>`;
    } else {
        html += `
        <div class="shop-item">
            <div class="shop-info"><span>🎒 인벤토리 확장 (MAX)</span> <button class="btn-max">MAX</button></div>
            <div class="shop-desc">모든 인벤토리 슬롯(56칸)이 개방되었습니다.</div>
        </div>`;
    }
    
    html += `</div>`;
    content.innerHTML = html;
}
window.renderShopItems = renderShopItems;

window.buyItem = function(type, cost) {
    if (window.gold >= cost) {
        window.gold -= cost;
        if(window.playSfx) window.playSfx('upgrade'); 
        if (type === 'pick') { window.pickaxeIdx++; if(window.cleanupInventory) window.cleanupInventory(); if(window.updatePickaxeVisual) window.updatePickaxeVisual(); } 
        else if (type === 'amulet') window.greatChanceLevel++;
        else if (type === 'auto') window.autoMineLevel++;
        else if (type === 'merge') window.autoMergeSpeedLevel++;
        else if (type === 'exp') window.maxSlots += 8;
        
        renderShopItems(); 
        if(window.renderInventory) window.renderInventory(); 
        if(window.updateUI) window.updateUI();
        if(window.saveGame) window.saveGame();
    } else { alert("골드가 부족합니다!"); }
};

window.openShop = function() { 
    const m = document.getElementById('shop-modal');
    if(m) { m.style.display = 'flex'; renderShopItems(); }
};
window.closeShop = function() { 
    const m = document.getElementById('shop-modal');
    if(m) m.style.display = 'none'; 
};

// --- [ 2. Top 8 제련소 (골드 + 다이아 소모) ] ---
window.renderRefineView = function() {
    const grid = document.getElementById('refine-grid');
    if (!grid) return;
    
    const costGlobalCdGold = Math.floor(5000 * Math.pow(1.8, window.globalUpgrades.cd));
    const costGlobalCdDia = Math.floor(5 * Math.pow(1.2, window.globalUpgrades.cd));
    const costGlobalRngGold = Math.floor(3000 * Math.pow(1.8, window.globalUpgrades.rng));
    const costGlobalRngDia = Math.floor(3 * Math.pow(1.2, window.globalUpgrades.rng));
    
    const curCdReduc = Math.min(90, window.globalUpgrades.cd * 2);
    const nextCdReduc = Math.min(90, (window.globalUpgrades.cd + 1) * 2);
    const curRngVal = window.globalUpgrades.rng;
    
    const isCdMax = window.globalUpgrades.cd >= MAX_GLOBAL_CD;
    const isRngMax = window.globalUpgrades.rng >= MAX_GLOBAL_RNG;

    let html = `
    <div style="grid-column: 1 / -1; background: #222; padding: 15px; border-radius: 8px; border: 2px solid var(--gold); margin-bottom: 5px;">
        <h4 style="margin:0 0 10px 0; color:var(--gold); text-align:center;">🌍 전체 슬롯 동시 강화 (♦️ 필요)</h4>
        <div style="display:flex; gap:10px;">
            ${isCdMax ? 
                `<button class="btn-sm" style="flex:1; height:70px; background:#444; color:#888;">⏳ 전체 쿨타임 (MAX)<br>-90%</button>` : 
                `<button onclick="upgradeGlobal('cd', ${costGlobalCdGold}, ${costGlobalCdDia})" class="btn-sm" style="flex:1; height:70px; background:#34495e;">⏳ 전체 쿨타임 Lv.${window.globalUpgrades.cd}<br><span style="color:#2ecc71;">-${curCdReduc}% ➔ -${nextCdReduc}%</span><br>💰${window.fNum ? window.fNum(costGlobalCdGold) : costGlobalCdGold} ♦️${costGlobalCdDia}</button>`
            }
            ${isRngMax ?
                `<button class="btn-sm" style="flex:1; height:70px; background:#444; color:#888;">🏹 전체 사거리 (MAX)<br>Lv.50</button>` :
                `<button onclick="upgradeGlobal('rng', ${costGlobalRngGold}, ${costGlobalRngDia})" class="btn-sm" style="flex:1; height:70px; background:#34495e;">🏹 전체 사거리 Lv.${window.globalUpgrades.rng}<br><span style="color:#2ecc71;">Lv.${curRngVal} ➔ Lv.${curRngVal+1}</span><br>💰${window.fNum ? window.fNum(costGlobalRngGold) : costGlobalRngGold} ♦️${costGlobalRngDia}</button>`
            }
        </div>
    </div>
    `;
    
    window.slotUpgrades.forEach((slot, idx) => {
        const isLocked = idx >= window.unlockedDungeon;
        if (isLocked) {
            html += `
            <div class="refine-card locked-refine" style="opacity:0.5; filter:grayscale(1);">
                <div class="refine-header">🔒 슬롯 #${idx+1}</div>
                <div class="refine-btn" style="height:100%; cursor:default;">
                    <span>🔒 잠김</span>
                    <span style="font-size:9px; color:#aaa;">던전 ${idx} 클리어 필요</span>
                </div>
            </div>`;
        } else {
            const costAtk = Math.floor(1000 * Math.pow(1.3, slot.atk));
            const curAtk = (1 + slot.atk * 0.1).toFixed(1);
            const nextAtk = (1 + (slot.atk+1) * 0.1).toFixed(1);

            html += `
            <div class="refine-card">
                <div class="refine-header">🔥 슬롯 #${idx+1}</div>
                <button class="refine-btn" onclick="upgradeSlot(${idx}, 'atk', ${costAtk})" style="height:100%;">
                    <span>⚔️ 공격력 증폭 Lv.${slot.atk}</span>
                    <span class="refine-val" style="font-size:11px;">(x${curAtk} ➔ x${nextAtk})</span>
                    <span style="margin-top:5px; color:var(--gold);">💰 ${window.fNum ? window.fNum(costAtk) : costAtk}</span>
                </button>
            </div>`;
        }
    });
    grid.innerHTML = html;
};

window.upgradeGlobal = function(type, costGold, costDia) {
    if (type === 'cd' && window.globalUpgrades.cd >= MAX_GLOBAL_CD) return;
    if (type === 'rng' && window.globalUpgrades.rng >= MAX_GLOBAL_RNG) return;

    if (window.gold >= costGold && window.dia >= costDia) {
        window.gold -= costGold;
        window.dia -= costDia;
        window.globalUpgrades[type]++;
        if(window.playSfx) window.playSfx('upgrade');
        if(window.renderRefineView) window.renderRefineView();
        if(window.updateUI) window.updateUI();
        if(window.saveGame) window.saveGame();
    } else { 
        alert("골드 또는 다이아가 부족합니다!"); 
    }
};

window.upgradeSlot = function(idx, type, cost) {
    if (window.gold >= cost) {
        window.gold -= cost;
        window.slotUpgrades[idx][type]++;
        if(window.playSfx) window.playSfx('upgrade');
        if(window.renderRefineView) window.renderRefineView();
        if(window.updateUI) window.updateUI();
        if(window.saveGame) window.saveGame();
    } else { alert("골드가 부족합니다!"); }
};

// --- [ 3. 신규 용병 훈련장 (다이아 소모) ] ---
window.openTrainingCamp = function() {
    const m = document.getElementById('training-modal');
    if(m) { m.style.display = 'flex'; renderTrainingList(); }
};
window.closeTrainingCamp = function() {
    const m = document.getElementById('training-modal');
    if(m) m.style.display = 'none';
};

function renderTrainingList() {
    const list = document.getElementById('training-list');
    if(!list) return;
    
    const curHp = window.trainingLevels.hp;
    const curAtk = window.trainingLevels.atk;
    const curSpd = window.trainingLevels.spd;
    
    const costHp = 10 + Math.floor(curHp * 5);
    const costAtk = 20 + Math.floor(curAtk * 8);
    const costSpd = 50 + Math.floor(curSpd * 15);
    
    const diaDisp = document.getElementById('training-dia-display');
    if(diaDisp) diaDisp.innerText = window.fNum ? window.fNum(window.dia) : window.dia;

    list.innerHTML = `
        <div class="shop-grid">
            <div class="shop-item">
                <div class="shop-info"><span>❤️ 생존 훈련 (체력 증가)</span> <button onclick="upgradeTraining('hp', ${costHp})" class="btn-sm" style="background:#ff4757; color:white; font-weight:bold;">♦️ ${costHp}</button></div>
                <div class="shop-desc">모든 용병의 최대 체력(HP)을 영구적으로 +5% 증가시킵니다.<br><span style="color:#2ecc71;">현재 보너스: +${curHp * 5}%</span></div>
            </div>
            <div class="shop-item">
                <div class="shop-info"><span>⚔️ 파괴 훈련 (공격력 증가)</span> <button onclick="upgradeTraining('atk', ${costAtk})" class="btn-sm" style="background:#ff4757; color:white; font-weight:bold;">♦️ ${costAtk}</button></div>
                <div class="shop-desc">모든 용병의 기본 화력을 영구적으로 +10% 증폭시킵니다.<br><span style="color:#2ecc71;">현재 보너스: +${curAtk * 10}%</span></div>
            </div>
            <div class="shop-item">
                <div class="shop-info"><span>💨 신속 훈련 (이동속도 증가)</span> <button onclick="upgradeTraining('spd', ${costSpd})" class="btn-sm" style="background:#ff4757; color:white; font-weight:bold;">♦️ ${costSpd}</button></div>
                <div class="shop-desc">적을 유린하는 치고 빠지기! 용병의 이동 속도가 영구적으로 +0.1 증가합니다.<br><span style="color:#2ecc71;">현재 보너스: +${(curSpd * 0.1).toFixed(1)}</span></div>
            </div>
        </div>
    `;
}
window.renderTrainingList = renderTrainingList;

window.upgradeTraining = function(stat, costDia) {
    if (window.dia >= costDia) {
        window.dia -= costDia;
        window.trainingLevels[stat]++;
        if(window.playSfx) window.playSfx('upgrade');
        renderTrainingList();
        if(window.updateUI) window.updateUI();
        if(window.saveGame) window.saveGame();
    } else {
        alert("다이아가 부족합니다! 던전 보스를 처치하여 획득하세요.");
    }
};
