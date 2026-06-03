// Version: 8.1.0 - Engine / Save / Loop / Coupon / Video / UI State

// =========================
// 기본 상태값
// =========================
window.gold = 0;
window.dia = 0;
window.nickname = "Player";

window.inventory = new Array(window.INVENTORY_SIZE || 56).fill(0);
window.inventorySlots = 24;

window.mineProgress = 0;
window.autoMineProgress = 0;
window.autoMergeProgress = 0;

window.pickaxeIdx = 0;

window.autoMineOn = false;
window.autoMergeOn = false;

window.autoMineLevel = 1;
window.autoMergeLevel = 1;
window.greatChanceLevel = 0;

window.currentView = "mine";
window.currentResearchTab = "pickaxe";
window.currentDungeonTab = "normal";

window.unlockedDungeon = 1;      // 일반 던전 오픈 개수. 1이면 1번 던전만 가능.
window.unlockedHellDungeon = 0;  // HELL은 0이면 잠김.

window.mercenaryIdx = 0;
window.unlockedMercenaries = [true, false, false, false, false, false, false];

window.artifactCounts = new Array(40).fill(0);
window.bossMarks = 0;

window.highestToothLevel = 0;
window.isToothAwakened = false;

window.introSeen = false;
window.hellVideoSeen = false;
window.awakenVideoSeen = false;

window.dungeonPaused = false;

window.slotUpgrades = [];
window.globalUpgrades = {
    atk: 0,
    cd: 0,
    rng: 0
};

window.trainingLevels = {
    hp: 0,
    atk: 0,
    spd: 0,
    crit: 0,
    splashDmg: 0,
    splashRange: 0
};

for (let i = 0; i < 8; i++) {
    window.slotUpgrades.push({
        atk: 0,
        cd: 0,
        rng: 0
    });
}

// =========================
// 내부 루프 변수
// =========================
let __engineStarted = false;
let __lastFrameTime = performance.now();
let __autoMineTimer = 0;
let __autoMergeTimer = 0;
let __saveTimer = 0;
let __uiTimer = 0;

// =========================
// 기본값 생성
// =========================
function getDefaultSaveData() {
    return {
        gold: 0,
        dia: 0,
        nickname: "Player",

        inventory: new Array(window.INVENTORY_SIZE || 56).fill(0),
        inventorySlots: 24,

        mineProgress: 0,

        pickaxeIdx: 0,

        autoMineOn: false,
        autoMergeOn: false,
        autoMineLevel: 1,
        autoMergeLevel: 1,
        greatChanceLevel: 0,

        currentView: "mine",
        currentResearchTab: "pickaxe",
        currentDungeonTab: "normal",

        unlockedDungeon: 1,
        unlockedHellDungeon: 0,

        mercenaryIdx: 0,
        unlockedMercenaries: [true, false, false, false, false, false, false],

        artifactCounts: new Array(40).fill(0),
        bossMarks: 0,

        highestToothLevel: 0,
        isToothAwakened: false,

        introSeen: false,
        hellVideoSeen: false,
        awakenVideoSeen: false,

        slotUpgrades: new Array(8).fill(null).map(() => ({
            atk: 0,
            cd: 0,
            rng: 0
        })),

        globalUpgrades: {
            atk: 0,
            cd: 0,
            rng: 0
        },

        trainingLevels: {
            hp: 0,
            atk: 0,
            spd: 0,
            crit: 0,
            splashDmg: 0,
            splashRange: 0
        }
    };
}

