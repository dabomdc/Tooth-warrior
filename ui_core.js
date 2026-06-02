// Version: 8.0.0 - UI Core / View / Mercenary / Dungeon / Result

window.currentView = window.currentView || "mine";
window.currentDungeonTab = window.currentDungeonTab || "normal";

// =========================
// 안전 유틸
// =========================
function uiNum(value) {
    if (typeof fNum === "function") return fNum(value);
    return Math.floor(Number(value) || 0);
}

function uiGetAtk(lv) {
    if (typeof getAtk === "function") return getAtk(lv);
    return 0;
}

function uiGetBaseAtk(lv) {
    if (typeof getBaseAtk === "function") return getBaseAtk(lv);
    return uiGetAtk(lv);
}

function uiGetIcon(lv) {
    if (typeof getToothIcon === "function") return getToothIcon(lv);
    return "🦷";
}

function uiGetName(lv) {
    if (typeof getToothName === "function") return getToothName(lv);
    return lv >= 25 ? "Lv.MAX 초월 왕관 치아" : `Lv.${lv}`;
}

function uiLvLabel(lv) {
    if (lv >= 25) return "Lv.MAX";
    return `Lv.${lv}`;
}

function getEl(id) {
    return document.getElementById(id);
}

// =========================
// 1. 메인 뷰 전환
// =========================
window.switchView = function(viewName) {
    window.currentView = viewName;

    const mineView = getEl("mine-view");
    const inventorySection = getEl("inventory-section");
    const refineView = getEl("refine-view");
    const warView = getEl("war-view");

    if (mineView) mineView.style.display = "none";
    if (inventorySection) inventorySection.style.display = "none";
    if (refineView) refineView.style.display = "none";
    if (warView) warView.style.display = "none";

    const tabMine = getEl("tab-mine");
    const tabRefine = getEl("tab-refine");
    const tabWar = getEl("tab-war");

    if (tabMine) tabMine.classList.remove("active");
    if (tabRefine) tabRefine.classList.remove("active");
    if (tabWar) tabWar.classList.remove("active");

    if (viewName === "mine") {
        if (mineView) mineView.style.display = "flex";
        if (inventorySection) inventorySection.style.display = "flex";
        if (tabMine) tabMine.classList.add("active");

        if (typeof window.renderInventory === "function") {
            window.renderInventory();
        }
    }

    if (viewName === "refine") {
        if (refineView) refineView.style.display = "flex";
        if (tabRefine) tabRefine.classList.add("active");

        if (typeof window.renderRefineView === "function") {
            window.renderRefineView();
        }
    }

    if (viewName === "war") {
        if (warView) warView.style.display = "flex";
        if (tabWar) tabWar.classList.add("active");

        const hellTab = getEl("d-tab-hell");
        const hellBossTab = getEl("d-tab-hellboss");

        if (window.unlockedDungeon > 20) {
            if (hellTab) hellTab.style.display = "inline-block";
            if (hellBossTab) hellBossTab.style.display = "inline-block";
        } else {
            if (hellTab) hellTab.style.display = "none";
            if (hellBossTab) hellBossTab.style.display = "none";

            if (window.currentDungeonTab === "hell" || window.currentDungeonTab === "hellboss") {
                window.currentDungeonTab = "normal";
            }
        }

        if (typeof window.renderMercenaryCamp === "function") {
            window.renderMercenaryCamp();
        }

        if (typeof window.switchDungeonTab === "function") {
            window.switchDungeonTab(window.currentDungeonTab || "normal");
        }
    }

    try {
        if (typeof playSfx === "function") playSfx("hit");
    } catch (e) {}
};

window.switchDungeonTab = function(tabName) {
    window.currentDungeonTab = tabName;

    document.querySelectorAll(".war-tab-btn").forEach((btn) => {
        btn.classList.remove("active");
    });

    const activeTab = getEl("d-tab-" + tabName);
    if (activeTab) activeTab.classList.add("active");

    const bossInfo = getEl("boss-rush-info");

    if (bossInfo) {
        bossInfo.style.display = (tabName === "boss" || tabName === "hellboss") ? "block" : "none";
    }

    if (typeof window.renderDungeonList === "function") {
        window.renderDungeonList();
    }
};

