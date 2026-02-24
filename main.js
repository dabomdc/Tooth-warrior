// Version: 6.9.3 - Main Engine (Real Rankings, Partner Card, UI/Bug Fixes)

window.gold = 0; 
window.dia = 0; 
window.unlockedDungeon = 1; 
window.unlockedHellDungeon = 1; 
window.pickaxeIdx = 0;
window.autoMineLevel = 1;
window.inventory = new Array(56).fill(0);
window.maxSlots = 24; 
window.mineProgress = 0;
window.isMiningPaused = false;
window.dragStartIdx = null;
window.mercenaryIdx = 0;
window.ownedMercenaries = [0];
window.mergeProgress = 0;
window.autoMergeSpeedLevel = 1; 
window.isMuted = false;
window.masterVolume = 2; 
window.slotUpgrades = Array.from({length: 8}, () => ({ atk: 0, cd: 0, rng: 0 }));
window.globalUpgrades = { cd: 0, rng: 0 };
window.greatChanceLevel = 0; 
window.nickname = ""; 
window.highestToothLevel = 1; 
window.trainingLevels = { hp: 0, atk: 0, spd: 0, crit: 0, splashDmg: 0, splashRange: 0 }; 
window.isHellMode = false; 
window.isBossRush = false;
window.isResetting = false;

window.bestClearTimes = {};

let gameLoopInterval = null; 
let lastTapTime = 0; 
let lastTapIdx = -1;
const dragProxy = document.getElementById('drag-proxy');

const safeFNum = (val) => typeof fNum === 'function' ? fNum(val) : val;
const safeGetAtk = (lv) => typeof getAtk === 'function' ? getAtk(lv) : 10;
const safeGetIcon = (lv) => typeof getToothIcon === 'function' ? getToothIcon(lv) : "🦷";
const safeGetName = (lv) => typeof getToothName === 'function' ? getToothName(lv) : `Lv.${lv} 치아`;
const getView = () => typeof currentView !== 'undefined' ? currentView : 'mine';

window.getBaseMiningLevel = function() {
    let normalBase = Math.min(10, Math.floor((window.unlockedDungeon - 1) / 2) + 1);
    let hellBonus = 0;
    if (window.unlockedHellDungeon > 1) {
        hellBonus = Math.floor((window.unlockedHellDungeon - 1) / 2);
    }
    return Math.min(24, normalBase + hellBonus); 
};

// 🌟 밀리초를 00:00 포맷으로 바꿔주는 함수 (최고 기록 표시용 버그 픽스)
function formatClearTime(ms) {
    if (!ms || ms === Infinity) return "없음";
    let totalSec = Math.floor(ms / 1000);
    let m = String(Math.floor(totalSec / 60)).padStart(2, '0');
    let s = String(totalSec % 60).padStart(2, '0');
    return `${m}:${s}`;
}

window.onload = () => { 
    loadGame(); 
    setupMiningTouch(); 
    if(typeof switchView === 'function') switchView('mine'); 

    const introSeen = localStorage.getItem('toothIntroSeen_v5');
    if (introSeen === 'true') {
        const layer = document.getElementById('intro-layer');
        if(layer) layer.style.display = 'none';
        checkNicknameAndStart();
    }
    const btn = document.getElementById('mine-toggle-btn');
    if(btn) btn.innerText = window.isMiningPaused ? "▶️ 자동채굴/합성 재개" : "⏸️ 자동채굴/합성 정지"; 
};

window.startIntro = function() {
    const btnLayer = document.getElementById('start-btn-layer');
    if(btnLayer) btnLayer.style.display = 'none';
    
    const vid = document.getElementById('intro-video');
    const skipBtn = document.getElementById('skip-btn');
    if(vid) {
        vid.style.display = 'block';
        if(skipBtn) skipBtn.style.display = 'block';
        vid.volume = window.masterVolume ? window.masterVolume * 0.3 : 0.6; 
        vid.muted = window.isMuted; 
        vid.play().catch(e => { window.finishIntro(); });
        vid.onended = () => { setTimeout(window.finishIntro, 500); };
    } else { window.finishIntro(); }
};

window.skipIntro = function() { 
    const vid = document.getElementById('intro-video');
    if(vid) vid.pause(); 
    window.finishIntro(); 
};

