// Version: 8.0.0 - Upgrade System (Shop, Refine, Mercenaries, Training)

// --- [ 1. 상점 (곡괭이 및 인벤토리 확장) ] ---
window.openShop = function() {
    openModal('shop-modal');
    window.renderShop();
};

window.renderShop = function() {
    const shop = document.getElementById('shop-content');
    if(!shop) return;
    
    let html = `
        <div class="sticky-header">
            <div style="display:flex; align-items:center; gap:10px;">
                <h2 style="color:var(--gold); margin:0;">💰 Upgrade Lab</h2>
                <span style="font-size:12px; color:#fff;">보유: <span style="color:var(--gold); font-weight:bold;">${fNum(window.gold)}</span> G</span>
            </div>
            <button onclick="closeModal('shop-modal')" style="background:none; border:none; color:#e74c3c; font-size:24px; font-weight:bold; cursor:pointer; padding:0;">✕</button>
        </div>
        <div class="modal-content-area">
            <div class="shop-grid">
    `;

    // 1. 곡괭이 업그레이드 렌더링
    let nextPick = window.pickaxeLevel + 1;
    if (nextPick < TOOTH_DATA.pickaxes.length) {
        let pData = TOOTH_DATA.pickaxes[nextPick];
        let canBuy = window.gold >= pData.cost;
        html += `
            <div class="shop-item">
                <div class="shop-info">
                    <span style="font-size:14px;">${pData.icon} ${pData.name}</span>
                    <span style="color:${canBuy ? '#2ecc71' : '#e74c3c'};">${fNum(pData.cost)} G</span>
                </div>
                <div class="shop-desc">
                    채굴 시 +1레벨 확률: ${(pData.luck * 100).toFixed(0)}%<br>
                    수동 채굴 파워: ${pData.power}
                </div>
                <button onclick="buyPickaxe()" class="${canBuy ? 'btn-gold' : 'btn-sm'}" style="width:100%; margin-top:8px;" ${canBuy ? '' : 'disabled'}>
                    ${canBuy ? '구매하기' : '골드 부족'}
                </button>
            </div>
        `;
    } else {
        // 🌟 버그 수정 반영: MAX 렙이어도 확률과 파워 텍스트 유지
        let maxData = TOOTH_DATA.pickaxes[TOOTH_DATA.pickaxes.length - 1];
        html += `
            <div class="shop-item" style="border-color:#555;">
                <div class="shop-info"><span style="color:#aaa;">${maxData.icon} 최종 곡괭이 달성</span><span>MAX</span></div>
                <div class="shop-desc" style="color:#aaa;">
                    채굴 시 +1레벨 확률: ${(maxData.luck * 100).toFixed(0)}%<br>
                    수동 채굴 파워: ${maxData.power}
                </div>
                <button class="btn-max" style="width:100%; margin-top:8px;" disabled>최대 레벨</button>
            </div>
        `;
    }

    // 2. 인벤토리 확장 렌더링
    let nextInv = window.inventoryLevel + 1;
    if (nextInv < TOOTH_DATA.invExpansion.length) {
        let iCost = TOOTH_DATA.invExpansion[nextInv];
        let canBuyInv = window.gold >= iCost;
        let nextSlots = 16 + (nextInv * 8);
        html += `
            <div class="shop-item">
                <div class="shop-info">
                    <span style="font-size:14px;">🎒 인벤토리 확장</span>
                    <span style="color:${canBuyInv ? '#2ecc71' : '#e74c3c'};">${fNum(iCost)} G</span>
                </div>
                <div class="shop-desc">최대 슬롯 8칸 증가 (현재: ${window.maxSlots} ➔ ${nextSlots}칸)</div>
                <button onclick="buyInventory()" class="${canBuyInv ? 'btn-gold' : 'btn-sm'}" style="width:100%; margin-top:8px;" ${canBuyInv ? '' : 'disabled'}>
                    ${canBuyInv ? '확장하기' : '골드 부족'}
                </button>
            </div>
        `;
    } else {
        html += `
            <div class="shop-item" style="border-color:#555;">
                <div class="shop-info"><span style="color:#aaa;">🎒 인벤토리 확장 완료</span><span>MAX</span></div>
                <div class="shop-desc" style="color:#aaa;">최대 슬롯 달성 (${window.maxSlots}칸)</div>
                <button class="btn-max" style="width:100%; margin-top:8px;" disabled>최대 레벨</button>
            </div>
        `;
    }

    // 3. 자동 채굴 속도 업그레이드
    if (window.autoMineLevel < 41) {
        let mCost = Math.floor(100 * Math.pow(2.1, window.autoMineLevel));
        let canBuy = window.gold >= mCost;
        let nextSpeed = Math.max(0.2, 10.0 - ((window.autoMineLevel + 1) * 0.2));
        html += `
            <div class="shop-item">
                <div class="shop-info">
                    <span style="font-size:14px;">⛏️ 자동 채굴 속도 (Lv.${window.autoMineLevel})</span>
                    <span style="color:${canBuy ? '#2ecc71' : '#e74c3c'};">${fNum(mCost)} G</span>
                </div>
                <div class="shop-desc">자동 채굴 주기 감소 (➔ ${nextSpeed.toFixed(1)}초)</div>
                <button onclick="buyAutoMine()" class="${canBuy ? 'btn-gold' : 'btn-sm'}" style="width:100%; margin-top:8px;" ${canBuy ? '' : 'disabled'}>업그레이드</button>
            </div>
        `;
    }

    // 4. 자동 합성 속도 업그레이드
    if (window.autoMergeLevel < 41) {
        let mCost = Math.floor(500 * Math.pow(2.2, window.autoMergeLevel));
        let canBuy = window.gold >= mCost;
        let nextSpeed = Math.max(2.0, 10.0 - ((window.autoMergeLevel + 1) * 0.2));
        html += `
            <div class="shop-item">
                <div class="shop-info">
                    <span style="font-size:14px;">⚡ 자동 합성 속도 (Lv.${window.autoMergeLevel})</span>
                    <span style="color:${canBuy ? '#2ecc71' : '#e74c3c'};">${fNum(mCost)} G</span>
                </div>
                <div class="shop-desc">자동 합성 주기 감소 (➔ ${nextSpeed.toFixed(1)}초)</div>
                <button onclick="buyAutoMerge()" class="${canBuy ? 'btn-gold' : 'btn-sm'}" style="width:100%; margin-top:8px;" ${canBuy ? '' : 'disabled'}>업그레이드</button>
            </div>
        `;
    }

    // 5. 합성 대성공 확률 업그레이드
    if (window.greatSuccessLevel < 25) {
        let gCost = Math.floor(1000 * Math.pow(3.0, window.greatSuccessLevel));
        let canBuy = window.gold >= gCost;
        let nextProb = (window.greatSuccessLevel + 1) * 2;
        html += `
            <div class="shop-item">
                <div class="shop-info">
                    <span style="font-size:14px;">✨ 합성 대성공 (Lv.${window.greatSuccessLevel})</span>
                    <span style="color:${canBuy ? '#2ecc71' : '#e74c3c'};">${fNum(gCost)} G</span>
                </div>
                <div class="shop-desc">합성 시 +2레벨업 점프 확률 (➔ ${nextProb}%)</div>
                <button onclick="buyGreatSuccess()" class="${canBuy ? 'btn-gold' : 'btn-sm'}" style="width:100%; margin-top:8px;" ${canBuy ? '' : 'disabled'}>업그레이드</button>
            </div>
        `;
    }

    html += `</div></div>`;
    shop.innerHTML = html;
};

