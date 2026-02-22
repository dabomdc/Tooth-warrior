// Version: 6.7.5 - Combat Logic (Critical Hit Training Applied)

window.spawnWave = function() {
    if (!window.dungeonActive || window.bossDead) return;
    if (window.isBossWave && window.enemies.some(e => e.isBoss)) return;

    const waveInfo = document.getElementById('wave-info');
    if(waveInfo) waveInfo.innerText = window.isBossWave ? "☠️ BOSS ☠️" : `WAVE ${window.currentWave}/5`;
    
    const count = window.isBossWave ? 1 : 5 + (window.currentWave * 2);
    
    for (let i = 0; i < count; i++) {
        const tid = setTimeout(() => { 
            if(window.dungeonActive && !window.bossDead) {
                if (window.isBossWave && window.enemies.some(e => e.isBoss)) return;
                window.spawnEnemy(window.isBossWave); 
            }
        }, i * 800);
        window.spawnTimeouts.push(tid);
    }
};

window.spawnEnemy = function(isBoss = false) {
    const worldDiv = document.getElementById('battle-world');
    if(!worldDiv || typeof TOOTH_DATA === 'undefined') return;

    const en = document.createElement('div');
    en.className = isBoss ? 'battle-enemy boss' : 'battle-enemy';
    
    let mobList = window.isHellMode ? TOOTH_DATA.hellMobs : TOOTH_DATA.dungeonMobs;
    let safeIdx = Math.min(window.currentDungeonIdx, mobList.length - 1);
    const mobData = mobList[safeIdx];
    
    let icon = isBoss ? mobData.boss : mobData.mobs[Math.floor(Math.random() * mobData.mobs.length)];

    const angle = Math.random() * Math.PI * 2;
    const dist = Math.min(window.worldWidth, window.worldHeight) / 2 - 50;
    let sx = (window.worldWidth / 2) + Math.cos(angle) * dist; 
    let sy = (window.worldHeight / 2) + Math.sin(angle) * dist;
    
    let baseHp = Math.floor(100 * Math.pow(2.2, window.currentDungeonIdx));
    if (window.isHellMode) baseHp *= 50;
    const maxHp = baseHp * (isBoss ? 30 : 1);
    
    en.innerHTML = `<div class="hp-bar-bg"><div class="hp-bar-fill" style="width:100%"></div></div><span>${icon}</span>`;
    en.style.left = sx + 'px'; en.style.top = sy + 'px'; 
    worldDiv.appendChild(en); 
    
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
};