// =========================
// 저장 / 불러오기
// =========================
window.saveGame = function() {
    try {
        if (typeof normalizeArtifactCounts === "function") {
            normalizeArtifactCounts();
        }

        const data = {
            gold: window.gold,
            dia: window.dia,
            nickname: window.nickname,

            inventory: window.inventory,
            inventorySlots: window.inventorySlots,

            mineProgress: window.mineProgress,

            pickaxeIdx: window.pickaxeIdx,

            autoMineOn: window.autoMineOn,
            autoMergeOn: window.autoMergeOn,
            autoMineLevel: window.autoMineLevel,
            autoMergeLevel: window.autoMergeLevel,
            greatChanceLevel: window.greatChanceLevel,

            currentView: window.currentView,
            currentResearchTab: window.currentResearchTab,
            currentDungeonTab: window.currentDungeonTab,

            unlockedDungeon: window.unlockedDungeon,
            unlockedHellDungeon: window.unlockedHellDungeon,

            mercenaryIdx: window.mercenaryIdx,
            unlockedMercenaries: window.unlockedMercenaries,

            artifactCounts: window.artifactCounts,
            bossMarks: window.bossMarks,

            highestToothLevel: window.highestToothLevel,
            isToothAwakened: window.isToothAwakened,

            introSeen: window.introSeen,
            hellVideoSeen: window.hellVideoSeen,
            awakenVideoSeen: window.awakenVideoSeen,

            slotUpgrades: window.slotUpgrades,
            globalUpgrades: window.globalUpgrades,
            trainingLevels: window.trainingLevels,

            savedAt: Date.now()
        };

        localStorage.setItem(window.SAVE_KEY || "toothSaveV700", JSON.stringify(data));
    } catch (e) {
        console.warn("saveGame failed", e);
    }
};

