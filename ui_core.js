/* ui_core.js v8.3.0
   Core UI / View Switch / Dungeon List / Result / Mercenary Camp
*/
"use strict";

function uiFmt(value) {
  if (typeof window.formatNumber === "function") return window.formatNumber(value);
  return String(Math.floor(Number(value) || 0));
}

window.switchView = function (viewName) {
  window.currentView = viewName || "mine";
  const views = ["mine", "refine", "war"];
  views.forEach((name) => {
    const view = document.getElementById(`${name}-view`);
    const tab = document.getElementById(`tab-${name}`);
    if (view) {
      view.style.display = name === window.currentView ? "flex" : "none";
      view.classList.toggle("active", name === window.currentView);
    }
    if (tab) tab.classList.toggle("active", name === window.currentView);
  });

  const inventorySection = document.getElementById("inventory-section");
  if (inventorySection) inventorySection.style.display = window.currentView === "mine" ? "flex" : "none";

  if (window.currentView === "mine") {
    if (typeof window.renderInventory === "function") window.renderInventory();
  } else if (window.currentView === "refine") {
    if (typeof window.renderRefineView === "function") window.renderRefineView();
  } else if (window.currentView === "war") {
    if (typeof window.renderMercenaryCamp === "function") window.renderMercenaryCamp();
    if (typeof window.switchDungeonTab === "function") window.switchDungeonTab(window.currentDungeonTab || "normal");
  }

  if (typeof window.updateUI === "function") window.updateUI();
};

window.switchDungeonTab = function (tabName) {
  const allowed = ["normal", "boss", "hell", "hellboss"];
  window.currentDungeonTab = allowed.includes(tabName) ? tabName : "normal";
  document.querySelectorAll(".war-tab-btn").forEach((btn) => btn.classList.remove("active"));
  const tabBtn = document.getElementById(`d-tab-${window.currentDungeonTab}`);
  if (tabBtn) tabBtn.classList.add("active");

  const bossInfo = document.getElementById("boss-rush-info");
  if (bossInfo) bossInfo.classList.toggle("hidden", !(window.currentDungeonTab === "boss" || window.currentDungeonTab === "hellboss"));

  const hellTabs = [document.getElementById("d-tab-hell"), document.getElementById("d-tab-hellboss")];
  hellTabs.forEach((el) => {
    if (el) el.style.display = window.hellUnlocked ? "block" : "none";
  });

  if (!window.hellUnlocked && (window.currentDungeonTab === "hell" || window.currentDungeonTab === "hellboss")) {
    window.currentDungeonTab = "normal";
    const normalBtn = document.getElementById("d-tab-normal");
    if (normalBtn) normalBtn.classList.add("active");
  }

  if (typeof window.renderDungeonList === "function") window.renderDungeonList();
};

function getCurrentMercenary() {
  return (window.MERCENARIES || []).find((m) => m.id === window.currentMercenary) || (window.MERCENARIES || [])[0] || { id: 0, icon: "🧑‍🚀", name: "기본 용병", hp: 800, atkRate: 1, speed: 1 };
}

window.renderMercenaryCamp = function () {
  const display = document.getElementById("current-mercenary-display");
  if (!display) return;
  const merc = getCurrentMercenary();
  const t = window.trainingLevels || {};
  const hpBonus = (Number(t.hp) || 0) * 5;
  const atkBonus = (Number(t.atk) || 0) * 2.5;
  const spdBonus = (Number(t.spd) || 0) * 10;
  const critChance = Math.min(35, (Number(t.crit) || 0) * 0.6);
  const splashDmg = 28 + (Number(t.splashDmg) || 0) * 0.6;
  const splashRange = 58 + (Number(t.splashRange) || 0) * 2.5;

  display.innerHTML = `
    <div class="war-merc-card">
      <div class="war-merc-icon">${merc.icon}</div>
      <div class="war-merc-info">
        <div class="war-merc-name">${merc.name}</div>
        <div class="war-merc-basic">
          공격 x<span class="stat-gold">${Number(merc.atkRate || 1).toFixed(2)}</span>
          <span class="stat-green">(+${atkBonus.toFixed(1)}%)</span> |
          체력 <span class="stat-red">${uiFmt(merc.hp)}</span>
          <span class="stat-green">(+${hpBonus}%)</span> |
          이동속도 <span class="stat-blue">${Number(merc.speed || 1).toFixed(2)}</span>
          <span class="stat-green">(+${spdBonus}%)</span>
        </div>
        <div class="war-merc-advanced">⚡ 치명타 ${critChance.toFixed(1)}% | 💥 광역 ${splashDmg.toFixed(1)}% / ${splashRange.toFixed(0)}px</div>
      </div>
    </div>
  `;
};

