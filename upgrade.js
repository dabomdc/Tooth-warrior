// Version: 8.1.0 - Power Upgrade Hub, Mining Upgrade, Slot Refine, Mercenary Training

// --- [ 1. 전력강화 메인 화면 ] ---
window.renderRefineView = function() {
    const grid = document.getElementById('refine-grid');

    if (!grid || typeof window.TOOTH_DATA === 'undefined') return;

    const merc = window.TOOTH_DATA.mercenaries[window.mercenaryIdx] || window.TOOTH_DATA.mercenaries[0];
    const nextPickaxe = window.pickaxeIdx + 1;
    const hasNextPickaxe = nextPickaxe < window.TOOTH_DATA.pickaxes.length;

    const top8Count = window.inventory.slice(0, 8).filter(v => v > 0).length;
    const ownedMercCount = Array.isArray(window.ownedMercenaries) ? window.ownedMercenaries.length : 1;

    let slotAtkTotal = 0;
    if (Array.isArray(window.slotUpgrades)) {
        window.slotUpgrades.forEach(s => {
            slotAtkTotal += s && s.atk ? s.atk : 0;
        });
    }

    grid.innerHTML = `
        <div class="power-hub">
            <div class="power-title-card">
                <div class="power-title">🔥 전력강화</div>
                <div class="power-subtitle">채굴, 전투 슬롯, 용병, 훈련을 한 곳에서 관리합니다.</div>
            </div>

            <div class="power-card" onclick="openShop()">
                <div class="power-card-icon">⛏️</div>
                <div class="power-card-body">
                    <div class="power-card-title">채굴/자동화 강화</div>
                    <div class="power-card-desc">
                        현재 곡괭이: <span class="stat-gold">${window.TOOTH_DATA.pickaxes[window.pickaxeIdx].name}</span><br>
                        자동채굴 Lv.${window.autoMineLevel} / 자동합성 Lv.${window.autoMergeSpeedLevel}<br>
                        ${hasNextPickaxe ? `다음 곡괭이: ${window.TOOTH_DATA.pickaxes[nextPickaxe].name}` : `곡괭이 최고 등급`}
                    </div>
                </div>
                <button class="power-open-btn">열기</button>
            </div>

            <div class="power-card" onclick="openSlotRefineModal()">
                <div class="power-card-icon">⚔️</div>
                <div class="power-card-body">
                    <div class="power-card-title">Top8 슬롯 제련</div>
                    <div class="power-card-desc">
                        전투 슬롯 장착: <span class="stat-gold">${top8Count}/8</span><br>
                        슬롯 공격력 증폭 총합: <span class="stat-green">+${slotAtkTotal * 10}%</span><br>
                        상위 8칸에 배치된 치아가 던전에서 공격합니다.
                    </div>
                </div>
                <button class="power-open-btn">열기</button>
            </div>

            <div class="power-card" onclick="openSystemUpgradeModal()">
                <div class="power-card-icon">🌐</div>
                <div class="power-card-body">
                    <div class="power-card-title">공통 전투 시스템</div>
                    <div class="power-card-desc">
                        탐지 사거리 Lv.${window.globalUpgrades.rng}<br>
                        연사 속도 Lv.${window.globalUpgrades.cd}<br>
                        모든 전투 슬롯에 공통 적용됩니다.
                    </div>
                </div>
                <button class="power-open-btn">열기</button>
            </div>

            <div class="power-card" onclick="openMercenaryModal()">
                <div class="power-card-icon">👥</div>
                <div class="power-card-body">
                    <div class="power-card-title">용병 모집/교체</div>
                    <div class="power-card-desc">
                        현재 용병: <span class="stat-gold">${merc.icon} ${merc.name}</span><br>
                        보유 용병: ${ownedMercCount}명<br>
                        더 강한 용병을 고용하고 장착합니다.
                    </div>
                </div>
                <button class="power-open-btn">열기</button>
            </div>

            <div class="power-card" onclick="openTrainingCamp()">
                <div class="power-card-icon">💪</div>
                <div class="power-card-body">
                    <div class="power-card-title">용병 훈련</div>
                    <div class="power-card-desc">
                        체력 Lv.${window.trainingLevels.hp || 0} / 공격 Lv.${window.trainingLevels.atk || 0} / 속도 Lv.${window.trainingLevels.spd || 0}<br>
                        치명타 Lv.${window.trainingLevels.crit || 0} / 광역 Lv.${window.trainingLevels.splashDmg || 0}<br>
                        다이아로 영구 강화합니다.
                    </div>
                </div>
                <button class="power-open-btn">열기</button>
            </div>
        </div>
    `;
};


