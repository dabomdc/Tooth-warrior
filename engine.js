/* engine.js v8.3.0
   저장 / 로드 / 초기화 / 영상 시스템
   - 인트로 영상 후 도트 타이틀 카드 표시
   - SKIP은 바로 게임 시작이 아니라 타이틀 카드로 이동
   - 타이틀 카드에서 한 번 더 터치하면 게임 시작
*/
"use strict";

window.SAVE_KEY = "toothChronicleSave_v8_3";
window.LEGACY_SAVE_KEYS = [
  "toothChronicleSave_v8_2",
  "toothChronicleSave_v8_1",
  "toothChronicleSave_v8",
  "toothChronicleSave",
  "toothChronicle",
  "dentalGameSave",
  "toothGameSave"
];

function createDefaultInventory() {
  const size = window.BALANCE?.BASE_INVENTORY_SIZE || 56;
  const arr = Array(size).fill(0);
  arr[0] = 1;
  arr[1] = 1;
  arr[2] = 2;
  arr[3] = 2;
  return arr;
}

function createDefaultSlotUpgrades() {
  const count = window.BALANCE?.TOP_SLOT_COUNT || 8;
  return Array.from({ length: count }, () => ({ atk: 0, cd: 0, rng: 0 }));
}

function createDefaultDiscoveredTeeth() {
  const max = window.BALANCE?.TRANSCEND_LEVEL || 25;
  const arr = Array(max + 1).fill(false);
  arr[0] = true;
  arr[1] = true;
  arr[2] = true;
  return arr;
}

function createDefaultState() {
  return {
    version: window.GAME_VERSION || "8.3.0",
    gold: 0,
    diamond: 0,
    bossToken: 0,
    inventorySize: window.BALANCE?.BASE_INVENTORY_SIZE || 56,
    inventory: createDefaultInventory(),
    pickaxeLevel: 1,
    autoMineLevel: 0,
    autoMergeLevel: 0,
    greatChanceLevel: 0,
    autoMineOn: false,
    autoMergeOn: false,
    totalMineCount: 0,
    totalMergeCount: 0,
    totalGoldEarned: 0,
    highestToothLevel: 2,
    discoveredTeeth: createDefaultDiscoveredTeeth(),
    discoveredArtifacts: {},
    artifactCounts: {},
    unlockedStage: 1,
    clearedStage: 0,
    unlockedBossStage: 1,
    hellUnlocked: false,
    currentDungeonTab: "normal",
    globalUpgrades: { rng: 0, cd: 0 },
    slotUpgrades: createDefaultSlotUpgrades(),
    ownedMercenaries: [0],
    currentMercenary: 0,
    trainingLevels: { hp: 0, atk: 0, spd: 0, crit: 0, splashDmg: 0, splashRange: 0 },
    hasSeenIntro: false,
    hasSeenHellIntro: false,
    hasSeenTranscendGuide: false,
    hasPlayedAwakenVideo: false,
    settings: { sound: true, vibration: true },
    lastSaveAt: Date.now()
  };
}

function normalizeDiscoveredTeeth(value) {
  const max = window.BALANCE?.TRANSCEND_LEVEL || 25;
  const result = Array(max + 1).fill(false);
  result[0] = true;

  if (Array.isArray(value)) {
    for (let i = 1; i <= max; i += 1) result[i] = !!value[i];
  } else if (value && typeof value === "object") {
    Object.keys(value).forEach((key) => {
      const lv = Number(key);
      if (lv >= 1 && lv <= max) result[lv] = !!value[key];
    });
  }

  if (Array.isArray(window.inventory)) {
    window.inventory.forEach((lv) => {
      const n = Number(lv) || 0;
      if (n >= 1 && n <= max) result[n] = true;
    });
  }

  return result;
}

function normalizeSlotUpgrades(value) {
  const count = window.BALANCE?.TOP_SLOT_COUNT || 8;
  const result = createDefaultSlotUpgrades();

  if (Array.isArray(value)) {
    for (let i = 0; i < count; i += 1) {
      const src = value[i] || {};
      result[i] = {
        atk: Number(src.atk) || 0,
        cd: Number(src.cd) || 0,
        rng: Number(src.rng) || 0
      };
    }
  }

  return result;
}

function normalizeTrainingLevels(value) {
  const result = { hp: 0, atk: 0, spd: 0, crit: 0, splashDmg: 0, splashRange: 0 };
  if (value && typeof value === "object") {
    Object.keys(result).forEach((key) => {
      result[key] = Math.max(0, Number(value[key]) || 0);
    });
  }
  return result;
}

