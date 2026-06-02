// Version: 8.0.0 - Combat Engine / Dungeon / Reward / Retreat Fixed

// =========================
// 전투 상태값
// =========================
window.dungeonActive = false;
window.bossDead = false;

window.currentDungeonIdx = 0;
window.currentWave = 1;
window.isBossWave = false;

window.dungeonGoldEarned = 0;
window.dungeonDiaEarned = 0;
window.dungeonArtifactDropped = null;

let enemies = [];
let missiles = [];
let enemyMissiles = [];
let spawnTimeouts = [];

let missilePool = [];
let enemyMissilePool = [];

let activeSlotIndex = 0;
let slotFireCds = new Array(8).fill(0);

const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 2000;

// =========================
// 안전 유틸
// =========================
function cNum(value) {
    if (typeof fNum === "function") return fNum(value);
    return Math.floor(Number(value) || 0);
}

function cGetAtk(lv) {
    if (typeof getAtk === "function") return getAtk(lv);
    return 10;
}

function cGetIcon(lv) {
    if (typeof getToothIcon === "function") return getToothIcon(lv);
    return "🦷";
}

function cDistance(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
}

function cClamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function clearSpawnTimeouts() {
    spawnTimeouts.forEach((t) => clearTimeout(t));
    spawnTimeouts = [];
}

function getDungeonData() {
    if (typeof TOOTH_DATA === "undefined") return [];

    return window.isHellMode ? TOOTH_DATA.hellDungeons : TOOTH_DATA.dungeons;
}

function getMobData(idx) {
    if (typeof TOOTH_DATA === "undefined") return null;

    const list = window.isHellMode ? TOOTH_DATA.hellMobs : TOOTH_DATA.dungeonMobs;
    if (!list || list.length === 0) return null;

    return list[Math.min(idx, list.length - 1)] || list[0];
}

function getBossRushMaxWaves() {
    const data = getDungeonData();
    const remain = data.length - window.currentDungeonIdx;

    return Math.max(1, Math.min(5, remain));
}

