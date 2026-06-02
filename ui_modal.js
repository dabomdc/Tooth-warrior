// Version: 8.0.0 - UI Modal / Codex / Artifact / Ranking / Settings / Lv.MAX Unlock

// =========================
// 안전 유틸
// =========================
function modalEl(id) {
    return document.getElementById(id);
}

function modalNum(value) {
    if (typeof fNum === "function") return fNum(value);
    return Math.floor(Number(value) || 0);
}

function modalGetBaseAtk(lv) {
    if (typeof getBaseAtk === "function") return getBaseAtk(lv);
    if (typeof getAtk === "function") return getAtk(lv);
    return 0;
}

function modalGetAtk(lv) {
    if (typeof getAtk === "function") return getAtk(lv);
    return 0;
}

function modalGetIcon(lv) {
    if (typeof getToothIcon === "function") return getToothIcon(lv);
    return "🦷";
}

function modalGetName(lv) {
    if (typeof getToothName === "function") return getToothName(lv);
    return lv >= 25 ? "Lv.MAX 초월 왕관 치아" : `Lv.${lv}`;
}

function modalLvLabel(lv) {
    return Number(lv) >= 25 ? "Lv.MAX" : `Lv.${lv}`;
}

function modalClose(id) {
    const m = modalEl(id);
    if (m) m.style.display = "none";
}

function modalOpen(id) {
    const m = modalEl(id);
    if (m) m.style.display = "flex";
}

// =========================
// 1. 설정창
// =========================
window.openSettings = function() {
    modalOpen("settings-modal");

    const nickDisp = modalEl("current-nickname-display");
    if (nickDisp) {
        nickDisp.innerText = window.nickname || "설정안됨";
    }

    const slider = modalEl("volume-slider");
    if (slider) {
        slider.value = String(window.masterVolume || 2);
    }

    if (typeof window.updateSoundBtn === "function") {
        window.updateSoundBtn();
    }

    if (typeof window.updateReplayButtons === "function") {
        window.updateReplayButtons();
    }
};

window.closeSettings = function() {
    modalClose("settings-modal");
};

window.openNicknameChange = function() {
    modalOpen("nickname-modal");

    const input = modalEl("nickname-input");
    if (input) {
        input.value = window.nickname || "";
        setTimeout(() => input.focus(), 50);
    }
};

// =========================
// 2. 음향 설정
// =========================
window.toggleSound = function() {
    window.isMuted = !window.isMuted;

    if (typeof window.saveGame === "function") {
        window.saveGame();
    }

    window.updateSoundBtn();
};

function updateSoundBtn() {
    const btn = modalEl("sound-toggle-btn");

    if (btn) {
        btn.innerText = window.isMuted ? "🔇 BGM/SFX OFF" : "🔊 BGM/SFX ON";
    }
}

window.updateSoundBtn = updateSoundBtn;

window.changeVolume = function() {
    const slider = modalEl("volume-slider");

    if (!slider) return;

    window.masterVolume = parseInt(slider.value, 10) || 2;

    if (typeof window.saveGame === "function") {
        window.saveGame();
    }

    try {
        if (typeof playSfx === "function") playSfx("hit");
    } catch (e) {}
};

// =========================
// 3. 영상 다시보기 버튼 상태
// =========================
window.updateReplayButtons = function() {
    const hellBtn = modalEl("replay-hell-btn");
    const awakenBtn = modalEl("replay-awaken-btn");

    if (hellBtn) {
        const hellUnlocked = !!window.hasPlayedHellVideo || window.unlockedDungeon > 20;

        if (hellUnlocked) {
            hellBtn.classList.remove("locked");
            hellBtn.innerText = "🔥 지옥문 개방 영상 다시보기";
        } else {
            hellBtn.classList.add("locked");
            hellBtn.innerText = "🔒 지옥문 영상 잠김";
        }
    }

    if (awakenBtn) {
        const awakenUnlocked = !!window.hasPlayedAwakenVideo || window.highestToothLevel >= 25;

        if (awakenUnlocked) {
            awakenBtn.classList.remove("locked");
            awakenBtn.innerText = "👑 초월 각성 영상 다시보기";
        } else {
            awakenBtn.classList.add("locked");
            awakenBtn.innerText = "🔒 초월 각성 영상 잠김";
        }
    }
};

