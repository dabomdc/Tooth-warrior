// Version: 6.7.1 - Battle System (Movement Speed Fix)

window.lastFrameTime = 0;
const FPS = 60;
const frameInterval = 1000 / FPS;

window.worldWidth = window.innerWidth * 2;
window.worldHeight = window.innerHeight * 2;
window.playerX = 0; window.playerY = 0;
window.currentMercenary = null;
window.playerHp = 100;
window.playerMaxHp = 100;
window.isInvincible = false;
window.joystickActive = false;
window.moveX = 0; window.moveY = 0;

function startDungeon(idx) {
    window.currentDungeonIdx = idx; 
    window.currentWave = 1; 
    window.isBossWave = false;
    window.enemies = []; 
    window.missiles = []; 
    window.enemyMissiles = [];
    window.dungeonActive = true;
    window.dungeonGoldEarned = 0;
    window.dungeonDiaEarned = 0; 
    
    window.activeSlotIndex = 0;
    window.relayTimer = 0;
    window.bossDead = false;
    window.lastFrameTime = performance.now();
    
    if (window.spawnTimeouts) {
        window.spawnTimeouts.forEach(id => clearTimeout(id));
    }
    window.spawnTimeouts = [];

    // 용병 기본 스탯 + 훈련소 버프 적용
    const baseMerc = TOOTH_DATA.mercenaries[window.mercenaryIdx || 0];
    const hpBuff = 1 + (window.trainingLevels.hp * 0.05);
    const spdBuff = window.trainingLevels.spd * 0.1;
    
    // 티어6 (Lv.26) 영구 어드밴티지: 용병 공격력 2배
    let tier6AtkBuff = (window.highestToothLevel >= 26) ? 2 : 1;
    const atkBuff = (1 + (window.trainingLevels.atk * 0.1)) * tier6AtkBuff;

    window.currentMercenary = {
        ...baseMerc,
        baseHp: Math.floor(baseMerc.baseHp * hpBuff),
        spd: baseMerc.spd + spdBuff, // 훈련소 스피드 버프
        atkMul: baseMerc.atkMul * atkBuff
    };
    
    window.worldWidth = window.innerWidth * 2; 
    window.worldHeight = window.innerHeight * 2;
    window.playerX = window.worldWidth / 2; 
    window.playerY = window.worldHeight / 2;
    
    // UI 숨기기 및 전투화면 보이기
    document.getElementById('bottom-nav').style.display = 'none';
    document.getElementById('top-nav').style.display = 'none';
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('battle-screen').style.display = 'block';
    
    // HELL 모드 여부에 따른 이름 및 테마 설정
    if(window.isHellMode) {
        document.getElementById('current-dungeon-name').innerText = TOOTH_DATA.hellDungeons[idx] || "지옥의 끝";
        window.currentTheme = TOOTH_DATA.hellMobs[idx] ? TOOTH_DATA.hellMobs[idx].theme : 'bg-hell';
    } else {
        document.getElementById('current-dungeon-name').innerText = TOOTH_DATA.dungeons[idx];
        window.currentTheme = TOOTH_DATA.dungeonMobs[idx] ? TOOTH_DATA.dungeonMobs[idx].theme : 'bg-grass';
    }
    
    document.getElementById('battle-world').className = window.currentTheme; 

    // 플레이어 생성
    let playerEl = document.getElementById('player');
    if (playerEl) playerEl.remove();
    playerEl = document.createElement('div');
    playerEl.id = 'player';
    playerEl.innerHTML = `<div id="player-hp-bar-bg"><div id="player-hp-bar-fill"></div></div><div id="player-char">${window.currentMercenary.icon}</div>`;
    document.getElementById('battle-world').appendChild(playerEl);
    
    window.playerMaxHp = window.currentMercenary.baseHp; 
    window.playerHp = window.playerMaxHp; 
    updatePlayerHpBar();
    updatePlayerPos(); 
    renderWarWeapons(); 
    
    if (window.spawnWave) window.spawnWave();
    if (!window.joystickInitialized) { setupJoystick(); window.joystickInitialized = true; }
    requestAnimationFrame(battleLoop);
}

function updatePlayerHpBar() { 
    const fill = document.getElementById('player-hp-bar-fill'); 
    if (fill) fill.style.width = Math.max(0, (window.playerHp / window.playerMaxHp * 100)) + '%'; 
}

function updatePlayerPos() { 
    const p = document.getElementById('player'); 
    if(p) { p.style.left = window.playerX + 'px'; p.style.top = window.playerY + 'px'; } 
}

function battleLoop(timestamp) { 
    if (!window.dungeonActive) return; 
    requestAnimationFrame(battleLoop); 

    const elapsed = timestamp - window.lastFrameTime;
    if (elapsed > frameInterval) {
        window.lastFrameTime = timestamp - (elapsed % frameInterval);
        
        updatePlayerMovement(); 
        updateCamera(); 
        if(window.updateCombat) window.updateCombat();
    }
}

