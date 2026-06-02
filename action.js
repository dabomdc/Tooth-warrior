// Version: 8.0.0 - Action / Mining / Merge / Inventory
// 기존 밸런스 보존 + 직접 채굴 Lv.12 제한 + 일반 합성 Lv.24 제한 + Lv.MAX 표시

let lastTapTime = 0;
let lastTapIdx = -1;

// =========================
// 안전 유틸
// =========================
function getDragProxy() {
    return document.getElementById("drag-proxy");
}

function getCurrentViewSafe() {
    return window.currentView || "mine";
}

function getMaxSlotsSafe() {
    return Math.max(24, Math.min(window.INVENTORY_SIZE || 56, window.maxSlots || 24));
}

function getInventoryValue(idx) {
    if (!Array.isArray(window.inventory)) return 0;
    return Number(window.inventory[idx]) || 0;
}

function setInventoryValue(idx, value) {
    if (!Array.isArray(window.inventory)) return;

    const maxLv = window.TOOTH_MAX_LEVEL || 25;
    let lv = Number(value) || 0;

    if (lv < 0) lv = 0;
    if (lv > maxLv) lv = maxLv;

    window.inventory[idx] = lv;
}

function getLvLabel(lv) {
    if (typeof window.getToothDisplayLevel === "function") {
        const label = window.getToothDisplayLevel(lv);
        return label === "MAX" ? "Lv.MAX" : `Lv.${label}`;
    }

    return lv >= 25 ? "Lv.MAX" : `Lv.${lv}`;
}

function isMaxTooth(lv) {
    return Number(lv) >= (window.TOOTH_MAX_LEVEL || 25);
}

function isLockedCrown(lv) {
    return Number(lv) === (window.MERGE_MAX_LEVEL || 24);
}

// =========================
// 채굴 진행
// =========================
function processMining(amt, shouldSave = false) {
    window.mineProgress += Number(amt) || 0;

    if (window.mineProgress >= 100) {
        window.mineProgress = 100;

        if (addMinedItem(shouldSave)) {
            window.mineProgress = 0;
        }
    }
}

window.processMining = processMining;

function addMinedItem(shouldRender = true) {
    cleanupInventory(false);

    const maxSlots = getMaxSlotsSafe();
    let emptyIdx = -1;

    for (let i = 0; i < maxSlots; i++) {
        if (getInventoryValue(i) === 0) {
            emptyIdx = i;
            break;
        }
    }

    if (emptyIdx === -1) {
        return false;
    }

    let resultLv = typeof window.getBaseMiningLevel === "function" ? window.getBaseMiningLevel() : 1;

    if (typeof TOOTH_DATA !== "undefined" && TOOTH_DATA.pickaxes[window.pickaxeIdx]) {
        if (Math.random() < TOOTH_DATA.pickaxes[window.pickaxeIdx].luck) {
            resultLv += 1;
        }
    }

    resultLv = Math.min(window.MINING_MAX_LEVEL || 12, resultLv);

    setInventoryValue(emptyIdx, resultLv);
    checkHighestTier(resultLv);

    if (shouldRender && getCurrentViewSafe() === "mine" && typeof window.renderInventory === "function") {
        window.renderInventory();
    }

    try {
        if (typeof playSfx === "function") playSfx("mine");
    } catch (e) {}

    if (shouldRender && typeof window.saveGame === "function") {
        window.saveGame();
    }

    return true;
}

window.addMinedItem = addMinedItem;

