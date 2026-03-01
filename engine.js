// Version: 8.0.0 - Game Engine (Loop, Save/Load, Offline Progress, Buff Timers)

// --- [ 1. 초기 변수 세팅 ] ---
window.gold = 0;
window.dia = 0;
window.pickaxeLevel = 0;
window.inventoryLevel = 0;
window.maxSlots = 16;
window.autoMineLevel = 0;
window.autoMineSpeed = 10.0;
window.autoMergeLevel = 0;
window.autoMergeSpeed = 10.0;
window.greatSuccessLevel = 0;
window.greatSuccessProb = 0;

window.highestToothLevel = 1;
window.inventory = [];
window.unlockedDungeon = 1;
window.unlockedHellDungeon = 1;
window.refineLevels = [0,0,0,0,0,0,0,0];
window.bossMarks = 0;
window.isToothAwakened = false;

window.activeMercenary = null;
window.trainingLevel = 0;
window.critRateLevel = 0;
window.critDmgLevel = 0;
window.splashLevel = 0;

window.artifacts = [];
window.inventoryItems = {}; // 신규: 소모품 인벤토리
window.activeBuffs = {};    // 신규: 현재 적용 중인 버프

window.isAutoMineOn = false;
window.isAutoMergeOn = false;
window.autoMineProgress = 0;
window.autoMergeProgress = 0;
window.lastTime = Date.now();
window.isMuted = false;
window.masterVolume = 2;
window.nickname = "용감한치과의사";

// --- [ 2. 세이브 / 로드 시스템 ] ---
window.saveGame = function() {
    const data = {
        gold: window.gold,
        dia: window.dia,
        pickaxeLevel: window.pickaxeLevel,
        inventoryLevel: window.inventoryLevel,
        autoMineLevel: window.autoMineLevel,
        autoMergeLevel: window.autoMergeLevel,
        greatSuccessLevel: window.greatSuccessLevel,
        highestToothLevel: window.highestToothLevel,
        inventory: window.inventory,
        unlockedDungeon: window.unlockedDungeon,
        unlockedHellDungeon: window.unlockedHellDungeon,
        refineLevels: window.refineLevels,
        bossMarks: window.bossMarks,
        isToothAwakened: window.isToothAwakened,
        activeMercenary: window.activeMercenary,
        trainingLevel: window.trainingLevel,
        critRateLevel: window.critRateLevel,
        critDmgLevel: window.critDmgLevel,
        splashLevel: window.splashLevel,
        artifacts: window.artifacts,
        inventoryItems: window.inventoryItems || {},
        isMuted: window.isMuted,
        masterVolume: window.masterVolume,
        nickname: window.nickname,
        lastSaveTime: Date.now()
    };
    localStorage.setItem('toothIdleSaveV8', JSON.stringify(data));
};

window.loadGame = function() {
    const save = localStorage.getItem('toothIdleSaveV8');
    if (save) {
        try {
            const data = JSON.parse(save);
            window.gold = data.gold || 0;
            window.dia = data.dia || 0;
            window.pickaxeLevel = data.pickaxeLevel || 0;
            window.inventoryLevel = data.inventoryLevel || 0;
            window.maxSlots = 16 + (window.inventoryLevel * 8);
            window.autoMineLevel = data.autoMineLevel || 0;
            window.autoMineSpeed = Math.max(0.2, 10.0 - (window.autoMineLevel * 0.2));
            window.autoMergeLevel = data.autoMergeLevel || 0;
            window.autoMergeSpeed = Math.max(2.0, 10.0 - (window.autoMergeLevel * 0.2));
            window.greatSuccessLevel = data.greatSuccessLevel || 0;
            window.greatSuccessProb = window.greatSuccessLevel * 0.02;
            window.highestToothLevel = data.highestToothLevel || 1;
            window.inventory = data.inventory || [];
            window.unlockedDungeon = data.unlockedDungeon || 1;
            window.unlockedHellDungeon = data.unlockedHellDungeon || 1;
            window.refineLevels = data.refineLevels || [0,0,0,0,0,0,0,0];
            window.bossMarks = data.bossMarks || 0;
            window.isToothAwakened = data.isToothAwakened || false;
            window.activeMercenary = data.activeMercenary || null;
            window.trainingLevel = data.trainingLevel || 0;
            window.critRateLevel = data.critRateLevel || 0;
            window.critDmgLevel = data.critDmgLevel || 0;
            window.splashLevel = data.splashLevel || 0;
            window.artifacts = data.artifacts || [];
            window.inventoryItems = data.inventoryItems || {};
            window.isMuted = data.isMuted || false;
            window.masterVolume = data.masterVolume || 2;
            window.nickname = data.nickname || "용감한치과의사";
            
            // 오프라인 보상 계산
            if (data.lastSaveTime) {
                let offTime = (Date.now() - data.lastSaveTime) / 1000;
                if (offTime > 60) {
                    let offGold = Math.floor(offTime * (10 * Math.pow(1.5, window.unlockedDungeon)));
                    window.gold += offGold;
                    alert(`오프라인 보상: ${fNum(offGold)} 골드를 획득했습니다! (방치 시간: ${Math.floor(offTime/60)}분)`);
                }
            }
        } catch(e) { console.error("세이브 파일 오류", e); }
    }
    
    if(typeof window.updateStats === 'function') window.updateStats();
    if(typeof window.renderInventory === 'function') window.renderInventory();
    if(typeof window.updateSoundBtn === 'function') window.updateSoundBtn();
};

