// Version: 8.1.0 - Research Lab / Upgrade Integration

// =========================
// 연구소 기본 설정
// =========================
window.currentResearchTab = window.currentResearchTab || "pickaxe";

const RESEARCH_TABS = [
    "pickaxe",
    "automation",
    "merge",
    "bag",
    "slot",
    "combat",
    "training"
];

const UPGRADE_MAX = {
    autoMine: 41,
    autoMerge: 41,
    greatChance: 25,
    slotAtk: 30,
    slotCd: 20,
    slotRng: 20,
    globalAtk: 30,
    globalCd: 20,
    globalRng: 20,
    training: 30
};

// =========================
// 유틸
// =========================
function upFmt(num) {
    if (typeof fNum === "function") return fNum(num);
    return Math.floor(Number(num) || 0).toString();
}

function upPlaySfx(type) {
    try {
        if (typeof playSfx === "function") playSfx(type);
    } catch (e) {}
}

function canAffordGold(cost) {
    return (Number(window.gold) || 0) >= Number(cost || 0);
}

function spendGold(cost) {
    cost = Number(cost) || 0;

    if (!canAffordGold(cost)) {
        alert("골드가 부족합니다.");
        upPlaySfx("error");
        return false;
    }

    window.gold -= cost;
    return true;
}

function refreshUpgradeUI() {
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderResearchContent === "function") window.renderResearchContent();
    if (typeof window.renderCurrentMercenary === "function") window.renderCurrentMercenary();
    if (typeof window.renderWarSummary === "function") window.renderWarSummary();
    if (typeof window.renderDungeonList === "function") window.renderDungeonList();
    if (typeof window.saveGame === "function") window.saveGame();
}

function ensureUpgradeObjects() {
    if (!Array.isArray(window.slotUpgrades)) {
        window.slotUpgrades = [];
    }

    while (window.slotUpgrades.length < 8) {
        window.slotUpgrades.push({
            atk: 0,
            cd: 0,
            rng: 0
        });
    }

    window.slotUpgrades = window.slotUpgrades.slice(0, 8).map((u) => ({
        atk: Number(u && u.atk) || 0,
        cd: Number(u && u.cd) || 0,
        rng: Number(u && u.rng) || 0
    }));

    if (!window.globalUpgrades) {
        window.globalUpgrades = {
            atk: 0,
            cd: 0,
            rng: 0
        };
    }

    window.globalUpgrades.atk = Number(window.globalUpgrades.atk) || 0;
    window.globalUpgrades.cd = Number(window.globalUpgrades.cd) || 0;
    window.globalUpgrades.rng = Number(window.globalUpgrades.rng) || 0;

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

    const keys = ["hp", "atk", "spd", "crit", "splashDmg", "splashRange"];

    keys.forEach((k) => {
        window.trainingLevels[k] = Number(window.trainingLevels[k]) || 0;
    });
}

// =========================
// 비용 공식
// =========================
function getAutoMineCost() {
    const lv = Math.max(1, Number(window.autoMineLevel) || 1);
    return Math.floor(1200 * Math.pow(1.32, lv - 1));
}

function getAutoMergeCost() {
    const lv = Math.max(1, Number(window.autoMergeLevel) || 1);
    return Math.floor(3500 * Math.pow(1.35, lv - 1));
}

function getGreatChanceCost() {
    const lv = Math.max(0, Number(window.greatChanceLevel) || 0);
    return Math.floor(8000 * Math.pow(1.42, lv));
}

function getSlotUpgradeCost(slotIdx, type) {
    ensureUpgradeObjects();

    const u = window.slotUpgrades[slotIdx] || {
        atk: 0,
        cd: 0,
        rng: 0
    };

    const lv = Number(u[type]) || 0;

    const base = type === "atk" ? 12000 : type === "cd" ? 18000 : 15000;
    const mul = type === "atk" ? 1.34 : type === "cd" ? 1.42 : 1.38;

    return Math.floor(base * Math.pow(mul, lv) * (1 + slotIdx * 0.08));
}