// =========================
// 던전 시작
// =========================
window.startDungeon = function(idx) {
    idx = Number(idx) || 0;

    if (typeof TOOTH_DATA === "undefined") {
        alert("던전 데이터를 불러오지 못했습니다.");
        return;
    }

    const tab = window.currentDungeonTab || "normal";

    window.isHellMode = tab === "hell" || tab === "hellboss";
    window.isBossRush = tab === "boss" || tab === "hellboss";
    window.currentDungeonIdx = idx;

    const dungeonData = getDungeonData();

    if (!dungeonData[idx]) {
        alert("존재하지 않는 던전입니다.");
        return;
    }

    if (window.isHellMode && window.unlockedDungeon <= 20) {
        alert("아직 HELL 던전이 열리지 않았습니다.");
        return;
    }

    const unlocked = window.isHellMode ? window.unlockedHellDungeon : window.unlockedDungeon;

    if (!window.isBossRush && idx >= unlocked) {
        alert("아직 열리지 않은 던전입니다.");
        return;
    }

    if (window.isBossRush) {
        let goldFee = Math.floor(5000 * Math.pow(2.0, idx));
        let diaFee = 5 + (idx * 5);

        if (window.isHellMode) {
            goldFee *= 10;
            diaFee *= 5;
        }

        if (window.gold < goldFee || window.dia < diaFee) {
            alert(`입장료가 부족합니다.\n필요: ${cNum(goldFee)}G, ♦️${diaFee}`);
            return;
        }

        window.gold -= goldFee;
        window.dia -= diaFee;
    }

    try {
        if (typeof playSfx === "function") playSfx("unlock");
    } catch (e) {}

    window.dungeonGoldEarned = 0;
    window.dungeonDiaEarned = 0;
    window.dungeonArtifactDropped = null;

    window.dungeonActive = true;
    window.bossDead = false;
    window.currentWave = 1;
    window.isBossWave = window.isBossRush;

    activeSlotIndex = 0;
    slotFireCds = new Array(8).fill(0);

    clearSpawnTimeouts();
    clearBattleObjects();

    window.playerX = WORLD_WIDTH / 2;
    window.playerY = WORLD_HEIGHT / 2;
    window.moveX = 0;
    window.moveY = 0;

    const gameContainer = document.getElementById("game-container");
    const battleScreen = document.getElementById("battle-screen");
    const worldDiv = document.getElementById("battle-world");

    if (gameContainer) gameContainer.style.display = "none";

    if (battleScreen) {
        battleScreen.style.display = "block";
        battleScreen.style.boxShadow = window.isHellMode ? "inset 0 0 100px #ff0000" : "";
    }

    if (worldDiv) {
        worldDiv.style.width = WORLD_WIDTH + "px";
        worldDiv.style.height = WORLD_HEIGHT + "px";
        worldDiv.className = "";

        const mobData = getMobData(idx);
        if (mobData && mobData.theme) {
            worldDiv.classList.add(mobData.theme);
        } else {
            worldDiv.classList.add(window.isHellMode ? "bg-hell" : "bg-stone");
        }

        const merc = TOOTH_DATA.mercenaries[window.mercenaryIdx] || TOOTH_DATA.mercenaries[0];
        const mercIcon = merc ? merc.icon : "🦷";

        worldDiv.innerHTML = `
            <div id="player" style="left:${window.playerX}px; top:${window.playerY}px;">
                <div id="player-hp-bar-bg">
                    <div id="player-hp-bar-fill"></div>
                </div>
                <div>${mercIcon}</div>
            </div>
        `;
    }

    const nameEl = document.getElementById("current-dungeon-name");
    if (nameEl) {
        const prefix = window.isBossRush ? "[토벌전] " : "";
        nameEl.innerText = `${prefix}${dungeonData[idx]}`;
    }

    if (typeof window.renderBattleSlots === "function") {
        window.renderBattleSlots();
    }

    if (typeof window.updateUI === "function") {
        window.updateUI();
    }

    if (typeof window.saveGame === "function") {
        window.saveGame();
    }

    const t = setTimeout(() => {
        spawnWave();
    }, 700);

    spawnTimeouts.push(t);
};

// =========================
// 웨이브 생성
// =========================
function spawnWave() {
    if (!window.dungeonActive || window.bossDead) return;

    const waveInfo = document.getElementById("wave-info");

    if (window.isBossRush) {
        const maxWaves = getBossRushMaxWaves();

        if (waveInfo) {
            waveInfo.innerText = `🔥 BOSS RUSH ${window.currentWave}/${maxWaves} 🔥`;
        }

        const t = setTimeout(() => {
            spawnEnemy(true);
        }, 500);

        spawnTimeouts.push(t);

        return;
    }

    if (window.isBossWave) {
        if (waveInfo) waveInfo.innerText = "👑 BOSS WAVE 👑";

        const t = setTimeout(() => {
            spawnEnemy(true);
        }, 700);

        spawnTimeouts.push(t);

        return;
    }

    if (waveInfo) {
        waveInfo.innerText = `WAVE ${window.currentWave}/5`;
    }

    const count = 5 + (window.currentWave * 2);

    for (let i = 0; i < count; i++) {
        const t = setTimeout(() => {
            spawnEnemy(false);
        }, i * 500);

        spawnTimeouts.push(t);
    }
}

window.spawnWave = spawnWave;