// --- [ 2. 공용 모달 열기/닫기 ] ---
function openGenericUpgradeModal(html) {
    const modal = document.getElementById('shop-modal');
    const content = document.getElementById('shop-content');

    if (!modal || !content) return;

    content.innerHTML = html;
    modal.style.display = 'flex';
}

window.closeShop = function() {
    const m = document.getElementById('shop-modal');

    if (m) {
        m.style.display = 'none';
    }

    if (typeof window.renderRefineView === 'function' && window.currentView === 'refine') {
        window.renderRefineView();
    }
};


// --- [ 3. 채굴/자동화 강화 ] ---
window.openShop = function() {
    if (typeof window.renderShop === 'function') {
        window.renderShop();
    }
};

window.renderShop = function() {
    if (typeof window.TOOTH_DATA === 'undefined') return;

    let html = `
        <div class="sticky-header">
            <h2 style="color:var(--gold); margin:0;">⛏️ 채굴/자동화 강화</h2>
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:12px; color:#fff;">💰 <span style="color:var(--gold); font-weight:bold;">${window.safeFNum ? window.safeFNum(window.gold) : window.gold}</span></span>
                <button onclick="closeShop()" style="background:none; border:none; color:#e74c3c; font-size:24px; font-weight:bold; cursor:pointer; padding:0;">✕</button>
            </div>
        </div>
        <div class="modal-content-area shop-grid">
    `;

    let nextPickaxe = window.pickaxeIdx + 1;

    if (nextPickaxe < window.TOOTH_DATA.pickaxes.length) {
        let pData = window.TOOTH_DATA.pickaxes[nextPickaxe];

        html += `
            <div class="shop-item">
                <div class="shop-info">
                    <span>${pData.icon} ${pData.name}</span>
                    <span>${window.safeFNum ? window.safeFNum(pData.cost) : pData.cost}G</span>
                </div>
                <div class="shop-desc">채굴 시 +1레벨 확률 ${(pData.luck * 100).toFixed(0)}% / 수동 채굴 파워 ${pData.power}</div>
                <button onclick="buyPickaxe(${nextPickaxe}, ${pData.cost})" class="btn-gold" style="width:100%; margin-top:5px;">구매하기</button>
            </div>
        `;
    } else {
        let maxData = window.TOOTH_DATA.pickaxes[window.pickaxeIdx];

        html += `
            <div class="shop-item">
                <div class="shop-info">
                    <span>${maxData.icon} 최고 등급 곡괭이 장착중</span>
                    <span>MAX</span>
                </div>
                <div class="shop-desc">수동 채굴 파워 ${maxData.power}</div>
                <button class="btn-max" style="width:100%; margin-top:5px;" disabled>MAX</button>
            </div>
        `;
    }

    let mineCost = Math.floor(100 * Math.pow(1.5, window.autoMineLevel - 1));
    let isMineMax = window.autoMineLevel >= 41; 
    let currentMineTime = Math.max(2.0, 10.0 - ((window.autoMineLevel - 1) * 0.2));

    html += `
        <div class="shop-item">
            <div class="shop-info">
                <span>⛏️ 자동채굴 속도 Lv.${window.autoMineLevel}</span>
                <span>${isMineMax ? 'MAX' : (window.safeFNum ? window.safeFNum(mineCost) : mineCost) + 'G'}</span>
            </div>
            <div class="shop-desc">현재 ${currentMineTime.toFixed(1)}초마다 채굴</div>
            <button onclick="buyAutoMine(${mineCost})" class="${isMineMax ? 'btn-max' : 'btn-gold'}" style="width:100%; margin-top:5px;" ${isMineMax ? 'disabled' : ''}>${isMineMax ? 'MAX' : '업그레이드'}</button>
        </div>
    `;

    let mergeCost = Math.floor(500 * Math.pow(1.6, window.autoMergeSpeedLevel - 1));
    let isMergeMax = window.autoMergeSpeedLevel >= 41; 
    let currentMergeTime = Math.max(20.0, 60.0 - ((window.autoMergeSpeedLevel - 1) * 1.0));

    html += `
        <div class="shop-item">
            <div class="shop-info">
                <span>⚡ 자동합성 속도 Lv.${window.autoMergeSpeedLevel}</span>
                <span>${isMergeMax ? 'MAX' : (window.safeFNum ? window.safeFNum(mergeCost) : mergeCost) + 'G'}</span>
            </div>
            <div class="shop-desc">현재 ${currentMergeTime.toFixed(1)}초마다 1회 합성</div>
            <button onclick="buyAutoMerge(${mergeCost})" class="${isMergeMax ? 'btn-max' : 'btn-gold'}" style="width:100%; margin-top:5px;" ${isMergeMax ? 'disabled' : ''}>${isMergeMax ? 'MAX' : '업그레이드'}</button>
        </div>
    `;

    let greatCost = Math.floor(1000 * Math.pow(1.8, window.greatChanceLevel));
    let isGreatMax = window.greatChanceLevel >= 25; 

    html += `
        <div class="shop-item">
            <div class="shop-info">
                <span>✨ 합성 대성공 Lv.${window.greatChanceLevel}</span>
                <span>${isGreatMax ? 'MAX' : (window.safeFNum ? window.safeFNum(greatCost) : greatCost) + 'G'}</span>
            </div>
            <div class="shop-desc">현재 확률 ${window.greatChanceLevel * 2}% / 성공 시 +2레벨 합성</div>
            <button onclick="buyGreatChance(${greatCost})" class="${isGreatMax ? 'btn-max' : 'btn-gold'}" style="width:100%; margin-top:5px;" ${isGreatMax ? 'disabled' : ''}>${isGreatMax ? 'MAX' : '업그레이드'}</button>
        </div>
    `;

    let isSlotMax = window.maxSlots >= 56;
    let slotCost = isSlotMax ? 0 : window.TOOTH_DATA.invExpansion[(window.maxSlots - 24) / 8];
    
    html += `
        <div class="shop-item">
            <div class="shop-info">
                <span>🎒 인벤토리 확장 ${window.maxSlots}${isSlotMax ? '' : ' → ' + (window.maxSlots + 8)}칸</span>
                <span>${isSlotMax ? 'MAX' : (window.safeFNum ? window.safeFNum(slotCost) : slotCost) + 'G'}</span>
            </div>
            <div class="shop-desc">보유 가능한 치아 슬롯을 늘립니다.</div>
            <button ${isSlotMax ? '' : `onclick="buyInventorySlot(${slotCost})"`} class="${isSlotMax ? 'btn-max' : 'btn-gold'}" style="width:100%; margin-top:5px;" ${isSlotMax ? 'disabled' : ''}>${isSlotMax ? 'MAX' : '확장하기'}</button>
        </div>
    `;

    html += `</div>`;

    openGenericUpgradeModal(html);
};

