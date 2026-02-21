// Version: 6.7.2 - Main Engine (Crash & Bug Fixes)

window.gold = 0; 
window.dia = 0; 
window.unlockedDungeon = 1; 
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
window.trainingLevels = { hp: 0, atk: 0, spd: 0 }; 
window.isHellMode = false; 
window.isResetting = false;

let gameLoopInterval = null; 
let lastTapTime = 0; 
let lastTapIdx = -1;
const dragProxy = document.getElementById('drag-proxy');

// --- [ 1. 초기화 및 세이브/로드 ] ---
window.onload = () => { 
    loadGame(); 
    setupMiningTouch(); 
    if(window.switchView) window.switchView('mine'); 

    const introSeen = localStorage.getItem('toothIntroSeen_v3');
    if (introSeen === 'true') {
        document.getElementById('intro-layer').style.display = 'none';
        checkNicknameAndStart();
    }
};

window.startIntro = function() {
    document.getElementById('start-btn-layer').style.display = 'none';
    const vid = document.getElementById('intro-video');
    vid.style.display = 'block';
    document.getElementById('skip-btn').style.display = 'block';
    vid.volume = window.masterVolume ? window.masterVolume * 0.3 : 0.6; 
    vid.muted = window.isMuted; 
    vid.play().catch(e => { finishIntro(); });
    vid.onended = () => { setTimeout(finishIntro, 500); };
};

window.skipIntro = function() { document.getElementById('intro-video').pause(); finishIntro(); };

function finishIntro() {
    const layer = document.getElementById('intro-layer');
    layer.style.transition = 'opacity 1.5s ease';
    layer.style.opacity = '0';
    setTimeout(() => {
        layer.style.display = 'none';
        localStorage.setItem('toothIntroSeen_v3', 'true');
        checkNicknameAndStart();
    }, 1500);
}

function checkNicknameAndStart() {
    if (!window.nickname) {
        const nickInput = document.getElementById('nickname-input');
        if (nickInput) {
            nickInput.value = "User-" + Math.random().toString(36).substr(2, 4);
            document.getElementById('nickname-modal').style.display = 'flex';
        }
    } else { startGameLoop(); }
}

window.confirmNickname = function() {
    const input = document.getElementById('nickname-input').value.trim();
    if(input.length > 0) {
        window.nickname = input;
        document.getElementById('nickname-modal').style.display = 'none';
        saveGame(); startGameLoop(); 
    } else { alert("닉네임을 입력해주세요."); }
};

function startGameLoop() {
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    gameLoopInterval = setInterval(gameLoop, 50);
}

window.saveGame = function() {
    if (window.isResetting) return; 
    const data = { 
        gold: window.gold, dia: window.dia, maxSlots: window.maxSlots, inventory: window.inventory, 
        unlockedDungeon: window.unlockedDungeon, pickaxeIdx: window.pickaxeIdx, autoMineLevel: window.autoMineLevel,
        mercenaryIdx: window.mercenaryIdx, ownedMercenaries: window.ownedMercenaries, autoMergeSpeedLevel: window.autoMergeSpeedLevel, 
        isMuted: window.isMuted, masterVolume: window.masterVolume, slotUpgrades: window.slotUpgrades, globalUpgrades: window.globalUpgrades, 
        greatChanceLevel: window.greatChanceLevel, nickname: window.nickname, 
        highestToothLevel: window.highestToothLevel, trainingLevels: window.trainingLevels,
        lastTime: Date.now(), isMiningPaused: window.isMiningPaused 
    };
    localStorage.setItem('toothSaveV672', JSON.stringify(data));
};

