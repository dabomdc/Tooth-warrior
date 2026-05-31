/* engine.js v8.2.0
   치아 연대기 - 저장 / 로드 / 초기화 / 공통 유틸
   핵심:
   - Lv.25 / Lv.MAX 저장 구조 반영
   - Lv.24 초월 안내 플래그 저장
   - 첫 Lv.MAX 각성 영상 1회 재생 플래그 저장
   - 인트로 / HELL / 최종각성 영상 다시보기 기반 정리
   - 토스트 메시지 기능 추가
*/

"use strict";

/* =========================
   저장 키
========================= */

window.SAVE_KEY = "toothChronicleSave_v8_2";

window.LEGACY_SAVE_KEYS = [
  "toothChronicleSave_v8_1",
  "toothChronicleSave_v8",
  "toothChronicleSave",
  "toothChronicle",
  "dentalGameSave",
  "toothGameSave"
];

/* =========================
   기본 상태 생성
========================= */

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
  return Array.from({ length: count }, () => ({
    atk: 0,
    cd: 0,
    rng: 0
  }));
}

function createDefaultDiscoveredTeeth() {
  const max = window.BALANCE?.TRANSCEND_LEVEL || 25;
  const arr = Array(max + 1).fill(false);
  arr[0] = true;
  return arr;
}

function createDefaultState() {
  return {
    version: window.GAME_VERSION || "8.2.0",

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

    globalUpgrades: {
      rng: 0,
      cd: 0
    },

    slotUpgrades: createDefaultSlotUpgrades(),

    ownedMercenaries: [0],
    currentMercenary: 0,

    trainingLevels: {
      hp: 0,
      atk: 0,
      spd: 0,
      crit: 0,
      splashDmg: 0,
      splashRange: 0
    },

    hasSeenIntro: false,
    hasSeenHellIntro: false,
    hasSeenTranscendGuide: false,
    hasPlayedAwakenVideo: false,

    settings: {
      sound: true,
      vibration: true
    },

    lastSaveAt: Date.now()
  };
}

/* =========================
   전역 상태 적용
========================= */

