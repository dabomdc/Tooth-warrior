// Version: 7.5.1 - Battle Physics & Joystick (60FPS Fixed, Optimized, Diagonal Fixed)

window.playerX = 1000;
window.playerY = 1000;
window.moveX = 0;
window.moveY = 0;
window.baseSpeed = 2.5; 
window.isInvincible = false;
window.playerHp = 100;
window.playerMaxHp = 100;

let joystickActive = false;
let activePointerId = null; // 🌟 멀티터치 간섭 방지 식별자
let originX = 0;
let originY = 0;
let battleLoopId = null;

let lastBattleTime = performance.now();
const fpsInterval = 1000 / 60; // 60 FPS 고정

// 🌟 DOM 탐색 캐싱 변수 (매 프레임 무거운 DOM 탐색 방지)
let domPlayer = null;
let domCamera = null;
let domWorld = null;

window.renderBattleSlots = function() {
    const slots = document.getElementById('war-weapon-slots');
    if(!slots) return;
    slots.innerHTML = '';
    
    for(let i=0; i<8; i++) {
        const lv = window.inventory[i];
        const div = document.createElement('div');
        div.className = 'war-slot';
        div.id = `war-slot-${i}`;
        if(lv > 0) {
            div.innerHTML = `<span style="font-size:20px;">${typeof window.getToothIcon === 'function'? window.getToothIcon(lv) : "🦷"}</span><div class="cd-overlay"></div>`;
        } else {
            div.innerHTML = `<div class="cd-overlay"></div>`;
        }
        slots.appendChild(div);
    }
    
    let hpBonus = (window.trainingLevels && window.trainingLevels.hp)? window.trainingLevels.hp * 0.05 : 0;
    let base = (typeof window.TOOTH_DATA!== 'undefined' && window.TOOTH_DATA.mercenaries[window.mercenaryIdx])? window.TOOTH_DATA.mercenaries[window.mercenaryIdx].baseHp : 100;
    window.playerMaxHp = base * (1 + hpBonus);
    window.playerHp = window.playerMaxHp;
    
    let pSpd = (typeof window.TOOTH_DATA!== 'undefined' && window.TOOTH_DATA.mercenaries[window.mercenaryIdx])? window.TOOTH_DATA.mercenaries[window.mercenaryIdx].spd : 1.0;
    let spdBonus = (window.trainingLevels && window.trainingLevels.spd)? window.trainingLevels.spd * 0.1 : 0;
    window.currentPlayerSpeed = window.baseSpeed * pSpd * (1 + spdBonus);

    // 🌟 전투 진입 시점에 DOM 요소를 1회만 캐싱
    domPlayer = document.getElementById('player');
    domCamera = document.getElementById('battle-camera');
    domWorld = document.getElementById('battle-world');

    if (!battleLoopId) {
        lastBattleTime = performance.now(); 
        battleLoop();
    }
};

function battleLoop(timestamp) {
    battleLoopId = requestAnimationFrame(battleLoop);

    if (!timestamp) timestamp = performance.now();
    let elapsed = timestamp - lastBattleTime;

    if (elapsed >= fpsInterval) {
        lastBattleTime = timestamp - (elapsed % fpsInterval);

        if (window.dungeonActive &&!window.bossDead) {
            updatePlayerPosition();
            if(typeof window.updateCombat === 'function') window.updateCombat();
        }
    }
}

function updatePlayerPosition() {
    if (!window.dungeonActive || window.bossDead) return;
    
    // 🌟 최적화 및 버그 수정: 대각선 이동 과속 방지를 위한 벡터 정규화 로직
    let moveLen = Math.sqrt(window.moveX * window.moveX + window.moveY * window.moveY);
    let normX = window.moveX;
    let normY = window.moveY;

    if (moveLen > 0) {
        normX = window.moveX / moveLen;
        normY = window.moveY / moveLen;
    }
    
    window.playerX += normX * window.currentPlayerSpeed;
    window.playerY += normY * window.currentPlayerSpeed;

    // 맵 경계 제한
    window.playerX = Math.max(20, Math.min(window.worldWidth - 20, window.playerX));
    window.playerY = Math.max(20, Math.min(window.worldHeight - 20, window.playerY));

    // 🌟 매 프레임 탐색 대신, 캐싱된 DOM 사용하여 성능 대폭 개선
    if(domPlayer) {
        domPlayer.style.left = window.playerX + 'px';
        domPlayer.style.top = window.playerY + 'px';
        
        if (domCamera && domWorld) {
            const cw = domCamera.clientWidth;
            const ch = domCamera.clientHeight;
            let cx = window.playerX - cw/2;
            let cy = window.playerY - ch/2;
            
            cx = Math.max(0, Math.min(window.worldWidth - cw, cx));
            cy = Math.max(0, Math.min(window.worldHeight - ch, cy));
            domWorld.style.transform = `translate(${-cx}px, ${-cy}px)`;
        }
    }
}