function applyStateToWindow(state) {
  const s = state || createDefaultState();

  window.gold = Number(s.gold) || 0;
  window.diamond = Number(s.diamond ?? s.dia) || 0;
  window.dia = window.diamond;
  window.bossToken = Number(s.bossToken ?? s.bossMarks) || 0;

  window.inventorySize = Number(s.inventorySize) || window.BALANCE?.BASE_INVENTORY_SIZE || 56;
  window.inventory = Array.isArray(s.inventory) ? s.inventory.slice(0, window.inventorySize) : createDefaultInventory();
  while (window.inventory.length < window.inventorySize) window.inventory.push(0);
  window.inventory = window.inventory.map((value) => {
    const lv = Number(value) || 0;
    if (lv <= 0) return 0;
    return Math.max(1, Math.min(window.BALANCE?.TRANSCEND_LEVEL || 25, lv));
  });

  window.pickaxeLevel = Math.max(1, Math.min(window.BALANCE?.PICKAXE_MAX_LEVEL || 8, Number(s.pickaxeLevel ?? s.pickaxeIdx) || 1));
  window.pickaxeIdx = window.pickaxeLevel;

  window.autoMineLevel = Math.max(0, Number(s.autoMineLevel) || 0);
  window.autoMergeLevel = Math.max(0, Number(s.autoMergeLevel) || 0);
  window.greatChanceLevel = Math.max(0, Number(s.greatChanceLevel) || 0);

  window.autoMineOn = !!(s.autoMineOn ?? s.isAutoMineOn);
  window.autoMergeOn = !!(s.autoMergeOn ?? s.isAutoMergeOn);
  window.isAutoMineOn = window.autoMineOn;
  window.isAutoMergeOn = window.autoMergeOn;

  window.totalMineCount = Number(s.totalMineCount) || 0;
  window.totalMergeCount = Number(s.totalMergeCount) || 0;
  window.totalGoldEarned = Number(s.totalGoldEarned) || 0;

  window.highestToothLevel = Math.max(1, Math.min(window.BALANCE?.TRANSCEND_LEVEL || 25, Number(s.highestToothLevel) || 1));
  window.discoveredTeeth = normalizeDiscoveredTeeth(s.discoveredTeeth);

  window.discoveredArtifacts = s.discoveredArtifacts && typeof s.discoveredArtifacts === "object" ? { ...s.discoveredArtifacts } : {};
  window.artifactCounts = s.artifactCounts && typeof s.artifactCounts === "object" ? { ...s.artifactCounts } : {};

  window.unlockedStage = Math.max(1, Number(s.unlockedStage ?? s.unlockedDungeon) || 1);
  window.clearedStage = Math.max(0, Number(s.clearedStage) || 0);
  window.unlockedBossStage = Math.max(1, Number(s.unlockedBossStage) || 1);
  window.hellUnlocked = !!s.hellUnlocked || !!s.hasSeenHellIntro;
  window.unlockedDungeon = window.unlockedStage;
  window.unlockedHellDungeon = window.hellUnlocked ? Math.max(1, Number(s.unlockedHellDungeon) || 1) : 0;

  window.currentDungeonTab = s.currentDungeonTab || "normal";
  window.globalUpgrades = s.globalUpgrades && typeof s.globalUpgrades === "object"
    ? { rng: Number(s.globalUpgrades.rng) || 0, cd: Number(s.globalUpgrades.cd) || 0 }
    : { rng: 0, cd: 0 };
  window.slotUpgrades = normalizeSlotUpgrades(s.slotUpgrades);

  window.ownedMercenaries = Array.isArray(s.ownedMercenaries) ? [...new Set(s.ownedMercenaries.map((v) => Number(v) || 0))] : [0];
  if (!window.ownedMercenaries.includes(0)) window.ownedMercenaries.unshift(0);
  window.currentMercenary = Number(s.currentMercenary ?? s.mercenaryIdx) || 0;
  if (!window.ownedMercenaries.includes(window.currentMercenary)) window.currentMercenary = 0;
  window.mercenaryIdx = window.currentMercenary;

  window.trainingLevels = normalizeTrainingLevels(s.trainingLevels);

  window.hasSeenIntro = !!s.hasSeenIntro;
  window.hasSeenHellIntro = !!s.hasSeenHellIntro;
  window.hasSeenTranscendGuide = !!s.hasSeenTranscendGuide;
  window.hasPlayedAwakenVideo = !!s.hasPlayedAwakenVideo;
  window.settings = s.settings && typeof s.settings === "object" ? { sound: s.settings.sound !== false, vibration: s.settings.vibration !== false } : { sound: true, vibration: true };

  window.dungeonActive = false;
  window.dungeonPaused = false;
  window.bossDead = false;
}

