/* combat.js v8.2.0
   치아 연대기 - 던전 / 적 / 전투 / 보상 / 후퇴
   핵심:
   - 던전별 바닥 타일 배경 적용
   - Lv.MAX 초월 왕관 치아 공격력 반영
   - 후퇴 확인 모달 유지
   - HELL / 보스 / 일반 던전 테마 분리
*/

"use strict";

/* =========================
   전투 전역 상태
========================= */

window.dungeonActive = false;
window.dungeonPaused = false;
window.bossDead = false;

window.currentDungeon = null;
window.battleEnemies = [];
window.battleEnemyBullets = [];
window.battlePlayerProjectiles = [];
window.battleEffects = [];

window.currentWave = 1;
window.maxWave = 5;
window.bossRushKills = 0;

/* =========================
   유틸
========================= */

function combatFmt(value) {
  if (typeof window.formatNumber === "function") return window.formatNumber(value);
  if (typeof window.fmt === "function") return window.fmt(value);
  return String(Math.floor(Number(value) || 0));
}

function combatToast(message, type = "info", duration = 1700) {
  if (typeof window.showToast === "function") {
    window.showToast(message, type, duration);
  } else {
    console.log(message);
  }
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function dist(a, b) {
  const dx = (a.x || 0) - (b.x || 0);
  const dy = (a.y || 0) - (b.y || 0);
  return Math.sqrt(dx * dx + dy * dy);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getBattleWorld() {
  return document.getElementById("battle-world") || document.getElementById("battle-field");
}

function getBattleScreen() {
  return document.getElementById("battle-screen") || document.getElementById("battle-view");
}

function getGameContainer() {
  return document.getElementById("game-container") || document.getElementById("app") || document.body;
}

function setBattleText(text) {
  const candidates = [
    document.getElementById("battle-title"),
    document.getElementById("battle-status"),
    document.getElementById("battle-info")
  ].filter(Boolean);

  candidates.forEach((el) => {
    el.textContent = text;
  });
}

function setBattleSubText(text) {
  const candidates = [
    document.getElementById("battle-subtitle"),
    document.getElementById("battle-substatus"),
    document.getElementById("wave-info")
  ].filter(Boolean);

  candidates.forEach((el) => {
    el.textContent = text;
  });
}

/* =========================
   던전 테마
========================= */

function clearDungeonThemeClasses(el) {
  if (!el) return;

  const removeList = [];

  el.classList.forEach((cls) => {
    if (cls.startsWith("dungeon-theme-")) {
      removeList.push(cls);
    }
  });

  removeList.forEach((cls) => el.classList.remove(cls));
}

function applyDungeonTheme(stage, mode) {
  const world = getBattleWorld();
  const screen = getBattleScreen();

  const themeClass =
    typeof window.getDungeonThemeClass === "function"
      ? window.getDungeonThemeClass(stage, mode)
      : "dungeon-theme-forest";

  [world, screen].forEach((el) => {
    if (!el) return;
    clearDungeonThemeClasses(el);
    el.classList.add(themeClass);
  });

  return themeClass;
}

/* =========================
   던전 데이터 선택
========================= */

function getDungeonModeText(mode) {
  if (mode === "boss") return "보스전";
  if (mode === "hell") return "HELL";
  if (mode === "hellboss") return "HELL 보스";
  return "일반 던전";
}

function getStagePower(stage, mode) {
  const s = Math.max(1, Number(stage) || 1);

  if (mode === "hellboss") return 80 + s * 18;
  if (mode === "hell") return 42 + s * 12;
  if (mode === "boss") return 18 + s * 8;

  return 1 + s * 1.45;
}

function getNormalMob(stage) {
  const mobs = window.TOOTH_DATA?.dungeonMobs || [];
  if (!mobs.length) {
    return {
      name: "충치균",
      icon: "🦠",
      hp: 100,
      atk: 10,
      speed: 0.5,
      reward: 10
    };
  }

  const index = Math.min(mobs.length - 1, Math.floor((Math.max(1, stage) - 1) / 2));
  return mobs[index];
}

function getHellMob(stage) {
  const mobs = window.TOOTH_DATA?.hellMobs || [];
  if (!mobs.length) {
    return {
      name: "HELL 충치균",
      icon: "😈",
      hp: 50000,
      atk: 900,
      speed: 0.7,
      reward: 25000
    };
  }

  const index = Math.min(mobs.length - 1, Math.floor((Math.max(1, stage) - 1) / 3));
  return mobs[index];
}

function getBossData(stage, mode) {
  const list =
    mode === "hellboss"
      ? window.TOOTH_DATA?.hellBosses || []
      : window.TOOTH_DATA?.bosses || [];

  if (!list.length) {
    return {
      name: mode === "hellboss" ? "HELL 보스" : "보스",
      icon: mode === "hellboss" ? "💀" : "👑",
      hp: 10000,
      atk: 100,
      reward: 1000,
      token: 1
    };
  }

  const index = Math.min(list.length - 1, Math.max(0, Number(stage) - 1));
  return list[index];
}

/* =========================
   전투 화면 준비
========================= */

function showBattleScreen() {
  const game = getGameContainer();
  const battle = getBattleScreen();

  if (game) game.classList.add("battle-active");

  if (battle) {
    battle.style.display = "block";
    battle.classList.add("active");
  }

  const mine = document.getElementById("mine-view");
  const refine = document.getElementById("refine-view");
  const war = document.getElementById("war-view");

  [mine, refine, war].forEach((el) => {
    if (el) el.style.display = "none";
  });
}

function hideBattleScreen() {
  const game = getGameContainer();
  const battle = getBattleScreen();

  if (game) game.classList.remove("battle-active");

  if (battle) {
    battle.style.display = "none";
    battle.classList.remove("active");
  }

  if (typeof window.switchView === "function") {
    window.switchView("war");
  } else {
    const war = document.getElementById("war-view");
    if (war) war.style.display = "block";
  }
}

function prepareBattleWorld() {
  const world = getBattleWorld();
  if (!world) return;

  world.innerHTML = `
    <div id="battle-tile-layer"></div>
    <div id="battle-effect-layer"></div>
    <div id="battle-enemy-layer"></div>
    <div id="battle-projectile-layer"></div>
    <div id="player-char" class="battle-player">🧑‍⚕️</div>
    <div id="merc-char" class="battle-merc">🧑‍🚀</div>
  `;
}

function resetBattleStateForDungeon(stage, mode) {
  window.currentDungeon = {
    stage: Number(stage) || 1,
    mode: mode || "normal",
    startedAt: Date.now()
  };

  window.dungeonActive = true;
  window.dungeonPaused = false;
  window.bossDead = false;

  window.battleEnemies = [];
  window.battleEnemyBullets = [];
  window.battlePlayerProjectiles = [];
  window.battleEffects = [];

  window.currentWave = 1;
  window.maxWave = mode === "normal" || !mode ? 5 : 1;
  window.bossRushKills = 0;

  if (typeof window.resetBattlePlayerState === "function") {
    window.resetBattlePlayerState();
  }

  if (typeof window.renderBattleSlots === "function") {
    window.renderBattleSlots();
  }
}

/* =========================
   던전 시작
========================= */

function startDungeon(stage, mode = "normal") {
  const s = Math.max(1, Number(stage) || 1);
  const m = mode || "normal";

  if (window.dungeonActive) {
    combatToast("이미 던전 진행 중입니다.", "info");
    return;
  }

  if (m === "hell" || m === "hellboss") {
    if (!window.hellUnlocked && !window.hasSeenHellIntro) {
      if (typeof window.unlockHellIfNeeded === "function") {
        window.unlockHellIfNeeded();
      } else {
        window.hellUnlocked = true;
        window.hasSeenHellIntro = true;
      }
    }
  }

  showBattleScreen();
  prepareBattleWorld();
  applyDungeonTheme(s, m);
  resetBattleStateForDungeon(s, m);

  setBattleText(`${getDungeonModeText(m)} ${s}`);
  setBattleSubText("전투 시작");

  spawnWave();

  if (!window.__combatTimer) {
    window.__combatTimer = setInterval(updateCombat, 50);
  }
}

function startNormalDungeon(stage) {
  startDungeon(stage || window.unlockedStage || 1, "normal");
}

function startBossDungeon(stage) {
  startDungeon(stage || window.unlockedBossStage || 1, "boss");
}

function startHellDungeon(stage) {
  startDungeon(stage || 1, "hell");
}

function startHellBossDungeon(stage) {
  startDungeon(stage || 1, "hellboss");
}

/* =========================
   적 생성
========================= */

function spawnWave() {
  if (!window.dungeonActive || window.dungeonPaused || window.bossDead) return;

  const dungeon = window.currentDungeon || { stage: 1, mode: "normal" };
  const mode = dungeon.mode || "normal";
  const stage = Number(dungeon.stage) || 1;

  if (mode === "boss" || mode === "hellboss") {
    spawnBoss(stage, mode);
    setBattleSubText("보스전");
    return;
  }

  const mobBase = mode === "hell" ? getHellMob(stage) : getNormalMob(stage);
  const power = getStagePower(stage, mode);
  const count = mode === "hell" ? 4 + Math.min(8, stage) : 4 + Math.min(10, stage + window.currentWave);

  for (let i = 0; i < count; i += 1) {
    spawnEnemy({
      name: mobBase.name,
      icon: mobBase.icon,
      hp: Math.floor((mobBase.hp || 100) * power * (0.75 + window.currentWave * 0.22)),
      atk: Math.floor((mobBase.atk || 10) * power * (0.65 + window.currentWave * 0.12)),
      speed: (mobBase.speed || 0.5) * (mode === "hell" ? 1.1 : 1),
      reward: Math.floor((mobBase.reward || 10) * power),
      isBoss: false
    });
  }

  setBattleSubText(`Wave ${window.currentWave} / ${window.maxWave}`);
}

function spawnBoss(stage, mode) {
  const boss = getBossData(stage, mode);
  const power = getStagePower(stage, mode);

  spawnEnemy({
    name: boss.name,
    icon: boss.icon,
    hp: Math.floor((boss.hp || 10000) * power),
    atk: Math.floor((boss.atk || 100) * power),
    speed: mode === "hellboss" ? 0.55 : 0.48,
    reward: Math.floor((boss.reward || 1000) * power),
    token: boss.token || 1,
    isBoss: true
  });
}

function spawnEnemy(data) {
  const world = getBattleWorld();
  if (!world) return;

  const layer = document.getElementById("battle-enemy-layer") || world;

  const angle = Math.random() * Math.PI * 2;
  const radius = rand(260, 430);

  const enemy = {
    id: `enemy_${Date.now()}_${Math.floor(Math.random() * 999999)}`,
    name: data.name || "적",
    icon: data.icon || "🦠",
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    hp: Number(data.hp) || 100,
    maxHp: Number(data.hp) || 100,
    atk: Number(data.atk) || 10,
    speed: Number(data.speed) || 0.5,
    reward: Number(data.reward) || 10,
    token: Number(data.token) || 0,
    isBoss: !!data.isBoss,
    attackCooldown: 0,
    dead: false
  };

  const el = document.createElement("div");
  el.className = `battle-enemy ${enemy.isBoss ? "boss-enemy" : ""}`;
  el.dataset.enemyId = enemy.id;
  el.innerHTML = `
    <div class="enemy-icon">${enemy.icon}</div>
    <div class="enemy-hp">
      <div class="enemy-hp-fill"></div>
    </div>
  `;

  layer.appendChild(el);

  enemy.el = el;

  window.battleEnemies.push(enemy);

  updateEnemyElement(enemy);
}

function updateEnemyElement(enemy) {
  if (!enemy || !enemy.el) return;

  enemy.el.style.transform = `translate(${enemy.x}px, ${enemy.y}px)`;

  const fill = enemy.el.querySelector(".enemy-hp-fill");
  if (fill) {
    const ratio = enemy.maxHp > 0 ? clamp(enemy.hp / enemy.maxHp, 0, 1) : 0;
    fill.style.width = `${ratio * 100}%`;
  }
}

/* =========================
   플레이어 / 무기 능력 계산
========================= */

function getPlayerCenter() {
  if (window.player && typeof window.player.x === "number") {
    return {
      x: window.player.x,
      y: window.player.y
    };
  }

  return {
    x: 0,
    y: 0
  };
}

function getTopAttackSlots() {
  const topCount = window.BALANCE?.TOP_SLOT_COUNT || 8;
  const inventory = Array.isArray(window.inventory) ? window.inventory : [];

  return inventory.slice(0, topCount).map((lv, index) => ({
    index,
    level: Number(lv) || 0,
    upgrade: window.slotUpgrades?.[index] || { atk: 0, cd: 0, rng: 0 },
    lastShot: window.__slotShotTimes?.[index] || 0
  }));
}

function getSlotDamage(slot) {
  const lv = Number(slot.level) || 0;
  if (!lv) return 0;

  const base =
    typeof window.getBaseAttackByLevel === "function"
      ? window.getBaseAttackByLevel(lv)
      : typeof window.getAtk === "function"
      ? window.getAtk(lv)
      : lv * 10;

  const slotBonus = 1 + (Number(slot.upgrade?.atk) || 0) * 0.08;
  const trainingBonus = 1 + (Number(window.trainingLevels?.atk) || 0) * 0.025;

  const merc =
    (window.MERCENARIES || []).find((m) => m.id === window.currentMercenary) ||
    (window.MERCENARIES || [])[0] ||
    { atkRate: 1 };

  const mercBonus = Number(merc.atkRate) || 1;

  return Math.floor(base * slotBonus * trainingBonus * mercBonus);
}

function getSlotRange(slot) {
  const base = 210;
  const slotBonus = (Number(slot.upgrade?.rng) || 0) * 9;
  const globalBonus = (Number(window.globalUpgrades?.rng) || 0) * 8;

  return base + slotBonus + globalBonus;
}

function getSlotCooldown(slot) {
  const base = 950;
  const slotCd = (Number(slot.upgrade?.cd) || 0) * 32;
  const globalCd = (Number(window.globalUpgrades?.cd) || 0) * 28;
  const spdTrain = (Number(window.trainingLevels?.spd) || 0) * 10;

  return Math.max(230, base - slotCd - globalCd - spdTrain);
}

/* =========================
   전투 업데이트
========================= */

function updateCombat() {
  if (!window.dungeonActive) return;

  if (window.dungeonPaused) {
    setBattleSubText("일시정지");
    return;
  }

  updateEnemies();
  updateAutoAttack();
  updatePlayerProjectiles();
  updateEnemyBullets();
  checkWaveClear();
}

function updateEnemies() {
  const player = getPlayerCenter();

  window.battleEnemies.forEach((enemy) => {
    if (!enemy || enemy.dead) return;

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;

    enemy.x += (dx / d) * enemy.speed * 2.2;
    enemy.y += (dy / d) * enemy.speed * 2.2;

    enemy.attackCooldown = Math.max(0, (enemy.attackCooldown || 0) - 50);

    if (d < 38 && enemy.attackCooldown <= 0) {
      enemy.attackCooldown = enemy.isBoss ? 900 : 1300;
      damagePlayer(enemy.atk);
      showHitEffect(player.x, player.y, "💢");
    }

    updateEnemyElement(enemy);
  });
}

function updateAutoAttack() {
  if (!window.__slotShotTimes) {
    window.__slotShotTimes = {};
  }

  const now = Date.now();
  const slots = getTopAttackSlots();

  slots.forEach((slot) => {
    if (!slot.level) return;

    const cd = getSlotCooldown(slot);
    const last = window.__slotShotTimes[slot.index] || 0;

    if (now - last < cd) return;

    const target = findNearestEnemyInRange(getSlotRange(slot));

    if (!target) return;

    window.__slotShotTimes[slot.index] = now;

    shootToothProjectile(slot, target);
  });
}

function findNearestEnemyInRange(range) {
  const player = getPlayerCenter();

  let best = null;
  let bestDist = Infinity;

  window.battleEnemies.forEach((enemy) => {
    if (!enemy || enemy.dead) return;

    const d = dist(player, enemy);

    if (d <= range && d < bestDist) {
      best = enemy;
      bestDist = d;
    }
  });

  return best;
}

function shootToothProjectile(slot, target) {
  const world = getBattleWorld();
  if (!world || !target) return;

  const layer = document.getElementById("battle-projectile-layer") || world;
  const player = getPlayerCenter();

  const lv = Number(slot.level) || 1;

  const projectile = {
    id: `proj_${Date.now()}_${Math.floor(Math.random() * 999999)}`,
    x: player.x,
    y: player.y,
    targetId: target.id,
    damage: getSlotDamage(slot),
    speed: 15,
    level: lv,
    splash: lv >= 16,
    max: lv >= (window.BALANCE?.TRANSCEND_LEVEL || 25),
    dead: false
  };

  const emoji =
    typeof window.getToothEmoji === "function"
      ? window.getToothEmoji(lv)
      : "🦷";

  const sizeClass =
    typeof window.getToothSizeClass === "function"
      ? window.getToothSizeClass(lv)
      : "";

  const el = document.createElement("div");
  el.className = `battle-projectile ${sizeClass} ${projectile.max ? "max-projectile" : ""}`;
  el.textContent = emoji;

  layer.appendChild(el);

  projectile.el = el;

  window.battlePlayerProjectiles.push(projectile);

  updateProjectileElement(projectile);
}

function updatePlayerProjectiles() {
  window.battlePlayerProjectiles.forEach((projectile) => {
    if (!projectile || projectile.dead) return;

    const target = window.battleEnemies.find((enemy) => enemy.id === projectile.targetId && !enemy.dead);

    if (!target) {
      projectile.dead = true;
      removeProjectile(projectile);
      return;
    }

    const dx = target.x - projectile.x;
    const dy = target.y - projectile.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;

    projectile.x += (dx / d) * projectile.speed;
    projectile.y += (dy / d) * projectile.speed;

    if (d < 22) {
      hitEnemy(target, projectile.damage, projectile);
      projectile.dead = true;
      removeProjectile(projectile);
      return;
    }

    updateProjectileElement(projectile);
  });

  window.battlePlayerProjectiles = window.battlePlayerProjectiles.filter((p) => !p.dead);
}

function updateProjectileElement(projectile) {
  if (!projectile || !projectile.el) return;

  projectile.el.style.transform = `translate(${projectile.x}px, ${projectile.y}px)`;
}

function removeProjectile(projectile) {
  if (projectile?.el?.parentNode) {
    projectile.el.parentNode.removeChild(projectile.el);
  }
}

/* =========================
   피해 / 처치
========================= */

function hitEnemy(enemy, damage, projectile) {
  if (!enemy || enemy.dead) return;

  const critChance = Math.min(0.35, (Number(window.trainingLevels?.crit) || 0) * 0.006);
  const isCrit = Math.random() < critChance;

  let finalDamage = Number(damage) || 1;

  if (isCrit) {
    finalDamage = Math.floor(finalDamage * 1.8);
  }

  enemy.hp -= finalDamage;

  showDamageText(enemy.x, enemy.y, isCrit ? `CRIT ${combatFmt(finalDamage)}` : combatFmt(finalDamage), isCrit);

  if (projectile?.splash || projectile?.max) {
    applySplashDamage(enemy, finalDamage, projectile);
  }

  if (enemy.hp <= 0) {
    killEnemy(enemy);
  } else {
    updateEnemyElement(enemy);
  }
}

function applySplashDamage(centerEnemy, damage, projectile) {
  const baseRange = projectile?.max ? 95 : 58;
  const range = baseRange + (Number(window.trainingLevels?.splashRange) || 0) * 2.5;
  const ratio = projectile?.max ? 0.55 : 0.28 + (Number(window.trainingLevels?.splashDmg) || 0) * 0.006;

  window.battleEnemies.forEach((enemy) => {
    if (!enemy || enemy.dead || enemy.id === centerEnemy.id) return;

    const d = dist(centerEnemy, enemy);

    if (d <= range) {
      const splashDamage = Math.floor(damage * ratio);
      enemy.hp -= splashDamage;
      showDamageText(enemy.x, enemy.y, combatFmt(splashDamage), false, "splash");

      if (enemy.hp <= 0) {
        killEnemy(enemy);
      } else {
        updateEnemyElement(enemy);
      }
    }
  });

  showHitEffect(centerEnemy.x, centerEnemy.y, projectile?.max ? "✨" : "💥");
}

function killEnemy(enemy) {
  if (!enemy || enemy.dead) return;

  enemy.dead = true;

  if (enemy.el?.parentNode) {
    enemy.el.classList.add("enemy-dead");
    setTimeout(() => {
      if (enemy.el?.parentNode) enemy.el.parentNode.removeChild(enemy.el);
    }, 220);
  }

  const reward = Number(enemy.reward) || 0;

  if (typeof window.addGold === "function") {
    window.addGold(reward);
  } else {
    window.gold = (Number(window.gold) || 0) + reward;
  }

  if (enemy.token) {
    if (typeof window.addBossToken === "function") {
      window.addBossToken(enemy.token);
    } else {
      window.bossToken = (Number(window.bossToken) || 0) + enemy.token;
    }
  }

  maybeDropArtifact(enemy);

  showFloatingBattleReward(enemy.x, enemy.y, `+${combatFmt(reward)}G`);

  window.battleEnemies = window.battleEnemies.filter((e) => !e.dead);
}

function damagePlayer(amount) {
  if (typeof window.takeDamage === "function") {
    window.takeDamage(amount);
    return;
  }

  if (!window.player) {
    window.player = { hp: 1000, maxHp: 1000 };
  }

  window.player.hp -= Number(amount) || 0;

  if (window.player.hp <= 0) {
    window.player.hp = 0;
    handlePlayerDeath();
  }
}

function handlePlayerDeath() {
  if (!window.dungeonActive) return;

  window.dungeonPaused = true;

  setTimeout(() => {
    alert("던전에서 쓰러졌습니다.");
    exitDungeon(false);
  }, 100);
}

/* =========================
   적 탄환 - 현재는 보조용
========================= */

function updateEnemyBullets() {
  if (!Array.isArray(window.battleEnemyBullets)) {
    window.battleEnemyBullets = [];
  }
}

/* =========================
   웨이브 클리어 / 던전 종료
========================= */

function checkWaveClear() {
  if (!window.dungeonActive || window.dungeonPaused) return;

  if (window.battleEnemies.length > 0) return;

  const dungeon = window.currentDungeon || { stage: 1, mode: "normal" };
  const mode = dungeon.mode || "normal";

  if (mode === "boss" || mode === "hellboss") {
    finishDungeon(true);
    return;
  }

  if (window.currentWave < window.maxWave) {
    window.currentWave += 1;
    setTimeout(() => {
      if (window.dungeonActive && !window.dungeonPaused) {
        spawnWave();
      }
    }, 600);
    return;
  }

  finishDungeon(true);
}

function finishDungeon(success) {
  if (!window.dungeonActive) return;

  const dungeon = window.currentDungeon || { stage: 1, mode: "normal" };
  const stage = Number(dungeon.stage) || 1;
  const mode = dungeon.mode || "normal";

  window.dungeonActive = false;
  window.dungeonPaused = false;

  if (success) {
    handleDungeonClear(stage, mode);
  }

  cleanupBattleObjects();

  if (typeof window.saveGame === "function") {
    window.saveGame(false);
  }

  if (typeof window.renderDungeonList === "function") {
    window.renderDungeonList();
  }

  if (typeof window.updateUI === "function") {
    window.updateUI();
  }

  const rewardText = success ? "클리어!" : "후퇴했습니다.";

  if (typeof window.showResultModal === "function") {
    window.showResultModal({
      success,
      title: success ? "던전 클리어!" : "후퇴 완료",
      message: rewardText,
      stage,
      mode
    });
  } else {
    combatToast(rewardText, success ? "success" : "info", 2200);
    hideBattleScreen();
  }
}

function handleDungeonClear(stage, mode) {
  if (mode === "normal") {
    window.clearedStage = Math.max(Number(window.clearedStage) || 0, stage);
    window.unlockedStage = Math.max(Number(window.unlockedStage) || 1, stage + 1);

    if (stage >= 20 && !window.hellUnlocked) {
      if (typeof window.unlockHellIfNeeded === "function") {
        window.unlockHellIfNeeded();
      } else {
        window.hellUnlocked = true;
        window.hasSeenHellIntro = true;
      }
    }
  }

  if (mode === "boss") {
    window.unlockedBossStage = Math.max(Number(window.unlockedBossStage) || 1, stage + 1);

    if (stage >= 5 && !window.hellUnlocked) {
      if (typeof window.unlockHellIfNeeded === "function") {
        window.unlockHellIfNeeded();
      } else {
        window.hellUnlocked = true;
        window.hasSeenHellIntro = true;
      }
    }
  }

  if (mode === "hell" || mode === "hellboss") {
    window.hellUnlocked = true;
    window.hasSeenHellIntro = true;
  }
}

function cleanupBattleObjects() {
  window.battleEnemies.forEach((enemy) => {
    if (enemy.el?.parentNode) enemy.el.parentNode.removeChild(enemy.el);
  });

  window.battlePlayerProjectiles.forEach((projectile) => {
    if (projectile.el?.parentNode) projectile.el.parentNode.removeChild(projectile.el);
  });

  window.battleEnemies = [];
  window.battlePlayerProjectiles = [];
  window.battleEnemyBullets = [];
  window.battleEffects = [];

  const world = getBattleWorld();
  if (world) {
    const enemyLayer = document.getElementById("battle-enemy-layer");
    const projLayer = document.getElementById("battle-projectile-layer");
    const effectLayer = document.getElementById("battle-effect-layer");

    if (enemyLayer) enemyLayer.innerHTML = "";
    if (projLayer) projLayer.innerHTML = "";
    if (effectLayer) effectLayer.innerHTML = "";
  }
}

function exitDungeon(showToastMessage = true) {
  window.dungeonActive = false;
  window.dungeonPaused = false;
  window.bossDead = false;

  cleanupBattleObjects();
  hideBattleScreen();

  if (showToastMessage) {
    combatToast("던전에서 나왔습니다.", "info");
  }

  if (typeof window.saveGame === "function") {
    window.saveGame(false);
  }
}

/* =========================
   후퇴 확인
========================= */

function requestRetreat() {
  if (!window.dungeonActive) {
    exitDungeon(false);
    return;
  }

  window.dungeonPaused = true;

  if (typeof window.resetJoystick === "function") {
    window.resetJoystick();
  }

  const modal = document.getElementById("retreat-confirm-modal");

  if (modal) {
    modal.style.display = "flex";
    modal.classList.add("active");
    return;
  }

  const html = `
    <div class="retreat-modal-inner">
      <h2>🏳️ 후퇴하시겠습니까?</h2>
      <p>현재 던전 진행을 중단하고 밖으로 나갑니다.</p>
      <div class="modal-actions">
        <button class="btn-main" onclick="cancelRetreat()">계속 싸우기</button>
        <button class="btn-danger" onclick="confirmRetreat()">후퇴하기</button>
      </div>
    </div>
  `;

  if (typeof window.openGenericModal === "function") {
    window.openGenericModal(html);
  } else {
    const ok = confirm("후퇴하시겠습니까?");
    if (ok) confirmRetreat();
    else cancelRetreat();
  }
}

function cancelRetreat() {
  window.dungeonPaused = false;

  const modal = document.getElementById("retreat-confirm-modal");

  if (modal) {
    modal.style.display = "none";
    modal.classList.remove("active");
  }

  if (typeof window.closeGenericModal === "function") {
    window.closeGenericModal();
  }
}

function confirmRetreat() {
  const modal = document.getElementById("retreat-confirm-modal");

  if (modal) {
    modal.style.display = "none";
    modal.classList.remove("active");
  }

  if (typeof window.closeGenericModal === "function") {
    window.closeGenericModal();
  }

  finishDungeon(false);
}

/* =========================
   유물 드랍
========================= */

function maybeDropArtifact(enemy) {
  const artifacts = window.TOOTH_DATA?.artifacts || [];
  if (!artifacts.length) return;

  let chance = enemy?.isBoss ? 0.32 : 0.035;

  if (window.currentDungeon?.mode === "hell") chance += 0.04;
  if (window.currentDungeon?.mode === "hellboss") chance += 0.18;

  if (Math.random() > chance) return;

  const index = Math.floor(Math.random() * artifacts.length);
  const artifact = artifacts[index];

  if (!artifact) return;

  const id = artifact.id || artifact.name || `artifact_${index}`;

  if (!window.discoveredArtifacts) window.discoveredArtifacts = {};
  if (!window.artifactCounts) window.artifactCounts = {};

  window.discoveredArtifacts[id] = true;
  window.artifactCounts[id] = (Number(window.artifactCounts[id]) || 0) + 1;

  combatToast(`${artifact.icon || "🏺"} ${artifact.name || "유물"} 획득!`, "success", 2200);
}

/* =========================
   전투 이펙트
========================= */

function showDamageText(x, y, text, crit = false, extraClass = "") {
  const world = getBattleWorld();
  if (!world) return;

  const layer = document.getElementById("battle-effect-layer") || world;

  const el = document.createElement("div");
  el.className = `damage-text ${crit ? "crit" : ""} ${extraClass}`;
  el.textContent = text;
  el.style.transform = `translate(${x}px, ${y}px)`;

  layer.appendChild(el);

  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 750);
}

function showHitEffect(x, y, icon) {
  const world = getBattleWorld();
  if (!world) return;

  const layer = document.getElementById("battle-effect-layer") || world;

  const el = document.createElement("div");
  el.className = "hit-effect";
  el.textContent = icon || "💥";
  el.style.transform = `translate(${x}px, ${y}px)`;

  layer.appendChild(el);

  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 520);
}

