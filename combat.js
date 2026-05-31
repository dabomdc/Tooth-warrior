// Version: 8.1.0 - Combat Engine, Dungeon, Enemy, Missile, Rewards, Exit, Retreat Confirm

// --- [ 1. 전투 전역 상태 ] ---
window.dungeonActive = false;
window.dungeonPaused = false;
window.bossDead = true;

window.currentDungeonIdx = 0;
window.currentWave = 0;
window.isBossWave = false;
window.isBossRush = false;
window.isHellMode = false;

window.enemies = [];
window.missiles = [];
window.enemyMissiles = [];
window.spawnTimeouts = [];

window.dungeonGoldEarned = 0;
window.dungeonDiaEarned = 0;
window.dungeonArtifactDropped = null;

window.bossRushStartIdx = 0;
window.bossRushKills = 0;

window.activeSlotIndex = 0;
window.relayTimer = 0;
window.lastCombatTime = 0;


// --- [ 2. 전투 보조 함수 ] ---
function getDungeonMaxIndex() {
    if (typeof window.TOOTH_DATA === 'undefined') return 0;

    const list = window.isHellMode ? window.TOOTH_DATA.hellDungeons : window.TOOTH_DATA.dungeons;
    return Math.max(0, list.length - 1);
}

function getSafeDungeonIdx(idx) {
    return Math.max(0, Math.min(idx, getDungeonMaxIndex()));
}

function getMobSet(idx) {
    if (typeof window.TOOTH_DATA === 'undefined') return null;

    const mobList = window.isHellMode ? window.TOOTH_DATA.hellMobs : window.TOOTH_DATA.dungeonMobs;

    if (!mobList || mobList.length === 0) return null;

    return mobList[idx % mobList.length];
}

function getBattleWorld() {
    return document.getElementById('battle-world');
}

function clearSpawnTimers() {
    if (window.spawnTimeouts && window.spawnTimeouts.length > 0) {
        window.spawnTimeouts.forEach(t => clearTimeout(t));
    }

    window.spawnTimeouts = [];
}

function setBattleText() {
    const nameEl = document.getElementById('current-dungeon-name');
    const waveEl = document.getElementById('wave-info');

    if (typeof window.TOOTH_DATA === 'undefined') return;

    const idx = getSafeDungeonIdx(window.currentDungeonIdx);
    const dungeonList = window.isHellMode ? window.TOOTH_DATA.hellDungeons : window.TOOTH_DATA.dungeons;
    const name = dungeonList[idx] || "알 수 없는 던전";

    if (nameEl) {
        nameEl.innerText = window.isBossRush ? `[토벌전] ${name}` : name;
    }

    if (waveEl) {
        if (window.dungeonPaused) {
            waveEl.innerText = "PAUSED";
        } else if (window.isBossRush) {
            waveEl.innerText = `BOSS RUSH ${window.bossRushKills + 1}/5`;
        } else if (window.isBossWave) {
            waveEl.innerText = `BOSS WAVE`;
        } else {
            waveEl.innerText = `WAVE ${window.currentWave}/5`;
        }
    }
}

function createPlayerElement() {
    const world = getBattleWorld();

    if (!world) return;

    const merc = window.TOOTH_DATA && window.TOOTH_DATA.mercenaries[window.mercenaryIdx] ?
        window.TOOTH_DATA.mercenaries[window.mercenaryIdx] :
        { icon: "👨‍🌾" };

    const player = document.createElement('div');

    player.id = 'player';
    player.innerHTML = `
        <div id="player-icon">${merc.icon}</div>
        <div id="player-hp-wrap">
            <div id="player-hp-bar"></div>
        </div>
    `;

    player.style.position = 'absolute';
    player.style.left = `${window.playerX || 1000}px`;
    player.style.top = `${window.playerY || 1000}px`;
    player.style.transform = 'translate(-50%, -50%)';
    player.style.width = '46px';
    player.style.height = '46px';
    player.style.display = 'flex';
    player.style.alignItems = 'center';
    player.style.justifyContent = 'center';
    player.style.fontSize = '34px';
    player.style.zIndex = '50';
    player.style.pointerEvents = 'none';
    player.style.filter = 'drop-shadow(2px 2px 0 #000)';

    world.appendChild(player);
}

