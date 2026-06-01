/* upgrade.js v8.3.0
   전력강화 / 채굴강화 / 슬롯제련 / 용병훈련
*/
"use strict";

function ensureUpgradeState() {
  if (!window.globalUpgrades) window.globalUpgrades = { rng: 0, cd: 0 };
  window.globalUpgrades.rng = Number(window.globalUpgrades.rng) || 0;
  window.globalUpgrades.cd = Number(window.globalUpgrades.cd) || 0;
  const count = window.BALANCE?.TOP_SLOT_COUNT || 8;
  if (!Array.isArray(window.slotUpgrades)) window.slotUpgrades = [];
  while (window.slotUpgrades.length < count) window.slotUpgrades.push({ atk: 0, cd: 0, rng: 0 });
  window.slotUpgrades = window.slotUpgrades.slice(0, count).map((slot) => ({ atk: Number(slot?.atk) || 0, cd: Number(slot?.cd) || 0, rng: Number(slot?.rng) || 0 }));
  if (!window.trainingLevels) window.trainingLevels = { hp: 0, atk: 0, spd: 0, crit: 0, splashDmg: 0, splashRange: 0 };
  ["hp", "atk", "spd", "crit", "splashDmg", "splashRange"].forEach((key) => { window.trainingLevels[key] = Number(window.trainingLevels[key]) || 0; });
  if (!Array.isArray(window.ownedMercenaries)) window.ownedMercenaries = [0];
  if (!window.ownedMercenaries.includes(0)) window.ownedMercenaries.unshift(0);
  if (typeof window.currentMercenary === "undefined") window.currentMercenary = 0;
}

function upgradeToast(message, type = "info", duration = 1700) { window.showToast ? window.showToast(message, type, duration) : console.log(message); }
function upgradeFmt(value) { return window.formatNumber ? window.formatNumber(value) : String(Math.floor(Number(value) || 0)); }
function upgradeSaveAndRefresh() { window.saveGame?.(false); renderRefineView(); window.updateUI?.(); window.updateResourceBar?.(); window.renderInventory?.(); window.renderBattleSlots?.(); }
function payGold(cost) { const c = Number(cost) || 0; if (c <= 0) return true; if ((Number(window.gold) || 0) < c) { upgradeToast("골드가 부족합니다.", "danger"); return false; } window.gold -= c; return true; }
function openUpgradeModal(html) { window.openGenericModal ? window.openGenericModal(html) : alert("강화창을 열 수 없습니다."); }
function closeUpgradeModal() { window.closeGenericModal?.(); }