window.buyPickaxe = function(idx, cost) {
    if (window.gold >= cost) { 
        window.gold -= cost; 
        window.pickaxeIdx = idx; 

        try {
            if (typeof window.playSfx === 'function') window.playSfx('upgrade');
        } catch(e) {}

        if (typeof window.renderShop === 'function') window.renderShop(); 
        if (typeof window.updatePickaxeVisual === 'function') window.updatePickaxeVisual(); 
        if (typeof window.updateUI === 'function') window.updateUI(); 
        if (typeof window.saveGame === 'function') window.saveGame(); 
    } else {
        alert("골드가 부족합니다!");
    }
};

window.buyAutoMine = function(cost) {
    if (window.gold >= cost) { 
        window.gold -= cost; 
        window.autoMineLevel++; 

        try {
            if (typeof window.playSfx === 'function') window.playSfx('upgrade');
        } catch(e) {}

        if (typeof window.renderShop === 'function') window.renderShop(); 
        if (typeof window.updateUI === 'function') window.updateUI(); 
        if (typeof window.saveGame === 'function') window.saveGame(); 
    } else {
        alert("골드가 부족합니다!");
    }
};

window.buyAutoMerge = function(cost) {
    if (window.gold >= cost) { 
        window.gold -= cost; 
        window.autoMergeSpeedLevel++; 

        try {
            if (typeof window.playSfx === 'function') window.playSfx('upgrade');
        } catch(e) {}

        if (typeof window.renderShop === 'function') window.renderShop(); 
        if (typeof window.updateUI === 'function') window.updateUI(); 
        if (typeof window.saveGame === 'function') window.saveGame(); 
    } else {
        alert("골드가 부족합니다!");
    }
};