window.loadGame = function() {
    const defaults = getDefaultSaveData();

    let loaded = null;

    try {
        const raw = localStorage.getItem(window.SAVE_KEY || "toothSaveV700");
        if (raw) loaded = JSON.parse(raw);
    } catch (e) {
        loaded = null;
    }

    const data = Object.assign({}, defaults, loaded || {});

    window.gold = Number(data.gold) || 0;
    window.dia = Number(data.dia) || 0;
    window.nickname = data.nickname || "Player";

    window.inventory = Array.isArray(data.inventory)
        ? data.inventory.map((v) => Number(v) || 0)
        : defaults.inventory;

    if (typeof ensureArrayLength === "function") {
        window.inventory = ensureArrayLength(window.inventory, window.INVENTORY_SIZE || 56, 0);
    } else {
        while (window.inventory.length < (window.INVENTORY_SIZE || 56)) window.inventory.push(0);
        window.inventory.length = window.INVENTORY_SIZE || 56;
    }

    window.inventorySlots = Number(data.inventorySlots) || 24;
    window.inventorySlots = Math.max(24, Math.min(window.INVENTORY_SIZE || 56, window.inventorySlots));

    window.mineProgress = Number(data.mineProgress) || 0;

    window.pickaxeIdx = Number(data.pickaxeIdx) || 0;

    window.autoMineOn = !!data.autoMineOn;
    window.autoMergeOn = !!data.autoMergeOn;
    window.autoMineLevel = Math.max(1, Number(data.autoMineLevel) || 1);
    window.autoMergeLevel = Math.max(1, Number(data.autoMergeLevel) || 1);
    window.greatChanceLevel = Math.max(0, Number(data.greatChanceLevel) || 0);

    window.currentView = data.currentView || "mine";
    window.currentResearchTab = data.currentResearchTab || "pickaxe";
    window.currentDungeonTab = data.currentDungeonTab || "normal";

    window.unlockedDungeon = Math.max(1, Number(data.unlockedDungeon) || 1);
    window.unlockedDungeon = Math.min(21, window.unlockedDungeon);

    window.unlockedHellDungeon = Math.max(0, Number(data.unlockedHellDungeon) || 0);
    window.unlockedHellDungeon = Math.min(20, window.unlockedHellDungeon);

    window.mercenaryIdx = Number(data.mercenaryIdx) || 0;

    window.unlockedMercenaries = Array.isArray(data.unlockedMercenaries)
        ? data.unlockedMercenaries.map((v) => !!v)
        : defaults.unlockedMercenaries;

    if (typeof TOOTH_DATA !== "undefined" && TOOTH_DATA.mercenaries) {
        while (window.unlockedMercenaries.length < TOOTH_DATA.mercenaries.length) {
            window.unlockedMercenaries.push(false);
        }
        window.unlockedMercenaries.length = TOOTH_DATA.mercenaries.length;
    }

    window.unlockedMercenaries[0] = true;

    window.artifactCounts = Array.isArray(data.artifactCounts)
        ? data.artifactCounts.map((v) => (Number(v) > 0 ? 1 : 0))
        : defaults.artifactCounts;

    if (typeof ensureArrayLength === "function") {
        window.artifactCounts = ensureArrayLength(window.artifactCounts, 40, 0);
    } else {
        while (window.artifactCounts.length < 40) window.artifactCounts.push(0);
        window.artifactCounts.length = 40;
    }

    if (typeof normalizeArtifactCounts === "function") {
        normalizeArtifactCounts();
    }

    window.bossMarks = Math.max(0, Number(data.bossMarks) || 0);

    window.highestToothLevel = Math.max(0, Number(data.highestToothLevel) || 0);
    window.isToothAwakened = !!data.isToothAwakened;

    window.introSeen = !!data.introSeen;
    window.hellVideoSeen = !!data.hellVideoSeen;
    window.awakenVideoSeen = !!data.awakenVideoSeen;

    window.slotUpgrades = Array.isArray(data.slotUpgrades)
        ? data.slotUpgrades
        : defaults.slotUpgrades;

    while (window.slotUpgrades.length < 8) {
        window.slotUpgrades.push({ atk: 0, cd: 0, rng: 0 });
    }

    window.slotUpgrades = window.slotUpgrades.slice(0, 8).map((u) => ({
        atk: Number(u && u.atk) || 0,
        cd: Number(u && u.cd) || 0,
        rng: Number(u && u.rng) || 0
    }));

    window.globalUpgrades = Object.assign({}, defaults.globalUpgrades, data.globalUpgrades || {});
    window.globalUpgrades.atk = Number(window.globalUpgrades.atk) || 0;
    window.globalUpgrades.cd = Number(window.globalUpgrades.cd) || 0;
    window.globalUpgrades.rng = Number(window.globalUpgrades.rng) || 0;

    window.trainingLevels = Object.assign({}, defaults.trainingLevels, data.trainingLevels || {});
    Object.keys(defaults.trainingLevels).forEach((k) => {
        window.trainingLevels[k] = Number(window.trainingLevels[k]) || 0;
    });

    refreshHighestToothLevel();

    window.dungeonPaused = false;
};

// =========================
// 최고 치아 레벨 갱신
// =========================
window.refreshHighestToothLevel = function() {
    let highest = 0;

    if (Array.isArray(window.inventory)) {
        for (const lv of window.inventory) {
            highest = Math.max(highest, Number(lv) || 0);
        }
    }

    window.highestToothLevel = Math.max(window.highestToothLevel || 0, highest);

    if (window.highestToothLevel >= 25) {
        window.isToothAwakened = true;
    }

    return window.highestToothLevel;
};

function refreshHighestToothLevel() {
    return window.refreshHighestToothLevel();
}

// =========================
// 기본 계산 함수
// =========================
window.getMaxInventorySlots = function() {
    return Math.max(24, Math.min(window.inventorySlots || 24, window.INVENTORY_SIZE || 56));
};

window.getBaseMiningLevel = function() {
    // 직접 채굴은 최대 Lv.12까지만
    const pickaxeBonus = Math.floor((Number(window.pickaxeIdx) || 0) / 2);
    const base = 1 + pickaxeBonus;

    return Math.min(window.MINING_MAX_LEVEL || 12, Math.max(1, base));
};

