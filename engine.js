// Version: 8.0.0 - Engine / Save / Intro / Loop
// 기존 저장키 toothSaveV700 유지

// =========================
// 기본 세팅값
// =========================
window.gold = 0;
window.dia = 0;

window.unlockedDungeon = 1;
window.unlockedHellDungeon = 1;

window.pickaxeIdx = 0;
window.autoMineLevel = 1;
window.autoMergeSpeedLevel = 1;

window.inventory = new Array(window.INVENTORY_SIZE || 56).fill(0);
window.maxSlots = 24;

window.mineProgress = 0;
window.mergeProgress = 0;

window.isAutoMineOn = true;
window.isAutoMergeOn = true;

window.dragStartIdx = null;

window.mercenaryIdx = 0;
window.ownedMercenaries = [0];

window.isMuted = false;
window.masterVolume = 2;

window.slotUpgrades = Array.from({ length: window.TOP_ATTACK_SLOT_COUNT || 8 }, () => ({
    atk: 0,
    cd: 0,
    rng: 0
}));

window.globalUpgrades = {
    cd: 0,
    rng: 0
};

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

// 구버전 호환용 값
window.isToothAwakened = false;

// 신규 영상/초월 기록
window.hasPlayedHellVideo = false;
window.hasPlayedAwakenVideo = false;

window.isHellMode = false;
window.isBossRush = false;
window.isResetting = false;

window.fakeUsers = [];
window.currentView = window.currentView || "mine";
window.currentDungeonTab = window.currentDungeonTab || "normal";

let gameLoopInterval = null;
let introState = "ready";

// =========================
// 안전 유틸
// =========================
function getInventorySize() {
    return window.INVENTORY_SIZE || 56;
}

function normalizeNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function normalizeBoolean(value, fallback) {
    if (value === true || value === false) return value;
    return fallback;
}

function normalizeArray(value, length, fillValue) {
    if (!Array.isArray(value)) {
        return new Array(length).fill(fillValue);
    }

    const arr = value.slice(0, length);
    while (arr.length < length) arr.push(fillValue);
    return arr;
}

function normalizeSlotUpgrades(value) {
    const len = window.TOP_ATTACK_SLOT_COUNT || 8;

    if (!Array.isArray(value)) {
        return Array.from({ length: len }, () => ({ atk: 0, cd: 0, rng: 0 }));
    }

    const arr = [];

    for (let i = 0; i < len; i++) {
        const src = value[i] || {};
        arr.push({
            atk: normalizeNumber(src.atk, 0),
            cd: normalizeNumber(src.cd, 0),
            rng: normalizeNumber(src.rng, 0)
        });
    }

    return arr;
}

function normalizeTrainingLevels(value) {
    value = value || {};

    return {
        hp: normalizeNumber(value.hp, 0),
        atk: normalizeNumber(value.atk, 0),
        spd: normalizeNumber(value.spd, 0),
        crit: normalizeNumber(value.crit, 0),
        splashDmg: normalizeNumber(value.splashDmg, 0),
        splashRange: normalizeNumber(value.splashRange, 0)
    };
}

function normalizeGlobalUpgrades(value) {
    value = value || {};

    return {
        cd: normalizeNumber(value.cd, 0),
        rng: normalizeNumber(value.rng, 0)
    };
}

function clampInventoryLevels() {
    const maxLv = window.TOOTH_MAX_LEVEL || 25;

    for (let i = 0; i < window.inventory.length; i++) {
        let lv = normalizeNumber(window.inventory[i], 0);

        if (lv < 0) lv = 0;
        if (lv > maxLv) lv = maxLv;

        window.inventory[i] = lv;
    }
}

function refreshHighestToothLevelFromInventory() {
    let maxLv = normalizeNumber(window.highestToothLevel, 1);

    if (Array.isArray(window.inventory)) {
        window.inventory.forEach((lv) => {
            if (Number(lv) > maxLv) maxLv = Number(lv);
        });
    }

    window.highestToothLevel = Math.min(window.TOOTH_MAX_LEVEL || 25, Math.max(1, maxLv));
}