// =========================
// 4. 치아도감
// =========================
window.openCodex = function() {
    modalOpen("codex-modal");

    if (typeof window.renderCodex === "function") {
        window.renderCodex();
    }
};

window.closeCodex = function() {
    modalClose("codex-modal");
};

function renderCodex() {
    const grid = modalEl("codex-grid");

    if (!grid || typeof TOOTH_DATA === "undefined") return;

    grid.innerHTML = "";

    const maxLv = window.TOOTH_MAX_LEVEL || 25;
    let unlockedCount = 0;

    for (let i = 1; i <= maxLv; i++) {
        const item = document.createElement("div");
        item.className = "codex-item";

        const isUnlocked = i <= window.highestToothLevel;

        if (isUnlocked) {
            unlockedCount++;
        } else {
            item.classList.add("locked");
        }

        const badgeText = i >= 25 ? "MAX" : i;
        const badgeClass = i >= 25 ? "codex-badge max" : "codex-badge";

        const iconHtml = isUnlocked
            ? modalGetIcon(i)
            : `<div class="codex-icon" style="color:#555;">?</div>`;

        const nameText = isUnlocked ? modalGetName(i) : "미발견";

        let abilityText = "";

        if (isUnlocked) {
            if (i === 4) abilityText = "채굴력 1.2배 상승";
            else if (i === 7) abilityText = "💥 광역 훈련 개방";
            else if (i === 10) abilityText = "⚡ 치명타 훈련 개방";
            else if (i === 13) abilityText = "♦️ 다이아 획득 2배";
            else if (i === 16) abilityText = "⚔️ 용병 공격력 2배";
            else if (i === 19) abilityText = "🔥 치아 공격력 10배";
            else if (i === 22) abilityText = "👑 보상 5배 증폭";
            else if (i === 25) abilityText = "🌌 초월 왕관 치아";
        }

        const atkText = isUnlocked
            ? `<div class="codex-atk">기본공격력 ${modalNum(modalGetBaseAtk(i))}</div>`
            : "";

        item.innerHTML = `
            <div class="${badgeClass}">${badgeText}</div>
            ${iconHtml}
            <div class="codex-name">${nameText}</div>
            ${atkText}
            ${abilityText ? `<div class="codex-ability">${abilityText}</div>` : ""}
        `;

        grid.appendChild(item);
    }

    const progress = modalEl("codex-progress");
    if (progress) {
        progress.innerText = `수집률: ${unlockedCount}/${maxLv}`;
    }
}

window.renderCodex = renderCodex;

// =========================
// 5. 유물도감
// =========================
window.openArtifacts = function() {
    modalOpen("artifact-modal");

    if (typeof window.renderArtifacts === "function") {
        window.renderArtifacts();
    }
};

window.closeArtifacts = function() {
    modalClose("artifact-modal");
};