// =========================
// 2. 자동 버튼 시각화
// =========================
window.updateToggleButtons = function() {
    const mineBtn = getEl("auto-mine-btn");
    const mineDial = getEl("mine-dial");

    if (mineBtn) {
        mineBtn.innerText = window.isAutoMineOn ? "자동 ON" : "자동 OFF";

        if (window.isAutoMineOn) {
            mineBtn.classList.remove("off");
            if (mineDial) mineDial.classList.remove("dial-off");
        } else {
            mineBtn.classList.add("off");
            if (mineDial) mineDial.classList.add("dial-off");
        }
    }

    const mergeBtn = getEl("auto-merge-btn");
    const mergeDial = getEl("merge-dial");

    if (mergeBtn) {
        mergeBtn.innerText = window.isAutoMergeOn ? "자동 ON" : "자동 OFF";

        if (window.isAutoMergeOn) {
            mergeBtn.classList.remove("off");
            if (mergeDial) mergeDial.classList.remove("dial-off");
        } else {
            mergeBtn.classList.add("off");
            if (mergeDial) mergeDial.classList.add("dial-off");
        }
    }
};

// =========================
// 3. 용병 캠프
// =========================
window.renderMercenaryCamp = function() {
    const display = getEl("current-mercenary-display");

    if (!display || typeof TOOTH_DATA === "undefined") return;

    const curId = Number(window.mercenaryIdx) || 0;
    const merc = TOOTH_DATA.mercenaries[curId] || TOOTH_DATA.mercenaries[0];

    if (!merc) return;

    let bonusText = "";

    if (window.highestToothLevel >= 16) {
        bonusText = `
            <div style="color:#2ecc71; font-size:10px; font-weight:bold; margin-top:3px;">
                ✨ 16치아 보너스: 공격력 x2 적용 중!
            </div>
        `;
    }

    const trainAtk = (window.trainingLevels && window.trainingLevels.atk ? window.trainingLevels.atk : 0) * 10;
    const trainHp = (window.trainingLevels && window.trainingLevels.hp ? window.trainingLevels.hp : 0) * 5;
    const trainSpd = (window.trainingLevels && window.trainingLevels.spd ? window.trainingLevels.spd : 0) * 10;

    const atkStr = trainAtk > 0 ? `<span style="color:#2ecc71; font-weight:bold;">(+${trainAtk}%)</span>` : "";
    const hpStr = trainHp > 0 ? `<span style="color:#2ecc71; font-weight:bold;">(+${trainHp}%)</span>` : "";
    const spdStr = trainSpd > 0 ? `<span style="color:#2ecc71; font-weight:bold;">(+${trainSpd}%)</span>` : "";

    const critLv = window.trainingLevels && window.trainingLevels.crit ? window.trainingLevels.crit : 0;
    const splashDmgLv = window.trainingLevels && window.trainingLevels.splashDmg ? window.trainingLevels.splashDmg : 0;
    const splashRangeLv = window.trainingLevels && window.trainingLevels.splashRange ? window.trainingLevels.splashRange : 0;

    const critChance = 5 + (critLv * 2);
    const critMul = 2.0 + (critLv * 0.2);
    const splashRatio = 20 + (splashDmgLv * 5);
    const splashRange = 50 + (splashRangeLv * 10);

    let advStatsHtml = "";

    if (window.highestToothLevel >= 7 || critLv > 0 || splashDmgLv > 0 || splashRangeLv > 0) {
        advStatsHtml = `
            <div style="font-size:10px; color:#f1c40f; margin-top:3px; font-weight:bold;">
                ⚡치명타: ${critChance}% (x${critMul.toFixed(1)}) | 💥광역: ${splashRatio}% (${splashRange}px)
            </div>
        `;
    }

    display.innerHTML = `
        <div style="font-size:40px; background:#1a1a2e; width:60px; height:60px; display:flex; align-items:center; justify-content:center; border:2px solid #555; box-shadow: 2px 2px 0 #000;">
            ${merc.icon}
        </div>
        <div style="flex:1;">
            <div style="font-size:16px; font-weight:bold; color:white;">
                ${merc.name}
                <span style="font-size:12px; color:#aaa; font-weight:normal;">(Lv.${curId})</span>
            </div>
            <div style="font-size:11px; color:#ccc; margin-top:2px;">
                공격 x<span style="color:var(--gold);">${merc.atkMul}</span> ${atkStr} |
                체력 <span style="color:#ff4757;">${uiNum(merc.baseHp)}</span> ${hpStr} |
                이동속도 <span style="color:#3498db;">${merc.spd.toFixed(1)}</span> ${spdStr}
            </div>
            ${advStatsHtml}
            ${bonusText}
        </div>
    `;
};