function getGlobalUpgradeCost(type) {
    ensureUpgradeObjects();

    const lv = Number(window.globalUpgrades[type]) || 0;

    const base = type === "atk" ? 65000 : type === "cd" ? 90000 : 75000;
    const mul = type === "atk" ? 1.36 : type === "cd" ? 1.43 : 1.39;

    return Math.floor(base * Math.pow(mul, lv));
}

function getTrainingCost(type) {
    ensureUpgradeObjects();

    const lv = Number(window.trainingLevels[type]) || 0;

    const baseMap = {
        hp: 18000,
        atk: 24000,
        spd: 22000,
        crit: 36000,
        splashDmg: 46000,
        splashRange: 42000
    };

    const mulMap = {
        hp: 1.34,
        atk: 1.38,
        spd: 1.36,
        crit: 1.42,
        splashDmg: 1.45,
        splashRange: 1.43
    };

    return Math.floor((baseMap[type] || 20000) * Math.pow(mulMap[type] || 1.35, lv));
}

// =========================
// 연구소 탭 전환
// =========================
window.switchResearchTab = function(tabName) {
    if (!RESEARCH_TABS.includes(tabName)) {
        tabName = "pickaxe";
    }

    window.currentResearchTab = tabName;

    document.querySelectorAll(".research-menu-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.research === tabName);
    });

    renderResearchContent();

    if (typeof window.saveGame === "function") {
        window.saveGame();
    }
};

// =========================
// 연구소 메인 렌더
// =========================
window.renderResearchContent = function() {
    ensureUpgradeObjects();

    const box = document.getElementById("research-content");
    if (!box) return;

    const tab = window.currentResearchTab || "pickaxe";

    document.querySelectorAll(".research-menu-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.research === tab);
    });

    if (tab === "pickaxe") {
        renderPickaxeResearch(box);
    } else if (tab === "automation") {
        renderAutomationResearch(box);
    } else if (tab === "merge") {
        renderMergeResearch(box);
    } else if (tab === "bag") {
        renderBagResearch(box);
    } else if (tab === "slot") {
        renderSlotResearch(box);
    } else if (tab === "combat") {
        renderCombatResearch(box);
    } else if (tab === "training") {
        renderTrainingResearch(box);
    } else {
        renderPickaxeResearch(box);
    }
};

// =========================
// 1. 곡괭이 강화
// =========================
function renderPickaxeResearch(box) {
    if (typeof TOOTH_DATA === "undefined" || !TOOTH_DATA.pickaxes) {
        box.innerHTML = "";
        return;
    }

    const currentIdx = Number(window.pickaxeIdx) || 0;
    const current = TOOTH_DATA.pickaxes[currentIdx] || TOOTH_DATA.pickaxes[0];
    const next = TOOTH_DATA.pickaxes[currentIdx + 1];

    let html = `
        <div class="research-panel">
            <div class="research-panel-title">⛏️ 곡괭이 강화</div>
            <div class="research-panel-desc">
                곡괭이를 강화하면 수동 채굴 속도가 빨라지고, 높은 레벨 치아 획득 확률이 증가합니다.
                직접 채굴은 최대 Lv.${window.MINING_MAX_LEVEL || 12}까지만 가능합니다.
            </div>

            <div class="war-stat-grid">
                <div class="war-stat">
                    현재 곡괭이
                    <b>${current.icon} ${current.name}</b>
                </div>
                <div class="war-stat">
                    채굴 파워
                    <b>${upFmt(current.power)}</b>
                </div>
                <div class="war-stat">
                    행운 확률
                    <b>${Math.round((current.luck || 0) * 100)}%</b>
                </div>
                <div class="war-stat">
                    기본 채굴 Lv
                    <b>Lv.${typeof getBaseMiningLevel === "function" ? getBaseMiningLevel() : 1}</b>
                </div>
            </div>
        </div>
    `;

    if (next) {
        const afford = canAffordGold(next.cost);

        html += `
            <div class="upgrade-card">
                <div class="upgrade-icon">${next.icon}</div>
                <div class="upgrade-info">
                    <div class="upgrade-title">${next.name}</div>
                    <div class="upgrade-desc">
                        파워 ${current.power} → ${next.power}<br>
                        행운 ${Math.round((current.luck || 0) * 100)}% → ${Math.round((next.luck || 0) * 100)}%
                    </div>
                    <div class="upgrade-cost">비용: ${upFmt(next.cost)} 골드</div>
                </div>
                <button class="upgrade-btn ${afford ? "" : "disabled"}" onclick="buyNextPickaxe()">
                    강화
                </button>
            </div>
        `;
    } else {
        html += `
            <div class="upgrade-card">
                <div class="upgrade-icon">🏆</div>
                <div class="upgrade-info">
                    <div class="upgrade-title">곡괭이 최대 강화</div>
                    <div class="upgrade-desc">더 이상 강화할 곡괭이가 없습니다.</div>
                    <div class="upgrade-cost">최대 단계</div>
                </div>
                <button class="upgrade-btn disabled" disabled>완료</button>
            </div>
        `;
    }

    box.innerHTML = html;
}

