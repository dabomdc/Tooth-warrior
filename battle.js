// Version: 6.8.9 - Dynamic Joystick & Camera Tracking (Smooth Move)

window.playerMoveX = 0;
window.playerMoveY = 0;
window.isInvincible = false;

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

    // 🌟 동적 조이스틱 이벤트 세팅
    setupDynamicJoystick();
    
    // 체력 초기화 (던전 진입 시마다 최대 체력으로 회복)
    let curMerc = typeof TOOTH_DATA !== 'undefined' ? TOOTH_DATA.mercenaries[window.mercenaryIdx] : null;
    let trainingHpBonus = window.trainingLevels && window.trainingLevels.hp ? window.trainingLevels.hp * 0.05 : 0;
    let baseMaxHp = curMerc ? curMerc.baseHp : 100;
    window.currentHp = baseMaxHp * (1 + trainingHpBonus);

    if (window.battleLoopInterval) cancelAnimationFrame(window.battleLoopInterval);
    window.battleLoopInterval = requestAnimationFrame(battleLoop);
};

// 🌟 [핵심 1] 화면 어디든 터치하면 조이스틱이 생성되는 로직
function setupDynamicJoystick() {
    const screen = document.getElementById('battle-screen');
    const zone = document.getElementById('joystick-zone');
    const knob = document.getElementById('joystick-knob');
    
    if(!screen || !zone || !knob) return;

    let isDragging = false;
    let centerX = 0;
    let centerY = 0;
    const maxRadius = 50; // 조이스틱 감도 (반지름)

    // 평소에는 조이스틱을 화면에서 숨겨둡니다.
    zone.style.display = 'none';

    screen.onpointerdown = (e) => {
        // 무기 슬롯(스킬창)이나 후퇴 버튼을 눌렀을 때는 조이스틱이 생기지 않도록 예외 처리
        if (e.target.closest('#war-weapon-slots') || e.target.closest('.btn-exit')) return;
        
        isDragging = true;
        
        // 터치한 위치를 조이스틱의 중심점(Center)으로 설정
        centerX = e.clientX;
        centerY = e.clientY;
        
        // 터치한 위치에 조이스틱 UI 띄우기 (zone 크기가 120이므로 절반인 60을 빼서 중앙 정렬)
        zone.style.display = 'block';
        zone.style.right = 'auto'; 
        zone.style.bottom = 'auto';
        zone.style.left = (centerX - 60) + 'px'; 
        zone.style.top = (centerY - 60) + 'px';
        
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
        
        // 드래그가 조이스틱 반경을 벗어나지 않도록 제한
        if (distance > maxRadius) {
            dx = (dx / distance) * maxRadius;
            dy = (dy / distance) * maxRadius;
            distance = maxRadius;
        }
        
        knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        
        // 이동 벡터 설정 (0.0 ~ 1.0 비율)
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

// 🌟 [핵심 2] 카메라가 캐릭터를 따라다니는 로직
function battleLoop() {
    if (!window.dungeonActive || window.bossDead) return;
    
    // 기본 이동 속도
    let baseSpeed = 6; 
    let curMerc = typeof TOOTH_DATA !== 'undefined' ? TOOTH_DATA.mercenaries[window.mercenaryIdx] : null;
    let mercSpd = curMerc ? curMerc.spd : 1.0;
    
    // 용병 훈련소 신속 스탯 반영
    let trainingSpdBonus = window.trainingLevels && window.trainingLevels.spd ? window.trainingLevels.spd * 0.1 : 0;
    let finalSpeed = baseSpeed * (mercSpd + trainingSpdBonus);

    // 실제 위치 이동 연산
    window.playerX += window.playerMoveX * finalSpeed;
    window.playerY += window.playerMoveY * finalSpeed;
    
    // 맵 경계선 밖으로 나가지 못하게 제한 (넓은 2000x2000 맵 기준)
    let mapW = window.worldWidth || 2000;
    let mapH = window.worldHeight || 2000;
    window.playerX = Math.max(30, Math.min(mapW - 30, window.playerX));
    window.playerY = Math.max(30, Math.min(mapH - 30, window.playerY));
    
    // 플레이어 캐릭터 DOM 위치 업데이트
    const p = document.getElementById('player');
    if (p) {
        p.style.left = window.playerX + 'px';
        p.style.top = window.playerY + 'px';
    }

    // 📸 [카메라 시점 이동] 화면 중앙에 캐릭터가 위치하도록 배경(world) 전체를 반대로 밀어줍니다.
    const worldDiv = document.getElementById('battle-world');
    if (worldDiv) {
        let offsetX = (window.innerWidth / 2) - window.playerX;
        let offsetY = (window.innerHeight / 2) - window.playerY;
        worldDiv.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    }

    // 투사체 및 몹 로직 업데이트 호출
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
    
    // 피격 시 무적 시간 부여
    window.isInvincible = true;
    if (p) p.classList.add('invincible');
    
    setTimeout(() => {
        window.isInvincible = false;
        if (p) p.classList.remove('invincible');
    }, 500);

    // 피격 이펙트 (화면 깜빡임)
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