window.refreshHighestToothLevelFromInventory = refreshHighestToothLevelFromInventory;

// =========================
// 유물 기반 기본 채굴 레벨
// - 기존 세팅값은 유지
// - 직접 채굴 최대 Lv.12
// =========================
window.getBaseMiningLevel = function() {
    let completedSets = 0;

    if (window.artifactCounts && Array.isArray(window.artifactCounts)) {
        window.artifactCounts.forEach((count) => {
            if ((Number(count) || 0) >= 1) completedSets++;
        });
    }

    const extraLevel = Math.floor(completedSets / 3);
    const maxMineLv = window.MINING_MAX_LEVEL || 12;

    return Math.min(maxMineLv, 1 + extraLevel);
};

// =========================
// 저장
// =========================
function saveGame() {
    if (window.isResetting) return;

    const data = {
        version: window.GAME_VERSION || "8.0.0",

        gold: window.gold,
        dia: window.dia,

        maxSlots: window.maxSlots,
        inventory: window.inventory,

        unlockedDungeon: window.unlockedDungeon,
        unlockedHellDungeon: window.unlockedHellDungeon,

        pickaxeIdx: window.pickaxeIdx,
        autoMineLevel: window.autoMineLevel,
        autoMergeSpeedLevel: window.autoMergeSpeedLevel,

        mercenaryIdx: window.mercenaryIdx,
        ownedMercenaries: window.ownedMercenaries,

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

        // 구버전 호환 유지
        isToothAwakened: window.isToothAwakened,

        // 신규 기록
        hasPlayedHellVideo: window.hasPlayedHellVideo,
        hasPlayedAwakenVideo: window.hasPlayedAwakenVideo,

        isAutoMineOn: window.isAutoMineOn,
        isAutoMergeOn: window.isAutoMergeOn,

        lastTime: Date.now()
    };

    try {
        localStorage.setItem("toothSaveV700", JSON.stringify(data));
    } catch (e) {
        console.error("Save Error:", e);
    }
}

window.saveGame = saveGame;

