// Version: 6.7.0 - Combat Logic & Enemy AI (Hell, Missiles, Crit)

function spawnWave() {
    if (!window.dungeonActive || window.bossDead) return;
    if (window.isBossWave && window.enemies.some(e => e.isBoss)) return;

    document.getElementById('wave-info').innerText = window.isBossWave ? "☠️ BOSS ☠️" : `WAVE ${window.currentWave}/5`;
    const count = window.isBossWave ? 1 : 5 + (window.currentWave * 2);
    
    for (let i = 0; i < count; i++) {
        const tid = setTimeout(() => { 
            if(window.dungeonActive && !window.bossDead) {
                if (window.isBossWave && window.enemies.some(e => e.isBoss)) return;
                spawnEnemy(window.isBossWave); 
            }
        }, i * 800);
        window.spawnTimeouts.push(tid);
    }
}

function spawnEnemy(isBoss = false) {
    const worldDiv = document.getElementById('battle-world');
    const en = document.createElement('div');
    en.className = isBoss ? 'battle-enemy boss' : 'battle-enemy';
    
    // HELL 모드 체크
    let mobList = window.isHellMode ? TOOTH_DATA.hellMobs : TOOTH_DATA.dungeonMobs;
    let safeIdx = Math.min(window.currentDungeonIdx, mobList.length - 1);
    const mobData = mobList[safeIdx];
    
    let icon = isBoss ? mobData.boss : mobData.mobs[Math.floor(Math.random() * mobData.mobs.length)];

    const angle = Math.random() * Math.PI * 2;
    const dist = Math.min(window.worldWidth, window.worldHeight) / 2 - 50;
    let sx = (window.worldWidth / 2) + Math.cos(angle) * dist; 
    let sy = (window.worldHeight / 2) + Math.sin(angle) * dist;
    
    // 체력 및 스탯 계산 (HELL 모드면 50배 체력, 10배 공격력)
    let baseHp = Math.floor(100 * Math.pow(2.2, window.currentDungeonIdx));
    if (window.isHellMode) baseHp *= 50;
    const maxHp = baseHp * (isBoss ? 30 : 1);
    
    en.innerHTML = `<div class="hp-bar-bg"><div class="hp-bar-fill" style="width:100%"></div></div><span>${icon}</span>`;
    en.style.left = sx + 'px'; en.style.top = sy + 'px'; 
    worldDiv.appendChild(en); 
    
    // 적 객체 생성 (shootTimer 추가)
    window.enemies.push({ 
        el: en, 
        hpFill: en.querySelector('.hp-bar-fill'), 
        x: sx, 
        y: sy, 
        isBoss, 
        hp: maxHp, 
        maxHp: maxHp,
        speed: isBoss ? 1.5 : 2.5 + (window.currentDungeonIdx * 0.1),
        shootTimer: 0 
    });
}