function updatePlayerMovement() { 
    if (Math.abs(window.moveX) < 0.1 && Math.abs(window.moveY) < 0.1) return; 
    
    // [수정 핵심] 기본 이동 속도 계수를 5에서 2.5로 대폭 감소시켰습니다.
    const speed = 2.5 * (window.currentMercenary.spd || 1.0); 
    
    window.playerX += window.moveX * speed; 
    window.playerY += window.moveY * speed; 
    
    window.playerX = Math.max(20, Math.min(window.worldWidth - 20, window.playerX)); 
    window.playerY = Math.max(20, Math.min(window.worldHeight - 20, window.playerY)); 
    updatePlayerPos(); 
    
    const char = document.getElementById('player-char'); 
    if(char) char.style.transform = window.moveX < 0 ? 'scaleX(-1)' : 'scaleX(1)'; 
}

function updateCamera() { 
    const camX = window.playerX - window.innerWidth / 2; 
    const camY = window.playerY - window.innerHeight / 2; 
    document.getElementById('battle-world').style.transform = `translate(${-camX}px, ${-camY}px)`; 
}

function takeDamage(amount) { 
    if(window.isInvincible) return; 
    
    window.playerHp -= amount; 
    updatePlayerHpBar(); 
    playSfx('damage'); 
    window.isInvincible = true; 
    
    const p = document.getElementById('player'); 
    if(p) p.classList.add('invincible'); 
    setTimeout(() => { 
        window.isInvincible = false; 
        if(p) p.classList.remove('invincible'); 
    }, 1000); 
    
    if (window.playerHp <= 0) { 
        alert("용병이 쓰러졌습니다!"); 
        exitDungeon(); 
    } 
}

function exitDungeon() { 
    window.dungeonActive = false; 
    
    if(window.enemies) window.enemies.forEach(en => { if(en.el) en.el.remove(); }); 
    if(window.missiles) window.missiles.forEach(m => { if(m.el) m.el.remove(); }); 
    if(window.enemyMissiles) window.enemyMissiles.forEach(m => { if(m.el) m.el.remove(); }); 
    
    window.enemies = []; 
    window.missiles = []; 
    window.enemyMissiles = [];
    
    if(window.spawnTimeouts) {
        window.spawnTimeouts.forEach(id => clearTimeout(id));
        window.spawnTimeouts = [];
    }
    
    document.getElementById('battle-screen').style.display = 'none'; 
    document.getElementById('game-container').style.display = 'flex'; 
    document.getElementById('top-nav').style.display = 'grid'; 
    document.getElementById('bottom-nav').style.display = 'flex'; 
    
    if(window.renderDungeonList) window.renderDungeonList(); 
    if(window.updateUI) window.updateUI();
}

function renderWarWeapons() { 
    const container = document.getElementById('war-weapon-slots'); 
    container.innerHTML = ''; 
    for (let i = 0; i < 8; i++) { 
        const slot = document.createElement('div'); 
        slot.className = 'war-slot'; 
        slot.id = `war-slot-${i}`; 
        slot.innerHTML = `<div class="cd-overlay"></div>` + getToothIcon(window.inventory[i] || 0); 
        container.appendChild(slot); 
    } 
}

function setupJoystick() { 
    const zone = document.getElementById('joystick-zone'); 
    const knob = document.getElementById('joystick-knob'); 
    let touchId = null; 
    
    const handleStart = (e) => { 
        e.preventDefault(); 
        const touch = e.changedTouches ? e.changedTouches[0] : e; 
        touchId = touch.identifier; 
        window.joystickActive = true; 
        updateKnob(touch.clientX, touch.clientY); 
    }; 
    
    const handleMove = (e) => { 
        if (!window.joystickActive) return; 
        e.preventDefault(); 
        const touch = e.changedTouches ? Array.from(e.changedTouches).find(t => t.identifier === touchId) : e; 
        if (touch) updateKnob(touch.clientX, touch.clientY); 
    }; 
    
    const handleEnd = (e) => { 
        e.preventDefault(); 
        window.joystickActive = false; 
        window.moveX = 0; 
        window.moveY = 0; 
        knob.style.transform = `translate(-50%, -50%)`; 
        knob.style.left = '50%'; 
        knob.style.top = '50%'; 
    }; 
    
    const updateKnob = (cx, cy) => { 
        const rect = zone.getBoundingClientRect(); 
        const centerX = rect.left + rect.width / 2; 
        const centerY = rect.top + rect.height / 2; 
        let dx = cx - centerX; 
        let dy = cy - centerY; 
        const dist = Math.sqrt(dx*dx + dy*dy); 
        const maxDist = rect.width / 2 - 25; 
        const angle = Math.atan2(dy, dx); 
        const clampedDist = Math.min(dist, maxDist); 
        
        window.moveX = Math.cos(angle) * (clampedDist / maxDist); 
        window.moveY = Math.sin(angle) * (clampedDist / maxDist); 
        
        const kx = Math.cos(angle) * clampedDist; 
        const ky = Math.sin(angle) * clampedDist; 
        knob.style.transform = `translate(-50%, -50%) translate(${kx}px, ${ky}px)`; 
    }; 
    
    zone.addEventListener('touchstart', handleStart, {passive: false}); 
    zone.addEventListener('touchmove', handleMove, {passive: false}); 
    zone.addEventListener('touchend', handleEnd, {passive: false}); 
    zone.addEventListener('mousedown', handleStart); 
    window.addEventListener('mousemove', handleMove); 
    window.addEventListener('mouseup', handleEnd); 
}