window.getAutoMineIntervalMs = function() {
    const lv = Math.max(1, Number(window.autoMineLevel) || 1);
    const sec = Math.max(2.0, 10.0 - ((lv - 1) * 0.2));

    return sec * 1000;
};

window.getAutoMergeIntervalMs = function() {
    const lv = Math.max(1, Number(window.autoMergeLevel) || 1);
    const sec = Math.max(20.0, 60.0 - ((lv - 1) * 1.0));

    return sec * 1000;
};

window.getGreatChance = function() {
    const lv = Math.max(0, Number(window.greatChanceLevel) || 0);
    return Math.min(0.5, lv * 0.02);
};

window.getTop8TotalAtk = function() {
    if (!Array.isArray(window.inventory)) return 0;

    let total = 0;

    for (let i = 0; i < 8; i++) {
        const lv = Number(window.inventory[i]) || 0;
        if (typeof getAtk === "function") {
            total += getAtk(lv);
        }
    }

    return Math.floor(total);
};

window.getPlayerCombatPower = function() {
    let total = window.getTop8TotalAtk();

    const merc = typeof TOOTH_DATA !== "undefined"
        ? TOOTH_DATA.mercenaries[window.mercenaryIdx]
        : null;

    if (merc) {
        total *= merc.atkMul;
    }

    if (window.globalUpgrades && window.globalUpgrades.atk) {
        total *= 1 + (window.globalUpgrades.atk * 0.05);
    }

    if (window.trainingLevels && window.trainingLevels.atk) {
        total *= 1 + (window.trainingLevels.atk * 0.1);
    }

    return Math.floor(total);
};

// =========================
// UI 갱신
// =========================
window.updateUI = function() {
    const goldEl = document.getElementById("gold-display");
    const diaEl = document.getElementById("dia-display");
    const nickEl = document.getElementById("nickname-display");

    if (goldEl) goldEl.innerText = typeof fNum === "function" ? fNum(window.gold) : Math.floor(window.gold);
    if (diaEl) diaEl.innerText = typeof fNum === "function" ? fNum(window.dia) : Math.floor(window.dia);
    if (nickEl) nickEl.innerText = window.nickname || "Player";

    const fill = document.getElementById("mine-progress-fill");
    const text = document.getElementById("mine-progress-text");

    const minePct = Math.max(0, Math.min(100, Number(window.mineProgress) || 0));

    if (fill) fill.style.width = minePct + "%";
    if (text) text.innerText = Math.floor(minePct) + "%";

    const autoMineGauge = document.getElementById("auto-mine-gauge");
    const autoMergeGauge = document.getElementById("auto-merge-gauge");

    if (autoMineGauge) {
        autoMineGauge.style.height = Math.max(0, Math.min(100, window.autoMineProgress || 0)) + "%";
    }

    if (autoMergeGauge) {
        autoMergeGauge.style.height = Math.max(0, Math.min(100, window.autoMergeProgress || 0)) + "%";
    }

    const autoMineBtn = document.getElementById("auto-mine-toggle");
    const autoMergeBtn = document.getElementById("auto-merge-toggle");

    if (autoMineBtn) {
        autoMineBtn.innerText = window.autoMineOn ? "ON" : "OFF";
        autoMineBtn.classList.toggle("on", !!window.autoMineOn);
        autoMineBtn.classList.toggle("active", !!window.autoMineOn);
    }

    if (autoMergeBtn) {
        autoMergeBtn.innerText = window.autoMergeOn ? "ON" : "OFF";
        autoMergeBtn.classList.toggle("on", !!window.autoMergeOn);
        autoMergeBtn.classList.toggle("active", !!window.autoMergeOn);
    }

    const pickaxeName = document.getElementById("pickaxe-name");

    if (pickaxeName && typeof TOOTH_DATA !== "undefined") {
        const p = TOOTH_DATA.pickaxes[window.pickaxeIdx] || TOOTH_DATA.pickaxes[0];
        pickaxeName.innerText = `${p.icon} ${p.name}`;
    }
};