window.finishIntro = function() {
    const layer = document.getElementById('intro-layer');
    if(layer) {
        layer.style.transition = 'opacity 1.5s ease';
        layer.style.opacity = '0';
        setTimeout(() => {
            layer.style.display = 'none';
            localStorage.setItem('toothIntroSeen_v5', 'true');
            window.checkNicknameAndStart();
        }, 1500);
    } else { window.checkNicknameAndStart(); }
};

window.checkNicknameAndStart = function() {
    if (!window.nickname) {
        const nickInput = document.getElementById('nickname-input');
        if (nickInput) {
            nickInput.value = "User-" + Math.random().toString(36).substr(2, 4);
            document.getElementById('nickname-modal').style.display = 'flex';
        }
    } else { startGameLoop(); }
};

window.confirmNickname = function() {
    const input = document.getElementById('nickname-input').value.trim();
    if(input.length > 0) {
        window.nickname = input;
        document.getElementById('nickname-modal').style.display = 'none';
        saveGame(); startGameLoop(); 
    } else { alert("닉네임을 입력해주세요."); }
};

window.updateNickname = function() {
    const input = document.getElementById('settings-nickname-input').value.trim();
    if(input.length > 0) {
        window.nickname = input;
        alert("닉네임이 성공적으로 변경되었습니다: " + window.nickname);
        document.getElementById('settings-nickname-input').value = "";
        
        const nickDisp = document.getElementById('current-nickname-display');
        if(nickDisp) nickDisp.innerText = window.nickname;
        
        saveGame();
    } else {
        alert("새로운 닉네임을 입력해주세요.");
    }
};

function startGameLoop() {
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    gameLoopInterval = setInterval(gameLoop, 50);
}
window.startGameLoop = startGameLoop;

function saveGame() {
    if (window.isResetting) return; 
    const data = { 
        gold: window.gold, dia: window.dia, maxSlots: window.maxSlots, inventory: window.inventory, 
        unlockedDungeon: window.unlockedDungeon, unlockedHellDungeon: window.unlockedHellDungeon,
        pickaxeIdx: window.pickaxeIdx, autoMineLevel: window.autoMineLevel,
        mercenaryIdx: window.mercenaryIdx, ownedMercenaries: window.ownedMercenaries, autoMergeSpeedLevel: window.autoMergeSpeedLevel, 
        isMuted: window.isMuted, masterVolume: window.masterVolume, slotUpgrades: window.slotUpgrades, globalUpgrades: window.globalUpgrades, 
        greatChanceLevel: window.greatChanceLevel, nickname: window.nickname, 
        highestToothLevel: window.highestToothLevel, trainingLevels: window.trainingLevels,
        bestClearTimes: window.bestClearTimes,
        lastTime: Date.now(), isMiningPaused: window.isMiningPaused 
    };
    localStorage.setItem('toothSaveV690', JSON.stringify(data));
}
window.saveGame = saveGame;

function loadGame() {
    try {
        const saved = localStorage.getItem('toothSaveV690') || localStorage.getItem('toothSaveV680');
        let d = saved ? JSON.parse(saved) : null;
        if (d) {
            window.gold = d.gold || 0; window.dia = d.dia || 0;
            window.maxSlots = d.maxSlots || 24; window.inventory = d.inventory || new Array(56).fill(0);
            window.unlockedDungeon = d.unlockedDungeon || 1; 
            window.unlockedHellDungeon = d.unlockedHellDungeon || 1;
            window.pickaxeIdx = d.pickaxeIdx || 0;
            window.autoMineLevel = d.autoMineLevel || 1; window.isMiningPaused = d.isMiningPaused || false;
            window.mercenaryIdx = d.mercenaryIdx || 0; window.ownedMercenaries = d.ownedMercenaries || [0];
            window.autoMergeSpeedLevel = d.autoMergeSpeedLevel || 1; window.isMuted = d.isMuted || false;
            window.masterVolume = d.masterVolume || 2; 
            window.highestToothLevel = Math.min(24, d.highestToothLevel || 1); 
            window.trainingLevels = d.trainingLevels || { hp: 0, atk: 0, spd: 0, crit: 0, splashDmg: 0, splashRange: 0 };
            window.bestClearTimes = d.bestClearTimes || {}; 
            
            if (d.slotUpgrades) window.slotUpgrades = d.slotUpgrades;
            if (d.globalUpgrades) window.globalUpgrades = d.globalUpgrades;
            if (d.greatChanceLevel) window.greatChanceLevel = d.greatChanceLevel;
            if (d.nickname) window.nickname = d.nickname;
            
            if (!window.isMiningPaused && d.lastTime) {
                const offTime = (Date.now() - d.lastTime) / 1000;
                const miningSpeed = Math.max(1, 10 - ((window.autoMineLevel - 1) * 0.2));
                const minedCount = Math.floor(offTime / miningSpeed); 
                const currentMaxTime = Math.max(2000, 30000 - ((window.autoMergeSpeedLevel - 1) * 500));
                const merges = Math.floor((offTime * 1000) / currentMaxTime);
                for(let k=0; k < merges; k++) autoMergeLowest();
                for(let i=0; i < minedCount; i++) { if(!addMinedItem()) break; }
            }
        }
        cleanupInventory();
        if(typeof updateSoundBtn === 'function') updateSoundBtn();
        updatePickaxeVisual();
    } catch (e) { console.error("Load Error:", e); }
}
window.loadGame = loadGame;

