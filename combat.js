// Version: 8.0.0 - Combat System (Stats, Damage Math, Waves, Rewards, Drops)

window.inBattle = false;
window.currentWave = 1;
window.maxWaves = 5;
window.dungeonTarget = 1;
window.dungeonType = 'normal'; // normal, boss, hell, hellboss
window.combatIntervals = [];

// --- [ 1. 전투 진입 및 초기화 ] ---
window.startDungeon = function(floor, type) {
    if (!window.activeMercenary) {
        alert("용병 주점에서 용병을 먼저 고용해주세요!");
        return;
    }
    
    // 입장료 (다이아 소모)
    let entryFee = 0;
    if (type === 'boss' || type === 'hellboss') entryFee = 10;
    else if (type === 'hell') entryFee = 5;
    
    if (window.dia < entryFee) {
        alert(`입장 다이아가 부족합니다! (필요: ♦️ ${entryFee})`);
        return;
    }
    window.dia -= entryFee;
    if(typeof window.updateStats === 'function') window.updateStats();

    // 변수 초기화
    window.dungeonTarget = floor;
    window.dungeonType = type;
    window.currentWave = 1;
    window.inBattle = true;
    
    if (type === 'boss' || type === 'hellboss') window.maxWaves = 3;
    else window.maxWaves = 5;

    document.getElementById('game-container').style.display = 'none';
    document.getElementById('battle-screen').style.display = 'block';
    
    // 전투 배경 설정
    let dList = (type === 'hell' || type === 'hellboss') ? TOOTH_DATA.hellDungeons : TOOTH_DATA.dungeons;
    let name = dList[Math.min(floor - 1, dList.length - 1)];
    document.getElementById('current-dungeon-name').innerText = name;
    
    let mDataList = (type === 'hell' || type === 'hellboss') ? TOOTH_DATA.hellMobs : TOOTH_DATA.dungeonMobs;
    let themeIndex = Math.min(floor - 1, mDataList.length - 1);
    let themeClass = mDataList[themeIndex].theme;
    
    const world = document.getElementById('battle-world');
    world.className = '';
    world.classList.add(themeClass);

    try { if(typeof playSfx === 'function') playSfx('unlock'); } catch(e){}

    // 전투 UI(무기 슬롯 및 조이스틱) 렌더링 호출
    if(typeof window.initBattleUI === 'function') window.initBattleUI();
    
    // 1초 뒤 웨이브 시작
    setTimeout(() => {
        if(window.inBattle && typeof window.spawnWave === 'function') window.spawnWave();
    }, 1000);
};