// =========================
// 적 생성
// =========================
function spawnEnemy(isBoss) {
    if (!window.dungeonActive || window.bossDead) return;

    const worldDiv = document.getElementById("battle-world");
    if (!worldDiv) return;

    let safeIdx = Number(window.currentDungeonIdx) || 0;

    if (window.isBossRush) {
        safeIdx = window.currentDungeonIdx + window.currentWave - 1;
    }

    const dungeonData = getDungeonData();
    safeIdx = cClamp(safeIdx, 0, Math.max(0, dungeonData.length - 1));

    const mobData = getMobData(safeIdx);
    const mobs = mobData && mobData.mobs ? mobData.mobs : ["👾"];
    const icon = isBoss ? (mobData && mobData.boss ? mobData.boss : "👑") : mobs[Math.floor(Math.random() * mobs.length)];

    const angle = Math.random() * Math.PI * 2;
    const spawnDist = 600;

    const px = window.playerX || WORLD_WIDTH / 2;
    const py = window.playerY || WORLD_HEIGHT / 2;

    const x = cClamp(px + Math.cos(angle) * spawnDist, 60, WORLD_WIDTH - 60);
    const y = cClamp(py + Math.sin(angle) * spawnDist, 60, WORLD_HEIGHT - 60);

    let baseHp = Math.floor(100 * Math.pow(window.isHellMode ? 2.5 : 2.2, safeIdx));

    if (window.isHellMode) baseHp *= 50;

    let hp = baseHp;
    let speed = 2.5 + (safeIdx * 0.1);
    let shootInterval = 300;
    let damage = 10 + (safeIdx * 5);

    if (window.isHellMode) {
        damage *= 10;
        shootInterval = Math.floor(shootInterval / 2);
    }

    if (isBoss) {
        let bossMul = 30;

        if (window.isBossRush) {
            bossMul = 20 * Math.pow(1.5, window.currentWave);
        }

        hp = Math.floor(baseHp * bossMul);
        speed = 1.5 + (safeIdx * 0.04);
        shootInterval = window.isHellMode ? 60 : 120;
        damage *= 2.5;
    }

    const el = document.createElement("div");
    el.className = `battle-enemy ${isBoss ? "boss" : ""}`;
    el.style.left = x + "px";
    el.style.top = y + "px";

    const hpWidth = isBoss ? 90 : 40;

    el.innerHTML = `
        <div class="hp-bar-bg" style="width:${hpWidth}px;">
            <div class="hp-bar-fill" style="width:100%;"></div>
        </div>
        <div>${icon}</div>
    `;

    worldDiv.appendChild(el);

    const enemy = {
        x,
        y,
        hp,
        maxHp: hp,
        speed,
        damage,
        isBoss,
        icon,
        el,
        shootTimer: Math.floor(Math.random() * 60),
        shootInterval,
        touchTimer: 0,
        phase: 1
    };

    enemies.push(enemy);
}

window.spawnEnemy = spawnEnemy;

// =========================
// 전투 업데이트
// battle.js에서 60FPS로 호출
// =========================
window.updateCombat = function() {
    if (!window.dungeonActive || window.bossDead) return;

    updateEnemies();
    updatePlayerWeapons();
    updateMissiles();
    updateEnemyMissiles();
};

// =========================
// 적 이동 / 공격
// =========================
function updateEnemies() {
    const px = window.playerX || WORLD_WIDTH / 2;
    const py = window.playerY || WORLD_HEIGHT / 2;

    enemies.forEach((en) => {
        if (!en || !en.el) return;

        const dx = px - en.x;
        const dy = py - en.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        let shouldMove = true;

        if (en.isBoss && dist < 280) {
            shouldMove = false;
        }

        if (shouldMove) {
            en.x += (dx / dist) * en.speed;
            en.y += (dy / dist) * en.speed;
        }

        en.x = cClamp(en.x, 30, WORLD_WIDTH - 30);
        en.y = cClamp(en.y, 30, WORLD_HEIGHT - 30);

        en.el.style.left = en.x + "px";
        en.el.style.top = en.y + "px";

        if (en.touchTimer > 0) en.touchTimer--;

        const hitRange = en.isBoss ? 85 : 35;

        if (dist < hitRange && en.touchTimer <= 0) {
            en.touchTimer = 45;

            if (typeof window.takeDamage === "function") {
                window.takeDamage(en.damage);
            }
        }

        en.shootTimer--;

        if (en.shootTimer <= 0) {
            en.shootTimer = Math.max(25, en.shootInterval);

            const angle = Math.atan2(py - en.y, px - en.x);
            enemyShoot(en.x, en.y, angle, en.isBoss ? "🔥" : "•");
        }
    });
}