function loadGame() {
    try {
        const saved = localStorage.getItem('toothSaveV672') || localStorage.getItem('toothSaveV671') || localStorage.getItem('toothSaveV670');
        let d = saved ? JSON.parse(saved) : null;
        if (d) {
            window.gold = d.gold || 0; 
            window.dia = d.dia || 0;
            window.maxSlots = d.maxSlots || 24; 
            window.inventory = d.inventory || new Array(56).fill(0);
            window.unlockedDungeon = d.unlockedDungeon || 1; 
            window.pickaxeIdx = d.pickaxeIdx || 0;
            window.autoMineLevel = d.autoMineLevel || 1; 
            window.isMiningPaused = d.isMiningPaused || false;
            window.mercenaryIdx = d.mercenaryIdx || 0; 
            window.ownedMercenaries = d.ownedMercenaries || [0];
            window.autoMergeSpeedLevel = d.autoMergeSpeedLevel || 1;
            window.isMuted = d.isMuted || false;
            window.masterVolume = d.masterVolume || 2;
            window.highestToothLevel = d.highestToothLevel || 1;
            window.trainingLevels = d.trainingLevels || { hp: 0, atk: 0, spd: 0 };
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
        if(window.updateSoundBtn) window.updateSoundBtn();
        updatePickaxeVisual();
        if(window.highestToothLevel >= 36) {
            const hellContainer = document.getElementById('hell-mode-toggle-container');
            if(hellContainer) hellContainer.style.display = 'flex';
        }
    } catch (e) { console.error("Load Game Error:", e); }
}

// --- [ 2. 핵심 루프 (채굴 & 합성) ] ---
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

function processMining(amt) { 
    window.mineProgress += amt; 
    if (window.mineProgress >= 100) { 
        window.mineProgress = 100; 
        if (addMinedItem()) { window.mineProgress = 0; } 
    } 
    updateUI(); 
}

function addMinedItem() { 
    cleanupInventory();
    let emptyIdx = -1; 
    for(let i=0; i<window.maxSlots; i++) { if(window.inventory[i] === 0) { emptyIdx = i; break; } } 
    if (emptyIdx === -1) return false; 
    
    const pick = TOOTH_DATA.pickaxes[window.pickaxeIdx]; 
    let resultLv = window.unlockedDungeon; 
    if (Math.random() < pick.luck) resultLv += 1; 
    
    window.inventory[emptyIdx] = resultLv;
    checkHighestTier(resultLv);

    if(window.currentView === 'mine') renderInventory(); 
    if(window.playSfx) window.playSfx('mine'); 
    return true; 
}

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

function massMerge(lv, once = false) { 
    let indices = []; 
    window.inventory.forEach((val, idx) => { if(idx >= 8 && val === lv && idx < window.maxSlots) indices.push(idx); }); 
    if(indices.length < 2) return; 
    if(window.playSfx) window.playSfx('merge'); 
    
    const loopCount = once ? 1 : Math.floor(indices.length / 2); 
    let extraGreatChance = (window.highestToothLevel >= 21) ? 0.05 : 0;
    const currentGreatChance = (window.greatChanceLevel * 0.02) + extraGreatChance;

    for(let i=0; i < loopCount; i++) { 
        let idx1 = indices[2*i]; 
        let idx2 = indices[2*i+1]; 
        
        const isGreat = Math.random() < currentGreatChance; 
        let nextLv = isGreat ? lv + 2 : lv + 1; 
        nextLv = Math.min(40, nextLv); 
        
        window.inventory[idx2] = nextLv; 
        window.inventory[idx1] = 0; 
        checkHighestTier(nextLv); 
        if(isGreat && window.currentView === 'mine') triggerGreatSuccess(idx2); 
    } 
    if(window.currentView === 'mine') renderInventory(); 
}
window.massMerge = massMerge;

function checkHighestTier(level) {
    if (level > window.highestToothLevel && level <= 40) {
        window.highestToothLevel = level;
        saveGame();
        if ((level - 1) % 5 === 0 && level > 1) {
            if(window.showTierUnlock) window.showTierUnlock(level);
        }
        if (level >= 36) {
            const hellContainer = document.getElementById('hell-mode-toggle-container');
            if(hellContainer) hellContainer.style.display = 'flex';
        }
    }
}

// --- [ 3. UI 및 인벤토리 제어 ] ---
function updateUI() { 
    const gd = document.getElementById('gold-display');
    if(gd) gd.innerText = window.fNum ? window.fNum(window.gold) : window.gold; 
    const dd = document.getElementById('dia-display');
    if(dd) dd.innerText = window.fNum ? window.fNum(window.dia) : window.dia; 
    
    const m = document.getElementById('mine-bar'); 
    if(m) m.style.width = window.mineProgress + '%'; 
    const g = document.getElementById('merge-bar'); 
    if(g) g.style.width = window.mergeProgress + '%'; 
    
    const pn = document.getElementById('pickaxe-name');
    if(pn) pn.innerText = TOOTH_DATA.pickaxes[window.pickaxeIdx].name; 
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
            const dmg = window.fNum ? window.fNum(window.getAtk(window.inventory[i])) : window.getAtk(window.inventory[i]); 
            slot.innerHTML = `<span class="dmg-label">⚔️${dmg}</span>${window.getToothIcon(window.inventory[i])}<span class="lv-text">Lv.${window.inventory[i]}</span>`; 
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
                    dragProxy.innerHTML = window.getToothIcon(window.inventory[i]); 
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
        if (window.inventory[from] >= 40) { alert("최대 레벨입니다!"); return; } 
        let extraGreatChance = (window.highestToothLevel >= 21) ? 0.05 : 0;
        const currentGreatChance = (window.greatChanceLevel * 0.02) + extraGreatChance;
        const isGreat = Math.random() < currentGreatChance; 
        
        let nextLv = isGreat ? window.inventory[from] + 2 : window.inventory[from] + 1; 
        nextLv = Math.min(40, nextLv);
        window.inventory[to] = nextLv; 
        window.inventory[from] = 0; 
        checkHighestTier(nextLv);
        if(isGreat) triggerGreatSuccess(to); 
        else if(window.playSfx) window.playSfx('merge'); 
    } else { 
        [window.inventory[from], window.inventory[to]] = [window.inventory[to], window.inventory[from]]; 
    } 
    renderInventory(); saveGame(); 
}

