/* upgrade.js v8.2.0
   치아 연대기 - 전력강화 / 채굴강화 / 슬롯제련 / 용병훈련
   핵심:
   - 곡괭이 현재 레벨 명확히 표시
   - 최고 등급 곡괭이도 Lv.8 / 8 표시
   - MAX 버튼 크기 유지
   - 전력강화 탭에서 모든 강화 기능 연결
*/

"use strict";

/* =========================
   안전 초기화
========================= */

function ensureUpgradeState() {
  if (!window.globalUpgrades) {
    window.globalUpgrades = { rng: 0, cd: 0 };
  }

  window.globalUpgrades.rng = Number(window.globalUpgrades.rng) || 0;
  window.globalUpgrades.cd = Number(window.globalUpgrades.cd) || 0;

  if (!Array.isArray(window.slotUpgrades)) {
    const count = window.BALANCE?.TOP_SLOT_COUNT || 8;
    window.slotUpgrades = Array.from({ length: count }, () => ({
      atk: 0,
      cd: 0,
      rng: 0
    }));
  }

  const count = window.BALANCE?.TOP_SLOT_COUNT || 8;

  while (window.slotUpgrades.length < count) {
    window.slotUpgrades.push({ atk: 0, cd: 0, rng: 0 });
  }

  window.slotUpgrades = window.slotUpgrades.map((slot) => ({
    atk: Number(slot?.atk) || 0,
    cd: Number(slot?.cd) || 0,
    rng: Number(slot?.rng) || 0
  }));

  if (!window.trainingLevels) {
    window.trainingLevels = {
      hp: 0,
      atk: 0,
      spd: 0,
      crit: 0,
      splashDmg: 0,
      splashRange: 0
    };
  }

  ["hp", "atk", "spd", "crit", "splashDmg", "splashRange"].forEach((key) => {
    window.trainingLevels[key] = Number(window.trainingLevels[key]) || 0;
  });

  if (!Array.isArray(window.ownedMercenaries)) {
    window.ownedMercenaries = [0];
  }

  if (!window.ownedMercenaries.includes(0)) {
    window.ownedMercenaries.unshift(0);
  }

  if (typeof window.currentMercenary === "undefined") {
    window.currentMercenary = 0;
  }
}

function upgradeToast(message, type = "info", duration = 1700) {
  if (typeof window.showToast === "function") {
    window.showToast(message, type, duration);
  } else {
    console.log(message);
  }
}

function upgradeFmt(value) {
  if (typeof window.formatNumber === "function") return window.formatNumber(value);
  if (typeof window.fmt === "function") return window.fmt(value);
  return String(Math.floor(Number(value) || 0));
}

function upgradeSaveAndRefresh() {
  if (typeof window.saveGame === "function") {
    window.saveGame(false);
  }

  renderRefineView();

  if (typeof window.updateUI === "function") {
    window.updateUI();
  }

  if (typeof window.updateResourceBar === "function") {
    window.updateResourceBar();
  }

  if (typeof window.renderInventory === "function") {
    window.renderInventory();
  }

  if (typeof window.renderBattleSlots === "function") {
    window.renderBattleSlots();
  }
}

function canPayGold(cost) {
  return (Number(window.gold) || 0) >= (Number(cost) || 0);
}

function payGold(cost) {
  const c = Number(cost) || 0;

  if (c <= 0) return true;

  if (!canPayGold(c)) {
    upgradeToast("골드가 부족합니다.", "danger");
    return false;
  }

  window.gold = (Number(window.gold) || 0) - c;
  return true;
}

function openUpgradeModal(html) {
  if (typeof window.openGenericModal === "function") {
    window.openGenericModal(html);
    return;
  }

  const modal = document.getElementById("shop-modal");
  const content = document.getElementById("shop-content");

  if (modal && content) {
    content.innerHTML = html;
    modal.style.display = "flex";
    modal.classList.add("active");
    return;
  }

  alert("강화창을 열 수 없습니다.");
}

function closeUpgradeModal() {
  if (typeof window.closeGenericModal === "function") {
    window.closeGenericModal();
    return;
  }

  const modal = document.getElementById("shop-modal");
  if (modal) {
    modal.style.display = "none";
    modal.classList.remove("active");
  }
}