// =========================
// 게임 루프
// =========================
window.startGameLoop = function() {
    if (__engineStarted) return;

    __engineStarted = true;
    __lastFrameTime = performance.now();

    requestAnimationFrame(engineLoop);
};

function engineLoop(timestamp) {
    const dt = Math.min(1000, Math.max(0, timestamp - __lastFrameTime));
    __lastFrameTime = timestamp;

    processAutoSystems(dt);

    __saveTimer += dt;
    __uiTimer += dt;

    if (__uiTimer >= 150) {
        __uiTimer = 0;
        if (typeof window.updateUI === "function") window.updateUI();
    }

    if (__saveTimer >= 5000) {
        __saveTimer = 0;
        if (typeof window.saveGame === "function") window.saveGame();
    }

    requestAnimationFrame(engineLoop);
}

function processAutoSystems(dt) {
    if (window.autoMineOn) {
        const interval = window.getAutoMineIntervalMs();

        __autoMineTimer += dt;

        while (__autoMineTimer >= interval) {
            __autoMineTimer -= interval;

            if (typeof window.processMining === "function") {
                window.processMining(100, false);
            }
        }

        window.autoMineProgress = interval > 0 ? (__autoMineTimer / interval) * 100 : 0;
    } else {
        __autoMineTimer = 0;
        window.autoMineProgress = 0;
    }

    if (window.autoMergeOn) {
        const interval = window.getAutoMergeIntervalMs();

        __autoMergeTimer += dt;

        while (__autoMergeTimer >= interval) {
            __autoMergeTimer -= interval;

            if (typeof window.autoMergeLowest === "function") {
                window.autoMergeLowest(true, false);
            }
        }

        window.autoMergeProgress = interval > 0 ? (__autoMergeTimer / interval) * 100 : 0;
    } else {
        __autoMergeTimer = 0;
        window.autoMergeProgress = 0;
    }
}

// =========================
// 인트로 / 영상
// =========================
window.startIntro = function() {
    const startLayer = document.getElementById("start-btn-layer");
    const introLayer = document.getElementById("intro-layer");
    const video = document.getElementById("intro-video");

    if (startLayer) startLayer.style.display = "none";
    if (introLayer) introLayer.style.display = "flex";

    if (video) {
        try {
            video.currentTime = 0;
            video.play().catch(() => {});
            video.onended = () => {
                completeIntro();
            };
        } catch (e) {}
    }
};

window.skipIntro = function() {
    completeIntro();
};

window.completeIntro = function() {
    window.introSeen = true;

    const startLayer = document.getElementById("start-btn-layer");
    const introLayer = document.getElementById("intro-layer");
    const video = document.getElementById("intro-video");

    if (video) {
        try {
            video.pause();
        } catch (e) {}
    }

    if (startLayer) startLayer.style.display = "none";
    if (introLayer) introLayer.style.display = "none";

    if (typeof window.saveGame === "function") window.saveGame();
};

window.replayVideo = function() {
    const settings = document.getElementById("settings-modal");
    if (settings) settings.style.display = "none";

    window.startIntro();
};

window.playHellVideo = function() {
    window.hellVideoSeen = true;

    const layer = document.getElementById("hell-video-layer");
    const video = document.getElementById("hell-video");

    if (layer) layer.style.display = "flex";

    if (video) {
        try {
            video.currentTime = 0;
            video.play().catch(() => {});
            video.onended = () => {
                skipHellIntro();
            };
        } catch (e) {}
    }

    if (typeof window.saveGame === "function") window.saveGame();
};

window.skipHellIntro = function() {
    const layer = document.getElementById("hell-video-layer");
    const video = document.getElementById("hell-video");

    if (video) {
        try {
            video.pause();
        } catch (e) {}
    }

    if (layer) layer.style.display = "none";

    if (typeof window.switchDungeonTab === "function") {
        window.switchDungeonTab("hell");
    }

    if (typeof window.saveGame === "function") window.saveGame();
};