window.takeDamage = function(amount) {
    if(window.isInvincible || window.bossDead ||!window.dungeonActive) return;
    
    window.playerHp -= amount;
    try { if(typeof window.playSfx === 'function') window.playSfx('damage'); } catch(e){}
    
    const fill = document.getElementById('player-hp-bar-fill');
    if(fill) fill.style.width = Math.max(0, (window.playerHp / window.playerMaxHp * 100)) + '%';
    
    if(typeof window.showDmgText === 'function') window.showDmgText(window.playerX, window.playerY, amount);
    
    if(domPlayer) {
        domPlayer.classList.add('invincible');
        window.isInvincible = true;
        setTimeout(() => {
            if(domPlayer) domPlayer.classList.remove('invincible');
            window.isInvincible = false;
        }, 1000);
    }
    
    const scr = document.getElementById('battle-screen');
    if(scr) {
        let oldBg = scr.style.background;
        scr.style.background = 'rgba(255,0,0,0.3)';
        setTimeout(() => scr.style.background = oldBg, 150);
    }

    if(window.playerHp <= 0) {
        window.dungeonActive = false;
        window.bossDead = true;
        setTimeout(() => {
            if(typeof window.showToast === 'function') window.showToast("☠️ 전멸했습니다... 던전에서 후퇴합니다.");
            else alert("☠️ 전멸했습니다... 던전에서 후퇴합니다.");
            
            if(typeof window.exitDungeon === 'function') window.exitDungeon();
        }, 500);
    }
};

// --- [ 모바일 터치 조이스틱 로직 (멀티터치 보완) ] ---
const zone = document.getElementById('joystick-zone');
const knob = document.getElementById('joystick-knob');

if(zone && knob) {
    zone.addEventListener('pointerdown', (e) => {
        // 이미 조이스틱이 잡혀있다면 다른 손가락의 터치는 무시
        if(joystickActive) return;
        
        joystickActive = true;
        activePointerId = e.pointerId; // 🌟 현재 조작 중인 고유 손가락 식별자 저장
        
        const rect = zone.getBoundingClientRect();
        originX = rect.left + rect.width / 2;
        originY = rect.top + rect.height / 2;
        updateJoystick(e.clientX, e.clientY);
        zone.setPointerCapture(e.pointerId);
    });

    zone.addEventListener('pointermove', (e) => {
        // 🌟 저장된 손가락 ID와 일치할 때만 반응하여 조작 꼬임 방지
        if(!joystickActive || e.pointerId!== activePointerId) return; 
        updateJoystick(e.clientX, e.clientY);
    });

    zone.addEventListener('pointerup', (e) => {
        if(e.pointerId!== activePointerId) return;
        
        joystickActive = false;
        activePointerId = null;
        knob.style.transform = `translate(-50%, -50%)`;
        window.moveX = 0;
        window.moveY = 0;
        zone.releasePointerCapture(e.pointerId);
    });
    
    zone.addEventListener('pointercancel', (e) => {
        if(e.pointerId!== activePointerId) return;
        
        joystickActive = false;
        activePointerId = null;
        knob.style.transform = `translate(-50%, -50%)`;
        window.moveX = 0;
        window.moveY = 0;
        zone.releasePointerCapture(e.pointerId);
    });

    function updateJoystick(cx, cy) {
        let dx = cx - originX;
        let dy = cy - originY;
        const dist = Math.sqrt(dx * dx + dy * dy); // 최적화: 무거운 Math.hypot 대체
        const maxDist = 40; 
        
        if(dist > maxDist) {
            dx = (dx / dist) * maxDist;
            dy = (dy / dist) * maxDist;
        }
        
        knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        
        if(dist > 0) {
            window.moveX = dx / maxDist;
            window.moveY = dy / maxDist;
        } else {
            window.moveX = 0;
            window.moveY = 0;
        }
    }
}

// --- ---
const keys = { w: false, a: false, s: false, d: false };

window.addEventListener('keydown', (e) => {
    if (!window.dungeonActive) return;
    const key = e.key.toLowerCase();
    
    if(key === 'arrowup' || key === 'w') keys.w = true;
    if(key === 'arrowdown' || key === 's') keys.s = true;
    if(key === 'arrowleft' || key === 'a') keys.a = true;
    if(key === 'arrowright' || key === 'd') keys.d = true;

    updateMoveVector();
});

window.addEventListener('keyup', (e) => {
    if (!window.dungeonActive) return;
    const key = e.key.toLowerCase();
    
    if(key === 'arrowup' || key === 'w') keys.w = false;
    if(key === 'arrowdown' || key === 's') keys.s = false;
    if(key === 'arrowleft' || key === 'a') keys.a = false;
    if(key === 'arrowright' || key === 'd') keys.d = false;

    updateMoveVector();
});

function updateMoveVector() {
    if(joystickActive) return; // 모바일 조이스틱 사용 중일 땐 키보드 무시
    window.moveX = (keys.d? 1 : 0) - (keys.a? 1 : 0);
    window.moveY = (keys.s? 1 : 0) - (keys.w? 1 : 0);
}