// =========================
// 로드
// =========================
function loadGame() {
    try {
        const saved =
            localStorage.getItem("toothSaveV700") ||
            localStorage.getItem("toothSaveV695") ||
            localStorage.getItem("toothSaveV680");

        const d = saved ? JSON.parse(saved) : null;

        if (!d) {
            clampInventoryLevels();
            refreshHighestToothLevelFromInventory();
            return;
        }

        window.gold = normalizeNumber(d.gold, 0);
        window.dia = normalizeNumber(d.dia, 0);

        window.maxSlots = normalizeNumber(d.maxSlots, 24);
        window.maxSlots = Math.max(24, Math.min(getInventorySize(), window.maxSlots));

        window.inventory = normalizeArray(d.inventory, getInventorySize(), 0);
        clampInventoryLevels();

        window.unlockedDungeon = normalizeNumber(d.unlockedDungeon, 1);
        window.unlockedHellDungeon = normalizeNumber(d.unlockedHellDungeon, 1);

        window.pickaxeIdx = normalizeNumber(d.pickaxeIdx, 0);
        window.autoMineLevel = normalizeNumber(d.autoMineLevel, 1);
        window.autoMergeSpeedLevel = normalizeNumber(d.autoMergeSpeedLevel, 1);

        if (d.isMiningPaused !== undefined) {
            window.isAutoMineOn = !d.isMiningPaused;
            window.isAutoMergeOn = !d.isMiningPaused;
        } else {
            window.isAutoMineOn = normalizeBoolean(d.isAutoMineOn, true);
            window.isAutoMergeOn = normalizeBoolean(d.isAutoMergeOn, true);
        }

        window.mercenaryIdx = normalizeNumber(d.mercenaryIdx, 0);
        window.ownedMercenaries = Array.isArray(d.ownedMercenaries) ? d.ownedMercenaries.slice() : [0];

        if (!window.ownedMercenaries.includes(0)) {
            window.ownedMercenaries.unshift(0);
        }

        window.isMuted = normalizeBoolean(d.isMuted, false);
        window.masterVolume = normalizeNumber(d.masterVolume, 2);

        window.slotUpgrades = normalizeSlotUpgrades(d.slotUpgrades);
        window.globalUpgrades = normalizeGlobalUpgrades(d.globalUpgrades);
        window.greatChanceLevel = normalizeNumber(d.greatChanceLevel, 0);

        window.nickname = typeof d.nickname === "string" ? d.nickname : "";

        window.highestToothLevel = normalizeNumber(d.highestToothLevel, 1);

        window.trainingLevels = normalizeTrainingLevels(d.trainingLevels);
        window.artifactCounts = normalizeArray(d.artifactCounts, 30, 0);
        window.bossMarks = normalizeNumber(d.bossMarks, 0);

        window.isToothAwakened = normalizeBoolean(d.isToothAwakened, false);

        window.hasPlayedHellVideo = normalizeBoolean(d.hasPlayedHellVideo, false);
        window.hasPlayedAwakenVideo = normalizeBoolean(d.hasPlayedAwakenVideo, false);

        // 구버전에서 이미 각성한 저장값은 영상 다시보기 해금 상태로 인정
        if (window.isToothAwakened) {
            window.hasPlayedAwakenVideo = true;
        }

        // 일반 20단계 이후면 HELL 영상 다시보기 해금 상태로 인정
        if (window.unlockedDungeon > 20) {
            window.hasPlayedHellVideo = true;
        }

        refreshHighestToothLevelFromInventory();

        applyOfflineProgress(d.lastTime);

        clampInventoryLevels();
        refreshHighestToothLevelFromInventory();

    } catch (e) {
        console.error("Load Error:", e);
    }
}

window.loadGame = loadGame;

// =========================
// 오프라인 보상
// =========================
function applyOfflineProgress(lastTime) {
    if (!lastTime) return;

    const offTime = Math.max(0, (Date.now() - lastTime) / 1000);

    if (offTime < 3) return;

    if (window.isAutoMineOn && typeof window.addMinedItem === "function") {
        const miningSpeed = Math.max(2.0, 10.0 - ((window.autoMineLevel - 1) * 0.2));
        const minedCount = Math.min(200, Math.floor(offTime / miningSpeed));

        for (let i = 0; i < minedCount; i++) {
            if (!window.addMinedItem(false)) break;
        }
    }

    if (window.isAutoMergeOn && typeof window.autoMergeLowest === "function") {
        const currentMaxTime = Math.max(20000, 60000 - ((window.autoMergeSpeedLevel - 1) * 1000));
        const merges = Math.min(100, Math.floor((offTime * 1000) / currentMaxTime));

        for (let k = 0; k < merges; k++) {
            window.autoMergeLowest(false);
        }
    }
}

// =========================
// 게임 루프
// =========================
function startGameLoop() {
    if (gameLoopInterval) {
        clearInterval(gameLoopInterval);
    }

    gameLoopInterval = setInterval(gameLoop, 50);
}

function stopGameLoop() {
    if (gameLoopInterval) {
        clearInterval(gameLoopInterval);
        gameLoopInterval = null;
    }
}

function gameLoop() {
    if (window.dungeonActive) {
        return;
    }

    if (window.isAutoMineOn && typeof window.processMining === "function") {
        const miningSpeedSec = Math.max(2.0, 10.0 - ((window.autoMineLevel - 1) * 0.2));
        const tickAmt = 100 / (miningSpeedSec * 20);

        window.processMining(tickAmt, false);
    }

    if (window.isAutoMergeOn && typeof window.autoMergeLowest === "function") {
        const currentMaxTime = Math.max(20000, 60000 - ((window.autoMergeSpeedLevel - 1) * 1000));
        const increment = (50 / currentMaxTime) * 100;

        window.mergeProgress += increment;

        if (window.mergeProgress >= 100) {
            window.mergeProgress = 0;
            window.autoMergeLowest(true);
        }
    }

    if (typeof window.updateUI === "function") {
        window.updateUI();
    }
}