function updateElementPosition(obj) {
    if (!obj || !obj.el) return;

    obj.el.style.left = `${obj.x}px`;
    obj.el.style.top = `${obj.y}px`;
}

function dist(aX, aY, bX, bY) {
    const dx = aX - bX;
    const dy = aY - bY;

    return Math.sqrt(dx * dx + dy * dy);
}

function normalize(dx, dy) {
    const len = Math.sqrt(dx * dx + dy * dy) || 1;

    return {
        x: dx / len,
        y: dy / len
    };
}


// --- [ 3. 던전 시작 ] ---
window.startDungeon = function(idx) {
    if (typeof window.TOOTH_DATA === 'undefined') {
        alert("게임 데이터가 아직 로드되지 않았습니다.");
        return;
    }

    const tab = window.currentDungeonTab || 'normal';

    window.isHellMode = (tab === 'hell' || tab === 'hellboss');
    window.isBossRush = (tab === 'boss' || tab === 'hellboss');

    let safeIdx = getSafeDungeonIdx(idx);

    if (window.isBossRush) {
        const group = Math.floor(idx / 5);
        let goldFee = Math.floor(5000 * Math.pow(2.0, group * 5));
        let diaFee = 5 + ((group * 5) * 5);

        if (window.isHellMode) {
            goldFee *= 10;
            diaFee *= 5;
        }

        if (window.gold < goldFee || window.dia < diaFee) {
            alert(`입장료가 부족합니다!\n필요: ${window.safeFNum ? window.safeFNum(goldFee) : goldFee}G, ♦️${diaFee}`);
            return;
        }

        window.gold -= goldFee;
        window.dia -= diaFee;

        if (typeof window.updateUI === 'function') {
            window.updateUI();
        }
    }

    window.currentDungeonIdx = safeIdx;
    window.bossRushStartIdx = safeIdx;
    window.bossRushKills = 0;

    window.currentWave = 0;
    window.isBossWave = false;

    window.dungeonGoldEarned = 0;
    window.dungeonDiaEarned = 0;
    window.dungeonArtifactDropped = null;

    window.dungeonActive = true;
    window.dungeonPaused = false;
    window.bossDead = false;

    window.enemies = [];
    window.missiles = [];
    window.enemyMissiles = [];
    clearSpawnTimers();

    window.activeSlotIndex = 0;
    window.relayTimer = 0;
    window.lastCombatTime = performance.now();

    window.playerX = 1000;
    window.playerY = 1000;
    window.moveX = 0;
    window.moveY = 0;

    const retreatModal = document.getElementById('retreat-confirm-modal');
    if (retreatModal) retreatModal.style.display = 'none';

    if (typeof window.resetJoystick === 'function') {
        window.resetJoystick();
    }

    const gameContainer = document.getElementById('game-container');
    const battleScreen = document.getElementById('battle-screen');
    const world = getBattleWorld();

    if (gameContainer) gameContainer.style.display = 'none';

    if (battleScreen) {
        battleScreen.style.display = 'block';
    }

    if (world) {
        const mobSet = getMobSet(safeIdx);

        world.className = "";
        world.innerHTML = "";
        world.style.width = '2000px';
        world.style.height = '2000px';

        if (mobSet && mobSet.theme) {
            world.classList.add(mobSet.theme);
        }

        createPlayerElement();
    }

    setBattleText();

    if (typeof window.renderBattleSlots === 'function') {
        window.renderBattleSlots();
    }

    window.spawnWave();

    try {
        if (typeof window.playSfx === 'function') window.playSfx('hit');
    } catch(e) {}
};