// --- [ 2. 전투 종료 및 보상 계산 ] ---
window.winDungeon = function() {
    window.inBattle = false;
    window.clearAllCombatIntervals();
    
    let isHell = (window.dungeonType === 'hell' || window.dungeonType === 'hellboss');
    let isBossRush = (window.dungeonType === 'boss' || window.dungeonType === 'hellboss');
    
    // 1. 기본 골드 보상 공식: 2000 * 2.5^(층수-1)
    let baseGold = 2000 * Math.pow(2.5, window.dungeonTarget - 1);
    let goldMult = 1;
    
    // 2. 버프 및 특수효과 배율 적용
    if (window.activeBuffs && window.activeBuffs['gold_boost']) {
        goldMult *= window.activeBuffs['gold_boost'].multiplier; // 물약 2배
    }
    if (window.highestToothLevel >= 22) {
        goldMult *= 5; // 22레벨 달성 시 보상 5배 특수효과
    }
    if (isHell) {
        goldMult *= 20; // HELL 모드 보상 20배
    }
    
    let finalGold = Math.floor(baseGold * goldMult);
    window.gold += finalGold;

    // 다이아 보상
    let diaReward = isBossRush ? 20 : (isHell ? 10 : 2);
    window.dia += diaReward;
    
    // 보스 징표 (24레벨 해제용)
    if (isBossRush) window.bossMarks = (window.bossMarks || 0) + 1;

    // 3. 층수 해금 (최초 클리어 시에만)
    if (isHell) {
        if (window.dungeonTarget === window.unlockedHellDungeon) window.unlockedHellDungeon++;
    } else {
        if (window.dungeonTarget === window.unlockedDungeon) window.unlockedDungeon++;
        // 20층 클리어 시 HELL 오픈 연출
        if (window.dungeonTarget === 20 && window.unlockedDungeon === 21) {
            if(typeof window.playHellIntro === 'function') window.playHellIntro();
        }
    }

    // 4. 유물 드랍 판정 (보스전 한정, 20% 확률)
    let artifactDrop = null;
    if (Math.random() < 0.20) {
        let pool = isHell ? TOOTH_DATA.artifacts.slice(20, 30) : TOOTH_DATA.artifacts.slice(0, 20);
        let randArt = pool[Math.floor(Math.random() * pool.length)];
        if (!window.artifacts.includes(randArt.name)) {
            window.artifacts.push(randArt.name);
            artifactDrop = randArt;
            // 3개 모일 때마다 채굴 레벨 보너스가 적용되므로 스탯 업데이트
            if(typeof window.updateStats === 'function') window.updateStats();
        }
    }

    // 5. 신규: 소모품(물약) 드랍 판정 (모든 던전, 15% 확률)
    let itemDrop = null;
    if (Math.random() < 0.15) {
        let randItem = TOOTH_DATA.consumables[Math.floor(Math.random() * TOOTH_DATA.consumables.length)];
        if (!window.inventoryItems) window.inventoryItems = {};
        if (!window.inventoryItems[randItem.id]) window.inventoryItems[randItem.id] = 0;
        
        window.inventoryItems[randItem.id]++;
        itemDrop = randItem;
    }

    if(typeof window.saveGame === 'function') window.saveGame();
    if(typeof window.updateStats === 'function') window.updateStats();
    if(typeof window.showDungeonResult === 'function') {
        window.showDungeonResult(true, isHell, finalGold, diaReward, artifactDrop, itemDrop);
    }
};

window.loseDungeon = function() {
    window.inBattle = false;
    window.clearAllCombatIntervals();
    if(typeof window.showDungeonResult === 'function') {
        window.showDungeonResult(false, false, 0, 0, null, null);
    }
};

// --- [ 3. 후퇴 및 리트라이 (UI 연동) ] ---
window.exitDungeon = function() {
    window.inBattle = false;
    window.clearAllCombatIntervals();
    document.getElementById('battle-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    if(typeof window.updateStats === 'function') window.updateStats();
};

window.retryDungeon = function() {
    closeModal('dungeon-result-modal');
    window.startDungeon(window.dungeonTarget, window.dungeonType);
};

window.nextDungeon = function() {
    closeModal('dungeon-result-modal');
    window.startDungeon(window.dungeonTarget + 1, window.dungeonType);
};

// --- [ 4. 데미지 수치 계산 (공격력/치명타) ] ---
window.calculateDamage = function() {
    // 플레이어 기본 공격력 (치아 레벨 기반)
    let baseAtk = getAtk(window.highestToothLevel);
    
    // 1. 용병 증폭 배율
    let mercMult = window.activeMercenary ? window.activeMercenary.atkMul : 1;
    let finalAtk = baseAtk * mercMult;
    
    // 2. 제련소(Top 8) 보너스 배율 합산
    let refineBonus = 0;
    for (let i = 0; i < 8; i++) {
        let lv = window.refineLevels[i] || 0;
        refineBonus += lv * 0.1; // 1레벨당 10%
    }
    finalAtk = finalAtk * (1 + refineBonus);

    // 3. 치명타 판정 (훈련장 데이터 적용)
    let isCrit = false;
    let critChance = 0.05 + ((window.critRateLevel || 0) * 0.01); // 기본 5% + 레벨당 1%
    if (Math.random() < critChance) {
        isCrit = true;
        let critMult = 2.0 + ((window.critDmgLevel || 0) * 0.1); // 기본 200% + 레벨당 10%
        finalAtk *= critMult;
    }

    return {
        damage: Math.floor(finalAtk),
        isCrit: isCrit,
        splashRange: (window.splashLevel || 0) * 10 // 훈련장 스플래시 범위
    };
};

window.clearAllCombatIntervals = function() {
    window.combatIntervals.forEach(id => clearInterval(id));
    window.combatIntervals = [];
};