window.buyGreatChance = function(cost) {
    if (window.gold >= cost) { 
        window.gold -= cost; 
        window.greatChanceLevel++; 

        try {
            if (typeof window.playSfx === 'function') window.playSfx('upgrade');
        } catch(e) {}

        if (typeof window.renderShop === 'function') window.renderShop(); 
        if (typeof window.updateUI === 'function') window.updateUI(); 
        if (typeof window.saveGame === 'function') window.saveGame(); 
    } else {
        alert("골드가 부족합니다!");
    }
};

window.buyInventorySlot = function(cost) {
    if (window.gold >= cost) { 
        window.gold -= cost; 
        window.maxSlots += 8; 

        try {
            if (typeof window.playSfx === 'function') window.playSfx('upgrade');
        } catch(e) {}

        if (typeof window.renderShop === 'function') window.renderShop(); 
        if (typeof window.renderInventory === 'function') window.renderInventory(); 
        if (typeof window.updateUI === 'function') window.updateUI(); 
        if (typeof window.saveGame === 'function') window.saveGame(); 
    } else {
        alert("골드가 부족합니다!");
    }
};


// --- [ 4. 공통 전투 시스템 강화 ] ---
window.openSystemUpgradeModal = function() {
    const rngCost = Math.floor(500 * Math.pow(1.8, window.globalUpgrades.rng));
    const cdCost = Math.floor(1000 * Math.pow(2.0, window.globalUpgrades.cd));
    const isCdMax = window.globalUpgrades.cd >= 45;

    const html = `
        <div class="sticky-header">
            <h2 style="color:var(--gold); margin:0;">🌐 공통 전투 시스템</h2>
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:12px; color:#fff;">💰 <span style="color:var(--gold); font-weight:bold;">${window.safeFNum ? window.safeFNum(window.gold) : window.gold}</span></span>
                <button onclick="closeShop()" style="background:none; border:none; color:#e74c3c; font-size:24px; font-weight:bold; cursor:pointer; padding:0;">✕</button>
            </div>
        </div>
        <div class="modal-content-area shop-grid">
            <div class="shop-item">
                <div class="shop-info">
                    <span>🎯 탐지 사거리 Lv.${window.globalUpgrades.rng}</span>
                    <span>${window.safeFNum ? window.safeFNum(rngCost) : rngCost}G</span>
                </div>
                <div class="shop-desc">현재 추가 사거리 +${window.globalUpgrades.rng * 20}px</div>
                <button onclick="upgradeGlobalRng(${rngCost})" class="btn-gold" style="width:100%; margin-top:5px;">업그레이드</button>
            </div>

            <div class="shop-item">
                <div class="shop-info">
                    <span>⚡ 연사 속도 Lv.${window.globalUpgrades.cd}</span>
                    <span>${isCdMax ? 'MAX' : (window.safeFNum ? window.safeFNum(cdCost) : cdCost) + 'G'}</span>
                </div>
                <div class="shop-desc">현재 대기시간 -${Math.min(90, window.globalUpgrades.cd * 2)}%</div>
                <button onclick="upgradeGlobalCd(${cdCost})" class="${isCdMax ? 'btn-max' : 'btn-gold'}" style="width:100%; margin-top:5px;" ${isCdMax ? 'disabled' : ''}>${isCdMax ? 'MAX' : '업그레이드'}</button>
            </div>
        </div>
    `;

    openGenericUpgradeModal(html);
};