// =========================
// 수동 채굴 터치
// =========================
function setupMiningTouch() {
    const mineArea = document.getElementById("mine-rock-area");

    if (!mineArea || mineArea.__toothBound) return;
    mineArea.__toothBound = true;

    mineArea.addEventListener("pointerdown", (e) => {
        e.preventDefault();

        const miner = document.getElementById("miner-char");

        if (miner) {
            miner.style.animation = "none";
            miner.offsetHeight;
            miner.style.animation = "hammer 0.08s ease-in-out";
        }

        try {
            if (typeof playSfx === "function") playSfx("mine");
        } catch (err) {}

        let miningPower = 15;

        if (typeof TOOTH_DATA !== "undefined" && TOOTH_DATA.pickaxes[window.pickaxeIdx]) {
            miningPower = TOOTH_DATA.pickaxes[window.pickaxeIdx].power || 15;
        }

        // 기존 Lv.4 보너스 유지
        if (window.highestToothLevel >= 4) {
            if (Math.random() < 0.2) {
                const tapGold = (typeof window.getBaseMiningLevel === "function" ? window.getBaseMiningLevel() : 1) * 50;
                window.gold += tapGold;

                const txt = document.createElement("div");
                txt.className = "gold-text";
                txt.innerText = `💰+${typeof fNum === "function" ? fNum(tapGold) : tapGold}`;
                txt.style.left = e.clientX + "px";
                txt.style.top = (e.clientY - 30) + "px";
                txt.style.pointerEvents = "none";

                document.body.appendChild(txt);
                setTimeout(() => txt.remove(), 800);
            }

            miningPower *= 1.2;
        }

        processMining(miningPower, false);

        const effect = document.createElement("div");
        effect.className = "hit-effect";
        effect.innerText = "💥";
        effect.style.left = e.clientX + "px";
        effect.style.top = e.clientY + "px";
        effect.style.pointerEvents = "none";

        document.body.appendChild(effect);
        setTimeout(() => effect.remove(), 400);

        if (!window.isAutoMineOn) {
            const mDial = document.getElementById("mine-dial");

            if (mDial) {
                mDial.style.filter = "brightness(2) drop-shadow(0 0 10px #00fbff)";
                setTimeout(() => {
                    mDial.style.filter = "grayscale(1) brightness(0.6)";
                }, 100);
            }
        }

        if (typeof window.updateUI === "function") window.updateUI();
        if (typeof window.renderInventory === "function") window.renderInventory();
        if (typeof window.saveGame === "function") window.saveGame();
    });
}

window.setupMiningTouch = setupMiningTouch;

// =========================
// 인벤토리 렌더링
// =========================
function renderInventory() {
    const grid = document.getElementById("inventory-grid");

    if (!grid) return;

    if (!Array.isArray(window.inventory)) {
        window.inventory = new Array(window.INVENTORY_SIZE || 56).fill(0);
    }

    const totalSlots = window.INVENTORY_SIZE || 56;
    const maxSlots = getMaxSlotsSafe();

    if (grid.children.length === 0) {
        for (let i = 0; i < totalSlots; i++) {
            const slot = document.createElement("div");

            slot.dataset.index = i;
            slot.id = `slot-${i}`;

            slot.onpointerdown = (e) => handleSlotPointerDown(e, i, slot);
            slot.onpointermove = (e) => handleSlotPointerMove(e);
            slot.onpointerup = (e) => handleSlotPointerUp(e, i, slot);
            slot.onpointercancel = (e) => handleSlotPointerCancel(e, slot);

            grid.appendChild(slot);
        }
    }

    for (let i = 0; i < totalSlots; i++) {
        const slot = document.getElementById(`slot-${i}`);
        if (!slot) continue;

        const lv = getInventoryValue(i);
        const isAttackSlot = i < (window.TOP_ATTACK_SLOT_COUNT || 8);
        const isLockedSlot = i >= maxSlots;

        slot.className = `slot ${isAttackSlot ? "attack-slot" : ""} ${isLockedSlot ? "locked-slot" : ""}`;

        if (isLockedSlot) {
            slot.innerHTML = "🔒";
            continue;
        }

        if (lv > 0) {
            const dmg = typeof getAtk === "function" ? getAtk(lv) : 10;
            const dmgText = typeof fNum === "function" ? fNum(dmg) : dmg;
            const iconHtml = typeof getToothIcon === "function" ? getToothIcon(lv) : "🦷";
            const lvLabel = getLvLabel(lv);
            const lvClass = lv >= 25 ? "lv-text max" : "lv-text";

            slot.innerHTML = `
                <span class="dmg-label">⚔️${dmgText}</span>
                ${iconHtml}
                <span class="${lvClass}">${lvLabel}</span>
            `;
        } else {
            slot.innerHTML = "";
        }
    }
}