// --- [ 3. 데이터 관리 기능 ] ---
window.exportSaveCode = function() {
    const save = localStorage.getItem('toothIdleSaveV8');
    if(!save) return alert('저장된 데이터가 없습니다.');
    const encoded = btoa(encodeURIComponent(save));
    navigator.clipboard.writeText(encoded).then(() => {
        alert('저장 코드가 클립보드에 복사되었습니다!\n다른 기기에서 불러오기를 통해 이어서 플레이할 수 있습니다.');
    });
};

window.importSave = function() {
    const code = prompt('발급받은 저장 코드를 붙여넣어 주세요.');
    if(!code) return;
    try {
        const decoded = decodeURIComponent(atob(code));
        JSON.parse(decoded); // 유효성 검사
        localStorage.setItem('toothIdleSaveV8', decoded);
        alert('데이터를 성공적으로 불러왔습니다! 게임을 재시작합니다.');
        location.reload();
    } catch(e) {
        alert('잘못된 코드입니다.');
    }
};

window.checkReset = function() {
    if(confirm("정말 모든 데이터를 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) {
        if(confirm("확실합니까? 모든 치아와 재화가 사라집니다.")) {
            localStorage.removeItem('toothIdleSaveV8');
            location.reload();
        }
    }
};

// --- [ 4. 초당 게임 루프 (Engine Heartbeat) ] ---
function gameLoop() {
    const now = Date.now();
    const dt = (now - window.lastTime) / 1000;
    window.lastTime = now;
    
    // 🌟 신규: 버프(소모품) 만료 체크
    let buffChanged = false;
    if (window.activeBuffs) {
        for (let type in window.activeBuffs) {
            if (window.activeBuffs[type].endTime <= now) {
                delete window.activeBuffs[type];
                buffChanged = true;
            }
        }
    }
    if (buffChanged && typeof window.renderActiveBuffs === 'function') {
        window.renderActiveBuffs();
    }

    // 버프 배율 적용 계산
    let mineSpeedMult = (window.activeBuffs && window.activeBuffs['mine_speed']) ? window.activeBuffs['mine_speed'].multiplier : 1;
    let mergeSpeedMult = (window.activeBuffs && window.activeBuffs['merge_speed']) ? window.activeBuffs['merge_speed'].multiplier : 1;

    // 🌟 이원화된 오토 채굴 시스템 (터치와 게이지 공유 안 함)
    if (window.isAutoMineOn) {
        window.autoMineProgress += dt * mineSpeedMult;
        const targetSpeed = window.autoMineSpeed;
        
        if (window.autoMineProgress >= targetSpeed) {
            window.autoMineProgress = 0;
            if(typeof window.autoAddTooth === 'function') window.autoAddTooth();
        }
        
        const mineDial = document.getElementById('mine-dial');
        if (mineDial) {
            let pct = (window.autoMineProgress / targetSpeed) * 100;
            mineDial.style.background = `conic-gradient(#00fbff ${pct}%, #333 ${pct}%)`;
        }
    } else {
        const mineDial = document.getElementById('mine-dial');
        if (mineDial && !mineDial.classList.contains('dial-off')) {
            mineDial.style.background = `conic-gradient(#00fbff 0%, #333 0%)`;
        }
    }

    // 오토 합성 시스템
    if (window.isAutoMergeOn) {
        window.autoMergeProgress += dt * mergeSpeedMult;
        const targetMergeSpeed = window.autoMergeSpeed;
        
        if (window.autoMergeProgress >= targetMergeSpeed) {
            window.autoMergeProgress = 0;
            if(typeof window.autoMergeAll === 'function') window.autoMergeAll();
        }
        
        const mergeDial = document.getElementById('merge-dial');
        if (mergeDial) {
            let pct = (window.autoMergeProgress / targetMergeSpeed) * 100;
            mergeDial.style.background = `conic-gradient(#9b59b6 ${pct}%, #333 ${pct}%)`;
        }
    } else {
         const mergeDial = document.getElementById('merge-dial');
        if (mergeDial && !mergeDial.classList.contains('dial-off')) {
            mergeDial.style.background = `conic-gradient(#9b59b6 0%, #333 0%)`;
        }
    }

    // 자동 저장 (약 1% 확률 = 1~2초에 1번)
    if (Math.random() < 0.01) {
        window.saveGame();
    }

    requestAnimationFrame(gameLoop);
}

// 엔진 구동 스위치
window.startGameEngine = function() {
    window.loadGame();
    
    // 오프라인 동안 이미 만료된 버프 청소
    const now = Date.now();
    for (let type in window.activeBuffs) {
        if (window.activeBuffs[type].endTime <= now) {
            delete window.activeBuffs[type];
        }
    }
    
    window.lastTime = Date.now();
    requestAnimationFrame(gameLoop);
    
    // 1초마다 상단 버프 타이머 UI 갱신
    setInterval(() => {
        if(typeof window.renderActiveBuffs === 'function') window.renderActiveBuffs();
    }, 1000);
};