function collectStateFromWindow() {
  window.dia = Number(window.diamond) || 0;
  window.isAutoMineOn = !!window.autoMineOn;
  window.isAutoMergeOn = !!window.autoMergeOn;
  window.pickaxeIdx = Number(window.pickaxeLevel) || 1;
  window.mercenaryIdx = Number(window.currentMercenary) || 0;
  window.unlockedDungeon = Number(window.unlockedStage) || 1;
  window.unlockedHellDungeon = window.hellUnlocked ? Math.max(1, Number(window.unlockedHellDungeon) || 1) : 0;

  return {
    version: window.GAME_VERSION || "8.3.0",
    gold: Number(window.gold) || 0,
    diamond: Number(window.diamond) || 0,
    bossToken: Number(window.bossToken) || 0,
    inventorySize: Number(window.inventorySize) || window.BALANCE?.BASE_INVENTORY_SIZE || 56,
    inventory: Array.isArray(window.inventory) ? [...window.inventory] : createDefaultInventory(),
    pickaxeLevel: Number(window.pickaxeLevel) || 1,
    autoMineLevel: Number(window.autoMineLevel) || 0,
    autoMergeLevel: Number(window.autoMergeLevel) || 0,
    greatChanceLevel: Number(window.greatChanceLevel) || 0,
    autoMineOn: !!window.autoMineOn,
    autoMergeOn: !!window.autoMergeOn,
    totalMineCount: Number(window.totalMineCount) || 0,
    totalMergeCount: Number(window.totalMergeCount) || 0,
    totalGoldEarned: Number(window.totalGoldEarned) || 0,
    highestToothLevel: Number(window.highestToothLevel) || 1,
    discoveredTeeth: Array.isArray(window.discoveredTeeth) ? [...window.discoveredTeeth] : createDefaultDiscoveredTeeth(),
    discoveredArtifacts: window.discoveredArtifacts || {},
    artifactCounts: window.artifactCounts || {},
    unlockedStage: Number(window.unlockedStage) || 1,
    clearedStage: Number(window.clearedStage) || 0,
    unlockedBossStage: Number(window.unlockedBossStage) || 1,
    hellUnlocked: !!window.hellUnlocked,
    currentDungeonTab: window.currentDungeonTab || "normal",
    globalUpgrades: window.globalUpgrades || { rng: 0, cd: 0 },
    slotUpgrades: Array.isArray(window.slotUpgrades) ? window.slotUpgrades : createDefaultSlotUpgrades(),
    ownedMercenaries: Array.isArray(window.ownedMercenaries) ? window.ownedMercenaries : [0],
    currentMercenary: Number(window.currentMercenary) || 0,
    trainingLevels: window.trainingLevels || normalizeTrainingLevels(null),
    hasSeenIntro: !!window.hasSeenIntro,
    hasSeenHellIntro: !!window.hasSeenHellIntro,
    hasSeenTranscendGuide: !!window.hasSeenTranscendGuide,
    hasPlayedAwakenVideo: !!window.hasPlayedAwakenVideo,
    settings: window.settings || { sound: true, vibration: true },
    lastSaveAt: Date.now()
  };
}

function findLegacySave() {
  for (const key of window.LEGACY_SAVE_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    } catch (error) {
      console.warn("Legacy save parse failed", key, error);
    }
  }
  return null;
}

function loadGame() {
  let loaded = null;
  const raw = localStorage.getItem(window.SAVE_KEY);
  if (raw) {
    try { loaded = JSON.parse(raw); } catch (error) { console.warn("Save parse failed", error); }
  }
  if (!loaded) loaded = findLegacySave();
  if (!loaded) loaded = createDefaultState();
  applyStateToWindow(loaded);
  migrateOldState();
  recalcHighestToothLevel();
  saveGame(false);
  return true;
}

function saveGame(showLog = false) {
  try {
    const state = collectStateFromWindow();
    localStorage.setItem(window.SAVE_KEY, JSON.stringify(state));
    if (showLog) console.log("Game saved", state);
    return true;
  } catch (error) {
    console.error("Save failed", error);
    showToast("저장 공간이 부족하거나 저장에 실패했습니다.", "danger");
    return false;
  }
}

