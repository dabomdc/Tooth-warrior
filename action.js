// Version: 8.1.0 - Mining / Inventory / Merge / Drag / Auto Fix

// =========================
// 내부 상태
// =========================
let selectedInventoryIndex = null;
let lastTapSlotIndex = null;
let lastTapTime = 0;

let dragState = {
    active: false,
    dragging: false,
    pointerId: null,
    fromIndex: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0
};

// =========================
// 안전 유틸
// =========================
function getMaxSlotsSafe() {
    if (typeof window.getMaxInventorySlots === "function") {
        return window.getMaxInventorySlots();
    }

    return Math.max(24, Math.min(window.inventorySlots || 24, window.INVENTORY_SIZE || 56));
}

function getInventoryValue(idx) {
    if (!Array.isArray(window.inventory)) return 0;
    return Number(window.inventory[idx]) || 0;
}

function setInventoryValue(idx, value) {
    if (!Array.isArray(window.inventory)) {
        window.inventory = new Array(window.INVENTORY_SIZE || 56).fill(0);
    }

    window.inventory[idx] = Math.max(0, Math.min(window.TOOTH_MAX_LEVEL || 25, Number(value) || 0));
}

function isTopAttackSlot(idx) {
    return idx >= 0 && idx < (window.TOP_ATTACK_SLOT_COUNT || 8);
}

function getCurrentViewSafe() {
    return window.currentView || "mine";
}

function getSlotElementFromPoint(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;

    return el.closest(".inventory-slot");
}

// =========================
// 채굴 터치 설정
// =========================
window.setupMiningTouch = function() {
    const area = document.getElementById("mine-rock-area");

    if (!area || area.__toothMiningBound) return;

    area.__toothMiningBound = true;

    area.addEventListener("pointerdown", (e) => {
        if (window.currentView !== "mine") return;
        if (window.dungeonActive) return;

        e.preventDefault();

        try {
            area.setPointerCapture(e.pointerId);
        } catch (err) {}

        manualMineOnce(e.clientX, e.clientY);
    });

    area.addEventListener("pointermove", (e) => {
        if (window.currentView !== "mine") return;
        e.preventDefault();
    });

    area.addEventListener("pointerup", (e) => {
        try {
            area.releasePointerCapture(e.pointerId);
        } catch (err) {}
    });

    area.addEventListener("pointercancel", (e) => {
        try {
            area.releasePointerCapture(e.pointerId);
        } catch (err) {}
    });
};

function manualMineOnce(x, y) {
    const pickaxe = typeof TOOTH_DATA !== "undefined"
        ? TOOTH_DATA.pickaxes[window.pickaxeIdx] || TOOTH_DATA.pickaxes[0]
        : null;

    const power = pickaxe ? pickaxe.power : 10;

    animateMiningHit();

    if (navigator.vibrate) {
        try {
            navigator.vibrate(18);
        } catch (e) {}
    }

    processMining(power, true);

    if (typeof window.updateUI === "function") {
        window.updateUI();
    }
}

function animateMiningHit() {
    const tooth = document.getElementById("giant-tooth");
    const miner = document.getElementById("miner-char");

    if (tooth) {
        tooth.classList.remove("hit");
        void tooth.offsetWidth;
        tooth.classList.add("hit");

        setTimeout(() => tooth.classList.remove("hit"), 100);
    }

    if (miner) {
        miner.classList.remove("swing");
        void miner.offsetWidth;
        miner.classList.add("swing");

        setTimeout(() => miner.classList.remove("swing"), 180);
    }
}

// =========================
// 채굴 처리
// =========================
window.processMining = function(amt, shouldSave = false) {
    window.mineProgress += Number(amt) || 0;

    let mined = false;

    while (window.mineProgress >= 100) {
        window.mineProgress -= 100;

        const ok = addMinedItem(true, shouldSave);

        if (!ok) {
            window.mineProgress = 100;
            break;
        }

        mined = true;
    }

    if (window.mineProgress < 0) window.mineProgress = 0;
    if (window.mineProgress > 100) window.mineProgress = 100;

    if (mined && getCurrentViewSafe() === "mine") {
        renderInventory();
    }

    if (typeof window.updateUI === "function") {
        window.updateUI();
    }
};