function gameLoop() { 
    if(!window.isMiningPaused) { 
        const miningSpeedSec = Math.max(1, 10 - ((window.autoMineLevel - 1) * 0.2)); 
        const tickAmt = 100 / (miningSpeedSec * 20); 
        processMining(tickAmt); 
        
        const currentMaxTime = Math.max(2000, 30000 - ((window.autoMergeSpeedLevel - 1) * 500)); 
        const increment = (50 / currentMaxTime) * 100; 
        window.mergeProgress += increment; 
        
        if (window.mergeProgress >= 100) { 
            window.mergeProgress = 0; 
            autoMergeLowest(); 
        } 
    } 
    updateUI(); 
}
window.gameLoop = gameLoop;

function processMining(amt) { 
    window.mineProgress += amt; 
    if (window.mineProgress >= 100) { 
        window.mineProgress = 100; 
        if (addMinedItem()) { window.mineProgress = 0; } 
    } 
    updateUI(); 
}
window.processMining = processMining;

function addMinedItem() { 
    cleanupInventory();
    let emptyIdx = -1; 
    for(let i=0; i<window.maxSlots; i++) { if(window.inventory[i] === 0) { emptyIdx = i; break; } } 
    if (emptyIdx === -1) return false; 
    
    let resultLv = window.getBaseMiningLevel(); 
    if(typeof TOOTH_DATA !== 'undefined' && TOOTH_DATA.pickaxes[window.pickaxeIdx]) {
        if (Math.random() < TOOTH_DATA.pickaxes[window.pickaxeIdx].luck) resultLv += 1; 
    }
    
    window.inventory[emptyIdx] = Math.min(24, resultLv);
    checkHighestTier(resultLv);

    if(getView() === 'mine') renderInventory(); 
    try { if(typeof playSfx === 'function') playSfx('mine'); } catch(e){}
    return true; 
}
window.addMinedItem = addMinedItem;

function autoMergeLowest() { 
    let levelCounts = {}; 
    for(let i=8; i<window.maxSlots; i++) { 
        const lv = window.inventory[i]; 
        if (lv > 0) levelCounts[lv] = (levelCounts[lv] || 0) + 1; 
    } 
    let targetLv = -1; 
    const levels = Object.keys(levelCounts).map(Number).sort((a,b) => a - b); 
    for (let lv of levels) { if (levelCounts[lv] >= 2) { targetLv = lv; break; } } 
    if (targetLv !== -1) massMerge(targetLv, true); 
}
window.autoMergeLowest = autoMergeLowest;

function massMerge(lv, once = false) { 
    let indices = []; 
    window.inventory.forEach((val, idx) => { if(idx >= 8 && val === lv && idx < window.maxSlots) indices.push(idx); }); 
    if(indices.length < 2) return; 
    try { if(typeof playSfx === 'function') playSfx('merge'); } catch(e){}
    
    const loopCount = once ? 1 : Math.floor(indices.length / 2); 

    for(let i=0; i < loopCount; i++) { 
        let idx1 = indices[2*i]; 
        let idx2 = indices[2*i+1]; 
        let nextLv = Math.min(24, lv + 1); 
        window.inventory[idx2] = nextLv; 
        window.inventory[idx1] = 0; 
        checkHighestTier(nextLv); 
    } 
    if(getView() === 'mine') renderInventory(); 
}
window.massMerge = massMerge;

