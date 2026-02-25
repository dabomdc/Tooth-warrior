// Version: 6.9.0 - Combat Engine (Damage Formula & Dungeon Refresh Fixed)

window.dungeonActive = false;
window.bossDead = false;
window.currentWave = 1;
window.isBossWave = false;
window.enemies = [];
window.missiles = [];
window.enemyMissiles = [];
window.spawnTimeouts = [];
window.relayTimer = 0;
window.activeSlotIndex = 0;
window.isBossRush = false;

window.startDungeon = function(idx) {
    window.currentDungeonIdx = idx;
    
    const tab = window.currentDungeonTab || 'normal';
    window.isHellMode = (tab === 'hell' || tab === 'hellboss');
    window.isBossRush = (tab === 'boss' || tab === 'hellboss');

    // 입장료 로직
    if (window.isBossRush) {
        let goldFee = Math.floor(5000 * Math.pow(2.0, idx));
        let diaFee = 5 + (idx * 5);
        if (window.isHellMode) { goldFee *= 10; diaFee *= 5; }

        if (window.gold < goldFee || window.dia < diaFee) {
            alert(`[토벌전 입장 실패]\n입장료가 부족합니다!\n필요: ${window.fNum ? window.fNum(goldFee) : goldFee}G, ♦️${diaFee}`);
            return;
        }
        window.gold -= goldFee;
        window.dia -= diaFee;
        if(window.updateUI) window.updateUI();
    }

    document.getElementById('game-container').style.display = 'none';
    const battleScreen = document.getElementById('battle-screen');
    const worldDiv = document.getElementById('battle-world');
    battleScreen.style.display = 'block';
    
    // 🌟 넓은 맵 2000x2000 사이즈 고정
    window.worldWidth = 2000;
    window.worldHeight = 2000;
    worldDiv.style.width = window.worldWidth + 'px';
    worldDiv.style.height = window.worldHeight + 'px';

    // 🌟 배경 타일 복구 (battle-world에 배경을 입혀야 카메라 이동 시 자연스러움)
    let theme = "bg-stone";
    if (window.isHellMode) {
        theme = (TOOTH_DATA.hellMobs[0] && TOOTH_DATA.hellMobs[0].theme) ? TOOTH_DATA.hellMobs[0].theme : "bg-hell";
        battleScreen.style.boxShadow = "inset 0 0 50px red";
    } else {
        let safeThemeIdx = Math.min(idx, TOOTH_DATA.dungeonMobs.length - 1);
        theme = (TOOTH_DATA.dungeonMobs[safeThemeIdx] && TOOTH_DATA.dungeonMobs[safeThemeIdx].theme) ? TOOTH_DATA.dungeonMobs[safeThemeIdx].theme : "bg-stone";
        battleScreen.style.boxShadow = "none";
    }
    worldDiv.className = theme;

    let dName = window.isHellMode ? (typeof TOOTH_DATA !== 'undefined' ? TOOTH_DATA.hellDungeons[idx] : `HELL Lv.${idx+1}`) 
                                  : (typeof TOOTH_DATA !== 'undefined' ? TOOTH_DATA.dungeons[idx] : `던전 Lv.${idx+1}`);
    if (window.isBossRush) dName = `[토벌전] ` + dName;
    document.getElementById('current-dungeon-name').innerText = dName;
    
    window.dungeonGoldEarned = 0;
    window.dungeonDiaEarned = 0;
    window.dungeonActive = true;
    window.bossDead = false;
    window.currentWave = 1;
    window.isBossWave = window.isBossRush ? true : false; 
    window.enemies = [];
    window.missiles = [];
    window.enemyMissiles = [];
    window.relayTimer = 0;
    window.activeSlotIndex = 0;
    
    window.playerX = window.worldWidth / 2;
    window.playerY = window.worldHeight / 2;

    // 🌟 주인공 캐릭터를 용병 아이콘으로 완벽 적용
    let curMercIcon = "🦷";
    if (typeof TOOTH_DATA !== 'undefined' && TOOTH_DATA.mercenaries[window.mercenaryIdx]) {
        curMercIcon = TOOTH_DATA.mercenaries[window.mercenaryIdx].icon;
    }
    
    worldDiv.innerHTML = `<div id="player" style="font-size: 40px; text-shadow: 0 0 5px rgba(255,255,255,0.5);">${curMercIcon}<div id="player-hp-bar-bg"><div id="player-hp-bar-fill"></div></div></div>`;
    
    const p = document.getElementById('player');
    p.style.left = window.playerX + 'px';
    p.style.top = window.playerY + 'px';
    
    if(window.renderBattleSlots) window.renderBattleSlots();
    setTimeout(() => { window.spawnWave(); }, 1000);
};

