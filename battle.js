/* battle.js v8.3.0
   Battle Loop / Player Movement / Joystick / HP / Battle Slots
*/
"use strict";

window.playerX = 1000;
window.playerY = 1000;
window.moveX = 0;
window.moveY = 0;
window.playerHp = 100;
window.playerMaxHp = 100;
window.isInvincible = false;
window.__battleLoopStarted = false;
window.__lastBattleFrame = 0;
window.__joystickBound = false;
window.__keyboardBound = false;

const keyboardState = { up: false, down: false, left: false, right: false };
let joystickPointerId = null;
let joystickActive = false;

function battleFmt(value) { return window.formatNumber ? window.formatNumber(value) : String(Math.floor(Number(value) || 0)); }

function getCurrentMerc() {
  return (window.MERCENARIES || []).find((m) => m.id === window.currentMercenary) || (window.MERCENARIES || [])[0] || { icon: "🧑‍🚀", hp: 800, speed: 1 };
}

function getPlayerSpeed() {
  const merc = getCurrentMerc();
  const spdTrain = Number(window.trainingLevels?.spd) || 0;
  return 3 * (Number(merc.speed) || 1) * (1 + spdTrain * 0.1);
}

function applyPlayerStats() {
  const merc = getCurrentMerc();
  const hpTrain = Number(window.trainingLevels?.hp) || 0;
  window.playerMaxHp = Math.floor((Number(merc.hp) || 800) * (1 + hpTrain * 0.05));
  window.playerHp = window.playerMaxHp;
  const icon = document.getElementById("player-icon");
  if (icon) icon.textContent = "🧑‍⚕️";
  const mercEl = document.getElementById("merc");
  if (mercEl) mercEl.textContent = merc.icon || "🧑‍🚀";
  updatePlayerHpBar();
}

function updatePlayerHpBar() {
  const fill = document.getElementById("player-hp-fill");
  const text = document.getElementById("player-hp-text");
  const ratio = window.playerMaxHp > 0 ? Math.max(0, Math.min(1, window.playerHp / window.playerMaxHp)) : 0;
  if (fill) fill.style.width = `${ratio * 100}%`;
  if (text) text.textContent = `HP ${battleFmt(window.playerHp)} / ${battleFmt(window.playerMaxHp)}`;
}

function renderBattleSlots() {
  const wrap = document.getElementById("war-weapon-slots") || document.getElementById("battle-bottom-slots");
  if (!wrap) return;
  const top = window.BALANCE?.TOP_SLOT_COUNT || 8;
  const inv = Array.isArray(window.inventory) ? window.inventory : [];
  wrap.innerHTML = Array.from({ length: top }, (_, index) => {
    const lv = Number(inv[index]) || 0;
    if (!lv) return `<div class="battle-slot empty"><span class="emoji">—</span><span class="lv">EMPTY</span></div>`;
    const emoji = window.getSimpleToothEmoji ? window.getSimpleToothEmoji(lv) : "🦷";
    const levelText = window.getToothDisplayLevel ? window.getToothDisplayLevel(lv) : `Lv.${lv}`;
    const atk = window.getBaseAttackByLevel ? window.getBaseAttackByLevel(lv) : lv * 10;
    return `<div class="battle-slot"><span class="emoji">${emoji}</span><span class="lv">${levelText}</span><span class="atk">${battleFmt(atk)}</span></div>`;
  }).join("");
  applyPlayerStats();
  if (!window.__battleLoopStarted) {
    window.__battleLoopStarted = true;
    requestAnimationFrame(battleLoop);
  }
}

function battleLoop(timestamp) {
  requestAnimationFrame(battleLoop);
  if (!window.dungeonActive || window.dungeonPaused || window.bossDead) return;
  if (timestamp - (window.__lastBattleFrame || 0) < 16) return;
  window.__lastBattleFrame = timestamp;
  updateKeyboardMoveVector();
  updatePlayerPosition();
  if (typeof window.updateCombat === "function") window.updateCombat();
}

function updatePlayerPosition() {
  const player = document.getElementById("player");
  const world = document.getElementById("battle-world");
  if (!player || !world) return;
  const dx = Number(window.moveX) || 0;
  const dy = Number(window.moveY) || 0;
  const len = Math.sqrt(dx * dx + dy * dy) || 0;
  if (len > 0.01) {
    const speed = getPlayerSpeed();
    window.playerX += (dx / len) * speed;
    window.playerY += (dy / len) * speed;
  }
  window.playerX = Math.max(40, Math.min(1960, window.playerX));
  window.playerY = Math.max(40, Math.min(1960, window.playerY));
  player.style.transform = `translate(${window.playerX}px, ${window.playerY}px)`;
  const merc = document.getElementById("merc");
  if (merc) merc.style.transform = `translate(${window.playerX + 38}px, ${window.playerY + 36}px)`;
  moveBattleCamera();
}

