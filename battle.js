// Version: 6.9.6 - Dynamic Joystick (Base Speed Nerfed for Upgrade Impact & Safe Spawn)

window.playerMoveX = 0;
window.playerMoveY = 0;
window.isInvincible = false;
window.battleLoopInterval = null; 

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
    
    // 전투 화면 렌더링 시 플레이어 위치 중앙으로 강제 초기화 (버그 방지)
    window.worldWidth = window.worldWidth || 2000;
    window.worldHeight = window.worldHeight || 2000;
    window.playerX = window.worldWidth / 2;
    window.playerY = window.worldHeight / 2;
    
    let curMerc = typeof TOOTH_DATA !== 'undefined' ? TOOTH_DATA.mercenaries[window.mercenaryIdx] : null;
    let trainingHpBonus = window.trainingLevels && window.trainingLevels.hp ? window.trainingLevels.hp * 0.05 : 0;
    let baseMaxHp = curMerc ? curMerc.baseHp : 100;
    window.currentHp = baseMaxHp * (1 + trainingHpBonus);

    if (window.battleLoopInterval) {
        cancelAnimationFrame(window.battleLoopInterval);
        window.battleLoopInterval = null;
    }
    
    window.battleLoopInterval = requestAnimationFrame(battleLoop);
};

function setupDynamicJoystick() {
    const screen = document.getElementById('battle-screen');
    const zone = document.getElementById('joystick-zone');
    const knob = document.getElementById('joystick-knob');
    
    if(!screen || !zone || !knob) return;

    // 모바일 브라우저의 스와이프/스크롤 제스처 강제 차단!
    screen.style.touchAction = 'none';

    let isDragging = false;
    let centerX = 0;
    let centerY = 0;
    const maxRadius = 50; 

    zone.style.display = 'none';

    function stopDrag() {
        isDragging = false;
        window.playerMoveX = 0;
        window.playerMoveY = 0;
        knob.style.transform = `translate(-50%, -50%)`;
        zone.style.display = 'none';
    }

    // iOS 사파리 등에서 터치 이동 시 화면이 들썩거리는 현상 방지
    screen.addEventListener('touchmove', function(e) {
        if (isDragging) e.preventDefault();
    }, { passive: false });

    screen.onpointerdown = (e) => {
        if (e.target.closest('#war-weapon-slots') || e.target.closest('.btn-exit')) return;
        
        isDragging = true;
        centerX = e.clientX;
        centerY = e.clientY;
        
        zone.style.display = 'block';
        zone.style.right = 'auto'; 
        zone.style.bottom = 'auto';
        zone.style.left = (centerX - 60) + 'px'; 
        zone.style.top = (centerY - 60) + 'px';
        
        knob.style.transform = `translate(-50%, -50%)`;
        window.playerMoveX = 0;
        window.playerMoveY = 0;
        
        try { screen.setPointerCapture(e.pointerId); } catch(err){}
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
        
        if (distance > 0) {
            window.playerMoveX = dx / maxRadius;
            window.playerMoveY = dy / maxRadius;
        } else {
            window.playerMoveX = 0;
            window.playerMoveY = 0;
        }
    };

    screen.onpointerup = (e) => {
        stopDrag();
        try { screen.releasePointerCapture(e.pointerId); } catch(err){}
    };
    
    // 브라우저가 제스처로 착각해 터치를 뺏어갔을 때도 멈추도록 처리
    screen.onpointercancel = (e) => {
        stopDrag();
        try { screen.releasePointerCapture(e.pointerId); } catch(err){}
    };
}

function battleLoop() {
    if (!window.dungeonActive || window.bossDead) return;
    
    // 🌟 [핵심 변경] 기본 이동 속도 대폭 감소 (6 -> 2.5) 업그레이드 체감 극대화!
    let baseSpeed = 2.5; 
    let curMerc = typeof TOOTH_DATA !== 'undefined' ? TOOTH_DATA.mercenaries[window.mercenaryIdx] : null;
    let mercSpd = curMerc ? curMerc.spd : 1.0;
    
    let trainingSpdBonus = window.trainingLevels && window.trainingLevels.spd ? window.trainingLevels.spd * 0.1 : 0;
    let finalSpeed = baseSpeed * (mercSpd + trainingSpdBonus);

    window.playerX += window.playerMoveX * finalSpeed;
    window.playerY += window.playerMoveY * finalSpeed;
    
    let mapW = window.worldWidth || 2000;
    let mapH = window.worldHeight || 2000;
    window.playerX = Math.max(30, Math.min(mapW - 30, window.playerX));
    window.playerY = Math.max(30, Math.min(mapH - 30, window.playerY));
    
    const p = document.getElementById('player');
    if (p) {
        p.style.left = window.playerX + 'px';
        p.style.top = window.playerY + 'px';
    }

    const worldDiv = document.getElementById('battle-world');
    if (worldDiv) {
        let offsetX = (window.innerWidth / 2) - window.playerX;
        let offsetY = (window.innerHeight / 2) - window.playerY;
        worldDiv.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    }

    if (typeof updateCombat === 'function') updateCombat();
    window.battleLoopInterval = requestAnimationFrame(battleLoop);
}

window.takeDamage = function(dmg) {
    if (window.isInvincible) return;
    
    const p = document.getElementById('player');
    const pFill = document.getElementById('player-hp-bar-fill');
    
    let curMerc = typeof TOOTH_DATA !== 'undefined' ? TOOTH_DATA.mercenaries[window.mercenaryIdx] : null;
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
        setTimeout(() => { scr.style.background = ''; }, 100);
    }
    
    if(pFill) pFill.style.width = Math.max(0, (window.currentHp / maxHp * 100)) + '%';
    try { if(typeof playSfx === 'function') playSfx('damage'); } catch(e){}

    if (window.currentHp <= 0) {
        window.currentHp = maxHp; 
        alert("사망했습니다! 던전 탐험 실패!");
        if (typeof exitDungeon === 'function') exitDungeon();
    }
};

window.closeResultModal = function() {
    try {
        const modal = document.getElementById('dungeon-result-modal');
        if(modal) modal.style.display = 'none';
        if(typeof window.exitDungeon === 'function') window.exitDungeon();
    } catch (e) {
        console.error(e);
        document.getElementById('battle-screen').style.display = 'none';
        document.getElementById('game-container').style.display = 'flex';
    }
};