function renderArtifacts() {
    const grid = modalEl("artifact-grid");

    if (!grid || typeof TOOTH_DATA === "undefined") return;

    grid.innerHTML = "";

    if (!Array.isArray(window.artifactCounts)) {
        window.artifactCounts = new Array(30).fill(0);
    }

    let completedSets = 0;

    for (let i = 0; i < 30; i++) {
        const art = TOOTH_DATA.artifacts[i];

        if (!art) continue;

        const count = Number(window.artifactCounts[i]) || 0;
        const isCompleted = count >= 1;

        if (isCompleted) completedSets++;

        const item = document.createElement("div");
        item.className = "artifact-item";

        if (count === 0) {
            item.classList.add("locked");
        }

        item.innerHTML = `
            <div class="artifact-count" style="background:${isCompleted ? "#2ecc71" : "#e74c3c"}">
                ${count}/1
            </div>
            <div class="artifact-icon">${art.icon}</div>
            <div class="artifact-name">${art.name}</div>
            ${
                isCompleted
                    ? `<div style="font-size:8px; color:var(--gold); margin-top:3px;">완성</div>`
                    : `<div style="font-size:8px; color:#555; margin-top:3px;">미완성</div>`
            }
        `;

        grid.appendChild(item);
    }

    const extraMiningLv = Math.floor(completedSets / 3);
    const progress = modalEl("artifact-progress");

    if (progress) {
        progress.innerText = `완성: ${completedSets}/30 (채굴 Lv +${extraMiningLv})`;
    }
}

window.renderArtifacts = renderArtifacts;

// =========================
// 6. Lv.24 봉인 해제 → Lv.MAX
// =========================
window.openLockedToothModal = function(slotIdx) {
    window.lockedToothSlotIdx = slotIdx;

    const lv = Array.isArray(window.inventory) ? Number(window.inventory[slotIdx]) || 0 : 0;

    if (lv !== 24) {
        alert("Lv.24 봉인된 왕관 치아만 해방할 수 있습니다.");
        return;
    }

    modalOpen("locked-tooth-modal");

    if (typeof window.renderUnlockRequirements === "function") {
        window.renderUnlockRequirements();
    }
};

window.closeLockedToothModal = function() {
    modalClose("locked-tooth-modal");
};

function renderUnlockRequirements() {
    const reqDiv = modalEl("unlock-requirements");
    const btn = modalEl("btn-unlock-tooth");

    if (!reqDiv || !btn || typeof TOOTH_DATA === "undefined") return;

    const req = TOOTH_DATA.AWAKEN_REQ;

    if (window.bossMarks === undefined) window.bossMarks = 0;

    const goldOk = window.gold >= req.gold;
    const diaOk = window.dia >= req.dia;
    const marksOk = window.bossMarks >= req.bossMarks;

    reqDiv.innerHTML = `
        <div style="margin-bottom:5px; color:${goldOk ? "#2ecc71" : "#e74c3c"};">
            💰 골드: ${modalNum(window.gold)} / ${modalNum(req.gold)}
        </div>
        <div style="margin-bottom:5px; color:${diaOk ? "#2ecc71" : "#e74c3c"};">
            ♦️ 다이아: ${modalNum(window.dia)} / ${modalNum(req.dia)}
        </div>
        <div style="color:${marksOk ? "#2ecc71" : "#e74c3c"};">
            🏅 토벌 징표: ${window.bossMarks} / ${req.bossMarks}
        </div>
    `;

    if (goldOk && diaOk && marksOk) {
        btn.disabled = false;
        btn.style.filter = "none";
        btn.innerText = "봉인 해제 시도!";
    } else {
        btn.disabled = true;
        btn.style.filter = "grayscale(1)";
        btn.innerText = "재화 부족";
    }
}

window.renderUnlockRequirements = renderUnlockRequirements;