function checkHighestTier(level) {
    if (level > window.highestToothLevel && level <= 24) {
        window.highestToothLevel = level;
        saveGame();
        if ((level - 1) % 3 === 0 && level > 1) {
            if(typeof showTierUnlock === 'function') showTierUnlock(level);
        }
    }
}
window.checkHighestTier = checkHighestTier;

function updateUI() { 
    const gd = document.getElementById('gold-display');
    if(gd) gd.innerText = safeFNum(window.gold); 
    const dd = document.getElementById('dia-display');
    if(dd) dd.innerText = safeFNum(window.dia); 
    
    const m = document.getElementById('mine-bar'); 
    if(m) m.style.width = window.mineProgress + '%'; 
    const g = document.getElementById('merge-bar'); 
    if(g) g.style.width = window.mergeProgress + '%'; 
    
    const pn = document.getElementById('pickaxe-name');
    if(pn && typeof TOOTH_DATA !== 'undefined' && TOOTH_DATA.pickaxes[window.pickaxeIdx]) {
        pn.innerText = TOOTH_DATA.pickaxes[window.pickaxeIdx].name; 
    }
}
window.updateUI = updateUI;

function renderInventory() { 
    const grid = document.getElementById('inventory-grid'); 
    if(!grid) return;
    grid.innerHTML = ''; 
    for (let i = 0; i < 56; i++) { 
        const slot = document.createElement('div'); 
        slot.className = `slot ${i < 8 ? 'attack-slot' : ''} ${i >= window.maxSlots ? 'locked-slot' : ''}`; 
        slot.dataset.index = i; 
        slot.id = `slot-${i}`; 
        
        if (i < window.maxSlots && window.inventory[i] > 0) { 
            const dmg = safeFNum(safeGetAtk(window.inventory[i])); 
            slot.innerHTML = `<span class="dmg-label">⚔️${dmg}</span>${safeGetIcon(window.inventory[i])}<span class="lv-text">Lv.${window.inventory[i]}</span>`; 
        } else if (i >= window.maxSlots) { slot.innerHTML = "🔒"; }
        
        if (i < window.maxSlots) { 
            slot.onpointerdown = (e) => { 
                if (window.inventory[i] > 0) { 
                    const currentTime = new Date().getTime(); 
                    const tapLength = currentTime - lastTapTime; 
                    if (tapLength < 300 && tapLength > 0 && lastTapIdx === i) { 
                        e.preventDefault(); 
                        massMerge(window.inventory[i]); 
                        lastTapTime = 0; return; 
                    } 
                    lastTapTime = currentTime; 
                    lastTapIdx = i; 
                    e.preventDefault(); 
                    
                    window.dragStartIdx = i; 
                    slot.classList.add('picked'); 
                    dragProxy.innerHTML = safeGetIcon(window.inventory[i]); 
                    dragProxy.style.display = 'block'; 
                    moveProxy(e); 
                    slot.setPointerCapture(e.pointerId); 
                } 
            }; 
            slot.onpointermove = (e) => { if (window.dragStartIdx !== null) moveProxy(e); }; 
            slot.onpointerup = (e) => { 
                if (window.dragStartIdx !== null) { 
                    slot.releasePointerCapture(e.pointerId); 
                    slot.classList.remove('picked'); 
                    dragProxy.style.display = 'none'; 
                    const elements = document.elementsFromPoint(e.clientX, e.clientY); 
                    const targetSlot = elements.find(el => el.classList.contains('slot') && el !== slot); 
                    if (targetSlot) { 
                        const toIdx = parseInt(targetSlot.dataset.index); 
                        if (toIdx < window.maxSlots) handleMoveOrMerge(window.dragStartIdx, toIdx); 
                    } 
                    document.querySelectorAll('.slot').forEach(s => s.classList.remove('drag-target')); 
                    window.dragStartIdx = null; 
                } 
            }; 
        } 
        grid.appendChild(slot); 
    } 
}
window.renderInventory = renderInventory;

function handleMoveOrMerge(from, to) { 
    if (from === to) return; 
    if (window.inventory[from] === window.inventory[to] && window.inventory[from] > 0) { 
        if (window.inventory[from] >= 24) { alert("최대 레벨입니다!"); return; } 
        let nextLv = Math.min(24, window.inventory[from] + 1); 
        window.inventory[to] = nextLv; 
        window.inventory[from] = 0; 
        checkHighestTier(nextLv);
        try { if(typeof playSfx === 'function') playSfx('merge'); } catch(e){}
    } else { 
        [window.inventory[from], window.inventory[to]] = [window.inventory[to], window.inventory[from]]; 
    } 
    renderInventory(); saveGame(); 
}
window.handleMoveOrMerge = handleMoveOrMerge;

