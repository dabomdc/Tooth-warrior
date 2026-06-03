// Version: 8.1.0 - Battle / Joystick PointerId / Retreat Pause / Camera / Dungeon Flow

// =========================
// 전투 기본 상태
// =========================
window.dungeonActive = false;
window.dungeonPaused = false;

window.currentDungeonRun = null;

window.battlePlayer = {
    x: 1000,
    y: 1000,
    hp: 100,
    maxHp: 100,
    speed: 180,
    invincible: 0
};

let __battleLoopRunning = false;
let __battleLastTime = 0;
let __battleSessionId = 0;

// =========================
// 조이스틱 상태
// =========================
let joystickState = {
    active: false,
    pointerId: null,
    centerX: 0,
    centerY: 0,
    maxRadius: 43,
    x: 0,
    y: 0,
    force: 0
};

// =========================
// 유틸
// =========================
function battleClamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function battleFmt(num) {
    if (typeof fNum === "function") return fNum(num);
    return Math.floor(Number(num) || 0).toString();
}

function getBattleMercenary() {
    if (typeof TOOTH_DATA === "undefined" || !TOOTH_DATA.mercenaries) {
        return {
            name: "초보 치아 수호자",
            icon: "🧑‍🚀",
            baseHp: 100,
            atkMul: 1,
            spd: 1
        };
    }

    return TOOTH_DATA.mercenaries[window.mercenaryIdx || 0] || TOOTH_DATA.mercenaries[0];
}

function getBattleTrainingLevel(key) {
    if (!window.trainingLevels) return 0;
    return Number(window.trainingLevels[key]) || 0;
}

function isBattleHellMode(mode) {
    return mode === "hell" || mode === "hellboss";
}

function isBattleBossMode(mode) {
    return mode === "boss" || mode === "hellboss";
}

function getBattleDungeonName(mode, stage) {
    stage = Math.max(1, Number(stage) || 1);
    const idx = stage - 1;

    if (typeof TOOTH_DATA === "undefined") {
        return `${mode} ${stage}`;
    }

    if (mode === "hell" || mode === "hellboss") {
        return TOOTH_DATA.hellDungeons[idx] || `HELL 던전 ${stage}`;
    }

    return TOOTH_DATA.dungeons[idx] || `던전 ${stage}`;
}

function getBattleMobData(mode, stage) {
    stage = Math.max(1, Number(stage) || 1);
    const idx = battleClamp(stage - 1, 0, 19);

    if (typeof TOOTH_DATA === "undefined") {
        return {
            theme: "bg-cave",
            mobs: ["🦠"],
            boss: "👹"
        };
    }

    if (isBattleHellMode(mode)) {
        return TOOTH_DATA.hellMobs[idx] || TOOTH_DATA.hellMobs[0];
    }

    return TOOTH_DATA.dungeonMobs[idx] || TOOTH_DATA.dungeonMobs[0];
}

function getBattleScreen() {
    return document.getElementById("battle-screen");
}

function getBattleWorld() {
    return document.getElementById("battle-world");
}

function getBattleCamera() {
    return document.getElementById("battle-camera");
}

// =========================
// 던전 시작
// =========================
window.startDungeon = function(stage, mode) {
    stage = Math.max(1, Math.min(20, Number(stage) || 1));
    mode = mode || "normal";

    if (!["normal", "boss", "hell", "hellboss"].includes(mode)) {
        mode = "normal";
    }

    if ((mode === "hell" || mode === "hellboss") && Number(window.unlockedHellDungeon || 0) <= 0) {
        alert("HELL 모드는 아직 열리지 않았습니다.\n일반 마지막 던전을 클리어하면 개방됩니다.");
        return;
    }

    const unlocked = mode === "hell" || mode === "hellboss"
        ? Number(window.unlockedHellDungeon) || 0
        : Math.max(1, Math.min(20, Number(window.unlockedDungeon) || 1));

    if (stage > unlocked) {
        alert("아직 열리지 않은 던전입니다.");
        return;
    }

    if (!hasAnyBattleTooth()) {
        alert("Top8 공격 슬롯에 치아를 배치해야 전투를 시작할 수 있습니다.");
        return;
    }

    __battleSessionId += 1;

    window.dungeonActive = true;
    window.dungeonPaused = false;

    window.currentDungeonRun = {
        stage,
        mode,
        wave: 1,
        maxWave: 5,
        kills: 0,
        finished: false,
        sessionId: __battleSessionId
    };

    setupBattleScreen(stage, mode);
    setupBattlePlayer();
    resetJoystickState();

    const game = document.getElementById("game-container");
    const battle = getBattleScreen();

    if (game) game.style.display = "none";
    if (battle) battle.style.display = "block";

    const retreatModal = document.getElementById("retreat-confirm-modal");
    if (retreatModal) retreatModal.style.display = "none";

    if (typeof window.setupCombatForDungeon === "function") {
        window.setupCombatForDungeon();
    }

    updateBattleTopInfo();
    updateBattlePlayerVisual();
    updateBattleCamera();

    startBattleLoop();

    if (typeof window.saveGame === "function") {
        window.saveGame();
    }
};

