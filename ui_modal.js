// Version: 8.1.0 - Modals / Codex / Artifacts / Awakening / Ranking / Shop

// =========================
// 내부 상태
// =========================
window.lockedToothSlotIndex = null;

// =========================
// 공통 유틸
// =========================
function modalFmt(num) {
    if (typeof fNum === "function") return fNum(num);
    return Math.floor(Number(num) || 0).toString();
}

function openModalById(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = "flex";
}

function closeModalById(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = "none";
}

function ownedArtifactCountSafe() {
    if (typeof getOwnedArtifactCount === "function") {
        return getOwnedArtifactCount();
    }

    if (!Array.isArray(window.artifactCounts)) return 0;

    return window.artifactCounts.reduce((sum, v) => {
        return sum + (Number(v) > 0 ? 1 : 0);
    }, 0);
}

function normalizeArtifactsSafe() {
    if (typeof normalizeArtifactCounts === "function") {
        normalizeArtifactCounts();
        return;
    }

    if (!Array.isArray(window.artifactCounts)) {
        window.artifactCounts = new Array(40).fill(0);
    }

    for (let i = 0; i < window.artifactCounts.length; i++) {
        window.artifactCounts[i] = Number(window.artifactCounts[i]) > 0 ? 1 : 0;
    }
}

function refreshAfterModalChange() {
    if (typeof normalizeArtifactCounts === "function") normalizeArtifactCounts();
    if (typeof window.refreshHighestToothLevel === "function") window.refreshHighestToothLevel();
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderWarSummary === "function") window.renderWarSummary();
    if (typeof window.renderCurrentMercenary === "function") window.renderCurrentMercenary();
    if (typeof window.renderResearchContent === "function") window.renderResearchContent();
    if (typeof window.renderDungeonList === "function") window.renderDungeonList();
    if (typeof window.saveGame === "function") window.saveGame();
}

function modalPlaySfx(type) {
    try {
        if (typeof playSfx === "function") playSfx(type);
    } catch (e) {}
}

// =========================
// 설정
// =========================
window.openSettings = function() {
    const soundBtn = document.getElementById("sound-toggle-btn");
    const slider = document.getElementById("volume-slider");

    if (soundBtn) {
        soundBtn.innerText = window.soundEnabled ? "ON" : "OFF";
        soundBtn.style.background = window.soundEnabled ? "#22c55e" : "#475569";
        soundBtn.style.color = window.soundEnabled ? "#052e16" : "#fff";
    }

    if (slider) {
        slider.value = Math.floor((Number(window.masterVolume) || 0.7) * 100);
    }

    openModalById("settings-modal");
};

window.closeSettings = function() {
    closeModalById("settings-modal");
};

window.toggleSound = function() {
    window.soundEnabled = !window.soundEnabled;

    const btn = document.getElementById("sound-toggle-btn");
    if (btn) {
        btn.innerText = window.soundEnabled ? "ON" : "OFF";
        btn.style.background = window.soundEnabled ? "#22c55e" : "#475569";
        btn.style.color = window.soundEnabled ? "#052e16" : "#fff";
    }

    modalPlaySfx("buy");

    if (typeof window.saveGame === "function") window.saveGame();
};

window.changeVolume = function(value) {
    const v = Math.max(0, Math.min(100, Number(value) || 0));
    window.masterVolume = v / 100;

    if (typeof window.saveGame === "function") window.saveGame();
};

// =========================
// 도움말
// =========================
window.openGuide = function() {
    openModalById("guide-modal");
};

window.closeGuide = function() {
    closeModalById("guide-modal");
};

// =========================
// 치아 도감
// =========================
window.openCodex = function() {
    renderCodex();
    openModalById("codex-modal");
};

window.closeCodex = function() {
    closeModalById("codex-modal");
};