// --- [ 5. Top8 슬롯 제련 ] ---
window.openSlotRefineModal = function() {
    let html = `
        <div class="sticky-header">
            <h2 style="color:var(--gold); margin:0;">⚔️ Top8 슬롯 제련</h2>
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:12px; color:#fff;">💰 <span style="color:var(--gold); font-weight:bold;">${window.safeFNum ? window.safeFNum(window.gold) : window.gold}</span></span>
                <button onclick="closeShop()" style="background:none; border:none; color:#e74c3c; font-size:24px; font-weight:bold; cursor:pointer; padding:0;">✕</button>
            </div>
        </div>
        <div class="modal-content-area slot-refine-grid">
    `;

    for (let i = 0; i < 8; i++) {
        const upg = window.slotUpgrades[i] || { atk: 0, cd: 0, rng: 0 };
        const costAtk = Math.floor(100 * Math.pow(1.5, upg.atk));
        
        let toothIcon = "-";
        let toothLv = "비어 있음";
        let atkInfo = "";

        if (window.inventory[i] > 0) {
            const lv = window.inventory[i];
            toothIcon = typeof window.getSimpleToothEmoji === 'function'
                ? window.getSimpleToothEmoji(lv)
                : "🦷";

            toothLv = `Lv.${lv}`;

            let baseAtk = typeof window.getAtk === 'function' ? window.getAtk(lv) : 0;
            atkInfo = `기본 공격력 ${window.safeFNum ? window.safeFNum(baseAtk) : baseAtk}`;
        }

        html += `
            <div class="slot-refine-card">
                <div class="slot-refine-title">슬롯 ${i + 1}</div>
                <div class="slot-refine-tooth">
                    <span class="slot-refine-icon">${toothIcon}</span>
                    <span>${toothLv}</span>
                </div>
                <div class="slot-refine-desc">${atkInfo}</div>
                <button onclick="upgradeSlot(${i}, 'atk', ${costAtk})" class="refine-btn">
                    <span>⚔️ 공격력 증폭 Lv.${upg.atk}</span>
                    <span class="refine-val">+${upg.atk * 10}%</span>
                    <span style="color:var(--gold); margin-top:3px;">${window.safeFNum ? window.safeFNum(costAtk) : costAtk}G</span>
                </button>
            </div>
        `;
    }

    html += `</div>`;

    openGenericUpgradeModal(html);
};

window.upgradeSlot = function(idx, type, cost) {
    if (window.gold >= cost) {
        window.gold -= cost;

        if (!window.slotUpgrades[idx]) {
            window.slotUpgrades[idx] = { atk: 0, cd: 0, rng: 0 };
        }

        window.slotUpgrades[idx][type]++;

        try { 
            if (typeof window.playSfx === 'function') window.playSfx('upgrade'); 
        } catch(e) {}

        if (typeof window.openSlotRefineModal === 'function') {
            window.openSlotRefineModal();
        }

        if (typeof window.updateUI === 'function') {
            window.updateUI();
        }

        if (typeof window.saveGame === 'function') {
            window.saveGame();
        }
    } else {
        alert("골드가 부족합니다!");
    }
};

window.upgradeGlobalRng = function(cost) {
    if (window.gold >= cost) {
        window.gold -= cost;
        window.globalUpgrades.rng++;

        try { 
            if (typeof window.playSfx === 'function') window.playSfx('upgrade'); 
        } catch(e) {}

        if (typeof window.openSystemUpgradeModal === 'function') {
            window.openSystemUpgradeModal();
        }

        if (typeof window.updateUI === 'function') {
            window.updateUI();
        }

        if (typeof window.saveGame === 'function') {
            window.saveGame();
        }
    } else {
        alert("골드가 부족합니다!");
    }
};