function hasAnyBattleTooth() {
    if (!Array.isArray(window.inventory)) return false;

    for (let i = 0; i < 8; i++) {
        if ((Number(window.inventory[i]) || 0) > 0) return true;
    }

    return false;
}

function setupBattleScreen(stage, mode) {
    const world = getBattleWorld();

    if (!world) return;

    world.innerHTML = "";
    world.className = "";

    const mobData = getBattleMobData(mode, stage);

    world.classList.add(mobData.theme || "bg-cave");

    ensurePlayerElement();
}

function ensurePlayerElement() {
    const world = getBattleWorld();
    if (!world) return null;

    let playerEl = document.getElementById("player");

    if (!playerEl) {
        playerEl = document.createElement("div");
        playerEl.id = "player";

        const hpBg = document.createElement("div");
        hpBg.id = "player-hp-bar-bg";

        const hpFill = document.createElement("div");
        hpFill.id = "player-hp-bar-fill";

        hpBg.appendChild(hpFill);
        playerEl.appendChild(hpBg);

        const icon = document.createElement("div");
        icon.id = "player-icon";
        playerEl.appendChild(icon);

        world.appendChild(playerEl);
    } else if (playerEl.parentElement !== world) {
        world.appendChild(playerEl);
    }

    return playerEl;
}

function setupBattlePlayer() {
    const merc = getBattleMercenary();

    const hpLevel = getBattleTrainingLevel("hp");
    const spdLevel = getBattleTrainingLevel("spd");

    const maxHp = Math.floor((merc.baseHp || 100) * (1 + hpLevel * 0.1));
    const speed = 180 * (merc.spd || 1) * (1 + spdLevel * 0.03);

    window.battlePlayer = {
        x: 1000,
        y: 1000,
        hp: maxHp,
        maxHp,
        speed,
        invincible: 0
    };

    const icon = document.getElementById("player-icon");
    if (icon) icon.textContent = merc.icon || "🧑‍🚀";

    updateBattlePlayerHpBar();
}

// =========================
// 전투 루프
// =========================
function startBattleLoop() {
    if (__battleLoopRunning) return;

    __battleLoopRunning = true;
    __battleLastTime = performance.now();

    requestAnimationFrame(battleLoop);
}

function battleLoop(timestamp) {
    if (!__battleLoopRunning) return;

    const dt = Math.min(80, Math.max(0, timestamp - __battleLastTime));
    __battleLastTime = timestamp;

    if (window.dungeonActive && window.currentDungeonRun) {
        if (!window.dungeonPaused) {
            updateBattlePlayer(dt);

            if (typeof window.updateCombat === "function") {
                window.updateCombat(dt);
            }

            updateBattlePlayerVisual();
            updateBattleCamera();
        } else {
            // 후퇴 팝업 등 일시정지 중에는 위치/전투/피격 업데이트 없음
            updateBattlePlayerVisual();
            updateBattleCamera();
        }

        requestAnimationFrame(battleLoop);
        return;
    }

    __battleLoopRunning = false;
}

// =========================
// 플레이어 이동 / 카메라
// =========================
function updateBattlePlayer(dt) {
    const p = window.battlePlayer;

    if (!p) return;

    if (p.invincible > 0) {
        p.invincible = Math.max(0, p.invincible - dt);
    }

    const deadZone = 0.08;

    if (joystickState.force <= deadZone) return;

    const moveX = joystickState.x * p.speed * (dt / 1000);
    const moveY = joystickState.y * p.speed * (dt / 1000);

    p.x = battleClamp(p.x + moveX, 80, 1920);
    p.y = battleClamp(p.y + moveY, 80, 1920);
}

function updateBattlePlayerVisual() {
    const playerEl = ensurePlayerElement();
    const p = window.battlePlayer;

    if (!playerEl || !p) return;

    playerEl.style.left = p.x + "px";
    playerEl.style.top = p.y + "px";

    playerEl.classList.toggle("invincible", Number(p.invincible) > 0);

    updateBattlePlayerHpBar();
}

