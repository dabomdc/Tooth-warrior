/* action.js v8.2.0
   치아 연대기 - 채굴 / 인벤토리 / 합성 / 초월
   핵심:
   - 채굴 직접 획득 최대 Lv.12
   - 일반 합성 최대 Lv.24
   - Lv.23 + Lv.23 합성 시 대성공 금지
   - Lv.24 더블터치 시 봉인해제 창
   - Lv.25는 Lv.MAX로 표시
   - 첫 Lv.MAX 제작 시 각성 영상 1회 자동 재생
   - 이후 Lv.MAX 제작은 토스트만 표시
*/

"use strict";

/* =========================
   내부 상태
========================= */

window.dragState = null;
window.lastTapInfo = {
  index: -1,
  time: 0
};

/* =========================
   공통 유틸
========================= */

function getInventoryGrid() {
  return (
    document.getElementById("inventory-grid") ||
    document.getElementById("inventory-list") ||
    document.querySelector(".inventory-grid")
  );
}

function getInventorySize() {
  return Number(window.inventorySize) || window.BALANCE?.BASE_INVENTORY_SIZE || 56;
}

function ensureInventory() {
  const size = getInventorySize();

  if (!Array.isArray(window.inventory)) {
    window.inventory = Array(size).fill(0);
  }

  while (window.inventory.length < size) {
    window.inventory.push(0);
  }

  if (window.inventory.length > size) {
    window.inventory = window.inventory.slice(0, size);
  }

  window.inventory = window.inventory.map((lv) => {
    const n = Number(lv) || 0;
    if (n <= 0) return 0;
    return Math.max(1, Math.min(window.BALANCE?.TRANSCEND_LEVEL || 25, n));
  });

  return window.inventory;
}

function updateAfterInventoryChange() {
  if (typeof window.recalcHighestToothLevel === "function") {
    window.recalcHighestToothLevel();
  }

  if (typeof window.saveGame === "function") {
    window.saveGame(false);
  }

  renderInventory();

  if (typeof window.renderBattleSlots === "function") {
    window.renderBattleSlots();
  }

  if (typeof window.updateUI === "function") {
    window.updateUI();
  }

  if (typeof window.renderRefineView === "function") {
    window.renderRefineView();
  }
}

function safeToast(message, type = "info", duration = 1800) {
  if (typeof window.showToast === "function") {
    window.showToast(message, type, duration);
  } else {
    console.log(message);
  }
}

function safeNumber(value) {
  return Number(value) || 0;
}

function formatCost(value) {
  if (typeof window.formatNumber === "function") return window.formatNumber(value);
  return String(value);
}

/* =========================
   채굴
========================= */

function getMiningBaseCap() {
  const pickaxeLv = Math.max(1, Math.min(window.BALANCE?.PICKAXE_MAX_LEVEL || 8, Number(window.pickaxeLevel) || 1));

  /*
    곡괭이 최고 레벨 기준:
    기본 채굴 상한은 Lv.11 근처까지,
    확률 보너스가 붙으면 최종 Lv.12 가능.
  */
  const capByPickaxe = 1 + Math.floor(((pickaxeLv - 1) * 10) / 7);
  return Math.max(1, Math.min(11, capByPickaxe));
}

function getMiningBonusChance() {
  const pickaxeLv = Number(window.pickaxeLevel) || 1;
  const greatLv = Number(window.greatChanceLevel) || 0;

  const chance = 0.015 + pickaxeLv * 0.012 + greatLv * 0.006;
  return Math.max(0, Math.min(0.28, chance));
}

function rollMiningLevel() {
  const miningMax = window.BALANCE?.MINING_MAX_LEVEL || 12;
  const baseCap = Math.min(miningMax - 1, getMiningBaseCap());

  let lv = 1;

  /*
    높은 레벨일수록 낮은 확률.
    현재 채굴 상한 안에서만 추첨.
  */
  for (let i = 2; i <= baseCap; i += 1) {
    const difficulty = Math.pow(i, 1.22);
    const chance = Math.max(0.035, 0.72 / difficulty);

    if (Math.random() < chance) {
      lv = i;
    } else if (Math.random() < 0.18) {
      break;
    }
  }

  /*
    확률업 포함 보너스.
    그래도 채굴 최종 상한은 Lv.12.
  */
  if (Math.random() < getMiningBonusChance()) {
    lv += 1;
  }

  return Math.max(1, Math.min(miningMax, lv));
}

