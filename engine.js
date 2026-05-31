// Version: 8.0.0 - Core Engine, Save/Load, Intro, Main Loop

// --- [ 1. 기본 전역 상태값 ] ---
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

window.slotUpgrades = Array.from({ length: 8 }, () => ({ atk: 0, cd: 0, rng: 0 }));
window.globalUpgrades = { cd: 0, rng: 0 };
window.greatChanceLevel = 0; 
window.nickname = ""; 
window.highestToothLevel = 1; 

window.trainingLevels = { 
    hp: 0, 
    atk: 0, 
    spd: 0, 
    crit: 0, 
    splashDmg: 0, 
    splashRange: 0 
}; 

window.artifactCounts = new Array(30).fill(0);
window.bossMarks = 0;
window.isToothAwakened = false;

window.isHellMode = false; 
window.isBossRush = false;
window.isResetting = false;

window.currentView = 'mine';
window.currentDungeonTab = 'normal';

let gameLoopInterval = null;


// --- [ 2. 공용 안전 함수 ] ---
window.safeFNum = function(val) {
    return typeof window.fNum === 'function' ? window.fNum(val) : val;
};

window.safeGetAtk = function(lv) {
    return typeof window.getAtk === 'function' ? window.getAtk(lv) : 10;
};

window.safeGetIcon = function(lv) {
    return typeof window.getToothIcon === 'function' ? window.getToothIcon(lv) : "🦷";
};

window.getView = function() {
    return window.currentView || 'mine';
};

// 다른 파일에서 기존처럼 이름만으로 호출 가능하게 유지
var safeFNum = window.safeFNum;
var safeGetAtk = window.safeGetAtk;
var safeGetIcon = window.safeGetIcon;
var getView = window.getView;


// --- [ 3. 유물 기반 기본 채굴 레벨 ] ---
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


// --- [ 4. 게임 시작 ] ---
window.onload = function() { 
    window.loadGame(); 
    
    if (typeof window.setupMiningTouch === 'function') {
        window.setupMiningTouch(); 
    }

    if (typeof window.switchView === 'function') {
        window.switchView('mine'); 
    }

    const introSeen = localStorage.getItem('toothIntroSeen_v7');

    if (introSeen === 'true') {
        const layer = document.getElementById('intro-layer');
        if (layer) layer.style.display = 'none';
        window.checkNicknameAndStart();
    }
    
    if (typeof window.updateToggleButtons === 'function') {
        window.updateToggleButtons();
    }
};


// --- [ 5. 인트로 처리 ] ---
window.startIntro = function() {
    const btnLayer = document.getElementById('start-btn-layer');
    if (btnLayer) btnLayer.style.display = 'none';
    
    const vid = document.getElementById('intro-video');
    const skipBtn = document.getElementById('skip-btn');

    if (vid) {
        vid.style.display = 'block';

        if (skipBtn) skipBtn.style.display = 'block';

        vid.volume = window.masterVolume ? window.masterVolume * 0.3 : 0.6; 
        vid.muted = window.isMuted; 

        vid.play().catch(() => { 
            window.finishIntro(); 
        });

        vid.onended = function() { 
            setTimeout(window.finishIntro, 500); 
        };
    } else {
        window.finishIntro();
    }
};

window.skipIntro = function() { 
    const vid = document.getElementById('intro-video');
    if (vid) vid.pause(); 

    window.finishIntro(); 
};

window.finishIntro = function() {
    const layer = document.getElementById('intro-layer');

    if (layer) {
        layer.style.transition = 'opacity 1.5s ease';
        layer.style.opacity = '0';

        setTimeout(() => {
            layer.style.display = 'none';
            localStorage.setItem('toothIntroSeen_v7', 'true');
            window.checkNicknameAndStart();
        }, 1500);
    } else {
        window.checkNicknameAndStart();
    }
};


// --- [ 6. 닉네임 확인 및 루프 시작 ] ---
window.checkNicknameAndStart = function() {
    if (!window.nickname) {
        const nickInput = document.getElementById('nickname-input');
        const nickModal = document.getElementById('nickname-modal');

        if (nickInput && nickModal) {
            nickInput.value = "User-" + Math.random().toString(36).substr(2, 4);
            nickModal.style.display = 'flex';
        }
    } else {
        window.startGameLoop();
    }
};

window.confirmNickname = function() {
    const inputEl = document.getElementById('nickname-input');
    if (!inputEl) return;

    const input = inputEl.value.trim();

    if (input.length > 0) {
        window.nickname = input;

        const modal = document.getElementById('nickname-modal');
        if (modal) modal.style.display = 'none';
        
        const nickDisp = document.getElementById('current-nickname-display');
        if (nickDisp) nickDisp.innerText = window.nickname;

        window.saveGame(); 
        
        if (!gameLoopInterval) {
            window.startGameLoop(); 
        } else {
            alert("닉네임이 성공적으로 변경되었습니다!");

            if (typeof window.generateRankings === 'function') {
                window.generateRankings(); 
            }
        }
    } else {
        alert("닉네임을 입력해주세요.");
    }
};


// --- [ 7. 메인 게임 루프 ] ---
function startGameLoop() {
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    gameLoopInterval = setInterval(window.gameLoop, 50);
}
window.startGameLoop = startGameLoop;

