// Version: 8.1.0 - Battle Loop, Player Movement, Joystick, Damage, Battle Slots

// --- [ 1. 플레이어 전투 상태 ] ---
window.playerX = 1000;
window.playerY = 1000;
window.moveX = 0;
window.moveY = 0;

window.baseSpeed = 3;
window.playerHp = 100;
window.playerMaxHp = 100;
window.isInvincible = false;

let battleLoopStarted = false;
let lastBattleFrame = 0;

let joystickActive = false;
let joystickPointerId = null;

let keyboardState = {
    up: false,
    down: false,
    left: false,
    right: false
};


// --- [ 2. 전투 슬롯 렌더링 ] ---
window.renderBattleSlots = function() {
    const slotWrap = document.getElementById('war-weapon-slots');

    if (!slotWrap) return;

    slotWrap.innerHTML = '';

    for (let i = 0; i < 8; i++) {
        const slot = document.createElement('div');

        slot.className = 'battle-slot';
        slot.dataset.slot = i;

        const lv = window.inventory && window.inventory[i] ? window.inventory[i] : 0;

        if (lv > 0) {
            const emoji = typeof window.getSimpleToothEmoji === 'function'
                ? window.getSimpleToothEmoji(lv)
                : "🦷";

            const atk = typeof window.getAtk === 'function' ? window.getAtk(lv) : 0;

            slot.innerHTML = `
                <div class="battle-slot-emoji">${emoji}</div>
                <div class="battle-slot-lv">Lv.${lv}</div>
                <div class="battle-slot-atk">⚔${window.safeFNum ? window.safeFNum(atk) : atk}</div>
            `;
        } else {
            slot.innerHTML = `
                <div class="battle-slot-empty">-</div>
            `;
        }

        slotWrap.appendChild(slot);
    }

    applyPlayerStats();
    updatePlayerHpBar();

    if (!battleLoopStarted) {
        battleLoopStarted = true;
        lastBattleFrame = performance.now();
        requestAnimationFrame(battleLoop);
    }
};


// --- [ 3. 플레이어 스탯 적용 ] ---
function applyPlayerStats() {
    let merc = null;

    if (window.TOOTH_DATA && window.TOOTH_DATA.mercenaries && window.TOOTH_DATA.mercenaries[window.mercenaryIdx]) {
        merc = window.TOOTH_DATA.mercenaries[window.mercenaryIdx];
    }

    if (!merc) {
        merc = { baseHp: 100, spd: 1.0, icon: "👨‍🌾" };
    }

    const hpTrainLv = window.trainingLevels && window.trainingLevels.hp ? window.trainingLevels.hp : 0;
    const spdTrainLv = window.trainingLevels && window.trainingLevels.spd ? window.trainingLevels.spd : 0;

    window.playerMaxHp = Math.floor(merc.baseHp * (1 + hpTrainLv * 0.05));
    window.playerHp = window.playerMaxHp;

    window.baseSpeed = 3 * merc.spd * (1 + spdTrainLv * 0.1);

    const playerIcon = document.getElementById('player-icon');

    if (playerIcon) {
        playerIcon.innerText = merc.icon || "👨‍🌾";
    }
}


// --- [ 4. 전투 루프 ] ---
function battleLoop(timestamp) {
    requestAnimationFrame(battleLoop);

    if (!window.dungeonActive || window.dungeonPaused || window.bossDead) {
        lastBattleFrame = timestamp;
        return;
    }

    const elapsed = timestamp - lastBattleFrame;

    if (elapsed < 16) return;

    lastBattleFrame = timestamp;

    updateKeyboardMoveVector();

    if (typeof window.updatePlayerPosition === 'function') {
        window.updatePlayerPosition();
    }

    if (typeof window.updateCombat === 'function') {
        window.updateCombat();
    }
}


