// Version: 8.0.0 - Battle Engine (Rendering, Floating Joystick, Projectiles, Movement)

window.playerEntity = { x: 0, y: 0, hp: 100, maxHp: 100, speed: 150 };
window.enemyEntities = [];
window.projectiles = [];
window.battleAnimationFrame = null;

// --- [ 1. 플로팅 원형 조이스틱 (모바일 & PC 완벽 대응) ] ---
let joyActive = false;
let joyOrigin = { x: 0, y: 0 };
let joyDelta = { x: 0, y: 0 };
const JOY_MAX_RADIUS = 40;

window.initBattleUI = function() {
    const zone = document.getElementById('joystick-zone');
    const pad = document.getElementById('joystick-pad');
    const knob = document.getElementById('joystick-knob');
    if (!zone || !pad || !knob) return;

    // 초기화
    joyActive = false;
    joyDelta = { x: 0, y: 0 };
    pad.style.display = 'none';

    function startJoy(x, y) {
        joyActive = true;
        joyOrigin = { x, y };
        pad.style.display = 'block';
        pad.style.left = x + 'px';
        pad.style.top = y + 'px';
        knob.style.transform = `translate(-50%, -50%) translate(0px, 0px)`;
        joyDelta = { x: 0, y: 0 };
    }

    function moveJoy(x, y) {
        if (!joyActive) return;
        let dx = x - joyOrigin.x;
        let dy = y - joyOrigin.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > JOY_MAX_RADIUS) {
            dx = (dx / dist) * JOY_MAX_RADIUS;
            dy = (dy / dist) * JOY_MAX_RADIUS;
        }
        
        joyDelta = { x: dx, y: dy };
        knob.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px)`;
    }

    function endJoy() {
        joyActive = false;
        pad.style.display = 'none';
        joyDelta = { x: 0, y: 0 };
    }

    // 모바일 터치 이벤트
    zone.addEventListener('touchstart', e => {
        e.preventDefault();
        startJoy(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    
    zone.addEventListener('touchmove', e => {
        e.preventDefault();
        moveJoy(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    
    zone.addEventListener('touchend', e => {
        e.preventDefault();
        endJoy();
    }, { passive: false });

    // PC 마우스 이벤트 (테스트용)
    zone.addEventListener('mousedown', e => startJoy(e.clientX, e.clientY));
    zone.addEventListener('mousemove', e => moveJoy(e.clientX, e.clientY));
    window.addEventListener('mouseup', endJoy);
};

// --- [ 2. 전투 웨이브 및 스폰 시스템 ] ---
window.spawnWave = function() {
    if (!window.inBattle) return;
    
    document.getElementById('wave-info').innerText = `WAVE ${window.currentWave} / ${window.maxWaves}`;
    const world = document.getElementById('battle-world');
    world.innerHTML = '';
    window.enemyEntities = [];
    window.projectiles = [];

    // 플레이어 스폰
    let trainingBonus = window.trainingLevel ? (window.trainingLevel * 0.05) : 0;
    let baseHp = window.activeMercenary ? window.activeMercenary.baseHp : 100;
    let speedMult = window.activeMercenary ? window.activeMercenary.spd : 1.0;
    
    window.playerEntity = {
        x: window.innerWidth, 
        y: window.innerHeight, 
        hp: baseHp * (1 + trainingBonus),
        maxHp: baseHp * (1 + trainingBonus),
        speed: 150 * speedMult,
        element: document.createElement('div')
    };
    
    window.playerEntity.element.id = 'player';
    window.playerEntity.element.innerHTML = `${window.activeMercenary.icon}<div id="player-hp-bar-bg"><div id="player-hp-bar-fill"></div></div>`;
    world.appendChild(window.playerEntity.element);

    // 몬스터 정보 로드
    let isHell = (window.dungeonType === 'hell' || window.dungeonType === 'hellboss');
    let isBossRush = (window.dungeonType === 'boss' || window.dungeonType === 'hellboss');
    let mDataList = isHell ? TOOTH_DATA.hellMobs : TOOTH_DATA.dungeonMobs;
    let mobData = mDataList[Math.min(window.dungeonTarget - 1, mDataList.length - 1)];
    
    let isBossWave = (window.currentWave === window.maxWaves) || isBossRush;
    let mobCount = isBossWave ? 1 : 4 + Math.floor(Math.random() * 3);
    
    // 적 스폰
    for (let i = 0; i < mobCount; i++) {
        let isBoss = isBossWave && i === 0;
        let icon = isBoss ? mobData.boss : mobData.mobs[Math.floor(Math.random() * mobData.mobs.length)];
        
        let hpBase = 50 * Math.pow(2.0, window.dungeonTarget);
        if (isHell) hpBase *= 10;
        let enemyHp = isBoss ? hpBase * 10 : hpBase;

        let ex = window.playerEntity.x + (Math.random() * 600 - 300);
        let ey = window.playerEntity.y + (Math.random() * 600 - 300);
        
        let enemy = {
            id: Date.now() + i,
            x: ex, y: ey,
            hp: enemyHp, maxHp: enemyHp,
            isBoss: isBoss,
            speed: isBoss ? 40 : 60 + Math.random() * 30,
            icon: icon,
            element: document.createElement('div')
        };
        
        enemy.element.className = 'battle-enemy' + (isBoss ? ' boss' : '');
        enemy.element.innerHTML = `${icon}<div class="hp-bar-bg"><div class="hp-bar-fill" id="hp-${enemy.id}"></div></div>`;
        world.appendChild(enemy.element);
        window.enemyEntities.push(enemy);
    }

    // 전투 루프 및 인터벌 시작
    window.lastBattleTime = Date.now();
    cancelAnimationFrame(window.battleAnimationFrame);
    window.battleLoop();

    // 자동 공격 (0.5초마다 발사)
    let attackTimer = setInterval(() => {
        if (!window.inBattle) return;
        fireProjectile();
    }, 500);
    window.combatIntervals.push(attackTimer);

    // 몬스터 공격 (보스는 1.5초, 일반은 2초)
    let enemyAttackTimer = setInterval(() => {
        if (!window.inBattle) return;
        window.enemyEntities.forEach(enemy => {
            let dist = Math.hypot(window.playerEntity.x - enemy.x, window.playerEntity.y - enemy.y);
            if (dist < 150) {
                let dmg = enemy.isBoss ? (window.playerEntity.maxHp * 0.15) : (window.playerEntity.maxHp * 0.05);
                takePlayerDamage(dmg);
            }
        });
    }, 1500);
    window.combatIntervals.push(enemyAttackTimer);
};

// --- [ 3. 메인 배틀 렌더링 루프 (rAF) ] ---
window.battleLoop = function() {
    if (!window.inBattle) return;
    
    let now = Date.now();
    let dt = (now - window.lastBattleTime) / 1000;
    window.lastBattleTime = now;

    // 1. 플레이어 이동 (조이스틱 입력 적용)
    if (joyActive) {
        let moveX = (joyDelta.x / JOY_MAX_RADIUS) * window.playerEntity.speed * dt;
        let moveY = (joyDelta.y / JOY_MAX_RADIUS) * window.playerEntity.speed * dt;
        window.playerEntity.x += moveX;
        window.playerEntity.y += moveY;
        
        // 맵 경계 제한 (200vw x 200vh 기준)
        window.playerEntity.x = Math.max(0, Math.min(window.innerWidth * 2, window.playerEntity.x));
        window.playerEntity.y = Math.max(0, Math.min(window.innerHeight * 2, window.playerEntity.y));
    }

    // 2. 적 이동 (플레이어를 향해)
    window.enemyEntities.forEach(enemy => {
        let dx = window.playerEntity.x - enemy.x;
        let dy = window.playerEntity.y - enemy.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 50) { // 너무 가까우면 정지
            enemy.x += (dx / dist) * enemy.speed * dt;
            enemy.y += (dy / dist) * enemy.speed * dt;
        }
        enemy.element.style.left = enemy.x + 'px';
        enemy.element.style.top = enemy.y + 'px';
    });

    // 3. 투사체 이동 및 충돌 판정
    for (let i = window.projectiles.length - 1; i >= 0; i--) {
        let p = window.projectiles[i];
        let target = window.enemyEntities.find(e => e.id === p.targetId);
        
        if (!target) {
            p.element.remove();
            window.projectiles.splice(i, 1);
            continue;
        }

        let dx = target.x - p.x;
        let dy = target.y - p.y;
        let dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < 30) {
            // 명중! (combat.js의 데미지 렌더링 호출)
            hitEnemy(target, p.damageObj);
            p.element.remove();
            window.projectiles.splice(i, 1);
        } else {
            p.x += (dx / dist) * p.speed * dt;
            p.y += (dy / dist) * p.speed * dt;
            p.element.style.left = p.x + 'px';
            p.element.style.top = p.y + 'px';
        }
    }

    // 4. 화면 및 카메라 렌더링
    window.playerEntity.element.style.left = window.playerEntity.x + 'px';
    window.playerEntity.element.style.top = window.playerEntity.y + 'px';

    const camX = window.innerWidth / 2 - window.playerEntity.x;
    const camY = window.innerHeight / 2 - window.playerEntity.y;
    document.getElementById('battle-world').style.transform = `translate(${camX}px, ${camY}px)`;

    window.battleAnimationFrame = requestAnimationFrame(window.battleLoop);
};

// --- [ 4. 투사체 발사 및 타격 시스템 ] ---
function fireProjectile() {
    if (window.enemyEntities.length === 0) return;
    
    // 가장 가까운 적 찾기
    let nearest = null;
    let minDist = Infinity;
    window.enemyEntities.forEach(e => {
        let dist = Math.hypot(window.playerEntity.x - e.x, window.playerEntity.y - e.y);
        if (dist < minDist) { minDist = dist; nearest = e; }
    });

    if (!nearest) return;

    // combat.js의 데미지 수학 로직 호출
    let dmgObj = window.calculateDamage();
    
    let proj = document.createElement('div');
    proj.className = 'missile';
    let iconLvl = window.highestToothLevel;
    proj.innerHTML = getToothIcon(iconLvl);
    document.getElementById('battle-world').appendChild(proj);

    window.projectiles.push({
        x: window.playerEntity.x,
        y: window.playerEntity.y,
        targetId: nearest.id,
        speed: 600,
        damageObj: dmgObj,
        element: proj
    });
    
    try { if(typeof playSfx === 'function') playSfx('attack'); } catch(e){}
}

function hitEnemy(enemy, dmgObj) {
    let finalDmg = dmgObj.damage;
    enemy.hp -= finalDmg;
    
    // 체력바 갱신
    let hpBar = document.getElementById(`hp-${enemy.id}`);
    if (hpBar) hpBar.style.width = Math.max(0, (enemy.hp / enemy.maxHp) * 100) + '%';
    
    // 텍스트 이펙트
    showDamageText(enemy.x, enemy.y, finalDmg, dmgObj.isCrit);
    try { if(typeof playSfx === 'function') playSfx('damage'); } catch(e){}

    // 훈련장 스플래시 데미지 처리
    if (dmgObj.splashRange > 0) {
        let splashCircle = document.createElement('div');
        splashCircle.className = 'splash-effect';
        splashCircle.style.width = (dmgObj.splashRange * 2) + 'px';
        splashCircle.style.height = (dmgObj.splashRange * 2) + 'px';
        splashCircle.style.left = enemy.x + 'px';
        splashCircle.style.top = enemy.y + 'px';
        document.getElementById('battle-world').appendChild(splashCircle);
        setTimeout(() => splashCircle.remove(), 300);

        window.enemyEntities.forEach(other => {
            if (other.id !== enemy.id) {
                let dist = Math.hypot(enemy.x - other.x, enemy.y - other.y);
                if (dist <= dmgObj.splashRange) {
                    other.hp -= finalDmg * 0.5; // 스플래시는 50% 데미지
                    let oBar = document.getElementById(`hp-${other.id}`);
                    if (oBar) oBar.style.width = Math.max(0, (other.hp / other.maxHp) * 100) + '%';
                    if (other.hp <= 0) handleEnemyDeath(other);
                }
            }
        });
    }

    if (enemy.hp <= 0) {
        handleEnemyDeath(enemy);
    }
}

function takePlayerDamage(dmg) {
    window.playerEntity.hp -= dmg;
    let hpFill = document.getElementById('player-hp-bar-fill');
    if (hpFill) hpFill.style.width = Math.max(0, (window.playerEntity.hp / window.playerEntity.maxHp) * 100) + '%';
    
    window.playerEntity.element.classList.add('invincible');
    setTimeout(() => window.playerEntity.element.classList.remove('invincible'), 200);

    if (window.playerEntity.hp <= 0 && window.inBattle) {
        if(typeof window.loseDungeon === 'function') window.loseDungeon();
    }
}

function handleEnemyDeath(enemy) {
    enemy.element.remove();
    window.enemyEntities = window.enemyEntities.filter(e => e.id !== enemy.id);
    
    // 웨이브 클리어 판정
    if (window.enemyEntities.length === 0) {
        if (window.currentWave >= window.maxWaves) {
            if(typeof window.winDungeon === 'function') window.winDungeon();
        } else {
            window.currentWave++;
            setTimeout(() => {
                if (window.inBattle) window.spawnWave();
            }, 1000);
        }
    }
}

function showDamageText(x, y, dmg, isCrit) {
    const text = document.createElement('div');
    text.className = isCrit ? 'crit-text' : 'dmg-text';
    text.innerText = isCrit ? `💥 ${fNum(dmg)}!` : fNum(dmg);
    text.style.left = (x + (Math.random()*40 - 20)) + 'px';
    text.style.top = (y - 30) + 'px';
    document.getElementById('battle-world').appendChild(text);
    setTimeout(() => text.remove(), 600);
}