function migrateOldState() {
  if (!Array.isArray(window.inventory)) window.inventory = createDefaultInventory();
  while (window.inventory.length < (window.inventorySize || window.BALANCE?.BASE_INVENTORY_SIZE || 56)) window.inventory.push(0);
  if (!window.globalUpgrades) window.globalUpgrades = { rng: 0, cd: 0 };
  if (!Array.isArray(window.slotUpgrades)) window.slotUpgrades = createDefaultSlotUpgrades();
  if (!Array.isArray(window.ownedMercenaries)) window.ownedMercenaries = [0];
  if (!window.ownedMercenaries.includes(0)) window.ownedMercenaries.unshift(0);
  if (typeof window.currentMercenary === "undefined") window.currentMercenary = 0;
  window.mercenaryIdx = window.currentMercenary;
  if (!window.trainingLevels) window.trainingLevels = normalizeTrainingLevels(null);
  if (!Array.isArray(window.discoveredTeeth)) window.discoveredTeeth = createDefaultDiscoveredTeeth();
  if (!window.discoveredArtifacts) window.discoveredArtifacts = {};
  if (!window.artifactCounts) window.artifactCounts = {};
  if (typeof window.hasSeenTranscendGuide === "undefined") window.hasSeenTranscendGuide = false;
  if (typeof window.hasPlayedAwakenVideo === "undefined") window.hasPlayedAwakenVideo = false;
  if (typeof window.hasSeenHellIntro === "undefined") window.hasSeenHellIntro = false;
  if (typeof window.hellUnlocked === "undefined") window.hellUnlocked = false;
}

function resetGame() {
  const ok = confirm("정말 게임 데이터를 초기화할까요? 이 작업은 되돌릴 수 없습니다.");
  if (!ok) return;
  localStorage.removeItem(window.SAVE_KEY);
  window.LEGACY_SAVE_KEYS.forEach((key) => localStorage.removeItem(key));
  applyStateToWindow(createDefaultState());
  saveGame(false);
  refreshAllUI();
  showToast("게임이 초기화되었습니다.", "info");
  showIntroStartScreen(false);
}

function exportSave() {
  const state = collectStateFromWindow();
  const text = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast("저장 데이터가 클립보드에 복사되었습니다.", "success")).catch(() => prompt("아래 저장 코드를 복사하세요.", text));
  } else {
    prompt("아래 저장 코드를 복사하세요.", text);
  }
}

function importSave() {
  const text = prompt("저장 코드를 붙여넣으세요.");
  if (!text) return;
  try {
    const json = decodeURIComponent(escape(atob(text.trim())));
    const state = JSON.parse(json);
    if (!state || typeof state !== "object") throw new Error("Invalid save");
    applyStateToWindow(state);
    migrateOldState();
    recalcHighestToothLevel();
    saveGame(false);
    refreshAllUI();
    showToast("저장 데이터를 불러왔습니다.", "success");
  } catch (error) {
    console.error(error);
    alert("저장 코드를 불러오지 못했습니다.");
  }
}

function recalcHighestToothLevel() {
  let highest = 1;
  if (Array.isArray(window.inventory)) {
    window.inventory.forEach((lv) => {
      const n = Number(lv) || 0;
      if (n > highest) highest = n;
    });
  }
  window.highestToothLevel = Math.max(Number(window.highestToothLevel) || 1, highest);
  if (!Array.isArray(window.discoveredTeeth)) window.discoveredTeeth = createDefaultDiscoveredTeeth();
  if (Array.isArray(window.inventory)) window.inventory.forEach((lv) => registerToothDiscovery(lv, false));
  return window.highestToothLevel;
}

function registerToothDiscovery(level, shouldSave = true) {
  const lv = Number(level) || 0;
  const max = window.BALANCE?.TRANSCEND_LEVEL || 25;
  if (lv < 1 || lv > max) return false;
  if (!Array.isArray(window.discoveredTeeth)) window.discoveredTeeth = createDefaultDiscoveredTeeth();
  window.discoveredTeeth[lv] = true;
  if (lv > (Number(window.highestToothLevel) || 1)) window.highestToothLevel = lv;
  if (shouldSave) saveGame(false);
  return true;
}

function checkTranscendGuide(level) {
  const lv = Number(level) || 0;
  if (lv !== (window.BALANCE?.MERGE_MAX_LEVEL || 24)) return;
  if (window.hasSeenTranscendGuide) return;
  window.hasSeenTranscendGuide = true;
  saveGame(false);
  showTranscendGuideModal();
}

