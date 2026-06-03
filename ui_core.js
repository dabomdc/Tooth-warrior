// Version: 8.1.0 - Core UI / View / Dungeon / Result / Mercenary

// =========================
// 내부 상태
// =========================
let __lastDungeonResult = null;
let __pendingHellUnlock = false;

// =========================
// 유틸
// =========================
function coreFmt(num) {
    if (typeof fNum === "function") return fNum(num);
    return Math.floor(Number(num) || 0).toString();
}

function showCoreAlert(msg) {
    alert(msg);
}

function getMercenarySafe(idx) {
    if (typeof TOOTH_DATA === "undefined" || !TOOTH_DATA.mercenaries) {
        return {
            name: "초보 치아 수호자",
            icon: "🧑‍🚀",
            cost: 0,
            baseHp: 100,
            atkMul: 1,
            spd: 1,
            desc: "기본 용병"
        };
    }

    return TOOTH_DATA.mercenaries[idx] || TOOTH_DATA.mercenaries[0];
}

function getDungeonName(mode, stage) {
    stage = Math.max(1, Number(stage) || 1);
    const idx = stage - 1;

    if (mode === "hell" || mode === "hellboss") {
        return TOOTH_DATA.hellDungeons[idx] || `HELL 던전 ${stage}`;
    }

    return TOOTH_DATA.dungeons[idx] || `던전 ${stage}`;
}

function getDungeonIcon(mode, stage) {
    if (mode === "hell" || mode === "hellboss") return "🔥";
    if (mode === "boss") return "👹";
    return "⚔️";
}

function getRecommendedAtk(mode, stage) {
    stage = Math.max(1, Number(stage) || 1);

    if (mode === "hell" || mode === "hellboss") {
        return Math.floor(50000 * Math.pow(2.15, stage - 1));
    }

    if (mode === "boss") {
        return Math.floor(2500 * Math.pow(1.75, stage - 1));
    }

    return Math.floor(600 * Math.pow(1.55, stage - 1));
}

function isHellUnlocked() {
    return Number(window.unlockedHellDungeon) > 0;
}

function getUnlockedForMode(mode) {
    if (mode === "hell" || mode === "hellboss") {
        return Math.max(0, Number(window.unlockedHellDungeon) || 0);
    }

    return Math.max(1, Math.min(20, Number(window.unlockedDungeon) || 1));
}

function isBossMode(mode) {
    return mode === "boss" || mode === "hellboss";
}

function getModeLabel(mode) {
    if (mode === "hell") return "HELL";
    if (mode === "boss") return "보스 토벌";
    if (mode === "hellboss") return "HELL 보스";
    return "일반";
}

// =========================
// 화면 전환
// =========================
window.switchView = function(viewName, skipSave = false) {
    const allowed = ["mine", "refine", "war"];
    const nextView = allowed.includes(viewName) ? viewName : "mine";

    window.currentView = nextView;

    document.querySelectorAll(".main-view").forEach((view) => {
        view.classList.remove("active-view");
    });

    const target = document.getElementById(`${nextView}-view`);
    if (target) target.classList.add("active-view");

    document.querySelectorAll(".bottom-tab").forEach((btn) => {
        btn.classList.remove("active");
    });

    const nav = document.getElementById(`nav-${nextView}`);
    if (nav) nav.classList.add("active");

    if (nextView === "mine") {
        if (typeof window.renderInventory === "function") window.renderInventory();
    }

    if (nextView === "refine") {
        if (typeof window.renderResearchContent === "function") {
            window.renderResearchContent();
        }
    }

    if (nextView === "war") {
        if (typeof window.renderCurrentMercenary === "function") window.renderCurrentMercenary();
        if (typeof window.renderWarSummary === "function") window.renderWarSummary();
        if (typeof window.renderDungeonList === "function") window.renderDungeonList();
    }

    if (typeof window.updateUI === "function") window.updateUI();

    if (!skipSave && typeof window.saveGame === "function") {
        window.saveGame();
    }
};