function showFloatingBattleReward(x, y, text) {
  const world = getBattleWorld();
  if (!world) return;

  const layer = document.getElementById("battle-effect-layer") || world;

  const el = document.createElement("div");
  el.className = "battle-reward-text";
  el.textContent = text;
  el.style.transform = `translate(${x}px, ${y}px)`;

  layer.appendChild(el);

  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 850);
}

/* =========================
   다음 / 재도전
========================= */

function retryDungeon() {
  const dungeon = window.currentDungeon || { stage: 1, mode: "normal" };

  if (typeof window.closeResultModal === "function") {
    window.closeResultModal();
  }

  hideBattleScreen();

  setTimeout(() => {
    startDungeon(dungeon.stage, dungeon.mode);
  }, 100);
}

function nextDungeon() {
  const dungeon = window.currentDungeon || { stage: 1, mode: "normal" };
  let nextStage = Number(dungeon.stage) || 1;

  if (dungeon.mode === "normal" || dungeon.mode === "hell") {
    nextStage += 1;
  }

  if (typeof window.closeResultModal === "function") {
    window.closeResultModal();
  }

  hideBattleScreen();

  setTimeout(() => {
    startDungeon(nextStage, dungeon.mode);
  }, 100);
}

/* =========================
   전역 노출
========================= */

window.applyDungeonTheme = applyDungeonTheme;

window.startDungeon = startDungeon;
window.startNormalDungeon = startNormalDungeon;
window.startBossDungeon = startBossDungeon;
window.startHellDungeon = startHellDungeon;
window.startHellBossDungeon = startHellBossDungeon;

window.spawnWave = spawnWave;
window.updateCombat = updateCombat;

window.requestRetreat = requestRetreat;
window.cancelRetreat = cancelRetreat;
window.confirmRetreat = confirmRetreat;
window.exitDungeon = exitDungeon;

window.retryDungeon = retryDungeon;
window.nextDungeon = nextDungeon;

console.log("치아 연대기 combat.js loaded v8.2.0");