// --- [ 4. 웨이브 생성 ] ---
window.spawnWave = function() {
    if (!window.dungeonActive || window.dungeonPaused || window.bossDead) return;

    if (window.isBossRush) {
        window.isBossWave = true;
        setBattleText();

        const bossIdx = getSafeDungeonIdx(window.bossRushStartIdx + window.bossRushKills);
        window.spawnEnemy(true, bossIdx);

        return;
    }

    if (window.currentWave < 5) {
        window.currentWave++;
        window.isBossWave = false;

        setBattleText();

        const count = 5 + (window.currentWave * 2) + Math.floor(window.currentDungeonIdx / 2);

        for (let i = 0; i < count; i++) {
            const t = setTimeout(() => {
                if (window.dungeonActive && !window.dungeonPaused && !window.bossDead) {
                    window.spawnEnemy(false, window.currentDungeonIdx);
                }
            }, i * 250);

            window.spawnTimeouts.push(t);
        }
    } else {
        window.isBossWave = true;
        setBattleText();

        const t = setTimeout(() => {
            if (window.dungeonActive && !window.dungeonPaused && !window.bossDead) {
                window.spawnEnemy(true, window.currentDungeonIdx);
            }
        }, 800);

        window.spawnTimeouts.push(t);
    }
};


// --- [ 5. 적 생성 ] ---
window.spawnEnemy = function(isBoss, sourceIdx) {
    const world = getBattleWorld();

    if (!world || typeof window.TOOTH_DATA === 'undefined') return;

    const dungeonIdx = getSafeDungeonIdx(sourceIdx);
    const mobSet = getMobSet(dungeonIdx);

    if (!mobSet) return;

    const angle = Math.random() * Math.PI * 2;
    const distanceFromPlayer = isBoss ? 550 : 450 + Math.random() * 350;

    let x = (window.playerX || 1000) + Math.cos(angle) * distanceFromPlayer;
    let y = (window.playerY || 1000) + Math.sin(angle) * distanceFromPlayer;

    x = Math.max(80, Math.min(1920, x));
    y = Math.max(80, Math.min(1920, y));

    const baseHp = Math.floor(100 * Math.pow(window.isHellMode ? 2.5 : 2.2, dungeonIdx));

    let maxHp = isBoss ? baseHp * 18 : Math.max(20, Math.floor(baseHp * 0.45));

    if (window.isHellMode) maxHp *= 50;
    if (window.isBossRush && isBoss) maxHp *= 1.5;

    const speed = isBoss ? 0.55 + dungeonIdx * 0.015 : 0.75 + dungeonIdx * 0.02;
    const damage = Math.max(3, Math.floor((dungeonIdx + 1) * (window.isHellMode ? 6 : 2.5) * (isBoss ? 4 : 1)));

    const el = document.createElement('div');

    el.className = isBoss ? 'enemy boss-enemy' : 'enemy';

    const icon = isBoss ? mobSet.boss : mobSet.mobs[Math.floor(Math.random() * mobSet.mobs.length)];

    el.innerHTML = `
        <div class="enemy-icon">${icon}</div>
        <div class="enemy-hp-wrap">
            <div class="enemy-hp-bar"></div>
        </div>
    `;

    el.style.position = 'absolute';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = 'translate(-50%, -50%)';
    el.style.width = isBoss ? '90px' : '42px';
    el.style.height = isBoss ? '90px' : '42px';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.fontSize = isBoss ? '64px' : '32px';
    el.style.zIndex = isBoss ? '40' : '30';
    el.style.pointerEvents = 'none';
    el.style.filter = isBoss ? 'drop-shadow(0 0 10px #e74c3c)' : 'drop-shadow(2px 2px 0 #000)';

    world.appendChild(el);

    const enemy = {
        el,
        x,
        y,
        hp: maxHp,
        maxHp,
        speed,
        damage,
        isBoss,
        dungeonIdx,
        dead: false,
        lastBodyHit: 0,
        lastShot: performance.now() + Math.random() * 1000,
        shootDelay: isBoss ? 1300 : 2600 + Math.random() * 1400
    };

    window.enemies.push(enemy);
};