window.startGameLoop = startGameLoop;
window.stopGameLoop = stopGameLoop;
window.gameLoop = gameLoop;

// =========================
// UI 기본 갱신
// =========================
function updateUI() {
    const gd = document.getElementById("gold-display");
    if (gd) gd.innerText = typeof fNum === "function" ? fNum(window.gold) : Math.floor(window.gold);

    const dd = document.getElementById("dia-display");
    if (dd) dd.innerText = typeof fNum === "function" ? fNum(window.dia) : Math.floor(window.dia);

    const mineDial = document.getElementById("mine-dial");
    if (mineDial) {
        if (window.isAutoMineOn) {
            mineDial.style.background =
                `conic-gradient(#00fbff 0%, #00fbff ${window.mineProgress}%, #333 ${window.mineProgress}%, #333 100%)`;
        }
    }

    const mergeDial = document.getElementById("merge-dial");
    if (mergeDial) {
        if (window.isAutoMergeOn) {
            mergeDial.style.background =
                `conic-gradient(#9b59b6 0%, #9b59b6 ${window.mergeProgress}%, #333 ${window.mergeProgress}%, #333 100%)`;
        }
    }

    const pn = document.getElementById("pickaxe-name");
    if (pn && typeof TOOTH_DATA !== "undefined" && TOOTH_DATA.pickaxes[window.pickaxeIdx]) {
        pn.innerText = TOOTH_DATA.pickaxes[window.pickaxeIdx].name;
    }

    const slider = document.getElementById("volume-slider");
    if (slider) slider.value = String(window.masterVolume || 2);
}

window.updateUI = updateUI;

// =========================
// 닉네임
// =========================
window.checkNicknameAndStart = function() {
    if (!window.nickname) {
        const modal = document.getElementById("nickname-modal");
        const input = document.getElementById("nickname-input");

        if (input) {
            input.value = "User-" + Math.random().toString(36).substr(2, 4);
        }

        if (modal) {
            modal.style.display = "flex";
            return;
        }
    }

    startGameLoop();
};

window.confirmNickname = function() {
    const input = document.getElementById("nickname-input");

    if (!input) {
        window.nickname = window.nickname || "User";
        saveGame();
        startGameLoop();
        return;
    }

    const value = input.value.trim();

    if (value.length === 0) {
        alert("닉네임을 입력해주세요.");
        return;
    }

    window.nickname = value;

    const modal = document.getElementById("nickname-modal");
    if (modal) modal.style.display = "none";

    const nickDisp = document.getElementById("current-nickname-display");
    if (nickDisp) nickDisp.innerText = window.nickname;

    saveGame();

    if (!gameLoopInterval) {
        startGameLoop();
    } else {
        alert("닉네임이 성공적으로 변경되었습니다!");

        if (typeof window.generateRankings === "function") {
            window.generateRankings();
        }
    }
};

// =========================
// 인트로 영상
// =========================
function resetIntroVisual() {
    const layer = document.getElementById("intro-layer");
    const btnLayer = document.getElementById("start-btn-layer");
    const vid = document.getElementById("intro-video");
    const skipBtn = document.getElementById("skip-btn");
    const title = document.getElementById("intro-title-overlay");

    if (layer) {
        layer.style.display = "flex";
        layer.style.opacity = "1";
        layer.style.transition = "";
    }

    if (btnLayer) btnLayer.style.display = "flex";

    if (vid) {
        try {
            vid.pause();
            vid.currentTime = 0;
        } catch (e) {}

        vid.style.display = "none";
    }

    if (skipBtn) skipBtn.style.display = "none";
    if (title) title.style.display = "none";

    introState = "ready";
}

