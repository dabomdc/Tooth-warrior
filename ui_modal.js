// Version: 8.0.0 - Modal UI, Codex, Artifacts, Ranking, Settings, Unlocks

// --- [ 1. 신규 티어 달성 알림 ] ---
window.showTierUnlock = function(level) {
    const m = document.getElementById('tier-unlock-modal');
    const iconDiv = document.getElementById('tier-unlock-icon');
    const nameDiv = document.getElementById('tier-unlock-name');
    const descDiv = document.getElementById('tier-unlock-desc');
    
    if (m && iconDiv && nameDiv && descDiv) {
        iconDiv.innerHTML = typeof window.getToothIcon === 'function' ? window.getToothIcon(level) : "🦷";
        nameDiv.innerText = typeof window.getToothName === 'function' ? window.getToothName(level) : `Lv.${level}`;
        
        let desc = "";

        if (level === 4) desc = "채굴력 1.2배 상승! (더 빠르게 채굴합니다)";
        else if (level === 7) desc = "💥 광역 공격 훈련이 개방되었습니다!";
        else if (level === 10) desc = "⚡ 치명타 훈련이 개방되었습니다!";
        else if (level === 13) desc = "♦️ 던전 다이아 획득량이 2배로 증가합니다!";
        else if (level === 16) desc = "⚔️ 용병 공격력이 2배로 증폭됩니다!";
        else if (level === 19) desc = "🔥 치아 기본 공격력이 10배로 폭증합니다!";
        else if (level === 22) desc = "👑 모든 던전 보상이 5배로 폭증합니다!";
        
        descDiv.innerText = desc;
        m.style.display = 'flex';

        try { 
            if (typeof window.playSfx === 'function') window.playSfx('unlock'); 
        } catch(e) {}
    }
};

window.closeTierUnlock = function() {
    const m = document.getElementById('tier-unlock-modal');
    if (m) m.style.display = 'none';
};


// --- [ 2. 치아 도감 ] ---
window.openCodex = function() {
    const m = document.getElementById('codex-modal');

    if (m) { 
        m.style.display = 'flex'; 

        if (typeof window.renderCodex === 'function') {
            window.renderCodex(); 
        }
    }
};

window.closeCodex = function() {
    const m = document.getElementById('codex-modal');
    if (m) m.style.display = 'none';
};

function renderCodex() {
    const grid = document.getElementById('codex-grid');

    if (!grid || typeof window.TOOTH_DATA === 'undefined') return;

    grid.innerHTML = '';
    
    let unlockedCount = 0;

    for (let i = 1; i <= 24; i++) {
        const item = document.createElement('div');

        item.className = 'codex-item';
        
        const isUnlocked = i <= window.highestToothLevel;

        if (isUnlocked) {
            unlockedCount++;
        } else {
            item.classList.add('locked');
        }
        
        const badge = `<div class="codex-badge">${i}</div>`;
        const iconHtml = isUnlocked ? 
            (typeof window.getToothIcon === 'function' ? window.getToothIcon(i) : "🦷") : 
            `<div class="codex-icon" style="color:#555;">?</div>`;

        const nameText = isUnlocked ? 
            (typeof window.getToothName === 'function' ? window.getToothName(i) : `Lv.${i}`) : 
            "미발견";
        
        let abilityText = "";

        if (isUnlocked) {
            if (i === 4) abilityText = "채굴력 1.2배 상승";
            else if (i === 7) abilityText = "💥 광역 훈련 개방";
            else if (i === 10) abilityText = "⚡ 치명타 훈련 개방";
            else if (i === 13) abilityText = "♦️ 다이아 획득 2배";
            else if (i === 16) abilityText = "⚔️ 용병 공격력 2배";
            else if (i === 19) abilityText = "🔥 치아 공격력 10배";
            else if (i === 22) abilityText = "👑 보상 5배 증폭";
        }

        item.innerHTML = `
            ${badge}
            ${iconHtml}
            <div class="codex-name">${nameText}</div>
            ${abilityText ? `<div class="codex-ability">${abilityText}</div>` : ""}
        `;

        grid.appendChild(item);
    }
    
    const progress = document.getElementById('codex-progress');

    if (progress) {
        progress.innerText = `수집률: ${unlockedCount}/24`;
    }
}
window.renderCodex = renderCodex;