window.addMinedItem = function(shouldRender = true, shouldSave = true) {
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

    let resultLv = typeof window.getBaseMiningLevel === "function"
        ? window.getBaseMiningLevel()
        : 1;

    if (typeof TOOTH_DATA !== "undefined" && TOOTH_DATA.pickaxes[window.pickaxeIdx]) {
        const pickaxe = TOOTH_DATA.pickaxes[window.pickaxeIdx];

        if (Math.random() < pickaxe.luck) {
            resultLv += 1;
        }
    }

    resultLv = Math.min(window.MINING_MAX_LEVEL || 12, resultLv);

    setInventoryValue(emptyIdx, resultLv);
    checkHighestTier(resultLv);

    if (resultLv >= 4) {
        showMineFloatText(`+ Lv.${resultLv}`);
    }

    try {
        if (typeof playSfx === "function") playSfx("mine");
    } catch (e) {}

    if (shouldRender && getCurrentViewSafe() === "mine") {
        renderInventory();
    }

    if (shouldSave && typeof window.saveGame === "function") {
        window.saveGame();
    }

    return true;
};

// =========================
// 채굴 획득 텍스트
// =========================
function showMineFloatText(text) {
    const area = document.getElementById("mine-rock-area");
    if (!area) return;

    const el = document.createElement("div");
    el.className = "mine-float-text";
    el.innerText = text;

    const x = 50 + (Math.random() * 20 - 10);
    const y = 42 + (Math.random() * 18 - 9);

    el.style.left = x + "%";
    el.style.top = y + "%";

    area.appendChild(el);

    setTimeout(() => el.remove(), 900);
}

// =========================
// 인벤토리 정리
// =========================
window.cleanupInventory = function(shouldRender = true) {
    if (!Array.isArray(window.inventory)) {
        window.inventory = new Array(window.INVENTORY_SIZE || 56).fill(0);
    }

    while (window.inventory.length < (window.INVENTORY_SIZE || 56)) {
        window.inventory.push(0);
    }

    if (window.inventory.length > (window.INVENTORY_SIZE || 56)) {
        window.inventory.length = window.INVENTORY_SIZE || 56;
    }

    for (let i = 0; i < window.inventory.length; i++) {
        const v = Number(window.inventory[i]) || 0;
        window.inventory[i] = Math.max(0, Math.min(window.TOOTH_MAX_LEVEL || 25, Math.floor(v)));
    }

    if (typeof window.refreshHighestToothLevel === "function") {
        window.refreshHighestToothLevel();
    }

    if (shouldRender) {
        renderInventory();
    }
};

// =========================
// 인벤토리 렌더링
// =========================
window.renderInventory = function() {
    const grid = document.getElementById("inventory-grid");
    if (!grid) return;

    cleanupInventory(false);

    const maxSlots = getMaxSlotsSafe();

    grid.innerHTML = "";

    for (let i = 0; i < maxSlots; i++) {
        const lv = getInventoryValue(i);

        const slot = document.createElement("div");
        slot.className = "inventory-slot inv-slot";

        if (isTopAttackSlot(i)) {
            slot.classList.add("top-slot", "attack-slot");
        }

        if (lv <= 0) {
            slot.classList.add("empty");
        }

        if (selectedInventoryIndex === i) {
            slot.classList.add("selected");
        }

        slot.dataset.index = String(i);

        if (lv > 0) {
            const icon = typeof getToothIcon === "function" ? getToothIcon(lv) : "🦷";
            const label = typeof getToothDisplayLevel === "function" ? getToothDisplayLevel(lv) : lv;

            slot.innerHTML = `
                ${icon}
                <div class="slot-level">${label}</div>
            `;
            slot.title = typeof getToothName === "function" ? getToothName(lv) : `Lv.${lv}`;
        } else {
            slot.innerHTML = "";
        }

        bindInventorySlotEvents(slot);

        grid.appendChild(slot);
    }
};