window.updateCombat = function() {
    if (window.bossDead || !window.dungeonActive) return;

    window.enemies.forEach(en => {
        const dx = window.playerX - en.x; 
        const dy = window.playerY - en.y;
        const distToPlayer = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        
        let moveSpeed = en.speed;
        if(window.isHellMode) moveSpeed *= 1.5;
        if (en.isBoss && distToPlayer < 300) moveSpeed = 0; 
        
        en.x += Math.cos(angle) * moveSpeed; 
        en.y += Math.sin(angle) * moveSpeed;
        en.el.style.left = en.x + 'px'; en.el.style.top = en.y + 'px';
        
        if (!window.isInvincible && distToPlayer < 35) { 
            let bodyDmg = 10 + (window.currentDungeonIdx * 5);
            if(window.isHellMode) bodyDmg *= 10;
            if(window.takeDamage) window.takeDamage(bodyDmg); 
        }

        en.shootTimer++;
        let shootLimit = en.isBoss ? 120 : 300; 
        if(window.isHellMode) shootLimit /= 2; 

        if (en.shootTimer >= shootLimit) {
            en.shootTimer = 0;
            if (en.isBoss) {
                if (window.currentDungeonIdx > 5 || window.isHellMode) {
                    window.enemyShoot(en.x, en.y, angle - 0.3, "🔥");
                    window.enemyShoot(en.x, en.y, angle, "🔥");
                    window.enemyShoot(en.x, en.y, angle + 0.3, "🔥");
                } else {
                    window.enemyShoot(en.x, en.y, angle, "🔮");
                }
            } else {
                if (window.currentDungeonIdx > 10 || window.isHellMode) {
                    window.enemyShoot(en.x, en.y, angle, "💧");
                }
            }
        }
    });

    let nearest = null; let minDst = Infinity;
    window.enemies.forEach(en => { 
        const d = Math.hypot(window.playerX - en.x, window.playerY - en.y); 
        if (d < minDst) { minDst = d; nearest = en; } 
    });
    
    const cdReductionPercent = Math.min(90, window.globalUpgrades.cd * 2); 
    const maxCD = Math.max(6, 60 * (1 - cdReductionPercent/100));

    if (window.relayTimer < maxCD) { window.relayTimer++; }
    
    for(let i=0; i<8; i++) {
        const slotEl = document.getElementById(`war-slot-${i}`);
        if(slotEl) {
            const mask = slotEl.querySelector('.cd-overlay');
            if (i === window.activeSlotIndex) {
                const percent = 100 - (window.relayTimer / maxCD * 100);
                if(mask) mask.style.height = `${Math.max(0, percent)}%`;
                slotEl.style.border = '2px solid #00fbff';
                if(window.relayTimer >= maxCD) slotEl.style.background = 'rgba(0, 255, 0, 0.2)'; 
                else slotEl.style.background = '#1a1a2e';
            } else {
                if(mask) mask.style.height = '100%';
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
                    window.playerShoot(window.activeSlotIndex, nearest);
                    window.relayTimer = 0;
                    window.activeSlotIndex = (window.activeSlotIndex + 1) % 8;
                }
            }
        }
    }

    for (let i = window.missiles.length - 1; i >= 0; i--) {
        const m = window.missiles[i];
        m.x += m.vx; m.y += m.vy;
        m.el.style.left = m.x + 'px'; m.el.style.top = m.y + 'px';
        
        if (Math.hypot(m.x - m.startX, m.y - m.startY) > 2000) { m.el.remove(); window.missiles.splice(i, 1); continue; }

        for (let j = window.enemies.length - 1; j >= 0; j--) {
            const en = window.enemies[j];
            if (Math.hypot(m.x - en.x, m.y - en.y) < 40) { 
                en.hp -= m.dmg;
                if(en.hpFill) en.hpFill.style.width = Math.max(0, (en.hp / en.maxHp * 100)) + '%';
                
                if(m.isCrit) window.showCritText(en.x, en.y, m.dmg);
                else window.showDmgText(en.x, en.y, m.dmg);
                
                try { if(typeof playSfx === 'function') playSfx('hit'); } catch(e){}
                m.el.remove(); window.missiles.splice(i, 1);
                
                if (en.hp <= 0) {
                    en.el.remove();
                    window.enemies.splice(j, 1);
                    window.processEnemyDeath(en); 
                }
                break;
            }
        }
    }

    for (let i = window.enemyMissiles.length - 1; i >= 0; i--) {
        const em = window.enemyMissiles[i];
        em.x += em.vx; em.y += em.vy;
        em.el.style.left = em.x + 'px'; em.el.style.top = em.y + 'px';

        if (Math.hypot(em.x - em.startX, em.y - em.startY) > 1500) { em.el.remove(); window.enemyMissiles.splice(i, 1); continue; }

        if (!window.isInvincible && Math.hypot(em.x - window.playerX, em.y - window.playerY) < 30) {
            if(window.takeDamage) window.takeDamage(em.dmg);
            em.el.remove(); window.enemyMissiles.splice(i, 1);
        }
    }
};

window.playerShoot = function(slotIdx, target) { 
    try { if(typeof playSfx === 'function') playSfx('attack'); } catch(e){} 
    const worldDiv = document.getElementById('battle-world'); 
    if(!worldDiv) return;

    const mEl = document.createElement('div'); 
    mEl.className = 'missile'; 
    mEl.innerHTML = typeof getToothIcon === 'function' ? getToothIcon(window.inventory[slotIdx]) : "🦷"; 
    worldDiv.appendChild(mEl); 
    
    const angle = Math.atan2(target.y - window.playerY, target.x - window.playerX); 
    const speed = 18; 
    
    let refineMul = 1 + (window.slotUpgrades[slotIdx].atk * 0.1); 
    let baseAtk = typeof getAtk === 'function' ? getAtk(window.inventory[slotIdx]) : 10;
    let dmg = baseAtk * (window.currentMercenary ? window.currentMercenary.atkMul : 1) * refineMul; 
    
    // --- [ 핵심 수정: 훈련장 치명타 수치 반영 ] ---
    let isCrit = false;
    if (window.highestToothLevel >= 16) {
        let critLv = window.trainingLevels.crit || 0;
        let critChance = 0.05 + (critLv * 0.02); // 기본 5% + 업글당 2%
        let critMultiplier = 2.0 + (critLv * 0.2); // 기본 2배 + 업글당 0.2배

        if (Math.random() < critChance) {
            dmg *= critMultiplier;
            isCrit = true;
        }
    }

    window.missiles.push({ 
        el: mEl, x: window.playerX, y: window.playerY, startX: window.playerX, startY: window.playerY, 
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, dmg: dmg, isCrit: isCrit
    }); 
};

window.enemyShoot = function(ex, ey, angle, iconStr) {
    const worldDiv = document.getElementById('battle-world'); 
    if(!worldDiv) return;
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
};