// --- [ 3. 유물 도감 ] ---
window.openArtifacts = function() {
    const m = document.getElementById('artifact-modal');

    if (m) { 
        m.style.display = 'flex'; 

        if (typeof window.renderArtifacts === 'function') {
            window.renderArtifacts(); 
        }
    }
};

window.closeArtifacts = function() {
    const m = document.getElementById('artifact-modal');
    if (m) m.style.display = 'none';
};

function renderArtifacts() {
    const grid = document.getElementById('artifact-grid');

    if (!grid || typeof window.TOOTH_DATA === 'undefined') return;

    grid.innerHTML = '';
    
    if (window.artifactCounts === undefined) {
        window.artifactCounts = new Array(30).fill(0);
    }
    
    let completedSets = 0;
    
    for (let i = 0; i < 30; i++) {
        const art = window.TOOTH_DATA.artifacts[i];

        if (!art) continue;
        
        const count = window.artifactCounts[i] || 0;
        const isCompleted = count >= 1; 

        if (isCompleted) completedSets++;
        
        const item = document.createElement('div');

        item.className = 'artifact-item';

        if (count === 0) {
            item.classList.add('locked');
        }
        
        item.innerHTML = `
            <div class="artifact-count" style="background:${isCompleted ? '#2ecc71' : '#e74c3c'}">${count}/1</div>
            <div class="artifact-icon">${art.icon}</div>
            <div class="artifact-name">${art.name}</div>
            ${isCompleted ? `<div style="font-size:8px; color:var(--gold); margin-top:3px;">완성</div>` : `<div style="font-size:8px; color:#555; margin-top:3px;">미완성</div>`}
        `;

        grid.appendChild(item);
    }
    
    let extraMiningLv = Math.floor(completedSets / 3); 
    const progress = document.getElementById('artifact-progress');

    if (progress) {
        progress.innerText = `완성: ${completedSets}/30 (채굴 Lv +${extraMiningLv})`;
    }
}
window.renderArtifacts = renderArtifacts;


// --- [ 4. 24레벨 전설의 치아 봉인 해제 ] ---
window.openLockedToothModal = function(slotIdx) {
    window.lockedToothSlotIdx = slotIdx;

    const m = document.getElementById('locked-tooth-modal');

    if (m) {
        m.style.display = 'flex';

        if (typeof renderUnlockRequirements === 'function') {
            renderUnlockRequirements();
        }
    }
};

window.closeLockedToothModal = function() {
    const m = document.getElementById('locked-tooth-modal');
    if (m) m.style.display = 'none';
};