window.attemptUnlockTooth = function() {
    if (typeof TOOTH_DATA === "undefined") return;

    const slotIdx = Number(window.lockedToothSlotIdx);
    const req = TOOTH_DATA.AWAKEN_REQ;

    if (!Array.isArray(window.inventory) || Number.isNaN(slotIdx)) {
        alert("대상 치아를 찾을 수 없습니다.");
        return;
    }

    if (Number(window.inventory[slotIdx]) !== 24) {
        alert("Lv.24 봉인된 왕관 치아만 해방할 수 있습니다.");
        return;
    }

    if (window.gold < req.gold || window.dia < req.dia || window.bossMarks < req.bossMarks) {
        alert("봉인 해제에 필요한 재화가 부족합니다.");
        renderUnlockRequirements();
        return;
    }

    const ok = confirm(
        "모든 재화를 소모하여 Lv.24 봉인된 왕관 치아를 해방하시겠습니까?\n\n" +
        "성공 시 해당 치아는 Lv.MAX 초월 왕관 치아가 됩니다."
    );

    if (!ok) return;

    window.gold -= req.gold;
    window.dia -= req.dia;
    window.bossMarks -= req.bossMarks;

    window.inventory[slotIdx] = 25;
    window.highestToothLevel = Math.max(window.highestToothLevel || 1, 25);

    // 구버전 호환값 유지
    window.isToothAwakened = true;

    closeLockedToothModal();

    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderCodex === "function") window.renderCodex();
    if (typeof window.updateUI === "function") window.updateUI();

    if (typeof window.saveGame === "function") window.saveGame();

    if (typeof window.playAwakenVideo === "function") {
        window.playAwakenVideo(false);
    } else {
        alert("👑 Lv.MAX 초월 왕관 치아가 완성되었습니다!");
    }
};

// =========================
// 7. 랭킹
// =========================
window.generateRankings = function() {
    const list = modalEl("ranking-list");

    if (!list || typeof TOOTH_DATA === "undefined") return;

    if (!Array.isArray(window.fakeUsers) || window.fakeUsers.length === 0) {
        window.fakeUsers = [];

        const chars = "abcdefghijklmnopqrstuvwxyz0123456789";

        for (let i = 0; i < 500; i++) {
            const fakePower = Math.floor(Math.pow(Math.random(), 3) * 8000000) + 1000;
            const fakeD = Math.floor(Math.random() * 20) + 1;

            window.fakeUsers.push({
                p: fakePower,
                d: fakeD,
                isMe: false
            });
        }

        window.fakeUsers.sort((a, b) => b.p - a.p);

        const top10Indices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        top10Indices.sort(() => Math.random() - 0.5);

        const realNameIndices = top10Indices.slice(0, 5);
        const realNames = [...TOOTH_DATA.REAL_NICKNAMES].sort(() => Math.random() - 0.5);

        for (let i = 0; i < window.fakeUsers.length; i++) {
            if (i < 10 && realNameIndices.includes(i)) {
                window.fakeUsers[i].name = realNames.pop();
            } else {
                let hash = "";

                for (let j = 0; j < 4; j++) {
                    hash += chars.charAt(Math.floor(Math.random() * chars.length));
                }

                window.fakeUsers[i].name = `User-${hash}`;
            }
        }
    }

    let myPower = modalGetAtk(window.highestToothLevel || 1);

    if (TOOTH_DATA.mercenaries[window.mercenaryIdx]) {
        myPower *= TOOTH_DATA.mercenaries[window.mercenaryIdx].atkMul;
    }

    if (window.highestToothLevel >= 16) {
        myPower *= 2;
    }

    if (window.trainingLevels && window.trainingLevels.atk) {
        myPower *= 1 + (window.trainingLevels.atk * 0.1);
    }

    const ranks = [...window.fakeUsers];

    const myData = {
        name: window.nickname || "나",
        d: window.unlockedDungeon,
        p: Math.floor(myPower),
        isMe: true
    };

    ranks.push(myData);
    ranks.sort((a, b) => b.p - a.p);

    let html = "";
    const myRankIdx = ranks.findIndex((r) => r.isMe);
    const myRank = myRankIdx + 1;

    ranks.forEach((r, idx) => {
        const isTop10 = idx < 10;
        const isNearMe = Math.abs(idx - myRankIdx) <= 5;

        if (idx === 10 && myRankIdx > 15) {
            html += `<div style="text-align:center; color:#555; font-size:14px; padding:5px 0;">. . . . . .</div>`;
        }

        if (isTop10 || isNearMe) {
            let rankColor = r.isMe
                ? "color:var(--gold); font-weight:bold; background:rgba(241, 196, 15, 0.1);"
                : "color:#ccc;";

            if (idx === 0) {
                rankColor += "color:#ff4757; text-shadow:0 0 5px red; font-size:14px;";
            }

            html += `
                <div style="display:flex; justify-content:space-between; padding:8px 5px; border-bottom:1px solid #333; ${rankColor}">
                    <span style="width:15%; text-align:center;">${idx + 1}</span>
                    <span style="flex:1; text-align:center;">${r.name}</span>
                    <span style="width:20%; text-align:center;">Lv.${r.d}</span>
                    <span style="width:25%; text-align:right;">${modalNum(r.p)}</span>
                </div>
            `;
        }
    });

    list.innerHTML = html;

    const rankDisp = modalEl("my-rank-display");

    if (rankDisp) {
        rankDisp.innerText = `내 순위: ${myRank}위 / ${ranks.length}명 (전투력: ${modalNum(myPower)})`;
    }
};