function renderRefineView() {
  ensureUpgradeState();
  const grid = document.getElementById("refine-grid");
  if (!grid) return;
  const topCount = window.BALANCE?.TOP_SLOT_COUNT || 8;
  const inventory = Array.isArray(window.inventory) ? window.inventory : [];
  const topPower = inventory.slice(0, topCount).reduce((sum, lv, index) => {
    const base = typeof window.getBaseAttackByLevel === "function" ? window.getBaseAttackByLevel(lv) : Number(lv || 0) * 10;
    const slotBonus = 1 + (Number(window.slotUpgrades[index]?.atk) || 0) * 0.08;
    return sum + Math.floor(base * slotBonus);
  }, 0);
  const pickaxe = window.getPickaxeInfo ? window.getPickaxeInfo(window.pickaxeLevel) : { level: 1, icon: "⛏️", name: "곡괭이", power: 1 };
  const pickaxeText = window.getPickaxeDisplay ? window.getPickaxeDisplay(window.pickaxeLevel) : `${pickaxe.icon} ${pickaxe.name}`;
  const merc = (window.MERCENARIES || []).find((m) => m.id === window.currentMercenary) || (window.MERCENARIES || [])[0] || { icon: "🧑‍🚀", name: "기본 용병", hp: 0, atkRate: 1 };
  const trainingTotal = Object.values(window.trainingLevels || {}).reduce((a, b) => a + (Number(b) || 0), 0);
  grid.innerHTML = `
    <div class="power-card mining-card"><div class="power-card-head"><div class="power-icon">${pickaxe.icon}</div><div><h3>채굴 / 자동화 강화</h3><p>${pickaxeText} 사용중</p></div></div><div class="power-stats"><span>채굴 파워 <b>${upgradeFmt(pickaxe.power || 1)}</b></span><span>자동채굴 Lv.<b>${window.autoMineLevel || 0}</b></span><span>자동합성 Lv.<b>${window.autoMergeLevel || 0}</b></span></div><button class="btn-main full" onclick="openShop()">강화하기</button></div>
    <div class="power-card"><div class="power-card-head"><div class="power-icon">🔥</div><div><h3>Top8 슬롯 제련</h3><p>첫 줄 공격 슬롯의 화력을 강화합니다.</p></div></div><div class="power-stats"><span>Top8 화력 <b>${upgradeFmt(topPower)}</b></span><span>슬롯 수 <b>${topCount}</b></span></div><button class="btn-main full" onclick="openSlotRefineModal()">슬롯 제련</button></div>
    <div class="power-card"><div class="power-card-head"><div class="power-icon">🎯</div><div><h3>공통 전투 시스템</h3><p>모든 공격 슬롯에 적용됩니다.</p></div></div><div class="power-stats"><span>사거리 Lv.<b>${window.globalUpgrades.rng}</b></span><span>공속 Lv.<b>${window.globalUpgrades.cd}</b></span></div><button class="btn-main full" onclick="openSystemUpgradeModal()">시스템 강화</button></div>
    <div class="power-card"><div class="power-card-head"><div class="power-icon">${merc.icon}</div><div><h3>용병 모집 / 교체</h3><p>현재 용병: ${merc.name}</p></div></div><div class="power-stats"><span>보유 용병 <b>${window.ownedMercenaries.length}</b></span><span>공격 배율 <b>x${Number(merc.atkRate || 1).toFixed(2)}</b></span></div><button class="btn-main full" onclick="openMercenaryModal()">용병 관리</button></div>
    <div class="power-card"><div class="power-card-head"><div class="power-icon">🏋️</div><div><h3>용병 훈련</h3><p>체력, 공격, 속도, 치명, 범위를 올립니다.</p></div></div><div class="power-stats"><span>총 훈련 <b>${trainingTotal}</b></span><span>체력 Lv.<b>${window.trainingLevels.hp}</b></span><span>공격 Lv.<b>${window.trainingLevels.atk}</b></span></div><button class="btn-main full" onclick="openTrainingCamp()">훈련하기</button></div>
    <div class="power-card guide-card"><div class="power-card-head"><div class="power-icon">👑</div><div><h3>초월 왕관 치아</h3><p>Lv.24 왕관 치아를 더블터치하면 봉인해제 창이 열립니다.</p></div></div><div class="power-stats"><span>합성 최대 <b>Lv.24</b></span><span>초월 <b>Lv.MAX</b></span></div><button class="btn-sub full" onclick="showTranscendGuideModal()">초월 안내 보기</button></div>
  `;
}