window.startIntro = function(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const btnLayer = document.getElementById("start-btn-layer");
    const vid = document.getElementById("intro-video");
    const skipBtn = document.getElementById("skip-btn");

    if (btnLayer) btnLayer.style.display = "none";
    if (skipBtn) skipBtn.style.display = "block";

    introState = "playing";

    if (!vid) {
        window.showIntroTitle();
        return;
    }

    vid.style.display = "block";
    vid.volume = window.masterVolume ? window.masterVolume * 0.3 : 0.6;
    vid.muted = !!window.isMuted;

    const playPromise = vid.play();

    if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
            window.showIntroTitle();
        });
    }

    vid.onended = function() {
        setTimeout(() => {
            window.showIntroTitle();
        }, 300);
    };
};

window.skipIntro = function(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    if (introState === "title") {
        window.completeIntro(event);
        return;
    }

    window.showIntroTitle();
};

window.showIntroTitle = function() {
    const vid = document.getElementById("intro-video");
    const skipBtn = document.getElementById("skip-btn");
    const title = document.getElementById("intro-title-overlay");
    const btnLayer = document.getElementById("start-btn-layer");

    if (vid) {
        try {
            vid.pause();
        } catch (e) {}
        vid.style.display = "block";
    }

    if (btnLayer) btnLayer.style.display = "none";
    if (skipBtn) skipBtn.style.display = "block";

    if (title) {
        title.style.display = "flex";
    }

    introState = "title";
};

window.completeIntro = function(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const layer = document.getElementById("intro-layer");
    const vid = document.getElementById("intro-video");

    if (vid) {
        try {
            vid.pause();
        } catch (e) {}
    }

    localStorage.setItem("toothIntroSeen_v7", "true");

    if (layer) {
        layer.style.transition = "opacity 0.8s ease";
        layer.style.opacity = "0";

        setTimeout(() => {
            layer.style.display = "none";
            layer.style.opacity = "1";
            window.checkNicknameAndStart();
        }, 800);
    } else {
        window.checkNicknameAndStart();
    }
};

// 구버전 호환
window.finishIntro = window.completeIntro;

// =========================
// HELL 영상
// =========================
window.playHellVideo = function(forceReplay = false) {
    const layer = document.getElementById("hell-video-layer");
    const vid = document.getElementById("hell-video");
    const skipBtn = document.getElementById("skip-hell-btn");

    if (!layer || !vid) {
        window.skipHellIntro();
        return;
    }

    if (!forceReplay && window.hasPlayedHellVideo) {
        return;
    }

    window.hasPlayedHellVideo = true;
    saveGame();

    layer.style.display = "flex";
    vid.style.display = "block";

    if (skipBtn) skipBtn.style.display = "block";

    try {
        vid.currentTime = 0;
    } catch (e) {}

    vid.volume = window.masterVolume ? window.masterVolume * 0.3 : 0.6;
    vid.muted = !!window.isMuted;

    const playPromise = vid.play();

    if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
            window.skipHellIntro();
        });
    }

    vid.onended = function() {
        setTimeout(() => {
            window.skipHellIntro();
        }, 300);
    };
};

window.skipHellIntro = function(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const vid = document.getElementById("hell-video");
    if (vid) {
        try {
            vid.pause();
        } catch (e) {}
    }

    const layer = document.getElementById("hell-video-layer");
    if (layer) layer.style.display = "none";

    const skipBtn = document.getElementById("skip-hell-btn");
    if (skipBtn) skipBtn.style.display = "none";

    if (window.currentView === "war" && typeof window.switchView === "function") {
        window.switchView("war");
    }
};