window.upgradeGlobalCd = function(cost) {
    if (window.globalUpgrades.cd >= 45) { 
        alert("최대 레벨입니다!"); 
        return; 
    }

    if (window.gold >= cost) {
        window.gold -= cost;
        window.globalUpgrades.cd++;

        try { 
            if (typeof window.playSfx === 'function') window.playSfx('upgrade'); 
        } catch(e) {}

        if (typeof window.openSystemUpgradeModal === 'function') {
            window.openSystemUpgradeModal();
        }

        if (typeof window.updateUI === 'function') {
            window.updateUI();
        }

        if (typeof window.saveGame === 'function') {
            window.saveGame();
        }
    } else {
        alert("골드가 부족합니다!");
    }
};


// --- [ 6. 용병 훈련 ] ---
window.openTrainingCamp = function() {
    const m = document.getElementById('training-modal');

    if (m) { 
        m.style.display = 'flex'; 

        if (typeof window.renderTrainingCamp === 'function') {
            window.renderTrainingCamp(); 
        }
    }
};

window.closeTrainingCamp = function() {
    const m = document.getElementById('training-modal');
    if (m) m.style.display = 'none';

    if (typeof window.renderRefineView === 'function' && window.currentView === 'refine') {
        window.renderRefineView();
    }
};

window.renderTrainingCamp = function() {
    const list = document.getElementById('training-list');
    const diaDisp = document.getElementById('training-dia-display');

    if (!list || !diaDisp) return;

    diaDisp.innerText = window.safeFNum ? window.safeFNum(window.dia) : window.dia;
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

        div.className = 'training-item';

        let lv = window.trainingLevels[t.id] || 0;
        let isMax = lv >= t.max;
        let cost = Math.floor(t.baseCost * Math.pow(t.costMul, lv));
        let locked = t.reqLv && window.highestToothLevel < t.reqLv;

        if (locked) {
            div.innerHTML = `
                <div class="training-locked">
                    <div style="font-size:24px;">🔒</div>
                    <div>
                        <div style="font-size:14px; color:#aaa; font-weight:bold;">미해금 훈련</div>
                        <div style="font-size:10px; color:#888; margin-top:2px;">치아 Lv.${t.reqLv} 달성 시 개방</div>
                    </div>
                </div>
            `;
        } 
        else {
            div.innerHTML = `
                <div class="training-info">
                    <div class="training-icon">${t.icon}</div>
                    <div>
                        <div class="training-name">${t.name} <span>(Lv.${lv}${isMax ? ' MAX' : ''})</span></div>
                        <div class="training-desc">${t.desc}</div>
                        <div class="training-effect">현재 적용: ${t.currentEffect}</div>
                    </div>
                </div>
                ${isMax ? 
                    `<button class="btn-max" disabled>MAX</button>` : 
                    `<button onclick="window.buyTraining('${t.id}', ${cost})" class="btn-sm training-buy-btn">♦️ ${window.safeFNum ? window.safeFNum(cost) : cost}</button>`
                }
            `;
        }

        list.appendChild(div);
    });
};

window.buyTraining = function(id, cost) {
    if (window.dia >= cost) {
        window.dia -= cost;

        if (!window.trainingLevels[id]) {
            window.trainingLevels[id] = 0;
        }

        window.trainingLevels[id]++;
        
        try { 
            if (typeof window.playSfx === 'function') window.playSfx('upgrade'); 
        } catch(e) {}

        if (typeof window.renderTrainingCamp === 'function') {
            window.renderTrainingCamp();
        }
        
        if (typeof window.updateUI === 'function') {
            window.updateUI();
        }

        if (typeof window.renderMercenaryCamp === 'function') {
            window.renderMercenaryCamp(); 
        }

        if (typeof window.renderRefineView === 'function' && window.currentView === 'refine') {
            window.renderRefineView();
        }

        if (typeof window.saveGame === 'function') {
            window.saveGame();
        }
    } else {
        alert("다이아가 부족합니다!");
    }
};