function processMining(isAuto = false) {
  ensureInventory();

  const minedLv = rollMiningLevel();
  const added = addMinedItem(minedLv);

  if (!added) {
    if (!isAuto) safeToast("인벤토리가 가득 찼습니다.", "danger");
    return false;
  }

  const pickaxe = typeof window.getPickaxeInfo === "function"
    ? window.getPickaxeInfo(window.pickaxeLevel)
    : { power: 1 };

  const goldGain = Math.floor((6 + minedLv * minedLv * 2.6) * (pickaxe.power || 1));
  const diaChance = Math.min(0.08, 0.005 + minedLv * 0.002);

  if (typeof window.addGold === "function") {
    window.addGold(goldGain);
  } else {
    window.gold = safeNumber(window.gold) + goldGain;
  }

  if (Math.random() < diaChance) {
    if (typeof window.addDiamond === "function") {
      window.addDiamond(1);
    } else {
      window.diamond = safeNumber(window.diamond) + 1;
    }
    showFloatingText("+1💎", "diamond");
  }

  window.totalMineCount = safeNumber(window.totalMineCount) + 1;

  if (typeof window.registerToothDiscovery === "function") {
    window.registerToothDiscovery(minedLv, false);
  }

  showMiningHitEffect(minedLv, goldGain, isAuto);

  if (typeof window.saveGame === "function") {
    window.saveGame(false);
  }

  renderInventory();

  if (typeof window.updateUI === "function") {
    window.updateUI();
  }

  return true;
}

function addMinedItem(level) {
  ensureInventory();

  const lv = Math.max(1, Math.min(window.BALANCE?.MINING_MAX_LEVEL || 12, Number(level) || 1));

  /*
    채굴 아이템은 전투용 Top8 슬롯을 자동으로 채우지 않고,
    아래 인벤토리 영역부터 채움.
  */
  const topCount = window.BALANCE?.TOP_SLOT_COUNT || 8;

  let index = window.inventory.findIndex((value, i) => i >= topCount && !value);

  if (index < 0) {
    cleanupInventory(false);
    index = window.inventory.findIndex((value, i) => i >= topCount && !value);
  }

  if (index < 0) return false;

  window.inventory[index] = lv;
  return true;
}

function showMiningHitEffect(level, goldGain, isAuto) {
  const tooth = document.getElementById("giant-tooth");
  const miner = document.getElementById("miner-char");

  if (tooth) {
    tooth.classList.remove("mine-hit");
    void tooth.offsetWidth;
    tooth.classList.add("mine-hit");
  }

  if (miner) {
    miner.classList.remove("miner-swing");
    void miner.offsetWidth;
    miner.classList.add("miner-swing");
  }

  if (!isAuto) {
    const label = `${typeof window.getToothDisplayLevel === "function" ? window.getToothDisplayLevel(level) : `Lv.${level}`} +${formatCost(goldGain)}G`;
    showFloatingText(label, "gold");
  }
}

function showFloatingText(text, type = "gold") {
  const area =
    document.getElementById("mine-rock-area") ||
    document.getElementById("mine-view") ||
    document.body;

  const el = document.createElement("div");
  el.className = `floating-text floating-${type}`;
  el.textContent = text;

  area.appendChild(el);

  const x = 35 + Math.random() * 30;
  const y = 35 + Math.random() * 20;

  el.style.left = `${x}%`;
  el.style.top = `${y}%`;

  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 950);
}

function setupMiningTouch() {
  if (window.__miningTouchSetup) return;
  window.__miningTouchSetup = true;

  const mineView = document.getElementById("mine-view");
  if (!mineView) return;

  mineView.addEventListener(
    "pointerdown",
    (event) => {
      const blocked = event.target.closest(
        "button, .slot, .inventory-grid, .inventory-scroll-area, .modal-overlay, input, select, textarea, a"
      );

      if (blocked) return;

      processMining(false);
    },
    { passive: true }
  );
}

/* =========================
   인벤토리 렌더링
========================= */