// =========================
// 플레이어 무기 발사
// =========================
function updatePlayerWeapons() {
    if (!Array.isArray(window.inventory)) return;

    const slotCount = window.TOP_ATTACK_SLOT_COUNT || 8;

    for (let i = 0; i < slotCount; i++) {
        if (slotFireCds[i] > 0) slotFireCds[i]--;
    }

    const cdReduction = Math.min(90, (window.globalUpgrades && window.globalUpgrades.cd ? window.globalUpgrades.cd : 0) * 2);
    const baseCd = Math.max(6, Math.floor(60 * (1 - cdReduction / 100)));

    const range = Math.min(WORLD_WIDTH / 2, 300 + ((window.globalUpgrades && window.globalUpgrades.rng ? window.globalUpgrades.rng : 0) * 20));

    for (let loop = 0; loop < slotCount; loop++) {
        const slotIdx = activeSlotIndex;
        activeSlotIndex = (activeSlotIndex + 1) % slotCount;

        const lv = Number(window.inventory[slotIdx]) || 0;

        if (lv <= 0) {
            updateSlotCooldownOverlay(slotIdx, 0);
            continue;
        }

        if (slotFireCds[slotIdx] > 0) {
            updateSlotCooldownOverlay(slotIdx, slotFireCds[slotIdx] / baseCd);
            continue;
        }

        const target = findNearestEnemy(range);

        if (!target) {
            updateSlotCooldownOverlay(slotIdx, 0);
            continue;
        }

        playerShoot(slotIdx, target);

        slotFireCds[slotIdx] = baseCd;
        updateSlotCooldownOverlay(slotIdx, 1);
    }
}

function updateSlotCooldownOverlay(slotIdx, ratio) {
    const slot = document.getElementById(`war-slot-${slotIdx}`);
    if (!slot) return;

    const overlay = slot.querySelector(".cd-overlay");
    if (!overlay) return;

    const percent = Math.max(0, Math.min(100, ratio * 100));
    overlay.style.height = percent + "%";
}

function findNearestEnemy(range) {
    if (!enemies.length) return null;

    const px = window.playerX || WORLD_WIDTH / 2;
    const py = window.playerY || WORLD_HEIGHT / 2;

    let nearest = null;
    let bestDist = Infinity;

    enemies.forEach((en) => {
        if (!en || !en.el) return;

        const d = cDistance(px, py, en.x, en.y);

        if (d < bestDist && d <= range) {
            bestDist = d;
            nearest = en;
        }
    });

    return nearest;
}

// =========================
// 플레이어 미사일
// =========================
function getMissileFromPool() {
    const worldDiv = document.getElementById("battle-world");

    if (!worldDiv) return null;

    let m = missilePool.find((item) => !item.active);

    if (!m) {
        const el = document.createElement("div");
        el.className = "missile";
        el.style.display = "none";
        worldDiv.appendChild(el);

        m = {
            active: false,
            el
        };

        missilePool.push(m);
    }

    return m;
}

function playerShoot(slotIdx, target) {
    const lv = Number(window.inventory[slotIdx]) || 0;

    if (lv <= 0 || !target) return;

    try {
        if (typeof playSfx === "function") playSfx("attack");
    } catch (e) {}

    const m = getMissileFromPool();
    if (!m) return;

    const px = window.playerX || WORLD_WIDTH / 2;
    const py = window.playerY || WORLD_HEIGHT / 2;

    const angle = Math.atan2(target.y - py, target.x - px);

    const refineMul = 1 + (((window.slotUpgrades && window.slotUpgrades[slotIdx] && window.slotUpgrades[slotIdx].atk) || 0) * 0.1);

    let dmg = cGetAtk(lv) * refineMul;

    const merc = typeof TOOTH_DATA !== "undefined" ? TOOTH_DATA.mercenaries[window.mercenaryIdx] : null;

    if (merc) dmg *= merc.atkMul;

    if (window.highestToothLevel >= 16) dmg *= 2;

    if (window.trainingLevels && window.trainingLevels.atk) {
        dmg *= 1 + (window.trainingLevels.atk * 0.1);
    }

    let isCrit = false;

    if (window.highestToothLevel >= 10) {
        const critLv = window.trainingLevels && window.trainingLevels.crit ? window.trainingLevels.crit : 0;
        const critChance = 0.05 + (critLv * 0.02);
        const critMul = 2 + (critLv * 0.2);

        if (Math.random() < critChance) {
            dmg *= critMul;
            isCrit = true;
        }
    }

    m.active = true;
    m.x = px;
    m.y = py;
    m.vx = Math.cos(angle) * 18;
    m.vy = Math.sin(angle) * 18;
    m.dmg = Math.floor(dmg);
    m.isCrit = isCrit;
    m.range = 2000;
    m.travel = 0;
    m.slotIdx = slotIdx;

    m.el.innerHTML = cGetIcon(lv);
    m.el.style.left = m.x + "px";
    m.el.style.top = m.y + "px";
    m.el.style.display = "block";
}