// --- [ 6. 전투 업데이트 ] ---
window.updateCombat = function() {
    if (!window.dungeonActive || window.dungeonPaused || window.bossDead) return;

    const now = performance.now();
    let dt = now - (window.lastCombatTime || now);

    window.lastCombatTime = now;

    if (dt > 50) dt = 50;

    const frameScale = dt / 16.67;

    updateEnemies(now, frameScale);
    updatePlayerAutoShoot(now);
    updatePlayerMissiles(frameScale);
    updateEnemyMissiles(frameScale);
};


// --- [ 7. 적 이동 / 충돌 / 적 공격 ] ---
function updateEnemies(now, frameScale) {
    const px = window.playerX || 1000;
    const py = window.playerY || 1000;

    for (let i = window.enemies.length - 1; i >= 0; i--) {
        const en = window.enemies[i];

        if (!en || en.dead) continue;

        const dx = px - en.x;
        const dy = py - en.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;

        const stopRange = en.isBoss ? 70 : 38;

        if (d > stopRange) {
            en.x += (dx / d) * en.speed * frameScale;
            en.y += (dy / d) * en.speed * frameScale;

            updateElementPosition(en);
        }

        const bodyRange = en.isBoss ? 66 : 34;

        if (d < bodyRange && now - en.lastBodyHit > 700) {
            en.lastBodyHit = now;

            if (typeof window.takeDamage === 'function') {
                window.takeDamage(en.damage);
            }
        }

        if (now - en.lastShot > en.shootDelay) {
            en.lastShot = now;
            enemyShoot(en);
        }
    }
}

function enemyShoot(en) {
    if (!en || en.dead) return;

    const world = getBattleWorld();
    if (!world) return;

    const px = window.playerX || 1000;
    const py = window.playerY || 1000;

    const dir = normalize(px - en.x, py - en.y);

    const el = document.createElement('div');

    el.className = 'enemy-missile';
    el.innerText = en.isBoss ? '🔴' : '🟠';
    el.style.position = 'absolute';
    el.style.left = `${en.x}px`;
    el.style.top = `${en.y}px`;
    el.style.transform = 'translate(-50%, -50%)';
    el.style.fontSize = en.isBoss ? '18px' : '14px';
    el.style.zIndex = '35';
    el.style.pointerEvents = 'none';

    world.appendChild(el);

    window.enemyMissiles.push({
        el,
        x: en.x,
        y: en.y,
        vx: dir.x * (en.isBoss ? 4.0 : 3.3),
        vy: dir.y * (en.isBoss ? 4.0 : 3.3),
        dmg: Math.ceil(en.damage * (en.isBoss ? 1.2 : 0.8)),
        traveled: 0,
        range: en.isBoss ? 750 : 520
    });
}


// --- [ 8. 플레이어 자동 공격 ] ---
function updatePlayerAutoShoot(now) {
    const cdReductionPercent = Math.min(90, (window.globalUpgrades && window.globalUpgrades.cd ? window.globalUpgrades.cd : 0) * 2);
    const relayDelay = Math.max(45, 220 * (1 - cdReductionPercent / 100));

    if (now - window.relayTimer < relayDelay) return;

    window.relayTimer = now;

    for (let attempt = 0; attempt < 8; attempt++) {
        const slotIdx = window.activeSlotIndex % 8;

        window.activeSlotIndex = (window.activeSlotIndex + 1) % 8;

        if (!window.inventory || !window.inventory[slotIdx] || window.inventory[slotIdx] <= 0) {
            continue;
        }

        const target = findNearestEnemy();

        if (target) {
            playerShoot(slotIdx, target);
            return;
        }
    }
}

function findNearestEnemy() {
    const px = window.playerX || 1000;
    const py = window.playerY || 1000;

    const range = 300 + ((window.globalUpgrades && window.globalUpgrades.rng ? window.globalUpgrades.rng : 0) * 20);

    let best = null;
    let bestD = Infinity;

    window.enemies.forEach(en => {
        if (!en || en.dead) return;

        const d = dist(px, py, en.x, en.y);

        if (d <= range && d < bestD) {
            bestD = d;
            best = en;
        }
    });

    return best;
}