function getAutoMineCost() { return Math.floor(800 * Math.pow(2.25, Number(window.autoMineLevel) || 0)); }
function getAutoMergeCost() { return Math.floor(1800 * Math.pow(2.45, Number(window.autoMergeLevel) || 0)); }
function getGreatChanceCost() { return Math.floor(2500 * Math.pow(2.4, Number(window.greatChanceLevel) || 0)); }
function getInventorySlotCost() { const extra = Math.max(0, (Number(window.inventorySize) || 56) - (window.BALANCE?.BASE_INVENTORY_SIZE || 56)); return Math.floor(6000 * Math.pow(1.8, extra / 8)); }
function openShop() { renderShop(); }
function renderShop() {
  ensureUpgradeState();
  const maxPickaxe = window.BALANCE?.PICKAXE_MAX_LEVEL || 8;
  const cur = Number(window.pickaxeLevel) || 1;
  const pickaxe = window.getPickaxeInfo(cur);
  const isPickaxeMax = cur >= maxPickaxe;
  const nextPickaxe = !isPickaxeMax ? window.getPickaxeInfo(cur + 1) : null;
  const inventorySize = Number(window.inventorySize) || window.BALANCE?.BASE_INVENTORY_SIZE || 56;
  const maxInventory = window.BALANCE?.MAX_INVENTORY_SIZE || 96;
  const inventoryMax = inventorySize >= maxInventory;
  openUpgradeModal(`
    <div class="upgrade-modal-inner"><h2>⛏️ 채굴 / 자동화 강화</h2><p class="modal-desc">채굴 속도와 자동화 성능을 강화합니다.</p><div class="upgrade-list">
      <div class="upgrade-row"><div class="upgrade-info"><div class="upgrade-title">${pickaxe.icon} ${pickaxe.name} Lv.${pickaxe.level} / ${maxPickaxe} 사용중</div><div class="upgrade-desc">수동 채굴 파워 ${upgradeFmt(pickaxe.power)}<br>${nextPickaxe ? `다음: ${nextPickaxe.icon} ${nextPickaxe.name} Lv.${nextPickaxe.level} / ${maxPickaxe}` : "최고 등급 곡괭이입니다."}</div></div>${isPickaxeMax ? `<button class="btn-max same-size" disabled>MAX</button>` : `<button class="btn-main same-size" onclick="buyPickaxe()">강화<br><small>${upgradeFmt(nextPickaxe.cost)}G</small></button>`}</div>
      <div class="upgrade-row"><div class="upgrade-info"><div class="upgrade-title">🤖 자동채굴 Lv.${window.autoMineLevel || 0}</div><div class="upgrade-desc">자동으로 채굴합니다.</div></div><button class="btn-main same-size" onclick="buyAutoMine()">강화<br><small>${upgradeFmt(getAutoMineCost())}G</small></button></div>
      <div class="upgrade-row"><div class="upgrade-info"><div class="upgrade-title">🔁 자동합성 Lv.${window.autoMergeLevel || 0}</div><div class="upgrade-desc">Top8 공격 슬롯을 제외하고 자동합성합니다.</div></div><button class="btn-main same-size" onclick="buyAutoMerge()">강화<br><small>${upgradeFmt(getAutoMergeCost())}G</small></button></div>
      <div class="upgrade-row"><div class="upgrade-info"><div class="upgrade-title">✨ 대성공 확률 Lv.${window.greatChanceLevel || 0}</div><div class="upgrade-desc">합성 시 +2레벨 대성공 확률 증가. Lv.23+23은 대성공 제외.</div></div><button class="btn-main same-size" onclick="buyGreatChance()">강화<br><small>${upgradeFmt(getGreatChanceCost())}G</small></button></div>
      <div class="upgrade-row"><div class="upgrade-info"><div class="upgrade-title">🎒 인벤토리 확장 ${inventorySize} / ${maxInventory}</div><div class="upgrade-desc">8칸씩 확장합니다.</div></div>${inventoryMax ? `<button class="btn-max same-size" disabled>MAX</button>` : `<button class="btn-main same-size" onclick="buyInventorySlot()">확장<br><small>${upgradeFmt(getInventorySlotCost())}G</small></button>`}</div>
    </div><button class="btn-sub full" onclick="closeUpgradeModal()">닫기</button></div>
  `);
}
function buyPickaxe() { const max = window.BALANCE?.PICKAXE_MAX_LEVEL || 8; const cur = Number(window.pickaxeLevel) || 1; if (cur >= max) { upgradeToast(`최고등급 곡괭이 Lv.${max} / ${max} 사용중입니다.`, "info"); renderShop(); return; } const next = window.getPickaxeInfo(cur + 1); if (!payGold(next.cost)) return; window.pickaxeLevel = cur + 1; upgradeToast(`${next.icon} ${next.name} 강화 완료!`, "success"); upgradeSaveAndRefresh(); renderShop(); }
function buyAutoMine() { if (!payGold(getAutoMineCost())) return; window.autoMineLevel = (Number(window.autoMineLevel) || 0) + 1; upgradeToast(`자동채굴 Lv.${window.autoMineLevel} 강화 완료`, "success"); upgradeSaveAndRefresh(); renderShop(); }
function buyAutoMerge() { if (!payGold(getAutoMergeCost())) return; window.autoMergeLevel = (Number(window.autoMergeLevel) || 0) + 1; upgradeToast(`자동합성 Lv.${window.autoMergeLevel} 강화 완료`, "success"); upgradeSaveAndRefresh(); renderShop(); }
function buyGreatChance() { if (!payGold(getGreatChanceCost())) return; window.greatChanceLevel = (Number(window.greatChanceLevel) || 0) + 1; upgradeToast(`대성공 확률 Lv.${window.greatChanceLevel} 강화 완료`, "success"); upgradeSaveAndRefresh(); renderShop(); }
function buyInventorySlot() { const max = window.BALANCE?.MAX_INVENTORY_SIZE || 96; const cur = Number(window.inventorySize) || 56; if (cur >= max) { upgradeToast("인벤토리가 이미 최대치입니다.", "info"); return; } if (!payGold(getInventorySlotCost())) return; window.inventorySize = Math.min(max, cur + 8); while (window.inventory.length < window.inventorySize) window.inventory.push(0); upgradeToast(`인벤토리 ${window.inventorySize}칸으로 확장`, "success"); upgradeSaveAndRefresh(); renderShop(); }

