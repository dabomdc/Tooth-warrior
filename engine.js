// Version: 7.5.2 - Game Engine (Syntax Error Fixed)

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
window.ownedMercenaries = ;
window.autoMergeSpeedLevel = 1; 
window.isMuted = false;
window.masterVolume = 2; 
window.slotUpgrades = Array.from({length: 8}, () => ({ atk: 0, cd: 0, rng: 0 }));
window.globalUpgrades = { cd: 0, rng: 0 };
window.greatChanceLevel = 0; 
window.nickname = ""; 
window.highestToothLevel = 1; 
window.trainingLevels = { hp: 0, atk: 0, spd: 0, crit: 0, splashDmg: 0, splashRange: 0 }; 

window.artifactCounts = new Array(30).fill(0);
window.bossMarks = 0;
window.isToothAwakened = false;

window.isHellMode = false; 
window.isBossRush = false;
window.isResetting = false;

let gameLoopInterval = null; 

window.getBaseMiningLevel = function() {
    let completedSets = 0;
    if (window.artifactCounts) {
        window.artifactCounts.forEach(count => {
            if (count >= 1) completedSets++;
        });
    }
    let extraLevel = Math.floor(completedSets / 3);
    return Math.min(24, 1 + extraLevel); 
};

window.onload = () => { 
    window.loadGame(); 
    
    if (typeof window.setupMiningTouch === 'function') window.setupMiningTouch(); 
    if (typeof window.switchView === 'function') window.switchView('mine'); 

    const introSeen = localStorage.getItem('toothIntroSeen_v7');
    if (introSeen === 'true') {
        const layer = document.getElementById('intro-layer');
        if(layer) layer.style.display = 'none';
        if (typeof window.checkNicknameAndStart === 'function') window.checkNicknameAndStart();
    }
    
    if (typeof window.updateToggleButtons === 'function') window.updateToggleButtons();
};

window.startGameLoop = function() {
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    gameLoopInterval = setInterval(window.gameLoop, 50);
};

window.gameLoop = function() { 
    if(window.isAutoMineOn) { 
        const miningSpeedSec = Math.max(2.0, 10.0 - ((window.autoMineLevel - 1) * 0.2)); 
        const tickAmt = 100 / (miningSpeedSec * 20); 
        window.processMining(tickAmt); 
    } 
    
    if(window.isAutoMergeOn) {
        const currentMaxTimeMs = Math.max(20000, 60000 - ((window.autoMergeSpeedLevel - 1) * 1000)); 
        const increment = (50 / currentMaxTimeMs) * 100; 
        window.mergeProgress += increment; 
        
        if (window.mergeProgress >= 100) { 
            window.mergeProgress = 0; 
            window.autoMergeLowest(); 
        } 
    }
    if (typeof window.updateUI === 'function') window.updateUI(); 
};

window.processMining = function(amt) { 
    window.mineProgress += amt; 
    if (window.mineProgress >= 100) { 
        window.mineProgress = 100; 
        if (window.addMinedItem()) { window.mineProgress = 0; } 
    } 
};

window.addMinedItem = function() { 
    window.cleanupInventory();
    let emptyIdx = -1; 
    for(let i=0; i<window.maxSlots; i++) { if(window.inventory[i] === 0) { emptyIdx = i; break; } } 
    if (emptyIdx === -1) return false; 
    
    let resultLv = window.getBaseMiningLevel(); 
    if(typeof window.TOOTH_DATA!== 'undefined' && window.TOOTH_DATA.pickaxes[window.pickaxeIdx]) {
        if (Math.random() < window.TOOTH_DATA.pickaxes[window.pickaxeIdx].luck) resultLv += 1; 
    }
    
    window.inventory[emptyIdx] = Math.min(24, resultLv);
    window.checkHighestTier(resultLv);

    if(window.currentView === 'mine' && typeof window.renderInventory === 'function') window.renderInventory(); 
    try { if(typeof playSfx === 'function') playSfx('mine'); } catch(e){}
    return true; 
};

window.autoMergeLowest = function() { 
    let levelCounts = {}; 
    for(let i=8; i<window.maxSlots; i++) { 
        const lv = window.inventory[i]; 
        if (lv > 0 && lv < 24) levelCounts[lv] = (levelCounts[lv] || 0) + 1; 
    } 
    let targetLv = -1; 
    const levels = Object.keys(levelCounts).map(Number).sort((a,b) => a - b); 
    for (let lv of levels) { if (levelCounts[lv] >= 2) { targetLv = lv; break; } } 
    if (targetLv!== -1) window.massMerge(targetLv, true); 
};

window.massMerge = function(lv, once = false) { 
    let indices =; 
    window.inventory.forEach((val, idx) => { if(idx >= 8 && val === lv && idx < window.maxSlots) indices.push(idx); }); 
    if(indices.length < 2 || lv >= 24) return; 
    
    const loopCount = once? 1 : Math.floor(indices.length / 2); 
    let greatCount = 0;
    let lastGreatIdx = -1;

    for(let i=0; i < loopCount; i++) { 
        let idx1 = indices[2*i]; 
        let idx2 = indices[2*i+1]; 
        
        let nextLv = lv + 1; 
        
        if (lv < 23 && Math.random() < (window.greatChanceLevel * 0.02)) {
            nextLv = Math.min(24, lv + 2);
            greatCount++;
            lastGreatIdx = idx2;
        }
        
        window.inventory[idx2] = nextLv; 
        window.inventory[idx1] = 0; 
        window.checkHighestTier(nextLv); 
    } 

    if(window.currentView === 'mine' && typeof window.renderInventory === 'function') window.renderInventory(); 

    if (greatCount > 0) {
        try { if(typeof playSfx === 'function') playSfx('great'); } catch(e){}
        if (lastGreatIdx!== -1 && typeof window.showGreatSuccessEffect === 'function') window.showGreatSuccessEffect(lastGreatIdx);
    } else {
        try { if(typeof playSfx === 'function') playSfx('merge'); } catch(e){}
    }

    window.saveGame();
};