function playerShoot(slotIdx, target) {
    if (!target || target.dead) return;

    const lv = window.inventory[slotIdx];

    if (!lv || lv <= 0) return;

    const world = getBattleWorld();

    if (!world) return;

    const px = window.playerX || 1000;
    const py = window.playerY || 1000;

    let base = typeof window.getAtk === 'function' ? window.getAtk(lv) : 10;

    let refineMul = 1;

    if (window.slotUpgrades && window.slotUpgrades[slotIdx]) {
        refineMul += (window.slotUpgrades[slotIdx].atk || 0) * 0.1;
    }

    let trainAtkMul = 1 + ((window.trainingLevels && window.trainingLevels.atk ? window.trainingLevels.atk : 0) * 0.1);

    let mercMul = 1;

    if (window.TOOTH_DATA && window.TOOTH_DATA.mercenaries[window.mercenaryIdx]) {
        mercMul = window.TOOTH_DATA.mercenaries[window.mercenaryIdx].atkMul || 1;
    }

    if (window.highestToothLevel >= 16) {
        mercMul *= 2;
    }

    let damage = base * refineMul * trainAtkMul * mercMul;

    let critLv = window.trainingLevels && window.trainingLevels.crit ? window.trainingLevels.crit : 0;
    let critChance = 0.05 + (critLv * 0.02);
    let critMul = 2.0 + (critLv * 0.2);
    let isCrit = Math.random() < critChance;

    if (isCrit) {
        damage *= critMul;
    }

    damage = Math.max(1, Math.floor(damage));

    const dir = normalize(target.x - px, target.y - py);

    const el = document.createElement('div');

    el.className = isCrit ? 'missile crit-missile' : 'missile';

    const emoji = typeof window.getSimpleToothEmoji === 'function'
        ? window.getSimpleToothEmoji(lv)
        : "🦷";

    el.innerText = emoji;
    el.style.position = 'absolute';
    el.style.left = `${px}px`;
    el.style.top = `${py}px`;
    el.style.transform = 'translate(-50%, -50%)';
    el.style.fontSize = '20px';
    el.style.zIndex = '45';
    el.style.pointerEvents = 'none';
    el.style.filter = isCrit ? 'drop-shadow(0 0 8px #f1c40f)' : 'drop-shadow(1px 1px 0 #000)';

    world.appendChild(el);

    const missileRange = 300 + ((window.globalUpgrades && window.globalUpgrades.rng ? window.globalUpgrades.rng : 0) * 20) + 80;

    window.missiles.push({
        el,
        x: px,
        y: py,
        vx: dir.x * 9,
        vy: dir.y * 9,
        dmg: damage,
        slotIdx,
        target,
        traveled: 0,
        range: missileRange,
        isCrit
    });

    flashSlot(slotIdx);

    try {
        if (typeof window.playSfx === 'function') window.playSfx('attack');
    } catch(e) {}
}

function flashSlot(slotIdx) {
    const slot = document.querySelector(`#war-weapon-slots .battle-slot[data-slot="${slotIdx}"]`);

    if (!slot) return;

    slot.classList.add('slot-fire');

    setTimeout(() => {
        slot.classList.remove('slot-fire');
    }, 80);
}