/* =========================
   전력강화 메인 화면
========================= */

function renderRefineView() {
  ensureUpgradeState();

  const grid = document.getElementById("refine-grid");

  if (!grid) return;

  const topCount = window.BALANCE?.TOP_SLOT_COUNT || 8;
  const inventory = Array.isArray(window.inventory) ? window.inventory : [];
  const topSlots = inventory.slice(0, topCount);

  const topPower = topSlots.reduce((sum, lv, index) => {
    const base =
      typeof window.getBaseAttackByLevel === "function"
        ? window.getBaseAttackByLevel(lv)
        : Number(lv || 0) * 10;

    const slotBonus = 1 + (Number(window.slotUpgrades[index]?.atk) || 0) * 0.08;

    return sum + Math.floor(base * slotBonus);
  }, 0);

  const pickaxe =
    typeof window.getPickaxeInfo === "function"
      ? window.getPickaxeInfo(window.pickaxeLevel)
      : {
          level: Number(window.pickaxeLevel) || 1,
          icon: "⛏️",
          name: "곡괭이",
          power: 1
        };

  const pickaxeText =
    typeof window.getPickaxeDisplay === "function"
      ? window.getPickaxeDisplay(window.pickaxeLevel)
      : `${pickaxe.icon} ${pickaxe.name} Lv.${pickaxe.level || window.pickaxeLevel} / ${
          window.BALANCE?.PICKAXE_MAX_LEVEL || 8
        }`;

  const merc =
    (window.MERCENARIES || []).find((m) => m.id === window.currentMercenary) ||
    (window.MERCENARIES || [])[0] ||
    {
      icon: "🧑‍🚀",
      name: "기본 용병",
      hp: 0,
      atkRate: 1
    };

  const trainingTotal =
    (Number(window.trainingLevels.hp) || 0) +
    (Number(window.trainingLevels.atk) || 0) +
    (Number(window.trainingLevels.spd) || 0) +
    (Number(window.trainingLevels.crit) || 0) +
    (Number(window.trainingLevels.splashDmg) || 0) +
    (Number(window.trainingLevels.splashRange) || 0);

  grid.innerHTML = `
    <div class="power-card mining-card">
      <div class="power-card-head">
        <div class="power-icon">${pickaxe.icon || "⛏️"}</div>
        <div>
          <h3>채굴 / 자동화 강화</h3>
          <p>${pickaxeText}</p>
        </div>
      </div>
      <div class="power-stats">
        <span>채굴 파워 <b>${upgradeFmt(pickaxe.power || 1)}</b></span>
        <span>자동채굴 Lv.<b>${Number(window.autoMineLevel) || 0}</b></span>
        <span>자동합성 Lv.<b>${Number(window.autoMergeLevel) || 0}</b></span>
      </div>
      <button class="btn-main full" onclick="openShop()">강화하기</button>
    </div>

    <div class="power-card">
      <div class="power-card-head">
        <div class="power-icon">🔥</div>
        <div>
          <h3>Top8 슬롯 제련</h3>
          <p>첫 줄 공격 슬롯의 화력을 강화합니다.</p>
        </div>
      </div>
      <div class="power-stats">
        <span>현재 Top8 기본 화력 <b>${upgradeFmt(topPower)}</b></span>
        <span>슬롯 수 <b>${topCount}</b></span>
      </div>
      <button class="btn-main full" onclick="openSlotRefineModal()">슬롯 제련</button>
    </div>

    <div class="power-card">
      <div class="power-card-head">
        <div class="power-icon">🎯</div>
        <div>
          <h3>공통 전투 시스템</h3>
          <p>모든 공격 슬롯에 적용되는 전투 보조 강화입니다.</p>
        </div>
      </div>
      <div class="power-stats">
        <span>사거리 강화 Lv.<b>${Number(window.globalUpgrades.rng) || 0}</b></span>
        <span>공속 강화 Lv.<b>${Number(window.globalUpgrades.cd) || 0}</b></span>
      </div>
      <button class="btn-main full" onclick="openSystemUpgradeModal()">시스템 강화</button>
    </div>

    <div class="power-card">
      <div class="power-card-head">
        <div class="power-icon">${merc.icon || "🧑‍🚀"}</div>
        <div>
          <h3>용병 모집 / 교체</h3>
          <p>현재 용병: ${merc.name || "기본 용병"}</p>
        </div>
      </div>
      <div class="power-stats">
        <span>보유 용병 <b>${Array.isArray(window.ownedMercenaries) ? window.ownedMercenaries.length : 1}</b></span>
        <span>공격 배율 <b>x${Number(merc.atkRate || 1).toFixed(2)}</b></span>
      </div>
      <button class="btn-main full" onclick="openMercenaryModal()">용병 관리</button>
    </div>

    <div class="power-card">
      <div class="power-card-head">
        <div class="power-icon">🏋️</div>
        <div>
          <h3>용병 훈련</h3>
          <p>용병의 체력, 공격력, 속도, 치명, 범위 능력을 올립니다.</p>
        </div>
      </div>
      <div class="power-stats">
        <span>총 훈련 수치 <b>${trainingTotal}</b></span>
        <span>체력 Lv.<b>${Number(window.trainingLevels.hp) || 0}</b></span>
        <span>공격 Lv.<b>${Number(window.trainingLevels.atk) || 0}</b></span>
      </div>
      <button class="btn-main full" onclick="openTrainingCamp()">훈련하기</button>
    </div>

    <div class="power-card guide-card">
      <div class="power-card-head">
        <div class="power-icon">👑</div>
        <div>
          <h3>초월 왕관 치아</h3>
          <p>Lv.24 왕관 치아를 더블터치하면 봉인해제 창이 열립니다.</p>
        </div>
      </div>
      <div class="power-stats">
        <span>합성 최대 <b>Lv.24</b></span>
        <span>초월 단계 <b>Lv.MAX</b></span>
      </div>
      <button class="btn-sub full" onclick="showTranscendGuideModal()">초월 안내 보기</button>
    </div>
  `;
}

