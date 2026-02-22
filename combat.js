// Version: 6.8.0 - Combat Engine (Boss Rush, Hell Phase 2, Splash Damage)

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

// --- [ 1. 던전 진입 (토벌전 입장료 로직 포함) ] ---
window.startDungeon = function(idx) {
    window.currentDungeonIdx = idx;
    
    // 현재 탭 상태에 따라 헬모드/토벌전 여부 결정
    const tab = window.currentDungeonTab || 'normal';
    window.isHellMode = (tab === 'hell' || tab === 'hellboss');
    window.isBossRush = (tab === 'boss' || tab === 'hellboss');

    // 토벌전일 경우 입장료 처리
    if (window.isBossRush) {
        // 던전 단계가 높을수록, 헬모드일수록 입장료 급증
        let goldFee = Math.floor(5000 * Math.pow(2.0, idx));
        let diaFee = 5 + (idx * 5);
        if (window.isHellMode) {
            goldFee *= 10;
            diaFee *= 5;
        }

        if (window.gold < goldFee || window.dia < diaFee) {
            alert(`[토벌전 입장 실패]\n입장료가 부족합니다!\n필요: ${window.fNum ? window.fNum(goldFee) : goldFee}G, ♦️${diaFee}`);
            return;
        }
        
        // 입장료 지불
        window.gold -= goldFee;
        window.dia -= diaFee;
        if(window.updateUI) window.updateUI();
    }

    // 전투 초기화
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('battle-screen').style.display = 'block';
    
    let dName = "";
    if (window.isHellMode) {
        dName = typeof TOOTH_DATA !== 'undefined' ? TOOTH_DATA.hellDungeons[idx] : `HELL Lv.${idx+1}`;
        document.getElementById('battle-screen').style.boxShadow = "inset 0 0 50px red";
    } else {
        dName = typeof TOOTH_DATA !== 'undefined' ? TOOTH_DATA.dungeons[idx] : `던전 Lv.${idx+1}`;
        document.getElementById('battle-screen').style.boxShadow = "none";
    }
    
    if (window.isBossRush) dName = `[토벌전] ` + dName;
    document.getElementById('current-dungeon-name').innerText = dName;
    
    window.dungeonGoldEarned = 0;
    window.dungeonDiaEarned = 0;
    window.dungeonActive = true;
    window.bossDead = false;
    window.currentWave = 1;
    window.isBossWave = window.isBossRush; // 토벌전은 처음부터 보스전
    window.enemies = [];
    window.missiles = [];
    window.enemyMissiles = [];
    window.relayTimer = 0;
    window.activeSlotIndex = 0;
    document.getElementById('battle-world').innerHTML = '<div id="player">🦷<div id="player-hp-bar-bg"><div id="player-hp-bar-fill"></div></div></div>';
    
    // 플레이어 중앙 배치 (화면 크기 기준)
    window.worldWidth = window.innerWidth;
    window.worldHeight = window.innerHeight;
    window.playerX = window.worldWidth / 2;
    window.playerY = window.worldHeight / 2;
    
    const p = document.getElementById('player');
    p.style.left = window.playerX + 'px';
    p.style.top = window.playerY + 'px';
    
    if(window.renderBattleSlots) window.renderBattleSlots();
    
    setTimeout(() => { window.spawnWave(); }, 1000);
};