function moveProxy(e) { 
    dragProxy.style.left = e.clientX + 'px'; 
    dragProxy.style.top = e.clientY + 'px'; 
    document.querySelectorAll('.slot').forEach(s => s.classList.remove('drag-target')); 
    const elements = document.elementsFromPoint(e.clientX, e.clientY); 
    const targetSlot = elements.find(el => el.classList.contains('slot')); 
    if(targetSlot && parseInt(targetSlot.dataset.index) < window.maxSlots) targetSlot.classList.add('drag-target'); 
}

function triggerGreatSuccess(idx) { 
    if(window.playSfx) window.playSfx('great'); 
    const slot = document.getElementById(`slot-${idx}`); 
    if (slot) { 
        slot.style.filter = "brightness(1.5) drop-shadow(0 0 10px yellow)";
        setTimeout(() => slot.style.filter = "none", 1000); 
    } 
}

function cleanupInventory() {
    const minMiningLv = window.unlockedDungeon;
    let cleared = false;
    for(let i=0; i < window.maxSlots; i++) {
        if(window.inventory[i] > 0 && window.inventory[i] < minMiningLv) {
            window.inventory[i] = 0; cleared = true;
        }
    }
    if(cleared && window.currentView === 'mine') renderInventory();
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
    if(miner) miner.innerText = TOOTH_DATA.pickaxes[window.pickaxeIdx].icon || "⛏️"; 
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
        if(window.playSfx) window.playSfx('mine'); 
        
        let miningPower = 15;
        if (window.highestToothLevel >= 11 && Math.random() < 0.2) {
            let tapGold = window.unlockedDungeon * 5;
            window.gold += tapGold;
            const worldDiv = document.getElementById('battle-world');
            if(!worldDiv) {
                const txt = document.createElement('div');
                txt.className = 'gold-text';
                txt.innerText = `💰+${window.fNum ? window.fNum(tapGold) : tapGold}`;
                txt.style.left = e.clientX + 'px'; txt.style.top = (e.clientY - 30) + 'px';
                document.body.appendChild(txt);
                setTimeout(() => txt.remove(), 800);
            }
        }
        if (window.highestToothLevel >= 6) miningPower *= 1.2;
        processMining(miningPower); 
        
        const effect = document.createElement('div'); 
        effect.className = 'hit-effect'; effect.innerText = "💥"; 
        effect.style.left = e.clientX + 'px'; effect.style.top = e.clientY + 'px'; 
        document.body.appendChild(effect); 
        setTimeout(() => effect.remove(), 400); 
        updateUI(); saveGame();
    }); 
}