// 상점 구매 실행 함수들
window.buyPickaxe = function() {
    let nextPick = window.pickaxeLevel + 1;
    let cost = TOOTH_DATA.pickaxes[nextPick].cost;
    if (window.gold >= cost) {
        window.gold -= cost;
        window.pickaxeLevel = nextPick;
        try { if(typeof playSfx === 'function') playSfx('upgrade'); } catch(e){}
        if(typeof window.updateStats === 'function') window.updateStats();
        window.renderShop();
    }
};

window.buyInventory = function() {
    let nextInv = window.inventoryLevel + 1;
    let cost = TOOTH_DATA.invExpansion[nextInv];
    if (window.gold >= cost) {
        window.gold -= cost;
        window.inventoryLevel = nextInv;
        window.maxSlots = 16 + (window.inventoryLevel * 8);
        try { if(typeof playSfx === 'function') playSfx('upgrade'); } catch(e){}
        if(typeof window.renderInventory === 'function') window.renderInventory();
        if(typeof window.updateStats === 'function') window.updateStats();
        window.renderShop();
    }
};

window.buyAutoMine = function() {
    let cost = Math.floor(100 * Math.pow(2.1, window.autoMineLevel));
    if (window.gold >= cost) {
        window.gold -= cost;
        window.autoMineLevel++;
        window.autoMineSpeed = Math.max(0.2, 10.0 - (window.autoMineLevel * 0.2));
        try { if(typeof playSfx === 'function') playSfx('upgrade'); } catch(e){}
        if(typeof window.updateStats === 'function') window.updateStats();
        window.renderShop();
    }
};