function applyStateToWindow(state) {
  const s = state || createDefaultState();

  window.gold = Number(s.gold) || 0;
  window.diamond = Number(s.diamond) || 0;
  window.bossToken = Number(s.bossToken) || 0;

  window.inventorySize =
    Number(s.inventorySize) ||
    window.BALANCE?.BASE_INVENTORY_SIZE ||
    56;

  window.inventory = Array.isArray(s.inventory)
    ? s.inventory.slice(0, window.inventorySize)
    : createDefaultInventory();

  while (window.inventory.length < window.inventorySize) {
    window.inventory.push(0);
  }

  window.inventory = window.inventory.map((value) => {
    const lv = Number(value) || 0;
    if (lv <= 0) return 0;
    return Math.max(1, Math.min(window.BALANCE?.TRANSCEND_LEVEL || 25, lv));
  });

  window.pickaxeLevel = Math.max(
    1,
    Math.min(window.BALANCE?.PICKAXE_MAX_LEVEL || 8, Number(s.pickaxeLevel) || 1)
  );

  window.autoMineLevel = Math.max(0, Number(s.autoMineLevel) || 0);
  window.autoMergeLevel = Math.max(0, Number(s.autoMergeLevel) || 0);
  window.greatChanceLevel = Math.max(0, Number(s.greatChanceLevel) || 0);

  window.autoMineOn = !!s.autoMineOn;
  window.autoMergeOn = !!s.autoMergeOn;

  window.totalMineCount = Number(s.totalMineCount) || 0;
  window.totalMergeCount = Number(s.totalMergeCount) || 0;
  window.totalGoldEarned = Number(s.totalGoldEarned) || 0;

  window.highestToothLevel = Math.max(
    1,
    Math.min(window.BALANCE?.TRANSCEND_LEVEL || 25, Number(s.highestToothLevel) || 1)
  );

  window.discoveredTeeth = normalizeDiscoveredTeeth(s.discoveredTeeth);

  window.discoveredArtifacts =
    s.discoveredArtifacts && typeof s.discoveredArtifacts === "object"
      ? { ...s.discoveredArtifacts }
      : {};

  window.artifactCounts =
    s.artifactCounts && typeof s.artifactCounts === "object"
      ? { ...s.artifactCounts }
      : {};

  window.unlockedStage = Math.max(1, Number(s.unlockedStage) || 1);
  window.clearedStage = Math.max(0, Number(s.clearedStage) || 0);
  window.unlockedBossStage = Math.max(1, Number(s.unlockedBossStage) || 1);
  window.hellUnlocked = !!s.hellUnlocked;

  window.currentDungeonTab = s.currentDungeonTab || "normal";

  window.globalUpgrades =
    s.globalUpgrades && typeof s.globalUpgrades === "object"
      ? {
          rng: Number(s.globalUpgrades.rng) || 0,
          cd: Number(s.globalUpgrades.cd) || 0
        }
      : { rng: 0, cd: 0 };

  window.slotUpgrades = normalizeSlotUpgrades(s.slotUpgrades);

  window.ownedMercenaries = Array.isArray(s.ownedMercenaries)
    ? [...new Set(s.ownedMercenaries.map((v) => Number(v) || 0))]
    : [0];

  if (!window.ownedMercenaries.includes(0)) {
    window.ownedMercenaries.unshift(0);
  }

  window.currentMercenary = Number(s.currentMercenary) || 0;

  if (!window.ownedMercenaries.includes(window.currentMercenary)) {
    window.currentMercenary = 0;
  }

  window.trainingLevels = normalizeTrainingLevels(s.trainingLevels);

  window.hasSeenIntro = !!s.hasSeenIntro;
  window.hasSeenHellIntro = !!s.hasSeenHellIntro;
  window.hasSeenTranscendGuide = !!s.hasSeenTranscendGuide;
  window.hasPlayedAwakenVideo = !!s.hasPlayedAwakenVideo;

  window.settings =
    s.settings && typeof s.settings === "object"
      ? {
          sound: s.settings.sound !== false,
          vibration: s.settings.vibration !== false
        }
      : {
          sound: true,
          vibration: true
        };

  window.dungeonActive = false;
  window.dungeonPaused = false;
  window.bossDead = false;
}

function collectStateFromWindow() {
  return {
    version: window.GAME_VERSION || "8.2.0",

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
    discoveredTeeth: Array.isArray(window.discoveredTeeth)
      ? [...window.discoveredTeeth]
      : createDefaultDiscoveredTeeth(),

    discoveredArtifacts: window.discoveredArtifacts || {},
    artifactCounts: window.artifactCounts || {},

    unlockedStage: Number(window.unlockedStage) || 1,
    clearedStage: Number(window.clearedStage) || 0,
    unlockedBossStage: Number(window.unlockedBossStage) || 1,
    hellUnlocked: !!window.hellUnlocked,

    currentDungeonTab: window.currentDungeonTab || "normal",

    globalUpgrades: window.globalUpgrades || { rng: 0, cd: 0 },
    slotUpgrades: Array.isArray(window.slotUpgrades)
      ? window.slotUpgrades
      : createDefaultSlotUpgrades(),

    ownedMercenaries: Array.isArray(window.ownedMercenaries)
      ? window.ownedMercenaries
      : [0],
    currentMercenary: Number(window.currentMercenary) || 0,

    trainingLevels: window.trainingLevels || {
      hp: 0,
      atk: 0,
      spd: 0,
      crit: 0,
      splashDmg: 0,
      splashRange: 0
    },

    hasSeenIntro: !!window.hasSeenIntro,
    hasSeenHellIntro: !!window.hasSeenHellIntro,
    hasSeenTranscendGuide: !!window.hasSeenTranscendGuide,
    hasPlayedAwakenVideo: !!window.hasPlayedAwakenVideo,

    settings: window.settings || {
      sound: true,
      vibration: true
    },

    lastSaveAt: Date.now()
  };
}