window.gameLoop = function() { 
    if (window.isAutoMineOn) { 
        const miningSpeedSec = Math.max(2.0, 10.0 - ((window.autoMineLevel - 1) * 0.2)); 
        const tickAmt = 100 / (miningSpeedSec * 20); 

        if (typeof window.processMining === 'function') {
            window.processMining(tickAmt); 
        }
    } 
    
    if (window.isAutoMergeOn) {
        const currentMaxTime = Math.max(20000, 60000 - ((window.autoMergeSpeedLevel - 1) * 1000)); 
        const increment = (50 / currentMaxTime) * 100; 

        window.mergeProgress += increment; 
        
        if (window.mergeProgress >= 100) { 
            window.mergeProgress = 0; 

            if (typeof window.autoMergeLowest === 'function') {
                window.autoMergeLowest(); 
            }
        } 
    }

    if (typeof window.updateUI === 'function') {
        window.updateUI(); 
    }
};


// --- [ 8. 저장 ] ---
function saveGame() {
    if (window.isResetting) return; 

    const data = { 
        gold: window.gold, 
        dia: window.dia, 
        maxSlots: window.maxSlots, 
        inventory: window.inventory, 

        unlockedDungeon: window.unlockedDungeon, 
        unlockedHellDungeon: window.unlockedHellDungeon,

        pickaxeIdx: window.pickaxeIdx, 
        autoMineLevel: window.autoMineLevel,

        mercenaryIdx: window.mercenaryIdx, 
        ownedMercenaries: window.ownedMercenaries, 
        autoMergeSpeedLevel: window.autoMergeSpeedLevel, 

        isMuted: window.isMuted, 
        masterVolume: window.masterVolume, 

        slotUpgrades: window.slotUpgrades, 
        globalUpgrades: window.globalUpgrades, 
        greatChanceLevel: window.greatChanceLevel, 

        nickname: window.nickname, 
        highestToothLevel: window.highestToothLevel, 
        trainingLevels: window.trainingLevels,

        artifactCounts: window.artifactCounts, 
        bossMarks: window.bossMarks, 
        isToothAwakened: window.isToothAwakened, 

        lastTime: Date.now(), 

        isAutoMineOn: window.isAutoMineOn, 
        isAutoMergeOn: window.isAutoMergeOn 
    };

    localStorage.setItem('toothSaveV700', JSON.stringify(data)); 
}
window.saveGame = saveGame;


// --- [ 9. 불러오기 ] ---
function loadGame() {
    try {
        const saved = 
            localStorage.getItem('toothSaveV700') || 
            localStorage.getItem('toothSaveV695') || 
            localStorage.getItem('toothSaveV680');

        let d = saved ? JSON.parse(saved) : null;

        if (d) {
            window.gold = d.gold || 0; 
            window.dia = d.dia || 0;

            window.maxSlots = d.maxSlots || 24; 

            if (Array.isArray(d.inventory)) {
                window.inventory = d.inventory.slice(0, 56);
                while (window.inventory.length < 56) window.inventory.push(0);
            } else {
                window.inventory = new Array(56).fill(0);
            }

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
            
            window.mercenaryIdx = d.mercenaryIdx || 0; 
            window.ownedMercenaries = d.ownedMercenaries || [0];

            window.autoMergeSpeedLevel = d.autoMergeSpeedLevel || 1; 
            window.isMuted = d.isMuted || false;
            window.masterVolume = d.masterVolume || 2; 

            window.highestToothLevel = Math.min(24, d.highestToothLevel || 1); 

            window.trainingLevels = d.trainingLevels || { 
                hp: 0, 
                atk: 0, 
                spd: 0, 
                crit: 0, 
                splashDmg: 0, 
                splashRange: 0 
            };
            
            if (d.slotUpgrades) window.slotUpgrades = d.slotUpgrades;
            if (d.globalUpgrades) window.globalUpgrades = d.globalUpgrades;
            if (d.greatChanceLevel) window.greatChanceLevel = d.greatChanceLevel;
            if (d.nickname) window.nickname = d.nickname;
            
            if (d.artifactCounts) {
                window.artifactCounts = d.artifactCounts.slice(0, 30);
                while (window.artifactCounts.length < 30) window.artifactCounts.push(0);
            }

            if (d.bossMarks !== undefined) window.bossMarks = d.bossMarks;
            if (d.isToothAwakened !== undefined) window.isToothAwakened = d.isToothAwakened;
            
            if (d.lastTime) {
                const offTime = (Date.now() - d.lastTime) / 1000;
                
                if (window.isAutoMineOn && typeof window.addMinedItem === 'function') {
                    const miningSpeed = Math.max(2.0, 10.0 - ((window.autoMineLevel - 1) * 0.2));
                    const minedCount = Math.floor(offTime / miningSpeed); 

                    for (let i = 0; i < minedCount; i++) { 
                        if (!window.addMinedItem()) break; 
                    }
                }
                
                if (window.isAutoMergeOn && typeof window.autoMergeLowest === 'function') {
                    const currentMaxTime = Math.max(20000, 60000 - ((window.autoMergeSpeedLevel - 1) * 1000));
                    const merges = Math.floor((offTime * 1000) / currentMaxTime);

                    for (let k = 0; k < merges; k++) {
                        window.autoMergeLowest();
                    }
                }
            }
        }

        if (typeof window.cleanupInventory === 'function') {
            window.cleanupInventory();
        }

        if (typeof window.updateSoundBtn === 'function') {
            window.updateSoundBtn();
        }

        if (typeof window.updatePickaxeVisual === 'function') {
            window.updatePickaxeVisual();
        }

    } catch (e) {
        console.error("Load Error:", e);
    }
}
window.loadGame = loadGame;