function updateCombat() {
    if (window.bossDead || !window.dungeonActive) return;

    // 1. 적 이동 및 미사일 발사 (패턴)
    window.enemies.forEach(en => {
        const dx = window.playerX - en.x; 
        const dy = window.playerY - en.y;
        const distToPlayer = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        
        // 이동 (보스는 거리를 약간 두고 포격, 일반몹은 돌격)
        let moveSpeed = en.speed;
        if(window.isHellMode) moveSpeed *= 1.5;
        
        if (en.isBoss && distToPlayer < 300) {
            moveSpeed = 0; // 거리가 가까우면 멈춰서 쏨
        }
        
        en.x += Math.cos(angle) * moveSpeed; 
        en.y += Math.sin(angle) * moveSpeed;
        en.el.style.left = en.x + 'px'; en.el.style.top = en.y + 'px';
        
        // 몸통 박치기 데미지
        if (!window.isInvincible && distToPlayer < 35) { 
            let bodyDmg = 10 + (window.currentDungeonIdx * 5);
            if(window.isHellMode) bodyDmg *= 10;
            takeDamage(bodyDmg); 
        }

        // 미사일 발사 로직 (원거리 공격 패턴)
        en.shootTimer++;
        let shootLimit = en.isBoss ? 120 : 300; // 보스는 2초마다, 일반몹은 5초마다
        if(window.isHellMode) shootLimit /= 2; // 헬모드는 2배 빨리 쏨

        if (en.shootTimer >= shootLimit) {
            en.shootTimer = 0;
            if (en.isBoss) {
                // 중/후반 던전 보스는 3갈래 산탄
                if (window.currentDungeonIdx > 5 || window.isHellMode) {
                    enemyShoot(en.x, en.y, angle - 0.3, "🔥");
                    enemyShoot(en.x, en.y, angle, "🔥");
                    enemyShoot(en.x, en.y, angle + 0.3, "🔥");
                } else {
                    enemyShoot(en.x, en.y, angle, "🔮");
                }
            } else {
                // 후반 던전이거나 헬모드면 일반 몹도 미사일 쏨
                if (window.currentDungeonIdx > 10 || window.isHellMode) {
                    enemyShoot(en.x, en.y, angle, "💧");
                }
            }
        }
    });

    // 2. 가장 가까운 적 찾기
    let nearest = null; let minDst = Infinity;
    window.enemies.forEach(en => { 
        const d = Math.hypot(window.playerX - en.x, window.playerY - en.y); 
        if (d < minDst) { minDst = d; nearest = en; } 
    });
    
    // 3. 릴레이 쿨타임 및 공격
    const cdReductionPercent = Math.min(90, window.globalUpgrades.cd * 2); 
    const maxCD = Math.max(6, 60 * (1 - cdReductionPercent/100));

    if (window.relayTimer < maxCD) { window.relayTimer++; }
    
    for(let i=0; i<8; i++) {
        const slotEl = document.getElementById(`war-slot-${i}`);
        if(slotEl) {
            const mask = slotEl.querySelector('.cd-overlay');
            if (i === window.activeSlotIndex) {
                const percent = 100 - (window.relayTimer / maxCD * 100);
                mask.style.height = `${Math.max(0, percent)}%`;
                slotEl.style.border = '2px solid #00fbff';
                if(window.relayTimer >= maxCD) slotEl.style.background = 'rgba(0, 255, 0, 0.2)'; 
                else slotEl.style.background = '#1a1a2e';
            } else {
                mask.style.height = '100%';
                slotEl.style.border = '1px solid #555';
                slotEl.style.background = '#1a1a2e';
            }
        }
    }

    if (window.relayTimer >= maxCD) {
        if (!window.inventory[window.activeSlotIndex] || window.inventory[window.activeSlotIndex] === 0) {
            window.relayTimer = 0;
            window.activeSlotIndex = (window.activeSlotIndex + 1) % 8;
        } else {
            if (nearest && !window.bossDead) {
                const maxRngLimit = window.worldWidth / 2;
                const calcRng = 300 + (window.globalUpgrades.rng * 20);
                const range = Math.min(maxRngLimit, calcRng);
                
                if (minDst <= range) {
                    playerShoot(window.activeSlotIndex, nearest);
                    window.relayTimer = 0;
                    window.activeSlotIndex = (window.activeSlotIndex + 1) % 8;
                }
            }
        }
    }

    // 4. 플레이어 투사체(Missiles) 이동 및 적 충돌 판정
    for (let i = window.missiles.length - 1; i >= 0; i--) {
        const m = window.missiles[i];
        m.x += m.vx; m.y += m.vy;
        m.el.style.left = m.x + 'px'; m.el.style.top = m.y + 'px';
        
        if (Math.hypot(m.x - m.startX, m.y - m.startY) > 2000) { m.el.remove(); window.missiles.splice(i, 1); continue; }

        for (let j = window.enemies.length - 1; j >= 0; j--) {
            const en = window.enemies[j];
            if (Math.hypot(m.x - en.x, m.y - en.y) < 40) { 
                en.hp -= m.dmg;
                en.hpFill.style.width = Math.max(0, (en.hp / en.maxHp * 100)) + '%';
                
                if(m.isCrit) showCritText(en.x, en.y, m.dmg);
                else showDmgText(en.x, en.y, m.dmg);
                
                playSfx('hit');
                m.el.remove(); window.missiles.splice(i, 1);
                
                if (en.hp <= 0) {
                    processEnemyDeath(en);
                    en.el.remove();
                    window.enemies.splice(j, 1);
                }
                break;
            }
        }
    }

    // 5. 적 투사체(Enemy Missiles) 이동 및 플레이어 충돌 판정
    for (let i = window.enemyMissiles.length - 1; i >= 0; i--) {
        const em = window.enemyMissiles[i];
        em.x += em.vx; em.y += em.vy;
        em.el.style.left = em.x + 'px'; em.el.style.top = em.y + 'px';

        if (Math.hypot(em.x - em.startX, em.y - em.startY) > 1500) { em.el.remove(); window.enemyMissiles.splice(i, 1); continue; }

        if (!window.isInvincible && Math.hypot(em.x - window.playerX, em.y - window.playerY) < 30) {
            takeDamage(em.dmg);
            em.el.remove(); window.enemyMissiles.splice(i, 1);
        }
    }
}