// =========================
// 초월 각성 영상
// =========================
window.playAwakenVideo = function(forceReplay = false) {
    const layer = document.getElementById("awaken-video-layer");
    const vid = document.getElementById("awaken-video");
    const skipBtn = document.getElementById("skip-awaken-btn");

    if (!layer || !vid) {
        window.skipAwakenIntro();
        return;
    }

    if (!forceReplay && window.hasPlayedAwakenVideo) {
        window.skipAwakenIntro();
        return;
    }

    window.hasPlayedAwakenVideo = true;
    window.isToothAwakened = true;
    saveGame();

    layer.style.display = "flex";
    vid.style.display = "block";

    if (skipBtn) skipBtn.style.display = "block";

    try {
        vid.currentTime = 0;
    } catch (e) {}

    vid.volume = window.masterVolume ? window.masterVolume * 0.3 : 0.6;
    vid.muted = !!window.isMuted;

    const playPromise = vid.play();

    if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
            window.skipAwakenIntro();
        });
    }

    vid.onended = function() {
        setTimeout(() => {
            window.skipAwakenIntro();
        }, 300);
    };
};

window.skipAwakenIntro = function(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const vid = document.getElementById("awaken-video");
    if (vid) {
        try {
            vid.pause();
        } catch (e) {}
    }

    const layer = document.getElementById("awaken-video-layer");
    if (layer) layer.style.display = "none";

    const skipBtn = document.getElementById("skip-awaken-btn");
    if (skipBtn) skipBtn.style.display = "none";

    try {
        if (typeof playSfx === "function") playSfx("awaken");
    } catch (e) {}

    if (!window.__awakenFlashRunning) {
        window.__awakenFlashRunning = true;

        const flash = document.createElement("div");
        flash.style.position = "fixed";
        flash.style.top = "0";
        flash.style.left = "0";
        flash.style.width = "100%";
        flash.style.height = "100%";
        flash.style.background = "white";
        flash.style.zIndex = "40000";
        flash.style.pointerEvents = "none";
        flash.style.animation = "splashFade 1.2s ease-out forwards";

        document.body.appendChild(flash);

        setTimeout(() => {
            flash.remove();
            window.__awakenFlashRunning = false;
        }, 1300);
    }

    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderCodex === "function") window.renderCodex();
    if (typeof window.updateUI === "function") window.updateUI();

    saveGame();
};

// =========================
// 설정창 영상 다시보기
// =========================
window.replayVideo = function(type) {
    if (type === "intro") {
        const settings = document.getElementById("settings-modal");
        if (settings) settings.style.display = "none";

        resetIntroVisual();
        return;
    }

    if (type === "hell") {
        if (!window.hasPlayedHellVideo && window.unlockedDungeon <= 20) {
            alert("아직 지옥문 개방 영상을 볼 수 없습니다.");
            return;
        }

        const settings = document.getElementById("settings-modal");
        if (settings) settings.style.display = "none";

        window.playHellVideo(true);
        return;
    }

    if (type === "awaken") {
        if (!window.hasPlayedAwakenVideo && window.highestToothLevel < 25) {
            alert("아직 초월 각성 영상을 볼 수 없습니다.");
            return;
        }

        const settings = document.getElementById("settings-modal");
        if (settings) settings.style.display = "none";

        window.playAwakenVideo(true);
    }
};

// =========================
// 저장코드 / 불러오기 / 초기화 / 쿠폰
// =========================
window.exportSaveCode = function() {
    saveGame();

    const saveData = localStorage.getItem("toothSaveV700") || localStorage.getItem("toothSaveV695");

    if (!saveData) {
        alert("저장된 데이터가 없습니다. 먼저 게임을 플레이해주세요.");
        return;
    }

    try {
        const encoded = btoa(encodeURIComponent(saveData));

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(encoded).then(() => {
                alert("✅ 저장 코드가 클립보드에 복사되었습니다. 메모장에 붙여넣어 보관하세요.");
            }).catch(() => {
                prompt("클립보드 복사 실패. 아래 코드를 전체 선택하여 복사하세요:", encoded);
            });
        } else {
            prompt("아래 코드를 전체 선택하여 복사하세요:", encoded);
        }
    } catch (e) {
        alert("코드 생성 중 오류가 발생했습니다.");
    }
};

