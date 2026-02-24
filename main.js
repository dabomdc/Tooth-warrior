// Version: 7.0.4 - Full Monolithic Engine (Restore All Original Logic & Fix Bugs)

// --- [ 전역 변수: 원장님 원본 데이터 100% 유지 ] ---
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

// --- [ 안전한 유틸리티 함수 ] ---
const safeFNum = (val) => typeof fNum === 'function' ? fNum(val) : val;
const safeGetAtk = (lv) => typeof getAtk === 'function' ? getAtk(lv) : 10;
const safeGetIcon = (lv) => typeof getToothIcon === 'function' ? getToothIcon(lv) : "🦷";
const safeGetName = (lv) => typeof getToothName === 'function' ? getToothName(lv) : `Lv.${lv} 치아`;
const getView = () => typeof currentView !== 'undefined' ? currentView : 'mine';

// 🌟 [버그 수정] 밀리초를 00:00 포맷으로 변환하는 함수 (원본에 추가됨)
function formatClearTime(ms) {
    if (!ms || ms === Infinity) return "없음";
    let totalSec = Math.floor(ms / 1000);
    let m = String(Math.floor(totalSec / 60)).padStart(2, '0');
    let s = String(totalSec % 60).padStart(2, '0');
    return `${m}:${s}`;
}

window.getBaseMiningLevel = function() {
    let normalBase = Math.min(10, Math.floor((window.unlockedDungeon - 1) / 2) + 1);
    let hellBonus = 0;
    if (window.unlockedHellDungeon > 1) {
        hellBonus = Math.floor((window.unlockedHellDungeon - 1) / 2);
    }
    return Math.min(24, normalBase + hellBonus); 
};

// --- [ 1. 시스템 초기화 및 인트로 제어 ] ---
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
        alert("닉네임 변경 완료: " + window.nickname);
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

// --- [ 2. 데이터 관리: 세이브/로드 ] ---
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