// =========================
// 던전 탭 전환
// =========================
window.switchDungeonTab = function(tabName) {
    const allowed = ["normal", "boss", "hell", "hellboss"];
    let next = allowed.includes(tabName) ? tabName : "normal";

    if ((next === "hell" || next === "hellboss") && !isHellUnlocked()) {
        next = "normal";
        showCoreAlert("HELL 모드는 아직 열리지 않았습니다.\n일반 마지막 던전을 클리어하면 개방됩니다.");
    }

    window.currentDungeonTab = next;

    document.querySelectorAll(".dungeon-tab").forEach((btn) => {
        btn.classList.remove("active");
    });

    const btn = document.getElementById(`d-tab-${next}`);
    if (btn) btn.classList.add("active");

    const hellBtn = document.getElementById("d-tab-hell");
    const hellBossBtn = document.getElementById("d-tab-hellboss");

    if (hellBtn) {
        hellBtn.style.opacity = isHellUnlocked() ? "1" : "0.45";
    }

    if (hellBossBtn) {
        hellBossBtn.style.opacity = isHellUnlocked() ? "1" : "0.45";
    }

    const bossInfo = document.getElementById("boss-rush-info");
    if (bossInfo) {
        if (next === "boss") {
            bossInfo.innerHTML = "👹 보스 토벌에서는 보스 징표를 획득할 수 있습니다.";
            bossInfo.style.display = "block";
        } else if (next === "hellboss") {
            bossInfo.innerHTML = "🔥 HELL 보스 토벌에서는 더 많은 보스 징표와 보상을 획득합니다.";
            bossInfo.style.display = "block";
        } else {
            bossInfo.innerHTML = "";
            bossInfo.style.display = "none";
        }
    }

    renderDungeonList();

    if (typeof window.saveGame === "function") window.saveGame();
};

// =========================
// 현재 용병 표시
// =========================
window.renderCurrentMercenary = function() {
    const box = document.getElementById("current-mercenary-display");
    if (!box) return;

    const merc = getMercenarySafe(window.mercenaryIdx || 0);
    const t = window.trainingLevels || {};

    const hpLevel = Number(t.hp) || 0;
    const atkLevel = Number(t.atk) || 0;
    const spdLevel = Number(t.spd) || 0;
    const critLevel = Number(t.crit) || 0;
    const splashDmgLevel = Number(t.splashDmg) || 0;
    const splashRangeLevel = Number(t.splashRange) || 0;

    const hpBonus = hpLevel * 10;
    const atkBonus = atkLevel * 10;
    const spdBonus = spdLevel * 3;
    const critChance = Math.min(45, critLevel * 1.5);
    const splashDmg = 25 + splashDmgLevel * 2.5;
    const splashRange = 55 + splashRangeLevel * 3;

    const finalHp = Math.floor((merc.baseHp || 100) * (1 + hpBonus / 100));
    const finalAtkMul = (merc.atkMul || 1) * (1 + atkBonus / 100);
    const finalSpd = (merc.spd || 1) * (1 + spdBonus / 100);

    box.innerHTML = `
        <div class="mercenary-display-card">
            <div class="mercenary-big-icon">${merc.icon}</div>
            <div style="flex:1;min-width:0;">
                <div style="font-size:17px;font-weight:900;">${merc.name}</div>
                <div style="font-size:12px;color:rgba(255,255,255,.68);margin-top:2px;">
                    ${merc.desc || ""}
                </div>
            </div>
        </div>

        <div class="mercenary-stat-grid">
            <div class="mercenary-stat">
                체력
                <b>${coreFmt(finalHp)}</b>
            </div>
            <div class="mercenary-stat">
                공격 배율
                <b>x${finalAtkMul.toFixed(2)}</b>
            </div>
            <div class="mercenary-stat">
                이동속도
                <b>x${finalSpd.toFixed(2)}</b>
            </div>
            <div class="mercenary-stat">
                치명타 확률
                <b>${critChance.toFixed(1)}%</b>
            </div>
            <div class="mercenary-stat">
                광역 피해
                <b>${splashDmg.toFixed(1)}%</b>
            </div>
            <div class="mercenary-stat">
                광역 범위
                <b>${Math.floor(splashRange)}px</b>
            </div>
        </div>
    `;
};