window.buyNextPickaxe = function() {
    if (typeof TOOTH_DATA === "undefined" || !TOOTH_DATA.pickaxes) return;

    const nextIdx = (Number(window.pickaxeIdx) || 0) + 1;
    const next = TOOTH_DATA.pickaxes[nextIdx];

    if (!next) {
        alert("이미 최고 등급 곡괭이입니다.");
        return;
    }

    if (!spendGold(next.cost)) return;

    window.pickaxeIdx = nextIdx;

    if (typeof window.updatePickaxeVisual === "function") {
        window.updatePickaxeVisual();
    }

    upPlaySfx("buy");
    refreshUpgradeUI();
};

// 기존 함수명 호환
window.buyPickaxe = window.buyNextPickaxe;
window.buyPickaxeUpgrade = window.buyNextPickaxe;

// =========================
// 2. 자동화 강화
// =========================
function renderAutomationResearch(box) {
    const mineLv = Math.max(1, Number(window.autoMineLevel) || 1);
    const mergeLv = Math.max(1, Number(window.autoMergeLevel) || 1);

    const mineMax = mineLv >= UPGRADE_MAX.autoMine;
    const mergeMax = mergeLv >= UPGRADE_MAX.autoMerge;

    const mineCost = getAutoMineCost();
    const mergeCost = getAutoMergeCost();

    const mineInterval = typeof getAutoMineIntervalMs === "function" ? getAutoMineIntervalMs() / 1000 : 10;
    const mergeInterval = typeof getAutoMergeIntervalMs === "function" ? getAutoMergeIntervalMs() / 1000 : 60;

    box.innerHTML = `
        <div class="research-panel">
            <div class="research-panel-title">⚙️ 자동화 연구</div>
            <div class="research-panel-desc">
                자동채굴과 자동합성의 속도를 올립니다. 자동채굴로 획득한 치아도 즉시 인벤토리에 표시됩니다.
            </div>
        </div>

        <div class="upgrade-card">
            <div class="upgrade-icon">⛏️</div>
            <div class="upgrade-info">
                <div class="upgrade-title">자동채굴 강화 Lv.${mineLv}</div>
                <div class="upgrade-desc">
                    현재 주기: 약 ${mineInterval.toFixed(1)}초<br>
                    최대 Lv.${UPGRADE_MAX.autoMine}
                </div>
                <div class="upgrade-cost">
                    ${mineMax ? "최대 강화" : "비용: " + upFmt(mineCost) + " 골드"}
                </div>
            </div>
            <button class="upgrade-btn ${mineMax ? "disabled" : ""}" onclick="upgradeAutoMine()" ${mineMax ? "disabled" : ""}>
                ${mineMax ? "완료" : "강화"}
            </button>
        </div>

        <div class="upgrade-card">
            <div class="upgrade-icon">🔁</div>
            <div class="upgrade-info">
                <div class="upgrade-title">자동합성 강화 Lv.${mergeLv}</div>
                <div class="upgrade-desc">
                    현재 주기: 약 ${mergeInterval.toFixed(1)}초<br>
                    Top8 공격 슬롯은 자동합성에서 제외됩니다.
                </div>
                <div class="upgrade-cost">
                    ${mergeMax ? "최대 강화" : "비용: " + upFmt(mergeCost) + " 골드"}
                </div>
            </div>
            <button class="upgrade-btn ${mergeMax ? "disabled" : ""}" onclick="upgradeAutoMerge()" ${mergeMax ? "disabled" : ""}>
                ${mergeMax ? "완료" : "강화"}
            </button>
        </div>
    `;
}