window.buyAutoMerge = function() {
    let cost = Math.floor(500 * Math.pow(2.2, window.autoMergeLevel));
    if (window.gold >= cost) {
        window.gold -= cost;
        window.autoMergeLevel++;
        window.autoMergeSpeed = Math.max(2.0, 10.0 - (window.autoMergeLevel * 0.2));
        try { if(typeof playSfx === 'function') playSfx('upgrade'); } catch(e){}
        if(typeof window.updateStats === 'function') window.updateStats();
        window.renderShop();
    }
};

window.buyGreatSuccess = function() {
    let cost = Math.floor(1000 * Math.pow(3.0, window.greatSuccessLevel));
    if (window.gold >= cost) {
        window.gold -= cost;
        window.greatSuccessLevel++;
        window.greatSuccessProb = window.greatSuccessLevel * 0.02;
        try { if(typeof playSfx === 'function') playSfx('upgrade'); } catch(e){}
        if(typeof window.updateStats === 'function') window.updateStats();
        window.renderShop();
    }
};

// --- [ 2. 제련소 (Top 8 무기 강화) ] ---
window.renderRefineView = function() {
    const grid = document.getElementById('refine-grid');
    if(!grid) return;
    grid.innerHTML = '';
    
    for (let i = 0; i < 8; i++) {
        let lv = window.refineLevels[i] || 0;
        let cost = Math.floor(100 * Math.pow(2.0, lv));
        let bonus = (lv * 10).toFixed(0);
        let canBuy = window.gold >= cost;
        
        grid.innerHTML += `
            <div class="refine-card">
                <div class="refine-header">슬롯 ${i+1} 강화</div>
                <div style="font-size:10px; color:#aaa; text-align:center; margin-bottom:5px;">현재 Lv.${lv}</div>
                <div style="font-size:11px; color:#fff; text-align:center; margin-bottom:10px;">
                    공격력 <span class="refine-val">+${bonus}%</span>
                </div>
                <button onclick="upgradeSlot(${i})" class="${canBuy ? 'btn-red' : 'btn-sm'}" ${canBuy ? '' : 'disabled'}>
                    ${canBuy ? '강화 ('+fNum(cost)+'G)' : '골드 부족'}
                </button>
            </div>
        `;
    }
};

window.upgradeSlot = function(idx) {
    let lv = window.refineLevels[idx] || 0;
    let cost = Math.floor(100 * Math.pow(2.0, lv));
    if (window.gold >= cost) {
        window.gold -= cost;
        window.refineLevels[idx] = lv + 1;
        try { if(typeof playSfx === 'function') playSfx('upgrade'); } catch(e){}
        if(typeof window.updateStats === 'function') window.updateStats();
        window.renderRefineView();
        if(typeof window.renderInventory === 'function') window.renderInventory();
    }
};

// --- [ 3. 용병 주점 (모집 및 교체) ] ---
window.renderMercenaryCamp = function() {
    const display = document.getElementById('current-mercenary-display');
    if(!display) return;
    if (window.activeMercenary) {
        let trainingBonus = window.trainingLevel ? (window.trainingLevel * 0.05) : 0;
        let finalHp = window.activeMercenary.baseHp * (1 + trainingBonus);
        
        display.innerHTML = `
            <div style="font-size:40px; filter:drop-shadow(2px 2px 0 #000);">${window.activeMercenary.icon}</div>
            <div style="flex:1;">
                <div style="font-weight:bold; color:var(--gold); font-size:16px;">${window.activeMercenary.name}</div>
                <div style="font-size:11px; color:#ccc; margin-top:5px; line-height:1.4;">
                    전투력 증폭: <span style="color:#2ecc71;">x${window.activeMercenary.atkMul}</span><br>
                    체력: <span style="color:#e74c3c;">${Math.floor(finalHp)}</span> 
                    (이동속도: ${window.activeMercenary.spd})
                </div>
            </div>
        `;
    } else {
        display.innerHTML = `<div style="color:#888; font-size:12px; text-align:center; width:100%; padding:20px;">고용된 용병이 없습니다.<br>용병 주점에서 모집하세요!</div>`;
    }
};