window.openMercenaryModal = function() {
    const modal = getEl("mercenary-modal");

    if (modal) {
        modal.style.display = "flex";

        if (typeof window.renderMercenaryModalList === "function") {
            window.renderMercenaryModalList();
        }
    }
};

window.closeMercenaryModal = function() {
    const modal = getEl("mercenary-modal");
    if (modal) modal.style.display = "none";
};

window.renderMercenaryModalList = function() {
    const list = getEl("mercenary-list-modal");

    if (!list || typeof TOOTH_DATA === "undefined") return;

    list.innerHTML = "";

    if (!Array.isArray(window.ownedMercenaries)) {
        window.ownedMercenaries = [0];
    }

    if (!window.ownedMercenaries.includes(0)) {
        window.ownedMercenaries.unshift(0);
    }

    const maxOwned = Math.max(...window.ownedMercenaries);
    const tier6Text = window.highestToothLevel >= 16 ? `<span style="color:yellow;">(x2)</span>` : "";

    const trainAtk = (window.trainingLevels && window.trainingLevels.atk ? window.trainingLevels.atk : 0) * 10;
    const atkStr = trainAtk > 0 ? `<span style="color:#2ecc71;">(+${trainAtk}%)</span>` : "";

    TOOTH_DATA.mercenaries.forEach((merc) => {
        if (merc.id > maxOwned + 1) return;

        const div = document.createElement("div");
        div.className = "merc-card";

        const isOwned = window.ownedMercenaries.includes(merc.id);
        const isEquipped = Number(window.mercenaryIdx) === Number(merc.id);

        div.innerHTML = `
            <div style="font-size:25px;">${merc.icon}</div>
            <div style="font-size:12px; font-weight:bold; margin:5px 0;">${merc.name}</div>
            <div style="font-size:10px; color:#aaa;">공격 x${merc.atkMul} ${tier6Text} ${atkStr}</div>
            <div style="font-size:10px; color:#f55;">
                HP ${uiNum(merc.baseHp)}
                <span style="color:#3498db;">| 속도 ${merc.spd.toFixed(1)}</span>
            </div>
        `;

        if (isEquipped) {
            div.style.border = "2px solid #2ecc71";
            div.innerHTML += `
                <button class="btn-sm" style="background:#2ecc71; color:white; width:100%; margin-top:5px; cursor:default; box-shadow:none;">
                    장착중
                </button>
            `;
        } else if (isOwned) {
            div.innerHTML += `
                <button onclick="window.equipMerc(${merc.id})" class="btn-sm" style="background:#777; width:100%; margin-top:5px;">
                    장착하기
                </button>
            `;
        } else {
            div.innerHTML += `
                <button onclick="window.buyMerc(${merc.id}, ${merc.cost})" class="btn-gold" style="padding:4px 5px; font-size:11px; width:100%; margin-top:5px;">
                    ${uiNum(merc.cost)}G
                </button>
            `;
        }

        list.appendChild(div);
    });
};

window.buyMerc = function(id, cost) {
    id = Number(id);
    cost = Number(cost) || 0;

    if (window.gold >= cost) {
        window.gold -= cost;

        if (!Array.isArray(window.ownedMercenaries)) {
            window.ownedMercenaries = [0];
        }

        if (!window.ownedMercenaries.includes(id)) {
            window.ownedMercenaries.push(id);
        }

        try {
            if (typeof playSfx === "function") playSfx("upgrade");
        } catch (e) {}

        if (typeof window.renderMercenaryModalList === "function") window.renderMercenaryModalList();
        if (typeof window.renderMercenaryCamp === "function") window.renderMercenaryCamp();
        if (typeof window.updateUI === "function") window.updateUI();
        if (typeof window.saveGame === "function") window.saveGame();
    } else {
        alert("골드가 부족합니다!");
    }
};

