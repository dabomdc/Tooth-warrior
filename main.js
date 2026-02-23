// Version: 6.9.0 - Main Engine (TimeAttack, Rich Rankings, Clear Texts)

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

// 🌟 신규: 최고 기록(클리어 타임) 저장 객체
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

// --- [ 1. 초기화 및 세이브/로드 ] ---
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
    // 초기 버튼 텍스트 세팅
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

// 🌟 설정 창에서 닉네임 변경 기능
window.updateNickname = function() {
    const input = document.getElementById('settings-nickname-input').value.trim();
    if(input.length > 0) {
        window.nickname = input;
        alert("닉네임이 성공적으로 변경되었습니다: " + window.nickname);
        document.getElementById('settings-nickname-input').value = "";
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
        bestClearTimes: window.bestClearTimes, // 🌟 최고 기록 저장
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
            window.bestClearTimes = d.bestClearTimes || {}; // 🌟 최고 기록 로드
            
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
        
        let miningPower = 15;
        // 🌟 곡괭이 업그레이드 시 수동 채굴 게이지 대폭 증가 (기본 + 곡괭이레벨*10)
        miningPower += (window.pickaxeIdx * 10);

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

// 🌟 [핵심 변경] 던전 목록에서 클리어 타임 상시 노출 및 명확한 보상 텍스트 표시
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

            // 기록 가져오기
            let recKey = isHell ? `hellboss_${i}` : `boss_${i}`;
            let recordText = window.bestClearTimes[recKey] ? `<span style="color:#00fbff;">🏆 최고 기록: ${window.bestClearTimes[recKey]}</span>` : `<span style="color:#888;">🏆 최고 기록: 없음</span>`;

            if (isUnlocked) {
                div.innerHTML = `<h4>🔥 ${name} 보스 토벌전</h4>
                <p style="margin:5px 0 0 0; font-size:12px; color:#ff8888;">입장료: <span style="color:var(--gold);">${safeFNum(goldFee)}G</span>, ♦️${diaFee}</p>
                <p style="color:#f1c40f; font-size:11px; margin:5px 0 0 0;">보스 5연속 처치 시 엄청난 보상!</p>
                <p style="margin:5px 0 0 0; font-size:11px;">${recordText}</p>`;
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

            // 기록 가져오기
            let recKey = isHell ? `hell_${idx}` : `normal_${idx}`;
            let recordText = window.bestClearTimes[recKey] ? `<span style="color:#00fbff;">🏆 최고 기록: ${window.bestClearTimes[recKey]}</span>` : `<span style="color:#888;">🏆 최고 기록: 없음</span>`;

            // 🌟 확정 채굴 레벨 텍스트 직관화
            let levelUpText = `<p style="color:#888; font-size:11px; margin:5px 0 0 0;">(다음 단계 클리어 시 채굴 레벨 상승)</p>`;
            if ((idx + 1) % 2 === 0) {
                // 이 던전을 깨면 채굴 레벨이 오름. 오를 레벨 계산.
                let curBase = isHell ? Math.min(10, Math.floor((window.unlockedDungeon - 1) / 2) + 1) : 0;
                let nextLv = Math.min(24, curBase + Math.floor((idx + 2) / 2));
                if(!isHell) nextLv = Math.min(10, Math.floor((idx + 2) / 2) + 1);
                
                let nextName = safeGetName(nextLv);
                levelUpText = `<p style="color:#f1c40f; font-size:11px; margin:5px 0 0 0;">✨ 클리어 시 [${nextName}] 확정 채굴!</p>`;
            }

            if (isUnlocked) { 
                div.innerHTML = `<h4>⚔️ Lv.${idx+1} ${name}</h4>
                <p style="margin:5px 0 0 0; font-size:12px; color:#aaa;">권장 공격력: ${safeFNum(recAtk)}+</p>
                ${levelUpText}
                <p style="margin:5px 0 0 0; font-size:11px;">${recordText}</p>`;
                div.onclick = () => { if(typeof startDungeon === 'function') startDungeon(idx); };
            } else { 
                div.innerHTML = `<h4>🔒 잠김</h4><p style="margin:5px 0 0 0; font-size:12px; color:#888;">이전 던전 클리어 시 열림</p>`; 
            } 
            list.appendChild(div); 
        }); 
    }
};

// 🌟 50명의 풍성한 랜덤 랭킹 생성기
window.generateRankings = function() {
    const list = document.getElementById('ranking-list');
    if(!list || typeof TOOTH_DATA === 'undefined') return;
    
    // 고정 컨셉 유저
    let ranks = [
        { name: "치아신", d: 20, p: 99999999 }, 
        { name: "임플란트마스터", d: 19, p: 8500000 },
        { name: "초보원장", d: 5, p: 15000 }
    ];
    
    // 무작위 랜덤 유저 47명 생성
    const adjectives = ["행복한", "졸린", "강력한", "빛나는", "어둠의", "빠른", "용감한", "배고픈", "전설의", "신비한", "무서운", "귀여운"];
    const nouns = ["치과검진", "충치", "사랑니", "임플란트", "스케일링", "양치질", "칫솔", "치약", "금니", "은니", "원장님", "의사"];
    
    for(let i=0; i<47; i++) {
        let randD = Math.floor(Math.random() * 20) + 1;
        let randP = Math.floor(Math.random() * 500000) + (Math.pow(1.5, randD) * 1000);
        let rName = adjectives[Math.floor(Math.random()*adjectives.length)] + nouns[Math.floor(Math.random()*nouns.length)] + Math.floor(Math.random()*99);
        ranks.push({ name: rName, d: randD, p: randP });
    }

    // 내 전투력 계산
    let myPower = safeGetAtk(window.highestToothLevel);
    if (TOOTH_DATA.mercenaries[window.mercenaryIdx]) myPower *= TOOTH_DATA.mercenaries[window.mercenaryIdx].atkMul;
    let myData = { name: window.nickname || "나", d: window.unlockedDungeon, p: myPower, isMe: true };
    ranks.push(myData);
    
    // 전투력 순 정렬
    ranks.sort((a, b) => b.p - a.p);
    
    let html = ''; let myRank = -1;
    ranks.forEach((r, idx) => {
        if(r.isMe) myRank = idx + 1;
        html += `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #333; ${r.isMe ? 'color:var(--gold); font-weight:bold;' : 'color:#ccc;'}">
            <span style="width:15%;">${idx+1}</span><span style="flex:1; text-align:center;">${r.name}</span>
            <span style="width:20%; text-align:center;">Lv.${r.d}</span><span style="width:25%; text-align:right;">${safeFNum(r.p)}</span>
        </div>`;
    });
    list.innerHTML = html;
    const rankDisp = document.getElementById('my-rank-display');
    if(rankDisp) rankDisp.innerText = `내 순위: ${myRank}위 (전투력: ${safeFNum(myPower)})`;
};

// 🌟 버튼 텍스트 변경 적용
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
        alert("테스트용 절대 재화가 지급되었습니다! (골드 +1e25 / 다이아 +999,999)"); 
        updateUI(); saveGame();
    }
    else { alert("유효하지 않은 쿠폰입니다."); } 
};

window.importSave = function() { 
    const str = prompt("코드 붙여넣기:"); 
    if (str) { 
        try { 
            const decoded = decodeURIComponent(escape(atob(str))); 
            localStorage.setItem('toothSaveV690', decoded); 
            location.reload(); 
        } catch (e) { alert("오류가 발생했습니다. 코드를 확인해주세요."); } 
    } 
};