// 호환용 별칭
window.renderMercenaryCamp = window.renderCurrentMercenary;

// =========================
// 전투 요약
// =========================
window.renderWarSummary = function() {
    const box = document.getElementById("war-summary-panel");
    if (!box) return;

    const totalAtk = typeof window.getTop8TotalAtk === "function" ? window.getTop8TotalAtk() : 0;
    const combatPower = typeof window.getPlayerCombatPower === "function" ? window.getPlayerCombatPower() : totalAtk;
    const artifactCount = typeof window.getOwnedArtifactCount === "function" ? window.getOwnedArtifactCount() : 0;
    const highest = Number(window.highestToothLevel) || 0;

    box.innerHTML = `
        <div class="war-summary-card">
            <div class="mercenary-big-icon">🦷</div>
            <div style="flex:1;min-width:0;">
                <div style="font-size:16px;font-weight:900;">Top8 전투 요약</div>
                <div style="font-size:12px;color:rgba(255,255,255,.68);">
                    상단 8칸의 치아가 순서대로 릴레이 발사됩니다.
                </div>
            </div>
        </div>

        <div class="war-stat-grid">
            <div class="war-stat">
                Top8 치아 공격력
                <b>${coreFmt(totalAtk)}</b>
            </div>
            <div class="war-stat">
                최종 전투력
                <b>${coreFmt(combatPower)}</b>
            </div>
            <div class="war-stat">
                최고 치아
                <b>${highest >= 25 ? "Lv.MAX" : "Lv." + highest}</b>
            </div>
            <div class="war-stat">
                보스 징표
                <b>${coreFmt(window.bossMarks || 0)}</b>
            </div>
            <div class="war-stat">
                유물 수집
                <b>${artifactCount} / 40</b>
            </div>
            <div class="war-stat">
                HELL 상태
                <b>${isHellUnlocked() ? "개방" : "잠김"}</b>
            </div>
        </div>
    `;
};

// =========================
// 용병 모달
// =========================
window.openMercenaryModal = function() {
    const modal = document.getElementById("mercenary-modal");
    const list = document.getElementById("mercenary-list");
    if (!modal || !list || typeof TOOTH_DATA === "undefined") return;

    if (!Array.isArray(window.unlockedMercenaries)) {
        window.unlockedMercenaries = [true];
    }

    while (window.unlockedMercenaries.length < TOOTH_DATA.mercenaries.length) {
        window.unlockedMercenaries.push(false);
    }

    list.innerHTML = "";

    TOOTH_DATA.mercenaries.forEach((merc, idx) => {
        const owned = !!window.unlockedMercenaries[idx];
        const selected = Number(window.mercenaryIdx) === idx;

        const card = document.createElement("div");
        card.className = `mercenary-card ${selected ? "selected" : ""}`;

        let buttonHtml = "";

        if (selected) {
            buttonHtml = `<button class="upgrade-btn disabled" disabled>장착중</button>`;
        } else if (owned) {
            buttonHtml = `<button class="upgrade-btn" onclick="equipMercenary(${idx})">장착</button>`;
        } else {
            buttonHtml = `<button class="upgrade-btn" onclick="buyMercenary(${idx})">${coreFmt(merc.cost)}G</button>`;
        }

        card.innerHTML = `
            <div class="upgrade-icon">${merc.icon}</div>
            <div class="upgrade-info">
                <div class="upgrade-title">${merc.name}</div>
                <div class="upgrade-desc">${merc.desc || ""}</div>
                <div class="upgrade-cost">
                    HP ${coreFmt(merc.baseHp)} · 공격 x${Number(merc.atkMul || 1).toFixed(2)} · 속도 x${Number(merc.spd || 1).toFixed(2)}
                </div>
            </div>
            ${buttonHtml}
        `;

        list.appendChild(card);
    });

    modal.style.display = "flex";
};