function renderInventory() {
  ensureInventory();

  const grid = getInventoryGrid();
  if (!grid) return;

  grid.innerHTML = "";

  const topCount = window.BALANCE?.TOP_SLOT_COUNT || 8;

  window.inventory.forEach((lv, index) => {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.index = String(index);

    if (index < topCount) {
      slot.classList.add("attack-slot");
    }

    if (!lv) {
      slot.classList.add("empty-slot");

      if (index < topCount) {
        slot.innerHTML = `
          <div class="slot-badge">공격</div>
          <div class="empty-text">빈 슬롯</div>
        `;
      } else {
        slot.innerHTML = `<div class="empty-text">+</div>`;
      }
    } else {
      const emoji = typeof window.getToothEmoji === "function" ? window.getToothEmoji(lv) : "🦷";
      const name = typeof window.getToothName === "function" ? window.getToothName(lv) : `Lv.${lv} 치아`;
      const levelText = typeof window.getToothDisplayLevel === "function" ? window.getToothDisplayLevel(lv) : `Lv.${lv}`;
      const sizeClass = typeof window.getToothSizeClass === "function" ? window.getToothSizeClass(lv) : "";
      const themeClass = typeof window.getToothThemeClass === "function" ? window.getToothThemeClass(lv) : "";

      slot.classList.add("has-tooth", themeClass);

      if (lv === (window.BALANCE?.MERGE_MAX_LEVEL || 24)) {
        slot.classList.add("sealed-tooth");
      }

      if (lv >= (window.BALANCE?.TRANSCEND_LEVEL || 25)) {
        slot.classList.add("max-tooth");
      }

      slot.innerHTML = `
        ${index < topCount ? `<div class="slot-badge">공격</div>` : ""}
        ${lv === (window.BALANCE?.MERGE_MAX_LEVEL || 24) ? `<div class="seal-badge">🔒</div>` : ""}
        <div class="slot-emoji ${sizeClass}" title="${name}">${emoji}</div>
        <div class="slot-level">${levelText}</div>
      `;
    }

    bindSlotEvents(slot);
    grid.appendChild(slot);
  });

  if (typeof window.updateResourceBar === "function") {
    window.updateResourceBar();
  }
}

function bindSlotEvents(slot) {
  slot.addEventListener("pointerdown", onSlotPointerDown);
  slot.addEventListener("pointermove", onSlotPointerMove);
  slot.addEventListener("pointerup", onSlotPointerUp);
  slot.addEventListener("pointercancel", cancelDrag);
}

function onSlotPointerDown(event) {
  const slot = event.currentTarget;
  const index = Number(slot.dataset.index);
  const lv = Number(window.inventory?.[index]) || 0;

  if (!lv) return;

  event.preventDefault();

  const now = Date.now();

  if (window.lastTapInfo.index === index && now - window.lastTapInfo.time < 330) {
    window.lastTapInfo = { index: -1, time: 0 };
    handleSlotDoubleTap(index);
    return;
  }

  window.lastTapInfo = { index, time: now };

  window.dragState = {
    index,
    level: lv,
    startX: event.clientX,
    startY: event.clientY,
    currentX: event.clientX,
    currentY: event.clientY,
    dragging: false,
    pointerId: event.pointerId,
    ghost: null
  };

  try {
    slot.setPointerCapture(event.pointerId);
  } catch (error) {
    console.warn(error);
  }
}

function onSlotPointerMove(event) {
  if (!window.dragState) return;

  const ds = window.dragState;
  const dx = event.clientX - ds.startX;
  const dy = event.clientY - ds.startY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  ds.currentX = event.clientX;
  ds.currentY = event.clientY;

  if (!ds.dragging && distance > 8) {
    ds.dragging = true;
    createDragGhost(ds);
  }

  if (ds.dragging && ds.ghost) {
    ds.ghost.style.left = `${event.clientX}px`;
    ds.ghost.style.top = `${event.clientY}px`;
  }
}