window.equipMerc = function(id) {
    id = Number(id);

    if (!Array.isArray(window.ownedMercenaries) || !window.ownedMercenaries.includes(id)) {
        alert("아직 고용하지 않은 용병입니다.");
        return;
    }

    window.mercenaryIdx = id;

    if (typeof window.renderMercenaryModalList === "function") window.renderMercenaryModalList();
    if (typeof window.renderMercenaryCamp === "function") window.renderMercenaryCamp();
    if (typeof window.saveGame === "function") window.saveGame();
};

// =========================
// 4. 신규 티어 달성 알림
// =========================
window.showTierUnlock = function(level) {
    const modal = getEl("tier-unlock-modal");
    const iconDiv = getEl("tier-unlock-icon");
    const nameDiv = getEl("tier-unlock-name");
    const descDiv = getEl("tier-unlock-desc");

    if (!modal || !iconDiv || !nameDiv || !descDiv) return;

    iconDiv.innerHTML = uiGetIcon(level);
    nameDiv.innerText = uiGetName(level);

    let desc = "";

    if (level === 4) desc = "채굴력 1.2배 상승! 더 빠르게 채굴합니다.";
    else if (level === 7) desc = "💥 광역 공격 훈련이 개방되었습니다!";
    else if (level === 10) desc = "⚡ 치명타 훈련이 개방되었습니다!";
    else if (level === 13) desc = "♦️ 던전 다이아 획득량이 2배로 증가합니다!";
    else if (level === 16) desc = "⚔️ 용병 공격력이 2배로 증폭됩니다!";
    else if (level === 19) desc = "🔥 치아 기본 공격력이 10배로 폭증합니다!";
    else if (level === 22) desc = "👑 모든 던전 보상이 5배로 폭증합니다!";

    descDiv.innerText = desc;
    modal.style.display = "flex";

    try {
        if (typeof playSfx === "function") playSfx("unlock");
    } catch (e) {}
};

window.closeTierUnlock = function() {
    const modal = getEl("tier-unlock-modal");
    if (modal) modal.style.display = "none";
};