window.importSave = function() {
    const str = prompt("저장 코드를 붙여넣으세요:");

    if (!str) return;

    try {
        const decoded = decodeURIComponent(atob(str));
        JSON.parse(decoded);

        localStorage.setItem("toothSaveV700", decoded);
        location.reload();
    } catch (e) {
        alert("오류가 발생했습니다. 저장 코드를 확인해주세요.");
    }
};

window.checkReset = function() {
    if (confirm("정말로 모든 데이터를 삭제하시겠습니까? 복구할 수 없습니다.")) {
        window.isResetting = true;
        localStorage.clear();
        location.reload();
    }
};

window.checkCoupon = function(code) {
    if (!code) return;

    const c = String(code).trim().toUpperCase();

    if (c === "100B" || c === "RICH100B") {
        window.gold += 100000000000;
        alert("치트키 적용!");
    } else if (c === "DIA100") {
        window.dia += 10000;
        alert("다이아 치트 적용!");
    } else if (c === "TEST") {
        window.gold += 1e25;
        window.dia += 999999;
        alert("테스트용 절대 재화가 지급되었습니다!");
    } else if (c === "HELLTEST") {
        window.unlockedDungeon = 21;
        window.unlockedHellDungeon = Math.max(window.unlockedHellDungeon, 1);
        window.gold += 1e15;
        window.dia += 100000;
        window.bossMarks += 100;

        for (let i = 0; i < 30; i++) {
            window.artifactCounts[i] = 1;
        }

        window.hasPlayedHellVideo = true;

        alert("🔥 [테스트 완료] 지옥문 / 재화 / 보스징표 / 유물 올클리어!");
    } else if (c === "MAXTEST") {
        window.gold += 1e20;
        window.dia += 1000000;
        window.bossMarks += 100;

        const empty = window.inventory.findIndex((v, idx) => idx < window.maxSlots && v === 0);
        if (empty >= 0) {
            window.inventory[empty] = 24;
        }

        window.highestToothLevel = Math.max(window.highestToothLevel, 24);

        alert("👑 Lv.24 봉인된 왕관 치아 테스트 지급!");
    } else {
        alert("유효하지 않은 쿠폰입니다.");
        return;
    }

    refreshHighestToothLevelFromInventory();

    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderDungeonList === "function") window.renderDungeonList();
    if (typeof window.renderArtifacts === "function") window.renderArtifacts();

    saveGame();
};

window.promptCoupon = function() {
    setTimeout(() => {
        const code = prompt("쿠폰 코드를 입력하세요:");

        if (code) {
            window.checkCoupon(code);
        }
    }, 10);
};

// =========================
// 시작 초기화
// =========================
function initGame() {
    loadGame();

    if (typeof window.setupMiningTouch === "function") {
        window.setupMiningTouch();
    }

    if (typeof window.switchView === "function") {
        window.switchView("mine");
    }

    if (typeof window.updateToggleButtons === "function") {
        window.updateToggleButtons();
    }

    if (typeof window.updateSoundBtn === "function") {
        window.updateSoundBtn();
    }

    if (typeof window.updatePickaxeVisual === "function") {
        window.updatePickaxeVisual();
    }

    if (typeof window.renderInventory === "function") {
        window.renderInventory();
    }

    if (typeof window.updateUI === "function") {
        window.updateUI();
    }

    const introSeen = localStorage.getItem("toothIntroSeen_v7");

    if (introSeen === "true") {
        const layer = document.getElementById("intro-layer");
        if (layer) layer.style.display = "none";

        window.checkNicknameAndStart();
    } else {
        resetIntroVisual();
    }

    saveGame();
}

window.initGame = initGame;

window.addEventListener("load", initGame);