function getGlobalRngCost() { return Math.floor(5000 * Math.pow(2.15, Number(window.globalUpgrades?.rng) || 0)); }
function getGlobalCdCost() { return Math.floor(7000 * Math.pow(2.2, Number(window.globalUpgrades?.cd) || 0)); }
function openSystemUpgradeModal() { ensureUpgradeState(); openUpgradeModal(`<div class="upgrade-modal-inner"><h2>🎯 공통 전투 시스템</h2><div class="upgrade-list"><div class="upgrade-row"><div class="upgrade-info"><div class="upgrade-title">📡 사거리 강화 Lv.${window.globalUpgrades.rng}</div><div class="upgrade-desc">모든 치아 무기 사거리 증가</div></div><button class="btn-main same-size" onclick="upgradeGlobalRng()">강화<br><small>${upgradeFmt(getGlobalRngCost())}G</small></button></div><div class="upgrade-row"><div class="upgrade-info"><div class="upgrade-title">⚡ 공격 속도 강화 Lv.${window.globalUpgrades.cd}</div><div class="upgrade-desc">모든 치아 무기 공격 간격 감소</div></div><button class="btn-main same-size" onclick="upgradeGlobalCd()">강화<br><small>${upgradeFmt(getGlobalCdCost())}G</small></button></div></div><button class="btn-sub full" onclick="closeUpgradeModal()">닫기</button></div>`); }
function upgradeGlobalRng() { if (!payGold(getGlobalRngCost())) return; window.globalUpgrades.rng += 1; upgradeToast("사거리 강화 완료", "success"); upgradeSaveAndRefresh(); openSystemUpgradeModal(); }
function upgradeGlobalCd() { if (!payGold(getGlobalCdCost())) return; window.globalUpgrades.cd += 1; upgradeToast("공격 속도 강화 완료", "success"); upgradeSaveAndRefresh(); openSystemUpgradeModal(); }