window.renderInventory = renderInventory;

function handleSlotPointerDown(e, i, slot) {
    const lv = getInventoryValue(i);

    if (lv <= 0) return;

    const currentTime = Date.now();
    const tapLength = currentTime - lastTapTime;

    if (tapLength < 300 && tapLength > 0 && lastTapIdx === i) {
        e.preventDefault();

        // Lv.24 더블탭 → 봉인 해제
        if (isLockedCrown(lv)) {
            if (typeof window.openLockedToothModal === "function") {
                window.openLockedToothModal(i);
            }
        } else if (lv < (window.MERGE_MAX_LEVEL || 24)) {
            massMerge(lv, false);
        } else {
            alert("최대 레벨입니다!");
        }

        lastTapTime = 0;
        lastTapIdx = -1;

        return;
    }

    lastTapTime = currentTime;
    lastTapIdx = i;

    e.preventDefault();

    window.dragStartIdx = i;

    slot.classList.add("picked");

    const proxy = getDragProxy();
    if (proxy) {
        proxy.innerHTML = typeof getToothIcon === "function" ? getToothIcon(lv) : "🦷";
        proxy.style.display = "block";
        moveProxy(e);
    }

    try {
        slot.setPointerCapture(e.pointerId);
    } catch (err) {}
}

function handleSlotPointerMove(e) {
    if (window.dragStartIdx !== null) {
        moveProxy(e);
    }
}

function handleSlotPointerUp(e, i, slot) {
    if (window.dragStartIdx === null) return;

    try {
        slot.releasePointerCapture(e.pointerId);
    } catch (err) {}

    slot.classList.remove("picked");

    const proxy = getDragProxy();
    if (proxy) {
        proxy.style.display = "none";
    }

    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    const targetSlot = elements.find((el) => el.classList && el.classList.contains("slot") && el !== slot);

    if (targetSlot) {
        const toIdx = parseInt(targetSlot.dataset.index, 10);

        if (!Number.isNaN(toIdx) && toIdx < getMaxSlotsSafe()) {
            handleMoveOrMerge(window.dragStartIdx, toIdx);
        }
    }

    document.querySelectorAll(".slot").forEach((s) => s.classList.remove("drag-target"));
    window.dragStartIdx = null;
}

function handleSlotPointerCancel(e, slot) {
    slot.classList.remove("picked");

    const proxy = getDragProxy();
    if (proxy) proxy.style.display = "none";

    document.querySelectorAll(".slot").forEach((s) => s.classList.remove("drag-target"));
    window.dragStartIdx = null;
}

function moveProxy(e) {
    const proxy = getDragProxy();
    if (!proxy) return;

    proxy.style.left = e.clientX + "px";
    proxy.style.top = e.clientY + "px";

    document.querySelectorAll(".slot").forEach((s) => s.classList.remove("drag-target"));

    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    const targetSlot = elements.find((el) => el.classList && el.classList.contains("slot"));

    if (targetSlot && parseInt(targetSlot.dataset.index, 10) < getMaxSlotsSafe()) {
        targetSlot.classList.add("drag-target");
    }
}

window.moveProxy = moveProxy;