window.upgradeAutoMine = function() {
    const lv = Math.max(1, Number(window.autoMineLevel) || 1);

    if (lv >= UPGRADE_MAX.autoMine) {
        alert("자동채굴은 이미 최대 레벨입니다.");
        return;
    }

    const cost = getAutoMineCost();

    if (!spendGold(cost)) return;

    window.autoMineLevel = lv + 1;

    upPlaySfx("buy");
    refreshUpgradeUI();
};

window.upgradeAutoMerge = function() {
    const lv = Math.max(1, Number(window.autoMergeLevel) || 1);

    if (lv >= UPGRADE_MAX.autoMerge) {
        alert("자동합성은 이미 최대 레벨입니다.");
        return;
    }

    const cost = getAutoMergeCost();

    if (!spendGold(cost)) return;

    window.autoMergeLevel = lv + 1;

    upPlaySfx("buy");
    refreshUpgradeUI();
};

// =========================
// 3. 합성 연구
// =========================
function renderMergeResearch(box) {
    const lv = Math.max(0, Number(window.greatChanceLevel) || 0);
    const max = lv >= UPGRADE_MAX.greatChance;
    const cost = getGreatChanceCost();

    const chance = typeof getGreatChance === "function" ? getGreatChance() : 0;
    const nextChance = Math.min(0.5, (lv + 1) * 0.02);

    box.innerHTML = `
        <div class="research-panel">
            <div class="research-panel-title">✨ 합성 연구</div>
            <div class="research-panel-desc">
                같은 레벨 치아 2개를 합성할 때 일정 확률로 한 단계 더 높은 치아가 만들어집니다.
                일반 합성은 Lv.24까지만 가능합니다.
            </div>

            <div class="war-stat-grid">
                <div class="war-stat">
                    현재 대성공 확률
                    <b>${Math.round(chance * 100)}%</b>
                </div>
                <div class="war-stat">
                    다음 확률
                    <b>${max ? "최대" : Math.round(nextChance * 100) + "%"}</b>
                </div>
            </div>
        </div>

        <div class="upgrade-card">
            <div class="upgrade-icon">✨</div>
            <div class="upgrade-info">
                <div class="upgrade-title">대성공 확률 강화 Lv.${lv}</div>
                <div class="upgrade-desc">
                    합성 시 추가 성장 확률을 올립니다.<br>
                    최대 확률은 50%입니다.
                </div>
                <div class="upgrade-cost">
                    ${max ? "최대 강화" : "비용: " + upFmt(cost) + " 골드"}
                </div>
            </div>
            <button class="upgrade-btn ${max ? "disabled" : ""}" onclick="upgradeGreatChance()" ${max ? "disabled" : ""}>
                ${max ? "완료" : "강화"}
            </button>
        </div>
    `;
}

window.upgradeGreatChance = function() {
    const lv = Math.max(0, Number(window.greatChanceLevel) || 0);

    if (lv >= UPGRADE_MAX.greatChance) {
        alert("대성공 확률은 이미 최대 레벨입니다.");
        return;
    }

    const cost = getGreatChanceCost();

    if (!spendGold(cost)) return;

    window.greatChanceLevel = lv + 1;

    upPlaySfx("buy");
    refreshUpgradeUI();
};