function moveProxy(e) { 
    dragProxy.style.left = e.clientX + 'px'; 
    dragProxy.style.top = e.clientY + 'px'; 
    document.querySelectorAll('.slot').forEach(s => s.classList.remove('drag-target')); 
    const elements = document.elementsFromPoint(e.clientX, e.clientY); 
    const targetSlot = elements.find(el => el.classList.contains('slot')); 
    if(targetSlot && parseInt(targetSlot.dataset.index) < window.maxSlots) targetSlot.classList.add('drag-target'); 
}
window.moveProxy = moveProxy;

function cleanupInventory() {
    const minMiningLv = window.getBaseMiningLevel();
    let cleared = false;
    for(let i=0; i < window.maxSlots; i++) {
        if(window.inventory[i] > 0 && window.inventory[i] < minMiningLv) {
            window.inventory[i] = 0; cleared = true;
        }
    }
    if(cleared && getView() === 'mine') renderInventory();
}
window.cleanupInventory = cleanupInventory;

window.sortInventory = function() { 
    let items = window.inventory.filter(v => v > 0); 
    items.sort((a, b) => b - a); 
    window.inventory.fill(0); 
    items.forEach((v, i) => { if(i < 56) window.inventory[i] = v; }); 
    renderInventory(); saveGame(); 
};

function updatePickaxeVisual() { 
    const miner = document.getElementById('miner-char');
    if(miner && typeof TOOTH_DATA !== 'undefined' && TOOTH_DATA.pickaxes[window.pickaxeIdx]) {
        miner.innerText = TOOTH_DATA.pickaxes[window.pickaxeIdx].icon || "⛏️"; 
    }
}
window.updatePickaxeVisual = updatePickaxeVisual;

function setupMiningTouch() { 
    const mineArea = document.getElementById('mine-rock-area'); 
    if(!mineArea) return;
    mineArea.addEventListener('pointerdown', (e) => { 
        e.preventDefault(); 
        const miner = document.getElementById('miner-char'); 
        miner.style.animation = 'none'; miner.offsetHeight; 
        miner.style.animation = 'hammer 0.08s ease-in-out'; 
        try { if(typeof playSfx === 'function') playSfx('mine'); } catch(e){}
        
        let miningPower = 15 + (window.pickaxeIdx * 10);
        if (window.highestToothLevel >= 4 && Math.random() < 0.2) { 
            let tapGold = window.getBaseMiningLevel() * 50;
            window.gold += tapGold;
            const worldDiv = document.getElementById('battle-world');
            if(!worldDiv || worldDiv.style.display === 'none' || !document.getElementById('battle-screen').offsetParent) {
                const txt = document.createElement('div');
                txt.className = 'gold-text';
                txt.innerText = `💰+${safeFNum(tapGold)}`;
                txt.style.left = e.clientX + 'px'; txt.style.top = (e.clientY - 30) + 'px';
                txt.style.pointerEvents = 'none';
                document.body.appendChild(txt);
                setTimeout(() => txt.remove(), 800);
            }
        }
        if (window.highestToothLevel >= 4) miningPower *= 1.2;
        processMining(miningPower); 
        
        const effect = document.createElement('div'); 
        effect.className = 'hit-effect'; effect.innerText = "💥"; 
        effect.style.left = e.clientX + 'px'; effect.style.top = e.clientY + 'px'; 
        effect.style.pointerEvents = 'none';
        document.body.appendChild(effect); 
        setTimeout(() => effect.remove(), 400); 
        
        updateUI(); saveGame();
    }); 
}
window.setupMiningTouch = setupMiningTouch;