function showTranscendGuideModal() {
  const message = `
    <div class="guide-modal-inner">
      <div class="guide-icon">👑</div>
      <h2>봉인된 왕관 치아 탄생!</h2>
      <p>채굴로는 얻을 수 없는 최종 왕관 치아를 완성했습니다.</p>
      <p><b>초월 왕관 치아</b>는 일반 합성으로 만들 수 없습니다.</p>
      <p><b>Lv.24 왕관 치아를 더블터치</b>하면 봉인해제 창이 열립니다.<br>보스 징표, 다이아, 골드를 소모해 <b>Lv.MAX 초월 왕관 치아</b>로 각성시킬 수 있습니다.</p>
      <button class="btn-main full" onclick="closeGenericModal()">확인</button>
    </div>
  `;
  openGenericModal(message);
}

function canAffordGold(cost) { return (Number(window.gold) || 0) >= (Number(cost) || 0); }
function spendGold(cost) {
  const c = Number(cost) || 0;
  if (c <= 0) return true;
  if (!canAffordGold(c)) { showToast("골드가 부족합니다.", "danger"); return false; }
  window.gold -= c;
  saveGame(false);
  refreshAllUI();
  return true;
}
function addGold(amount) { const a = Number(amount) || 0; if (a > 0) { window.gold += a; window.totalGoldEarned = (Number(window.totalGoldEarned) || 0) + a; } }
function addDiamond(amount) { const a = Number(amount) || 0; if (a > 0) { window.diamond = (Number(window.diamond) || 0) + a; window.dia = window.diamond; } }
function addBossToken(amount) { const a = Number(amount) || 0; if (a > 0) window.bossToken = (Number(window.bossToken) || 0) + a; }

function formatNumber(value) {
  const n = Number(value) || 0;
  if (n < 1000) return Math.floor(n).toLocaleString();
  const units = [{ v: 1e18, s: "Qi" }, { v: 1e15, s: "Qa" }, { v: 1e12, s: "T" }, { v: 1e9, s: "B" }, { v: 1e6, s: "M" }, { v: 1e3, s: "K" }];
  for (const unit of units) {
    if (n >= unit.v) {
      const val = n / unit.v;
      return `${val >= 100 ? val.toFixed(0) : val >= 10 ? val.toFixed(1) : val.toFixed(2)}${unit.s}`;
    }
  }
  return Math.floor(n).toLocaleString();
}

function formatPercent(value, digits = 1) { return `${(Number(value) || 0).toFixed(digits)}%`; }
function safeFNum(value) { return formatNumber(value); }

function ensureToastRoot() {
  let root = document.getElementById("toast-root");
  if (!root) { root = document.createElement("div"); root.id = "toast-root"; document.body.appendChild(root); }
  return root;
}

function showToast(message, type = "info", duration = 1800) {
  const root = ensureToastRoot();
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  root.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 260);
  }, duration);
}

function openGenericModal(html) {
  let modal = document.getElementById("generic-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "generic-modal";
    modal.className = "modal-overlay";
    modal.innerHTML = `<div class="modal-box generic-modal-box"><div id="generic-modal-content"></div></div>`;
    document.body.appendChild(modal);
  }
  const content = document.getElementById("generic-modal-content");
  if (content) content.innerHTML = html;
  modal.classList.add("active");
  modal.style.display = "flex";
  modal.setAttribute("aria-hidden", "false");
}

function closeGenericModal() {
  const modal = document.getElementById("generic-modal");
  if (!modal) return;
  modal.classList.remove("active");
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
}

/* =========================
   영상 시스템
========================= */

window.__introState = "closed";
window.__introReplayMode = false;
window.__simpleVideoFinish = null;

function getVideo(id) { return document.getElementById(id); }
function getVideoLayer(id) { return document.getElementById(id); }

function setLayerActive(layer, active) {
  if (!layer) return;
  layer.classList.toggle("active", !!active);
  layer.style.display = active ? "flex" : "none";
  layer.style.pointerEvents = active ? "auto" : "none";
  layer.setAttribute("aria-hidden", active ? "false" : "true");
}

function pauseAndReset(video, reset = true) {
  if (!video) return;
  try { video.pause(); if (reset) video.currentTime = 0; } catch (error) { console.warn(error); }
}