function normalizeDiscoveredTeeth(value) {
  const max = window.BALANCE?.TRANSCEND_LEVEL || 25;
  const result = Array(max + 1).fill(false);
  result[0] = true;

  if (Array.isArray(value)) {
    for (let i = 1; i <= max; i += 1) {
      result[i] = !!value[i];
    }
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
  const result = {
    hp: 0,
    atk: 0,
    spd: 0,
    crit: 0,
    splashDmg: 0,
    splashRange: 0
  };

  if (value && typeof value === "object") {
    Object.keys(result).forEach((key) => {
      result[key] = Math.max(0, Number(value[key]) || 0);
    });
  }

  return result;
}

/* =========================
   저장 / 로드
========================= */

function findLegacySave() {
  for (const key of window.LEGACY_SAVE_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    } catch (error) {
      console.warn("Legacy save parse failed:", key, error);
    }
  }

  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;

      const lowered = key.toLowerCase();
      if (!lowered.includes("tooth") && !lowered.includes("dental")) continue;

      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.inventory)) {
        console.log("Found possible legacy save:", key);
        return parsed;
      }
    }
  } catch (error) {
    console.warn("localStorage scan failed:", error);
  }

  return null;
}

function loadGame() {
  let loaded = null;

  const raw = localStorage.getItem(window.SAVE_KEY);
  if (raw) {
    try {
      loaded = JSON.parse(raw);
    } catch (error) {
      console.warn("Save parse failed:", error);
    }
  }

  if (!loaded) {
    loaded = findLegacySave();
  }

  if (!loaded) {
    loaded = createDefaultState();
  }

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

    if (showLog) {
      console.log("Game saved", state);
    }

    return true;
  } catch (error) {
    console.error("Save failed:", error);
    showToast("저장 공간이 부족하거나 저장에 실패했습니다.", "danger");
    return false;
  }
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
}