function getSlotUpgradeCost(slotIndex, type) { const lv = Number(window.slotUpgrades[slotIndex]?.[type]) || 0; const base = type === "atk" ? 3500 : type === "cd" ? 5500 : 4800; return Math.floor(base * Math.pow(1.9, lv) * (1 + slotIndex * 0.18)); }
function openSlotRefineModal() { ensureUpgradeState(); const topCount = window.BALANCE?.TOP_SLOT_COUNT || 8; const inventory = Array.isArray(window.inventory) ? window.inventory : []; const rows = Array.from({ length: topCount }, (_, index) => { const lv = Number(inventory[index]) || 0; const emoji = lv ? window.getToothEmoji(lv) : "—"; const levelText = lv ? window.getToothDisplayLevel(lv) : "빈 슬롯"; const up = window.slotUpgrades[index] || { atk: 0, cd: 0, rng: 0 }; return `<div class="slot-refine-row"><div class="slot-refine-head"><div class="slot-refine-icon">${emoji}</div><div><b>${index + 1}번 공격 슬롯</b><small>${levelText}</small></div></div><div class="slot-refine-buttons"><button class="btn-main same-size" onclick="upgradeSlot(${index}, 'atk')">공격 Lv.${up.atk}<br><small>${upgradeFmt(getSlotUpgradeCost(index, "atk"))}G</small></button><button class="btn-main same-size" onclick="upgradeSlot(${index}, 'cd')">공속 Lv.${up.cd}<br><small>${upgradeFmt(getSlotUpgradeCost(index, "cd"))}G</small></button><button class="btn-main same-size" onclick="upgradeSlot(${index}, 'rng')">사거리 Lv.${up.rng}<br><small>${upgradeFmt(getSlotUpgradeCost(index, "rng"))}G</small></button></div></div>`; }).join(""); openUpgradeModal(`<div class="upgrade-modal-inner wide"><h2>🔥 Top8 슬롯 제련</h2><p class="modal-desc">첫 줄 8칸은 던전 공격 슬롯입니다.</p><div class="slot-refine-list">${rows}</div><button class="btn-sub full" onclick="closeUpgradeModal()">닫기</button></div>`); }
function upgradeSlot(index, type) { ensureUpgradeState(); const i = Number(index); if (!window.slotUpgrades[i]) return; if (!payGold(getSlotUpgradeCost(i, type))) return; window.slotUpgrades[i][type] = (Number(window.slotUpgrades[i][type]) || 0) + 1; upgradeToast(`${i + 1}번 슬롯 제련 완료`, "success"); upgradeSaveAndRefresh(); openSlotRefineModal(); }

function getTrainingCost(key) { const lv = Number(window.trainingLevels[key]) || 0; const baseMap = { hp: 4000, atk: 5500, spd: 7000, crit: 9000, splashDmg: 12000, splashRange: 15000 }; return Math.floor((baseMap[key] || 5000) * Math.pow(1.85, lv)); }
function getTrainingMax(key) { return (window.TRAINING_TYPES || []).find((item) => item.key === key)?.max || 50; }
function openTrainingCamp() { renderTrainingCamp(); }
function renderTrainingCamp() { ensureUpgradeState(); const types = window.TRAINING_TYPES || []; const rows = types.map((type) => { const lv = Number(window.trainingLevels[type.key]) || 0; const max = Number(type.max) || getTrainingMax(type.key); const isMax = lv >= max; return `<div class="upgrade-row"><div class="upgrade-info"><div class="upgrade-title">${type.icon} ${type.name} Lv.${lv} / ${max}</div><div class="upgrade-desc">${type.desc}</div></div>${isMax ? `<button class="btn-max same-size" disabled>MAX</button>` : `<button class="btn-main same-size" onclick="buyTraining('${type.key}')">훈련<br><small>${upgradeFmt(getTrainingCost(type.key))}G</small></button>`}</div>`; }).join(""); openUpgradeModal(`<div class="upgrade-modal-inner"><h2>🏋️ 용병 훈련</h2><p class="modal-desc">전투 능력치를 강화합니다.</p><div class="upgrade-list">${rows}</div><button class="btn-sub full" onclick="closeTrainingCamp()">닫기</button></div>`); }
function closeTrainingCamp() { closeUpgradeModal(); }
function buyTraining(key) { ensureUpgradeState(); if (!(key in window.trainingLevels)) return; const max = getTrainingMax(key); if (window.trainingLevels[key] >= max) { upgradeToast("이미 최대 훈련입니다.", "info"); return; } if (!payGold(getTrainingCost(key))) return; window.trainingLevels[key] += 1; upgradeToast("훈련 완료", "success"); upgradeSaveAndRefresh(); renderTrainingCamp(); }

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
console.log("치아 연대기 upgrade.js loaded v8.3.0");