window.closeMercenaryModal = function() {
    const modal = document.getElementById("mercenary-modal");
    if (modal) modal.style.display = "none";
};

window.buyMercenary = function(idx) {
    idx = Number(idx) || 0;

    if (typeof TOOTH_DATA === "undefined" || !TOOTH_DATA.mercenaries[idx]) return;

    const merc = TOOTH_DATA.mercenaries[idx];

    if (!Array.isArray(window.unlockedMercenaries)) {
        window.unlockedMercenaries = [true];
    }

    while (window.unlockedMercenaries.length < TOOTH_DATA.mercenaries.length) {
        window.unlockedMercenaries.push(false);
    }

    if (window.unlockedMercenaries[idx]) {
        equipMercenary(idx);
        return;
    }

    if ((Number(window.gold) || 0) < Number(merc.cost || 0)) {
        showCoreAlert("골드가 부족합니다.");
        try {
            if (typeof playSfx === "function") playSfx("error");
        } catch (e) {}
        return;
    }

    window.gold -= Number(merc.cost) || 0;
    window.unlockedMercenaries[idx] = true;
    window.mercenaryIdx = idx;

    try {
        if (typeof playSfx === "function") playSfx("buy");
    } catch (e) {}

    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderCurrentMercenary === "function") window.renderCurrentMercenary();
    if (typeof window.renderWarSummary === "function") window.renderWarSummary();
    if (typeof window.renderResearchContent === "function") window.renderResearchContent();
    if (typeof window.saveGame === "function") window.saveGame();

    openMercenaryModal();
};

window.equipMercenary = function(idx) {
    idx = Number(idx) || 0;

    if (!Array.isArray(window.unlockedMercenaries) || !window.unlockedMercenaries[idx]) {
        return;
    }

    window.mercenaryIdx = idx;

    if (typeof window.renderCurrentMercenary === "function") window.renderCurrentMercenary();
    if (typeof window.renderWarSummary === "function") window.renderWarSummary();
    if (typeof window.renderResearchContent === "function") window.renderResearchContent();
    if (typeof window.saveGame === "function") window.saveGame();

    openMercenaryModal();
};

// =========================
// 던전 목록
// =========================
window.renderDungeonList = function() {
    const list = document.getElementById("dungeon-list");
    if (!list || typeof TOOTH_DATA === "undefined") return;

    const mode = window.currentDungeonTab || "normal";
    const hell = mode === "hell" || mode === "hellboss";
    const boss = isBossMode(mode);

    list.innerHTML = "";

    if (hell && !isHellUnlocked()) {
        list.innerHTML = `
            <div class="dungeon-card locked">
                <div class="dungeon-icon">🔒</div>
                <div class="dungeon-info">
                    <div class="dungeon-title">HELL 잠김</div>
                    <div class="dungeon-desc">일반 마지막 던전을 클리어하면 HELL 모드가 개방됩니다.</div>
                </div>
            </div>
        `;
        return;
    }

    const unlocked = getUnlockedForMode(mode);
    const total = 20;

    for (let stage = 1; stage <= total; stage++) {
        const open = stage <= unlocked;
        const name = getDungeonName(mode, stage);
        const icon = getDungeonIcon(mode, stage);
        const recAtk = getRecommendedAtk(mode, stage);
        const card = document.createElement("div");

        card.className = `dungeon-card dungeon-item ${open ? "" : "locked"}`;

        let rewardText = "";

        if (mode === "normal") {
            rewardText = `골드 ${coreFmt(300 * stage * stage)} · 유물 확률`;
        } else if (mode === "boss") {
            rewardText = `보스 징표 +1 · 골드 ${coreFmt(1200 * stage * stage)}`;
        } else if (mode === "hell") {
            rewardText = `다이아 · HELL 유물 확률`;
        } else {
            rewardText = `보스 징표 +2 · HELL 보상`;
        }

        card.innerHTML = open
            ? `
                <div class="dungeon-icon">${icon}</div>
                <div class="dungeon-info">
                    <div class="dungeon-title">${stage}. ${boss ? "보스 " : ""}${name}</div>
                    <div class="dungeon-desc">
                        권장 전투력 ${coreFmt(recAtk)} · ${rewardText}
                    </div>
                </div>
                <button class="dungeon-enter-btn">입장</button>
            `
            : `
                <div class="dungeon-icon">🔒</div>
                <div class="dungeon-info">
                    <div class="dungeon-title">잠김</div>
                    <div class="dungeon-desc">이전 던전을 클리어하면 열립니다.</div>
                </div>
            `;

        if (open) {
            card.addEventListener("click", () => {
                if (typeof window.startDungeon === "function") {
                    window.startDungeon(stage, mode);
                } else {
                    showCoreAlert("전투 모듈이 아직 로드되지 않았습니다.");
                }
            });
        }

        list.appendChild(card);
    }
};