function onSlotPointerUp(event) {
  if (!window.dragState) return;

  const ds = window.dragState;

  if (!ds.dragging) {
    cancelDrag();
    return;
  }

  const target = document.elementFromPoint(event.clientX, event.clientY);
  const targetSlot = target ? target.closest(".slot") : null;

  if (targetSlot) {
    const targetIndex = Number(targetSlot.dataset.index);

    if (!Number.isNaN(targetIndex) && targetIndex !== ds.index) {
      handleDrop(ds.index, targetIndex);
    }
  }

  cancelDrag();
}

function createDragGhost(ds) {
  removeDragGhost();

  const lv = ds.level;
  const emoji = typeof window.getToothEmoji === "function" ? window.getToothEmoji(lv) : "🦷";
  const levelText = typeof window.getToothDisplayLevel === "function" ? window.getToothDisplayLevel(lv) : `Lv.${lv}`;

  const ghost = document.createElement("div");
  ghost.className = "drag-ghost";
  ghost.innerHTML = `
    <div>${emoji}</div>
    <small>${levelText}</small>
  `;

  document.body.appendChild(ghost);

  ghost.style.left = `${ds.currentX}px`;
  ghost.style.top = `${ds.currentY}px`;

  ds.ghost = ghost;
}

function removeDragGhost() {
  const old = document.querySelector(".drag-ghost");
  if (old && old.parentNode) old.parentNode.removeChild(old);
}

function cancelDrag() {
  removeDragGhost();
  window.dragState = null;
}

function handleDrop(fromIndex, toIndex) {
  ensureInventory();

  const fromLv = Number(window.inventory[fromIndex]) || 0;
  const toLv = Number(window.inventory[toIndex]) || 0;

  if (!fromLv || fromIndex === toIndex) return;

  if (!toLv) {
    window.inventory[toIndex] = fromLv;
    window.inventory[fromIndex] = 0;
    updateAfterInventoryChange();
    return;
  }

  if (fromLv === toLv) {
    if (!canMergeThisLevel(fromLv)) {
      if (fromLv === (window.BALANCE?.MERGE_MAX_LEVEL || 24)) {
        safeToast("Lv.24는 합성이 아니라 더블터치로 봉인해제합니다.", "info");
      } else if (fromLv >= (window.BALANCE?.TRANSCEND_LEVEL || 25)) {
        safeToast("Lv.MAX는 최종 단계입니다.", "info");
      }
      return;
    }

    const resultLv = createMergedLevel(fromLv);

    window.inventory[toIndex] = resultLv;
    window.inventory[fromIndex] = 0;
    window.totalMergeCount = safeNumber(window.totalMergeCount) + 1;

    afterNewToothCreated(resultLv);
    updateAfterInventoryChange();

    return;
  }

  /*
    서로 다른 레벨이면 자리 교환
  */
  window.inventory[toIndex] = fromLv;
  window.inventory[fromIndex] = toLv;
  updateAfterInventoryChange();
}

function canMergeThisLevel(level) {
  const lv = Number(level) || 0;
  const mergeMax = window.BALANCE?.MERGE_MAX_LEVEL || 24;

  return lv >= 1 && lv < mergeMax;
}

function createMergedLevel(level) {
  const lv = Number(level) || 1;
  const mergeMax = window.BALANCE?.MERGE_MAX_LEVEL || 24;

  let resultLv = lv + 1;

  /*
    대성공 규칙:
    - Lv.1~22까지만 대성공 가능
    - Lv.23 + Lv.23은 무조건 Lv.24
    - 합성 결과는 절대 Lv.25가 될 수 없음
  */
  const greatChance = getGreatSuccessChance();

  if (lv <= 22 && Math.random() < greatChance) {
    resultLv = lv + 2;
    resultLv = Math.min(resultLv, mergeMax);
    showGreatMergeEffect(resultLv);
  }

  resultLv = Math.min(resultLv, mergeMax);

  return resultLv;
}

function getGreatSuccessChance() {
  const lv = Number(window.greatChanceLevel) || 0;
  return Math.max(0, Math.min(0.35, lv * 0.015));
}

function showGreatMergeEffect(resultLv) {
  const name = typeof window.getToothName === "function" ? window.getToothName(resultLv) : `Lv.${resultLv}`;
  safeToast(`대성공! ${name} 탄생`, "success", 2000);
}