window.spawnWave = function() {
    if (!window.dungeonActive || window.bossDead) return;
    if (!window.isBossRush && window.isBossWave && window.enemies.some(e => e.isBoss)) return;

    const waveInfo = document.getElementById('wave-info');
    if (window.isBossRush) {
        if(waveInfo) waveInfo.innerText = `🔥 BOSS RUSH ${window.currentWave}/5 🔥`;
        setTimeout(() => { 
            if(window.dungeonActive && !window.bossDead) window.spawnEnemy(true); 
        }, 800);
    } else {
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
    }
};

window.spawnEnemy = function(isBoss = false) {
    const worldDiv = document.getElementById('battle-world');
    if(!worldDiv || typeof TOOTH_DATA === 'undefined') return;

    const en = document.createElement('div');
    en.className = isBoss ? 'battle-enemy boss' : 'battle-enemy';
    
    let mobList = window.isHellMode ? TOOTH_DATA.hellMobs : TOOTH_DATA.dungeonMobs;
    
    let safeIdx = window.currentDungeonIdx;
    if (window.isBossRush) {
        safeIdx = Math.min(window.currentDungeonIdx + (window.currentWave - 1), mobList.length - 1);
    } else {
        safeIdx = Math.min(window.currentDungeonIdx, mobList.length - 1);
    }
    
    const mobData = mobList[safeIdx];
    let icon = isBoss ? mobData.boss : mobData.mobs[Math.floor(Math.random() * mobData.mobs.length)];

    const angle = Math.random() * Math.PI * 2;
    // 넓어진 맵(2000x2000)에 맞게 적 스폰 거리 확장
    const dist = 600; 
    let sx = window.playerX + Math.cos(angle) * dist; 
    let sy = window.playerY + Math.sin(angle) * dist;
    
    sx = Math.max(50, Math.min(window.worldWidth - 50, sx));
    sy = Math.max(50, Math.min(window.worldHeight - 50, sy));
    
    let baseHp = Math.floor(100 * Math.pow(window.isHellMode ? 2.5 : 2.2, safeIdx));
    if (window.isHellMode) baseHp *= 50;
    
    let bossMul = 30;
    if (window.isBossRush) bossMul = 20 * Math.pow(1.5, window.currentWave);

    const maxHp = baseHp * (isBoss ? bossMul : 1);
    
    en.innerHTML = `<div class="hp-bar-bg"><div class="hp-bar-fill" style="width:100%"></div></div><span>${icon}</span>`;
    en.style.left = sx + 'px'; en.style.top = sy + 'px'; 
    worldDiv.appendChild(en); 
    
    window.enemies.push({ 
        el: en, hpFill: en.querySelector('.hp-bar-fill'), 
        x: sx, y: sy, isBoss, phase: 1, 
        hp: maxHp, maxHp: maxHp, speed: isBoss ? 1.5 : 2.5 + (safeIdx * 0.1), shootTimer: 0 
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
        if (en.isBoss && distToPlayer < 300 && en.phase === 1) moveSpeed = 0; 
        
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
        if(en.phase === 2) shootLimit /= 2; 

        if (en.shootTimer >= shootLimit) {
            en.shootTimer = 0;
            if (en.isBoss) {
                if (window.currentDungeonIdx > 5 || window.isHellMode || en.phase === 2) {
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
                
                if (window.highestToothLevel >= 7 && window.trainingLevels.splashDmg > 0) {
                    let splashDmgLevel = window.trainingLevels.splashDmg || 0;
                    let splashRangeLevel = window.trainingLevels.splashRange || 0;
                    
                    let splashRatio = Math.min(0.8, 0.2 + (splashDmgLevel * 0.05)); 
                    let splashRadius = 50 + (splashRangeLevel * 10); 
                    let finalSplashDmg = m.dmg * splashRatio;

                    const worldDiv = document.getElementById('battle-world');
                    const splashDiv = document.createElement('div');
                    splashDiv.className = 'splash-effect';
                    splashDiv.style.width = (splashRadius * 2) + 'px';
                    splashDiv.style.height = (splashRadius * 2) + 'px';
                    splashDiv.style.left = en.x + 'px';
                    splashDiv.style.top = en.y + 'px';
                    if(worldDiv) worldDiv.appendChild(splashDiv);
                    setTimeout(() => splashDiv.remove(), 300);

                    window.enemies.forEach(otherEn => {
                        if (otherEn !== en) {
                            let distToExplosion = Math.hypot(otherEn.x - en.x, otherEn.y - en.y);
                            if (distToExplosion <= splashRadius) {
                                otherEn.hp -= finalSplashDmg;
                                if(otherEn.hpFill) otherEn.hpFill.style.width = Math.max(0, (otherEn.hp / otherEn.maxHp * 100)) + '%';
                                window.showDmgText(otherEn.x, otherEn.y, finalSplashDmg);
                                if (otherEn.hp <= 0) {
                                    otherEn.el.remove();
                                    const oIdx = window.enemies.indexOf(otherEn);
                                    if(oIdx > -1) window.enemies.splice(oIdx, 1);
                                    window.processEnemyDeath(otherEn);
                                }
                            }
                        }
                    });
                }

                m.el.remove(); window.missiles.splice(i, 1);
                
                if (en.hp <= 0) {
                    const targetIdx = window.enemies.indexOf(en);
                    if(targetIdx > -1) {
                        window.enemies.splice(targetIdx, 1);
                        en.el.remove();
                        window.processEnemyDeath(en); 
                    }
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
    
    // 🌟 [핵심 수정] 데미지 계산식 정상화 (용병 배수 및 훈련 보너스 완벽 반영)
    let refineMul = 1 + ((window.slotUpgrades && window.slotUpgrades[slotIdx]) ? window.slotUpgrades[slotIdx].atk * 0.1 : 0); 
    let baseAtk = typeof getAtk === 'function' ? getAtk(window.inventory[slotIdx]) : 10;
    
    let curMerc = (typeof TOOTH_DATA !== 'undefined' && TOOTH_DATA.mercenaries[window.mercenaryIdx]) ? TOOTH_DATA.mercenaries[window.mercenaryIdx] : null;
    let mercMul = curMerc ? curMerc.atkMul : 1.0;
    
    let trainingAtkBonus = (window.trainingLevels && window.trainingLevels.atk) ? window.trainingLevels.atk * 0.1 : 0;
    let trainingMul = 1 + trainingAtkBonus;

    // 최종 데미지 = 기본공격력 * 용병배수 * 제련증폭 * 훈련증폭
    let dmg = baseAtk * mercMul * refineMul * trainingMul; 
    
    let isCrit = false;
    if (window.highestToothLevel >= 10) { 
        let critLv = window.trainingLevels.crit || 0;
        let critChance = 0.05 + (critLv * 0.02); 
        let critMultiplier = 2.0 + (critLv * 0.2); 

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
    if (window.isHellMode && en.isBoss && en.phase === 1) {
        en.phase = 2;
        en.hp = en.maxHp * 0.5; 
        en.speed *= 2; 
        
        const scr = document.getElementById('battle-screen');
        if(scr) {
            scr.style.background = 'rgba(255,0,0,0.5)';
            setTimeout(() => scr.style.background = '', 150);
            setTimeout(() => scr.style.background = 'rgba(255,0,0,0.5)', 300);
            setTimeout(() => scr.style.background = '', 450);
        }
        
        en.el.style.filter = 'drop-shadow(0 0 20px red) hue-rotate(180deg)';
        en.el.style.transform = 'translate(-50%, -50%) scale(1.5)';
        document.getElementById('battle-world').appendChild(en.el); 
        window.enemies.push(en);
        
        const txt = document.createElement('div');
        txt.className = 'crit-text'; 
        txt.innerText = "광폭화!!";
        txt.style.left = en.x + 'px'; txt.style.top = (en.y - 80) + 'px'; 
        document.getElementById('battle-world').appendChild(txt); setTimeout(() => txt.remove(), 1000);
        return; 
    }

    let goldGain = Math.floor(2000 * Math.pow(2.5, window.currentDungeonIdx));
    if (en.isBoss) goldGain *= 5;
    if (window.isHellMode) goldGain *= 20;
    
    if (window.isBossRush) goldGain *= (2 * window.currentWave);
    if (window.highestToothLevel >= 22) goldGain *= 5; 

    window.gold += goldGain;
    window.dungeonGoldEarned += goldGain;
    window.showGoldText(en.x, en.y, goldGain);

    let diaGain = 0;
    let baseDia = 1 + Math.floor(window.currentDungeonIdx * 1.5);
    if (window.isHellMode) baseDia *= 10;

    if (en.isBoss) {
        diaGain = baseDia * 5; 
        if (window.isBossRush) diaGain *= window.currentWave; 
    } else if (Math.random() < 0.1) {
        diaGain = baseDia; 
    }

    if (diaGain > 0 && window.highestToothLevel >= 13) diaGain *= 2; 
    if (diaGain > 0 && window.highestToothLevel >= 22) diaGain *= 5; 

    if (diaGain > 0) {
        window.dia += diaGain;
        window.dungeonDiaEarned += diaGain;
        window.showDiaText(en.x, en.y, diaGain);
    }

    if (en.isBoss) {
        window.createExplosion(en.x, en.y);
        
        if (window.isBossRush) {
            if (window.currentWave < 5) {
                window.currentWave++;
                setTimeout(() => { if(typeof spawnWave === 'function') window.spawnWave(); }, 1500);
            } else {
                window.bossDead = true;
                setTimeout(() => { 
                    if(typeof showResultModal === 'function') window.showResultModal(); 
                    window.dungeonActive = false;
                }, 1500);
            }
        } else {
            window.bossDead = true;
            setTimeout(() => { 
                if(typeof showResultModal === 'function') window.showResultModal(); 
                window.dungeonActive = false;
            }, 1500);
        }
    } else {
        window.checkWaveClear(); 
    }
};

window.checkWaveClear = function() { 
    if (window.enemies.length === 0 && !window.isBossWave && !window.isBossRush) { 
        window.currentWave++; 
        if (window.currentWave > 5) window.isBossWave = true; 
        if(typeof spawnWave === 'function') window.spawnWave(); 
    } 
};

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
    txt.innerText = window.fNum ? window.fNum(dmg) : dmg; 
    txt.style.left = x + 'px'; txt.style.top = (y - 40) + 'px'; 
    worldDiv.appendChild(txt); setTimeout(() => txt.remove(), 500); 
};
window.showCritText = function(x, y, dmg) { 
    const worldDiv = document.getElementById('battle-world'); 
    if(!worldDiv) return;
    const txt = document.createElement('div'); txt.className = 'crit-text'; 
    txt.innerText = `CRIT! ${window.fNum ? window.fNum(dmg) : dmg}`; 
    txt.style.left = x + 'px'; txt.style.top = (y - 50) + 'px'; 
    worldDiv.appendChild(txt); setTimeout(() => txt.remove(), 600); 
};
window.showGoldText = function(x, y, val) { 
    const worldDiv = document.getElementById('battle-world'); 
    if(!worldDiv) return;
    const txt = document.createElement('div'); txt.className = 'gold-text'; 
    txt.innerText = `💰+${window.fNum ? window.fNum(val) : val}`; 
    txt.style.left = x + 'px'; txt.style.top = (y - 50) + 'px'; 
    worldDiv.appendChild(txt); setTimeout(() => txt.remove(), 800); 
};
window.showDiaText = function(x, y, val) { 
    const worldDiv = document.getElementById('battle-world'); 
    if(!worldDiv) return;
    const txt = document.createElement('div'); txt.className = 'dia-drop-text'; 
    txt.innerText = `♦️+${window.fNum ? window.fNum(val) : val}`; 
    txt.style.left = x + 'px'; txt.style.top = (y - 70) + 'px'; 
    worldDiv.appendChild(txt); setTimeout(() => txt.remove(), 1000); 
};

// 🌟 [핵심 수정] 던전 퇴장 시 목록 강제 갱신 (새로고침 버그 해결)
window.exitDungeon = function() {
    try {
        window.dungeonActive = false;
        window.bossDead = true; 
        document.getElementById('battle-screen').style.display = 'none';
        document.getElementById('game-container').style.display = 'flex';
        document.getElementById('battle-world').className = ""; 
        
        if (window.enemies) window.enemies.forEach(e => { if(e && e.el) e.el.remove() });
        if (window.missiles) window.missiles.forEach(m => { if(m && m.el) m.el.remove() });
        if (window.enemyMissiles) window.enemyMissiles.forEach(em => { if(em && em.el) em.el.remove() });
        if (window.spawnTimeouts) window.spawnTimeouts.forEach(t => clearTimeout(t));
        
        window.enemies = [];
        window.missiles = [];
        window.enemyMissiles = [];
        
        if(typeof updateUI === 'function') window.updateUI();
        
        // 추가된 UI 즉시 갱신 로직
        if(typeof renderDungeonList === 'function') window.renderDungeonList();
        if(typeof renderMercenaryCamp === 'function') window.renderMercenaryCamp();
    } catch(e) {
        console.error("Exit Dungeon Error:", e);
    }
};

window.closeResultModal = function() {
    const modal = document.getElementById('dungeon-result-modal');
    if(modal) modal.style.display = 'none';
    if(typeof exitDungeon === 'function') window.exitDungeon();
};