// --- [ 5. 플레이어 위치 업데이트 ] ---
window.updatePlayerPosition = function() {
    if (window.dungeonPaused) return;

    const player = document.getElementById('player');
    const world = document.getElementById('battle-world');

    if (!player || !world) return;

    let dx = window.moveX || 0;
    let dy = window.moveY || 0;

    const len = Math.sqrt(dx * dx + dy * dy);

    if (len > 1) {
        dx /= len;
        dy /= len;
    }

    window.playerX += dx * window.baseSpeed;
    window.playerY += dy * window.baseSpeed;

    window.playerX = Math.max(40, Math.min(1960, window.playerX));
    window.playerY = Math.max(40, Math.min(1960, window.playerY));

    player.style.left = `${window.playerX}px`;
    player.style.top = `${window.playerY}px`;

    moveBattleCamera();
};


// --- [ 6. 카메라 이동 ] ---
function moveBattleCamera() {
    const world = document.getElementById('battle-world');
    const battleScreen = document.getElementById('battle-screen');

    if (!world || !battleScreen) return;

    const screenW = battleScreen.clientWidth || window.innerWidth;
    const screenH = battleScreen.clientHeight || window.innerHeight;

    let camX = (screenW / 2) - window.playerX;
    let camY = (screenH / 2) - window.playerY;

    const minX = screenW - 2000;
    const minY = screenH - 2000;

    camX = Math.min(0, Math.max(minX, camX));
    camY = Math.min(0, Math.max(minY, camY));

    world.style.transform = `translate(${camX}px, ${camY}px)`;
}


// --- [ 7. 피격 처리 ] ---
window.takeDamage = function(amount) {
    if (!window.dungeonActive || window.dungeonPaused || window.bossDead) return;
    if (window.isInvincible) return;

    window.playerHp -= amount;
    window.playerHp = Math.max(0, window.playerHp);

    updatePlayerHpBar();

    try {
        if (typeof window.playSfx === 'function') window.playSfx('damage');
    } catch(e) {}

    const player = document.getElementById('player');

    if (player) {
        player.classList.add('player-hit');

        setTimeout(() => {
            player.classList.remove('player-hit');
        }, 180);
    }

    window.isInvincible = true;

    setTimeout(() => {
        window.isInvincible = false;
    }, 500);

    if (window.playerHp <= 0) {
        handlePlayerDeath();
    }
};

function updatePlayerHpBar() {
    const hpBar = document.getElementById('player-hp-bar');

    if (!hpBar) return;

    const pct = window.playerMaxHp > 0 ? Math.max(0, (window.playerHp / window.playerMaxHp) * 100) : 0;

    hpBar.style.width = `${pct}%`;

    if (pct <= 25) {
        hpBar.style.background = '#e74c3c';
    } else if (pct <= 50) {
        hpBar.style.background = '#f39c12';
    } else {
        hpBar.style.background = '#2ecc71';
    }
}

function handlePlayerDeath() {
    window.dungeonActive = false;
    window.dungeonPaused = false;
    window.bossDead = true;

    setTimeout(() => {
        alert("💀 용병이 쓰러졌습니다!\n던전에서 후퇴합니다.");

        if (typeof window.exitDungeon === 'function') {
            window.exitDungeon();
        }
    }, 100);
}


// --- [ 8. 조이스틱 설정 ] ---
function setupJoystick() {
    const zone = document.getElementById('joystick-zone');
    const knob = document.getElementById('joystick-knob');

    if (!zone || !knob) return;

    if (zone.dataset.ready === 'true') return;
    zone.dataset.ready = 'true';

    zone.addEventListener('pointerdown', function(e) {
        if (window.dungeonPaused) return;

        e.preventDefault();

        joystickActive = true;
        joystickPointerId = e.pointerId;

        try {
            zone.setPointerCapture(e.pointerId);
        } catch(err) {}

        updateJoystick(e);
    }, { passive: false });

    zone.addEventListener('pointermove', function(e) {
        if (!joystickActive || e.pointerId !== joystickPointerId) return;
        if (window.dungeonPaused) return;

        e.preventDefault();
        updateJoystick(e);
    }, { passive: false });

    zone.addEventListener('pointerup', function(e) {
        if (e.pointerId !== joystickPointerId) return;

        e.preventDefault();
        window.resetJoystick();

        try {
            zone.releasePointerCapture(e.pointerId);
        } catch(err) {}
    }, { passive: false });

    zone.addEventListener('pointercancel', function(e) {
        if (e.pointerId !== joystickPointerId) return;

        window.resetJoystick();
    });

    zone.addEventListener('lostpointercapture', function() {
        window.resetJoystick();
    });
}