window.processEnemyDeath = function(en) {
    let goldGain = Math.floor(2000 * Math.pow(2.5, window.currentDungeonIdx));
    if (en.isBoss) goldGain *= 5;
    if (window.isHellMode) goldGain *= 20;
    if (en.isBoss && window.highestToothLevel >= 31) goldGain *= 2; 

    window.gold += goldGain;
    window.dungeonGoldEarned += goldGain;
    window.showGoldText(en.x, en.y, goldGain);

    let diaGain = 0;
    let baseDia = 1 + Math.floor(window.currentDungeonIdx * 1.5);
    if (window.isHellMode) baseDia *= 10;

    if (en.isBoss) {
        diaGain = baseDia * 5; 
    } else if (Math.random() < 0.1) {
        diaGain = baseDia; 
    }

    if (diaGain > 0 && window.highestToothLevel >= 21) diaGain *= 2; 

    if (diaGain > 0) {
        window.dia += diaGain;
        window.dungeonDiaEarned += diaGain;
        window.showDiaText(en.x, en.y, diaGain);
    }

    if (en.isBoss) {
        window.bossDead = true;
        window.createExplosion(en.x, en.y);
        setTimeout(() => { 
            if(typeof showResultModal === 'function') window.showResultModal(); 
            window.dungeonActive = false;
        }, 1500);
    } else {
        window.checkWaveClear(); 
    }
};

window.checkWaveClear = function() { 
    if (window.enemies.length === 0 && !window.isBossWave) { 
        window.currentWave++; 
        if (window.currentWave > 5) window.isBossWave = true; 
        if(typeof spawnWave === 'function') window.spawnWave(); 
    } 
};

// 이펙트 및 모달
window.createExplosion = function(x, y) {
    const worldDiv = document.getElementById('battle-world');
    if(!worldDiv) return;
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
};

window.showDmgText = function(x, y, dmg) { 
    const worldDiv = document.getElementById('battle-world'); 
    if(!worldDiv) return;
    const txt = document.createElement('div'); txt.className = 'dmg-text'; 
    txt.innerText = typeof fNum === 'function' ? fNum(dmg) : dmg; 
    txt.style.left = x + 'px'; txt.style.top = (y - 40) + 'px'; 
    worldDiv.appendChild(txt); setTimeout(() => txt.remove(), 500); 
};
window.showCritText = function(x, y, dmg) { 
    const worldDiv = document.getElementById('battle-world'); 
    if(!worldDiv) return;
    const txt = document.createElement('div'); txt.className = 'crit-text'; 
    txt.innerText = `CRIT! ${typeof fNum === 'function' ? fNum(dmg) : dmg}`; 
    txt.style.left = x + 'px'; txt.style.top = (y - 50) + 'px'; 
    worldDiv.appendChild(txt); setTimeout(() => txt.remove(), 600); 
};
window.showGoldText = function(x, y, val) { 
    const worldDiv = document.getElementById('battle-world'); 
    if(!worldDiv) return;
    const txt = document.createElement('div'); txt.className = 'gold-text'; 
    txt.innerText = `💰+${typeof fNum === 'function' ? fNum(val) : val}`; 
    txt.style.left = x + 'px'; txt.style.top = (y - 50) + 'px'; 
    worldDiv.appendChild(txt); setTimeout(() => txt.remove(), 800); 
};
window.showDiaText = function(x, y, val) { 
    const worldDiv = document.getElementById('battle-world'); 
    if(!worldDiv) return;
    const txt = document.createElement('div'); txt.className = 'dia-drop-text'; 
    txt.innerText = `♦️+${typeof fNum === 'function' ? fNum(val) : val}`; 
    txt.style.left = x + 'px'; txt.style.top = (y - 70) + 'px'; 
    worldDiv.appendChild(txt); setTimeout(() => txt.remove(), 1000); 
};

window.showResultModal = function() {
    const modal = document.getElementById('dungeon-result-modal');
    if(!modal || typeof TOOTH_DATA === 'undefined') return;
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
            획득 골드: <span style="color:var(--gold); font-weight:bold;">${typeof fNum === 'function' ? fNum(window.dungeonGoldEarned) : window.dungeonGoldEarned}G</span><br>
            획득 다이아: <span style="color:#ff4757; font-weight:bold;">${window.dungeonDiaEarned}♦️</span>
        </div>
        <div style="color:#2ecc71; font-weight:bold;">${nextStr}</div>
    `;
    if(typeof saveGame === 'function') window.saveGame();
};

window.closeResultModal = function() { 
    const modal = document.getElementById('dungeon-result-modal');
    if(modal) modal.style.display = 'none'; 
    if(typeof exitDungeon === 'function') window.exitDungeon(); 
};