// =========================
// 5. 던전 리스트
// =========================
window.renderDungeonList = function() {
    const list = getEl("dungeon-list");

    if (!list || typeof TOOTH_DATA === "undefined") return;

    list.innerHTML = "";

    const tab = window.currentDungeonTab || "normal";
    const isHell = tab === "hell" || tab === "hellboss";
    const isBoss = tab === "boss" || tab === "hellboss";

    const dungeonData = isHell ? TOOTH_DATA.hellDungeons : TOOTH_DATA.dungeons;
    const currentUnlocked = isHell ? window.unlockedHellDungeon : window.unlockedDungeon;

    if (isHell && window.unlockedDungeon <= 20) {
        list.innerHTML = `
            <div class="dungeon-card locked">
                <h4 style="margin:0;">🔒 HELL 잠김</h4>
                <p style="margin:5px 0 0 0; font-size:12px; color:#888;">
                    일반 20단계 클리어 후 지옥문이 열립니다.
                </p>
            </div>
        `;
        return;
    }

    if (isBoss) {
        const groupCount = Math.ceil(dungeonData.length / 5);

        for (let i = 0; i < groupCount; i++) {
            const start = i * 5;
            const end = Math.min(start + 5, dungeonData.length);
            const reqLevel = start + 6;
            const isUnlocked = currentUnlocked >= reqLevel;

            const div = document.createElement("div");
            div.className = `dungeon-card ${isUnlocked ? "unlocked" : "locked"}`;

            const name = isHell
                ? `HELL ${start + 1}~${end}구간`
                : `일반 ${start + 1}~${end}구간`;

            let goldFee = Math.floor(5000 * Math.pow(2.0, start));
            let diaFee = 5 + (start * 5);

            if (isHell) {
                goldFee *= 10;
                diaFee *= 5;
            }

            if (isUnlocked) {
                div.innerHTML = `
                    <h4 style="margin:0;">🔥 ${name} 보스 토벌전</h4>
                    <p style="margin:5px 0 0 0; font-size:12px; color:#ff8888;">
                        입장료:
                        <span style="color:var(--gold);">${uiNum(goldFee)}G</span>,
                        ♦️${diaFee}
                    </p>
                    <p style="color:#f1c40f; font-size:11px; margin:5px 0 0 0;">
                        보스 5연속 처치 시 엄청난 보상 & 보스 징표 획득!
                    </p>
                `;

                div.onclick = () => {
                    if (typeof startDungeon === "function") {
                        startDungeon(start);
                    }
                };
            } else {
                div.innerHTML = `
                    <h4 style="margin:0;">🔒 잠김</h4>
                    <p style="margin:5px 0 0 0; font-size:12px; color:#888;">
                        ${isHell ? "HELL " : "일반 "}던전 ${reqLevel - 1}단계 클리어 시 열림
                    </p>
                `;
            }

            list.appendChild(div);
        }

        return;
    }

    dungeonData.forEach((name, idx) => {
        const div = document.createElement("div");
        const isUnlocked = idx < currentUnlocked;

        div.className = `dungeon-card ${isUnlocked ? "unlocked" : "locked"}`;

        let baseHp = Math.floor(100 * Math.pow(isHell ? 2.5 : 2.2, idx));
        if (isHell) baseHp *= 50;

        const recAtk = (baseHp * 30) / 40;
        const artifactIdx = isHell ? idx + 20 : idx;

        let artifactHtml = "";

        if (!Array.isArray(window.artifactCounts)) {
            window.artifactCounts = new Array(30).fill(0);
        }

        if (TOOTH_DATA.artifacts[artifactIdx]) {
            const art = TOOTH_DATA.artifacts[artifactIdx];
            const myCount = window.artifactCounts[artifactIdx] || 0;

            artifactHtml = `
                <div style="margin-top:8px; padding-top:8px; border-top:1px dashed #555; font-size:11px; color:#ccc; display:flex; justify-content:space-between; align-items:center;">
                    <span>드랍 유물: ${art.icon} ${art.name}</span>
                    <span style="color:${myCount >= 1 ? "#2ecc71" : "#f39c12"};">
                        보유: ${myCount}/1
                    </span>
                </div>
            `;
        }

        if (isUnlocked) {
            div.innerHTML = `
                <h4 style="margin:0;">⚔️ Lv.${idx + 1} ${name}</h4>
                <p style="margin:5px 0 0 0; font-size:12px; color:#aaa;">
                    권장 공격력: ${uiNum(recAtk)}+
                </p>
                ${artifactHtml}
            `;

            div.onclick = () => {
                if (typeof startDungeon === "function") {
                    startDungeon(idx);
                }
            };
        } else {
            div.innerHTML = `
                <h4 style="margin:0;">🔒 잠김</h4>
                <p style="margin:5px 0 0 0; font-size:12px; color:#888;">
                    이전 던전 클리어 시 열림
                </p>
            `;
        }

        list.appendChild(div);
    });
};