/* =========================
   채굴 / 자동화 강화
========================= */

function getAutoMineCost() {
  const lv = Number(window.autoMineLevel) || 0;
  return Math.floor(800 * Math.pow(2.25, lv));
}

function getAutoMergeCost() {
  const lv = Number(window.autoMergeLevel) || 0;
  return Math.floor(1800 * Math.pow(2.45, lv));
}

function getGreatChanceCost() {
  const lv = Number(window.greatChanceLevel) || 0;
  return Math.floor(2500 * Math.pow(2.4, lv));
}

function getInventorySlotCost() {
  const extra = Math.max(
    0,
    (Number(window.inventorySize) || window.BALANCE?.BASE_INVENTORY_SIZE || 56) -
      (window.BALANCE?.BASE_INVENTORY_SIZE || 56)
  );
  return Math.floor(6000 * Math.pow(1.8, extra / 8));
}

function openShop() {
  renderShop();
}

function renderShop() {
  ensureUpgradeState();

  const pickaxe =
    typeof window.getPickaxeInfo === "function"
      ? window.getPickaxeInfo(window.pickaxeLevel)
      : {
          level: Number(window.pickaxeLevel) || 1,
          icon: "⛏️",
          name: "곡괭이",
          power: 1
        };

  const maxPickaxe = window.BALANCE?.PICKAXE_MAX_LEVEL || 8;
  const isPickaxeMax = Number(window.pickaxeLevel) >= maxPickaxe;
  const nextPickaxe = !isPickaxeMax && typeof window.getPickaxeInfo === "function"
    ? window.getPickaxeInfo(Number(window.pickaxeLevel) + 1)
    : null;

  const inventorySize = Number(window.inventorySize) || window.BALANCE?.BASE_INVENTORY_SIZE || 56;
  const maxInventory = window.BALANCE?.MAX_INVENTORY_SIZE || 96;
  const inventoryMax = inventorySize >= maxInventory;

  const pickaxeLine = isPickaxeMax
    ? `${pickaxe.icon} ${pickaxe.name} Lv.${pickaxe.level} / ${maxPickaxe} 사용중`
    : `${pickaxe.icon} ${pickaxe.name} Lv.${pickaxe.level} / ${maxPickaxe} 사용중`;

  const nextPickaxeLine = nextPickaxe
    ? `다음: ${nextPickaxe.icon} ${nextPickaxe.name} Lv.${nextPickaxe.level} / ${maxPickaxe}`
    : "최고 등급 곡괭이입니다.";

  const pickaxeCost = nextPickaxe?.cost || 0;

  const html = `
    <div class="upgrade-modal-inner">
      <h2>⛏️ 채굴 / 자동화 강화</h2>
      <p class="modal-desc">채굴 속도와 자동화 성능을 강화합니다.</p>

      <div class="upgrade-list">
        <div class="upgrade-row">
          <div class="upgrade-info">
            <div class="upgrade-title">${pickaxeLine}</div>
            <div class="upgrade-desc">
              수동 채굴 파워 ${upgradeFmt(pickaxe.power || 1)}<br>
              ${nextPickaxeLine}
            </div>
          </div>
          ${
            isPickaxeMax
              ? `<button class="btn-max same-size" disabled>MAX</button>`
              : `<button class="btn-main same-size" onclick="buyPickaxe()">강화<br><small>${upgradeFmt(pickaxeCost)}G</small></button>`
          }
        </div>

        <div class="upgrade-row">
          <div class="upgrade-info">
            <div class="upgrade-title">🤖 자동채굴 Lv.${Number(window.autoMineLevel) || 0}</div>
            <div class="upgrade-desc">자동으로 채굴합니다. 레벨이 높을수록 간격이 줄어듭니다.</div>
          </div>
          <button class="btn-main same-size" onclick="buyAutoMine()">강화<br><small>${upgradeFmt(getAutoMineCost())}G</small></button>
        </div>

        <div class="upgrade-row">
          <div class="upgrade-info">
            <div class="upgrade-title">🔁 자동합성 Lv.${Number(window.autoMergeLevel) || 0}</div>
            <div class="upgrade-desc">Top8 공격 슬롯을 제외한 아래 인벤토리만 자동합성합니다.</div>
          </div>
          <button class="btn-main same-size" onclick="buyAutoMerge()">강화<br><small>${upgradeFmt(getAutoMergeCost())}G</small></button>
        </div>

        <div class="upgrade-row">
          <div class="upgrade-info">
            <div class="upgrade-title">✨ 대성공 확률 Lv.${Number(window.greatChanceLevel) || 0}</div>
            <div class="upgrade-desc">합성 시 +2레벨 대성공 확률 증가. 단, Lv.23+23은 대성공이 발동하지 않습니다.</div>
          </div>
          <button class="btn-main same-size" onclick="buyGreatChance()">강화<br><small>${upgradeFmt(getGreatChanceCost())}G</small></button>
        </div>

        <div class="upgrade-row">
          <div class="upgrade-info">
            <div class="upgrade-title">🎒 인벤토리 확장 ${inventorySize} / ${maxInventory}</div>
            <div class="upgrade-desc">아래 인벤토리 공간을 8칸씩 확장합니다.</div>
          </div>
          ${
            inventoryMax
              ? `<button class="btn-max same-size" disabled>MAX</button>`
              : `<button class="btn-main same-size" onclick="buyInventorySlot()">확장<br><small>${upgradeFmt(getInventorySlotCost())}G</small></button>`
          }
        </div>
      </div>

      <button class="btn-sub full" onclick="closeUpgradeModal()">닫기</button>
    </div>
  `;

  openUpgradeModal(html);
}