window.openMercenaryModal = function () {
  const mercs = window.MERCENARIES || [];
  const owned = Array.isArray(window.ownedMercenaries) ? window.ownedMercenaries : [0];
  const cards = mercs.map((merc) => {
    const isOwned = owned.includes(merc.id);
    const isEquipped = Number(window.currentMercenary) === merc.id;
    const btn = isEquipped
      ? `<button class="btn-max full" disabled>장착중</button>`
      : isOwned
      ? `<button class="btn-sub full" onclick="equipMerc(${merc.id})">장착하기</button>`
      : `<button class="btn-main full" onclick="buyMerc(${merc.id})">${uiFmt(merc.cost)}G</button>`;
    return `
      <div class="merc-card ${isEquipped ? "equipped" : ""}">
        <div class="merc-icon">${merc.icon}</div>
        <b>${merc.name}</b>
        <small>${merc.desc || ""}</small>
        <div class="merc-stats">HP ${uiFmt(merc.hp)} · 공격 x${Number(merc.atkRate || 1).toFixed(2)} · 속도 ${Number(merc.speed || 1).toFixed(2)}</div>
        ${btn}
      </div>
    `;
  }).join("");

  window.openGenericModal(`
    <div class="modal-header-row">
      <div><h2>👥 용병 모집 / 교체</h2><p>던전에서 함께 싸울 용병을 선택합니다.</p></div>
      <button class="modal-close-btn" onclick="closeGenericModal()">×</button>
    </div>
    <div class="merc-grid">${cards}</div>
  `);
};

window.buyMerc = function (id) {
  const merc = (window.MERCENARIES || []).find((m) => m.id === Number(id));
  if (!merc) return;
  if ((Number(window.gold) || 0) < Number(merc.cost || 0)) { window.showToast("골드가 부족합니다.", "danger"); return; }
  window.gold -= Number(merc.cost) || 0;
  if (!Array.isArray(window.ownedMercenaries)) window.ownedMercenaries = [0];
  if (!window.ownedMercenaries.includes(merc.id)) window.ownedMercenaries.push(merc.id);
  window.currentMercenary = merc.id;
  window.mercenaryIdx = merc.id;
  window.saveGame(false);
  window.openMercenaryModal();
  window.renderMercenaryCamp();
  window.renderRefineView?.();
  window.updateUI?.();
};

window.equipMerc = function (id) {
  if (!Array.isArray(window.ownedMercenaries)) window.ownedMercenaries = [0];
  if (!window.ownedMercenaries.includes(Number(id))) return;
  window.currentMercenary = Number(id);
  window.mercenaryIdx = Number(id);
  window.saveGame(false);
  window.openMercenaryModal();
  window.renderMercenaryCamp();
  window.renderRefineView?.();
};