window.renderCodex = function() {
    const list = document.getElementById("codex-list");
    if (!list) return;

    const highest = Number(window.highestToothLevel) || 0;

    list.innerHTML = "";

    for (let lv = 1; lv <= 25; lv++) {
        const unlocked = highest >= lv;
        const card = document.createElement("div");
        card.className = `codex-card ${unlocked ? "" : "locked"}`;

        const name = typeof getToothName === "function" ? getToothName(lv) : `Lv.${lv} 치아`;
        const icon = typeof getToothIcon === "function" ? getToothIcon(lv) : "🦷";
        const atk = typeof getAtk === "function" ? getAtk(lv) : 0;
        const label = lv >= 25 ? "Lv.MAX" : `Lv.${lv}`;

        let desc = "";

        if (lv <= 12) {
            desc = "직접 채굴로 획득 가능한 구간입니다.";
        } else if (lv <= 23) {
            desc = "합성을 통해 성장하는 중후반 치아입니다.";
        } else if (lv === 24) {
            desc = "강하지만 아직 봉인된 왕관 치아입니다.";
        } else {
            desc = "봉인이 해제된 초월 왕관 치아입니다.";
        }

        card.innerHTML = `
            <div class="upgrade-icon">${unlocked ? icon : "❔"}</div>
            <div class="upgrade-info">
                <div class="upgrade-title">${unlocked ? name : "미발견 치아"}</div>
                <div class="upgrade-desc">${unlocked ? desc : "아직 발견하지 못했습니다."}</div>
                <div class="upgrade-cost">
                    ${label} · 공격력 ${unlocked ? modalFmt(atk) : "???"}
                </div>
            </div>
            <div style="font-size:12px;font-weight:900;color:${unlocked ? "#fde68a" : "rgba(255,255,255,.45)"};">
                ${unlocked ? "등록" : "잠김"}
            </div>
        `;

        list.appendChild(card);
    }
};

// =========================
// 유물 도감
// =========================
window.openArtifacts = function() {
    renderArtifacts();
    openModalById("artifact-modal");
};

window.closeArtifacts = function() {
    closeModalById("artifact-modal");
};

window.renderArtifacts = function() {
    const list = document.getElementById("artifact-list");
    if (!list || typeof TOOTH_DATA === "undefined" || !TOOTH_DATA.artifacts) return;

    normalizeArtifactsSafe();

    list.innerHTML = "";

    const owned = ownedArtifactCountSafe();

    const summary = document.createElement("div");
    summary.className = "research-panel";
    summary.innerHTML = `
        <div class="research-panel-title">🏺 유물 수집 현황</div>
        <div class="research-panel-desc">
            동일 유물은 최대 1개만 보유합니다. 이미 가진 유물이 다시 나오면 중복 보상으로 전환됩니다.
        </div>
        <div class="war-stat-grid">
            <div class="war-stat">
                보유 유물
                <b>${owned} / ${TOOTH_DATA.artifacts.length}</b>
            </div>
            <div class="war-stat">
                보스 징표
                <b>${modalFmt(window.bossMarks || 0)}</b>
            </div>
        </div>
    `;
    list.appendChild(summary);

    TOOTH_DATA.artifacts.forEach((art, idx) => {
        const have = Number(window.artifactCounts[idx]) > 0;
        const isHell = idx >= 20;

        const card = document.createElement("div");
        card.className = `artifact-card ${have ? "complete" : "locked"}`;

        card.innerHTML = `
            <div class="upgrade-icon">${have ? art.icon : "❔"}</div>
            <div class="upgrade-info">
                <div class="upgrade-title">
                    ${have ? art.name : isHell ? "미발견 HELL 유물" : "미발견 유물"}
                </div>
                <div class="upgrade-desc">
                    ${have ? art.desc : isHell ? "HELL 던전에서 발견할 수 있습니다." : "일반 던전에서 발견할 수 있습니다."}
                </div>
                <div class="upgrade-cost">
                    ${isHell ? "HELL 유물" : "일반 유물"} · ${have ? "보유 1/1" : "미보유 0/1"}
                </div>
            </div>
            <div style="font-size:12px;font-weight:900;color:${have ? "#fde68a" : "rgba(255,255,255,.45)"};">
                ${have ? "완료" : "잠김"}
            </div>
        `;

        list.appendChild(card);
    });
};

// =========================
// Lv.24 봉인 치아 / Lv.MAX 해방
// =========================
window.openLockedToothModal = function(slotIndex) {
    slotIndex = Number(slotIndex);

    if (!Number.isFinite(slotIndex)) return;

    const lv = Array.isArray(window.inventory) ? Number(window.inventory[slotIndex]) || 0 : 0;

    if (lv < 24) {
        alert("Lv.24 봉인된 왕관 치아만 해방할 수 있습니다.");
        return;
    }

    if (lv >= 25) {
        alert("이미 Lv.MAX 치아입니다.");
        return;
    }

    window.lockedToothSlotIndex = slotIndex;

    renderLockedToothInfo();

    openModalById("locked-tooth-modal");
};

window.closeLockedToothModal = function() {
    window.lockedToothSlotIndex = null;
    closeModalById("locked-tooth-modal");
};