// --- [ 2. 웨이브 및 몹 생성 (보스 러시 대응) ] ---
window.spawnWave = function() {
    if (!window.dungeonActive || window.bossDead) return;
    if (window.isBossWave && window.enemies.some(e => e.isBoss)) return;

    const waveInfo = document.getElementById('wave-info');
    if (window.isBossRush) {
        if(waveInfo) waveInfo.innerText = `🔥 BOSS RUSH ${window.currentWave}/5 🔥`;
    } else {
        if(waveInfo) waveInfo.innerText = window.isBossWave ? "☠️ BOSS ☠️" : `WAVE ${window.currentWave}/5`;
    }
    
    // 토벌전(Boss Rush)은 웨이브마다 보스 1마리만 등장
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
    
    // 24단계 압축 대응: 몬스터 체력도 강력하게 스케일링
    let baseHp = Math.floor(100 * Math.pow(2.5, window.currentDungeonIdx));
    if (window.isHellMode) baseHp *= 50;
    
    // 토벌전이면 웨이브가 갈수록 보스 체력이 더 뻥튀기됨
    let bossMul = 30;
    if (window.isBossRush) bossMul = 20 * Math.pow(1.5, window.currentWave);

    const maxHp = baseHp * (isBoss ? bossMul : 1);
    
    en.innerHTML = `<div class="hp-bar-bg"><div class="hp-bar-fill" style="width:100%"></div></div><span>${icon}</span>`;
    en.style.left = sx + 'px'; en.style.top = sy + 'px'; 
    worldDiv.appendChild(en); 
    
    window.enemies.push({ 
        el: en, 
        hpFill: en.querySelector('.hp-bar-fill'), 
        x: sx, 
        y: sy, 
        isBoss, 
        phase: 1, // 헬 모드 광폭화용 페이즈
        hp: maxHp, 
        maxHp: maxHp,
        speed: isBoss ? 1.5 : 2.5 + (window.currentDungeonIdx * 0.1),
        shootTimer: 0 
    });
};