function bindInventorySlotEvents(slot) {
    slot.addEventListener("pointerdown", onInventoryPointerDown);
    slot.addEventListener("pointermove", onInventoryPointerMove);
    slot.addEventListener("pointerup", onInventoryPointerUp);
    slot.addEventListener("pointercancel", onInventoryPointerCancel);
}

function onInventoryPointerDown(e) {
    const slot = e.currentTarget;
    const idx = Number(slot.dataset.index);

    if (!Number.isFinite(idx)) return;

    e.preventDefault();

    dragState.active = true;
    dragState.dragging = false;
    dragState.pointerId = e.pointerId;
    dragState.fromIndex = idx;
    dragState.startX = e.clientX;
    dragState.startY = e.clientY;
    dragState.currentX = e.clientX;
    dragState.currentY = e.clientY;

    try {
        slot.setPointerCapture(e.pointerId);
    } catch (err) {}
}

function onInventoryPointerMove(e) {
    if (!dragState.active || dragState.pointerId !== e.pointerId) return;

    e.preventDefault();

    dragState.currentX = e.clientX;
    dragState.currentY = e.clientY;

    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (!dragState.dragging && dist > 10 && getInventoryValue(dragState.fromIndex) > 0) {
        dragState.dragging = true;
        showDragProxy(dragState.fromIndex, e.clientX, e.clientY);
    }

    if (dragState.dragging) {
        moveDragProxy(e.clientX, e.clientY);
    }
}

function onInventoryPointerUp(e) {
    if (!dragState.active || dragState.pointerId !== e.pointerId) return;

    e.preventDefault();

    const fromIdx = dragState.fromIndex;
    const wasDragging = dragState.dragging;

    try {
        e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}

    hideDragProxy();

    dragState.active = false;
    dragState.dragging = false;
    dragState.pointerId = null;

    if (wasDragging) {
        const targetSlot = getSlotElementFromPoint(e.clientX, e.clientY);

        if (targetSlot) {
            const toIdx = Number(targetSlot.dataset.index);

            if (Number.isFinite(toIdx) && toIdx !== fromIdx) {
                handleMoveOrMerge(fromIdx, toIdx);
            }
        }

        selectedInventoryIndex = null;
        renderInventory();
        return;
    }

    handleInventoryTap(fromIdx);
}

function onInventoryPointerCancel(e) {
    if (dragState.pointerId !== e.pointerId) return;

    hideDragProxy();

    dragState.active = false;
    dragState.dragging = false;
    dragState.pointerId = null;
}

// =========================
// 탭 선택 / 더블탭
// =========================
function handleInventoryTap(idx) {
    const lv = getInventoryValue(idx);
    const now = Date.now();

    if (lv >= 24 && lastTapSlotIndex === idx && now - lastTapTime < 420) {
        selectedInventoryIndex = null;
        lastTapSlotIndex = null;
        lastTapTime = 0;

        if (typeof window.openLockedToothModal === "function") {
            window.openLockedToothModal(idx);
        }

        renderInventory();
        return;
    }

    lastTapSlotIndex = idx;
    lastTapTime = now;

    if (selectedInventoryIndex === null) {
        if (lv > 0) {
            selectedInventoryIndex = idx;
            renderInventory();
        }

        return;
    }

    if (selectedInventoryIndex === idx) {
        selectedInventoryIndex = null;
        renderInventory();
        return;
    }

    handleMoveOrMerge(selectedInventoryIndex, idx);

    selectedInventoryIndex = null;
    renderInventory();
}