window.openRanking = function() {
    modalOpen("ranking-modal");

    if (typeof window.generateRankings === "function") {
        window.generateRankings();
    }
};

window.closeRanking = function() {
    modalClose("ranking-modal");
};

// =========================
// 8. 가이드 / 쿠폰
// =========================
window.openGuide = function() {
    modalOpen("guide-modal");

    const content = modalEl("guide-scroll-content");

    if (!content) return;

    content.innerHTML = `
        <div style="padding-top:10px; line-height:1.55; font-size:12px;">
            <h3 style="color:var(--gold); margin-top:0;">🦷 치아 연대기 레트로 가이드</h3>

            <p>
                <strong style="color:#00fbff;">1. 채굴과 합성</strong><br>
                치아를 채굴하고 같은 레벨끼리 합성해 더 강한 치아를 만듭니다.
                직접 채굴은 최대 <strong>Lv.12</strong>까지 가능합니다.
            </p>

            <p>
                <strong style="color:#00fbff;">2. 일반 합성 한계</strong><br>
                일반 합성은 최대 <strong>Lv.24 봉인된 왕관 치아</strong>까지 가능합니다.
                Lv.25는 일반 합성으로 만들 수 없습니다.
            </p>

            <p>
                <strong style="color:#00fbff;">3. Lv.MAX 초월 왕관 치아</strong><br>
                Lv.24 봉인된 왕관 치아를 더블 터치하면 봉인 해제창이 열립니다.
                골드, 다이아, 보스 징표를 소모하여
                <strong style="color:var(--gold);">Lv.MAX 초월 왕관 치아</strong>로 해방할 수 있습니다.
            </p>

            <p>
                <strong style="color:#00fbff;">4. Top8 공격 슬롯</strong><br>
                인벤토리의 맨 위 8칸은 던전 전투에 사용되는 공격 슬롯입니다.
                자동 합성은 이 Top8 슬롯을 건드리지 않습니다.
            </p>

            <p>
                <strong style="color:#00fbff;">5. 유물 파밍</strong><br>
                던전 보스를 잡으면 확률적으로 유물을 얻습니다.
                유물 3종류를 완성할 때마다 기본 채굴 레벨이 +1 상승합니다.
            </p>

            <p>
                <strong style="color:#00fbff;">6. 던전과 토벌전</strong><br>
                일반 던전을 클리어하면 다음 던전이 열립니다.
                토벌전에서는 보스 징표를 획득할 수 있고,
                이 징표는 Lv.MAX 해방 재료로 사용됩니다.
            </p>
        </div>
    `;
};

window.closeGuide = function() {
    modalClose("guide-modal");
};

window.promptCoupon = function() {
    setTimeout(() => {
        const code = prompt("쿠폰 코드를 입력하세요:");

        if (code && typeof window.checkCoupon === "function") {
            window.checkCoupon(code);
        }
    }, 10);
};