// 🌟 신규 [파트너 카드] 렌더링 함수 (메인 던전 탭)
window.renderPartnerCard = function() {
    const card = document.getElementById('equipped-mercenary-card');
    if(!card || typeof TOOTH_DATA === 'undefined') return;
    
    const merc = TOOTH_DATA.mercenaries[window.mercenaryIdx];
    if(!merc) return;

    let trainingHpBonus = window.trainingLevels && window.trainingLevels.hp ? window.trainingLevels.hp * 5 : 0;
    let trainingAtkBonus = window.trainingLevels && window.trainingLevels.atk ? window.trainingLevels.atk * 10 : 0;
    let trainingSpdBonus = window.trainingLevels && window.trainingLevels.spd ? window.trainingLevels.spd * 0.1 : 0;

    let finalSpd = (merc.spd + trainingSpdBonus).toFixed(1);
    let finalHp = Math.floor(merc.baseHp * (1 + (trainingHpBonus/100)));

    card.innerHTML = `
        <div style="font-size:45px; display:flex; align-items:center; justify-content:center; width:60px; filter:drop-shadow(0 0 5px rgba(255,255,255,0.3));">${merc.icon}</div>
        <div style="flex:1;">
            <div style="font-size:15px; font-weight:bold; margin-bottom:6px; color:var(--gold); border-bottom:1px solid #444; padding-bottom:4px;">
                ${merc.name} <span style="font-size:10px; color:#2ecc71; vertical-align:middle; border:1px solid #2ecc71; padding:1px 3px; border-radius:3px; margin-left:5px;">고용중</span>
            </div>
            <div style="font-size:11px; color:#ddd; line-height:1.6;">
                ⚔️ 공격력: x${merc.atkMul} <span style="color:#2ecc71; font-weight:bold;">(+${trainingAtkBonus}%)</span><br>
                ❤️ 최대체력: ${safeFNum(merc.baseHp)} <span style="color:#2ecc71; font-weight:bold;">(+${trainingHpBonus}%)</span><br>
                💨 이동속도: ${merc.spd} <span style="color:#2ecc71; font-weight:bold;">(+${trainingSpdBonus.toFixed(1)})</span>
            </div>
        </div>
    `;
};

// [용병 길드 팝업창 전용] 용병 리스트 렌더링
window.renderMercenaryCamp = function() { 
    const camp = document.getElementById('mercenary-list'); 
    if(!camp || typeof TOOTH_DATA === 'undefined') return;
    camp.innerHTML = ''; 
    const maxOwned = Math.max(...window.ownedMercenaries); 

    TOOTH_DATA.mercenaries.forEach(merc => { 
        if (merc.id > maxOwned + 1) return; 
        const div = document.createElement('div'); 
        div.className = 'merc-card'; 
        const isOwned = window.ownedMercenaries.includes(merc.id); 
        const isEquipped = window.mercenaryIdx === merc.id; 
        
        div.innerHTML = `
            <div style="font-size:30px; margin-bottom:5px;">${merc.icon}</div>
            <div style="font-size:12px; font-weight:bold; color:var(--gold); margin-bottom:3px;">${merc.name}</div>
            <div style="font-size:10px; color:#aaa; margin-bottom:2px;">⚔️ x${merc.atkMul} | ❤️ ${safeFNum(merc.baseHp)}</div>
            <div style="font-size:10px; color:#00fbff;">👟 이속: ${merc.spd}</div>
        `; 
        
        if (isEquipped) {
            div.style.border = '2px solid #2ecc71'; 
            div.innerHTML += `<button class="btn-sm" style="background:#2ecc71; color:white; width:100%; margin-top:8px; cursor:default;">고용중</button>`;
        } else if (isOwned) {
            div.innerHTML += `<button onclick="window.equipMerc(${merc.id})" class="btn-sm" style="background:#777; width:100%; margin-top:8px;">대기중</button>`; 
        } else {
            div.innerHTML += `<button onclick="window.buyMerc(${merc.id}, ${merc.cost})" class="btn-gold" style="padding:6px 5px; font-size:12px; width:100%; margin-top:8px;">${safeFNum(merc.cost)}G</button>`; 
        }
        camp.appendChild(div); 
    }); 
};

window.buyMerc = function(id, cost) { 
    if(window.gold >= cost) { 
        window.gold -= cost; 
        try { if(typeof playSfx === 'function') playSfx('upgrade'); } catch(e){} 
        window.ownedMercenaries.push(id); 
        window.renderMercenaryCamp(); 
        document.getElementById('guild-gold-display').innerText = (window.fNum ? window.fNum(window.gold) : window.gold) + 'G';
        updateUI(); saveGame();
    } else { alert("골드가 부족합니다!"); } 
};
window.equipMerc = function(id) { 
    window.mercenaryIdx = id; 
    window.renderMercenaryCamp(); 
    if(window.renderPartnerCard) window.renderPartnerCard();
    saveGame(); 
};