// =========================
// 이동 / 합성
// =========================
function handleMoveOrMerge(from, to) {
    if (from === to) return;

    const fromLv = getInventoryValue(from);
    const toLv = getInventoryValue(to);

    if (fromLv <= 0) return;

    if (fromLv === toLv && toLv > 0) {
        if (fromLv >= (window.MERGE_MAX_LEVEL || 24)) {
            if (fromLv === 24 && typeof window.openLockedToothModal === "function") {
                window.openLockedToothModal(to);
            } else {
                alert("최대 레벨입니다!");
            }
            return;
        }

        let nextLv = fromLv + 1;
        let isGreat = false;

        // 대성공은 Lv.22 이하에서만 +2 가능
        // Lv.23 + Lv.23은 반드시 Lv.24까지만
        if (fromLv < 23 && Math.random() < ((window.greatChanceLevel || 0) * 0.02)) {
            nextLv = Math.min(window.MERGE_MAX_LEVEL || 24, fromLv + 2);
            isGreat = true;
        }

        setInventoryValue(to, nextLv);
        setInventoryValue(from, 0);

        checkHighestTier(nextLv);

        renderInventory();

        if (isGreat) {
            try {
                if (typeof playSfx === "function") playSfx("great");
            } catch (e) {}
            window.showGreatSuccessEffect(to);
        } else {
            try {
                if (typeof playSfx === "function") playSfx("merge");
            } catch (e) {}
        }

        if (!window.isAutoMergeOn) {
            const mDial = document.getElementById("merge-dial");

            if (mDial) {
                mDial.style.filter = "brightness(2) drop-shadow(0 0 10px #9b59b6)";
                setTimeout(() => {
                    mDial.style.filter = "grayscale(1) brightness(0.6)";
                }, 150);
            }
        }
    } else {
        setInventoryValue(from, toLv);
        setInventoryValue(to, fromLv);

        renderInventory();
    }

    if (typeof window.saveGame === "function") window.saveGame();
}

window.handleMoveOrMerge = handleMoveOrMerge;

// =========================
// 자동 합성
// - Top8 공격 슬롯 제외
// - Lv.24까지만 합성
// =========================
function autoMergeLowest(shouldRender = true) {
    const levelCounts = {};
    const maxSlots = getMaxSlotsSafe();

    for (let i = window.TOP_ATTACK_SLOT_COUNT || 8; i < maxSlots; i++) {
        const lv = getInventoryValue(i);

        if (lv > 0 && lv < (window.MERGE_MAX_LEVEL || 24)) {
            levelCounts[lv] = (levelCounts[lv] || 0) + 1;
        }
    }

    let targetLv = -1;
    const levels = Object.keys(levelCounts).map(Number).sort((a, b) => a - b);

    for (const lv of levels) {
        if (levelCounts[lv] >= 2) {
            targetLv = lv;
            break;
        }
    }

    if (targetLv !== -1) {
        massMerge(targetLv, true, shouldRender);
        return true;
    }

    return false;
}

window.autoMergeLowest = autoMergeLowest;

function massMerge(lv, once = false, shouldRender = true) {
    lv = Number(lv) || 0;

    if (lv <= 0 || lv >= (window.MERGE_MAX_LEVEL || 24)) {
        return;
    }

    const indices = [];
    const maxSlots = getMaxSlotsSafe();

    window.inventory.forEach((val, idx) => {
        if (idx >= (window.TOP_ATTACK_SLOT_COUNT || 8) && idx < maxSlots && Number(val) === lv) {
            indices.push(idx);
        }
    });

    if (indices.length < 2) return;

    const loopCount = once ? 1 : Math.floor(indices.length / 2);
    let greatCount = 0;
    let lastGreatIdx = -1;

    for (let i = 0; i < loopCount; i++) {
        const idx1 = indices[2 * i];
        const idx2 = indices[2 * i + 1];

        if (idx1 === undefined || idx2 === undefined) continue;

        let nextLv = lv + 1;

        if (lv < 23 && Math.random() < ((window.greatChanceLevel || 0) * 0.02)) {
            nextLv = Math.min(window.MERGE_MAX_LEVEL || 24, lv + 2);
            greatCount++;
            lastGreatIdx = idx2;
        }

        setInventoryValue(idx2, nextLv);
        setInventoryValue(idx1, 0);

        checkHighestTier(nextLv);
    }

    if (shouldRender && getCurrentViewSafe() === "mine") {
        renderInventory();
    }

    if (greatCount > 0) {
        try {
            if (typeof playSfx === "function") playSfx("great");
        } catch (e) {}

        if (shouldRender && lastGreatIdx !== -1) {
            window.showGreatSuccessEffect(lastGreatIdx);
        }
    } else {
        try {
            if (typeof playSfx === "function") playSfx("merge");
        } catch (e) {}
    }

    if (typeof window.saveGame === "function") window.saveGame();
}