// 플레이어 공격 발사
function playerShoot(slotIdx, target) { 
    playSfx('attack'); 
    const worldDiv = document.getElementById('battle-world'); 
    const mEl = document.createElement('div'); 
    mEl.className = 'missile'; 
    mEl.innerHTML = getToothIcon(window.inventory[slotIdx]); 
    worldDiv.appendChild(mEl); 
    
    const angle = Math.atan2(target.y - window.playerY, target.x - window.playerX); 
    const speed = 18; 
    
    let refineMul = 1 + (window.slotUpgrades[slotIdx].atk * 0.1); 
    let dmg = getAtk(window.inventory[slotIdx]) * window.currentMercenary.atkMul * refineMul; 
    
    // 티어4 (Lv.16) 영구 어드밴티지: 치명타 5% 확률로 2배 데미지
    let isCrit = false;
    if (window.highestToothLevel >= 16 && Math.random() < 0.05) {
        dmg *= 2;
        isCrit = true;
    }

    window.missiles.push({ 
        el: mEl, x: window.playerX, y: window.playerY, startX: window.playerX, startY: window.playerY, 
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, dmg: dmg, isCrit: isCrit
    }); 
}

// 적 원거리 공격 발사
function enemyShoot(ex, ey, angle, iconStr) {
    const worldDiv = document.getElementById('battle-world'); 
    const mEl = document.createElement('div'); 
    mEl.className = 'enemy-missile'; 
    mEl.innerText = iconStr;
    worldDiv.appendChild(mEl); 

    const speed = 7; 
    let baseDmg = 15 + (window.currentDungeonIdx * 5);
    if(window.isHellMode) baseDmg *= 10;

    window.enemyMissiles.push({
        el: mEl, x: ex, y: ey, startX: ex, startY: ey,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, dmg: baseDmg
    });
}

function processEnemyDeath(en) {
    // 1. 골드 획득 계산
    let goldGain = Math.floor(2000 * Math.pow(2.5, window.currentDungeonIdx));
    if (en.isBoss) goldGain *= 5;
    if (window.isHellMode) goldGain *= 20;
    
    // 티어7 (Lv.31) 영구 어드밴티지: 던전 클리어 골드 2배 (보스 한정 적용)
    if (en.isBoss && window.highestToothLevel >= 31) goldGain *= 2;

    window.gold += goldGain;
    window.dungeonGoldEarned += goldGain;
    showGoldText(en.x, en.y, goldGain);

    // 2. 다이아(💎) 획득 계산
    let diaGain = 0;
    let baseDia = 1 + Math.floor(window.currentDungeonIdx * 1.5);
    if (window.isHellMode) baseDia *= 10;

    if (en.isBoss) {
        diaGain = baseDia * 5; // 보스는 확정 5배
    } else if (Math.random() < 0.1) {
        diaGain = baseDia; // 일반몹은 10% 확률로 기본량
    }

    // 티어5 (Lv.21) 영구 어드밴티지: 다이아 획득량 2배
    if (diaGain > 0 && window.highestToothLevel >= 21) diaGain *= 2;

    if (diaGain > 0) {
        window.dia += diaGain;
        window.dungeonDiaEarned += diaGain;
        showDiaText(en.x, en.y, diaGain);
    }

    // 3. 웨이브 클리어 또는 보스 격파 판정
    if (en.isBoss) {
        window.bossDead = true;
        createExplosion(en.x, en.y);
        setTimeout(() => { 
            showResultModal(); 
            window.dungeonActive = false;
        }, 1500);
    } else {
        checkWaveClear();
    }
}