window.renderLockedToothInfo = function() {
    const info = document.getElementById("locked-tooth-info");
    const reqBox = document.getElementById("locked-tooth-req");

    if (!info || !reqBox) return;

    const req = TOOTH_DATA.AWAKEN_REQ || {
        gold: 100000000,
        dia: 5000,
        bossMarks: 20,
        artifacts: 20
    };

    const artifactOwned = ownedArtifactCountSafe();

    const hasGold = (Number(window.gold) || 0) >= req.gold;
    const hasDia = (Number(window.dia) || 0) >= req.dia;
    const hasBossMarks = (Number(window.bossMarks) || 0) >= req.bossMarks;
    const hasArtifacts = artifactOwned >= req.artifacts;

    const slotIndex = Number(window.lockedToothSlotIndex);
    const currentLv = Array.isArray(window.inventory) ? Number(window.inventory[slotIndex]) || 0 : 0;

    info.innerHTML = `
        <div style="text-align:center;margin-bottom:12px;">
            <div style="font-size:54px;line-height:1;">
                ${typeof getToothIcon === "function" ? getToothIcon(24) : "👑"}
            </div>
            <div style="margin-top:8px;font-size:16px;font-weight:900;">
                봉인된 왕관 치아
            </div>
            <div style="margin-top:4px;font-size:13px;color:rgba(255,255,255,.72);line-height:1.45;">
                Lv.24는 강하지만 아직 봉인된 상태입니다.<br>
                해방하면 Lv.MAX 초월 왕관 치아가 되며 공격력이 폭발적으로 증가합니다.
            </div>
        </div>
        <div class="war-stat-grid">
            <div class="war-stat">
                현재 슬롯
                <b>${Number.isFinite(slotIndex) ? slotIndex + 1 : "-"}</b>
            </div>
            <div class="war-stat">
                현재 레벨
                <b>${currentLv >= 25 ? "MAX" : "Lv." + currentLv}</b>
            </div>
            <div class="war-stat">
                Lv.24 공격력
                <b>${modalFmt(typeof getAtk === "function" ? getAtk(24) : 0)}</b>
            </div>
            <div class="war-stat">
                Lv.MAX 공격력
                <b>${modalFmt(typeof getAtk === "function" ? getAtk(25) : 0)}</b>
            </div>
        </div>
    `;

    reqBox.innerHTML = `
        <div class="research-panel" style="margin-top:12px;">
            <div class="research-panel-title">해방 조건</div>
            <div class="result-reward-line">
                ${hasGold ? "✅" : "❌"} 골드 ${modalFmt(window.gold || 0)} / ${modalFmt(req.gold)}
            </div>
            <div class="result-reward-line">
                ${hasDia ? "✅" : "❌"} 다이아 ${modalFmt(window.dia || 0)} / ${modalFmt(req.dia)}
            </div>
            <div class="result-reward-line">
                ${hasBossMarks ? "✅" : "❌"} 보스 징표 ${modalFmt(window.bossMarks || 0)} / ${modalFmt(req.bossMarks)}
            </div>
            <div class="result-reward-line">
                ${hasArtifacts ? "✅" : "❌"} 유물 수집 ${artifactOwned} / ${req.artifacts}
            </div>
        </div>
    `;
};

window.attemptUnlockTooth = function() {
    const slotIndex = Number(window.lockedToothSlotIndex);

    if (!Number.isFinite(slotIndex) || !Array.isArray(window.inventory)) {
        alert("해방할 치아를 찾을 수 없습니다.");
        return;
    }

    const lv = Number(window.inventory[slotIndex]) || 0;

    if (lv < 24) {
        alert("Lv.24 봉인된 왕관 치아만 해방할 수 있습니다.");
        return;
    }

    if (lv >= 25) {
        alert("이미 Lv.MAX 치아입니다.");
        return;
    }

    const req = TOOTH_DATA.AWAKEN_REQ || {
        gold: 100000000,
        dia: 5000,
        bossMarks: 20,
        artifacts: 20
    };

    const artifactOwned = ownedArtifactCountSafe();

    if ((Number(window.gold) || 0) < req.gold) {
        alert("골드가 부족합니다.");
        modalPlaySfx("error");
        return;
    }

    if ((Number(window.dia) || 0) < req.dia) {
        alert("다이아가 부족합니다.");
        modalPlaySfx("error");
        return;
    }

    if ((Number(window.bossMarks) || 0) < req.bossMarks) {
        alert("보스 징표가 부족합니다.");
        modalPlaySfx("error");
        return;
    }

    if (artifactOwned < req.artifacts) {
        alert("수집한 유물이 부족합니다.");
        modalPlaySfx("error");
        return;
    }

    const ok = confirm("봉인을 해제하여 Lv.MAX 초월 왕관 치아로 각성할까요?");

    if (!ok) return;

    window.gold -= req.gold;
    window.dia -= req.dia;
    window.bossMarks -= req.bossMarks;

    window.inventory[slotIndex] = 25;
    window.highestToothLevel = Math.max(Number(window.highestToothLevel) || 0, 25);
    window.isToothAwakened = true;

    modalPlaySfx("unlock");

    closeLockedToothModal();

    refreshAfterModalChange();

    if (typeof window.playAwakenVideo === "function") {
        window.playAwakenVideo(true);
    } else {
        alert("Lv.MAX 초월 왕관 치아가 각성했습니다!");
    }
};