window.massMerge = massMerge;

// =========================
// 대성공 이펙트
// =========================
window.showGreatSuccessEffect = function(slotIdx) {
    setTimeout(() => {
        const slot = document.getElementById(`slot-${slotIdx}`);

        if (!slot) return;

        const txt = document.createElement("div");
        txt.className = "great-success-text";
        txt.innerText = "✨ +2";

        slot.appendChild(txt);

        setTimeout(() => txt.remove(), 800);
    }, 10);
};

// =========================
// 최고 티어 체크
// =========================
function checkHighestTier(level) {
    level = Number(level) || 0;

    if (level <= 0) return;

    if (level > window.highestToothLevel && level <= (window.TOOTH_MAX_LEVEL || 25)) {
        window.highestToothLevel = level;

        if (typeof window.saveGame === "function") window.saveGame();

        if (level < 25 && (level - 1) % 3 === 0 && level > 1) {
            if (typeof window.showTierUnlock === "function") {
                window.showTierUnlock(level);
            }
        }

        if (level >= 25) {
            window.isToothAwakened = true;

            if (typeof window.saveGame === "function") window.saveGame();
        }
    }
}

window.checkHighestTier = checkHighestTier;

// =========================
// 인벤토리 정리
// =========================
function cleanupInventory(shouldRender = true) {
    const minMiningLv = typeof window.getBaseMiningLevel === "function" ? window.getBaseMiningLevel() : 1;
    const maxSlots = getMaxSlotsSafe();
    let cleared = false;

    for (let i = 0; i < maxSlots; i++) {
        const lv = getInventoryValue(i);

        if (lv > 0 && lv < minMiningLv) {
            setInventoryValue(i, 0);
            cleared = true;
        }
    }

    if (cleared && shouldRender && getCurrentViewSafe() === "mine") {
        renderInventory();
    }

    return cleared;
}

window.cleanupInventory = cleanupInventory;

// =========================
// 자동 정렬
// =========================
window.sortInventory = function() {
    if (!Array.isArray(window.inventory)) return;

    const totalSlots = window.INVENTORY_SIZE || 56;
    const items = window.inventory.filter((v) => Number(v) > 0);

    items.sort((a, b) => Number(b) - Number(a));

    window.inventory = new Array(totalSlots).fill(0);

    items.forEach((v, i) => {
        if (i < totalSlots) {
            setInventoryValue(i, v);
        }
    });

    refreshHighestToothLevelFromInventory();

    renderInventory();

    if (typeof window.saveGame === "function") window.saveGame();
};

// =========================
// 곡괭이 표시
// =========================
function updatePickaxeVisual() {
    const miner = document.getElementById("miner-char");

    if (miner && typeof TOOTH_DATA !== "undefined" && TOOTH_DATA.pickaxes[window.pickaxeIdx]) {
        miner.innerText = TOOTH_DATA.pickaxes[window.pickaxeIdx].icon || "⛏️";
    }
}

window.updatePickaxeVisual = updatePickaxeVisual;

// =========================
// 자동 채굴 / 합성 토글
// =========================
window.toggleAutoMine = function() {
    window.isAutoMineOn = !window.isAutoMineOn;

    if (typeof window.updateToggleButtons === "function") {
        window.updateToggleButtons();
    }

    if (typeof window.saveGame === "function") {
        window.saveGame();
    }
};

window.toggleAutoMerge = function() {
    window.isAutoMergeOn = !window.isAutoMergeOn;

    if (typeof window.updateToggleButtons === "function") {
        window.updateToggleButtons();
    }

    if (typeof window.saveGame === "function") {
        window.saveGame();
    }
};