function renderUnlockRequirements() {
    const reqDiv = document.getElementById('unlock-requirements');
    const btn = document.getElementById('btn-unlock-tooth');

    if (!reqDiv || !btn || typeof window.TOOTH_DATA === 'undefined') return;

    const req = window.TOOTH_DATA.AWAKEN_REQ;

    if (window.bossMarks === undefined) {
        window.bossMarks = 0;
    }
    
    const goldOk = window.gold >= req.gold;
    const diaOk = window.dia >= req.dia;
    const marksOk = window.bossMarks >= req.bossMarks;
    
    reqDiv.innerHTML = `
        <div style="margin-bottom:5px; color:${goldOk ? '#2ecc71' : '#e74c3c'};">
            💰 골드: ${window.safeFNum ? window.safeFNum(window.gold) : window.gold} / ${window.safeFNum ? window.safeFNum(req.gold) : req.gold}
        </div>
        <div style="margin-bottom:5px; color:${diaOk ? '#2ecc71' : '#e74c3c'};">
            ♦️ 다이아: ${window.safeFNum ? window.safeFNum(window.dia) : window.dia} / ${window.safeFNum ? window.safeFNum(req.dia) : req.dia}
        </div>
        <div style="color:${marksOk ? '#2ecc71' : '#e74c3c'};">
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

window.attemptUnlockTooth = function() {
    if (typeof window.TOOTH_DATA === 'undefined') return;

    const req = window.TOOTH_DATA.AWAKEN_REQ;

    if (window.gold >= req.gold && window.dia >= req.dia && window.bossMarks >= req.bossMarks) {
        if (confirm("모든 재화를 소모하여 진정한 전설의 치아를 해방하시겠습니까?")) {
            window.gold -= req.gold;
            window.dia -= req.dia;
            window.bossMarks -= req.bossMarks;
            
            window.isToothAwakened = true;

            window.closeLockedToothModal();
            
            if (typeof window.playAwakenVideo === 'function') {
                window.playAwakenVideo();
            } else {
                window.skipAwakenIntro();
            }
            
            if (typeof window.renderInventory === 'function') {
                window.renderInventory();
            }

            if (typeof window.updateUI === 'function') {
                window.updateUI();
            }

            if (typeof window.saveGame === 'function') {
                window.saveGame();
            }
        }
    }
};

window.playAwakenVideo = function() {
    const layer = document.getElementById('awaken-video-layer');
    const vid = document.getElementById('awaken-video');
    const skipBtn = document.getElementById('skip-awaken-btn');

    if (layer && vid) {
        layer.style.display = 'flex';
        vid.style.display = 'block';

        if (skipBtn) {
            skipBtn.style.display = 'block';
        }

        vid.volume = window.masterVolume ? window.masterVolume * 0.3 : 0.6;
        vid.muted = window.isMuted;

        vid.play().catch(() => {
            window.skipAwakenIntro();
        });

        vid.onended = function() {
            setTimeout(window.skipAwakenIntro, 500);
        };
    } else {
        window.skipAwakenIntro();
    }
};

window.skipAwakenIntro = function() {
    const vid = document.getElementById('awaken-video');

    if (vid) {
        vid.pause();
        vid.style.display = 'none';
    }

    const layer = document.getElementById('awaken-video-layer');

    if (layer) {
        layer.style.display = 'none';
    }

    const skipBtn = document.getElementById('skip-awaken-btn');

    if (skipBtn) {
        skipBtn.style.display = 'none';
    }
    
    try { 
        if (typeof window.playSfx === 'function') window.playSfx('awaken'); 
    } catch(e) {}

    const flash = document.createElement('div');

    flash.style.position = 'fixed';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.background = 'white';
    flash.style.zIndex = '40000';
    flash.style.animation = 'splashFade 2s ease-out forwards';

    document.body.appendChild(flash);

    setTimeout(() => {
        if (flash && flash.parentNode) flash.remove();
    }, 2000);
    
    alert("👑 세계관 최강의 무기, [진(眞) 절대자의 치아]가 봉인을 깨고 강림했습니다! 👑\n공격력이 상상을 초월합니다!");

    if (typeof window.renderInventory === 'function') {
        window.renderInventory();
    }
};


// --- [ 5. 랭킹 ] ---
window.generateRankings = function() {
    const list = document.getElementById('ranking-list');

    if (!list || typeof window.TOOTH_DATA === 'undefined') return;
    
    if (!window.fakeUsers || window.fakeUsers.length === 0) {
        window.fakeUsers = [];

        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        
        for (let i = 0; i < 500; i++) {
            let fakePower = Math.floor(Math.pow(Math.random(), 3) * 8000000) + 1000;
            let fakeD = Math.floor(Math.random() * 20) + 1;

            window.fakeUsers.push({ p: fakePower, d: fakeD, isMe: false });
        }
        
        window.fakeUsers.sort((a, b) => b.p - a.p);
        
        let top10Indices = [0,1,2,3,4,5,6,7,8,9];

        top10Indices.sort(() => Math.random() - 0.5);

        let realNameIndices = top10Indices.slice(0, 5);
        let realNames = [...window.TOOTH_DATA.REAL_NICKNAMES].sort(() => Math.random() - 0.5);

        for (let i = 0; i < 500; i++) {
            if (i < 10 && realNameIndices.includes(i)) {
                window.fakeUsers[i].name = realNames.pop();
            } else {
                let hash = '';

                for (let j = 0; j < 4; j++) {
                    hash += chars.charAt(Math.floor(Math.random() * chars.length));
                }

                window.fakeUsers[i].name = `User-${hash}`;
            }
        }
    }

    let myPower = window.safeGetAtk ? window.safeGetAtk(window.highestToothLevel) : 1;

    if (window.TOOTH_DATA.mercenaries[window.mercenaryIdx]) {
        myPower *= window.TOOTH_DATA.mercenaries[window.mercenaryIdx].atkMul;
    }
    
    let ranks = [...window.fakeUsers]; 
    let myData = { 
        name: window.nickname || "나", 
        d: window.unlockedDungeon, 
        p: myPower, 
        isMe: true 
    };

    ranks.push(myData);
    ranks.sort((a, b) => b.p - a.p);
    
    let html = ''; 
    let myRankIdx = ranks.findIndex(r => r.isMe);
    let myRank = myRankIdx + 1;

    ranks.forEach((r, idx) => {
        let isTop10 = idx < 10;
        let isNearMe = Math.abs(idx - myRankIdx) <= 5;

        if (idx === 10 && myRankIdx > 15) {
            html += `<div style="text-align:center; color:#555; font-size:14px; padding:5px 0;">. . . . . .</div>`;
        }

        if (isTop10 || isNearMe) {
            let rankColor = r.isMe ? 
                'color:var(--gold); font-weight:bold; background:rgba(241, 196, 15, 0.1);' : 
                'color:#ccc;';

            if (idx === 0) {
                rankColor += 'color:#ff4757; text-shadow:0 0 5px red; font-size:14px;';
            }
            
            html += `
                <div style="display:flex; justify-content:space-between; padding:8px 5px; border-bottom:1px solid #333; ${rankColor}">
                    <span style="width:15%; text-align:center;">${idx + 1}</span>
                    <span style="flex:1; text-align:center;">${r.name}</span>
                    <span style="width:20%; text-align:center;">Lv.${r.d}</span>
                    <span style="width:25%; text-align:right;">${window.safeFNum ? window.safeFNum(r.p) : r.p}</span>
                </div>
            `;
        }
    });
    
    list.innerHTML = html;

    const rankDisp = document.getElementById('my-rank-display');

    if (rankDisp) {
        rankDisp.innerText = `내 순위: ${myRank}위 / ${ranks.length}명 (전투력: ${window.safeFNum ? window.safeFNum(myPower) : myPower})`;
    }
};

window.openRanking = function() {
    const m = document.getElementById('ranking-modal');

    if (m) { 
        m.style.display = 'flex'; 

        if (typeof window.generateRankings === 'function') {
            window.generateRankings(); 
        }
    }
};

window.closeRanking = function() {
    const m = document.getElementById('ranking-modal');
    if (m) m.style.display = 'none';
};


// --- [ 6. 설정창 ] ---
window.openSettings = function() {
    const m = document.getElementById('settings-modal');

    if (m) { 
        m.style.display = 'flex'; 

        const nickDisp = document.getElementById('current-nickname-display');

        if (nickDisp) {
            nickDisp.innerText = window.nickname || "설정안됨";
        }

        if (typeof window.updateSoundBtn === 'function') {
            window.updateSoundBtn();
        }

        const slider = document.getElementById('volume-slider');

        if (slider) {
            slider.value = window.masterVolume || 2;
        }
    }
};

window.closeSettings = function() {
    const m = document.getElementById('settings-modal');
    if (m) m.style.display = 'none';
};

window.openNicknameChange = function() {
    const m = document.getElementById('nickname-modal');

    if (m) {
        m.style.display = 'flex';

        const input = document.getElementById('nickname-input');

        if (input) {
            input.value = window.nickname || "";
        }
    }
};


// --- [ 7. 저장 코드 / 쿠폰 / 사운드 / 초기화 ] ---
window.exportSaveCode = function() {
    const saveData = 
        localStorage.getItem('toothSaveV700') || 
        localStorage.getItem('toothSaveV695') ||
        localStorage.getItem('toothSaveV680');

    if (saveData) {
        try {
            const encoded = btoa(encodeURIComponent(saveData));

            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(encoded).then(() => {
                    alert("✅ 저장 코드가 클립보드에 자동 복사되었습니다! 메모장에 붙여넣기 하여 보관하세요.");
                }).catch(() => {
                    prompt("클립보드 복사 실패. 아래 코드를 전체 선택하여 복사하세요:", encoded);
                });
            } else {
                prompt("클립보드 권한이 없습니다. 아래 코드를 전체 선택하여 복사하세요:", encoded);
            }
        } catch (e) { 
            alert("코드 생성 중 오류가 발생했습니다."); 
        }
    } else {
        alert("저장된 데이터가 없습니다. 먼저 게임을 플레이해주세요.");
    }
};

window.promptCoupon = function() {
    setTimeout(() => {
        const code = prompt("쿠폰 코드를 입력하세요:");

        if (code && typeof window.checkCoupon === 'function') {
            window.checkCoupon(code);
        }
    }, 10);
};

window.toggleSound = function() {
    window.isMuted = !window.isMuted;

    if (typeof window.saveGame === 'function') {
        window.saveGame();
    }

    window.updateSoundBtn();
};

function updateSoundBtn() {
    const btn = document.getElementById('sound-toggle-btn');

    if (btn) {
        btn.innerText = window.isMuted ? "🔇 BGM/SFX OFF" : "🔊 BGM/SFX ON";
    }
}
window.updateSoundBtn = updateSoundBtn;

window.changeVolume = function() {
    const slider = document.getElementById('volume-slider');

    if (!slider) return;

    window.masterVolume = parseInt(slider.value);

    if (typeof window.saveGame === 'function') {
        window.saveGame();
    }

    try { 
        if (typeof window.playSfx === 'function') window.playSfx('hit'); 
    } catch(e) {}
};

window.checkReset = function() {
    if (confirm("정말로 모든 데이터를 삭제하시겠습니까? 복구할 수 없습니다!")) {
        window.isResetting = true;

        localStorage.clear(); 
        location.reload();
    }
};


// --- [ 8. 가이드 ] ---
window.openGuide = function() {
    const m = document.getElementById('guide-modal');

    if (m) {
        m.style.display = 'flex';

        const content = document.getElementById('guide-scroll-content');

        if (content) {
            content.innerHTML = `
                <div style="padding-top:10px;">
                    <h3 style="color:var(--gold);">🦷 치아 연대기 레트로 가이드</h3>
                    <p><strong>1. 채굴과 합성 (24단계)</strong><br>치아를 캐고 합쳐서 다음 단계로 나아가세요. 23레벨 2개를 합치면 전설의 치아가 탄생합니다!</p>
                    <p><strong>2. 유물 파밍 시스템</strong><br>던전 보스를 잡고 '유물'을 1개씩 수집하세요. 완성된 유물이 <strong>3종류가 될 때마다 기본 채굴 레벨이 +1 영구 상승</strong>합니다!</p>
                    <p><strong>3. 보스 토벌전 & 봉인 해제</strong><br>토벌전에서 살아남아 '보스 징표'를 획득하세요. 24레벨 전설 무기의 봉인을 풀 수 있는 핵심 재료입니다.</p>
                    <p><strong>4. Top8 제련</strong><br>인벤토리의 상위 8칸은 전투 슬롯입니다. 이 슬롯에 들어간 치아가 자동으로 공격합니다.</p>
                    <p><strong>5. 후퇴</strong><br>던전 중 위험하면 좌측 상단의 후퇴 버튼으로 나올 수 있습니다.</p>
                </div>
            `;
        }
    }
};

window.closeGuide = function() {
    const m = document.getElementById('guide-modal');
    if (m) m.style.display = 'none';
};


// --- [ 9. 지옥문 영상 스킵 ] ---
window.skipHellIntro = function() {
    const vid = document.getElementById('hell-video');

    if (vid) {
        vid.pause();
        vid.style.display = 'none';
    }

    const layer = document.getElementById('hell-video-layer');

    if (layer) {
        layer.style.display = 'none';
    }

    const skipBtn = document.getElementById('skip-hell-btn');

    if (skipBtn) {
        skipBtn.style.display = 'none';
    }

    if (window.currentView === 'war' && typeof window.switchView === 'function') {
        window.switchView('war');
    }
};