// =========================
// 던전 결과 모달
// =========================
window.showResultModal = function(result = {}) {
    const modal = document.getElementById("dungeon-result-modal");
    const content = document.getElementById("dungeon-result-content");

    if (!modal || !content) return;

    const success = result.success !== false;
    const mode = result.mode || result.type || (window.currentDungeonRun && window.currentDungeonRun.mode) || "normal";
    const stage = Number(result.stage || (window.currentDungeonRun && window.currentDungeonRun.stage) || 1);
    const isHell = mode === "hell" || mode === "hellboss";
    const isBoss = isBossMode(mode);

    __lastDungeonResult = {
        success,
        mode,
        stage
    };

    __pendingHellUnlock = false;

    let title = success ? "✅ 원정 성공" : "❌ 원정 실패";
    let lines = [];

    if (success) {
        const goldReward = Number(result.gold || 0);
        const diaReward = Number(result.dia || 0);
        const bossMarkReward = Number(result.bossMarks || 0);

        if (goldReward > 0) lines.push(`💰 골드 +${coreFmt(goldReward)}`);
        if (diaReward > 0) lines.push(`♦️ 다이아 +${coreFmt(diaReward)}`);
        if (bossMarkReward > 0) lines.push(`🎖️ 보스 징표 +${coreFmt(bossMarkReward)}`);

        if (result.artifact) {
            if (result.artifact.isDuplicate) {
                const rewardDia = Number(result.artifact.rewardDia) || 0;
                const rewardBossMarks = Number(result.artifact.rewardBossMarks) || 0;

                lines.push(`🔁 중복 유물: ${result.artifact.name}`);
                if (rewardDia > 0) lines.push(`♦️ 중복 보상 다이아 +${coreFmt(rewardDia)}`);
                if (rewardBossMarks > 0) lines.push(`🎖️ 중복 보상 보스 징표 +${coreFmt(rewardBossMarks)}`);
            } else {
                lines.push(`🏺 신규 유물 발견: ${result.artifact.name}`);
                lines.push(`유물도감에 등록되었습니다.`);
            }
        }

        // 일반 마지막 던전 클리어 시 HELL 오픈 예약
        if (mode === "normal" && stage >= 20 && !isHellUnlocked()) {
            __pendingHellUnlock = true;
            lines.push(`🔥 HELL 모드의 문이 열리려 합니다.`);
        }

        // 다음 던전 오픈
        if (mode === "normal") {
            if (stage >= Number(window.unlockedDungeon || 1) && stage < 20) {
                window.unlockedDungeon = stage + 1;
            }
        } else if (mode === "hell") {
            if (stage >= Number(window.unlockedHellDungeon || 0) && stage < 20) {
                window.unlockedHellDungeon = stage + 1;
            }
        }
    } else {
        lines.push("용병이 쓰러졌습니다.");
        lines.push("치아 연구소에서 전투력을 올린 뒤 다시 도전하세요.");
    }

    if (lines.length === 0) {
        lines.push(success ? "보상을 획득했습니다." : "다시 도전하세요.");
    }

    content.innerHTML = `
        <div style="text-align:center;font-size:18px;font-weight:900;margin-bottom:10px;">
            ${title}
        </div>
        <div style="text-align:center;color:rgba(255,255,255,.72);font-size:13px;margin-bottom:12px;">
            ${getModeLabel(mode)} ${stage}단계
        </div>
        ${lines.map((line) => `<div class="result-reward-line">${line}</div>`).join("")}
    `;

    modal.style.display = "flex";

    if (typeof window.renderDungeonList === "function") window.renderDungeonList();
    if (typeof window.renderWarSummary === "function") window.renderWarSummary();
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.saveGame === "function") window.saveGame();
};