// --- [ 9. 플레이어 미사일 업데이트 ] ---
function updatePlayerMissiles(frameScale) {
    for (let i = window.missiles.length - 1; i >= 0; i--) {
        const m = window.missiles[i];

        if (!m) continue;

        m.x += m.vx * frameScale;
        m.y += m.vy * frameScale;
        m.traveled += Math.sqrt(m.vx * m.vx + m.vy * m.vy) * frameScale;

        if (m.el) {
            m.el.style.left = `${m.x}px`;
            m.el.style.top = `${m.y}px`;
        }

        let hitEnemy = null;

        for (let j = 0; j < window.enemies.length; j++) {
            const en = window.enemies[j];

            if (!en || en.dead) continue;

            const hitRange = en.isBoss ? 50 : 26;

            if (dist(m.x, m.y, en.x, en.y) < hitRange) {
                hitEnemy = en;
                break;
            }
        }

        if (hitEnemy) {
            damageEnemy(hitEnemy, m.dmg, m.isCrit);
            applySplashDamage(hitEnemy, m.dmg);

            createExplosion(m.x, m.y, m.isCrit);

            removeMissile(i);
            continue;
        }

        if (m.traveled > m.range || m.x < -50 || m.y < -50 || m.x > 2050 || m.y > 2050) {
            removeMissile(i);
        }
    }
}

function removeMissile(index) {
    const m = window.missiles[index];

    if (m && m.el && m.el.parentNode) {
        m.el.remove();
    }

    window.missiles.splice(index, 1);
}


// --- [ 10. 적 미사일 업데이트 ] ---
function updateEnemyMissiles(frameScale) {
    const px = window.playerX || 1000;
    const py = window.playerY || 1000;

    for (let i = window.enemyMissiles.length - 1; i >= 0; i--) {
        const m = window.enemyMissiles[i];

        if (!m) continue;

        m.x += m.vx * frameScale;
        m.y += m.vy * frameScale;
        m.traveled += Math.sqrt(m.vx * m.vx + m.vy * m.vy) * frameScale;

        if (m.el) {
            m.el.style.left = `${m.x}px`;
            m.el.style.top = `${m.y}px`;
        }

        if (dist(m.x, m.y, px, py) < 28) {
            if (typeof window.takeDamage === 'function') {
                window.takeDamage(m.dmg);
            }

            removeEnemyMissile(i);
            continue;
        }

        if (m.traveled > m.range || m.x < -50 || m.y < -50 || m.x > 2050 || m.y > 2050) {
            removeEnemyMissile(i);
        }
    }
}

function removeEnemyMissile(index) {
    const m = window.enemyMissiles[index];

    if (m && m.el && m.el.parentNode) {
        m.el.remove();
    }

    window.enemyMissiles.splice(index, 1);
}


// --- [ 11. 데미지 처리 ] ---
function damageEnemy(en, amount, isCrit) {
    if (!en || en.dead) return;

    en.hp -= amount;

    const hpBar = en.el ? en.el.querySelector('.enemy-hp-bar') : null;

    if (hpBar) {
        const pct = Math.max(0, (en.hp / en.maxHp) * 100);
        hpBar.style.width = `${pct}%`;
    }

    showFloatingText(en.x, en.y - 25, `${isCrit ? 'CRIT ' : ''}-${window.safeFNum ? window.safeFNum(amount) : amount}`, isCrit ? '#f1c40f' : '#fff');

    if (en.hp <= 0) {
        processEnemyDeath(en);
    }
}

function applySplashDamage(centerEnemy, baseDamage) {
    if (window.highestToothLevel < 7) return;

    const splashDmgLv = window.trainingLevels && window.trainingLevels.splashDmg ? window.trainingLevels.splashDmg : 0;
    const splashRangeLv = window.trainingLevels && window.trainingLevels.splashRange ? window.trainingLevels.splashRange : 0;

    const ratio = 0.20 + (splashDmgLv * 0.05);
    const range = 50 + (splashRangeLv * 10);

    const splashDamage = Math.floor(baseDamage * ratio);

    if (splashDamage <= 0) return;

    window.enemies.forEach(en => {
        if (!en || en.dead || en === centerEnemy) return;

        if (dist(centerEnemy.x, centerEnemy.y, en.x, en.y) <= range) {
            damageEnemy(en, splashDamage, false);
        }
    });
}