function exportSave() {
  const state = collectStateFromWindow();
  const text = btoa(unescape(encodeURIComponent(JSON.stringify(state))));

  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(text)
      .then(() => showToast("저장 데이터가 클립보드에 복사되었습니다.", "success"))
      .catch(() => {
        prompt("아래 저장 코드를 복사하세요.", text);
      });
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

    if (!state || typeof state !== "object") {
      throw new Error("Invalid save");
    }

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

function migrateOldState() {
  if (!Array.isArray(window.inventory)) {
    window.inventory = createDefaultInventory();
  }

  while (window.inventory.length < (window.BALANCE?.BASE_INVENTORY_SIZE || 56)) {
    window.inventory.push(0);
  }

  if (!window.globalUpgrades) {
    window.globalUpgrades = { rng: 0, cd: 0 };
  }

  if (!Array.isArray(window.slotUpgrades)) {
    window.slotUpgrades = createDefaultSlotUpgrades();
  }

  if (!Array.isArray(window.ownedMercenaries)) {
    window.ownedMercenaries = [0];
  }

  if (!window.ownedMercenaries.includes(0)) {
    window.ownedMercenaries.unshift(0);
  }

  if (typeof window.currentMercenary === "undefined") {
    window.currentMercenary = 0;
  }

  if (!window.trainingLevels) {
    window.trainingLevels = normalizeTrainingLevels(null);
  }

  if (!Array.isArray(window.discoveredTeeth)) {
    window.discoveredTeeth = createDefaultDiscoveredTeeth();
  }

  if (!window.discoveredArtifacts) {
    window.discoveredArtifacts = {};
  }

  if (!window.artifactCounts) {
    window.artifactCounts = {};
  }

  if (typeof window.hasSeenTranscendGuide === "undefined") {
    window.hasSeenTranscendGuide = false;
  }

  if (typeof window.hasPlayedAwakenVideo === "undefined") {
    window.hasPlayedAwakenVideo = false;
  }

  if (typeof window.hasSeenHellIntro === "undefined") {
    window.hasSeenHellIntro = false;
  }

  if (typeof window.hellUnlocked === "undefined") {
    window.hellUnlocked = false;
  }
}

/* =========================
   레벨 / 도감 기록
========================= */

function recalcHighestToothLevel() {
  let highest = 1;

  if (Array.isArray(window.inventory)) {
    window.inventory.forEach((lv) => {
      const n = Number(lv) || 0;
      if (n > highest) highest = n;
    });
  }

  window.highestToothLevel = Math.max(Number(window.highestToothLevel) || 1, highest);

  if (!Array.isArray(window.discoveredTeeth)) {
    window.discoveredTeeth = createDefaultDiscoveredTeeth();
  }

  if (Array.isArray(window.inventory)) {
    window.inventory.forEach((lv) => {
      registerToothDiscovery(lv, false);
    });
  }

  return window.highestToothLevel;
}

function registerToothDiscovery(level, shouldSave = true) {
  const lv = Number(level) || 0;
  const max = window.BALANCE?.TRANSCEND_LEVEL || 25;

  if (lv < 1 || lv > max) return false;

  if (!Array.isArray(window.discoveredTeeth)) {
    window.discoveredTeeth = createDefaultDiscoveredTeeth();
  }

  window.discoveredTeeth[lv] = true;

  if (lv > (Number(window.highestToothLevel) || 1)) {
    window.highestToothLevel = lv;
  }

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
      <p>
        채굴로는 얻을 수 없는 최종 왕관 치아를 완성했습니다.
      </p>
      <p>
        하지만 최종 단계인 <b>초월 왕관 치아</b>는
        일반 합성으로 만들 수 없습니다.
      </p>
      <p>
        <b>Lv.24 왕관 치아를 더블터치</b>하면 봉인해제 창이 열립니다.<br>
        보스 징표, 다이아, 골드를 소모하여
        <b>Lv.MAX 초월 왕관 치아</b>로 각성시킬 수 있습니다.
      </p>
      <button class="btn-main full" onclick="closeGenericModal()">확인</button>
    </div>
  `;

  openGenericModal(message);
}

/* =========================
   재화 처리
========================= */

function canAffordGold(cost) {
  return (Number(window.gold) || 0) >= (Number(cost) || 0);
}

function spendGold(cost) {
  const c = Number(cost) || 0;
  if (c <= 0) return true;

  if (!canAffordGold(c)) {
    showToast("골드가 부족합니다.", "danger");
    return false;
  }

  window.gold -= c;
  saveGame(false);
  refreshAllUI();
  return true;
}

function addGold(amount) {
  const a = Number(amount) || 0;
  if (a <= 0) return;

  window.gold += a;
  window.totalGoldEarned = (Number(window.totalGoldEarned) || 0) + a;
}

function addDiamond(amount) {
  const a = Number(amount) || 0;
  if (a <= 0) return;

  window.diamond = (Number(window.diamond) || 0) + a;
}

function addBossToken(amount) {
  const a = Number(amount) || 0;
  if (a <= 0) return;

  window.bossToken = (Number(window.bossToken) || 0) + a;
}

window.canAffordGold = canAffordGold;
window.spendGold = spendGold;
window.addGold = addGold;
window.addDiamond = addDiamond;
window.addBossToken = addBossToken;

/* =========================
   숫자 표기
========================= */

function formatNumber(value) {
  const n = Number(value) || 0;

  if (n < 1000) return Math.floor(n).toLocaleString();

  const units = [
    { v: 1e18, s: "Qi" },
    { v: 1e15, s: "Qa" },
    { v: 1e12, s: "T" },
    { v: 1e9, s: "B" },
    { v: 1e6, s: "M" },
    { v: 1e3, s: "K" }
  ];

  for (const unit of units) {
    if (n >= unit.v) {
      const val = n / unit.v;
      return `${val >= 100 ? val.toFixed(0) : val >= 10 ? val.toFixed(1) : val.toFixed(2)}${unit.s}`;
    }
  }

  return Math.floor(n).toLocaleString();
}

function formatPercent(value, digits = 1) {
  const n = Number(value) || 0;
  return `${n.toFixed(digits)}%`;
}

window.formatNumber = formatNumber;
window.fmt = formatNumber;
window.formatGold = formatNumber;
window.formatPercent = formatPercent;

/* =========================
   토스트
========================= */

function ensureToastRoot() {
  let root = document.getElementById("toast-root");

  if (!root) {
    root = document.createElement("div");
    root.id = "toast-root";
    document.body.appendChild(root);
  }

  return root;
}

function showToast(message, type = "info", duration = 1800) {
  const root = ensureToastRoot();

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  root.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 260);
  }, duration);
}

window.showToast = showToast;

/* =========================
   공용 모달
========================= */

function openGenericModal(html) {
  let modal = document.getElementById("generic-modal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "generic-modal";
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-box generic-modal-box">
        <div id="generic-modal-content"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const content = document.getElementById("generic-modal-content");
  if (content) {
    content.innerHTML = html;
  }

  modal.classList.add("active");
  modal.style.display = "flex";
}

function closeGenericModal() {
  const modal = document.getElementById("generic-modal");
  if (!modal) return;

  modal.classList.remove("active");
  modal.style.display = "none";
}

window.openGenericModal = openGenericModal;
window.closeGenericModal = closeGenericModal;

/* =========================
   영상 재생
========================= */

function playVideoLayer(layerId, onEnd) {
  const layer = document.getElementById(layerId);

  if (!layer) {
    if (typeof onEnd === "function") onEnd();
    return false;
  }

  layer.style.display = "flex";
  layer.classList.add("active");

  const video = layer.querySelector("video");

  function finish() {
    layer.classList.remove("active");
    layer.style.display = "none";

    if (video) {
      try {
        video.pause();
        video.currentTime = 0;
      } catch (error) {
        console.warn(error);
      }
    }

    if (typeof onEnd === "function") onEnd();
  }

  const closeBtn = layer.querySelector(".video-skip, .skip-video, .close-video, button");

  if (closeBtn) {
    closeBtn.onclick = finish;
  }

  if (video) {
    video.onended = finish;
    video.onclick = () => {};

    const playPromise = video.play();

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        console.warn("Video autoplay blocked:", layerId);
      });
    }
  } else {
    setTimeout(finish, 3500);
  }

  return true;
}

function playIntroVideo(forceReplay = false) {
  if (!forceReplay && window.hasSeenIntro) return;

  playVideoLayer("intro-video-layer", () => {
    window.hasSeenIntro = true;
    saveGame(false);
  });
}

function playHellVideo(forceReplay = false) {
  if (!forceReplay) {
    window.hasSeenHellIntro = true;
    window.hellUnlocked = true;
  }

  playVideoLayer("hell-video-layer", () => {
    window.hasSeenHellIntro = true;
    window.hellUnlocked = true;
    saveGame(false);
  });
}

function playAwakenVideo(forceReplay = false) {
  if (!forceReplay && window.hasPlayedAwakenVideo) return false;

  playVideoLayer("awaken-video-layer", () => {
    window.hasPlayedAwakenVideo = true;
    saveGame(false);
  });

  return true;
}

function replayVideo(key) {
  const video = (window.REPLAY_VIDEOS || []).find((item) => item.key === key);

  if (!video) {
    showToast("영상을 찾을 수 없습니다.", "danger");
    return;
  }

  if (typeof window.isReplayVideoUnlocked === "function") {
    if (!window.isReplayVideoUnlocked(key)) {
      showToast("아직 해금되지 않은 영상입니다.", "info");
      return;
    }
  }

  const fn = window[video.playFunction];

  if (typeof fn === "function") {
    fn(true);
  } else {
    showToast("영상 재생 함수가 없습니다.", "danger");
  }
}

window.playIntroVideo = playIntroVideo;
window.playHellVideo = playHellVideo;
window.playAwakenVideo = playAwakenVideo;
window.replayVideo = replayVideo;

/* =========================
   HELL 개방 처리
========================= */

function unlockHellIfNeeded() {
  if (window.hellUnlocked) return false;

  window.hellUnlocked = true;
  window.hasSeenHellIntro = true;
  saveGame(false);

  playHellVideo(false);

  return true;
}

window.unlockHellIfNeeded = unlockHellIfNeeded;

/* =========================
   UI 갱신
========================= */

function safeCall(fnName) {
  if (typeof window[fnName] === "function") {
    try {
      window[fnName]();
    } catch (error) {
      console.warn(`${fnName} failed`, error);
    }
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
}

function updateResourceBar() {
  const goldEl = document.getElementById("gold-display");
  const diaEl = document.getElementById("diamond-display");
  const tokenEl = document.getElementById("boss-token-display");

  if (goldEl) goldEl.textContent = formatNumber(window.gold);
  if (diaEl) diaEl.textContent = formatNumber(window.diamond);
  if (tokenEl) tokenEl.textContent = formatNumber(window.bossToken);

  const pickaxeEl = document.getElementById("pickaxe-display");
  if (pickaxeEl && typeof window.getPickaxeDisplay === "function") {
    pickaxeEl.textContent = window.getPickaxeDisplay(window.pickaxeLevel);
  }
}

window.refreshAllUI = refreshAllUI;
window.updateResourceBar = updateResourceBar;

/* =========================
   설정 / 영상 다시보기 화면
========================= */

function openSettingsModal() {
  const videos = window.REPLAY_VIDEOS || [];

  const videoHtml = videos
    .map((video) => {
      const unlocked =
        typeof window.isReplayVideoUnlocked === "function"
          ? window.isReplayVideoUnlocked(video.key)
          : video.key === "intro";

      return `
        <button
          class="setting-video-btn ${unlocked ? "" : "locked"}"
          onclick="${unlocked ? `replayVideo('${video.key}')` : `showToast('아직 해금되지 않은 영상입니다.', 'info')`}"
        >
          <span>${unlocked ? video.icon : "🔒"}</span>
          <b>${video.title}</b>
          <em>${unlocked ? "다시보기" : "잠김"}</em>
        </button>
      `;
    })
    .join("");

  const html = `
    <div class="settings-modal-inner">
      <h2>⚙️ 설정</h2>

      <div class="settings-section">
        <h3>🎞️ 영상 다시보기</h3>
        <p>한 번 재생된 주요 영상은 이곳에서 다시 볼 수 있습니다.</p>
        <div class="setting-video-list">
          ${videoHtml}
        </div>
      </div>

      <div class="settings-section">
        <h3>💾 저장 관리</h3>
        <div class="settings-grid">
          <button class="btn-sub" onclick="saveGame(true); showToast('저장되었습니다.', 'success')">수동 저장</button>
          <button class="btn-sub" onclick="exportSave()">저장코드 복사</button>
          <button class="btn-sub" onclick="importSave()">저장코드 불러오기</button>
          <button class="btn-danger" onclick="resetGame()">초기화</button>
        </div>
      </div>

      <button class="btn-main full" onclick="closeGenericModal()">닫기</button>
    </div>
  `;

  openGenericModal(html);
}

window.openSettingsModal = openSettingsModal;

/* =========================
   메인 초기화
========================= */

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

function setupBottomButtons() {
  const settingsCandidates = [
    document.getElementById("settings-btn"),
    document.getElementById("setting-btn")
  ].filter(Boolean);

  settingsCandidates.forEach((btn) => {
    btn.onclick = openSettingsModal;
  });
}

function initGame() {
  loadGame();

  setupBottomButtons();

  if (typeof window.setupMiningTouch === "function") {
    window.setupMiningTouch();
  }

  refreshAllUI();

  if (!window.__gameTickTimer) {
    window.__gameTickTimer = setInterval(gameTick, 250);
  }

  if (!window.__autoSaveTimer) {
    window.__autoSaveTimer = setInterval(() => saveGame(false), 5000);
  }

  console.log(`치아 연대기 engine.js loaded v${window.GAME_VERSION || "8.2.0"}`);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGame);
} else {
  initGame();
}

/* =========================
   전역 노출
========================= */

window.createDefaultState = createDefaultState;
window.loadGame = loadGame;
window.saveGame = saveGame;
window.resetGame = resetGame;
window.exportSave = exportSave;
window.importSave = importSave;

window.registerToothDiscovery = registerToothDiscovery;
window.checkTranscendGuide = checkTranscendGuide;
window.showTranscendGuideModal = showTranscendGuideModal;

window.gameTick = gameTick;
window.initGame = initGame;