function hideAllVideoLayers() {
  ["intro-layer", "hell-video-layer", "awaken-video-layer", "intro-video-layer"].forEach((id) => {
    const layer = getVideoLayer(id);
    if (layer) setLayerActive(layer, false);
  });
  ["intro-video", "hell-video", "awaken-video"].forEach((id) => pauseAndReset(getVideo(id), true));
}

function showIntroStartScreen(forceReplay = false) {
  const layer = getVideoLayer("intro-layer");
  const video = getVideo("intro-video");
  const startBtn = document.getElementById("start-btn-layer");
  const skipBtn = document.getElementById("skip-btn");
  const titleCard = document.getElementById("intro-title-card");
  if (!layer) return false;

  window.__introReplayMode = !!forceReplay;
  window.__introState = "ready";
  setLayerActive(layer, true);
  if (video) {
    video.style.display = "block";
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");
    pauseAndReset(video, true);
  }
  if (startBtn) startBtn.style.display = "flex";
  if (skipBtn) { skipBtn.style.display = "none"; skipBtn.textContent = "SKIP ⏩"; }
  if (titleCard) { titleCard.classList.remove("active"); titleCard.setAttribute("aria-hidden", "true"); }

  layer.onclick = function (event) {
    if (event.target === skipBtn || event.target === startBtn || startBtn?.contains(event.target)) return;
    if (window.__introState === "ready") startIntro(event);
    else if (window.__introState === "title") finishIntro(event);
  };
  return true;
}

function startIntro(event) {
  if (event) { event.preventDefault(); event.stopPropagation(); }
  const layer = getVideoLayer("intro-layer");
  const video = getVideo("intro-video");
  const startBtn = document.getElementById("start-btn-layer");
  const skipBtn = document.getElementById("skip-btn");
  const titleCard = document.getElementById("intro-title-card");

  if (!layer || !video) { showIntroTitleCard(); return false; }
  window.__introState = "playing";
  setLayerActive(layer, true);
  video.style.display = "block";
  if (startBtn) startBtn.style.display = "none";
  if (skipBtn) { skipBtn.style.display = "block"; skipBtn.textContent = "SKIP ⏩"; }
  if (titleCard) titleCard.classList.remove("active");

  try { video.currentTime = 0; } catch (error) { console.warn(error); }
  video.onended = function () { showIntroTitleCard(); };
  video.onerror = function () { showToast("인트로 영상을 재생하지 못했습니다.", "danger"); showIntroTitleCard(); };

  const promise = video.play();
  if (promise && typeof promise.catch === "function") {
    promise.catch(() => {
      window.__introState = "ready";
      if (startBtn) startBtn.style.display = "flex";
      if (skipBtn) skipBtn.style.display = "none";
      showToast("화면을 다시 터치하면 영상이 재생됩니다.", "info");
    });
  }
  return true;
}

function showIntroTitleCard() {
  const layer = getVideoLayer("intro-layer");
  const video = getVideo("intro-video");
  const startBtn = document.getElementById("start-btn-layer");
  const skipBtn = document.getElementById("skip-btn");
  const titleCard = document.getElementById("intro-title-card");
  if (!layer) return false;

  window.__introState = "title";
  setLayerActive(layer, true);
  if (video) {
    try {
      video.pause();
      if (Number.isFinite(video.duration) && video.duration > 0.3) video.currentTime = Math.max(0, video.duration - 0.18);
    } catch (error) { console.warn(error); }
    video.style.display = "block";
  }
  if (startBtn) startBtn.style.display = "none";
  if (skipBtn) { skipBtn.style.display = "block"; skipBtn.textContent = "게임 시작"; }
  if (titleCard) { titleCard.classList.add("active"); titleCard.setAttribute("aria-hidden", "false"); }
  return true;
}

function skipIntro(event) {
  if (event) { event.preventDefault(); event.stopPropagation(); }
  if (window.__introState === "title") return finishIntro(event);
  return showIntroTitleCard();
}

function finishIntro(event) {
  if (event) { event.preventDefault(); event.stopPropagation(); }
  const layer = getVideoLayer("intro-layer");
  const video = getVideo("intro-video");
  const titleCard = document.getElementById("intro-title-card");
  pauseAndReset(video, true);
  if (titleCard) titleCard.classList.remove("active");
  setLayerActive(layer, false);
  window.__introState = "closed";
  window.hasSeenIntro = true;
  saveGame(false);
  return true;
}

function playIntroVideo(forceReplay = false) {
  if (!forceReplay && window.hasSeenIntro) return false;
  return showIntroStartScreen(forceReplay);
}