function moveBattleCamera() {
  const world = document.getElementById("battle-world");
  const screen = document.getElementById("battle-screen");
  if (!world || !screen) return;
  const rect = screen.getBoundingClientRect();
  const tx = rect.width / 2 - window.playerX;
  const ty = rect.height / 2 - window.playerY;
  world.style.transform = `translate(${tx}px, ${ty}px)`;
}

function takeDamage(amount) {
  if (!window.dungeonActive || window.dungeonPaused || window.isInvincible) return;
  const dmg = Math.max(1, Math.floor(Number(amount) || 0));
  window.playerHp = Math.max(0, window.playerHp - dmg);
  updatePlayerHpBar();
  const player = document.getElementById("player");
  if (player) {
    player.classList.add("player-hit");
    setTimeout(() => player.classList.remove("player-hit"), 180);
  }
  window.isInvincible = true;
  setTimeout(() => { window.isInvincible = false; }, 500);
  if (window.playerHp <= 0) window.handlePlayerDeath?.();
}

function resetBattlePlayerState() {
  window.playerX = 1000;
  window.playerY = 1000;
  window.moveX = 0;
  window.moveY = 0;
  window.isInvincible = false;
  resetJoystick();
  applyPlayerStats();
  setTimeout(() => { updatePlayerPosition(); moveBattleCamera(); }, 30);
}

function setupJoystick() {
  if (window.__joystickBound) return;
  const zone = document.getElementById("joystick-zone");
  const knob = document.getElementById("joystick-knob");
  if (!zone || !knob) return;
  window.__joystickBound = true;
  function updateJoystick(e) {
    const rect = zone.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const max = rect.width / 2 - 23;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    if (len > max) { dx = (dx / len) * max; dy = (dy / len) * max; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    window.moveX = dx / max;
    window.moveY = dy / max;
  }
  zone.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    joystickActive = true;
    joystickPointerId = e.pointerId;
    zone.setPointerCapture?.(e.pointerId);
    updateJoystick(e);
  }, { passive: false });
  zone.addEventListener("pointermove", (e) => {
    if (!joystickActive || e.pointerId !== joystickPointerId) return;
    e.preventDefault();
    updateJoystick(e);
  }, { passive: false });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((eventName) => {
    zone.addEventListener(eventName, (e) => {
      if (joystickPointerId !== null && e.pointerId !== joystickPointerId && eventName !== "lostpointercapture") return;
      resetJoystick();
    });
  });
}

function resetJoystick() {
  joystickActive = false;
  joystickPointerId = null;
  window.moveX = 0;
  window.moveY = 0;
  const knob = document.getElementById("joystick-knob");
  if (knob) knob.style.transform = "translate(0px, 0px)";
}

function setupKeyboardControls() {
  if (window.__keyboardBound) return;
  window.__keyboardBound = true;
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") keyboardState.up = true;
    if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") keyboardState.down = true;
    if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") keyboardState.left = true;
    if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") keyboardState.right = true;
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") keyboardState.up = false;
    if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") keyboardState.down = false;
    if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") keyboardState.left = false;
    if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") keyboardState.right = false;
  });
}

function updateKeyboardMoveVector() {
  const x = (keyboardState.right ? 1 : 0) - (keyboardState.left ? 1 : 0);
  const y = (keyboardState.down ? 1 : 0) - (keyboardState.up ? 1 : 0);
  if (x || y) { window.moveX = x; window.moveY = y; }
}

window.renderBattleSlots = renderBattleSlots;
window.applyPlayerStats = applyPlayerStats;
window.updatePlayerHpBar = updatePlayerHpBar;
window.takeDamage = takeDamage;
window.resetBattlePlayerState = resetBattlePlayerState;
window.setupJoystick = setupJoystick;
window.resetJoystick = resetJoystick;
window.setupKeyboardControls = setupKeyboardControls;
window.updateKeyboardMoveVector = updateKeyboardMoveVector;
console.log("치아 연대기 battle.js loaded v8.3.0");