// 🌟 던전 목록 (최고 기록 시간 포맷 변경 및 보상 텍스트 레벨 명시)
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

            let recKey = isHell ? `hellboss_${i}` : `boss_${i}`;
            let recTime = window.bestClearTimes[recKey];
            let recordText = recTime ? `<span style="color:#00fbff;">🏆 최고 기록: ${formatClearTime(recTime)}</span>` : `<span style="color:#888;">🏆 최고 기록: 없음</span>`;

            if (isUnlocked) {
                div.innerHTML = `<h4>🔥 ${name} 보스 토벌전</h4>
                <p style="margin:5px 0 0 0; font-size:12px; color:#ff8888;">입장료: <span style="color:var(--gold);">${safeFNum(goldFee)}G</span>, ♦️${diaFee}</p>
                <p style="color:#f1c40f; font-size:11px; margin:5px 0 0 0;">보스 5연속 처치 시 엄청난 보상!</p>
                <p style="margin:5px 0 0 0; font-size:11px; font-weight:bold;">${recordText}</p>`;
                div.onclick = () => { if(typeof startDungeon === 'function') startDungeon(i * 5); };
            } else {
                div.innerHTML = `<h4>🔒 잠김</h4><p style="margin:5px 0 0 0; font-size:12px; color:#888;">${isHell ? 'HELL ' : '일반 '}던전 ${reqLevel-1}단계 클리어 시 열림</p>`;
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

            let recKey = isHell ? `hell_${idx}` : `normal_${idx}`;
            let recTime = window.bestClearTimes[recKey];
            let recordText = recTime ? `<span style="color:#00fbff;">🏆 최고 기록: ${formatClearTime(recTime)}</span>` : `<span style="color:#888;">🏆 최고 기록: 없음</span>`;

            let levelUpText = `<p style="color:#888; font-size:11px; margin:5px 0 0 0;">(다음 단계 클리어 시 채굴 레벨 상승)</p>`;
            if ((idx + 1) % 2 === 0) {
                let curBase = isHell ? Math.min(10, Math.floor((window.unlockedDungeon - 1) / 2) + 1) : 0;
                let nextLv = Math.min(24, curBase + Math.floor((idx + 2) / 2));
                if(!isHell) nextLv = Math.min(10, Math.floor((idx + 2) / 2) + 1);
                
                let nextName = safeGetName(nextLv);
                // 🌟 신규: 보상 텍스트에 "Lv.X" 추가
                levelUpText = `<p style="color:#f1c40f; font-size:11px; margin:5px 0 0 0; font-weight:bold;">✨ 클리어 시 [Lv.${nextLv} ${nextName}] 확정 채굴!</p>`;
            }

            if (isUnlocked) { 
                div.innerHTML = `<h4>⚔️ Lv.${idx+1} ${name}</h4>
                <p style="margin:5px 0 0 0; font-size:12px; color:#aaa;">권장 공격력: ${safeFNum(recAtk)}+</p>
                ${levelUpText}
                <p style="margin:5px 0 0 0; font-size:11px; font-weight:bold;">${recordText}</p>`;
                div.onclick = () => { if(typeof startDungeon === 'function') startDungeon(idx); };
            } else { 
                div.innerHTML = `<h4>🔒 잠김</h4><p style="margin:5px 0 0 0; font-size:12px; color:#888;">이전 던전 클리어 시 열림</p>`; 
            } 
            list.appendChild(div); 
        }); 
    }
};