window.closeResultModal = function() {
    const modal = document.getElementById("dungeon-result-modal");
    if (modal) modal.style.display = "none";

    if (__pendingHellUnlock) {
        __pendingHellUnlock = false;

        if (typeof window.unlockHellMode === "function") {
            window.unlockHellMode();
        }
    }
};

window.retryDungeon = function() {
    const last = __lastDungeonResult;

    closeResultModal();

    if (!last) return;

    if (typeof window.startDungeon === "function") {
        window.startDungeon(last.stage, last.mode);
    }
};

window.nextDungeon = function() {
    const last = __lastDungeonResult;

    closeResultModal();

    if (!last) return;

    if (!last.success) {
        if (typeof window.startDungeon === "function") {
            window.startDungeon(last.stage, last.mode);
        }
        return;
    }

    let nextStage = last.stage + 1;
    let nextMode = last.mode;

    if (last.mode === "normal" && last.stage >= 20) {
        nextMode = "hell";
        nextStage = 1;
    }

    if (last.mode === "hell" && last.stage >= 20) {
        nextStage = 20;
    }

    if (nextMode === "hell" && !isHellUnlocked()) {
        return;
    }

    if (typeof window.startDungeon === "function") {
        window.startDungeon(nextStage, nextMode);
    }
};

// =========================
// 전투 화면 닫기 호환
// =========================
window.closeBattleScreen = function() {
    const battle = document.getElementById("battle-screen");
    if (battle) battle.style.display = "none";

    const game = document.getElementById("game-container");
    if (game) game.style.display = "flex";

    window.dungeonActive = false;
    window.dungeonPaused = false;

    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderCurrentMercenary === "function") window.renderCurrentMercenary();
    if (typeof window.renderWarSummary === "function") window.renderWarSummary();
    if (typeof window.renderDungeonList === "function") window.renderDungeonList();
    if (typeof window.updateUI === "function") window.updateUI();
};

// =========================
// 간단 토스트
// =========================
window.showToast = function(message, type = "info", duration = 1600) {
    let root = document.getElementById("toast-root");

    if (!root) {
        root = document.createElement("div");
        root.id = "toast-root";
        root.style.position = "fixed";
        root.style.left = "50%";
        root.style.bottom = "90px";
        root.style.transform = "translateX(-50%)";
        root.style.zIndex = "99999";
        root.style.pointerEvents = "none";
        document.body.appendChild(root);
    }

    const toast = document.createElement("div");
    toast.innerText = message;
    toast.style.marginTop = "6px";
    toast.style.padding = "10px 14px";
    toast.style.borderRadius = "999px";
    toast.style.fontWeight = "900";
    toast.style.fontSize = "13px";
    toast.style.boxShadow = "0 8px 24px rgba(0,0,0,.45)";
    toast.style.background = type === "danger" ? "#ef4444" : type === "success" ? "#22c55e" : "#334155";
    toast.style.color = "#fff";
    toast.style.textAlign = "center";

    root.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, duration);
};

// =========================
// 초기 렌더 호환
// =========================
window.addEventListener("load", () => {
    setTimeout(() => {
        if (typeof window.renderCurrentMercenary === "function") window.renderCurrentMercenary();
        if (typeof window.renderWarSummary === "function") window.renderWarSummary();
        if (typeof window.renderDungeonList === "function") window.renderDungeonList();
    }, 100);
});