function afterNewToothCreated(level) {
  const lv = Number(level) || 0;

  if (typeof window.registerToothDiscovery === "function") {
    window.registerToothDiscovery(lv, false);
  }

  if (typeof window.checkTranscendGuide === "function") {
    window.checkTranscendGuide(lv);
  }
}

/* =========================
   더블터치 처리
========================= */

function handleSlotDoubleTap(index) {
  ensureInventory();

  const lv = Number(window.inventory[index]) || 0;

  if (!lv) return;

  if (lv === (window.BALANCE?.MERGE_MAX_LEVEL || 24)) {
    openTranscendModal(index);
    return;
  }

  if (lv >= (window.BALANCE?.TRANSCEND_LEVEL || 25)) {
    safeToast("Lv.MAX 초월 왕관 치아는 최종 단계입니다.", "info");
    return;
  }

  massMergeLevel(lv, false);
}

/* =========================
   대량 합성 / 자동 합성
========================= */

function massMergeLevel(level, includeTopSlots = false) {
  ensureInventory();

  const lv = Number(level) || 0;

  if (!canMergeThisLevel(lv)) return false;

  const topCount = window.BALANCE?.TOP_SLOT_COUNT || 8;
  let changed = false;
  let created24 = false;
  let mergeCount = 0;

  while (true) {
    const indices = [];

    for (let i = 0; i < window.inventory.length; i += 1) {
      if (!includeTopSlots && i < topCount) continue;
      if (window.inventory[i] === lv) indices.push(i);
      if (indices.length >= 2) break;
    }

    if (indices.length < 2) break;

    const [a, b] = indices;
    const resultLv = createMergedLevel(lv);

    window.inventory[a] = resultLv;
    window.inventory[b] = 0;

    mergeCount += 1;
    changed = true;

    if (resultLv === (window.BALANCE?.MERGE_MAX_LEVEL || 24)) {
      created24 = true;
    }

    afterNewToothCreated(resultLv);
  }

  if (changed) {
    window.totalMergeCount = safeNumber(window.totalMergeCount) + mergeCount;
    cleanupInventory(false);
    updateAfterInventoryChange();

    if (!created24) {
      safeToast(`${mergeCount}회 합성 완료`, "success");
    }
  }

  return changed;
}

function autoMergeInventory() {
  ensureInventory();

  const topCount = window.BALANCE?.TOP_SLOT_COUNT || 8;
  let changed = false;
  let count = 0;

  /*
    자동합성은 Top8 공격 슬롯을 건드리지 않음.
    Lv.24 → Lv.MAX도 절대 자동으로 하지 않음.
  */
  for (let lv = 1; lv < (window.BALANCE?.MERGE_MAX_LEVEL || 24); lv += 1) {
    let loopGuard = 0;

    while (loopGuard < 200) {
      loopGuard += 1;

      const indices = [];

      for (let i = topCount; i < window.inventory.length; i += 1) {
        if (window.inventory[i] === lv) indices.push(i);
        if (indices.length >= 2) break;
      }

      if (indices.length < 2) break;

      const [a, b] = indices;
      const resultLv = createMergedLevel(lv);

      window.inventory[a] = resultLv;
      window.inventory[b] = 0;

      count += 1;
      changed = true;

      afterNewToothCreated(resultLv);
    }
  }

  if (changed) {
    window.totalMergeCount = safeNumber(window.totalMergeCount) + count;
    cleanupInventory(false);
    updateAfterInventoryChange();
  }

  return changed;
}

/* =========================
   봉인해제 / Lv.MAX 제작
========================= */