function updateMissiles() {
    missiles = missilePool.filter((m) => m.active);

    for (let i = missiles.length - 1; i >= 0; i--) {
        const m = missiles[i];

        m.x += m.vx;
        m.y += m.vy;
        m.travel += Math.sqrt(m.vx * m.vx + m.vy * m.vy);

        m.el.style.left = m.x + "px";
        m.el.style.top = m.y + "px";

        if (m.travel > m.range || m.x < -50 || m.y < -50 || m.x > WORLD_WIDTH + 50 || m.y > WORLD_HEIGHT + 50) {
            deactivateMissile(m);
            continue;
        }

        let hitEnemy = null;

        for (const en of enemies) {
            if (!en || !en.el) continue;

            const hitRange = en.isBoss ? 75 : 28;

            if (cDistance(m.x, m.y, en.x, en.y) <= hitRange) {
                hitEnemy = en;
                break;
            }
        }

        if (hitEnemy) {
            damageEnemy(hitEnemy, m.dmg, m.isCrit, m.x, m.y);
            applySplashDamage(hitEnemy, m.dmg);
            deactivateMissile(m);
        }
    }
}

function deactivateMissile(m) {
    if (!m) return;

    m.active = false;

    if (m.el) {
        m.el.style.display = "none";
    }
}

// =========================
// 적 데미지 처리
// =========================
function damageEnemy(en, dmg, isCrit, tx, ty) {
    if (!en || !en.el) return;

    dmg = Math.max(1, Math.floor(dmg));

    en.hp -= dmg;

    showDmgText(tx || en.x, ty || en.y, dmg, isCrit);

    const fill = en.el.querySelector(".hp-bar-fill");
    if (fill) {
        fill.style.width = Math.max(0, (en.hp / en.maxHp) * 100) + "%";
    }

    try {
        if (typeof playSfx === "function") playSfx("hit");
    } catch (e) {}

    if (en.hp <= 0) {
        processEnemyDeath(en);
    }
}

function applySplashDamage(mainEnemy, mainDmg) {
    if (!mainEnemy) return;

    if (window.highestToothLevel < 7) return;

    const splashDmgLv = window.trainingLevels && window.trainingLevels.splashDmg ? window.trainingLevels.splashDmg : 0;
    const splashRangeLv = window.trainingLevels && window.trainingLevels.splashRange ? window.trainingLevels.splashRange : 0;

    const ratio = Math.min(0.8, 0.2 + (splashDmgLv * 0.05));
    const radius = 50 + (splashRangeLv * 10);

    if (radius <= 0 || ratio <= 0) return;

    showSplashEffect(mainEnemy.x, mainEnemy.y, radius);

    enemies.slice().forEach((en) => {
        if (!en || en === mainEnemy || !en.el) return;

        if (cDistance(mainEnemy.x, mainEnemy.y, en.x, en.y) <= radius) {
            damageEnemy(en, mainDmg * ratio, false, en.x, en.y);
        }
    });
}