window.checkHighestTier = function(level) {
    if (level > window.highestToothLevel && level <= 24) {
        window.highestToothLevel = level;
        window.saveGame();
        if ((level - 1) % 3 === 0 && level > 1) {
            if(typeof window.showTierUnlock === 'function') window.showTierUnlock(level);
        }
    }
};

window.cleanupInventory = function() {
    const minMiningLv = window.getBaseMiningLevel();
    let cleared = false;
    for(let i=0; i < window.maxSlots; i++) {
        if(window.inventory[i] > 0 && window.inventory[i] < minMiningLv) {
            window.inventory[i] = 0; cleared = true;
        }
    }
    if(cleared && window.currentView === 'mine' && typeof window.renderInventory === 'function') window.renderInventory();
};

window.saveGame = function() {
    if (window.isResetting) return; 
    const data = { 
        gold: window.gold, dia: window.dia, maxSlots: window.maxSlots, inventory: window.inventory, 
        unlockedDungeon: window.unlockedDungeon, unlockedHellDungeon: window.unlockedHellDungeon,
        pickaxeIdx: window.pickaxeIdx, autoMineLevel: window.autoMineLevel,
        mercenaryIdx: window.mercenaryIdx, ownedMercenaries: window.ownedMercenaries, autoMergeSpeedLevel: window.autoMergeSpeedLevel, 
        isMuted: window.isMuted, masterVolume: window.masterVolume, slotUpgrades: window.slotUpgrades, globalUpgrades: window.globalUpgrades, 
        greatChanceLevel: window.greatChanceLevel, nickname: window.nickname, 
        highestToothLevel: window.highestToothLevel, trainingLevels: window.trainingLevels,
        artifactCounts: window.artifactCounts, bossMarks: window.bossMarks, isToothAwakened: window.isToothAwakened, 
        lastTime: Date.now(), 
        isAutoMineOn: window.isAutoMineOn, isAutoMergeOn: window.isAutoMergeOn 
    };
    localStorage.setItem('toothSaveV700', JSON.stringify(data)); 
};

window.loadGame = function() {
    try {
        const saved = localStorage.getItem('toothSaveV700') || localStorage.getItem('toothSaveV695') || localStorage.getItem('toothSaveV680');
        let d = saved? JSON.parse(saved) : null;
        if (d) {
            window.gold = d.gold || 0; window.dia = d.dia || 0;
            window.maxSlots = d.maxSlots || 24; window.inventory = d.inventory || new Array(56).fill(0);
            window.unlockedDungeon = d.unlockedDungeon || 1; 
            window.unlockedHellDungeon = d.unlockedHellDungeon || 1;
            window.pickaxeIdx = d.pickaxeIdx || 0;
            window.autoMineLevel = d.autoMineLevel || 1; 
            
            if (d.isMiningPaused!== undefined) {
                window.isAutoMineOn =!d.isMiningPaused;
                window.isAutoMergeOn =!d.isMiningPaused;
            } else {
                window.isAutoMineOn = d.isAutoMineOn!== undefined? d.isAutoMineOn : true;
                window.isAutoMergeOn = d.isAutoMergeOn!== undefined? d.isAutoMergeOn : true;
            }
            
            window.mercenaryIdx = d.mercenaryIdx || 0; window.ownedMercenaries = d.ownedMercenaries || ;
            window.autoMergeSpeedLevel = d.autoMergeSpeedLevel || 1; window.isMuted = d.isMuted || false;
            window.masterVolume = d.masterVolume || 2; 
            window.highestToothLevel = Math.min(24, d.highestToothLevel || 1); 
            window.trainingLevels = d.trainingLevels || { hp: 0, atk: 0, spd: 0, crit: 0, splashDmg: 0, splashRange: 0 };
            
            if (d.slotUpgrades) window.slotUpgrades = d.slotUpgrades;
            if (d.globalUpgrades) window.globalUpgrades = d.globalUpgrades;
            if (d.greatChanceLevel) window.greatChanceLevel = d.greatChanceLevel;
            if (d.nickname) window.nickname = d.nickname;
            
            if (d.artifactCounts) window.artifactCounts = d.artifactCounts;
            if (d.bossMarks!== undefined) window.bossMarks = d.bossMarks;
            if (d.isToothAwakened!== undefined) window.isToothAwakened = d.isToothAwakened;
            
            if (d.lastTime) {
                const offTime = (Date.now() - d.lastTime) / 1000;
                
                if (window.isAutoMineOn) {
                    const miningSpeed = Math.max(2.0, 10.0 - ((window.autoMineLevel - 1) * 0.2));
                    const minedCount = Math.floor(offTime / miningSpeed); 
                    for(let i=0; i < minedCount; i++) { if(!window.addMinedItem()) break; }
                }
                
                if (window.isAutoMergeOn) {
                    const currentMaxTime = Math.max(20000, 60000 - ((window.autoMergeSpeedLevel - 1) * 1000));
                    const merges = Math.floor((offTime * 1000) / currentMaxTime);
                    for(let k=0; k < merges; k++) window.autoMergeLowest();
                }
            }
        }
        window.cleanupInventory();
        if(typeof window.updateSoundBtn === 'function') window.updateSoundBtn();
        if(typeof window.updatePickaxeVisual === 'function') window.updatePickaxeVisual();
    } catch (e) { console.error("Load Error:", e); }
};