function openTranscendModal(index) {
  ensureInventory();

  const lv = Number(window.inventory[index]) || 0;

  if (lv !== (window.BALANCE?.MERGE_MAX_LEVEL || 24)) {
    safeToast("봉인해제 가능한 Lv.24 치아가 아닙니다.", "danger");
    return;
  }

  const cost = window.TRANSCEND_COST || {
    gold: 1_000_000_000_000_000,
    diamond: 5000,
    bossToken: 5
  };

  const hasGold = safeNumber(window.gold) >= safeNumber(cost.gold);
  const hasDia = safeNumber(window.diamond) >= safeNumber(cost.diamond);
  const hasToken = safeNumber(window.bossToken) >= safeNumber(cost.bossToken);

  const html = `
    <div class="transcend-modal-inner">
      <div class="transcend-title-icon">🔓</div>
      <h2>봉인해제</h2>
      <p class="modal-desc">
        <b>Lv.24 봉인된 왕관 치아</b>를<br>
        <b>Lv.MAX 초월 왕관 치아</b>로 각성시키겠습니까?
      </p>

      <div class="transcend-preview">
        <div class="transcend-before">
          <span class="preview-emoji tooth-size-large">👑</span>
          <b>Lv.24</b>
          <small>봉인된 왕관 치아</small>
        </div>
        <div class="transcend-arrow">➜</div>
        <div class="transcend-after">
          <span class="preview-emoji tooth-size-max">✨👑✨</span>
          <b>Lv.MAX</b>
          <small>초월 왕관 치아</small>
        </div>
      </div>

      <div class="cost-list">
        <div class="${hasToken ? "ok" : "lack"}">
          <span>보스 징표</span>
          <b>${formatCost(window.bossToken)} / ${formatCost(cost.bossToken)}</b>
        </div>
        <div class="${hasDia ? "ok" : "lack"}">
          <span>다이아</span>
          <b>${formatCost(window.diamond)} / ${formatCost(cost.diamond)}</b>
        </div>
        <div class="${hasGold ? "ok" : "lack"}">
          <span>골드</span>
          <b>${formatCost(window.gold)} / ${formatCost(cost.gold)}</b>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn-sub" onclick="closeGenericModal()">취소</button>
        <button class="btn-main" onclick="performTranscend(${index})">봉인해제</button>
      </div>
    </div>
  `;

  if (typeof window.openGenericModal === "function") {
    window.openGenericModal(html);
  } else {
    alert("봉인해제 창을 열 수 없습니다.");
  }
}

function performTranscend(index) {
  ensureInventory();

  const lv = Number(window.inventory[index]) || 0;

  if (lv !== (window.BALANCE?.MERGE_MAX_LEVEL || 24)) {
    safeToast("봉인해제 가능한 치아가 아닙니다.", "danger");
    return;
  }

  const cost = window.TRANSCEND_COST || {
    gold: 1_000_000_000_000_000,
    diamond: 5000,
    bossToken: 5
  };

  if (safeNumber(window.bossToken) < safeNumber(cost.bossToken)) {
    safeToast("보스 징표가 부족합니다.", "danger");
    return;
  }

  if (safeNumber(window.diamond) < safeNumber(cost.diamond)) {
    safeToast("다이아가 부족합니다.", "danger");
    return;
  }

  if (safeNumber(window.gold) < safeNumber(cost.gold)) {
    safeToast("골드가 부족합니다.", "danger");
    return;
  }

  window.bossToken = safeNumber(window.bossToken) - safeNumber(cost.bossToken);
  window.diamond = safeNumber(window.diamond) - safeNumber(cost.diamond);
  window.gold = safeNumber(window.gold) - safeNumber(cost.gold);

  window.inventory[index] = window.BALANCE?.TRANSCEND_LEVEL || 25;

  if (typeof window.registerToothDiscovery === "function") {
    window.registerToothDiscovery(window.BALANCE?.TRANSCEND_LEVEL || 25, false);
  }

  const firstAwaken = !window.hasPlayedAwakenVideo;

  if (typeof window.closeGenericModal === "function") {
    window.closeGenericModal();
  }

  updateAfterInventoryChange();

  if (firstAwaken) {
    if (typeof window.playAwakenVideo === "function") {
      window.playAwakenVideo(false);
    } else {
      window.hasPlayedAwakenVideo = true;
      safeToast("✨ Lv.MAX 초월 왕관 치아 완성!", "success", 2400);
    }
  } else {
    safeToast("✨ Lv.MAX 초월 왕관 치아 완성!", "success", 2400);
  }

  if (typeof window.saveGame === "function") {
    window.saveGame(false);
  }
}

/* =========================
   정렬 / 정리
========================= */

function cleanupInventory(shouldRender = true) {
  ensureInventory();

  const topCount = window.BALANCE?.TOP_SLOT_COUNT || 8;

  const top = window.inventory.slice(0, topCount);
  const bottom = window.inventory.slice(topCount);

  const filled = bottom.filter((lv) => Number(lv) > 0);
  const empty = Array(bottom.length - filled.length).fill(0);

  window.inventory = [...top, ...filled, ...empty];

  if (shouldRender) {
    updateAfterInventoryChange();
  }
}