// =========================
// 적 미사일
// =========================
function getEnemyMissileFromPool() {
    const worldDiv = document.getElementById("battle-world");

    if (!worldDiv) return null;

    let m = enemyMissilePool.find((item) => !item.active);

    if (!m) {
        const el = document.createElement("div");
        el.className = "enemy-missile";
        el.style.display = "none";
        worldDiv.appendChild(el);

        m = {
            active: false,
            el
        };

        enemyMissilePool.push(m);
    }

    return m;
}

function enemyShoot(ex, ey, angle, iconStr) {
    const m = getEnemyMissileFromPool();

    if (!m) return;

    const idx = Number(window.currentDungeonIdx) || 0;

    let dmg = 15 + (idx * 5);

    if (window.isHellMode) dmg *= 10;

    m.active = true;
    m.x = ex;
    m.y = ey;
    m.vx = Math.cos(angle) * 7;
    m.vy = Math.sin(angle) * 7;
    m.dmg = dmg;
    m.range = 1500;
    m.travel = 0;

    m.el.innerHTML = iconStr || "•";
    m.el.style.left = m.x + "px";
    m.el.style.top = m.y + "px";
    m.el.style.display = "block";
}

function updateEnemyMissiles() {
    enemyMissiles = enemyMissilePool.filter((m) => m.active);

    const px = window.playerX || WORLD_WIDTH / 2;
    const py = window.playerY || WORLD_HEIGHT / 2;

    for (let i = enemyMissiles.length - 1; i >= 0; i--) {
        const m = enemyMissiles[i];

        m.x += m.vx;
        m.y += m.vy;
        m.travel += Math.sqrt(m.vx * m.vx + m.vy * m.vy);

        m.el.style.left = m.x + "px";
        m.el.style.top = m.y + "px";

        if (m.travel > m.range || m.x < -50 || m.y < -50 || m.x > WORLD_WIDTH + 50 || m.y > WORLD_HEIGHT + 50) {
            deactivateEnemyMissile(m);
            continue;
        }

        if (cDistance(m.x, m.y, px, py) < 30) {
            if (typeof window.takeDamage === "function") {
                window.takeDamage(m.dmg);
            }

            deactivateEnemyMissile(m);
        }
    }
}

function deactivateEnemyMissile(m) {
    if (!m) return;

    m.active = false;

    if (m.el) {
        m.el.style.display = "none";
    }
}

// =========================
// 적 사망 / 보상
// =========================
function processEnemyDeath(en) {
    if (!en || !en.el) return;

    // HELL 보스 2페이즈
    if (en.isBoss && window.isHellMode && en.phase === 1) {
        en.phase = 2;
        en.hp = Math.floor(en.maxHp * 0.5);
        en.maxHp = en.hp;
        en.speed *= 1.8;
        en.shootInterval = Math.max(25, Math.floor(en.shootInterval / 2));

        const fill = en.el.querySelector(".hp-bar-fill");
        if (fill) fill.style.width = "100%";

        showDmgText(en.x, en.y - 40, "광폭화!!", true);
        flashBattleScreen("rgba(255,0,0,0.45)");

        return;
    }

    const idx = Number(window.currentDungeonIdx) || 0;

    const enemyIdx = enemies.indexOf(en);
    if (enemyIdx >= 0) enemies.splice(enemyIdx, 1);

    if (en.el) en.el.remove();

    let goldGain = Math.floor(2000 * Math.pow(2.5, idx));

    if (en.isBoss) goldGain *= 5;
    if (window.isHellMode) goldGain *= 20;
    if (window.isBossRush) goldGain *= (2 * window.currentWave);
    if (window.highestToothLevel >= 22) goldGain *= 5;

    window.gold += goldGain;
    window.dungeonGoldEarned += goldGain;

    showGoldText(en.x, en.y, goldGain);

    let diaGain = 0;

    const baseDia = (1 + Math.floor(idx * 1.5)) * (window.isHellMode ? 10 : 1);

    if (en.isBoss) {
        diaGain = baseDia * 5;

        if (window.isBossRush) {
            diaGain *= window.currentWave;
        }
    } else if (Math.random() < 0.1) {
        diaGain = baseDia;
    }

    if (diaGain > 0) {
        if (window.highestToothLevel >= 13) diaGain *= 2;
        if (window.highestToothLevel >= 22) diaGain *= 5;

        diaGain = Math.floor(diaGain);

        window.dia += diaGain;
        window.dungeonDiaEarned += diaGain;

        showDiaText(en.x, en.y - 20, diaGain);
    }

    if (en.isBoss) {
        showExplosion(en.x, en.y);

        handleBossReward();
        return;
    }

    checkWaveClear();
}