window.playAwakenVideo = function(force) {
    if (window.awakenVideoSeen && !force) return;

    window.awakenVideoSeen = true;

    const layer = document.getElementById("awaken-video-layer");
    const video = document.getElementById("awaken-video");

    if (layer) layer.style.display = "flex";

    if (video) {
        try {
            video.currentTime = 0;
            video.play().catch(() => {});
            video.onended = () => {
                skipAwakenIntro();
            };
        } catch (e) {}
    }

    if (typeof window.saveGame === "function") window.saveGame();
};

window.skipAwakenIntro = function() {
    const layer = document.getElementById("awaken-video-layer");
    const video = document.getElementById("awaken-video");

    if (video) {
        try {
            video.pause();
        } catch (e) {}
    }

    if (layer) layer.style.display = "none";

    if (typeof window.saveGame === "function") window.saveGame();
};

// =========================
// HELL 오픈 처리
// =========================
window.unlockHellMode = function() {
    if (window.unlockedHellDungeon < 1) {
        window.unlockedHellDungeon = 1;
    }

    if (window.unlockedDungeon < 21) {
        window.unlockedDungeon = 21;
    }

    if (typeof window.renderDungeonList === "function") window.renderDungeonList();
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.saveGame === "function") window.saveGame();

    window.playHellVideo();
};

// =========================
// 닉네임
// =========================
window.openNicknameChange = function() {
    const modal = document.getElementById("nickname-modal");
    const input = document.getElementById("nickname-input");

    if (input) input.value = window.nickname || "";

    if (modal) modal.style.display = "flex";
};

window.closeNicknameModal = function() {
    const modal = document.getElementById("nickname-modal");
    if (modal) modal.style.display = "none";
};

window.confirmNickname = function() {
    const input = document.getElementById("nickname-input");
    const value = input ? input.value.trim() : "";

    if (value.length > 0) {
        window.nickname = value.slice(0, 12);
    }

    closeNicknameModal();

    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.saveGame === "function") window.saveGame();
};

// =========================
// 저장코드 내보내기 / 불러오기
// =========================
window.exportSaveCode = function() {
    try {
        if (typeof window.saveGame === "function") window.saveGame();

        const raw = localStorage.getItem(window.SAVE_KEY || "toothSaveV700") || "";
        const code = btoa(unescape(encodeURIComponent(raw)));

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code).then(() => {
                alert("저장코드가 복사되었습니다.");
            }).catch(() => {
                prompt("저장코드입니다. 복사하세요.", code);
            });
        } else {
            prompt("저장코드입니다. 복사하세요.", code);
        }
    } catch (e) {
        alert("저장코드 생성에 실패했습니다.");
    }
};

window.importSave = function() {
    const code = prompt("저장코드를 붙여넣으세요.");

    if (!code) return;

    try {
        const raw = decodeURIComponent(escape(atob(code.trim())));
        const parsed = JSON.parse(raw);

        localStorage.setItem(window.SAVE_KEY || "toothSaveV700", JSON.stringify(parsed));

        alert("저장코드를 불러왔습니다. 게임을 새로고침합니다.");
        location.reload();
    } catch (e) {
        alert("올바르지 않은 저장코드입니다.");
    }
};

window.checkReset = function() {
    const ok = confirm("정말 게임을 초기화할까요? 이 작업은 되돌릴 수 없습니다.");

    if (!ok) return;

    const again = confirm("정말로 초기화합니다. 진행할까요?");

    if (!again) return;

    localStorage.removeItem(window.SAVE_KEY || "toothSaveV700");
    location.reload();
};

// =========================
// 쿠폰
// =========================
window.promptCoupon = function() {
    const code = prompt("쿠폰 코드를 입력하세요.");

    if (!code) return;

    applyCoupon(code);
};