function checkWaveClear() { 
    if (window.enemies.length === 0 && !window.isBossWave) { 
        window.currentWave++; 
        if (window.currentWave > 5) window.isBossWave = true; 
        spawnWave(); 
    } 
}

// 이펙트 및 텍스트 표시
function createExplosion(x, y) {
    const worldDiv = document.getElementById('battle-world');
    const exp = document.createElement('div');
    exp.innerText = "💥";
    exp.style.position = 'absolute';
    exp.style.left = x + 'px'; exp.style.top = y + 'px';
    exp.style.transform = 'translate(-50%, -50%)';
    exp.style.fontSize = '150px';
    exp.style.zIndex = '20000';
    exp.style.textShadow = '0 0 20px red';
    exp.style.animation = 'popUp 1s ease-out';
    worldDiv.appendChild(exp);
    setTimeout(() => exp.remove(), 1000);
}
function showDmgText(x, y, dmg) { const worldDiv = document.getElementById('battle-world'); const txt = document.createElement('div'); txt.className = 'dmg-text'; txt.innerText = fNum(dmg); txt.style.left = x + 'px'; txt.style.top = (y - 40) + 'px'; worldDiv.appendChild(txt); setTimeout(() => txt.remove(), 500); }
function showCritText(x, y, dmg) { const worldDiv = document.getElementById('battle-world'); const txt = document.createElement('div'); txt.className = 'crit-text'; txt.innerText = `CRIT! ${fNum(dmg)}`; txt.style.left = x + 'px'; txt.style.top = (y - 50) + 'px'; worldDiv.appendChild(txt); setTimeout(() => txt.remove(), 600); }
function showGoldText(x, y, val) { const worldDiv = document.getElementById('battle-world'); const txt = document.createElement('div'); txt.className = 'gold-text'; txt.innerText = `💰+${fNum(val)}`; txt.style.left = x + 'px'; txt.style.top = (y - 50) + 'px'; worldDiv.appendChild(txt); setTimeout(() => txt.remove(), 800); }
function showDiaText(x, y, val) { const worldDiv = document.getElementById('battle-world'); const txt = document.createElement('div'); txt.className = 'dia-drop-text'; txt.innerText = `💎+${val}`; txt.style.left = x + 'px'; txt.style.top = (y - 70) + 'px'; worldDiv.appendChild(txt); setTimeout(() => txt.remove(), 1000); }

// 결과 모달창
function showResultModal() {
    const modal = document.getElementById('dungeon-result-modal');
    modal.style.display = 'flex';
    
    let dName = window.isHellMode ? TOOTH_DATA.hellDungeons[window.currentDungeonIdx] : TOOTH_DATA.dungeons[window.currentDungeonIdx];
    document.getElementById('result-title').innerText = `${dName} CLEAR!`;
    
    let nextStr = "모든 던전을 정복했습니다!";
    if (window.unlockedDungeon <= window.currentDungeonIdx + 1 && window.currentDungeonIdx < 19) {
        window.unlockedDungeon = window.currentDungeonIdx + 2;
        nextStr = `다음 던전 오픈!`;
    }

    document.getElementById('result-desc').innerHTML = `
        <div style="margin: 15px 0; font-size:18px;">
            획득 골드: <span style="color:var(--gold); font-weight:bold;">${fNum(window.dungeonGoldEarned)}G</span><br>
            획득 다이아: <span style="color:#00fbff; font-weight:bold;">${window.dungeonDiaEarned}💎</span>
        </div>
        <div style="color:#2ecc71; font-weight:bold;">${nextStr}</div>
    `;
    if(window.saveGame) window.saveGame();
}

function closeResultModal() { 
    document.getElementById('dungeon-result-modal').style.display = 'none'; 
    exitDungeon(); 
}
