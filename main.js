// Version: 6.7.1 - Main Engine (Bug Fixes, UI Sync, Save/Load)

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
    const btnLayer = document.getElementById('start-btn-layer');
    const vid = document.getElementById('intro-video');
    const skipBtn = document.getElementById('skip-btn');
    
    btnLayer.style.display = 'none';
    vid.style.display = 'block';
    skipBtn.style.display = 'block';
    
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
        const nickModal = document.getElementById('nickname-modal');
        if (nickInput && nickModal) {
            nickInput.value = "User-" + Math.random().toString(36).substr(2, 4);
            nickModal.style.display = 'flex';
        }
    } else {
        startGameLoop();
    }
}

window.confirmNickname = function() {
    const input = document.getElementById('nickname-input').value.trim();
    if(input.length > 0) {
        window.nickname = input;
        document.getElementById('nickname-modal').style.display = 'none';
        saveGame();
        startGameLoop(); 
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
    localStorage.setItem('toothSaveV671', JSON.stringify(data));
};

function loadGame() {
    try {
        const saved = localStorage.getItem('toothSaveV671');
        const legacy1 = localStorage.getItem('toothSaveV670');
        const legacy2 = localStorage.getItem('toothSaveV661'); 
        let d = saved ? JSON.parse(saved) : (legacy1 ? JSON.parse(legacy1) : (legacy2 ? JSON.parse(legacy2) : null));

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
            
            // 오프라인 보상 계산
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
        
        // 헬모드 토글 버튼 노출 여부
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
    const baseLv = window.unlockedDungeon; 
    
    let resultLv = baseLv;
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

window.massMerge = function(lv, once = false) { 
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
};

function checkHighestTier(level) {
    if (level > window.highestToothLevel && level <= 40) {
        window.highestToothLevel = level;
        window.saveGame();
        
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
window.updateUI = function() { 
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
    
    // 매 프레임 저장은 부하를 줄 수 있으므로 1초에 한 번만 저장되게 조절하거나 생략
    // saveGame(); -> 게임 루프에서는 제거. 주요 액션 시에만 저장합니다.
};

window.renderInventory = function() { 
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
        } else if (i >= window.maxSlots) {
            slot.innerHTML = "🔒"; 
        }
        
        if (i < window.maxSlots) { 
            slot.onpointerdown = (e) => { 
                if (window.inventory[i] > 0) { 
                    const currentTime = new Date().getTime(); 
                    const tapLength = currentTime - lastTapTime; 
                    if (tapLength < 300 && tapLength > 0 && lastTapIdx === i) { 
                        e.preventDefault(); 
                        window.massMerge(window.inventory[i]); 
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
};

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
    renderInventory(); 
    saveGame(); 
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

window.cleanupInventory = function() {
    const minMiningLv = window.unlockedDungeon;
    let cleared = false;
    for(let i=0; i < window.maxSlots; i++) {
        if(window.inventory[i] > 0 && window.inventory[i] < minMiningLv) {
            window.inventory[i] = 0; 
            cleared = true;
        }
    }
    if(cleared && window.currentView === 'mine') renderInventory();
};

window.sortInventory = function() { 
    let items = window.inventory.filter(v => v > 0); 
    items.sort((a, b) => b - a); 
    window.inventory.fill(0); 
    items.forEach((v, i) => { if(i < 56) window.inventory[i] = v; }); 
    renderInventory(); 
    saveGame(); 
};

window.updatePickaxeVisual = function() { 
    const miner = document.getElementById('miner-char');
    if(miner) miner.innerText = TOOTH_DATA.pickaxes[window.pickaxeIdx].icon || "⛏️"; 
};

function setupMiningTouch() { 
    const mineArea = document.getElementById('mine-rock-area'); 
    if(!mineArea) return;
    mineArea.addEventListener('pointerdown', (e) => { 
        e.preventDefault(); 
        const miner = document.getElementById('miner-char'); 
        miner.style.animation = 'none'; 
        miner.offsetHeight; 
        miner.style.animation = 'hammer 0.08s ease-in-out'; 
        if(window.playSfx) window.playSfx('mine'); 
        
        let miningPower = 15;
        if (window.highestToothLevel >= 11 && Math.random() < 0.2) {
            let tapGold = window.unlockedDungeon * 5;
            window.gold += tapGold;
            
            const worldDiv = document.getElementById('battle-world');
            if(!worldDiv) { // 전투중이 아닐때 메인화면에 골드 표시
                const txt = document.createElement('div');
                txt.className = 'gold-text';
                txt.innerText = `💰+${window.fNum ? window.fNum(tapGold) : tapGold}`;
                txt.style.left = e.clientX + 'px';
                txt.style.top = (e.clientY - 30) + 'px';
                document.body.appendChild(txt);
                setTimeout(() => txt.remove(), 800);
            }
        }
        
        if (window.highestToothLevel >= 6) miningPower *= 1.2;

        processMining(miningPower); 
        
        const effect = document.createElement('div'); 
        effect.className = 'hit-effect'; 
        effect.innerText = "💥"; 
        effect.style.left = e.clientX + 'px'; 
        effect.style.top = e.clientY + 'px'; 
        document.body.appendChild(effect); 
        setTimeout(() => effect.remove(), 400); 
        
        updateUI();
        saveGame();
    }); 
}

// --- [ 4. 기타 유틸리티 ] ---
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
            localStorage.setItem('toothSaveV671', decoded); 
            location.reload(); 
        } catch (e) { alert("오류"); } 
    } 
};