function buyPickaxe() {
  const max = window.BALANCE?.PICKAXE_MAX_LEVEL || 8;
  const cur = Number(window.pickaxeLevel) || 1;

  if (cur >= max) {
    upgradeToast(`최고등급 곡괭이 Lv.${max} / ${max} 사용중입니다.`, "info");
    renderShop();
    return;
  }

  const next =
    typeof window.getPickaxeInfo === "function"
      ? window.getPickaxeInfo(cur + 1)
      : { cost: 1000, name: "곡괭이", icon: "⛏️", level: cur + 1 };

  if (!payGold(next.cost)) return;

  window.pickaxeLevel = cur + 1;

  upgradeToast(`${next.icon} ${next.name} Lv.${next.level} / ${max} 강화 완료!`, "success");

  upgradeSaveAndRefresh();
  renderShop();
}

function buyAutoMine() {
  const cost = getAutoMineCost();

  if (!payGold(cost)) return;

  window.autoMineLevel = (Number(window.autoMineLevel) || 0) + 1;

  upgradeToast(`자동채굴 Lv.${window.autoMineLevel} 강화 완료`, "success");

  upgradeSaveAndRefresh();
  renderShop();
}

function buyAutoMerge() {
  const cost = getAutoMergeCost();

  if (!payGold(cost)) return;

  window.autoMergeLevel = (Number(window.autoMergeLevel) || 0) + 1;

  upgradeToast(`자동합성 Lv.${window.autoMergeLevel} 강화 완료`, "success");

  upgradeSaveAndRefresh();
  renderShop();
}