// =========================
// 티어 발견 모달
// =========================
window.showTierUnlock = function(lv) {
    lv = Number(lv) || 0;

    if (lv <= 0) return;

    const modal = document.getElementById("tier-unlock-modal");
    const content = document.getElementById("tier-unlock-content");

    if (!modal || !content) return;

    const name = typeof getToothName === "function" ? getToothName(lv) : `Lv.${lv} 치아`;
    const icon = typeof getToothIcon === "function" ? getToothIcon(lv) : "🦷";
    const label = lv >= 25 ? "Lv.MAX" : `Lv.${lv}`;

    let message = "";

    if (lv <= 12) {
        message = "채굴 가능한 새로운 치아를 발견했습니다.";
    } else if (lv <= 23) {
        message = "합성을 통해 더 높은 단계의 치아를 만들었습니다.";
    } else if (lv === 24) {
        message = "봉인된 왕관 치아를 만들었습니다. 더블탭하면 봉인 해제를 시도할 수 있습니다.";
    } else {
        message = "초월 왕관 치아가 각성했습니다.";
    }

    content.innerHTML = `
        <div style="text-align:center;">
            <div style="font-size:54px;line-height:1;margin-bottom:10px;">
                ${icon}
            </div>
            <div style="font-size:20px;font-weight:900;margin-bottom:6px;">
                ${label} 발견!
            </div>
            <div style="font-size:16px;font-weight:900;color:#fde68a;margin-bottom:8px;">
                ${name}
            </div>
            <div style="font-size:13px;line-height:1.45;color:rgba(255,255,255,.75);">
                ${message}
            </div>
        </div>
    `;

    modal.style.display = "flex";

    modalPlaySfx(lv >= 24 ? "unlock" : "great");
};

window.closeTierUnlock = function() {
    closeModalById("tier-unlock-modal");
};

// =========================
// 훈련 모달 호환
// 실제 훈련은 치아 연구소로 이동
// =========================
window.openTrainingCamp = function() {
    const list = document.getElementById("training-list");
    if (list) {
        list.innerHTML = `
            <div class="research-panel">
                <div class="research-panel-title">🏋️ 용병 훈련은 치아 연구소로 통합되었습니다</div>
                <div class="research-panel-desc">
                    하단의 <b>치아 연구소</b> 탭에서 <b>용병 훈련</b>을 선택하면 모든 훈련을 진행할 수 있습니다.
                </div>
                <button class="upgrade-btn" onclick="closeTrainingCamp(); switchView('refine'); switchResearchTab('training');">
                    치아 연구소로 이동
                </button>
            </div>
        `;
    }

    openModalById("training-modal");
};

window.closeTrainingCamp = function() {
    closeModalById("training-modal");
};

// =========================
// 랭킹
// =========================
window.openRanking = function() {
    renderRanking();
    openModalById("ranking-modal");
};

window.closeRanking = function() {
    closeModalById("ranking-modal");
};