window.renderMercenaryModal = function() {
    const list = document.getElementById('mercenary-list-modal');
    if(!list) return;
    list.innerHTML = '';
    
    TOOTH_DATA.mercenaries.forEach(merc => {
        let isHired = window.activeMercenary && window.activeMercenary.id === merc.id;
        let canBuy = window.gold >= merc.cost;
        let btnHtml = '';
        
        if (isHired) {
            btnHtml = `<button class="btn-max" style="width:100%; font-size:10px;" disabled>고용 중</button>`;
        } else if (merc.cost === 0) {
            btnHtml = `<button onclick="hireMercenary(${merc.id})" class="btn-gold" style="width:100%; font-size:10px;">기본 지급</button>`;
        } else {
            btnHtml = `<button onclick="hireMercenary(${merc.id})" class="${canBuy ? 'btn-red' : 'btn-sm'}" style="width:100%; font-size:10px;" ${canBuy ? '' : 'disabled'}>
                ${canBuy ? fNum(merc.cost)+'G 고용' : '골드 부족'}
            </button>`;
        }

        list.innerHTML += `
            <div class="merc-card" style="border-color:${isHired ? 'var(--gold)' : '#555'}; opacity:${isHired ? '1' : '0.8'};">
                <div style="font-size:30px; margin-bottom:5px;">${merc.icon}</div>
                <div style="font-weight:bold; margin-bottom:5px; color:${isHired ? 'var(--gold)' : '#fff'};">${merc.name}</div>
                <div style="font-size:9px; color:#aaa; margin-bottom:8px; line-height:1.2;">
                    공격력 <span style="color:#2ecc71;">x${merc.atkMul}</span><br>
                    체력 <span style="color:#e74c3c;">${merc.baseHp}</span>
                </div>
                ${btnHtml}
            </div>
        `;
    });
};

window.hireMercenary = function(id) {
    let merc = TOOTH_DATA.mercenaries.find(m => m.id === id);
    if (!merc) return;
    
    if (window.gold >= merc.cost) {
        window.gold -= merc.cost;
        window.activeMercenary = merc;
        try { if(typeof playSfx === 'function') playSfx('upgrade'); } catch(e){}
        if(typeof window.updateStats === 'function') window.updateStats();
        window.renderMercenaryModal();
        window.renderMercenaryCamp();
    }
};