function handleBossReward() {
    const idx = Number(window.currentDungeonIdx) || 0;

    // 일반 원정 보스 유물 드랍
    if (!window.isBossRush) {
        const dropChance = 0.3;

        if (Math.random() < dropChance) {
            const artifactIdx = window.isHellMode ? idx + 20 : idx;

            if (typeof TOOTH_DATA !== "undefined" && TOOTH_DATA.artifacts[artifactIdx]) {
                if (!Array.isArray(window.artifactCounts)) {
                    window.artifactCounts = new Array(30).fill(0);
                }

                window.artifactCounts[artifactIdx] = (window.artifactCounts[artifactIdx] || 0) + 1;

                const art = TOOTH_DATA.artifacts[artifactIdx];

                window.dungeonArtifactDropped = {
                    idx: artifactIdx,
                    name: art.name,
                    icon: art.icon,
                    count: window.artifactCounts[artifactIdx]
                };
            }
        }
    }

    if (window.isBossRush) {
        const maxWaves = getBossRushMaxWaves();

        if (window.currentWave < maxWaves) {
            window.currentWave++;
            window.isBossWave = true;

            const t = setTimeout(() => {
                spawnWave();
            }, 1200);

            spawnTimeouts.push(t);
        } else {
            finishDungeonClear();
        }

        return;
    }

    finishDungeonClear();
}

function finishDungeonClear() {
    window.bossDead = true;
    window.dungeonActive = false;

    clearSpawnTimeouts();

    if (typeof window.showResultModal === "function") {
        window.showResultModal();
    }

    if (typeof window.saveGame === "function") {
        window.saveGame();
    }
}

function checkWaveClear() {
    if (!window.dungeonActive || window.bossDead) return;
    if (window.isBossRush || window.isBossWave) return;

    if (enemies.length > 0) return;

    if (window.currentWave < 5) {
        window.currentWave++;

        const t = setTimeout(() => {
            spawnWave();
        }, 800);

        spawnTimeouts.push(t);
    } else {
        window.isBossWave = true;

        const t = setTimeout(() => {
            spawnWave();
        }, 1000);

        spawnTimeouts.push(t);
    }
}

// =========================
// 텍스트 / 효과
// =========================
function showDmgText(x, y, dmg, isCrit) {
    const worldDiv = document.getElementById("battle-world");
    if (!worldDiv) return;

    const txt = document.createElement("div");
    txt.className = isCrit ? "crit-text" : "dmg-text";
    txt.innerText = typeof dmg === "string" ? dmg : (isCrit ? `CRIT! ${cNum(dmg)}` : cNum(dmg));
    txt.style.left = x + "px";
    txt.style.top = y + "px";

    worldDiv.appendChild(txt);

    setTimeout(() => txt.remove(), 700);
}

function showGoldText(x, y, amount) {
    const worldDiv = document.getElementById("battle-world");
    if (!worldDiv) return;

    const txt = document.createElement("div");
    txt.className = "gold-text";
    txt.innerText = `💰+${cNum(amount)}`;
    txt.style.left = x + "px";
    txt.style.top = y + "px";

    worldDiv.appendChild(txt);

    setTimeout(() => txt.remove(), 900);
}

function showDiaText(x, y, amount) {
    const worldDiv = document.getElementById("battle-world");
    if (!worldDiv) return;

    const txt = document.createElement("div");
    txt.className = "dia-drop-text";
    txt.innerText = `♦️+${cNum(amount)}`;
    txt.style.left = x + "px";
    txt.style.top = y + "px";

    worldDiv.appendChild(txt);

    setTimeout(() => txt.remove(), 1000);
}