// --- [ 3. 핵심 전투 루프 (광폭화, 스플래시 연동) ] ---
window.updateCombat = function() {
    if (window.bossDead || !window.dungeonActive) return;

    // 1. 적 이동 및 미사일 발사
    window.enemies.forEach(en => {
        const dx = window.playerX - en.x; 
        const dy = window.playerY - en.y;
        const distToPlayer = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        
        let moveSpeed = en.speed;
        if(window.isHellMode) moveSpeed *= 1.5;
        
        // 헬모드 보스 페이즈2 (광폭화) 일 때는 거리가 가까워도 멈추지 않고 2배 속도로 돌진
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
        if(en.phase === 2) shootLimit /= 2; // 광폭화 시 미사일 연사속도 2배

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

    // 🌟 4. 투사체 충돌 및 스플래시 폭발 판정
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
                
                // 💥 스플래시(광역) 폭발 로직
                if (window.highestToothLevel >= 7 && window.trainingLevels.splashDmg > 0) {
                    let splashDmgLevel = window.trainingLevels.splashDmg || 0;
                    let splashRangeLevel = window.trainingLevels.splashRange || 0;
                    
                    let splashRatio = Math.min(0.8, 0.2 + (splashDmgLevel * 0.05)); // 20% ~ 80%
                    let splashRadius = 50 + (splashRangeLevel * 10); // 기본 50px + @
                    let finalSplashDmg = m.dmg * splashRatio;

                    // 스플래시 시각 이펙트 생성
                    const worldDiv = document.getElementById('battle-world');
                    const splashDiv = document.createElement('div');
                    splashDiv.className = 'splash-effect';
                    splashDiv.style.width = (splashRadius * 2) + 'px';
                    splashDiv.style.height = (splashRadius * 2) + 'px';
                    splashDiv.style.left = en.x + 'px';
                    splashDiv.style.top = en.y + 'px';
                    if(worldDiv) worldDiv.appendChild(splashDiv);
                    setTimeout(() => splashDiv.remove(), 300);

                    // 주변 적 데미지 적용
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
                    // 적 제거 전 배열에서 분리
                    const targetIdx = window.enemies.indexOf(en);
                    if(targetIdx > -1) {
                        window.enemies.splice(targetIdx, 1);
                        en.el.remove();
                        window.processEnemyDeath(en); 
                    }
                }
                break; // 투사체 파괴되었으므로 루프 탈출
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
    
    let isCrit = false;
    if (window.highestToothLevel >= 10) { // Lv.10 개방
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

// --- [ 5. 적 사망 처리 (광폭화, 토벌전 보상 포함) ] ---
window.processEnemyDeath = function(en) {
    // ☠️ 헬 모드 보스 광폭화 (Phase 2) 로직
    if (window.isHellMode && en.isBoss && en.phase === 1) {
        en.phase = 2;
        en.hp = en.maxHp * 0.5; // 체력 절반으로 부활
        en.speed *= 2; // 이속 2배
        
        // 화면 붉은 번쩍임 연출
        const scr = document.getElementById('battle-screen');
        if(scr) {
            scr.style.background = 'rgba(255,0,0,0.5)';
            setTimeout(() => scr.style.background = '#000', 150);
            setTimeout(() => scr.style.background = 'rgba(255,0,0,0.5)', 300);
            setTimeout(() => scr.style.background = '#000', 450);
        }
        
        // 다시 몬스터 배열에 넣어서 부활시킴 (el은 다시 append 하지 않아도 그대로 유지됨)
        en.el.style.filter = 'drop-shadow(0 0 20px red) hue-rotate(180deg)';
        en.el.style.transform = 'translate(-50%, -50%) scale(1.5)';
        document.getElementById('battle-world').appendChild(en.el); // 돔에 다시 붙임
        window.enemies.push(en);
        
        const txt = document.createElement('div');
        txt.className = 'crit-text'; 
        txt.innerText = "광폭화!!";
        txt.style.left = en.x + 'px'; txt.style.top = (en.y - 80) + 'px'; 
        document.getElementById('battle-world').appendChild(txt); setTimeout(() => txt.remove(), 1000);
        return; // 완전 사망이 아니므로 리턴
    }

    let goldGain = Math.floor(2000 * Math.pow(2.5, window.currentDungeonIdx));
    if (en.isBoss) goldGain *= 5;
    if (window.isHellMode) goldGain *= 20;
    
    // 토벌전이면 보상이 기하급수적으로 증가 (입장료 회수용)
    if (window.isBossRush) goldGain *= (2 * window.currentWave);

    // [티어 8] Lv.22 신성한 축복: 보상 5배 증폭
    if (window.highestToothLevel >= 22) goldGain *= 5; 

    window.gold += goldGain;
    window.dungeonGoldEarned += goldGain;
    window.showGoldText(en.x, en.y, goldGain);

    let diaGain = 0;
    let baseDia = 1 + Math.floor(window.currentDungeonIdx * 1.5);
    if (window.isHellMode) baseDia *= 10;

    if (en.isBoss) {
        diaGain = baseDia * 5; 
        if (window.isBossRush) diaGain *= window.currentWave; // 토벌전 보너스
    } else if (Math.random() < 0.1) {
        diaGain = baseDia; 
    }

    // [티어 5] Lv.13 다이아몬드 러시: 다이아 2배
    if (diaGain > 0 && window.highestToothLevel >= 13) diaGain *= 2; 
    // [티어 8] Lv.22 신성한 축복: 보상 5배 증폭
    if (diaGain > 0 && window.highestToothLevel >= 22) diaGain *= 5; 

    if (diaGain > 0) {
        window.dia += diaGain;
        window.dungeonDiaEarned += diaGain;
        window.showDiaText(en.x, en.y, diaGain);
    }

    if (en.isBoss) {
        window.createExplosion(en.x, en.y);
        
        // 토벌전일 경우 5웨이브까지 반복
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
            // 일반 보스전 종료
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

// --- 이펙트 및 모달 ---
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

window.exitDungeon = function() {
    window.dungeonActive = false;
    document.getElementById('battle-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    window.enemies.forEach(e => e.el.remove());
    window.missiles.forEach(m => m.el.remove());
    window.enemyMissiles.forEach(em => em.el.remove());
    window.spawnTimeouts.forEach(t => clearTimeout(t));
    if(typeof updateUI === 'function') window.updateUI();
};

window.showResultModal = function() {
    const modal = document.getElementById('dungeon-result-modal');
    if(!modal || typeof TOOTH_DATA === 'undefined') return;
    modal.style.display = 'flex';
    
    let dName = window.isHellMode ? TOOTH_DATA.hellDungeons[window.currentDungeonIdx] : TOOTH_DATA.dungeons[window.currentDungeonIdx];
    if (window.isBossRush) dName = `[토벌전] ` + dName;
    document.getElementById('result-title').innerText = `${dName} CLEAR!`;
    
    let nextStr = "모든 던전을 정복했습니다!";
    
    // 던전 진도 업데이트 (토벌전은 진도를 올리지 않음)
    if (!window.isBossRush && window.unlockedDungeon <= window.currentDungeonIdx + 1) {
        if (window.currentDungeonIdx < 19) {
            window.unlockedDungeon = window.currentDungeonIdx + 2;
            nextStr = `다음 던전 오픈!`;
        }
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
    window.exitDungeon(); 
};
