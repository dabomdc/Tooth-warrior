// Version: 7.0.0 - Main Engine (Great Success FX, Artifact Mining Scale, 24Lv Awakening)

window.gold = 0; 
window.dia = 0; 
window.unlockedDungeon = 1; 
window.unlockedHellDungeon = 1; 
window.pickaxeIdx = 0;
window.autoMineLevel = 1;
window.inventory = new Array(56).fill(0);
window.maxSlots = 24; 
window.mineProgress = 0;
window.mergeProgress = 0;

window.isAutoMineOn = true;
window.isAutoMergeOn = true;

window.dragStartIdx = null;
window.mercenaryIdx = 0;
window.ownedMercenaries = [0];
window.autoMergeSpeedLevel = 1; 
window.isMuted = false;
window.masterVolume = 2; 
window.slotUpgrades = Array.from({length: 8}, () => ({ atk: 0, cd: 0, rng: 0 }));
window.globalUpgrades = { cd: 0, rng: 0 };
window.greatChanceLevel = 0; 
window.nickname = ""; 
window.highestToothLevel = 1; 
window.trainingLevels = { hp: 0, atk: 0, spd: 0, crit: 0, splashDmg: 0, splashRange: 0 }; 

// 🌟 신규 시스템 변수 (유물, 징표, 각성 여부)
window.artifactCounts = new Array(30).fill(0);
window.bossMarks = 0;
window.isToothAwakened = false;

window.isHellMode = false; 
window.isBossRush = false;
window.isResetting = false;

let gameLoopInterval = null; 
let lastTapTime = 0; 
let lastTapIdx = -1;
const dragProxy = document.getElementById('drag-proxy');

const safeFNum = (val) => typeof fNum === 'function' ? fNum(val) : val;
const safeGetAtk = (lv) => typeof getAtk === 'function' ? getAtk(lv) : 10;
const safeGetIcon = (lv) => typeof getToothIcon === 'function' ? getToothIcon(lv) : "🦷";
const getView = () => typeof currentView !== 'undefined' ? currentView : 'mine';

// 🌟 [핵심 변경] 유물 수집률 기반으로 기본 채굴 레벨 계산 (2개 모을 때마다 +1)
window.getBaseMiningLevel = function() {
    let completedSets = 0;
    if (window.artifactCounts) {
        window.artifactCounts.forEach(count => {
            if (count >= 2) completedSets++;
        });
    }
    return Math.min(24, 1 + completedSets); 
};

window.onload = () => { 
    loadGame(); 
    setupMiningTouch(); 
    if(typeof switchView === 'function') switchView('mine'); 

    const introSeen = localStorage.getItem('toothIntroSeen_v7');
    if (introSeen === 'true') {
        const layer = document.getElementById('intro-layer');
        if(layer) layer.style.display = 'none';
        checkNicknameAndStart();
    }
    
    updateToggleButtons();
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
            localStorage.setItem('toothIntroSeen_v7', 'true');
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
        
        const nickDisp = document.getElementById('current-nickname-display');
        if(nickDisp) nickDisp.innerText = window.nickname;

        saveGame(); 
        
        if (!gameLoopInterval) {
            startGameLoop(); 
        } else {
            alert("닉네임이 성공적으로 변경되었습니다!");
            if(typeof window.generateRankings === 'function') window.generateRankings(); 
        }
    } else { alert("닉네임을 입력해주세요."); }
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
        artifactCounts: window.artifactCounts, bossMarks: window.bossMarks, isToothAwakened: window.isToothAwakened, // 🌟 신규 데이터 저장
        lastTime: Date.now(), 
        isAutoMineOn: window.isAutoMineOn, isAutoMergeOn: window.isAutoMergeOn 
    };
    localStorage.setItem('toothSaveV700', JSON.stringify(data)); 
}
window.saveGame = saveGame;