function ensureSimpleVideoStartButton(layer, text, playFn) {
  let btn = layer.querySelector(".video-start-btn");
  if (!btn) {
    btn = document.createElement("button");
    btn.type = "button";
    btn.className = "video-start-btn";
    layer.appendChild(btn);
  }
  btn.textContent = text;
  btn.style.display = "block";
  btn.onclick = function (event) {
    event.preventDefault();
    event.stopPropagation();
    btn.style.display = "none";
    playFn();
  };
  return btn;
}

function playSimpleVideo(layerId, videoId, skipId, onFinish) {
  const layer = getVideoLayer(layerId);
  const video = getVideo(videoId);
  const skipBtn = document.getElementById(skipId);
  if (!layer || !video) {
    if (typeof onFinish === "function") onFinish();
    return false;
  }
  window.__simpleVideoFinish = finish;
  setLayerActive(layer, true);
  video.style.display = "block";
  video.setAttribute("playsinline", "true");
  video.setAttribute("webkit-playsinline", "true");
  if (skipBtn) skipBtn.style.display = "block";

  function finish() {
    pauseAndReset(video, true);
    if (skipBtn) skipBtn.style.display = "none";
    const startBtn = layer.querySelector(".video-start-btn");
    if (startBtn) startBtn.style.display = "none";
    setLayerActive(layer, false);
    window.__simpleVideoFinish = null;
    if (typeof onFinish === "function") onFinish();
  }

  function playNow() {
    try { video.currentTime = 0; } catch (error) { console.warn(error); }
    video.onended = finish;
    video.onerror = function () { showToast("영상 파일을 재생하지 못했습니다.", "danger"); finish(); };
    const promise = video.play();
    if (promise && typeof promise.catch === "function") {
      promise.catch(() => {
        ensureSimpleVideoStartButton(layer, "🎬 화면을 터치하세요", playNow);
      });
    }
  }

  if (skipBtn) {
    skipBtn.onclick = function (event) {
      event.preventDefault();
      event.stopPropagation();
      finish();
    };
  }

  playNow();
  return true;
}

function playHellVideo(forceReplay = false) {
  return playSimpleVideo("hell-video-layer", "hell-video", "skip-hell-btn", function () {
    window.hasSeenHellIntro = true;
    window.hellUnlocked = true;
    saveGame(false);
    refreshAllUI();
  });
}

function skipHellIntro(event) {
  if (event) { event.preventDefault(); event.stopPropagation(); }
  if (typeof window.__simpleVideoFinish === "function") window.__simpleVideoFinish();
}

function playAwakenVideo(forceReplay = false) {
  if (!forceReplay && window.hasPlayedAwakenVideo) return false;
  return playSimpleVideo("awaken-video-layer", "awaken-video", "skip-awaken-btn", function () {
    window.hasPlayedAwakenVideo = true;
    saveGame(false);
    refreshAllUI();
  });
}

function skipAwakenIntro(event) {
  if (event) { event.preventDefault(); event.stopPropagation(); }
  if (typeof window.__simpleVideoFinish === "function") window.__simpleVideoFinish();
}

function replayVideo(key) {
  if (key === "intro") { playIntroVideo(true); return; }
  if (key === "hell") {
    if (!window.hellUnlocked && !window.hasSeenHellIntro) { showToast("아직 해금되지 않은 영상입니다.", "info"); return; }
    playHellVideo(true); return;
  }
  if (key === "awaken") {
    if (!window.hasPlayedAwakenVideo) { showToast("아직 해금되지 않은 영상입니다.", "info"); return; }
    playAwakenVideo(true); return;
  }
  showToast("영상을 찾을 수 없습니다.", "danger");
}

function unlockHellIfNeeded() {
  if (window.hellUnlocked) return false;
  window.hellUnlocked = true;
  window.hasSeenHellIntro = false;
  saveGame(false);
  playHellVideo(false);
  return true;
}

function updateResourceBar() {
  const goldEl = document.getElementById("gold-display");
  const diaEl = document.getElementById("dia-display");
  const diamondEl = document.getElementById("diamond-display");
  const tokenEl = document.getElementById("boss-token-display");
  if (goldEl) goldEl.textContent = formatNumber(window.gold);
  if (diaEl) diaEl.textContent = formatNumber(window.diamond);
  if (diamondEl) diamondEl.textContent = formatNumber(window.diamond);
  if (tokenEl) tokenEl.textContent = formatNumber(window.bossToken);
  const pickaxeEl = document.getElementById("pickaxe-display");
  if (pickaxeEl && typeof window.getPickaxeDisplay === "function") pickaxeEl.textContent = window.getPickaxeDisplay(window.pickaxeLevel);
  const pickaxeName = document.getElementById("pickaxe-name");
  if (pickaxeName && typeof window.getPickaxeInfo === "function") pickaxeName.textContent = window.getPickaxeInfo(window.pickaxeLevel).name;
}