function updateJoystick(e) {
    const zone = document.getElementById('joystick-zone');
    const knob = document.getElementById('joystick-knob');

    if (!zone || !knob) return;

    const rect = zone.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = e.clientX - centerX;
    let dy = e.clientY - centerY;

    const maxRadius = rect.width / 2 - 22;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len > maxRadius) {
        dx = (dx / len) * maxRadius;
        dy = (dy / len) * maxRadius;
    }

    knob.style.transform = `translate(${dx}px, ${dy}px)`;

    const normalizedLen = Math.sqrt(dx * dx + dy * dy);

    if (normalizedLen > 5) {
        window.moveX = dx / maxRadius;
        window.moveY = dy / maxRadius;
    } else {
        window.moveX = 0;
        window.moveY = 0;
    }
}

window.resetJoystick = function() {
    joystickActive = false;
    joystickPointerId = null;

    const knob = document.getElementById('joystick-knob');

    if (knob) {
        knob.style.transform = 'translate(0px, 0px)';
    }

    window.moveX = 0;
    window.moveY = 0;
};


// --- [ 9. 키보드 이동 ] ---
function setupKeyboardControls() {
    if (window.keyboardControlReady) return;
    window.keyboardControlReady = true;

    window.addEventListener('keydown', function(e) {
        const key = e.key.toLowerCase();

        if (key === 'arrowup' || key === 'w') keyboardState.up = true;
        if (key === 'arrowdown' || key === 's') keyboardState.down = true;
        if (key === 'arrowleft' || key === 'a') keyboardState.left = true;
        if (key === 'arrowright' || key === 'd') keyboardState.right = true;
    });

    window.addEventListener('keyup', function(e) {
        const key = e.key.toLowerCase();

        if (key === 'arrowup' || key === 'w') keyboardState.up = false;
        if (key === 'arrowdown' || key === 's') keyboardState.down = false;
        if (key === 'arrowleft' || key === 'a') keyboardState.left = false;
        if (key === 'arrowright' || key === 'd') keyboardState.right = false;
    });
}

function updateKeyboardMoveVector() {
    if (window.dungeonPaused) {
        window.moveX = 0;
        window.moveY = 0;
        return;
    }

    if (joystickActive) return;

    let x = 0;
    let y = 0;

    if (keyboardState.left) x -= 1;
    if (keyboardState.right) x += 1;
    if (keyboardState.up) y -= 1;
    if (keyboardState.down) y += 1;

    if (x !== 0 || y !== 0) {
        window.moveX = x;
        window.moveY = y;
    } else if (!joystickActive) {
        window.moveX = 0;
        window.moveY = 0;
    }
}


// --- [ 10. 전투 시작 전 상태 리셋 보조 ] ---
window.resetBattlePlayerState = function() {
    window.playerX = 1000;
    window.playerY = 1000;
    window.moveX = 0;
    window.moveY = 0;
    window.isInvincible = false;

    window.resetJoystick();

    keyboardState.up = false;
    keyboardState.down = false;
    keyboardState.left = false;
    keyboardState.right = false;

    applyPlayerStats();
    updatePlayerHpBar();
};


// --- [ 11. 초기화 ] ---
setupJoystick();
setupKeyboardControls();