window.renderRanking = function() {
    const list = document.getElementById("ranking-list");
    if (!list) return;

    const myPower = typeof getPlayerCombatPower === "function" ? getPlayerCombatPower() : 0;
    const myHighest = Number(window.highestToothLevel) || 0;

    const names = TOOTH_DATA.REAL_NICKNAMES || [
        "충치사냥꾼",
        "치아장인",
        "법랑질수호자",
        "왕관치아",
        "근관탐험가"
    ];

    const rows = [];

    rows.push({
        name: window.nickname || "Player",
        power: myPower,
        highest: myHighest,
        me: true
    });

    for (let i = 0; i < names.length; i++) {
        const base = Math.max(1000, myPower || 1000);
        const mul = 1.8 + i * 0.55;
        const fakePower = Math.floor(base * mul + Math.pow(i + 3, 5) * 1000);

        rows.push({
            name: names[i],
            power: fakePower,
            highest: Math.min(25, Math.max(5, myHighest + Math.floor(Math.random() * 5) - 1)),
            me: false
        });
    }

    rows.sort((a, b) => b.power - a.power);

    list.innerHTML = "";

    rows.slice(0, 10).forEach((row, idx) => {
        const card = document.createElement("div");
        card.className = "ranking-card";
        card.style.borderColor = row.me ? "rgba(250,204,21,.65)" : "rgba(255,255,255,.08)";
        card.style.background = row.me ? "rgba(250,204,21,.12)" : "rgba(255,255,255,.08)";

        const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`;

        card.innerHTML = `
            <div class="upgrade-icon">${medal}</div>
            <div class="upgrade-info">
                <div class="upgrade-title">${row.name}${row.me ? " 〈나〉" : ""}</div>
                <div class="upgrade-desc">
                    최고 치아 ${row.highest >= 25 ? "Lv.MAX" : "Lv." + row.highest}
                </div>
                <div class="upgrade-cost">
                    전투력 ${modalFmt(row.power)}
                </div>
            </div>
        `;

        list.appendChild(card);
    });
};

// =========================
// 상점
// =========================
window.openShop = function() {
    renderShop();
    openModalById("shop-modal");
};

window.closeShop = function() {
    closeModalById("shop-modal");
};

window.renderShop = function() {
    const list = document.getElementById("shop-list");
    if (!list || typeof TOOTH_DATA === "undefined") return;

    list.innerHTML = "";

    const currentSlots = typeof getMaxInventorySlots === "function"
        ? getMaxInventorySlots()
        : Number(window.inventorySlots) || 24;

    const nextExpansion = (TOOTH_DATA.invExpansion || []).find((item) => {
        return Number(item.slots) > currentSlots;
    });

    const summary = document.createElement("div");
    summary.className = "research-panel";
    summary.innerHTML = `
        <div class="research-panel-title">🛒 상점</div>
        <div class="research-panel-desc">
            주요 성장은 치아 연구소로 통합되었습니다. 상점에서는 편의 기능과 인벤토리 확장을 관리합니다.
        </div>
    `;
    list.appendChild(summary);

    const invCard = document.createElement("div");
    invCard.className = "shop-card";

    if (nextExpansion) {
        invCard.innerHTML = `
            <div class="shop-icon">🎒</div>
            <div class="shop-info">
                <div class="shop-title">인벤토리 확장</div>
                <div class="shop-desc">현재 ${currentSlots}칸 → ${nextExpansion.slots}칸</div>
                <div class="shop-cost">비용: ${modalFmt(nextExpansion.cost)} 골드</div>
            </div>
            <button class="shop-btn" onclick="buyInventoryExpansionFromShop(${nextExpansion.slots}, ${nextExpansion.cost})">
                구매
            </button>
        `;
    } else {
        invCard.innerHTML = `
            <div class="shop-icon">🎒</div>
            <div class="shop-info">
                <div class="shop-title">인벤토리 확장</div>
                <div class="shop-desc">이미 최대 인벤토리입니다.</div>
                <div class="shop-cost">현재 ${currentSlots}칸</div>
            </div>
            <button class="shop-btn disabled" disabled>최대</button>
        `;
    }

    list.appendChild(invCard);

    const labCard = document.createElement("div");
    labCard.className = "shop-card";
    labCard.innerHTML = `
        <div class="shop-icon">🧪</div>
        <div class="shop-info">
            <div class="shop-title">치아 연구소</div>
            <div class="shop-desc">곡괭이, 자동화, 합성, Top8 제련, 용병 훈련은 치아 연구소에서 진행합니다.</div>
            <div class="shop-cost">하단 탭에서 이동 가능</div>
        </div>
        <button class="shop-btn" onclick="closeShop(); switchView('refine');">
            이동
        </button>
    `;

    list.appendChild(labCard);
};

window.buyInventoryExpansionFromShop = function(slots, cost) {
    slots = Number(slots) || 0;
    cost = Number(cost) || 0;

    if (slots <= 0) return;

    if ((Number(window.inventorySlots) || 24) >= slots) {
        alert("이미 확장된 인벤토리입니다.");
        renderShop();
        return;
    }

    if ((Number(window.gold) || 0) < cost) {
        alert("골드가 부족합니다.");
        modalPlaySfx("error");
        return;
    }

    window.gold -= cost;
    window.inventorySlots = Math.min(window.INVENTORY_SIZE || 56, slots);

    modalPlaySfx("buy");

    refreshAfterModalChange();
    renderShop();
};

// =========================
// 모달 외부 닫기 보조
// =========================
window.closeAllModals = function() {
    document.querySelectorAll(".modal-layer").forEach((modal) => {
        modal.style.display = "none";
    });

    window.lockedToothSlotIndex = null;
};

// ESC 닫기
window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeAllModals();
    }
});