window.renderDungeonList = function () {
  const list = document.getElementById("dungeon-list");
  if (!list) return;
  list.innerHTML = "";
  const tab = window.currentDungeonTab || "normal";
  const isHell = tab === "hell" || tab === "hellboss";
  const isBoss = tab === "boss" || tab === "hellboss";

  if (isHell && !window.hellUnlocked) {
    list.innerHTML = `<div class="empty-dex-message">HELL은 아직 해금되지 않았습니다.</div>`;
    return;
  }

  if (isBoss) {
    const bosses = isHell ? (window.TOOTH_DATA?.hellBosses || []) : (window.TOOTH_DATA?.bosses || []);
    const unlocked = isHell ? Math.max(1, Number(window.unlockedHellBossStage) || 1) : Math.max(1, Number(window.unlockedBossStage) || 1);
    bosses.forEach((boss, index) => {
      const stage = index + 1;
      const open = stage <= unlocked;
      const card = document.createElement("div");
      card.className = `dungeon-card ${open ? "unlocked" : "locked"}`;
      card.innerHTML = open
        ? `<h4>${boss.icon} ${stage}. ${boss.name}</h4><p>보상 ${uiFmt(boss.reward)}G · 보스 징표 ${boss.token || 1}</p><button class="btn-main full">도전하기</button>`
        : `<h4>🔒 잠김</h4><p>이전 보스 클리어 시 열림</p>`;
      if (open) card.onclick = () => window.startDungeon(stage, isHell ? "hellboss" : "boss");
      list.appendChild(card);
    });
    return;
  }

  const names = window.TOOTH_DATA?.stageNames || [];
  const unlocked = isHell ? Math.max(1, Number(window.unlockedHellDungeon) || 1) : Math.max(1, Number(window.unlockedStage) || 1);
  names.forEach((name, index) => {
    const stage = index + 1;
    const open = stage <= unlocked;
    const card = document.createElement("div");
    card.className = `dungeon-card ${open ? "unlocked" : "locked"}`;
    const recAtk = Math.floor(120 * Math.pow(isHell ? 2.35 : 1.72, index));
    card.innerHTML = open
      ? `<h4>⚔️ Lv.${stage} ${isHell ? "HELL " : ""}${name}</h4><p>권장 공격력 ${uiFmt(recAtk)}+</p><button class="btn-main full">원정 시작</button>`
      : `<h4>🔒 잠김</h4><p>이전 던전 클리어 시 열림</p>`;
    if (open) card.onclick = () => window.startDungeon(stage, isHell ? "hell" : "normal");
    list.appendChild(card);
  });
};

window.showResultModal = function (result = {}) {
  const success = result.success !== false;
  const stage = Number(result.stage) || Number(window.currentDungeon?.stage) || 1;
  const mode = result.mode || window.currentDungeon?.mode || "normal";
  const title = result.title || (success ? "던전 클리어!" : "후퇴 완료");
  const message = result.message || (success ? "클리어!" : "후퇴했습니다.");

  window.openGenericModal(`
    <div class="result-modal-inner">
      <h2>${success ? "🎉" : "🏳️"} ${title}</h2>
      <p>${message}</p>
      <div class="settings-info-box">
        <div><span>모드</span><b>${mode}</b></div>
        <div><span>단계</span><b>${stage}</b></div>
      </div>
      <div class="modal-actions">
        <button class="btn-sub" onclick="closeResultModal()">나가기</button>
        <button class="btn-main" onclick="retryDungeon()">다시하기</button>
        <button class="btn-main" onclick="nextDungeon()">다음단계</button>
      </div>
    </div>
  `);
};

window.closeResultModal = function () {
  window.closeGenericModal?.();
  window.hideBattleScreen?.();
};

window.updateUI = function () {
  window.dia = Number(window.diamond) || 0;
  const gd = document.getElementById("gold-display");
  const dd = document.getElementById("dia-display");
  const diamond = document.getElementById("diamond-display");
  const token = document.getElementById("boss-token-display");
  if (gd) gd.textContent = uiFmt(window.gold);
  if (dd) dd.textContent = uiFmt(window.diamond);
  if (diamond) diamond.textContent = uiFmt(window.diamond);
  if (token) token.textContent = uiFmt(window.bossToken);
  const p = document.getElementById("pickaxe-display");
  if (p && typeof window.getPickaxeDisplay === "function") p.textContent = window.getPickaxeDisplay(window.pickaxeLevel);
  window.updateToggleButtons?.();
};

window.updateToggleButtons = function () {
  window.isAutoMineOn = !!window.autoMineOn;
  window.isAutoMergeOn = !!window.autoMergeOn;
  const mineBtn = document.getElementById("auto-mine-btn");
  const mergeBtn = document.getElementById("auto-merge-btn");
  if (mineBtn) {
    mineBtn.textContent = window.autoMineOn ? "자동채굴 ON" : "자동채굴 OFF";
    mineBtn.classList.toggle("active", !!window.autoMineOn);
    mineBtn.classList.toggle("off", !window.autoMineOn);
  }
  if (mergeBtn) {
    mergeBtn.textContent = window.autoMergeOn ? "자동합성 ON" : "자동합성 OFF";
    mergeBtn.classList.toggle("active", !!window.autoMergeOn);
    mergeBtn.classList.toggle("off", !window.autoMergeOn);
  }
};

console.log("치아 연대기 ui_core.js loaded v8.3.0");