// =========================
// 드래그 프록시
// =========================
function showDragProxy(idx, x, y) {
    const proxy = document.getElementById("drag-proxy");
    if (!proxy) return;

    const lv = getInventoryValue(idx);
    if (lv <= 0) return;

    proxy.innerHTML = `
        <div class="inventory-slot inv-slot selected" style="width:52px;height:52px;font-size:26px;">
            ${typeof getToothIcon === "function" ? getToothIcon(lv) : "🦷"}
            <div class="slot-level">${typeof getToothDisplayLevel === "function" ? getToothDisplayLevel(lv) : lv}</div>
        </div>
    `;

    proxy.style.display = "block";
    moveDragProxy(x, y);
}

function moveDragProxy(x, y) {
    const proxy = document.getElementById("drag-proxy");
    if (!proxy) return;

    proxy.style.left = x + "px";
    proxy.style.top = y + "px";
}

function hideDragProxy() {
    const proxy = document.getElementById("drag-proxy");
    if (!proxy) return;

    proxy.style.display = "none";
    proxy.innerHTML = "";
}

// =========================
// 이동 / 합성
// =========================
window.handleMoveOrMerge = function(fromIdx, toIdx) {
    fromIdx = Number(fromIdx);
    toIdx = Number(toIdx);

    const maxSlots = getMaxSlotsSafe();

    if (
        !Number.isFinite(fromIdx) ||
        !Number.isFinite(toIdx) ||
        fromIdx < 0 ||
        toIdx < 0 ||
        fromIdx >= maxSlots ||
        toIdx >= maxSlots ||
        fromIdx === toIdx
    ) {
        return false;
    }

    const fromLv = getInventoryValue(fromIdx);
    const toLv = getInventoryValue(toIdx);

    if (fromLv <= 0) return false;

    // 빈 칸으로 이동
    if (toLv <= 0) {
        setInventoryValue(toIdx, fromLv);
        setInventoryValue(fromIdx, 0);

        afterInventoryChanged(true);
        return true;
    }

    // 같은 레벨 합성
    if (fromLv === toLv) {
        // Lv.24 이상은 일반 합성으로 Lv.MAX가 되지 않음
        if (fromLv >= (window.MERGE_MAX_LEVEL || 24)) {
            if (fromLv === 24 && typeof window.openLockedToothModal === "function") {
                window.openLockedToothModal(toIdx);
            }

            return false;
        }

        let resultLv = fromLv + 1;

        // 대성공
        const greatChance = typeof window.getGreatChance === "function" ? window.getGreatChance() : 0;

        if (Math.random() < greatChance) {
            resultLv += 1;

            try {
                if (typeof playSfx === "function") playSfx("great");
            } catch (e) {}
        } else {
            try {
                if (typeof playSfx === "function") playSfx("merge");
            } catch (e) {}
        }

        resultLv = Math.min(window.MERGE_MAX_LEVEL || 24, resultLv);

        setInventoryValue(toIdx, resultLv);
        setInventoryValue(fromIdx, 0);

        checkHighestTier(resultLv);

        afterInventoryChanged(true);
        return true;
    }

    // 서로 다른 레벨이면 위치 교환
    setInventoryValue(fromIdx, toLv);
    setInventoryValue(toIdx, fromLv);

    afterInventoryChanged(true);
    return true;
};

function afterInventoryChanged(shouldSave) {
    cleanupInventory(false);
    renderInventory();

    if (typeof window.renderWarSummary === "function") {
        window.renderWarSummary();
    }

    if (typeof window.updateUI === "function") {
        window.updateUI();
    }

    if (shouldSave && typeof window.saveGame === "function") {
        window.saveGame();
    }
}