function updateBattlePlayerHpBar() {
    const p = window.battlePlayer;
    const fill = document.getElementById("player-hp-bar-fill");

    if (!p || !fill) return;

    const pct = p.maxHp > 0 ? battleClamp((p.hp / p.maxHp) * 100, 0, 100) : 0;

    fill.style.width = pct + "%";

    if (pct > 55) {
        fill.style.background = "linear-gradient(90deg, #22c55e, #bef264)";
    } else if (pct > 25) {
        fill.style.background = "linear-gradient(90deg, #facc15, #f97316)";
    } else {
        fill.style.background = "linear-gradient(90deg, #ef4444, #f97316)";
    }
}

function updateBattleCamera() {
    const camera = getBattleCamera();
    const world = getBattleWorld();
    const p = window.battlePlayer;

    if (!camera || !world || !p) return;

    const rect = camera.getBoundingClientRect();
    const viewportW = rect.width || window.innerWidth;
    const viewportH = rect.height || window.innerHeight;

    const x = viewportW / 2 - p.x;
    const y = viewportH / 2 - p.y;

    world.style.transform = `translate(${x}px, ${y}px)`;
}

// =========================
// 플레이어 피격
// =========================
window.takePlayerDamage = function(amount) {
    if (!window.dungeonActive) return;
    if (window.dungeonPaused) return;

    const p = window.battlePlayer;
    if (!p) return;

    if (p.invincible > 0) return;

    amount = Math.max(1, Math.floor(Number(amount) || 1));

    p.hp = Math.max(0, p.hp - amount);
    p.invincible = 450;

    showPlayerDamageText(amount);
    updateBattlePlayerHpBar();

    try {
        if (typeof playSfx === "function") playSfx("damage");
    } catch (e) {}

    if (navigator.vibrate) {
        try {
            navigator.vibrate(35);
        } catch (e) {}
    }

    if (p.hp <= 0) {
        p.hp = 0;
        updateBattlePlayerHpBar();

        if (typeof window.finishDungeonFailure === "function") {
            window.finishDungeonFailure();
        }
    }
};

function showPlayerDamageText(amount) {
    const world = getBattleWorld();
    const p = window.battlePlayer;

    if (!world || !p) return;

    const el = document.createElement("div");
    el.className = "dmg-text";
    el.textContent = "-" + battleFmt(amount);
    el.style.left = p.x + "px";
    el.style.top = (p.y - 42) + "px";
    el.style.color = "#fecaca";

    world.appendChild(el);

    setTimeout(() => el.remove(), 800);
}

// =========================
// 상단 정보
// =========================
window.updateBattleTopInfo = function() {
    const nameEl = document.getElementById("current-dungeon-name");
    const waveEl = document.getElementById("wave-info");

    const run = window.currentDungeonRun;

    if (!run) {
        if (nameEl) nameEl.innerText = "던전";
        if (waveEl) waveEl.innerText = "WAVE -";
        return;
    }

    const mode = run.mode || "normal";
    const stage = Number(run.stage) || 1;

    const prefix = mode === "boss"
        ? "보스 토벌"
        : mode === "hell"
            ? "HELL"
            : mode === "hellboss"
                ? "HELL 보스"
                : "일반";

    if (nameEl) {
        nameEl.innerText = `${prefix} ${stage}. ${getBattleDungeonName(mode, stage)}`;
    }

    if (waveEl) {
        waveEl.innerText = `WAVE ${Number(run.wave) || 1}/${Number(run.maxWave) || 5}`;
    }
};

// =========================
// 후퇴 처리
// =========================
window.requestRetreat = function() {
    if (!window.dungeonActive || !window.currentDungeonRun) {
        window.exitDungeon();
        return;
    }

    window.dungeonPaused = true;

    resetJoystickState();

    const modal = document.getElementById("retreat-confirm-modal");
    if (modal) modal.style.display = "flex";
};

window.cancelRetreat = function() {
    const modal = document.getElementById("retreat-confirm-modal");
    if (modal) modal.style.display = "none";

    resetJoystickState();

    if (window.dungeonActive && window.currentDungeonRun) {
        window.dungeonPaused = false;
    }
};

window.confirmRetreat = function() {
    const modal = document.getElementById("retreat-confirm-modal");
    if (modal) modal.style.display = "none";

    window.dungeonPaused = false;

    window.exitDungeon();
};

window.exitDungeon = function() {
    resetJoystickState();

    if (typeof window.cleanupCombatObjects === "function") {
        window.cleanupCombatObjects();
    }

    window.dungeonActive = false;
    window.dungeonPaused = false;
    window.currentDungeonRun = null;

    const battle = getBattleScreen();
    const game = document.getElementById("game-container");

    if (battle) battle.style.display = "none";
    if (game) game.style.display = "flex";

    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderCurrentMercenary === "function") window.renderCurrentMercenary();
    if (typeof window.renderWarSummary === "function") window.renderWarSummary();
    if (typeof window.renderDungeonList === "function") window.renderDungeonList();
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.saveGame === "function") window.saveGame();
};