// =========================
// 4. 가방 / 인벤토리
// =========================
function renderBagResearch(box) {
    const currentSlots = typeof getMaxInventorySlots === "function"
        ? getMaxInventorySlots()
        : Number(window.inventorySlots) || 24;

    const nextExpansion = (TOOTH_DATA.invExpansion || []).find((item) => {
        return Number(item.slots) > currentSlots;
    });

    let html = `
        <div class="research-panel">
            <div class="research-panel-title">🎒 가방 연구</div>
            <div class="research-panel-desc">
                인벤토리 공간을 확장합니다. 상단 8칸은 전투 공격 슬롯으로 사용됩니다.
            </div>

            <div class="war-stat-grid">
                <div class="war-stat">
                    현재 인벤토리
                    <b>${currentSlots}칸</b>
                </div>
                <div class="war-stat">
                    최대 인벤토리
                    <b>${window.INVENTORY_SIZE || 56}칸</b>
                </div>
            </div>
        </div>
    `;

    if (nextExpansion) {
        const afford = canAffordGold(nextExpansion.cost);

        html += `
            <div class="upgrade-card">
                <div class="upgrade-icon">🎒</div>
                <div class="upgrade-info">
                    <div class="upgrade-title">인벤토리 확장</div>
                    <div class="upgrade-desc">
                        ${currentSlots}칸 → ${nextExpansion.slots}칸
                    </div>
                    <div class="upgrade-cost">비용: ${upFmt(nextExpansion.cost)} 골드</div>
                </div>
                <button class="upgrade-btn ${afford ? "" : "disabled"}" onclick="buyInventoryExpansion(${nextExpansion.slots}, ${nextExpansion.cost})">
                    확장
                </button>
            </div>
        `;
    } else {
        html += `
            <div class="upgrade-card">
                <div class="upgrade-icon">🏆</div>
                <div class="upgrade-info">
                    <div class="upgrade-title">최대 인벤토리</div>
                    <div class="upgrade-desc">이미 최대 인벤토리입니다.</div>
                    <div class="upgrade-cost">완료</div>
                </div>
                <button class="upgrade-btn disabled" disabled>완료</button>
            </div>
        `;
    }

    box.innerHTML = html;
}

window.buyInventoryExpansion = function(slots, cost) {
    slots = Number(slots) || 0;
    cost = Number(cost) || 0;

    if (slots <= 0) return;

    if ((Number(window.inventorySlots) || 24) >= slots) {
        alert("이미 확장된 인벤토리입니다.");
        return;
    }

    if (!spendGold(cost)) return;

    window.inventorySlots = Math.min(window.INVENTORY_SIZE || 56, slots);

    upPlaySfx("buy");
    refreshUpgradeUI();
};