// --- [ 12. 적 사망 / 보상 / 클리어 ] ---
function processEnemyDeath(en) {
    if (!en || en.dead) return;

    en.dead = true;

    const idx = window.enemies.indexOf(en);

    if (idx >= 0) {
        window.enemies.splice(idx, 1);
    }

    if (en.el && en.el.parentNode) {
        en.el.remove();
    }

    createExplosion(en.x, en.y, en.isBoss);

    const rewardMul = window.highestToothLevel >= 22 ? 5 : 1;

    let goldReward = Math.floor((en.dungeonIdx + 1) * 50 * Math.pow(1.75, en.dungeonIdx));

    if (en.isBoss) goldReward *= 20;
    if (window.isHellMode) goldReward *= 15;
    if (window.isBossRush) goldReward *= 2;

    goldReward *= rewardMul;

    window.gold += goldReward;
    window.dungeonGoldEarned += goldReward;

    if (en.isBoss) {
        let diaReward = 1 + Math.floor(en.dungeonIdx / 2);

        if (window.highestToothLevel >= 13) {
            diaReward *= 2;
        }

        if (window.isHellMode) {
            diaReward *= 3;
        }

        if (window.isBossRush) {
            diaReward *= 2;
        }

        diaReward *= rewardMul;

        window.dia += diaReward;
        window.dungeonDiaEarned += diaReward;

        tryDropArtifact(en.dungeonIdx);

        if (window.isBossRush) {
            window.bossRushKills++;

            if (window.bossRushKills >= 5) {
                window.dungeonActive = false;
                window.bossDead = true;
                window.dungeonPaused = false;

                setTimeout(() => {
                    if (typeof window.showResultModal === 'function') {
                        window.showResultModal();
                    }
                }, 700);
            } else {
                setBattleText();

                const t = setTimeout(() => {
                    if (window.dungeonActive && !window.dungeonPaused && !window.bossDead) {
                        window.spawnWave();
                    }
                }, 900);

                window.spawnTimeouts.push(t);
            }
        } else {
            window.dungeonActive = false;
            window.bossDead = true;
            window.dungeonPaused = false;

            setTimeout(() => {
                if (typeof window.showResultModal === 'function') {
                    window.showResultModal();
                }
            }, 700);
        }
    } else {
        checkWaveClear();
    }

    if (typeof window.updateUI === 'function') {
        window.updateUI();
    }
}

window.processEnemyDeath = processEnemyDeath;

function tryDropArtifact(dungeonIdx) {
    if (typeof window.TOOTH_DATA === 'undefined') return;

    if (!window.artifactCounts) {
        window.artifactCounts = new Array(30).fill(0);
    }

    const artifactIdx = window.isHellMode ? dungeonIdx + 20 : dungeonIdx;

    if (!window.TOOTH_DATA.artifacts[artifactIdx]) return;

    if (window.artifactCounts[artifactIdx] >= 1) return;

    const dropChance = window.isBossRush ? 0.15 : 0.35;

    if (Math.random() < dropChance) {
        window.artifactCounts[artifactIdx] = 1;

        const art = window.TOOTH_DATA.artifacts[artifactIdx];

        window.dungeonArtifactDropped = {
            count: 1,
            icon: art.icon,
            name: art.name
        };
    }
}

function checkWaveClear() {
    if (!window.dungeonActive || window.dungeonPaused || window.bossDead) return;

    if (window.enemies.length === 0 && !window.isBossWave) {
        const t = setTimeout(() => {
            if (window.dungeonActive && !window.dungeonPaused && !window.bossDead) {
                window.spawnWave();
            }
        }, 800);

        window.spawnTimeouts.push(t);
    }
}

window.checkWaveClear = checkWaveClear;


// --- [ 13. 시각 효과 ] ---
function createExplosion(x, y, big) {
    const world = getBattleWorld();

    if (!world) return;

    const el = document.createElement('div');

    el.className = 'explosion';
    el.innerText = big ? '💥' : '✨';
    el.style.position = 'absolute';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = 'translate(-50%, -50%)';
    el.style.fontSize = big ? '48px' : '28px';
    el.style.zIndex = '80';
    el.style.pointerEvents = 'none';
    el.style.animation = 'popFade 0.45s ease-out forwards';

    world.appendChild(el);

    setTimeout(() => {
        if (el && el.parentNode) el.remove();
    }, 500);
}