function safeCall(fnName) {
  if (typeof window[fnName] === "function") {
    try { window[fnName](); } catch (error) { console.warn(`${fnName} failed`, error); }
  }
}

function refreshAllUI() {
  safeCall("renderInventory");
  safeCall("renderRefineView");
  safeCall("renderMercenaryCamp");
  safeCall("renderDungeonList");
  safeCall("renderBattleSlots");
  safeCall("updateToggleButtons");
  safeCall("updateUI");
  updateResourceBar();
}

function gameTick() {
  updateResourceBar();
  if (window.autoMineOn && typeof window.processMining === "function") {
    const interval = Math.max(900, 2800 - (Number(window.autoMineLevel) || 0) * 160);
    const now = Date.now();
    if (!window.__lastAutoMineAt) window.__lastAutoMineAt = 0;
    if (now - window.__lastAutoMineAt >= interval) {
      window.__lastAutoMineAt = now;
      window.processMining(true);
    }
  }
  if (window.autoMergeOn && typeof window.autoMergeInventory === "function") {
    const interval = Math.max(1200, 5000 - (Number(window.autoMergeLevel) || 0) * 220);
    const now = Date.now();
    if (!window.__lastAutoMergeAt) window.__lastAutoMergeAt = 0;
    if (now - window.__lastAutoMergeAt >= interval) {
      window.__lastAutoMergeAt = now;
      window.autoMergeInventory();
    }
  }
}

function initGame() {
  hideAllVideoLayers();
  loadGame();
  hideAllVideoLayers();
  if (typeof window.setupMiningTouch === "function") window.setupMiningTouch();
  if (typeof window.setupJoystick === "function") window.setupJoystick();
  if (typeof window.setupKeyboardControls === "function") window.setupKeyboardControls();
  if (typeof window.switchView === "function") window.switchView(window.currentView || "mine");
  refreshAllUI();
  if (!window.__gameTickTimer) window.__gameTickTimer = setInterval(gameTick, 250);
  if (!window.__autoSaveTimer) window.__autoSaveTimer = setInterval(() => saveGame(false), 5000);
  setTimeout(() => {
    if (!window.hasSeenIntro) showIntroStartScreen(false);
  }, 200);
  console.log(`치아 연대기 engine.js loaded v${window.GAME_VERSION || "8.3.0"}`);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initGame);
else initGame();

window.createDefaultState = createDefaultState;
window.loadGame = loadGame;
window.saveGame = saveGame;
window.resetGame = resetGame;
window.exportSave = exportSave;
window.exportSaveCode = exportSave;
window.importSave = importSave;
window.checkReset = resetGame;
window.registerToothDiscovery = registerToothDiscovery;
window.checkTranscendGuide = checkTranscendGuide;
window.showTranscendGuideModal = showTranscendGuideModal;
window.canAffordGold = canAffordGold;
window.spendGold = spendGold;
window.addGold = addGold;
window.addDiamond = addDiamond;
window.addBossToken = addBossToken;
window.formatNumber = formatNumber;
window.fmt = formatNumber;
window.formatGold = formatNumber;
window.safeFNum = safeFNum;
window.formatPercent = formatPercent;
window.showToast = showToast;
window.openGenericModal = openGenericModal;
window.closeGenericModal = closeGenericModal;
window.hideAllVideoLayers = hideAllVideoLayers;
window.showIntroStartScreen = showIntroStartScreen;
window.startIntro = startIntro;
window.skipIntro = skipIntro;
window.finishIntro = finishIntro;
window.playIntroVideo = playIntroVideo;
window.playHellVideo = playHellVideo;
window.skipHellIntro = skipHellIntro;
window.playAwakenVideo = playAwakenVideo;
window.skipAwakenIntro = skipAwakenIntro;
window.replayVideo = replayVideo;
window.unlockHellIfNeeded = unlockHellIfNeeded;
window.refreshAllUI = refreshAllUI;
window.updateResourceBar = updateResourceBar;
window.gameTick = gameTick;
window.initGame = initGame;