function loadGame() {
    try {
        const saved = localStorage.getItem('toothSaveV700') || localStorage.getItem('toothSaveV695') || localStorage.getItem('toothSaveV680');
        let d = saved ? JSON.parse(saved) : null;
        if (d) {
            window.gold = d.gold || 0; window.dia = d.dia || 0;
            window.maxSlots = d.maxSlots || 24; window.inventory = d.inventory || new Array(56).fill(0);
            window.unlockedDungeon = d.unlockedDungeon || 1; 
            window.unlockedHellDungeon = d.unlockedHellDungeon || 1;
            window.pickaxeIdx = d.pickaxeIdx || 0;
            window.autoMineLevel = d.autoMineLevel || 1; 
            
            if (d.isMiningPaused !== undefined) {
                window.isAutoMineOn = !d.isMiningPaused;
                window.isAutoMergeOn = !d.isMiningPaused;
            } else {
                window.isAutoMineOn = d.isAutoMineOn !== undefined ? d.isAutoMineOn : true;
                window.isAutoMergeOn = d.isAutoMergeOn !== undefined ? d.isAutoMergeOn : true;
            }
            
            window.mercenaryIdx = d.mercenaryIdx || 0; window.ownedMercenaries = d.ownedMercenaries || [0];
            window.autoMergeSpeedLevel = d.autoMergeSpeedLevel || 1; window.isMuted = d.isMuted || false;
            window.masterVolume = d.masterVolume || 2; 
            window.highestToothLevel = Math.min(24, d.highestToothLevel || 1); 
            window.trainingLevels = d.trainingLevels || { hp: 0, atk: 0, spd: 0, crit: 0, splashDmg: 0, splashRange: 0 };
            
            if (d.slotUpgrades) window.slotUpgrades = d.slotUpgrades;
            if (d.globalUpgrades) window.globalUpgrades = d.globalUpgrades;
            if (d.greatChanceLevel) window.greatChanceLevel = d.greatChanceLevel;
            if (d.nickname) window.nickname = d.nickname;
            
            // 🌟 신규 데이터 로드
            if (d.artifactCounts) window.artifactCounts = d.artifactCounts;
            if (d.bossMarks !== undefined) window.bossMarks = d.bossMarks;
            if (d.isToothAwakened !== undefined) window.isToothAwakened = d.isToothAwakened;
            
            if (d.lastTime) {
                const offTime = (Date.now() - d.lastTime) / 1000;
                
                if (window.isAutoMineOn) {
                    const miningSpeed = Math.max(1, 10 - ((window.autoMineLevel - 1) * 0.2));
                    const minedCount = Math.floor(offTime / miningSpeed); 
                    for(let i=0; i < minedCount; i++) { if(!addMinedItem()) break; }
                }
                
                if (window.isAutoMergeOn) {
                    const currentMaxTime = Math.max(2000, 30000 - ((window.autoMergeSpeedLevel - 1) * 500));
                    const merges = Math.floor((offTime * 1000) / currentMaxTime);
                    for(let k=0; k < merges; k++) autoMergeLowest();
                }
            }
        }
        cleanupInventory();
        if(typeof updateSoundBtn === 'function') updateSoundBtn();
        updatePickaxeVisual();
    } catch (e) { console.error("Load Error:", e); }
}
window.loadGame = loadGame;

