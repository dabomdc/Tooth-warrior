// Version: 6.8.6 - Dynamic Joystick (Touch anywhere to move)

window.playerMoveX = 0;
window.playerMoveY = 0;
window.isInvincible = false;

// 🌟 [핵심 변경] 동적 조이스틱 로직
window.renderBattleSlots = function() {
    const slotsDiv = document.getElementById('war-weapon-slots');
    if(!slotsDiv) return;
    slotsDiv.innerHTML = '';
    
    for(let i=0; i<8; i++) {
        const slot = document.createElement('div');
        slot.className = 'war-slot';
        slot.id = `war-slot-${i}`;
        
        let inv = window.inventory[i];
        if (inv > 0) {
            slot.innerHTML = (typeof getToothIcon === 'function' ? getToothIcon(inv) : "🦷") + `<div class="cd-overlay"></div>`;
        } else {
            slot.innerHTML = `<div class="cd-overlay" style="height:100%;"></div>`;
        }
        slotsDiv.appendChild(slot);
    }

    setupDynamicJoystick();
    
    // 체력 초기화 (던전 진입 시마다 최대 체력으로 회복)
    let curMerc = TOOTH_DATA.mercenaries[window.mercenaryIdx];
    let trainingHpBonus = window.trainingLevels && window.trainingLevels.hp ? window.trainingLevels.hp * 0.05 : 0;
    let baseMaxHp = curMerc ? curMerc.baseHp : 100;
    window.currentHp = baseMaxHp * (1 + trainingHpBonus);

    if (window.battleLoopInterval) cancelAnimationFrame(window.battleLoopInterval);
    window.battleLoopInterval = requestAnimationFrame(battleLoop);
};

function setupDynamicJoystick() {
    const screen = document.getElementById('battle-screen');
    const zone = document.getElementById('joystick-zone');
    const knob = document.getElementById('joystick-knob');
    
    if(!screen || !zone || !knob) return;

    let isDragging = false;
    let centerX = 0;
    let centerY = 0;
    const maxRadius = 60; // 조이스틱 반지름

    // 초기에는 조이스틱 숨김 처리
    zone.style.display = 'none';

    screen.onpointerdown = (e) => {
        // 무기 슬롯이나 후퇴 버튼을 눌렀을 때는 조이스틱 생성 방지
        if (e.target.closest('#war-weapon-slots') || e.target.closest('.btn-exit')) return;
        
        isDragging = true;
        
        // 터치한 위치를 조이스틱의 중심으로 설정
        centerX = e.clientX;
        centerY = e.clientY;
        
        // 기존 우측 하단 고정 CSS 무효화하고 터치 위치로 이동
        zone.style.display = 'block';
        zone.style.right = 'auto'; 
        zone.style.bottom = 'auto';
        zone.style.left = (centerX - maxRadius) + 'px';
        zone.style.top = (centerY - maxRadius) + 'px';
        
        knob.style.transform = `translate(-50%, -50%)`;
        window.playerMoveX = 0;
        window.playerMoveY = 0;
        
        screen.setPointerCapture(e.pointerId);
    };

    screen.onpointermove = (e) => {
        if (!isDragging) return;
        
        let dx = e.clientX - centerX;
        let dy = e.clientY - centerY;
        let distance = Math.hypot(dx, dy);
        
        if (distance > maxRadius) {
            dx = (dx / distance) * maxRadius;
            dy = (dy / distance) * maxRadius;
            distance = maxRadius;
        }
        
        knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        
        // 이동 벡터 설정
        if (distance > 0) {
            window.playerMoveX = dx / maxRadius;
            window.playerMoveY = dy / maxRadius;
        } else {
            window.playerMoveX = 0;
            window.playerMoveY = 0;
        }
    };

    screen.onpointerup = (e) => {
        isDragging = false;
        window.playerMoveX = 0;
        window.playerMoveY = 0;
        knob.style.transform = `translate(-50%, -50%)`;
        zone.style.display = 'none'; // 손을 떼면 조이스틱 다시 숨김
        screen.releasePointerCapture(e.pointerId);
    };
}

function battleLoop() {
    if (!window.dungeonActive || window.bossDead) return;
    
    // 플레이어 이동 로직
    let baseSpeed = 5; 
    let curMerc = TOOTH_DATA.mercenaries[window.mercenaryIdx];
    let mercSpd = curMerc ? curMerc.spd : 1.0;
    
    // 용병 훈련소의 신속(spd) 스탯 반영
    let trainingSpdBonus = 0;
    if (window.trainingLevels && window.trainingLevels.spd) {
        trainingSpdBonus = window.trainingLevels.spd * 0.1;
    }

    let finalSpeed = baseSpeed * (mercSpd + trainingSpdBonus);

    window.playerX += window.playerMoveX * finalSpeed;
    window.playerY += window.playerMoveY * finalSpeed;
    
    // 벽 충돌 방지
    window.playerX = Math.max(20, Math.min(window.worldWidth - 20, window.playerX));
    window.playerY = Math.max(20, Math.min(window.worldHeight - 20, window.playerY));
    
    const p = document.getElementById('player');
    if (p) {
        p.style.left = window.playerX + 'px';
        p.style.top = window.playerY + 'px';
    }

    if (typeof updateCombat === 'function') updateCombat();
    window.battleLoopInterval = requestAnimationFrame(battleLoop);
}

window.takeDamage = function(dmg) {
    if (window.isInvincible) return;
    
    const p = document.getElementById('player');
    const pFill = document.getElementById('player-hp-bar-fill');
    
    let curMerc = TOOTH_DATA.mercenaries[window.mercenaryIdx];
    let trainingHpBonus = window.trainingLevels && window.trainingLevels.hp ? window.trainingLevels.hp * 0.05 : 0;
    let baseMaxHp = curMerc ? curMerc.baseHp : 100;
    let maxHp = baseMaxHp * (1 + trainingHpBonus);

    if (window.currentHp === undefined || isNaN(window.currentHp)) window.currentHp = maxHp;
    
    window.currentHp -= dmg;
    
    window.isInvincible = true;
    if (p) p.classList.add('invincible');
    
    setTimeout(() => {
        window.isInvincible = false;
        if (p) p.classList.remove('invincible');
    }, 500);

    const scr = document.getElementById('battle-screen');
    if(scr) {
        scr.style.background = 'rgba(255,0,0,0.3)';
        setTimeout(() => { scr.style.background = window.isHellMode ? '#2c0a0a' : '#000'; }, 100);
    }
    
    if(pFill) pFill.style.width = Math.max(0, (window.currentHp / maxHp * 100)) + '%';
    try { if(typeof playSfx === 'function') playSfx('damage'); } catch(e){}

    if (window.currentHp <= 0) {
        window.currentHp = maxHp; 
        alert("사망했습니다! 던전 탐험 실패!");
        if (typeof exitDungeon === 'function') exitDungeon();
    }
};