// =========================
// 5. Top8 슬롯 제련
// =========================
function renderSlotResearch(box) {
    ensureUpgradeObjects();

    let html = `
        <div class="research-panel">
            <div class="research-panel-title">🦷 Top8 공격 슬롯 제련</div>
            <div class="research-panel-desc">
                인벤토리 상단 8칸은 전투 공격 슬롯입니다. 각 슬롯의 공격력, 재사용 대기시간, 사거리를 개별 강화합니다.
            </div>
        </div>
    `;

    for (let i = 0; i < 8; i++) {
        const toothLv = Array.isArray(window.inventory) ? Number(window.inventory[i]) || 0 : 0;
        const u = window.slotUpgrades[i];

        const atkMax = u.atk >= UPGRADE_MAX.slotAtk;
        const cdMax = u.cd >= UPGRADE_MAX.slotCd;
        const rngMax = u.rng >= UPGRADE_MAX.slotRng;

        const atkCost = getSlotUpgradeCost(i, "atk");
        const cdCost = getSlotUpgradeCost(i, "cd");
        const rngCost = getSlotUpgradeCost(i, "rng");

        const icon = toothLv > 0 && typeof getToothIcon === "function" ? getToothIcon(toothLv) : "빈칸";

        html += `
            <div class="research-panel">
                <div class="research-panel-title">
                    ${i + 1}번 슬롯 ${toothLv > 0 ? icon + " Lv." + (toothLv >= 25 ? "MAX" : toothLv) : "빈 슬롯"}
                </div>
                <div class="research-panel-desc">
                    현재 슬롯 보너스:
                    공격 +${u.atk * 5}% · 쿨감 +${u.cd * 2}% · 사거리 +${u.rng * 4}px
                </div>

                <div class="upgrade-card">
                    <div class="upgrade-icon">⚔️</div>
                    <div class="upgrade-info">
                        <div class="upgrade-title">공격력 제련 Lv.${u.atk}</div>
                        <div class="upgrade-desc">해당 슬롯 치아 공격력 +5%씩 증가</div>
                        <div class="upgrade-cost">${atkMax ? "최대 강화" : "비용: " + upFmt(atkCost) + " 골드"}</div>
                    </div>
                    <button class="upgrade-btn ${atkMax ? "disabled" : ""}" onclick="upgradeSlotStat(${i}, 'atk')" ${atkMax ? "disabled" : ""}>
                        강화
                    </button>
                </div>

                <div class="upgrade-card">
                    <div class="upgrade-icon">⏱️</div>
                    <div class="upgrade-info">
                        <div class="upgrade-title">쿨타임 제련 Lv.${u.cd}</div>
                        <div class="upgrade-desc">해당 슬롯 발사 대기시간 감소</div>
                        <div class="upgrade-cost">${cdMax ? "최대 강화" : "비용: " + upFmt(cdCost) + " 골드"}</div>
                    </div>
                    <button class="upgrade-btn ${cdMax ? "disabled" : ""}" onclick="upgradeSlotStat(${i}, 'cd')" ${cdMax ? "disabled" : ""}>
                        강화
                    </button>
                </div>

                <div class="upgrade-card">
                    <div class="upgrade-icon">🎯</div>
                    <div class="upgrade-info">
                        <div class="upgrade-title">사거리 제련 Lv.${u.rng}</div>
                        <div class="upgrade-desc">해당 슬롯 발사 사거리 증가</div>
                        <div class="upgrade-cost">${rngMax ? "최대 강화" : "비용: " + upFmt(rngCost) + " 골드"}</div>
                    </div>
                    <button class="upgrade-btn ${rngMax ? "disabled" : ""}" onclick="upgradeSlotStat(${i}, 'rng')" ${rngMax ? "disabled" : ""}>
                        강화
                    </button>
                </div>
            </div>
        `;
    }

    box.innerHTML = html;
}

window.upgradeSlotStat = function(slotIdx, type) {
    ensureUpgradeObjects();

    slotIdx = Number(slotIdx) || 0;

    if (slotIdx < 0 || slotIdx >= 8) return;

    if (!["atk", "cd", "rng"].includes(type)) return;

    const maxMap = {
        atk: UPGRADE_MAX.slotAtk,
        cd: UPGRADE_MAX.slotCd,
        rng: UPGRADE_MAX.slotRng
    };

    const current = Number(window.slotUpgrades[slotIdx][type]) || 0;

    if (current >= maxMap[type]) {
        alert("이미 최대 강화입니다.");
        return;
    }

    const cost = getSlotUpgradeCost(slotIdx, type);

    if (!spendGold(cost)) return;

    window.slotUpgrades[slotIdx][type] = current + 1;

    upPlaySfx("buy");
    refreshUpgradeUI();
};