function buyGreatChance() {
  const cost = getGreatChanceCost();

  if (!payGold(cost)) return;

  window.greatChanceLevel = (Number(window.greatChanceLevel) || 0) + 1;

  upgradeToast(`대성공 확률 Lv.${window.greatChanceLevel} 강화 완료`, "success");

  upgradeSaveAndRefresh();
  renderShop();
}

function buyInventorySlot() {
  const maxInventory = window.BALANCE?.MAX_INVENTORY_SIZE || 96;
  const current = Number(window.inventorySize) || window.BALANCE?.BASE_INVENTORY_SIZE || 56;

  if (current >= maxInventory) {
    upgradeToast("인벤토리가 이미 최대치입니다.", "info");
    renderShop();
    return;
  }

  const cost = getInventorySlotCost();

  if (!payGold(cost)) return;

  window.inventorySize = Math.min(maxInventory, current + 8);

  if (!Array.isArray(window.inventory)) {
    window.inventory = Array(window.inventorySize).fill(0);
  }

  while (window.inventory.length < window.inventorySize) {
    window.inventory.push(0);
  }

  upgradeToast(`인벤토리 ${window.inventorySize}칸으로 확장`, "success");

  upgradeSaveAndRefresh();
  renderShop();
}

/* =========================
   공통 전투 시스템 강화
========================= */

function getGlobalRngCost() {
  const lv = Number(window.globalUpgrades?.rng) || 0;
  return Math.floor(5000 * Math.pow(2.15, lv));
}

function getGlobalCdCost() {
  const lv = Number(window.globalUpgrades?.cd) || 0;
  return Math.floor(7000 * Math.pow(2.2, lv));
}

function openSystemUpgradeModal() {
  ensureUpgradeState();

  const rngLv = Number(window.globalUpgrades.rng) || 0;
  const cdLv = Number(window.globalUpgrades.cd) || 0;

  const html = `
    <div class="upgrade-modal-inner">
      <h2>🎯 공통 전투 시스템</h2>
      <p class="modal-desc">모든 Top8 공격 슬롯에 적용되는 공통 전투 강화입니다.</p>

      <div class="upgrade-list">
        <div class="upgrade-row">
          <div class="upgrade-info">
            <div class="upgrade-title">📡 전투 사거리 강화 Lv.${rngLv}</div>
            <div class="upgrade-desc">모든 치아 무기의 기본 사거리를 증가시킵니다.</div>
          </div>
          <button class="btn-main same-size" onclick="upgradeGlobalRng()">강화<br><small>${upgradeFmt(getGlobalRngCost())}G</small></button>
        </div>

        <div class="upgrade-row">
          <div class="upgrade-info">
            <div class="upgrade-title">⚡ 공격 속도 강화 Lv.${cdLv}</div>
            <div class="upgrade-desc">모든 치아 무기의 공격 간격을 감소시킵니다.</div>
          </div>
          <button class="btn-main same-size" onclick="upgradeGlobalCd()">강화<br><small>${upgradeFmt(getGlobalCdCost())}G</small></button>
        </div>
      </div>

      <button class="btn-sub full" onclick="closeUpgradeModal()">닫기</button>
    </div>
  `;

  openUpgradeModal(html);
}

function upgradeGlobalRng() {
  ensureUpgradeState();

  const cost = getGlobalRngCost();

  if (!payGold(cost)) return;

  window.globalUpgrades.rng += 1;

  upgradeToast(`전투 사거리 Lv.${window.globalUpgrades.rng} 강화 완료`, "success");

  upgradeSaveAndRefresh();
  openSystemUpgradeModal();
}