// --- [ 3. 채굴 엔진 및 터치 효과 ] ---
function gameLoop() { 
    if(!window.isMiningPaused) { 
        const miningSpeedSec = Math.max(1, 10 - ((window.autoMineLevel - 1) * 0.2)); 
        const tickAmt = 100 / (miningSpeedSec * 20); 
        processMining(tickAmt); 
        
        const currentMaxTime = Math.max(2000, 30000 - ((window.autoMergeSpeedLevel - 1) * 500)); 
        const increment = (50 / currentMaxTime) * 100; 
        window.mergeProgress += increment; 
        if (window.mergeProgress >= 100) { window.mergeProgress = 0; autoMergeLowest(); } 
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

window.setupMiningTouch = function() { 
    const mineArea = document.getElementById('mine-rock-area'); 
    if(!mineArea) return;
    mineArea.addEventListener('pointerdown', (e) => { 
        e.preventDefault(); 
        const miner = document.getElementById('miner-char'); 
        miner.style.animation = 'none'; miner.offsetHeight; 
        miner.style.animation = 'hammer 0.08s ease-in-out'; 
        
        // 💥 [버그 수정] 터치 이펙트 위치 보정
        const effect = document.createElement('div'); 
        effect.className = 'hit-effect'; effect.innerText = "💥"; 
        effect.style.left = e.clientX + 'px'; effect.style.top = e.clientY + 'px'; 
        effect.style.pointerEvents = 'none';
        document.body.appendChild(effect); 
        setTimeout(() => effect.remove(), 400); 

        try { if(typeof playSfx === 'function') playSfx('mine'); } catch(e){}
        
        let miningPower = 15 + (window.pickaxeIdx * 10);
        if (window.highestToothLevel >= 4 && Math.random() < 0.2) { 
            let tapGold = window.getBaseMiningLevel() * 50;
            window.gold += tapGold;
            const txt = document.createElement('div');
            txt.className = 'gold-text';
            txt.innerText = `💰+${safeFNum(tapGold)}`;
            txt.style.left = e.clientX + 'px'; txt.style.top = (e.clientY - 30) + 'px';
            txt.style.position = 'fixed';
            document.body.appendChild(txt);
            setTimeout(() => txt.remove(), 800);
        }
        if (window.highestToothLevel >= 4) miningPower *= 1.2;
        processMining(miningPower); 
        updateUI(); saveGame();
    }); 
};

// --- [ 4. 인벤토리 및 합성 로직 ] ---
function renderInventory() { 
    const grid = document.getElementById('inventory-grid'); 
    if(!grid) return;
    grid.innerHTML = ''; 
    for (let i = 0; i < 56; i++) { 
        const slot = document.createElement('div'); 
        slot.className = `slot ${i < 8 ? 'attack-slot' : ''} ${i >= window.maxSlots ? 'locked-slot' : ''}`; 
        slot.dataset.index = i; 
        
        if (i < window.maxSlots && window.inventory[i] > 0) { 
            const dmg = safeFNum(safeGetAtk(window.inventory[i])); 
            slot.innerHTML = `<span class="dmg-label">⚔️${dmg}</span>${safeGetIcon(window.inventory[i])}<span class="lv-text">Lv.${window.inventory[i]}</span>`; 
        } else if (i >= window.maxSlots) { slot.innerHTML = "🔒"; }
        
        if (i < window.maxSlots) { 
            slot.onpointerdown = (e) => { 
                if (window.inventory[i] > 0) { 
                    const currentTime = new Date().getTime(); 
                    if (currentTime - lastTapTime < 300 && lastTapIdx === i) { 
                        e.preventDefault(); 
                        massMerge(window.inventory[i]); 
                        lastTapTime = 0; return; 
                    } 
                    lastTapTime = currentTime; lastTapIdx = i; 
                    e.preventDefault(); window.dragStartIdx = i; 
                    slot.classList.add('picked'); dragProxy.innerHTML = safeGetIcon(window.inventory[i]); 
                    dragProxy.style.display = 'block'; moveProxy(e); slot.setPointerCapture(e.pointerId); 
                } 
            }; 
            slot.onpointermove = (e) => { if (window.dragStartIdx !== null) moveProxy(e); }; 
            slot.onpointerup = (e) => { 
                if (window.dragStartIdx !== null) { 
                    slot.releasePointerCapture(e.pointerId); slot.classList.remove('picked'); 
                    dragProxy.style.display = 'none'; 
                    const targetSlot = document.elementsFromPoint(e.clientX, e.clientY).find(el => el.classList.contains('slot') && el !== slot); 
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
        let nextLv = window.inventory[from] + 1; 
        window.inventory[to] = nextLv; window.inventory[from] = 0; 
        checkHighestTier(nextLv);
        try { if(typeof playSfx === 'function') playSfx('merge'); } catch(e){}
    } else { 
        [window.inventory[from], window.inventory[to]] = [window.inventory[to], window.inventory[from]]; 
    } 
    renderInventory(); saveGame(); 
}

function autoMergeLowest() { 
    let counts = {}; 
    for(let i=8; i<window.maxSlots; i++) { if (window.inventory[i] > 0) counts[window.inventory[i]] = (counts[window.inventory[i]] || 0) + 1; } 
    let target = Object.keys(counts).map(Number).sort((a,b) => a - b).find(lv => counts[lv] >= 2); 
    if (target) massMerge(target, true); 
}

function massMerge(lv, once = false) { 
    let idxs = []; window.inventory.forEach((v, i) => { if(i >= 8 && v === lv && i < window.maxSlots) idxs.push(i); }); 
    if(idxs.length < 2) return; 
    try { if(typeof playSfx === 'function') playSfx('merge'); } catch(e){}
    for(let i=0; i < (once ? 1 : Math.floor(idxs.length / 2)); i++) { 
        window.inventory[idxs[2*i+1]] = Math.min(24, lv + 1); 
        window.inventory[idxs[2*i]] = 0; 
        checkHighestTier(lv + 1); 
    } 
    if(getView() === 'mine') renderInventory(); 
}

function moveProxy(e) { dragProxy.style.left = e.clientX + 'px'; dragProxy.style.top = e.clientY + 'px'; }
function cleanupInventory() { let min = window.getBaseMiningLevel(); window.inventory.forEach((v, i) => { if(i < window.maxSlots && v > 0 && v < min) window.inventory[i] = 0; }); }
window.sortInventory = function() { let items = window.inventory.filter(v => v > 0).sort((a, b) => b - a); window.inventory.fill(0); items.forEach((v, i) => { if(i < 56) window.inventory[i] = v; }); renderInventory(); saveGame(); };

// --- [ 5. 파트너 및 랭킹 시스템 (확장 기능) ] ---
window.renderPartnerCard = function() {
    const card = document.getElementById('equipped-mercenary-card');
    if(!card || typeof TOOTH_DATA === 'undefined') return;
    const merc = TOOTH_DATA.mercenaries[window.mercenaryIdx];
    let hpB = window.trainingLevels.hp * 5; let atkB = window.trainingLevels.atk * 10;
    card.innerHTML = `<div style="font-size:45px; width:60px;">${merc.icon}</div><div style="flex:1;"><div style="font-weight:bold; color:var(--gold); border-bottom:1px solid #555;">${merc.name}</div><div style="font-size:11px; color:#ddd; margin-top:4px;">⚔️ x${merc.atkMul} (+${atkB}%) | ❤️ ${safeFNum(merc.baseHp)} (+${hpB}%)</div></div>`;
};

window.generateRankings = function() {
    const list = document.getElementById('ranking-list');
    if(!list) return;
    let ranks = [{ name: "치아신", d: 40, p: 999999999 }, { name: "임플란트마스터", d: 35, p: 150000000 }];
    const pref = ["User-", "Dr.", "Dent-"];
    const chars = "ABCDEF0123456789";
    for(let i=0; i<498; i++) {
        let lv = Math.floor(Math.random() * 40) + 1;
        let sc = (Math.pow(1.6, lv) * 1000) + Math.floor(Math.random() * 50000);
        ranks.push({ name: pref[Math.floor(Math.random()*pref.length)] + chars[Math.floor(Math.random()*chars.length)] + Math.floor(Math.random()*999), d: lv, p: sc });
    }
    let myP = safeGetAtk(window.highestToothLevel) * (typeof TOOTH_DATA !== 'undefined' ? TOOTH_DATA.mercenaries[window.mercenaryIdx].atkMul : 1);
    ranks.push({ name: window.nickname || "나", d: window.unlockedDungeon, p: myP, isMe: true });
    ranks.sort((a,b) => b.p - a.p);
    let myRank = ranks.findIndex(r => r.isMe);
    let html = ''; 
    ranks.forEach((r, idx) => {
        if (idx < 30 || Math.abs(idx - myRank) <= 2) {
            if (idx > 30 && idx === myRank - 2) html += `<div style="text-align:center; color:#555;">⋮</div>`;
            let style = r.isMe ? 'color:var(--gold); font-weight:bold; background:rgba(241,196,15,0.1);' : 'color:#ccc;';
            html += `<div style="display:flex; justify-content:space-between; padding:8px 5px; border-bottom:1px solid #333; font-size:12px; ${style}"><span>${idx+1}위</span><span>${r.name}</span><span>${safeFNum(r.p)}</span></div>`;
        }
    });
    list.innerHTML = html;
    document.getElementById('my-rank-display').innerText = `내 순위: ${myRank+1}위`;
};

// --- [ 6. 던전 및 편의 기능 ] ---
window.renderDungeonList = function() { 
    const list = document.getElementById('dungeon-list'); if(!list || typeof TOOTH_DATA === 'undefined') return;
    list.innerHTML = ''; 
    const isHell = (window.currentDungeonTab === 'hell' || window.currentDungeonTab === 'hellboss');
    const unlocked = isHell ? window.unlockedHellDungeon : window.unlockedDungeon;
    const data = isHell ? TOOTH_DATA.hellDungeons : TOOTH_DATA.dungeons;
    data.forEach((name, idx) => { 
        const div = document.createElement('div'); const open = idx < unlocked; 
        div.className = `dungeon-card ${open ? 'unlocked' : 'locked'}`; 
        let recTime = window.bestClearTimes[isHell ? `hell_${idx}` : `normal_${idx}`];
        if (open) { 
            div.innerHTML = `<h4>⚔️ Lv.${idx+1} ${name}</h4><p style="font-size:11px;">🏆 최고 기록: ${formatClearTime(recTime)}</p>`;
            div.onclick = () => { if(typeof startDungeon === 'function') startDungeon(idx); };
        } else { div.innerHTML = `<h4>🔒 잠김</h4>`; } 
        list.appendChild(div); 
    }); 
};

function checkHighestTier(lv) { if (lv > window.highestToothLevel && lv <= 24) { window.highestToothLevel = lv; saveGame(); if ((lv - 1) % 3 === 0 && lv > 1 && typeof showTierUnlock === 'function') showTierUnlock(lv); } }
function updateUI() { if(document.getElementById('gold-display')) document.getElementById('gold-display').innerText = safeFNum(window.gold); if(document.getElementById('dia-display')) document.getElementById('dia-display').innerText = safeFNum(window.dia); if(document.getElementById('mine-bar')) document.getElementById('mine-bar').style.width = window.mineProgress + '%'; if(document.getElementById('merge-bar')) document.getElementById('merge-bar').style.width = window.mergeProgress + '%'; }
function updatePickaxeVisual() { const m = document.getElementById('miner-char'); if(m && typeof TOOTH_DATA !== 'undefined') m.innerText = TOOTH_DATA.pickaxes[window.pickaxeIdx].icon; }
window.toggleMining = function() { window.isMiningPaused = !window.isMiningPaused; document.getElementById('mine-toggle-btn').innerText = window.isMiningPaused ? "▶️ 자동채굴 재개" : "⏸️ 자동채굴 정지"; saveGame(); };
window.importSave = function() { let str = prompt("세이브 코드를 입력하세요:"); if(str) { try { let dec = decodeURIComponent(escape(atob(str))); JSON.parse(dec); localStorage.setItem('toothSaveV690', dec); location.reload(); } catch(e){alert("오류!");} } };