function sortInventory() {
  ensureInventory();

  const topCount = window.BALANCE?.TOP_SLOT_COUNT || 8;

  const top = window.inventory.slice(0, topCount);
  const bottom = window.inventory.slice(topCount);

  const sorted = bottom
    .filter((lv) => Number(lv) > 0)
    .sort((a, b) => Number(b) - Number(a));

  const empty = Array(bottom.length - sorted.length).fill(0);

  window.inventory = [...top, ...sorted, ...empty];

  updateAfterInventoryChange();
  safeToast("아래 인벤토리를 정렬했습니다.", "success");
}

function clearEmptyInventorySpaces() {
  cleanupInventory(true);
}

/* =========================
   자동 채굴 / 자동 합성 토글
========================= */

function toggleAutoMine() {
  window.autoMineOn = !window.autoMineOn;

  if (typeof window.updateToggleButtons === "function") {
    window.updateToggleButtons();
  }

  if (typeof window.saveGame === "function") {
    window.saveGame(false);
  }

  safeToast(window.autoMineOn ? "자동채굴 ON" : "자동채굴 OFF", "info");
}

function toggleAutoMerge() {
  window.autoMergeOn = !window.autoMergeOn;

  if (typeof window.updateToggleButtons === "function") {
    window.updateToggleButtons();
  }

  if (typeof window.saveGame === "function") {
    window.saveGame(false);
  }

  safeToast(window.autoMergeOn ? "자동합성 ON" : "자동합성 OFF", "info");
}

function updateToggleButtons() {
  const mineBtn = document.getElementById("auto-mine-btn");
  const mergeBtn = document.getElementById("auto-merge-btn");

  if (mineBtn) {
    mineBtn.textContent = window.autoMineOn ? "자동채굴 ON" : "자동채굴 OFF";
    mineBtn.classList.toggle("active", !!window.autoMineOn);
  }

  if (mergeBtn) {
    mergeBtn.textContent = window.autoMergeOn ? "자동합성 ON" : "자동합성 OFF";
    mergeBtn.classList.toggle("active", !!window.autoMergeOn);
  }
}

/* =========================
   쿠폰 / 테스트 보조
========================= */

function redeemCoupon() {
  const code = prompt("쿠폰 코드를 입력하세요.");
  if (!code) return;

  const normalized = code.trim().toUpperCase();

  if (normalized === "TOOTHMAX") {
    window.gold = safeNumber(window.gold) + 1000000;
    window.diamond = safeNumber(window.diamond) + 100;
    safeToast("쿠폰 보상 지급 완료!", "success");
  } else if (normalized === "BOSS") {
    window.bossToken = safeNumber(window.bossToken) + 3;
    safeToast("보스 징표 3개 지급!", "success");
  } else {
    safeToast("사용할 수 없는 쿠폰입니다.", "danger");
    return;
  }

  updateAfterInventoryChange();
}

/* =========================
   전역 노출
========================= */

window.ensureInventory = ensureInventory;

window.processMining = processMining;
window.rollMiningLevel = rollMiningLevel;
window.addMinedItem = addMinedItem;
window.setupMiningTouch = setupMiningTouch;

window.renderInventory = renderInventory;

window.handleDrop = handleDrop;
window.createMergedLevel = createMergedLevel;
window.canMergeThisLevel = canMergeThisLevel;
window.massMergeLevel = massMergeLevel;
window.autoMergeInventory = autoMergeInventory;

window.openTranscendModal = openTranscendModal;
window.performTranscend = performTranscend;

window.cleanupInventory = cleanupInventory;
window.clearEmptyInventorySpaces = clearEmptyInventorySpaces;
window.sortInventory = sortInventory;

window.toggleAutoMine = toggleAutoMine;
window.toggleAutoMerge = toggleAutoMerge;
window.updateToggleButtons = updateToggleButtons;

window.redeemCoupon = redeemCoupon;

console.log("치아 연대기 action.js loaded v8.2.0");