window.applyCoupon = function(code) {
    const normalized = String(code || "").trim().toUpperCase();

    if (!normalized) return;

    const coupon = window.COUPON_DATA ? window.COUPON_DATA[normalized] : null;

    if (!coupon) {
        alert("존재하지 않는 쿠폰입니다.");
        try {
            if (typeof playSfx === "function") playSfx("error");
        } catch (e) {}
        return;
    }

    if (coupon.gold) window.gold += coupon.gold;
    if (coupon.dia) window.dia += coupon.dia;

    if (coupon.hellTest) {
        // HELL을 바로 열지 않는다.
        // 일반 마지막 던전까지만 오픈해서, 마지막 던전 클리어 후 HELL 영상/오픈을 테스트하도록 함.
        window.unlockedDungeon = 20;
        window.unlockedHellDungeon = 0;
        window.currentDungeonTab = "normal";
        window.hellVideoSeen = false;

        alert("HELL 오픈 직전 테스트 상태입니다.\n일반 마지막 던전을 클리어하면 HELL 개방 영상이 나와야 합니다.");
    } else if (coupon.awakenTest) {
        window.gold = Math.max(window.gold, 100000000);
        window.dia = Math.max(window.dia, 5000);
        window.bossMarks = Math.max(window.bossMarks, 20);

        if (!Array.isArray(window.artifactCounts)) {
            window.artifactCounts = new Array(40).fill(0);
        }

        for (let i = 0; i < 20; i++) {
            window.artifactCounts[i] = 1;
        }

        alert("Lv.MAX 해방 테스트 재료가 지급되었습니다.");
    } else {
        alert(coupon.message || "쿠폰을 사용했습니다.");
    }

    try {
        if (typeof playSfx === "function") playSfx("buy");
    } catch (e) {}

    if (typeof normalizeArtifactCounts === "function") normalizeArtifactCounts();
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderDungeonList === "function") window.renderDungeonList();
    if (typeof window.renderResearchContent === "function") window.renderResearchContent();
    if (typeof window.renderCurrentMercenary === "function") window.renderCurrentMercenary();
    if (typeof window.saveGame === "function") window.saveGame();
};

// =========================
// 초기 화면 표시
// =========================
function setupInitialLayers() {
    const startLayer = document.getElementById("start-btn-layer");
    const introLayer = document.getElementById("intro-layer");
    const hellLayer = document.getElementById("hell-video-layer");
    const awakenLayer = document.getElementById("awaken-video-layer");

    if (introLayer) introLayer.style.display = "none";
    if (hellLayer) hellLayer.style.display = "none";
    if (awakenLayer) awakenLayer.style.display = "none";

    if (startLayer) {
        startLayer.style.display = window.introSeen ? "none" : "flex";
    }
}

// =========================
// 초기화
// =========================
window.initGame = function() {
    window.loadGame();
    setupInitialLayers();

    if (typeof window.setupMiningTouch === "function") {
        window.setupMiningTouch();
    }

    if (typeof window.switchView === "function") {
        window.switchView(window.currentView || "mine", true);
    }

    if (typeof window.renderInventory === "function") {
        window.renderInventory();
    }

    if (typeof window.renderDungeonList === "function") {
        window.renderDungeonList();
    }

    if (typeof window.renderCurrentMercenary === "function") {
        window.renderCurrentMercenary();
    }

    if (typeof window.renderWarSummary === "function") {
        window.renderWarSummary();
    }

    if (typeof window.renderResearchContent === "function") {
        window.renderResearchContent();
    }

    if (typeof window.updateUI === "function") {
        window.updateUI();
    }

    window.startGameLoop();
};

window.addEventListener("beforeunload", () => {
    if (typeof window.saveGame === "function") {
        window.saveGame();
    }
});

window.addEventListener("load", () => {
    window.initGame();
});