// =========================
// 6. 공통 전투 연구
// =========================
function renderCombatResearch(box) {
    ensureUpgradeObjects();

    const g = window.globalUpgrades;

    const atkMax = g.atk >= UPGRADE_MAX.globalAtk;
    const cdMax = g.cd >= UPGRADE_MAX.globalCd;
    const rngMax = g.rng >= UPGRADE_MAX.globalRng;

    const atkCost = getGlobalUpgradeCost("atk");
    const cdCost = getGlobalUpgradeCost("cd");
    const rngCost = getGlobalUpgradeCost("rng");

    box.innerHTML = `
        <div class="research-panel">
            <div class="research-panel-title">⚔️ 공통 전투 연구</div>
            <div class="research-panel-desc">
                모든 Top8 공격 슬롯에 적용되는 전투 보너스입니다.
                전투에서는 Top8 치아가 한 번에 발사되지 않고 순서대로 릴레이 발사됩니다.
            </div>

            <div class="war-stat-grid">
                <div class="war-stat">
                    공통 공격 보너스
                    <b>+${g.atk * 5}%</b>
                </div>
                <div class="war-stat">
                    공통 쿨타임 감소
                    <b>+${g.cd * 2}%</b>
                </div>
                <div class="war-stat">
                    공통 사거리 증가
                    <b>+${g.rng * 4}px</b>
                </div>
                <div class="war-stat">
                    현재 전투력
                    <b>${upFmt(typeof getPlayerCombatPower === "function" ? getPlayerCombatPower() : 0)}</b>
                </div>
            </div>
        </div>

        <div class="upgrade-card">
            <div class="upgrade-icon">⚔️</div>
            <div class="upgrade-info">
                <div class="upgrade-title">공통 공격 연구 Lv.${g.atk}</div>
                <div class="upgrade-desc">모든 슬롯 공격력 +5%씩 증가</div>
                <div class="upgrade-cost">${atkMax ? "최대 강화" : "비용: " + upFmt(atkCost) + " 골드"}</div>
            </div>
            <button class="upgrade-btn ${atkMax ? "disabled" : ""}" onclick="upgradeGlobalStat('atk')" ${atkMax ? "disabled" : ""}>
                강화
            </button>
        </div>

        <div class="upgrade-card">
            <div class="upgrade-icon">⏱️</div>
            <div class="upgrade-info">
                <div class="upgrade-title">공통 쿨타임 연구 Lv.${g.cd}</div>
                <div class="upgrade-desc">모든 슬롯 발사 대기시간 감소</div>
                <div class="upgrade-cost">${cdMax ? "최대 강화" : "비용: " + upFmt(cdCost) + " 골드"}</div>
            </div>
            <button class="upgrade-btn ${cdMax ? "disabled" : ""}" onclick="upgradeGlobalStat('cd')" ${cdMax ? "disabled" : ""}>
                강화
            </button>
        </div>

        <div class="upgrade-card">
            <div class="upgrade-icon">🎯</div>
            <div class="upgrade-info">
                <div class="upgrade-title">공통 사거리 연구 Lv.${g.rng}</div>
                <div class="upgrade-desc">모든 슬롯 발사 사거리 증가</div>
                <div class="upgrade-cost">${rngMax ? "최대 강화" : "비용: " + upFmt(rngCost) + " 골드"}</div>
            </div>
            <button class="upgrade-btn ${rngMax ? "disabled" : ""}" onclick="upgradeGlobalStat('rng')" ${rngMax ? "disabled" : ""}>
                강화
            </button>
        </div>
    `;
}

window.upgradeGlobalStat = function(type) {
    ensureUpgradeObjects();

    if (!["atk", "cd", "rng"].includes(type)) return;

    const maxMap = {
        atk: UPGRADE_MAX.globalAtk,
        cd: UPGRADE_MAX.globalCd,
        rng: UPGRADE_MAX.globalRng
    };

    const current = Number(window.globalUpgrades[type]) || 0;

    if (current >= maxMap[type]) {
        alert("이미 최대 강화입니다.");
        return;
    }

    const cost = getGlobalUpgradeCost(type);

    if (!spendGold(cost)) return;

    window.globalUpgrades[type] = current + 1;

    upPlaySfx("buy");
    refreshUpgradeUI();
};