function gameLoop() { 
    if(window.isAutoMineOn) { 
        const miningSpeedSec = Math.max(1, 10 - ((window.autoMineLevel - 1) * 0.2)); 
        const tickAmt = 100 / (miningSpeedSec * 20); 
        processMining(tickAmt); 
    } 
    
    if(window.isAutoMergeOn) {
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

// 🌟 [핵심 변경] 합성 대성공 시각 효과 (팝콘 텍스트)
window.showGreatSuccessEffect = function(slotIdx) {
    const slot = document.getElementById(`slot-${slotIdx}`);
    if(slot) {
        const txt = document.createElement('div');
        txt.className = 'great-success-text';
        txt.innerText = '✨ +2';
        slot.appendChild(txt);
        setTimeout(() => txt.remove(), 800);
    }
};

window.playAwakenVideo = function() {
    const layer = document.getElementById('awaken-video-layer');
    const vid = document.getElementById('awaken-video');
    const skipBtn = document.getElementById('skip-awaken-btn');
    if(layer && vid) {
        layer.style.display = 'flex';
        vid.style.display = 'block';
        if(skipBtn) skipBtn.style.display = 'block';
        vid.volume = window.masterVolume ? window.masterVolume * 0.3 : 0.6;
        vid.muted = window.isMuted;
        vid.play().catch(e => { if(typeof skipAwakenIntro === 'function') skipAwakenIntro(); });
        vid.onended = () => { setTimeout(() => { if(typeof skipAwakenIntro === 'function') skipAwakenIntro(); }, 500); };
    }
};

function autoMergeLowest() { 
    let levelCounts = {}; 
    for(let i=8; i<window.maxSlots; i++) { 
        const lv = window.inventory[i]; 
        if (lv > 0 && lv < 24) levelCounts[lv] = (levelCounts[lv] || 0) + 1; // 24렙은 자동합성 제외
    } 
    let targetLv = -1; 
    const levels = Object.keys(levelCounts).map(Number).sort((a,b) => a - b); 
    for (let lv of levels) { if (levelCounts[lv] >= 2) { targetLv = lv; break; } } 
    if (targetLv !== -1) massMerge(targetLv, true); 
}
window.autoMergeLowest = autoMergeLowest;

// 🌟 [핵심 변경] 대량 합성 시 대성공 확률 완벽 적용 및 사운드 1회 제어
function massMerge(lv, once = false) { 
    let indices = []; 
    window.inventory.forEach((val, idx) => { if(idx >= 8 && val === lv && idx < window.maxSlots) indices.push(idx); }); 
    if(indices.length < 2 || lv >= 24) return; 
    
    const loopCount = once ? 1 : Math.floor(indices.length / 2); 
    let greatCount = 0;
    let made24 = false;

    for(let i=0; i < loopCount; i++) { 
        let idx1 = indices[2*i]; 
        let idx2 = indices[2*i+1]; 
        
        let nextLv = lv + 1; 
        
        // 대성공 주사위 (최대 50%)
        if (lv < 23 && Math.random() < (window.greatChanceLevel * 0.02)) {
            nextLv = Math.min(24, lv + 2);
            greatCount++;
            window.showGreatSuccessEffect(idx2);
        }
        
        window.inventory[idx2] = nextLv; 
        window.inventory[idx1] = 0; 
        checkHighestTier(nextLv); 
        
        if (nextLv === 24) made24 = true;
    } 

    if (greatCount > 0) {
        try { if(typeof playSfx === 'function') playSfx('great'); } catch(e){}
    } else {
        try { if(typeof playSfx === 'function') playSfx('merge'); } catch(e){}
    }

    if (made24 && !window.isToothAwakened) {
        window.playAwakenVideo();
    }

    if(getView() === 'mine') renderInventory(); 
    saveGame();
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
    
    const dial = document.getElementById('merge-dial'); 
    if(dial) {
        dial.style.background = `conic-gradient(#9b59b6 0%, #9b59b6 ${window.mergeProgress}%, #333 ${window.mergeProgress}%, #333 100%)`;
    } 
    
    const pn = document.getElementById('pickaxe-name');
    if(pn && typeof TOOTH_DATA !== 'undefined' && TOOTH_DATA.pickaxes[window.pickaxeIdx]) {
        pn.innerText = TOOTH_DATA.pickaxes[window.pickaxeIdx].name; 
    }
}
window.updateUI = updateUI;

function renderInventory() { 
    const grid = document.getElementById('inventory-grid'); 
    if(!grid) return;
    
    if (grid.children.length === 0) {
        for (let i = 0; i < 56; i++) { 
            const slot = document.createElement('div'); 
            slot.dataset.index = i; 
            slot.id = `slot-${i}`; 
            
            slot.onpointerdown = (e) => { 
                if (window.inventory[i] > 0) { 
                    const currentTime = new Date().getTime(); 
                    const tapLength = currentTime - lastTapTime; 
                    
                    // 더블클릭 체크
                    if (tapLength < 300 && tapLength > 0 && lastTapIdx === i) { 
                        e.preventDefault(); 
                        
                        // 🌟 신규: 자물쇠 치아 더블클릭 시 해제 창 열기
                        if (window.inventory[i] === 24 && !window.isToothAwakened) {
                            if(typeof window.openLockedToothModal === 'function') window.openLockedToothModal(i);
                        } else {
                            massMerge(window.inventory[i]); 
                        }
                        lastTapTime = 0; return; 
                    } 
                    
                    lastTapTime = currentTime; 
                    lastTapIdx = i; 
                    e.preventDefault(); 
                    
                    // 🌟 신규: 자물쇠 치아는 드래그 금지!
                    if (window.inventory[i] === 24 && !window.isToothAwakened) {
                        return;
                    }
                    
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
            grid.appendChild(slot); 
        }
    }
    
    for (let i = 0; i < 56; i++) {
        const slot = document.getElementById(`slot-${i}`);
        if(!slot) continue;
        
        slot.className = `slot ${i < 8 ? 'attack-slot' : ''} ${i >= window.maxSlots ? 'locked-slot' : ''}`; 
        
        if (i < window.maxSlots && window.inventory[i] > 0) { 
            const lv = window.inventory[i];
            const dmg = safeFNum(safeGetAtk(lv)); 
            slot.innerHTML = `<span class="dmg-label">⚔️${dmg}</span>${safeGetIcon(lv)}<span class="lv-text">Lv.${lv}</span>`; 
        } else if (i >= window.maxSlots) { 
            slot.innerHTML = "🔒"; 
        } else {
            slot.innerHTML = "";
        }
    }
}
window.renderInventory = renderInventory;

// 🌟 [핵심 변경] 수동 합성 시 대성공 확률 및 24레벨 달성 체크
function handleMoveOrMerge(from, to) { 
    if (from === to) return; 
    if (window.inventory[from] === window.inventory[to] && window.inventory[from] > 0) { 
        if (window.inventory[from] >= 24) { alert("최대 레벨입니다!"); return; } 
        
        let curLv = window.inventory[from];
        let nextLv = curLv + 1; 
        let isGreat = false;

        // 대성공 주사위
        if (curLv < 23 && Math.random() < (window.greatChanceLevel * 0.02)) {
            nextLv = Math.min(24, curLv + 2);
            isGreat = true;
        }

        window.inventory[to] = nextLv; 
        window.inventory[from] = 0; 
        checkHighestTier(nextLv);
        
        if (isGreat) {
            try { if(typeof playSfx === 'function') playSfx('great'); } catch(e){}
            window.showGreatSuccessEffect(to);
        } else {
            try { if(typeof playSfx === 'function') playSfx('merge'); } catch(e){}
        }

        // 24레벨 최초 도달 시 영상 재생
        if (nextLv === 24 && !window.isToothAwakened) {
            window.playAwakenVideo();
        }

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
        
        let miningPower = 15;
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

window.toggleAutoMine = function() { 
    window.isAutoMineOn = !window.isAutoMineOn; 
    updateToggleButtons();
    saveGame(); 
};

window.toggleAutoMerge = function() { 
    window.isAutoMergeOn = !window.isAutoMergeOn; 
    updateToggleButtons();
    saveGame(); 
};

function updateToggleButtons() {
    const mineBtn = document.getElementById('auto-mine-btn');
    if(mineBtn) {
        mineBtn.innerText = window.isAutoMineOn ? "⛏️ 자동채굴 ON" : "⛏️ 자동채굴 OFF"; 
        if(!window.isAutoMineOn) mineBtn.classList.add('off'); else mineBtn.classList.remove('off');
    }
    const mergeBtn = document.getElementById('auto-merge-btn');
    if(mergeBtn) {
        mergeBtn.innerText = window.isAutoMergeOn ? "⚡ 자동합성 ON" : "⚡ 자동합성 OFF"; 
        if(!window.isAutoMergeOn) mergeBtn.classList.add('off'); else mergeBtn.classList.remove('off');
    }
}
window.updateToggleButtons = updateToggleButtons;

window.checkCoupon = function(code) { 
    if (code === "100b" || code === "RICH100B") { window.gold += 100000000000; alert("치트키 적용!"); updateUI(); saveGame(); } 
    else if (code === "DIA100") { window.dia += 10000; alert("다이아 치트 적용!"); updateUI(); saveGame(); }
    else if (code === "TEST") { 
        window.gold += 1e25; 
        window.dia += 999999; 
        alert("테스트용 절대 재화가 지급되었습니다!"); 
        updateUI(); saveGame();
    }
    else if (code === "HELLTEST") {
        window.unlockedDungeon = 20; 
        window.gold += 1e15; 
        window.dia += 100000; 
        window.bossMarks += 100;
        for(let i=0; i<30; i++) window.artifactCounts[i] = 2; // 유물 도감 올클리어
        alert("🔥 [각성 테스트 완료] 1,000조 골드 / 10만 다이아 / 보스징표 100개 / 유물 올클리어!\n이제 23레벨 2개를 합쳐 봉인을 해제해보세요!");
        updateUI(); saveGame();
        if(typeof renderDungeonList === 'function') window.renderDungeonList();
        if(typeof renderArtifacts === 'function') window.renderArtifacts();
    }
    else { alert("유효하지 않은 쿠폰입니다."); } 
};

window.importSave = function() { 
    const str = prompt("코드 붙여넣기:"); 
    if (str) { 
        try { 
            const decoded = decodeURIComponent(atob(str)); 
            localStorage.setItem('toothSaveV700', decoded); 
            location.reload(); 
        } catch (e) { alert("오류가 발생했습니다. 코드를 확인해주세요."); } 
    } 
};