// =========================
// 자동 합성
// =========================
window.autoMergeLowest = function(shouldRender = true, shouldSave = true) {
    cleanupInventory(false);

    const maxSlots = getMaxSlotsSafe();

    // Top8 공격 슬롯은 자동합성 대상에서 제외
    for (let lv = 1; lv < (window.MERGE_MAX_LEVEL || 24); lv++) {
        let first = -1;
        let second = -1;

        for (let i = window.TOP_ATTACK_SLOT_COUNT || 8; i < maxSlots; i++) {
            if (getInventoryValue(i) === lv) {
                if (first === -1) {
                    first = i;
                } else {
                    second = i;
                    break;
                }
            }
        }

        if (first !== -1 && second !== -1) {
            let resultLv = lv + 1;

            const greatChance = typeof window.getGreatChance === "function" ? window.getGreatChance() : 0;

            if (Math.random() < greatChance) {
                resultLv += 1;
            }

            resultLv = Math.min(window.MERGE_MAX_LEVEL || 24, resultLv);

            setInventoryValue(first, 0);
            setInventoryValue(second, resultLv);

            checkHighestTier(resultLv);

            try {
                if (typeof playSfx === "function") playSfx("merge");
            } catch (e) {}

            cleanupInventory(false);

            if (shouldRender) renderInventory();

            if (typeof window.renderWarSummary === "function") {
                window.renderWarSummary();
            }

            if (typeof window.updateUI === "function") {
                window.updateUI();
            }

            if (shouldSave && typeof window.saveGame === "function") {
                window.saveGame();
            }

            return true;
        }
    }

    return false;
};

window.massMerge = function() {
    let count = 0;
    let safety = 1000;

    while (safety-- > 0) {
        const merged = window.autoMergeLowest(false, false);

        if (!merged) break;

        count++;
    }

    renderInventory();

    if (typeof window.renderWarSummary === "function") {
        window.renderWarSummary();
    }

    if (typeof window.updateUI === "function") {
        window.updateUI();
    }

    if (typeof window.saveGame === "function") {
        window.saveGame();
    }

    if (count <= 0) {
        alert("합성 가능한 치아가 없습니다.\nTop8 공격 슬롯은 일괄합성에서 제외됩니다.");
    }
};

// =========================
// 인벤토리 정렬
// =========================
window.sortInventory = function() {
    cleanupInventory(false);

    const maxSlots = getMaxSlotsSafe();
    const topCount = window.TOP_ATTACK_SLOT_COUNT || 8;

    // Top8 공격 슬롯은 유지
    const topItems = window.inventory.slice(0, topCount);

    const rest = [];

    for (let i = topCount; i < maxSlots; i++) {
        const lv = getInventoryValue(i);
        if (lv > 0) rest.push(lv);
    }

    rest.sort((a, b) => b - a);

    for (let i = 0; i < topCount; i++) {
        setInventoryValue(i, topItems[i] || 0);
    }

    for (let i = topCount; i < maxSlots; i++) {
        const next = rest.shift() || 0;
        setInventoryValue(i, next);
    }

    afterInventoryChanged(true);
};

// =========================
// 최고 티어 체크
// =========================
window.checkHighestTier = function(lv) {
    lv = Number(lv) || 0;

    if (lv <= 0) return;

    const before = Number(window.highestToothLevel) || 0;

    if (lv > before) {
        window.highestToothLevel = lv;

        if (typeof window.showTierUnlock === "function") {
            window.showTierUnlock(lv);
        }
    }

    if (lv >= 25) {
        window.isToothAwakened = true;
    }
};

// =========================
// 자동화 토글
// =========================
window.toggleAutoMine = function() {
    window.autoMineOn = !window.autoMineOn;

    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.saveGame === "function") window.saveGame();
};

window.toggleAutoMerge = function() {
    window.autoMergeOn = !window.autoMergeOn;

    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.saveGame === "function") window.saveGame();
};

// =========================
// 곡괭이 표시 갱신
// =========================
window.updatePickaxeVisual = function() {
    const pickaxeName = document.getElementById("pickaxe-name");

    if (!pickaxeName || typeof TOOTH_DATA === "undefined") return;

    const p = TOOTH_DATA.pickaxes[window.pickaxeIdx] || TOOTH_DATA.pickaxes[0];

    pickaxeName.innerText = `${p.icon} ${p.name}`;
};