// --- [ 4. 용병 및 던전 그리기 ] ---
window.renderMercenaryCamp = function() { 
    const camp = document.getElementById('mercenary-list'); 
    if(!camp) return;
    camp.innerHTML = ''; 
    const maxOwned = Math.max(...window.ownedMercenaries); 
    let tier6Text = (window.highestToothLevel >= 26) ? `<span style="color:yellow;">(x2)</span>` : "";

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
            <div style="font-size:10px; color:#f55;">HP ${window.fNum ? window.fNum(merc.baseHp) : merc.baseHp}</div> 
        `; 
        
        if (isEquipped) {
            div.style.border = '2px solid #2ecc71'; 
            div.innerHTML += `<button class="btn-sm" style="background:#2ecc71; color:white; width:100%; margin-top:5px; cursor:default;">고용중</button>`;
        } else if (isOwned) {
            div.innerHTML += `<button onclick="equipMerc(${merc.id})" class="btn-sm" style="background:#777; width:100%; margin-top:5px;">대기중</button>`; 
        } else {
            div.innerHTML += `<button onclick="buyMerc(${merc.id}, ${merc.cost})" class="btn-gold" style="padding:4px 5px; font-size:11px; width:100%; margin-top:5px;">${window.fNum ? window.fNum(merc.cost) : merc.cost}G</button>`; 
        }
        camp.appendChild(div); 
    }); 
};

window.buyMerc = function(id, cost) { 
    if(window.gold >= cost) { 
        window.gold -= cost; 
        if(window.playSfx) window.playSfx('upgrade'); 
        window.ownedMercenaries.push(id); 
        window.renderMercenaryCamp(); updateUI(); 
    } else { alert("골드 부족"); } 
};
window.equipMerc = function(id) { window.mercenaryIdx = id; window.renderMercenaryCamp(); saveGame(); };

window.renderDungeonList = function() { 
    const list = document.getElementById('dungeon-list'); 
    if(!list) return;
    list.innerHTML = ''; 
    const isHell = window.isHellMode;
    const dungeonData = isHell ? TOOTH_DATA.hellDungeons : TOOTH_DATA.dungeons;
    
    dungeonData.forEach((name, idx) => { 
        const div = document.createElement('div'); 
        const isUnlocked = idx < window.unlockedDungeon; 
        div.className = `dungeon-card ${isUnlocked ? 'unlocked' : 'locked'}`; 
        
        let baseHp = Math.floor(100 * Math.pow(2.2, idx));
        if (isHell) baseHp *= 50;
        const bossHp = baseHp * 30;
        const recAtk = bossHp / 40;

        if (isUnlocked) { 
            div.innerHTML = `<h4>⚔️ Lv.${idx+1} ${name}</h4>
            <p style="margin:5px 0 0 0; font-size:12px; color:#aaa;">권장 공격력: ${window.fNum ? window.fNum(recAtk) : recAtk}+</p>
            ${isHell ? `<p style="color:#00fbff; font-size:11px; margin:5px 0 0 0;">보스 클리어 시 대량의 다이아 획득!</p>` : `<p style="color:#f1c40f; font-size:11px; margin:5px 0 0 0;">클리어 시 Lv.${idx+2} 치아 확정 채굴</p>`}`; 
            div.onclick = () => { if(window.startDungeon) window.startDungeon(idx); };
        } else { 
            div.innerHTML = `<h4>🔒 잠김</h4><p style="margin:5px 0 0 0; font-size:12px; color:#888;">이전 던전 클리어 시 열림</p>`; 
        } 
        list.appendChild(div); 
    }); 
};

window.generateRankings = function() {
    const list = document.getElementById('ranking-list');
    if(!list) return;
    let ranks = [
        { name: "치아신", d: 20, p: 9999999 },
        { name: "임플란트마스터", d: 19, p: 850000 },
        { name: "발치왕", d: 17, p: 600000 },
        { name: "Driller", d: 15, p: 450000 },
        { name: "충치파괴자", d: 12, p: 200000 },
        { name: "초보원장", d: 5, p: 15000 }
    ];
    let myPower = window.getAtk ? window.getAtk(window.highestToothLevel) : 10;
    if (TOOTH_DATA.mercenaries[window.mercenaryIdx]) myPower *= TOOTH_DATA.mercenaries[window.mercenaryIdx].atkMul;
    
    let myData = { name: window.nickname || "나", d: window.unlockedDungeon, p: myPower, isMe: true };
    ranks.push(myData);
    ranks.sort((a, b) => b.p - a.p);
    
    let html = '';
    let myRank = -1;
    ranks.forEach((r, idx) => {
        if(r.isMe) myRank = idx + 1;
        html += `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #333; ${r.isMe ? 'color:var(--gold); font-weight:bold;' : 'color:#ccc;'}">
            <span style="width:15%;">${idx+1}</span>
            <span style="flex:1; text-align:center;">${r.name}</span>
            <span style="width:20%; text-align:center;">Lv.${r.d}</span>
            <span style="width:25%; text-align:right;">${window.fNum ? window.fNum(r.p) : r.p}</span>
        </div>`;
    });
    list.innerHTML = html;
    document.getElementById('my-rank-display').innerText = `내 순위: ${myRank}위 (전투력: ${window.fNum ? window.fNum(myPower) : myPower})`;
};

window.toggleMining = function() { 
    window.isMiningPaused = !window.isMiningPaused; 
    const btn = document.getElementById('mine-toggle-btn');
    if(btn) btn.innerText = window.isMiningPaused ? "▶️ 재개" : "⏸️ 정지"; 
    saveGame(); 
};

window.checkCoupon = function(code) { 
    if (code === "100b" || code === "RICH100B") { window.gold += 100000000000; alert("치트키 적용!"); updateUI(); } 
    else if (code === "DIA100") { window.dia += 10000; alert("다이아 치트 적용!"); updateUI(); }
    else { alert("유효하지 않은 쿠폰입니다."); } 
};

window.importSave = function() { 
    const str = prompt("코드 붙여넣기:"); 
    if (str) { 
        try { 
            const decoded = decodeURIComponent(escape(atob(str))); 
            localStorage.setItem('toothSaveV672', decoded); 
            location.reload(); 
        } catch (e) { alert("오류"); } 
    } 
};