// 🌟 신규: 500명 현실적 랭킹 및 내 주변만 노출하기 기능
window.generateRankings = function() {
    const list = document.getElementById('ranking-list');
    if(!list || typeof TOOTH_DATA === 'undefined') return;
    
    // 네임드 유저 3명
    let ranks = [
        { name: "치아신", d: 40, p: 999999999 }, 
        { name: "임플란트마스터", d: 35, p: 150000000 },
        { name: "초보원장", d: 5, p: 15000 }
    ];
    
    // 무작위 랜덤 유저 497명 생성 (총 500명)
    const prefixes = ["User-", "Guest-", "Player", "Dent", "Dr.", "Tooth_"];
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    
    for(let i=0; i<497; i++) {
        let randD = Math.floor(Math.random() * 40) + 1; // 헬모드 포함 레벨 스펙트럼 (1~40)
        // 헬모드(20이상) 진입 시 전투력이 기하급수적으로 높아지도록 점수 곡선 세팅
        let randP = Math.floor(Math.random() * 100000) + (Math.pow(1.6, randD) * 1000);
        
        let randomStr = "";
        for(let j=0; j<4; j++) randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
        let rName = prefixes[Math.floor(Math.random()*prefixes.length)] + randomStr;
        
        ranks.push({ name: rName, d: randD, p: randP });
    }

    // 내 전투력 계산
    let myPower = safeGetAtk(window.highestToothLevel);
    if (TOOTH_DATA.mercenaries[window.mercenaryIdx]) myPower *= TOOTH_DATA.mercenaries[window.mercenaryIdx].atkMul;
    let totalDungeon = window.unlockedDungeon + (window.unlockedHellDungeon > 1 ? window.unlockedHellDungeon - 1 : 0);
    
    let myData = { name: window.nickname || "나", d: totalDungeon, p: myPower, isMe: true };
    ranks.push(myData);
    
    // 전투력 순 정렬
    ranks.sort((a, b) => b.p - a.p);
    
    let html = ''; 
    let myRank = ranks.findIndex(r => r.isMe);
    
    ranks.forEach((r, idx) => {
        // 1위 ~ 30위까지는 무조건 보여줌. 
        // 또는 내 주변 위아래 2명(총 5명)만 보여줌.
        if (idx < 30 || Math.abs(idx - myRank) <= 2) {
            
            // 30위와 내 주변 순위 사이에 간격이 있다면 말줄임표(...) 추가
            if (idx > 30 && idx === myRank - 2) {
                html += `<div style="text-align:center; color:#555; padding:10px 0; font-weight:bold;">⋮</div>`;
            }
            
            let colorStyle = r.isMe ? 'color:var(--gold); font-weight:bold; background:rgba(241,196,15,0.1);' : 'color:#ccc;';
            let rankStr = (idx === 0) ? '🥇 1' : (idx === 1) ? '🥈 2' : (idx === 2) ? '🥉 3' : `${idx+1}`;
            
            html += `<div style="display:flex; justify-content:space-between; padding:10px 5px; border-bottom:1px solid #333; ${colorStyle}">
                <span style="width:15%;">${rankStr}</span>
                <span style="flex:1; text-align:center; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${r.name}</span>
                <span style="width:20%; text-align:center;">Lv.${r.d}</span>
                <span style="width:25%; text-align:right;">${safeFNum(r.p)}</span>
            </div>`;
        }
    });
    
    list.innerHTML = html;
    const rankDisp = document.getElementById('my-rank-display');
    if(rankDisp) rankDisp.innerText = `나의 현재 순위: ${myRank + 1}위 (전투력: ${safeFNum(myPower)})`;
};

window.toggleMining = function() { 
    window.isMiningPaused = !window.isMiningPaused; 
    const btn = document.getElementById('mine-toggle-btn');
    if(btn) btn.innerText = window.isMiningPaused ? "▶️ 자동채굴/합성 재개" : "⏸️ 자동채굴/합성 정지"; 
    saveGame(); 
};

window.checkCoupon = function(code) { 
    if (code === "100b" || code === "RICH100B") { window.gold += 100000000000; alert("치트키 적용!"); updateUI(); saveGame(); } 
    else if (code === "DIA100") { window.dia += 10000; alert("다이아 치트 적용!"); updateUI(); saveGame(); }
    else if (code === "TEST") { 
        window.gold += 1e25; 
        window.dia += 999999; 
        alert("테스트용 절대 재화가 지급되었습니다!"); 
        updateUI(); saveGame();
    }
    else { alert("유효하지 않은 쿠폰입니다."); } 
};

// 🌟 클립보드 복사된 코드를 붙여넣는 함수 (버그 수정됨)
window.importSave = function() { 
    const str = prompt("클립보드에 복사해 둔 세이브 코드를 붙여넣어 주세요:"); 
    if (str) { 
        try { 
            const decoded = decodeURIComponent(escape(atob(str))); 
            // 검증: 파싱이 제대로 되는 json 형태인지 확인
            JSON.parse(decoded); 
            localStorage.setItem('toothSaveV690', decoded); 
            alert("세이브 데이터가 성공적으로 복원되었습니다!\n게임을 재시작합니다.");
            location.reload(); 
        } catch (e) { 
            alert("잘못된 코드이거나 복사 과정에서 누락된 글자가 있습니다. 코드를 다시 확인해 주세요."); 
        } 
    } 
};
