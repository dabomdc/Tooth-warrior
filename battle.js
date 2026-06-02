// Version: 8.0.0 - Battle Physics / Joystick / Camera / Player HP
// 기존 60FPS 전투 루프 유지 + 후퇴/사망 처리 안정화

// =========================
// 플레이어 기본 상태
// =========================
window.playerX = window.playerX || 1000;
window.playerY = window.playerY || 1000;

window.moveX = 0;
window.moveY = 0;

window.baseSpeed = 2.5;

window.isInvincible = false;
window.playerHp = 100;
window.playerMaxHp = 100;

let currentPlayerSpeed = window.baseSpeed;

let joystickActive = false;
let originX = 0;
let originY = 0;

let battleLoopId = null;
let lastBattleTime = performance.now();

const BATTLE_FPS_INTERVAL = 1000 / 60;
const BATTLE_WORLD_WIDTH = 2000;
const BATTLE_WORLD_HEIGHT = 2000;

// =========================
// 안전 유틸
// =========================
function bGetMercenary() {
    if (typeof TOOTH_DATA === "undefined" || !TOOTH_DATA.mercenaries) {
        return null;
    }

    return TOOTH_DATA.mercenaries[window.mercenaryIdx] || TOOTH_DATA.mercenaries[0] || null;
}

function bClamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function bNum(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

// =========================
// 전투 슬롯 렌더링
// =========================
window.renderBattleSlots = function() {
    const container = document.getElementById("war-weapon-slots");

    if (container) {
        container.innerHTML = "";

        for (let i = 0; i < 8; i++) {
            const slot = document.createElement("div");
            slot.className = "war-slot";
            slot.id = `war-slot-${i}`;

            const lv = Array.isArray(window.inventory) ? Number(window.inventory[i]) || 0 : 0;

            if (lv > 0) {
                const icon = typeof getToothIcon === "function" ? getToothIcon(lv) : "🦷";
                const label = lv >= 25 ? "MAX" : lv;

                slot.innerHTML = `
                    ${icon}
                    <div class="cd-overlay"></div>
                    <div style="position:absolute; bottom:0; right:1px; font-size:8px; color:#fff; text-shadow:1px 1px 0 #000; z-index:5;">
                        ${label}
                    </div>
                `;
            } else {
                slot.innerHTML = `<div class="cd-overlay"></div>`;
            }

            container.appendChild(slot);
        }
    }

    // 체력 계산
    const merc = bGetMercenary();

    const baseHp = merc && merc.baseHp ? merc.baseHp : 100;
    const hpBonus = window.trainingLevels && window.trainingLevels.hp
        ? window.trainingLevels.hp * 0.05
        : 0;

    window.playerMaxHp = Math.floor(baseHp * (1 + hpBonus));
    window.playerHp = window.playerMaxHp;

    const hpFill = document.getElementById("player-hp-bar-fill");
    if (hpFill) hpFill.style.width = "100%";

    // 이동속도 계산
    const mercSpd = merc && merc.spd ? merc.spd : 1.0;
    const spdBonus = window.trainingLevels && window.trainingLevels.spd
        ? window.trainingLevels.spd * 0.1
        : 0;

    currentPlayerSpeed = window.baseSpeed * mercSpd * (1 + spdBonus);

    // 전투 루프 시작
    if (!battleLoopId) {
        lastBattleTime = performance.now();
        battleLoopId = requestAnimationFrame(battleLoop);
    }
};

// =========================
// 60FPS 전투 루프
// =========================
function battleLoop(timestamp) {
    battleLoopId = requestAnimationFrame(battleLoop);

    const elapsed = timestamp - lastBattleTime;

    if (elapsed < BATTLE_FPS_INTERVAL) {
        return;
    }

    lastBattleTime = timestamp - (elapsed % BATTLE_FPS_INTERVAL);

    if (window.dungeonActive && !window.bossDead) {
        updatePlayerPosition();

        if (typeof window.updateCombat === "function") {
            window.updateCombat();
        }
    }
}

// =========================
// 플레이어 이동 / 카메라
// =========================
function updatePlayerPosition() {
    if (!window.dungeonActive || window.bossDead) return;

    window.playerX += (Number(window.moveX) || 0) * currentPlayerSpeed;
    window.playerY += (Number(window.moveY) || 0) * currentPlayerSpeed;

    window.playerX = bClamp(window.playerX, 20, BATTLE_WORLD_WIDTH - 20);
    window.playerY = bClamp(window.playerY, 20, BATTLE_WORLD_HEIGHT - 20);

    const player = document.getElementById("player");

    if (player) {
        player.style.left = window.playerX + "px";
        player.style.top = window.playerY + "px";
    }

    const camera = document.getElementById("battle-camera");
    const world = document.getElementById("battle-world");

    if (!camera || !world) return;

    const camW = camera.clientWidth || window.innerWidth;
    const camH = camera.clientHeight || window.innerHeight;

    let tx = (camW / 2) - window.playerX;
    let ty = (camH / 2) - window.playerY;

    const minTx = camW - BATTLE_WORLD_WIDTH;
    const minTy = camH - BATTLE_WORLD_HEIGHT;

    tx = bClamp(tx, minTx, 0);
    ty = bClamp(ty, minTy, 0);

    world.style.transform = `translate(${tx}px, ${ty}px)`;
}

window.updatePlayerPosition = updatePlayerPosition;

// =========================
// 플레이어 피격
// =========================
window.takeDamage = function(amount) {
    if (!window.dungeonActive || window.bossDead || window.isInvincible) return;

    amount = Math.max(1, Math.floor(Number(amount) || 1));

    window.playerHp -= amount;

    try {
        if (typeof playSfx === "function") playSfx("damage");
    } catch (e) {}

    const hpFill = document.getElementById("player-hp-bar-fill");

    if (hpFill) {
        const ratio = Math.max(0, window.playerHp / window.playerMaxHp);
        hpFill.style.width = (ratio * 100) + "%";
    }

    showPlayerDamageText(amount);

    const player = document.getElementById("player");

    window.isInvincible = true;

    if (player) {
        player.classList.add("invincible");
    }

    flashPlayerDamage();

    setTimeout(() => {
        window.isInvincible = false;

        const p = document.getElementById("player");
        if (p) p.classList.remove("invincible");
    }, 1000);

    if (window.playerHp <= 0) {
        handlePlayerDeath();
    }
};

// =========================
// 플레이어 데미지 텍스트
// =========================
function showPlayerDamageText(amount) {
    const world = document.getElementById("battle-world");

    if (!world) return;

    const txt = document.createElement("div");
    txt.className = "dmg-text";
    txt.innerText = `-${amount}`;
    txt.style.left = window.playerX + "px";
    txt.style.top = (window.playerY - 45) + "px";
    txt.style.color = "#ff4757";
    txt.style.fontSize = "20px";

    world.appendChild(txt);

    setTimeout(() => txt.remove(), 700);
}

function flashPlayerDamage() {
    const battleScreen = document.getElementById("battle-screen");

    if (!battleScreen) return;

    const flash = document.createElement("div");
    flash.style.position = "absolute";
    flash.style.inset = "0";
    flash.style.background = "rgba(255,0,0,0.35)";
    flash.style.zIndex = "2500";
    flash.style.pointerEvents = "none";
    flash.style.animation = "splashFade 0.45s ease-out forwards";

    battleScreen.appendChild(flash);

    setTimeout(() => flash.remove(), 500);
}

// =========================
// 플레이어 사망
// =========================
function handlePlayerDeath() {
    if (!window.dungeonActive) return;

    window.dungeonActive = false;
    window.bossDead = true;
    window.moveX = 0;
    window.moveY = 0;

    const knob = document.getElementById("joystick-knob");
    if (knob) {
        knob.style.left = "50%";
        knob.style.top = "50%";
    }

    setTimeout(() => {
        alert("☠️ 전멸했습니다... 던전에서 후퇴합니다.");

        if (typeof window.exitDungeon === "function") {
            window.exitDungeon();
        }
    }, 100);
}

// =========================
// 조이스틱
// =========================
function setupJoystick() {
    const zone = document.getElementById("joystick-zone");
    const knob = document.getElementById("joystick-knob");

    if (!zone || !knob || zone.__toothJoystickBound) return;

    zone.__toothJoystickBound = true;

    zone.addEventListener("pointerdown", (e) => {
        if (!window.dungeonActive || window.bossDead) return;

        e.preventDefault();

        joystickActive = true;

        const rect = zone.getBoundingClientRect();

        originX = rect.left + rect.width / 2;
        originY = rect.top + rect.height / 2;

        zone.setPointerCapture(e.pointerId);

        updateJoystick(e.clientX, e.clientY);
    });

    zone.addEventListener("pointermove", (e) => {
        if (!joystickActive) return;

        e.preventDefault();

        updateJoystick(e.clientX, e.clientY);
    });

    zone.addEventListener("pointerup", (e) => {
        e.preventDefault();

        resetJoystick();

        try {
            zone.releasePointerCapture(e.pointerId);
        } catch (err) {}
    });

    zone.addEventListener("pointercancel", (e) => {
        e.preventDefault();

        resetJoystick();

        try {
            zone.releasePointerCapture(e.pointerId);
        } catch (err) {}
    });
}

function updateJoystick(clientX, clientY) {
    const knob = document.getElementById("joystick-knob");

    const dx = clientX - originX;
    const dy = clientY - originY;

    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 40;

    const limitedDist = Math.min(maxDist, dist);
    const angle = Math.atan2(dy, dx);

    const x = Math.cos(angle) * limitedDist;
    const y = Math.sin(angle) * limitedDist;

    if (knob) {
        knob.style.left = `calc(50% + ${x}px)`;
        knob.style.top = `calc(50% + ${y}px)`;
    }

    if (dist > 0) {
        window.moveX = x / maxDist;
        window.moveY = y / maxDist;
    } else {
        window.moveX = 0;
        window.moveY = 0;
    }
}

function resetJoystick() {
    joystickActive = false;

    window.moveX = 0;
    window.moveY = 0;

    const knob = document.getElementById("joystick-knob");

    if (knob) {
        knob.style.left = "50%";
        knob.style.top = "50%";
    }
}

// =========================
// 키보드 이동
// =========================
const keyState = {
    up: false,
    down: false,
    left: false,
    right: false
};

function updateKeyboardMove() {
    let x = 0;
    let y = 0;

    if (keyState.left) x -= 1;
    if (keyState.right) x += 1;
    if (keyState.up) y -= 1;
    if (keyState.down) y += 1;

    if (x !== 0 && y !== 0) {
        const inv = 1 / Math.sqrt(2);
        x *= inv;
        y *= inv;
    }

    if (!joystickActive) {
        window.moveX = x;
        window.moveY = y;
    }
}

window.addEventListener("keydown", (e) => {
    if (!window.dungeonActive || window.bossDead) return;

    const key = e.key.toLowerCase();

    if (key === "arrowup" || key === "w") keyState.up = true;
    if (key === "arrowdown" || key === "s") keyState.down = true;
    if (key === "arrowleft" || key === "a") keyState.left = true;
    if (key === "arrowright" || key === "d") keyState.right = true;

    updateKeyboardMove();
});

window.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase();

    if (key === "arrowup" || key === "w") keyState.up = false;
    if (key === "arrowdown" || key === "s") keyState.down = false;
    if (key === "arrowleft" || key === "a") keyState.left = false;
    if (key === "arrowright" || key === "d") keyState.right = false;

    updateKeyboardMove();
});

// =========================
// 초기화
// =========================
window.addEventListener("load", () => {
    setupJoystick();

    if (!battleLoopId) {
        lastBattleTime = performance.now();
        battleLoopId = requestAnimationFrame(battleLoop);
    }
});