// --- [ 4. 용병 훈련장 (다이아몬드 소모) ] ---
window.renderTrainingCamp = function() {
    const list = document.getElementById('training-list');
    const diaDisplay = document.getElementById('training-dia-display');
    if(!list || !diaDisplay) return;
    
    diaDisplay.innerText = fNum(window.dia);
    list.innerHTML = '';
    
    if(!window.trainingLevel) window.trainingLevel = 0;
    if(!window.critRateLevel) window.critRateLevel = 0;
    if(!window.critDmgLevel) window.critDmgLevel = 0;
    if(!window.splashLevel) window.splashLevel = 0;

    // 1. 체력 훈련
    let hpCost = 100 + (window.trainingLevel * 50);
    let canHp = window.dia >= hpCost;
    list.innerHTML += `
        <div class="shop-item" style="margin-bottom:10px;">
            <div class="shop-info">
                <span>❤️ 체력 강화 (Lv.${window.trainingLevel})</span>
                <span style="color:${canHp ? '#00fbff' : '#e74c3c'};">♦️ ${hpCost}</span>
            </div>
            <div class="shop-desc">모든 용병의 최대 체력 +5% 증가 (현재: +${window.trainingLevel * 5}%)</div>
            <button onclick="buyTraining('hp')" class="${canHp ? 'btn-gold' : 'btn-sm'}" style="width:100%; margin-top:5px;" ${canHp?'':'disabled'}>훈련하기</button>
        </div>
    `;

    // 2. 치명타 확률 (치아 레벨 12 이상 개방)
    if(window.highestToothLevel >= 12) {
        let crCost = 200 + (window.critRateLevel * 100);
        let crMax = window.critRateLevel >= 20; // Max 20%
        let crCan = window.dia >= crCost && !crMax;
        
        list.innerHTML += `
            <div class="shop-item" style="margin-bottom:10px;">
                <div class="shop-info">
                    <span>⚡ 치명타 확률 (Lv.${window.critRateLevel})</span>
                    <span style="color:${crCan ? '#00fbff' : (crMax ? '#aaa' : '#e74c3c')};">${crMax ? 'MAX' : '♦️ '+crCost}</span>
                </div>
                <div class="shop-desc">공격 시 2배 데미지 확률 +1% (현재: ${window.critRateLevel}%)</div>
                <button onclick="buyTraining('critRate')" class="${crCan ? 'btn-red' : 'btn-sm'}" style="width:100%; margin-top:5px;" ${crCan?'':'disabled'}>${crMax?'최대 레벨':'훈련하기'}</button>
            </div>
        `;
    }

    // 3. 치명타 피해량 (치아 레벨 15 이상 개방)
    if(window.highestToothLevel >= 15) {
        let cdCost = 300 + (window.critDmgLevel * 150);
        let cdMax = window.critDmgLevel >= 30; // Max +300% (기본 200% + 300% = 500%)
        let cdCan = window.dia >= cdCost && !cdMax;
        
        list.innerHTML += `
            <div class="shop-item" style="margin-bottom:10px;">
                <div class="shop-info">
                    <span>💥 치명타 피해량 (Lv.${window.critDmgLevel})</span>
                    <span style="color:${cdCan ? '#00fbff' : (cdMax ? '#aaa' : '#e74c3c')};">${cdMax ? 'MAX' : '♦️ '+cdCost}</span>
                </div>
                <div class="shop-desc">치명타 발동 시 피해량 +10% 추가 (현재: +${window.critDmgLevel * 10}%)</div>
                <button onclick="buyTraining('critDmg')" class="${cdCan ? 'btn-red' : 'btn-sm'}" style="width:100%; margin-top:5px;" ${cdCan?'':'disabled'}>${cdMax?'최대 레벨':'훈련하기'}</button>
            </div>
        `;
    }

    // 4. 광역(스플래시) 범위 (치아 레벨 18 이상 개방)
    if(window.highestToothLevel >= 18) {
        let spCost = 500 + (window.splashLevel * 250);
        let spMax = window.splashLevel >= 15; // Max 150px
        let spCan = window.dia >= spCost && !spMax;
        
        list.innerHTML += `
            <div class="shop-item" style="margin-bottom:10px;">
                <div class="shop-info">
                    <span>🌪️ 광역 범위 확장 (Lv.${window.splashLevel})</span>
                    <span style="color:${spCan ? '#00fbff' : (spMax ? '#aaa' : '#e74c3c')};">${spMax ? 'MAX' : '♦️ '+spCost}</span>
                </div>
                <div class="shop-desc">투사체 폭발 시 주변 적 타격 범위 +10px (현재: +${window.splashLevel * 10}px)</div>
                <button onclick="buyTraining('splash')" class="${spCan ? 'btn-red' : 'btn-sm'}" style="width:100%; margin-top:5px;" ${spCan?'':'disabled'}>${spMax?'최대 레벨':'훈련하기'}</button>
            </div>
        `;
    }
};

window.buyTraining = function(type) {
    if (type === 'hp') {
        let cost = 100 + (window.trainingLevel * 50);
        if(window.dia >= cost) { window.dia -= cost; window.trainingLevel++; }
    } else if (type === 'critRate') {
        let cost = 200 + (window.critRateLevel * 100);
        if(window.dia >= cost && window.critRateLevel < 20) { window.dia -= cost; window.critRateLevel++; }
    } else if (type === 'critDmg') {
        let cost = 300 + (window.critDmgLevel * 150);
        if(window.dia >= cost && window.critDmgLevel < 30) { window.dia -= cost; window.critDmgLevel++; }
    } else if (type === 'splash') {
        let cost = 500 + (window.splashLevel * 250);
        if(window.dia >= cost && window.splashLevel < 15) { window.dia -= cost; window.splashLevel++; }
    }
    
    try { if(typeof playSfx === 'function') playSfx('upgrade'); } catch(e){}
    if(typeof window.updateStats === 'function') window.updateStats();
    window.renderTrainingCamp();
    window.renderMercenaryCamp();
    if(typeof window.saveGame === 'function') window.saveGame();
};