function upgradeGlobalCd() {
  ensureUpgradeState();

  const cost = getGlobalCdCost();

  if (!payGold(cost)) return;

  window.globalUpgrades.cd += 1;

  upgradeToast(`공격 속도 Lv.${window.globalUpgrades.cd} 강화 완료`, "success");

  upgradeSaveAndRefresh();
  openSystemUpgradeModal();
}

/* =========================
   Top8 슬롯 제련
========================= */

function getSlotUpgradeCost(slotIndex, type) {
  ensureUpgradeState();

  const lv = Number(window.slotUpgrades[slotIndex]?.[type]) || 0;
  const base = type === "atk" ? 3500 : type === "cd" ? 5500 : 4800;

  return Math.floor(base * Math.pow(1.9, lv) * (1 + slotIndex * 0.18));
}

function openSlotRefineModal() {
  ensureUpgradeState();

  const topCount = window.BALANCE?.TOP_SLOT_COUNT || 8;
  const inventory = Array.isArray(window.inventory) ? window.inventory : [];

  const rows = Array.from({ length: topCount }, (_, index) => {
    const lv = Number(inventory[index]) || 0;
    const emoji = lv && typeof window.getToothEmoji === "function" ? window.getToothEmoji(lv) : "—";
    const levelText =
      lv && typeof window.getToothDisplayLevel === "function"
        ? window.getToothDisplayLevel(lv)
        : lv
        ? `Lv.${lv}`
        : "빈 슬롯";

    const up = window.slotUpgrades[index] || { atk: 0, cd: 0, rng: 0 };

    return `
      <div class="slot-refine-row">
        <div class="slot-refine-head">
          <div class="slot-refine-icon">${emoji}</div>
          <div>
            <b>${index + 1}번 공격 슬롯</b>
            <small>${levelText}</small>
          </div>
        </div>

        <div class="slot-refine-buttons">
          <button class="btn-main same-size" onclick="upgradeSlot(${index}, 'atk')">
            공격 Lv.${Number(up.atk) || 0}<br>
            <small>${upgradeFmt(getSlotUpgradeCost(index, "atk"))}G</small>
          </button>
          <button class="btn-main same-size" onclick="upgradeSlot(${index}, 'cd')">
            공속 Lv.${Number(up.cd) || 0}<br>
            <small>${upgradeFmt(getSlotUpgradeCost(index, "cd"))}G</small>
          </button>
          <button class="btn-main same-size" onclick="upgradeSlot(${index}, 'rng')">
            사거리 Lv.${Number(up.rng) || 0}<br>
            <small>${upgradeFmt(getSlotUpgradeCost(index, "rng"))}G</small>
          </button>
        </div>
      </div>
    `;
  }).join("");

  const html = `
    <div class="upgrade-modal-inner wide">
      <h2>🔥 Top8 슬롯 제련</h2>
      <p class="modal-desc">첫 번째 줄 8칸은 던전에서 공격 슬롯으로 사용됩니다.</p>

      <div class="slot-refine-list">
        ${rows}
      </div>

      <button class="btn-sub full" onclick="closeUpgradeModal()">닫기</button>
    </div>
  `;

  openUpgradeModal(html);
}

function upgradeSlot(index, type) {
  ensureUpgradeState();

  const slotIndex = Number(index);

  if (!window.slotUpgrades[slotIndex]) {
    upgradeToast("슬롯 정보를 찾을 수 없습니다.", "danger");
    return;
  }

  const cost = getSlotUpgradeCost(slotIndex, type);

  if (!payGold(cost)) return;

  window.slotUpgrades[slotIndex][type] = (Number(window.slotUpgrades[slotIndex][type]) || 0) + 1;

  const label = type === "atk" ? "공격" : type === "cd" ? "공속" : "사거리";

  upgradeToast(`${slotIndex + 1}번 슬롯 ${label} 제련 완료`, "success");

  upgradeSaveAndRefresh();
  openSlotRefineModal();
}

/* =========================
   용병 훈련
========================= */

function getTrainingCost(key) {
  ensureUpgradeState();

  const lv = Number(window.trainingLevels[key]) || 0;
  const baseMap = {
    hp: 4000,
    atk: 5500,
    spd: 7000,
    crit: 9000,
    splashDmg: 12000,
    splashRange: 15000
  };

  return Math.floor((baseMap[key] || 5000) * Math.pow(1.85, lv));
}