window.createExplosion = createExplosion;

function showFloatingText(x, y, text, color) {
    const world = getBattleWorld();

    if (!world) return;

    const el = document.createElement('div');

    el.className = 'floating-damage';
    el.innerText = text;
    el.style.position = 'absolute';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = 'translate(-50%, -50%)';
    el.style.color = color || '#fff';
    el.style.fontSize = '12px';
    el.style.fontWeight = 'bold';
    el.style.zIndex = '90';
    el.style.pointerEvents = 'none';
    el.style.textShadow = '2px 2px 0 #000';
    el.style.animation = 'floatUp 0.6s ease-out forwards';

    world.appendChild(el);

    setTimeout(() => {
        if (el && el.parentNode) el.remove();
    }, 650);
}

window.showFloatingText = showFloatingText;


// --- [ 14. 후퇴 확인 ] ---
window.requestRetreat = function() {
    if (!window.dungeonActive || window.bossDead) {
        if (typeof window.exitDungeon === 'function') {
            window.exitDungeon();
        }
        return;
    }

    window.dungeonPaused = true;
    window.moveX = 0;
    window.moveY = 0;

    if (typeof window.resetJoystick === 'function') {
        window.resetJoystick();
    }

    setBattleText();

    const modal = document.getElementById('retreat-confirm-modal');

    if (modal) {
        modal.style.display = 'flex';
    }
};

window.cancelRetreat = function() {
    const modal = document.getElementById('retreat-confirm-modal');

    if (modal) {
        modal.style.display = 'none';
    }

    if (window.dungeonActive && !window.bossDead) {
        window.dungeonPaused = false;
        window.lastCombatTime = performance.now();
    }

    setBattleText();
};

window.confirmRetreat = function() {
    const modal = document.getElementById('retreat-confirm-modal');

    if (modal) {
        modal.style.display = 'none';
    }

    window.dungeonPaused = false;

    if (typeof window.exitDungeon === 'function') {
        window.exitDungeon();
    }
};


// --- [ 15. 던전 종료 / 후퇴 ] ---
window.exitDungeon = function() {
    window.dungeonActive = false;
    window.dungeonPaused = false;
    window.bossDead = true;

    clearSpawnTimers();

    const retreatModal = document.getElementById('retreat-confirm-modal');
    if (retreatModal) retreatModal.style.display = 'none';

    const battleScreen = document.getElementById('battle-screen');
    const gameContainer = document.getElementById('game-container');
    const world = getBattleWorld();

    window.enemies.forEach(en => {
        if (en && en.el && en.el.parentNode) en.el.remove();
    });

    window.missiles.forEach(m => {
        if (m && m.el && m.el.parentNode) m.el.remove();
    });

    window.enemyMissiles.forEach(m => {
        if (m && m.el && m.el.parentNode) m.el.remove();
    });

    window.enemies = [];
    window.missiles = [];
    window.enemyMissiles = [];

    if (world) {
        world.className = "";
        world.innerHTML = "";
        world.style.transform = "translate(0px, 0px)";
    }

    if (battleScreen) {
        battleScreen.style.display = 'none';
    }

    if (gameContainer) {
        gameContainer.style.display = 'flex';
    }

    window.moveX = 0;
    window.moveY = 0;

    if (typeof window.resetJoystick === 'function') {
        window.resetJoystick();
    }

    if (typeof window.switchView === 'function') {
        window.switchView(window.currentView || 'war');
    }

    if (typeof window.renderInventory === 'function') {
        window.renderInventory();
    }

    if (typeof window.renderDungeonList === 'function') {
        window.renderDungeonList();
    }

    if (typeof window.saveGame === 'function') {
        window.saveGame();
    }
};