// =========================
// 조이스틱
// =========================
function setupJoystick() {
    const zone = document.getElementById("joystick-zone");

    if (!zone || zone.__joystickBound) return;

    zone.__joystickBound = true;

    zone.addEventListener("pointerdown", onJoystickPointerDown);
    zone.addEventListener("pointermove", onJoystickPointerMove);
    zone.addEventListener("pointerup", onJoystickPointerUp);
    zone.addEventListener("pointercancel", onJoystickPointerUp);
    zone.addEventListener("lostpointercapture", onJoystickLostCapture);
}

function onJoystickPointerDown(e) {
    if (!window.dungeonActive) return;
    if (window.dungeonPaused) return;
    if (joystickState.active) return;

    e.preventDefault();
    e.stopPropagation();

    joystickState.active = true;
    joystickState.pointerId = e.pointerId;

    const rect = e.currentTarget.getBoundingClientRect();
    joystickState.centerX = rect.left + rect.width / 2;
    joystickState.centerY = rect.top + rect.height / 2;
    joystickState.maxRadius = Math.min(rect.width, rect.height) * 0.34;

    try {
        e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}

    updateJoystickByPoint(e.clientX, e.clientY);
}

function onJoystickPointerMove(e) {
    if (!joystickState.active) return;
    if (joystickState.pointerId !== e.pointerId) return;

    e.preventDefault();
    e.stopPropagation();

    updateJoystickByPoint(e.clientX, e.clientY);
}

function onJoystickPointerUp(e) {
    if (!joystickState.active) return;
    if (joystickState.pointerId !== e.pointerId) return;

    e.preventDefault();
    e.stopPropagation();

    try {
        e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}

    resetJoystickState();
}

function onJoystickLostCapture() {
    resetJoystickState();
}

function updateJoystickByPoint(clientX, clientY) {
    const dx = clientX - joystickState.centerX;
    const dy = clientY - joystickState.centerY;

    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxR = joystickState.maxRadius || 43;

    let clampedX = dx;
    let clampedY = dy;

    if (dist > maxR) {
        const angle = Math.atan2(dy, dx);
        clampedX = Math.cos(angle) * maxR;
        clampedY = Math.sin(angle) * maxR;
    }

    joystickState.x = clampedX / maxR;
    joystickState.y = clampedY / maxR;
    joystickState.force = battleClamp(dist / maxR, 0, 1);

    updateJoystickVisual(clampedX, clampedY);
}

function updateJoystickVisual(offsetX, offsetY) {
    const knob = document.getElementById("joystick-knob");

    if (!knob) return;

    knob.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
}

window.resetJoystickVisual = function() {
    updateJoystickVisual(0, 0);
};

function resetJoystickState() {
    joystickState.active = false;
    joystickState.pointerId = null;
    joystickState.x = 0;
    joystickState.y = 0;
    joystickState.force = 0;

    updateJoystickVisual(0, 0);
}

window.resetJoystickState = resetJoystickState;

// =========================
// 화면 방향 / 리사이즈
// =========================
function setupBattleResize() {
    window.addEventListener("resize", () => {
        resetJoystickState();

        if (window.dungeonActive) {
            updateBattleCamera();
        }
    });

    window.addEventListener("orientationchange", () => {
        resetJoystickState();

        setTimeout(() => {
            if (window.dungeonActive) {
                updateBattleCamera();
            }
        }, 250);
    });
}

// =========================
// 브라우저 터치 방지
// =========================
function setupBattleTouchGuards() {
    const battle = getBattleScreen();

    if (!battle || battle.__touchGuardBound) return;

    battle.__touchGuardBound = true;

    battle.addEventListener(
        "touchmove",
        (e) => {
            if (window.dungeonActive) {
                e.preventDefault();
            }
        },
        { passive: false }
    );

    battle.addEventListener(
        "gesturestart",
        (e) => {
            if (window.dungeonActive) {
                e.preventDefault();
            }
        },
        { passive: false }
    );
}

// =========================
// 안전 종료
// =========================
window.stopBattleLoop = function() {
    __battleLoopRunning = false;
};

window.forceEndDungeon = function() {
    window.exitDungeon();
};

// =========================
// 초기화
// =========================
window.addEventListener("load", () => {
    setupJoystick();
    setupBattleResize();
    setupBattleTouchGuards();

    resetJoystickState();
});