function getTrainingMax(key) {
  const found = (window.TRAINING_TYPES || []).find((item) => item.key === key);
  return found?.max || 50;
}

function openTrainingCamp() {
  renderTrainingCamp();
}

function renderTrainingCamp() {
  ensureUpgradeState();

  const types = window.TRAINING_TYPES || [
    { key: "hp", name: "체력 훈련", icon: "❤️", desc: "용병 체력 증가", max: 50 },
    { key: "atk", name: "공격 훈련", icon: "⚔️", desc: "용병 공격력 증가", max: 50 },
    { key: "spd", name: "속도 훈련", icon: "🏃", desc: "용병 이동 속도 증가", max: 30 },
    { key: "crit", name: "치명 훈련", icon: "💥", desc: "치명 확률 증가", max: 30 },
    { key: "splashDmg", name: "범위 피해 훈련", icon: "🌊", desc: "범위 피해 증가", max: 30 },
    { key: "splashRange", name: "범위 확장 훈련", icon: "📡", desc: "범위 공격 반경 증가", max: 30 }
  ];

  const rows = types.map((type) => {
    const lv = Number(window.trainingLevels[type.key]) || 0;
    const max = Number(type.max) || getTrainingMax(type.key);
    const isMax = lv >= max;

    return `
      <div class="upgrade-row">
        <div class="upgrade-info">
          <div class="upgrade-title">${type.icon} ${type.name} Lv.${lv} / ${max}</div>
          <div class="upgrade-desc">${type.desc}</div>
        </div>
        ${
          isMax
            ? `<button class="btn-max same-size" disabled>MAX</button>`
            : `<button class="btn-main same-size" onclick="buyTraining('${type.key}')">훈련<br><small>${upgradeFmt(getTrainingCost(type.key))}G</small></button>`
        }
      </div>
    `;
  }).join("");

  const html = `
    <div class="upgrade-modal-inner">
      <h2>🏋️ 용병 훈련</h2>
      <p class="modal-desc">전투에 참여하는 용병의 능력치를 강화합니다.</p>

      <div class="upgrade-list">
        ${rows}
      </div>

      <button class="btn-sub full" onclick="closeTrainingCamp()">닫기</button>
    </div>
  `;

  openUpgradeModal(html);
}

function closeTrainingCamp() {
  closeUpgradeModal();
}

function buyTraining(key) {
  ensureUpgradeState();

  if (!(key in window.trainingLevels)) {
    upgradeToast("훈련 항목을 찾을 수 없습니다.", "danger");
    return;
  }

  const max = getTrainingMax(key);

  if (window.trainingLevels[key] >= max) {
    upgradeToast("이미 최대 훈련입니다.", "info");
    renderTrainingCamp();
    return;
  }

  const cost = getTrainingCost(key);

  if (!payGold(cost)) return;

  window.trainingLevels[key] += 1;

  upgradeToast("훈련 완료", "success");

  upgradeSaveAndRefresh();
  renderTrainingCamp();
}

/* =========================
   전역 노출
========================= */

window.ensureUpgradeState = ensureUpgradeState;

window.renderRefineView = renderRefineView;

window.openShop = openShop;
window.renderShop = renderShop;
window.closeUpgradeModal = closeUpgradeModal;

window.buyPickaxe = buyPickaxe;
window.buyAutoMine = buyAutoMine;
window.buyAutoMerge = buyAutoMerge;
window.buyGreatChance = buyGreatChance;
window.buyInventorySlot = buyInventorySlot;

window.openSystemUpgradeModal = openSystemUpgradeModal;
window.upgradeGlobalRng = upgradeGlobalRng;
window.upgradeGlobalCd = upgradeGlobalCd;

window.openSlotRefineModal = openSlotRefineModal;
window.upgradeSlot = upgradeSlot;

window.openTrainingCamp = openTrainingCamp;
window.renderTrainingCamp = renderTrainingCamp;
window.closeTrainingCamp = closeTrainingCamp;
window.buyTraining = buyTraining;

console.log("치아 연대기 upgrade.js loaded v8.2.0");