// =========================
// 6. 던전 결과창
// =========================
window.showResultModal = function() {
    const modal = getEl("dungeon-result-modal");

    if (!modal || typeof TOOTH_DATA === "undefined") return;

    modal.style.display = "flex";

    const isHell = !!window.isHellMode;
    const isBossRush = !!window.isBossRush;
    const idx = Number(window.currentDungeonIdx) || 0;

    const dungeonList = isHell ? TOOTH_DATA.hellDungeons : TOOTH_DATA.dungeons;
    const dName = dungeonList[idx] || (isHell ? `HELL Lv.${idx + 1}` : `던전 Lv.${idx + 1}`);

    const title = getEl("result-title");
    if (title) {
        title.innerText = `${isBossRush ? "[토벌전] " : ""}${dName} CLEAR!`;
    }

    let nextStr = "";

    if (!isBossRush) {
        if (isHell) {
            const maxHell = TOOTH_DATA.hellDungeons.length;

            if (window.unlockedHellDungeon <= idx + 1 && idx < maxHell - 1) {
                window.unlockedHellDungeon = idx + 2;
                nextStr = "신규 HELL 던전 오픈!";
            }
        } else {
            const maxNormal = TOOTH_DATA.dungeons.length;

            if (idx === maxNormal - 1 && window.unlockedDungeon === maxNormal) {
                window.unlockedDungeon = maxNormal + 1;
                nextStr = "🔥 경고: 지옥문이 열렸습니다... 🔥";

                if (typeof window.playHellVideo === "function") {
                    setTimeout(() => {
                        window.playHellVideo(false);
                    }, 1200);
                }
            } else if (window.unlockedDungeon <= idx + 1 && idx < maxNormal - 1) {
                window.unlockedDungeon = idx + 2;
                nextStr = "신규 던전 오픈!";
            }
        }
    }

    let markHtml = "";

    if (isBossRush) {
        const earnedMarks = isHell ? 2 : 1;

        if (window.bossMarks === undefined) window.bossMarks = 0;

        window.bossMarks += earnedMarks;

        markHtml = `
            <div style="color:#e74c3c; font-weight:bold; margin-top:5px;">
                획득한 보스 징표: +${earnedMarks}개
                <span style="color:#aaa;">(총 ${window.bossMarks}개)</span>
            </div>
        `;
    }

    const desc = getEl("result-desc");

    if (desc) {
        desc.innerHTML = `
            <div style="margin: 15px 0; font-size:16px;">
                골드:
                <span style="color:var(--gold); font-weight:bold;">+${uiNum(window.dungeonGoldEarned || 0)}G</span><br>
                다이아:
                <span style="color:#ff4757; font-weight:bold;">+${uiNum(window.dungeonDiaEarned || 0)}♦️</span>
                ${markHtml}
            </div>
            <div style="color:#2ecc71; font-weight:bold; font-size:12px;">
                ${nextStr}
            </div>
        `;
    }

    const artArea = getEl("result-artifact-area");

    if (artArea) {
        if (window.dungeonArtifactDropped && window.dungeonArtifactDropped.count > 0) {
            artArea.innerHTML = `
                <div style="background:#222; border:2px dashed var(--gold); padding:10px; border-radius:4px; display:inline-block; animation: pulse 1s infinite alternate;">
                    <div style="font-size:10px; color:#aaa; margin-bottom:5px;">
                        🎊 유물 발견! 🎊
                    </div>
                    <div style="font-size:20px;">
                        ${window.dungeonArtifactDropped.icon}
                        <span style="font-size:14px; color:white;">
                            ${window.dungeonArtifactDropped.name}
                        </span>
                    </div>
                </div>
            `;
        } else {
            artArea.innerHTML = `<div style="font-size:11px; color:#555;">(발견된 유물 없음)</div>`;
        }
    }

    const btnNext = getEl("btn-next-dungeon");

    if (btnNext) {
        const maxIdx = isHell ? TOOTH_DATA.hellDungeons.length - 1 : TOOTH_DATA.dungeons.length - 1;

        if (isBossRush || idx >= maxIdx) {
            btnNext.style.display = "none";
        } else {
            btnNext.style.display = "block";
        }
    }

    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.saveGame === "function") window.saveGame();
};

window.retryDungeon = function() {
    const modal = getEl("dungeon-result-modal");
    if (modal) modal.style.display = "none";

    const idx = window.currentDungeonIdx;

    if (typeof exitDungeon === "function") {
        window.exitDungeon();
    }

    setTimeout(() => {
        if (typeof startDungeon === "function") {
            window.startDungeon(idx);
        }
    }, 100);
};

window.nextDungeon = function() {
    const modal = getEl("dungeon-result-modal");
    if (modal) modal.style.display = "none";

    const idx = Number(window.currentDungeonIdx) || 0;

    if (typeof exitDungeon === "function") {
        window.exitDungeon();
    }

    setTimeout(() => {
        if (typeof startDungeon === "function") {
            window.startDungeon(idx + 1);
        }
    }, 100);
};