// =========================
// 7. 용병 훈련
// =========================
function renderTrainingResearch(box) {
    ensureUpgradeObjects();

    const t = window.trainingLevels;

    const data = [
        {
            key: "hp",
            icon: "❤️",
            title: "체력 훈련",
            desc: "용병 최대 체력 +10%씩 증가",
            value: `+${t.hp * 10}%`
        },
        {
            key: "atk",
            icon: "💪",
            title: "공격 훈련",
            desc: "용병 공격 배율 +10%씩 증가",
            value: `+${t.atk * 10}%`
        },
        {
            key: "spd",
            icon: "💨",
            title: "이동 훈련",
            desc: "용병 이동속도 +3%씩 증가",
            value: `+${t.spd * 3}%`
        },
        {
            key: "crit",
            icon: "💥",
            title: "치명타 훈련",
            desc: "치명타 확률 +1.5%씩 증가",
            value: `${Math.min(45, t.crit * 1.5).toFixed(1)}%`
        },
        {
            key: "splashDmg",
            icon: "🌊",
            title: "광역 피해 훈련",
            desc: "광역 피해량 증가",
            value: `${(25 + t.splashDmg * 2.5).toFixed(1)}%`
        },
        {
            key: "splashRange",
            icon: "⭕",
            title: "광역 범위 훈련",
            desc: "광역 피해 범위 증가",
            value: `${Math.floor(55 + t.splashRange * 3)}px`
        }
    ];

    let html = `
        <div class="research-panel">
            <div class="research-panel-title">🏋️ 용병 훈련</div>
            <div class="research-panel-desc">
                용병의 생존력, 공격력, 이동속도, 치명타, 광역 공격 능력을 강화합니다.
                던전 원정 탭에서는 현재 훈련이 반영된 용병 상태가 표시됩니다.
            </div>
        </div>
    `;

    data.forEach((item) => {
        const lv = Number(t[item.key]) || 0;
        const max = lv >= UPGRADE_MAX.training;
        const cost = getTrainingCost(item.key);

        html += `
            <div class="training-card">
                <div class="training-icon">${item.icon}</div>
                <div class="training-info">
                    <div class="training-title">${item.title} Lv.${lv}</div>
                    <div class="training-desc">${item.desc}</div>
                    <div class="training-cost">
                        현재 ${item.value} · ${max ? "최대 강화" : "비용: " + upFmt(cost) + " 골드"}
                    </div>
                </div>
                <button class="training-btn ${max ? "disabled" : ""}" onclick="upgradeTraining('${item.key}')" ${max ? "disabled" : ""}>
                    ${max ? "완료" : "훈련"}
                </button>
            </div>
        `;
    });

    box.innerHTML = html;
}

window.upgradeTraining = function(type) {
    ensureUpgradeObjects();

    if (!["hp", "atk", "spd", "crit", "splashDmg", "splashRange"].includes(type)) return;

    const current = Number(window.trainingLevels[type]) || 0;

    if (current >= UPGRADE_MAX.training) {
        alert("이미 최대 훈련입니다.");
        return;
    }

    const cost = getTrainingCost(type);

    if (!spendGold(cost)) return;

    window.trainingLevels[type] = current + 1;

    upPlaySfx("buy");
    refreshUpgradeUI();
};

// 기존 함수명 호환
window.renderTrainingCamp = function() {
    if (window.currentView === "refine") {
        window.currentResearchTab = "training";
        window.renderResearchContent();
    }
};

// =========================
// 기존 제련 함수 호환
// =========================
window.renderRefineGrid = function() {
    window.renderResearchContent();
};

window.buyGlobalUpgrade = function(type) {
    window.upgradeGlobalStat(type);
};

window.buySlotUpgrade = function(slotIdx, type) {
    window.upgradeSlotStat(slotIdx, type);
};

// =========================
// 초기 렌더
// =========================
window.addEventListener("load", () => {
    setTimeout(() => {
        ensureUpgradeObjects();

        if (typeof window.renderResearchContent === "function") {
            window.renderResearchContent();
        }
    }, 150);
});