function showSplashEffect(x, y, radius) {
    const worldDiv = document.getElementById("battle-world");
    if (!worldDiv) return;

    const effect = document.createElement("div");
    effect.className = "splash-effect";
    effect.style.left = x + "px";
    effect.style.top = y + "px";
    effect.style.width = radius * 2 + "px";
    effect.style.height = radius * 2 + "px";

    worldDiv.appendChild(effect);

    setTimeout(() => effect.remove(), 400);
}

function showExplosion(x, y) {
    const worldDiv = document.getElementById("battle-world");
    if (!worldDiv) return;

    const boom = document.createElement("div");
    boom.className = "hit-effect";
    boom.innerText = "💥";
    boom.style.position = "absolute";
    boom.style.left = x + "px";
    boom.style.top = y + "px";
    boom.style.fontSize = "80px";
    boom.style.transform = "translate(-50%, -50%)";

    worldDiv.appendChild(boom);

    setTimeout(() => boom.remove(), 600);
}

function flashBattleScreen(color) {
    const battleScreen = document.getElementById("battle-screen");
    if (!battleScreen) return;

    const flash = document.createElement("div");
    flash.style.position = "absolute";
    flash.style.inset = "0";
    flash.style.background = color || "rgba(255,0,0,0.35)";
    flash.style.pointerEvents = "none";
    flash.style.zIndex = "2000";
    flash.style.animation = "splashFade 0.5s ease-out forwards";

    battleScreen.appendChild(flash);

    setTimeout(() => flash.remove(), 600);
}

// =========================
// 후퇴
// =========================
window.requestRetreat = function() {
    if (!window.dungeonActive && !window.bossDead) {
        window.exitDungeon();
        return;
    }

    const modal = document.getElementById("retreat-confirm-modal");

    if (modal) {
        modal.style.display = "flex";
    } else {
        if (confirm("던전에서 후퇴하시겠습니까?")) {
            window.exitDungeon();
        }
    }
};

window.cancelRetreat = function() {
    const modal = document.getElementById("retreat-confirm-modal");
    if (modal) modal.style.display = "none";
};

window.confirmRetreat = function() {
    const modal = document.getElementById("retreat-confirm-modal");
    if (modal) modal.style.display = "none";

    window.exitDungeon();
};

// =========================
// 던전 종료 / 정리
// =========================
function clearBattleObjects() {
    enemies.forEach((en) => {
        if (en && en.el) en.el.remove();
    });

    enemies = [];

    missilePool.forEach((m) => {
        if (m && m.el) m.el.remove();
    });

    enemyMissilePool.forEach((m) => {
        if (m && m.el) m.el.remove();
    });

    missiles = [];
    enemyMissiles = [];
    missilePool = [];
    enemyMissilePool = [];
}

window.exitDungeon = function() {
    window.dungeonActive = false;
    window.bossDead = true;

    window.moveX = 0;
    window.moveY = 0;

    clearSpawnTimeouts();
    clearBattleObjects();

    const battleScreen = document.getElementById("battle-screen");
    const gameContainer = document.getElementById("game-container");
    const worldDiv = document.getElementById("battle-world");

    if (battleScreen) {
        battleScreen.style.display = "none";
        battleScreen.style.boxShadow = "";
    }

    if (gameContainer) {
        gameContainer.style.display = "flex";
    }

    if (worldDiv) {
        worldDiv.className = "";
        worldDiv.innerHTML = "";
        worldDiv.style.transform = "translate(0px, 0px)";
    }

    const knob = document.getElementById("joystick-knob");
    if (knob) {
        knob.style.left = "50%";
        knob.style.top = "50%";
    }

    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderDungeonList === "function") window.renderDungeonList();
    if (typeof window.renderMercenaryCamp === "function") window.renderMercenaryCamp();
    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.saveGame === "function") window.saveGame();
};

window.closeResultModal = function() {
    const modal = document.getElementById("dungeon-result-modal");
    if (modal) modal.style.display = "none";

    window.exitDungeon();
};
