// Version: 8.1.0 - Combat / Sequential Fire / Artifact Duplicate Reward / Effects

// =========================
// 전투 상태
// =========================
window.combatEnemies = [];
window.playerMissiles = [];
window.enemyMissiles = [];
window.combatEffects = [];

window.weaponCooldowns = new Array(8).fill(0);
window.weaponCooldownMax = new Array(8).fill(900);

let __activeWeaponSlot = 0;
let __attackRelayTimer = 0;
let __waveDelayTimer = 0;
let __combatObjectId = 1;
let __combatFinishing = false;

// =========================
// 기본 유틸
// =========================
function combatFmt(num) {
    if (typeof fNum === "function") return fNum(num);
    return Math.floor(Number(num) || 0).toString();
}

function combatClamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function combatDist(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function combatSafeRun() {
    return window.currentDungeonRun || null;
}

function getCombatWorld() {
    return document.getElementById("battle-world");
}

function getCombatPlayer() {
    return window.battlePlayer || {
        x: 1000,
        y: 1000,
        hp: 100,
        maxHp: 100
    };
}

function getCombatMode() {
    const run = combatSafeRun();
    return run ? run.mode || "normal" : "normal";
}

function getCombatStage() {
    const run = combatSafeRun();
    return run ? Number(run.stage) || 1 : 1;
}

function combatIsHellMode(mode) {
    return mode === "hell" || mode === "hellboss";
}

function combatIsBossMode(mode) {
    return mode === "boss" || mode === "hellboss";
}

function getCombatMercenary() {
    if (typeof TOOTH_DATA === "undefined" || !TOOTH_DATA.mercenaries) {
        return {
            name: "초보 치아 수호자",
            icon: "🧑‍🚀",
            baseHp: 100,
            atkMul: 1,
            spd: 1
        };
    }

    return TOOTH_DATA.mercenaries[window.mercenaryIdx || 0] || TOOTH_DATA.mercenaries[0];
}

function getCombatTrainingLevel(key) {
    if (!window.trainingLevels) return 0;
    return Number(window.trainingLevels[key]) || 0;
}

function getCombatSlotUpgrade(slotIdx, key) {
    if (!Array.isArray(window.slotUpgrades)) return 0;
    const u = window.slotUpgrades[slotIdx];
    if (!u) return 0;
    return Number(u[key]) || 0;
}

function getCombatGlobalUpgrade(key) {
    if (!window.globalUpgrades) return 0;
    return Number(window.globalUpgrades[key]) || 0;
}

// =========================
// 전투 초기화
// =========================
window.resetCombatState = function() {
    window.combatEnemies = [];
    window.playerMissiles = [];
    window.enemyMissiles = [];
    window.combatEffects = [];

    window.weaponCooldowns = new Array(8).fill(0);
    window.weaponCooldownMax = new Array(8).fill(900);

    __activeWeaponSlot = 0;
    __attackRelayTimer = 0;
    __waveDelayTimer = 0;
    __combatObjectId = 1;
    __combatFinishing = false;

    const world = getCombatWorld();

    if (world) {
        world.querySelectorAll(
            ".battle-enemy, .missile, .enemy-missile, .dmg-text, .crit-text, .gold-text, .dia-drop-text, .splash-effect, .hit-effect"
        ).forEach((el) => el.remove());
    }

    renderWeaponSlots();
};

window.setupCombatForDungeon = function() {
    window.resetCombatState();

    const run = combatSafeRun();
    if (!run) return;

    run.wave = 1;
    run.maxWave = 5;
    run.kills = 0;
    run.finished = false;

    spawnCombatWave(run.wave);

    renderWeaponSlots();
};

// =========================
// 전투 메인 업데이트
// =========================
window.updateCombat = function(dt) {
    if (!window.dungeonActive) return;
    if (window.dungeonPaused) return;

    const run = combatSafeRun();

    if (!run || run.finished || __combatFinishing) return;

    dt = Math.min(80, Math.max(0, Number(dt) || 0));

    updateWeaponCooldowns(dt);
    updatePlayerAttackRelay(dt);
    updatePlayerMissiles(dt);
    updateEnemyLogic(dt);
    updateEnemyMissiles(dt);
    updateCombatEffects(dt);
    checkWaveProgress(dt);
    renderWeaponSlots();
};

// =========================
// Top8 순차 발사
// =========================
function updateWeaponCooldowns(dt) {
    for (let i = 0; i < 8; i++) {
        window.weaponCooldowns[i] = Math.max(0, (Number(window.weaponCooldowns[i]) || 0) - dt);
    }
}

function updatePlayerAttackRelay(dt) {
    const interval = getAttackRelayInterval();

    __attackRelayTimer += dt;

    while (__attackRelayTimer >= interval) {
        __attackRelayTimer -= interval;

        tryFireNextWeaponSlot();
    }
}

function getAttackRelayInterval() {
    const globalCd = getCombatGlobalUpgrade("cd");

    // 릴레이 간격. 너무 빠르면 다시 우르르 발사처럼 보이므로 최소값 제한.
    return Math.max(95, 185 - globalCd * 3);
}

function tryFireNextWeaponSlot() {
    if (!Array.isArray(window.inventory)) return;
    if (!window.combatEnemies || window.combatEnemies.length <= 0) return;

    for (let loop = 0; loop < 8; loop++) {
        const slotIdx = __activeWeaponSlot;

        __activeWeaponSlot = (__activeWeaponSlot + 1) % 8;

        const lv = Number(window.inventory[slotIdx]) || 0;

        if (lv <= 0) continue;
        if ((Number(window.weaponCooldowns[slotIdx]) || 0) > 0) continue;

        const target = findTargetForSlot(slotIdx);

        if (!target) continue;

        firePlayerMissile(slotIdx, lv, target);
        return;
    }
}

function findTargetForSlot(slotIdx) {
    const player = getCombatPlayer();
    const range = getSlotRange(slotIdx);

    let best = null;
    let bestDist = Infinity;

    for (const enemy of window.combatEnemies) {
        if (!enemy || enemy.dead || enemy.hp <= 0) continue;

        const d = combatDist(player, enemy);

        if (d <= range && d < bestDist) {
            best = enemy;
            bestDist = d;
        }
    }

    return best;
}

function getSlotRange(slotIdx) {
    const slotRng = getCombatSlotUpgrade(slotIdx, "rng");
    const globalRng = getCombatGlobalUpgrade("rng");

    return 420 + slotRng * 4 + globalRng * 4;
}

function getSlotCooldown(slotIdx, toothLv) {
    const slotCd = getCombatSlotUpgrade(slotIdx, "cd");
    const globalCd = getCombatGlobalUpgrade("cd");

    let base = 920;

    if (toothLv >= 10) base -= 60;
    if (toothLv >= 18) base -= 70;
    if (toothLv >= 24) base -= 80;
    if (toothLv >= 25) base -= 120;

    const reduction = slotCd * 18 + globalCd * 14;

    return Math.max(260, base - reduction);
}

function getSlotAttack(slotIdx, toothLv) {
    let atk = typeof getAtk === "function" ? getAtk(toothLv) : 10;

    const slotAtk = getCombatSlotUpgrade(slotIdx, "atk");
    const globalAtk = getCombatGlobalUpgrade("atk");
    const merc = getCombatMercenary();

    const trainingAtk = getCombatTrainingLevel("atk");
    const artifactBonus = typeof getOwnedArtifactCount === "function"
        ? getOwnedArtifactCount() * 0.01
        : 0;

    atk *= 1 + slotAtk * 0.05;
    atk *= 1 + globalAtk * 0.05;
    atk *= merc.atkMul || 1;
    atk *= 1 + trainingAtk * 0.1;
    atk *= 1 + artifactBonus;

    return Math.floor(atk);
}

function getCritChance() {
    const critLv = getCombatTrainingLevel("crit");
    return Math.min(0.45, critLv * 0.015);
}

function firePlayerMissile(slotIdx, toothLv, target) {
    const world = getCombatWorld();
    const player = getCombatPlayer();

    if (!world || !target) return;

    const atk = getSlotAttack(slotIdx, toothLv);
    const cooldown = getSlotCooldown(slotIdx, toothLv);

    window.weaponCooldowns[slotIdx] = cooldown;
    window.weaponCooldownMax[slotIdx] = cooldown;

    const el = document.createElement("div");
    el.className = "missile";

    const icon = typeof getProjectileIcon === "function"
        ? getProjectileIcon(toothLv)
        : "🦷";

    el.textContent = icon;
    el.style.left = player.x + "px";
    el.style.top = player.y + "px";

    world.appendChild(el);

    const missile = {
        id: __combatObjectId++,
        el,
        x: player.x,
        y: player.y,
        targetId: target.id,
        atk,
        slotIdx,
        toothLv,
        speed: toothLv >= 25 ? 950 : toothLv >= 24 ? 780 : 650,
        radius: 18,
        life: 1600,
        pierce: toothLv >= 25 ? 2 : 0
    };

    window.playerMissiles.push(missile);

    try {
        if (typeof playSfx === "function") playSfx("attack");
    } catch (e) {}
}

// =========================
// 플레이어 미사일 업데이트
// =========================
function updatePlayerMissiles(dt) {
    const removeList = [];

    for (const missile of window.playerMissiles) {
        if (!missile || !missile.el) {
            removeList.push(missile);
            continue;
        }

        missile.life -= dt;

        if (missile.life <= 0) {
            removeList.push(missile);
            continue;
        }

        const target = window.combatEnemies.find((e) => e.id === missile.targetId && !e.dead && e.hp > 0);

        if (!target) {
            removeList.push(missile);
            continue;
        }

        const dx = target.x - missile.x;
        const dy = target.y - missile.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;

        const move = missile.speed * (dt / 1000);

        missile.x += (dx / d) * move;
        missile.y += (dy / d) * move;

        missile.el.style.left = missile.x + "px";
        missile.el.style.top = missile.y + "px";

        if (d <= missile.radius + target.radius) {
            applyDamageToEnemy(target, missile.atk, missile);

            if (missile.pierce > 0) {
                missile.pierce--;
                const nextTarget = findNearestEnemyFromPoint(missile.x, missile.y, target.id);

                if (nextTarget) {
                    missile.targetId = nextTarget.id;
                } else {
                    removeList.push(missile);
                }
            } else {
                removeList.push(missile);
            }
        }
    }

    if (removeList.length > 0) {
        window.playerMissiles = window.playerMissiles.filter((m) => !removeList.includes(m));

        removeList.forEach((m) => {
            if (m && m.el) m.el.remove();
        });
    }
}

function findNearestEnemyFromPoint(x, y, exceptId) {
    let best = null;
    let bestD = Infinity;

    for (const enemy of window.combatEnemies) {
        if (!enemy || enemy.dead || enemy.hp <= 0 || enemy.id === exceptId) continue;

        const dx = enemy.x - x;
        const dy = enemy.y - y;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (d < bestD) {
            best = enemy;
            bestD = d;
        }
    }

    return best;
}

// =========================
// 적 피해 처리
// =========================
function applyDamageToEnemy(enemy, rawDamage, missile) {
    if (!enemy || enemy.dead) return;

    let dmg = Math.max(1, Math.floor(rawDamage || 1));
    let crit = false;

    if (Math.random() < getCritChance()) {
        crit = true;
        dmg = Math.floor(dmg * 2.2);
    }

    enemy.hp -= dmg;

    showDamageText(enemy.x, enemy.y - enemy.radius, dmg, crit);
    showHitEffect(enemy.x, enemy.y);

    try {
        if (typeof playSfx === "function") playSfx("hit");
    } catch (e) {}

    applySplashDamage(enemy, dmg, missile);

    updateEnemyHpBar(enemy);

    if (enemy.hp <= 0) {
        killEnemy(enemy);
    }
}

function applySplashDamage(mainEnemy, mainDamage, missile) {
    const splashRangeLv = getCombatTrainingLevel("splashRange");
    const splashDmgLv = getCombatTrainingLevel("splashDmg");

    const range = 55 + splashRangeLv * 3;
    const rate = (25 + splashDmgLv * 2.5) / 100;

    if (range <= 0 || rate <= 0) return;

    showSplashEffect(mainEnemy.x, mainEnemy.y, range);

    const splashDamage = Math.max(1, Math.floor(mainDamage * rate));

    for (const enemy of window.combatEnemies) {
        if (!enemy || enemy.dead || enemy.id === mainEnemy.id || enemy.hp <= 0) continue;

        const d = combatDist(mainEnemy, enemy);

        if (d <= range) {
            enemy.hp -= splashDamage;
            showDamageText(enemy.x, enemy.y - enemy.radius, splashDamage, false);
            updateEnemyHpBar(enemy);

            if (enemy.hp <= 0) {
                killEnemy(enemy);
            }
        }
    }
}

function killEnemy(enemy) {
    if (!enemy || enemy.dead) return;

    enemy.dead = true;
    enemy.hp = 0;

    const run = combatSafeRun();

    if (run) run.kills = (Number(run.kills) || 0) + 1;

    if (enemy.el) {
        enemy.el.style.transition = "transform .18s ease, opacity .18s ease";
        enemy.el.style.transform = "translate(-50%, -50%) scale(0.45)";
        enemy.el.style.opacity = "0";
        setTimeout(() => {
            if (enemy.el) enemy.el.remove();
        }, 180);
    }

    const goldDrop = enemy.isBoss ? enemy.rewardGold || 0 : enemy.rewardGold || 0;

    if (goldDrop > 0) {
        window.gold += goldDrop;
        showGoldText(enemy.x, enemy.y, `+${combatFmt(goldDrop)}G`);
    }

    window.combatEnemies = window.combatEnemies.filter((e) => e !== enemy);
}

// =========================
// 적 생성 / 웨이브
// =========================
function spawnCombatWave(wave) {
    const run = combatSafeRun();
    const world = getCombatWorld();

    if (!run || !world) return;

    const mode = run.mode || "normal";
    const stage = Number(run.stage) || 1;
    const isHell = combatIsHellMode(mode);
    const bossMode = combatIsBossMode(mode);

    clearEnemiesOnly();

    const mobData = getMobDataForRun(mode, stage);
    const player = getCombatPlayer();

    const enemyCount = wave >= run.maxWave
        ? 1
        : combatClamp(3 + Math.floor(stage / 4) + wave, 4, isHell ? 11 : 9);

    for (let i = 0; i < enemyCount; i++) {
        const isBoss = wave >= run.maxWave || bossMode;
        const icon = isBoss
            ? mobData.boss
            : mobData.mobs[i % mobData.mobs.length];

        const pos = getSpawnPositionAround(player.x, player.y, isBoss ? 520 : 430);

        spawnEnemy({
            x: pos.x,
            y: pos.y,
            icon,
            isBoss,
            wave,
            stage,
            mode
        });

        if (isBoss) break;
    }

    if (typeof window.updateBattleTopInfo === "function") {
        window.updateBattleTopInfo();
    }
}

function getMobDataForRun(mode, stage) {
    const idx = combatClamp((Number(stage) || 1) - 1, 0, 19);

    if (typeof TOOTH_DATA === "undefined") {
        return {
            theme: "bg-cave",
            mobs: ["🦠", "🦷"],
            boss: "👹"
        };
    }

    if (combatIsHellMode(mode)) {
        return TOOTH_DATA.hellMobs[idx] || TOOTH_DATA.hellMobs[0];
    }

    return TOOTH_DATA.dungeonMobs[idx] || TOOTH_DATA.dungeonMobs[0];
}

function getSpawnPositionAround(cx, cy, distance) {
    const angle = Math.random() * Math.PI * 2;
    const dist = distance + Math.random() * 180;

    const x = combatClamp(cx + Math.cos(angle) * dist, 120, 1880);
    const y = combatClamp(cy + Math.sin(angle) * dist, 120, 1880);

    return { x, y };
}

function spawnEnemy(config) {
    const world = getCombatWorld();
    if (!world) return;

    const mode = config.mode || "normal";
    const stage = Number(config.stage) || 1;
    const wave = Number(config.wave) || 1;
    const isHell = combatIsHellMode(mode);
    const bossMode = combatIsBossMode(mode);
    const isBoss = !!config.isBoss;

    const recommended = typeof getRecommendedAtk === "function"
        ? getRecommendedAtk(mode, stage)
        : Math.floor(600 * Math.pow(1.55, stage - 1));

    let hp = recommended * (isBoss ? 4.5 : 0.55);
    hp *= 1 + wave * 0.14;

    if (isHell) hp *= 2.2;
    if (bossMode) hp *= 1.8;

    hp = Math.max(isBoss ? 2500 : 300, Math.floor(hp));

    const speed = isBoss
        ? (isHell ? 95 : 78)
        : (isHell ? 145 : 118) + Math.min(60, stage * 2);

    const radius = isBoss ? 46 : 24;

    const el = document.createElement("div");
    el.className = `battle-enemy ${isBoss ? "boss" : ""}`;
    el.textContent = config.icon || "🦠";
    el.style.left = config.x + "px";
    el.style.top = config.y + "px";

    const hpBg = document.createElement("div");
    hpBg.className = "hp-bar-bg";
    hpBg.style.width = isBoss ? "92px" : "48px";

    const hpFill = document.createElement("div");
    hpFill.className = "hp-bar-fill";

    hpBg.appendChild(hpFill);
    el.appendChild(hpBg);

    world.appendChild(el);

    const enemy = {
        id: __combatObjectId++,
        el,
        hpBar: hpFill,
        x: config.x,
        y: config.y,
        hp,
        maxHp: hp,
        speed,
        radius,
        isBoss,
        dead: false,
        contactCd: 0,
        shootCd: isBoss ? 1200 : 2000 + Math.random() * 1200,
        rewardGold: getEnemyGoldReward(stage, mode, isBoss)
    };

    window.combatEnemies.push(enemy);
}

function getEnemyGoldReward(stage, mode, isBoss) {
    stage = Number(stage) || 1;

    let base = isBoss ? 200 * stage * stage : 18 * stage;

    if (mode === "hell" || mode === "hellboss") {
        base *= 4;
    }

    if (mode === "boss" || mode === "hellboss") {
        base *= 2;
    }

    return Math.floor(base);
}

// =========================
// 적 AI
// =========================
function updateEnemyLogic(dt) {
    const player = getCombatPlayer();

    for (const enemy of window.combatEnemies) {
        if (!enemy || enemy.dead || enemy.hp <= 0) continue;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;

        const stopDist = enemy.isBoss ? 82 : 48;

        if (d > stopDist) {
            const move = enemy.speed * (dt / 1000);
            enemy.x += (dx / d) * move;
            enemy.y += (dy / d) * move;
        } else {
            enemy.contactCd -= dt;

            if (enemy.contactCd <= 0) {
                const damage = getEnemyContactDamage(enemy);
                damagePlayerFromCombat(damage);
                enemy.contactCd = enemy.isBoss ? 850 : 1100;
            }
        }

        enemy.shootCd -= dt;

        if (enemy.shootCd <= 0) {
            fireEnemyMissile(enemy);
            enemy.shootCd = enemy.isBoss ? 1150 : 2100 + Math.random() * 900;
        }

        if (enemy.el) {
            enemy.el.style.left = enemy.x + "px";
            enemy.el.style.top = enemy.y + "px";
        }
    }
}

function getEnemyContactDamage(enemy) {
    const run = combatSafeRun();
    const stage = run ? Number(run.stage) || 1 : 1;
    const mode = run ? run.mode || "normal" : "normal";

    let dmg = enemy.isBoss ? 18 + stage * 4 : 7 + stage * 1.5;

    if (combatIsHellMode(mode)) dmg *= 2.5;
    if (combatIsBossMode(mode)) dmg *= 1.5;

    return Math.floor(dmg);
}

function fireEnemyMissile(enemy) {
    const world = getCombatWorld();
    const player = getCombatPlayer();

    if (!world || !enemy || enemy.dead) return;

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;

    const el = document.createElement("div");
    el.className = "enemy-missile";
    el.style.left = enemy.x + "px";
    el.style.top = enemy.y + "px";

    world.appendChild(el);

    const speed = enemy.isBoss ? 360 : 280;

    window.enemyMissiles.push({
        id: __combatObjectId++,
        el,
        x: enemy.x,
        y: enemy.y,
        vx: (dx / d) * speed,
        vy: (dy / d) * speed,
        damage: Math.floor(getEnemyContactDamage(enemy) * 0.75),
        life: 2400,
        radius: enemy.isBoss ? 20 : 15
    });
}

function updateEnemyMissiles(dt) {
    const player = getCombatPlayer();
    const removeList = [];

    for (const missile of window.enemyMissiles) {
        if (!missile || !missile.el) {
            removeList.push(missile);
            continue;
        }

        missile.life -= dt;

        if (missile.life <= 0) {
            removeList.push(missile);
            continue;
        }

        missile.x += missile.vx * (dt / 1000);
        missile.y += missile.vy * (dt / 1000);

        missile.el.style.left = missile.x + "px";
        missile.el.style.top = missile.y + "px";

        const d = combatDist(missile, player);

        if (d <= missile.radius + 24) {
            damagePlayerFromCombat(missile.damage);
            showHitEffect(player.x, player.y);
            removeList.push(missile);
        }
    }

    if (removeList.length > 0) {
        window.enemyMissiles = window.enemyMissiles.filter((m) => !removeList.includes(m));
        removeList.forEach((m) => {
            if (m && m.el) m.el.remove();
        });
    }
}

function damagePlayerFromCombat(amount) {
    if (typeof window.takePlayerDamage === "function") {
        window.takePlayerDamage(amount);
        return;
    }

    const player = getCombatPlayer();
    player.hp = Math.max(0, (Number(player.hp) || 0) - amount);

    if (player.hp <= 0 && typeof window.finishDungeonFailure === "function") {
        window.finishDungeonFailure();
    }
}

// =========================
// 웨이브 진행
// =========================
function checkWaveProgress(dt) {
    const run = combatSafeRun();

    if (!run || run.finished || __combatFinishing) return;

    if (window.combatEnemies.length > 0) {
        __waveDelayTimer = 0;
        return;
    }

    __waveDelayTimer += dt;

    if (__waveDelayTimer < 700) return;

    __waveDelayTimer = 0;

    if (run.wave >= run.maxWave) {
        finishDungeonSuccess();
        return;
    }

    run.wave += 1;
    spawnCombatWave(run.wave);
}

// =========================
// 보상 / 클리어 처리
// =========================
window.finishDungeonSuccess = function() {
    const run = combatSafeRun();

    if (!run || __combatFinishing) return;

    __combatFinishing = true;
    run.finished = true;

    const result = createDungeonRewardResult(run, true);

    applyDungeonReward(result);

    cleanupCombatObjects();

    if (typeof window.closeBattleScreen === "function") {
        window.closeBattleScreen();
    }

    if (typeof window.showResultModal === "function") {
        window.showResultModal(result);
    }

    if (typeof window.saveGame === "function") {
        window.saveGame();
    }
};

window.finishDungeonFailure = function() {
    const run = combatSafeRun();

    if (!run || __combatFinishing) return;

    __combatFinishing = true;
    run.finished = true;

    const result = createDungeonRewardResult(run, false);

    cleanupCombatObjects();

    if (typeof window.closeBattleScreen === "function") {
        window.closeBattleScreen();
    }

    if (typeof window.showResultModal === "function") {
        window.showResultModal(result);
    }

    if (typeof window.saveGame === "function") {
        window.saveGame();
    }
};

function createDungeonRewardResult(run, success) {
    const mode = run.mode || "normal";
    const stage = Number(run.stage) || 1;
    const isHell = combatIsHellMode(mode);
    const isBoss = combatIsBossMode(mode);

    if (!success) {
        return {
            success: false,
            mode,
            stage,
            gold: 0,
            dia: 0,
            bossMarks: 0,
            artifact: null
        };
    }

    let goldReward = 0;
    let diaReward = 0;
    let bossMarkReward = 0;

    if (mode === "normal") {
        goldReward = Math.floor(300 * stage * stage);
    } else if (mode === "boss") {
        goldReward = Math.floor(1200 * stage * stage);
        bossMarkReward = 1;
    } else if (mode === "hell") {
        goldReward = Math.floor(1800 * stage * stage);
        diaReward = Math.floor(40 * stage);
    } else if (mode === "hellboss") {
        goldReward = Math.floor(4200 * stage * stage);
        diaReward = Math.floor(120 * stage);
        bossMarkReward = 2;
    }

    const artifact = rollDungeonArtifact(mode, stage, isBoss);

    return {
        success: true,
        mode,
        stage,
        gold: goldReward,
        dia: diaReward,
        bossMarks: bossMarkReward,
        artifact
    };
}

function applyDungeonReward(result) {
    if (!result || !result.success) return;

    window.gold += Number(result.gold) || 0;
    window.dia += Number(result.dia) || 0;
    window.bossMarks += Number(result.bossMarks) || 0;

    if (result.artifact) {
        if (result.artifact.isDuplicate) {
            window.dia += Number(result.artifact.rewardDia) || 0;
            window.bossMarks += Number(result.artifact.rewardBossMarks) || 0;
        } else {
            if (!Array.isArray(window.artifactCounts)) {
                window.artifactCounts = new Array(40).fill(0);
            }

            window.artifactCounts[result.artifact.idx] = 1;
        }
    }

    if (typeof normalizeArtifactCounts === "function") {
        normalizeArtifactCounts();
    }
}

function rollDungeonArtifact(mode, stage, bossMode) {
    if (typeof TOOTH_DATA === "undefined" || !TOOTH_DATA.artifacts) return null;

    const isHell = combatIsHellMode(mode);

    let chance = isHell ? 0.45 : 0.3;

    if (bossMode) chance = isHell ? 0.9 : 0.75;

    if (Math.random() > chance) return null;

    const idx = isHell ? 20 + (stage - 1) : stage - 1;
    const safeIdx = combatClamp(idx, 0, TOOTH_DATA.artifacts.length - 1);
    const art = TOOTH_DATA.artifacts[safeIdx];

    if (!Array.isArray(window.artifactCounts)) {
        window.artifactCounts = new Array(40).fill(0);
    }

    while (window.artifactCounts.length < TOOTH_DATA.artifacts.length) {
        window.artifactCounts.push(0);
    }

    const owned = Number(window.artifactCounts[safeIdx]) > 0;

    if (owned) {
        const rewardDia = isHell ? 500 * stage : 50 * stage;
        const rewardBossMarks = isHell ? 1 : 0;

        return {
            idx: safeIdx,
            name: art.name,
            icon: art.icon,
            isDuplicate: true,
            rewardDia,
            rewardBossMarks
        };
    }

    return {
        idx: safeIdx,
        name: art.name,
        icon: art.icon,
        isDuplicate: false,
        rewardDia: 0,
        rewardBossMarks: 0
    };
}

// =========================
// UI / HP / 데미지 표시
// =========================
function updateEnemyHpBar(enemy) {
    if (!enemy || !enemy.hpBar) return;

    const pct = combatClamp((enemy.hp / enemy.maxHp) * 100, 0, 100);
    enemy.hpBar.style.width = pct + "%";
}

function showDamageText(x, y, dmg, crit) {
    const world = getCombatWorld();
    if (!world) return;

    const el = document.createElement("div");
    el.className = crit ? "crit-text" : "dmg-text";
    el.textContent = crit ? `CRIT ${combatFmt(dmg)}` : combatFmt(dmg);
    el.style.left = x + "px";
    el.style.top = y + "px";

    world.appendChild(el);

    setTimeout(() => el.remove(), 800);
}

function showGoldText(x, y, text) {
    const world = getCombatWorld();
    if (!world) return;

    const el = document.createElement("div");
    el.className = "gold-text";
    el.textContent = text;
    el.style.left = x + "px";
    el.style.top = y + "px";

    world.appendChild(el);

    setTimeout(() => el.remove(), 800);
}

function showSplashEffect(x, y, range) {
    const world = getCombatWorld();
    if (!world) return;

    const el = document.createElement("div");
    el.className = "splash-effect";
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.width = range * 2 + "px";
    el.style.height = range * 2 + "px";

    world.appendChild(el);

    setTimeout(() => el.remove(), 420);
}

function showHitEffect(x, y) {
    const world = getCombatWorld();
    if (!world) return;

    const el = document.createElement("div");
    el.className = "hit-effect";
    el.textContent = "✦";
    el.style.position = "absolute";
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.transform = "translate(-50%, -50%)";
    el.style.fontSize = "24px";
    el.style.color = "#fde68a";
    el.style.pointerEvents = "none";

    world.appendChild(el);

    setTimeout(() => el.remove(), 500);
}

function updateCombatEffects(dt) {
    // 현재 DOM 애니메이션 기반이라 별도 처리 없음.
}

// =========================
// 무기 슬롯 HUD
// =========================
window.renderWeaponSlots = function() {
    const box = document.getElementById("war-weapon-slots");
    if (!box) return;

    if (!Array.isArray(window.inventory)) {
        window.inventory = new Array(56).fill(0);
    }

    if (box.children.length !== 8) {
        box.innerHTML = "";

        for (let i = 0; i < 8; i++) {
            const slot = document.createElement("div");
            slot.className = "war-slot";
            slot.dataset.slot = String(i);

            const overlay = document.createElement("div");
            overlay.className = "cd-overlay";

            slot.appendChild(overlay);
            box.appendChild(slot);
        }
    }

    for (let i = 0; i < 8; i++) {
        const slot = box.children[i];
        if (!slot) continue;

        const lv = Number(window.inventory[i]) || 0;
        const overlay = slot.querySelector(".cd-overlay");

        const icon = lv > 0
            ? typeof getProjectileIcon === "function"
                ? getProjectileIcon(lv)
                : "🦷"
            : "";

        const label = lv > 0
            ? lv >= 25
                ? "M"
                : String(lv)
            : "";

        slot.childNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) node.remove();
        });

        let iconSpan = slot.querySelector(".war-slot-icon");

        if (!iconSpan) {
            iconSpan = document.createElement("span");
            iconSpan.className = "war-slot-icon";
            slot.insertBefore(iconSpan, overlay);
        }

        iconSpan.textContent = icon;

        let lvEl = slot.querySelector(".slot-level");

        if (!lvEl) {
            lvEl = document.createElement("div");
            lvEl.className = "slot-level";
            slot.appendChild(lvEl);
        }

        lvEl.textContent = label;

        const cd = Number(window.weaponCooldowns[i]) || 0;
        const max = Number(window.weaponCooldownMax[i]) || 900;
        const pct = max > 0 ? combatClamp((cd / max) * 100, 0, 100) : 0;

        if (overlay) overlay.style.height = pct + "%";

        slot.style.opacity = lv > 0 ? "1" : "0.35";
    }
};

// =========================
// 정리 함수
// =========================
function clearEnemiesOnly() {
    window.combatEnemies.forEach((enemy) => {
        if (enemy && enemy.el) enemy.el.remove();
    });

    window.combatEnemies = [];
}

window.cleanupCombatObjects = function() {
    window.combatEnemies.forEach((enemy) => {
        if (enemy && enemy.el) enemy.el.remove();
    });

    window.playerMissiles.forEach((m) => {
        if (m && m.el) m.el.remove();
    });

    window.enemyMissiles.forEach((m) => {
        if (m && m.el) m.el.remove();
    });

    window.combatEnemies = [];
    window.playerMissiles = [];
    window.enemyMissiles = [];

    const world = getCombatWorld();

    if (world) {
        world.querySelectorAll(
            ".battle-enemy, .missile, .enemy-missile, .dmg-text, .crit-text, .gold-text, .dia-drop-text, .splash-effect, .hit-effect"
        ).forEach((el) => el.remove());
    }

    renderWeaponSlots();
};

// 호환용 별칭
window.clearCombatObjects = window.cleanupCombatObjects;
window.clearBattleProjectilesAndEffects = window.cleanupCombatObjects;
