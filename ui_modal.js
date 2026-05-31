// Version: 7.5.1 - UI Modal Controllers (Popups, Rankings, Settings, Cutscenes)

// --- [ 1. 인트로 및 컷신 관리 ] ---
window.startIntro = function() {
    const btnLayer = document.getElementById('start-btn-layer');
    if(btnLayer) btnLayer.style.display = 'none';
    
    const vid = document.getElementById('intro-video');
    const skipBtn = document.getElementById('skip-btn');
    if(vid) {
        vid.style.display = 'block';
        if(skipBtn) skipBtn.style.display = 'block';
        vid.volume = window.masterVolume? window.masterVolume * 0.3 : 0.6; 
        vid.muted = window.isMuted; 
        vid.play().catch(e => { window.finishIntro(); });
        vid.onended = () => { setTimeout(window.finishIntro, 500); };
    } else { window.finishIntro(); }
};

window.skipIntro = function() { 
    const vid = document.getElementById('intro-video');
    if(vid) vid.pause(); 
    window.finishIntro(); 
};

window.finishIntro = function() {
    const layer = document.getElementById('intro-layer');
    if(layer) {
        layer.style.transition = 'opacity 1.5s ease';
        layer.style.opacity = '0';
        setTimeout(() => {
            layer.style.display = 'none';
            localStorage.setItem('toothIntroSeen_v7', 'true');
            if(typeof window.checkNicknameAndStart === 'function') window.checkNicknameAndStart();
        }, 1500);
    } else { 
        if(typeof window.checkNicknameAndStart === 'function') window.checkNicknameAndStart(); 
    }
};

window.checkNicknameAndStart = function() {
    if (!window.nickname) {
        const nickInput = document.getElementById('nickname-input');
        if (nickInput) {
            nickInput.value = "User-" + Math.random().toString(36).substr(2, 4);
            document.getElementById('nickname-modal').style.display = 'flex';
        }
    } else { 
        if(typeof window.startGameLoop === 'function') window.startGameLoop(); 
    }
};

window.skipHellIntro = function() {
    const vid = document.getElementById('hell-video');
    if(vid) vid.pause();
    document.getElementById('hell-video-layer').style.display = 'none';
    if(window.currentView === 'war' && typeof window.switchView === 'function') window.switchView('war');
};

window.playAwakenVideo = function() {
    const layer = document.getElementById('awaken-video-layer');
    const vid = document.getElementById('awaken-video');
    const skipBtn = document.getElementById('skip-awaken-btn');
    if(layer && vid) {
        layer.style.display = 'flex';
        vid.style.display = 'block';
        if(skipBtn) skipBtn.style.display = 'block';
        vid.volume = window.masterVolume? window.masterVolume * 0.3 : 0.6;
        vid.muted = window.isMuted;
        vid.play().catch(e => { if(typeof window.skipAwakenIntro === 'function') window.skipAwakenIntro(); });
        vid.onended = () => { setTimeout(() => { if(typeof window.skipAwakenIntro === 'function') window.skipAwakenIntro(); }, 500); };
    }
};

// --- [ 2. 용병 모달 창 ] ---
window.openMercenaryModal = function() {
    const m = document.getElementById('mercenary-modal');
    if(m) { m.style.display = 'flex'; window.renderMercenaryModalList(); }
};

window.closeMercenaryModal = function() {
    const m = document.getElementById('mercenary-modal');
    if(m) m.style.display = 'none';
};

window.renderMercenaryModalList = function() {
    const list = document.getElementById('mercenary-list-modal');
    if(!list || typeof window.TOOTH_DATA === 'undefined') return;
    list.innerHTML = '';
    const maxOwned = Math.max(...window.ownedMercenaries);
    let tier6Text = (window.highestToothLevel >= 16)? `<span style="color:yellow;">(x2)</span>` : "";

    let trainAtk = (window.trainingLevels && window.trainingLevels.atk)? window.trainingLevels.atk * 10 : 0;
    let atkStr = trainAtk > 0? `<span style="color:#2ecc71;">(+${trainAtk}%)</span>` : '';

    window.TOOTH_DATA.mercenaries.forEach(merc => {
        if (merc.id > maxOwned + 1) return;
        const div = document.createElement('div');
        div.className = 'merc-card';
        const isOwned = window.ownedMercenaries.includes(merc.id);
        const isEquipped = window.mercenaryIdx === merc.id;

        div.innerHTML = `
            <div style="font-size:25px;">${merc.icon}</div>
            <div style="font-size:12px; font-weight:bold; margin:5px 0;">${merc.name}</div>
            <div style="font-size:10px; color:#aaa;">공격 x${merc.atkMul} ${tier6Text} ${atkStr}</div>
            <div style="font-size:10px; color:#f55;">HP ${window.fNum? window.fNum(merc.baseHp) : merc.baseHp} <span style="color:#3498db;">| 속도 ${merc.spd.toFixed(1)}</span></div> 
        `;
        if (isEquipped) {
            div.style.border = '2px solid #2ecc71';
            div.innerHTML += `<button class="btn-sm" style="background:#2ecc71; color:white; width:100%; margin-top:5px; cursor:default; box-shadow:none;">장착중</button>`;
        } else if (isOwned) {
            div.innerHTML += `<button onclick="window.equipMerc(${merc.id})" class="btn-sm" style="background:#777; width:100%; margin-top:5px;">장착하기</button>`;
        } else {
            div.innerHTML += `<button onclick="window.buyMerc(${merc.id}, ${merc.cost})" class="btn-gold" style="padding:4px 5px; font-size:11px; width:100%; margin-top:5px;">${window.fNum? window.fNum(merc.cost) : merc.cost}G</button>`;
        }
        list.appendChild(div);
    });
};

window.buyMerc = function(id, cost) { 
    if(window.gold >= cost) { 
        window.gold -= cost; 
        try { if(typeof window.playSfx === 'function') window.playSfx('upgrade'); } catch(e){} 
        window.ownedMercenaries.push(id); 
        window.renderMercenaryModalList(); 
        if(typeof window.renderMercenaryCamp === 'function') window.renderMercenaryCamp();
        if(typeof window.updateUI === 'function') window.updateUI(); 
        if(typeof window.saveGame === 'function') window.saveGame();
    } else { alert("골드가 부족합니다!"); } 
};

window.equipMerc = function(id) { 
    window.mercenaryIdx = id; 
    window.renderMercenaryModalList(); 
    if(typeof window.renderMercenaryCamp === 'function') window.renderMercenaryCamp();
    if(typeof window.saveGame === 'function') window.saveGame(); 
};


// --- [ 3. 티어 달성 및 던전 결과 모달 ] ---
window.showTierUnlock = function(level) {
    const m = document.getElementById('tier-unlock-modal');
    const iconDiv = document.getElementById('tier-unlock-icon');
    const nameDiv = document.getElementById('tier-unlock-name');
    const descDiv = document.getElementById('tier-unlock-desc');
    
    if(m && iconDiv && nameDiv && descDiv) {
        iconDiv.innerHTML = typeof window.getToothIcon === 'function'? window.getToothIcon(level) : "🦷";
        nameDiv.innerText = typeof window.getToothName === 'function'? window.getToothName(level) : `Lv.${level}`;
        
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
        try { if(typeof window.playSfx === 'function') window.playSfx('unlock'); } catch(e){}
    }
};

window.closeTierUnlock = function() {
    const m = document.getElementById('tier-unlock-modal');
    if(m) m.style.display = 'none';
};

window.showResultModal = function() {
    const modal = document.getElementById('dungeon-result-modal');
    if(!modal || typeof window.TOOTH_DATA === 'undefined') return;
    modal.style.display = 'flex';
    
    let dName = window.isHellMode? window.TOOTH_DATA.hellDungeons : window.TOOTH_DATA.dungeons;
    if (window.isBossRush) dName = `[토벌전] ` + dName;
    document.getElementById('result-title').innerText = `${dName} CLEAR!`;
    
    let nextStr = "";
    
    if (!window.isBossRush) {
        if (window.isHellMode) {
            if (window.unlockedHellDungeon <= window.currentDungeonIdx + 1 && window.currentDungeonIdx < 19) {
                window.unlockedHellDungeon = window.currentDungeonIdx + 2;
                nextStr = `신규 HELL 던전 오픈!`;
            }
        } else {
            if (window.currentDungeonIdx === 19 && window.unlockedDungeon === 20) {
                window.unlockedDungeon = 21;
                nextStr = `🔥 경고: 지옥문이 열렸습니다... 🔥`;
                setTimeout(() => {
                    const layer = document.getElementById('hell-video-layer');
                    const vid = document.getElementById('hell-video');
                    const skipBtn = document.getElementById('skip-hell-btn');
                    if(layer && vid) {
                        layer.style.display = 'flex';
                        vid.style.display = 'block';
                        if(skipBtn) skipBtn.style.display = 'block';
                        vid.volume = window.masterVolume? window.masterVolume * 0.3 : 0.6;
                        vid.muted = window.isMuted;
                        vid.play().catch(e => { window.skipHellIntro(); });
                        vid.onended = () => { setTimeout(window.skipHellIntro, 500); };
                    }
                }, 1500);
            } 
            else if (window.unlockedDungeon <= window.currentDungeonIdx + 1 && window.currentDungeonIdx < 19) {
                window.unlockedDungeon = window.currentDungeonIdx + 2;
                nextStr = `신규 던전 오픈!`;
            }
        }
    }

    let markHtml = "";
    if (window.isBossRush) {
        let earnedMarks = window.isHellMode? 2 : 1;
        if(window.bossMarks === undefined) window.bossMarks = 0;
        window.bossMarks += earnedMarks;
        markHtml = `<div style="color:#e74c3c; font-weight:bold; margin-top:5px;">획득한 보스 징표: +${earnedMarks}개 (총 ${window.bossMarks}개)</div>`;
    }

    document.getElementById('result-desc').innerHTML = `
        <div style="margin: 15px 0; font-size:16px;">
            골드: <span style="color:var(--gold); font-weight:bold;">+${window.fNum? window.fNum(window.dungeonGoldEarned) : window.dungeonGoldEarned}G</span><br>
            다이아: <span style="color:#ff4757; font-weight:bold;">+${window.dungeonDiaEarned}♦️</span>
            ${markHtml}
        </div>
        <div style="color:#2ecc71; font-weight:bold; font-size:12px;">${nextStr}</div>
    `;

    const artArea = document.getElementById('result-artifact-area');
    if (window.dungeonArtifactDropped && window.dungeonArtifactDropped.count > 0) {
        artArea.innerHTML = `<div style="background:#222; border:2px dashed var(--gold); padding:10px; border-radius:4px; display:inline-block; animation: pulse 1s infinite alternate;">
            <div style="font-size:10px; color:#aaa; margin-bottom:5px;">🎊 유물 발견! 🎊</div>
            <div style="font-size:20px;">${window.dungeonArtifactDropped.icon} <span style="font-size:14px; color:white;">${window.dungeonArtifactDropped.name}</span></div>
        </div>`;
    } else {
        artArea.innerHTML = `<div style="font-size:11px; color:#555;">(발견된 유물 없음)</div>`;
    }

    const btnNext = document.getElementById('btn-next-dungeon');
    if (window.isBossRush || window.currentDungeonIdx >= 19) {
        btnNext.style.display = 'none';
    } else {
        btnNext.style.display = 'block';
    }

    if(typeof window.saveGame === 'function') window.saveGame();
};

window.closeResultModal = function() {
    const modal = document.getElementById('dungeon-result-modal');
    if(modal) modal.style.display = 'none';
    if(typeof window.exitDungeon === 'function') window.exitDungeon();
};

window.retryDungeon = function() {
    const modal = document.getElementById('dungeon-result-modal');
    if(modal) modal.style.display = 'none';
    if(typeof window.exitDungeon === 'function') window.exitDungeon();
    
    setTimeout(() => {
        if(typeof window.startDungeon === 'function') window.startDungeon(window.currentDungeonIdx);
    }, 100);
};

window.nextDungeon = function() {
    const modal = document.getElementById('dungeon-result-modal');
    if(modal) modal.style.display = 'none';
    if(typeof window.exitDungeon === 'function') window.exitDungeon();
    
    setTimeout(() => {
        if(typeof window.startDungeon === 'function') window.startDungeon(window.currentDungeonIdx + 1);
    }, 100);
};


// --- [ 4. 도감 관리 ] ---
window.openCodex = function() {
    const m = document.getElementById('codex-modal');
    if(m) { m.style.display = 'flex'; if(typeof window.renderCodex === 'function') window.renderCodex(); }
};
window.closeCodex = function() {
    const m = document.getElementById('codex-modal');
    if(m) m.style.display = 'none';
};

window.openArtifacts = function() {
    const m = document.getElementById('artifact-modal');
    if(m) { m.style.display = 'flex'; if(typeof window.renderArtifacts === 'function') window.renderArtifacts(); }
};
window.closeArtifacts = function() {
    const m = document.getElementById('artifact-modal');
    if(m) m.style.display = 'none';
};


// --- [ 5. 전설의 무기 (24레벨) 봉인 해제 ] ---
window.openLockedToothModal = function(slotIdx) {
    window.lockedToothSlotIdx = slotIdx;
    const m = document.getElementById('locked-tooth-modal');
    if(m) {
        m.style.display = 'flex';
        window.renderUnlockRequirements();
    }
};

window.closeLockedToothModal = function() {
    const m = document.getElementById('locked-tooth-modal');
    if(m) m.style.display = 'none';
};

window.renderUnlockRequirements = function() {
    const reqDiv = document.getElementById('unlock-requirements');
    const btn = document.getElementById('btn-unlock-tooth');
    if(!reqDiv ||!btn || typeof window.TOOTH_DATA === 'undefined') return;

    const req = window.TOOTH_DATA.AWAKEN_REQ;
    if(window.bossMarks === undefined) window.bossMarks = 0;
    
    const goldOk = window.gold >= req.gold;
    const diaOk = window.dia >= req.dia;
    const marksOk = window.bossMarks >= req.bossMarks;
    
    reqDiv.innerHTML = `
        <div style="margin-bottom:5px; color:${goldOk? '#2ecc71' : '#e74c3c'};">
            💰 골드: ${window.fNum? window.fNum(window.gold) : window.gold} / ${window.fNum? window.fNum(req.gold) : req.gold}
        </div>
        <div style="margin-bottom:5px; color:${diaOk? '#2ecc71' : '#e74c3c'};">
            ♦️ 다이아: ${window.fNum? window.fNum(window.dia) : window.dia} / ${window.fNum? window.fNum(req.dia) : req.dia}
        </div>
        <div style="color:${marksOk? '#2ecc71' : '#e74c3c'};">
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
};

window.attemptUnlockTooth = function() {
    const req = window.TOOTH_DATA.AWAKEN_REQ;
    if (window.gold >= req.gold && window.dia >= req.dia && window.bossMarks >= req.bossMarks) {
        if(confirm("모든 재화를 소모하여 진정한 전설의 치아를 해방하시겠습니까?")) {
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
            
            if(typeof window.renderInventory === 'function') window.renderInventory();
            if(typeof window.updateUI === 'function') window.updateUI();
            if(typeof window.saveGame === 'function') window.saveGame();
        }
    }
};

window.skipAwakenIntro = function() {
    const vid = document.getElementById('awaken-video');
    if(vid) vid.pause();
    const layer = document.getElementById('awaken-video-layer');
    if(layer) layer.style.display = 'none';
    
    try { if(typeof window.playSfx === 'function') window.playSfx('awaken'); } catch(e){}
    const body = document.body;
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.top = '0'; flash.style.left = '0';
    flash.style.width = '100%'; flash.style.height = '100%';
    flash.style.background = 'white';
    flash.style.zIndex = '40000';
    flash.style.animation = 'splashFade 2s ease-out forwards';
    body.appendChild(flash);
    setTimeout(() => flash.remove(), 2000);
    
    alert("👑 세계관 최강의 무기, [진(眞) 절대자의 치아]가 봉인을 깨고 강림했습니다! 👑\n공격력이 상상을 초월합니다!");
    if(typeof window.renderInventory === 'function') window.renderInventory();
};


// --- [ 6. 명예의 전당 (가상 랭킹) ] ---
window.generateRankings = function() {
    const list = document.getElementById('ranking-list');
    if(!list || typeof window.TOOTH_DATA === 'undefined') return;
    
    if (!window.fakeUsers || window.fakeUsers.length === 0) {
        window.fakeUsers =;
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        
        for(let i=0; i<500; i++) {
            let fakePower = Math.floor(Math.pow(Math.random(), 3) * 8000000) + 1000;
            let fakeD = Math.floor(Math.random() * 20) + 1;
            window.fakeUsers.push({ p: fakePower, d: fakeD, isMe: false });
        }
        
        window.fakeUsers.sort((a, b) => b.p - a.p);
        
        let top10Indices = ;
        top10Indices.sort(() => Math.random() - 0.5);
        let realNameIndices = top10Indices.slice(0, 5);
        let realNames =.sort(() => Math.random() - 0.5);

        for(let i=0; i<500; i++) {
            if (i < 10 && realNameIndices.includes(i)) {
                window.fakeUsers[i].name = realNames.pop();
            } else {
                let hash = '';
                for(let j=0; j<4; j++) hash += chars.charAt(Math.floor(Math.random()*chars.length));
                window.fakeUsers[i].name = `User-${hash}`;
            }
        }
    }

    let myPower = typeof window.getAtk === 'function'? window.getAtk(window.highestToothLevel) : 10;
    if (window.TOOTH_DATA.mercenaries[window.mercenaryIdx]) myPower *= window.TOOTH_DATA.mercenaries[window.mercenaryIdx].atkMul;
    
    let ranks = [...window.fakeUsers]; 
    let myData = { name: window.nickname || "나", d: window.unlockedDungeon, p: myPower, isMe: true };
    ranks.push(myData);
    
    ranks.sort((a, b) => b.p - a.p);
    
    let html = ''; 
    let myRankIdx = ranks.findIndex(r => r.isMe);
    let myRank = myRankIdx + 1;

    ranks.forEach((r, idx) => {
        let isTop10 = idx < 10;
        let isNearMe = Math.abs(idx - myRankIdx) <= 5;

        if (idx === 10 && myRankIdx > 15) {
            html += `<div style="text-align:center; color:#555; font-size:14px; padding:5px 0;">......</div>`;
        }

        if (isTop10 || isNearMe) {
            let rankColor = r.isMe? 'color:var(--gold); font-weight:bold; background:rgba(241, 196, 15, 0.1);' : 'color:#ccc;';
            if (idx === 0) rankColor += 'color:#ff4757; text-shadow:0 0 5px red; font-size:14px;'; 
            
            html += `<div style="display:flex; justify-content:space-between; padding:8px 5px; border-bottom:1px solid #333; ${rankColor}">
                <span style="width:15%; text-align:center;">${idx+1}</span><span style="flex:1; text-align:center;">${r.name}</span>
                <span style="width:20%; text-align:center;">Lv.${r.d}</span><span style="width:25%; text-align:right;">${window.fNum? window.fNum(r.p) : r.p}</span>
            </div>`;
        }
    });
    
    list.innerHTML = html;
    const rankDisp = document.getElementById('my-rank-display');
    if(rankDisp) rankDisp.innerText = `내 순위: ${myRank}위 / ${ranks.length}명 (전투력: ${window.fNum? window.fNum(myPower) : myPower})`;
};

window.openRanking = function() {
    const m = document.getElementById('ranking-modal');
    if(m) { m.style.display = 'flex'; if(typeof window.generateRankings === 'function') window.generateRankings(); }
};
window.closeRanking = function() {
    const m = document.getElementById('ranking-modal');
    if(m) m.style.display = 'none';
};


// --- [ 7. 설정 및 공통 유틸 모달 ] ---
window.openSettings = function() {
    const m = document.getElementById('settings-modal');
    if(m) { 
        m.style.display = 'flex'; 
        const nickDisp = document.getElementById('current-nickname-display');
        if(nickDisp) nickDisp.innerText = window.nickname || "설정안됨";
    }
};
window.closeSettings = function() {
    const m = document.getElementById('settings-modal');
    if(m) m.style.display = 'none';
};

window.openNicknameChange = function() {
    const m = document.getElementById('nickname-modal');
    if(m) {
        m.style.display = 'flex';
        const input = document.getElementById('nickname-input');
        if(input) input.value = window.nickname || "";
    }
};

window.confirmNickname = function() {
    const input = document.getElementById('nickname-input').value.trim();
    if(input.length > 0) {
        window.nickname = input;
        document.getElementById('nickname-modal').style.display = 'none';
        
        const nickDisp = document.getElementById('current-nickname-display');
        if(nickDisp) nickDisp.innerText = window.nickname;

        if(typeof window.saveGame === 'function') window.saveGame(); 
        
        if (!window.gameLoopInterval) {
            if(typeof window.startGameLoop === 'function') window.startGameLoop(); 
        } else {
            alert("닉네임이 성공적으로 변경되었습니다!");
            if(typeof window.generateRankings === 'function') window.generateRankings(); 
        }
    } else { alert("닉네임을 입력해주세요."); }
};

window.exportSaveCode = function() {
    const saveData = localStorage.getItem('toothSaveV700') || localStorage.getItem('toothSaveV695');
    if (saveData) {
        try {
            const encoded = btoa(encodeURIComponent(saveData));
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(encoded).then(() => {
                    alert("✅ 저장 코드가 클립보드에 자동 복사되었습니다! 메모장에 붙여넣기 하여 보관하세요.");
                }).catch(err => {
                    prompt("클립보드 복사 실패. 아래 코드를 전체 선택하여 복사하세요:", encoded);
                });
            } else {
                prompt("클립보드 권한이 없습니다. 아래 코드를 전체 선택하여 복사하세요:", encoded);
            }
        } catch (e) { alert("코드 생성 중 오류가 발생했습니다."); }
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

window.checkCoupon = function(code) { 
    if (code === "100b" || code === "RICH100B") { 
        window.gold += 100000000000; 
        alert("치트키 적용!"); 
        if(typeof window.updateUI === 'function') window.updateUI(); 
        if(typeof window.saveGame === 'function') window.saveGame(); 
    } 
    else if (code === "DIA100") { 
        window.dia += 10000; 
        alert("다이아 치트 적용!"); 
        if(typeof window.updateUI === 'function') window.updateUI(); 
        if(typeof window.saveGame === 'function') window.saveGame(); 
    }
    else if (code === "TEST") { 
        window.gold += 1e25; 
        window.dia += 999999; 
        alert("테스트용 절대 재화가 지급되었습니다!"); 
        if(typeof window.updateUI === 'function') window.updateUI(); 
        if(typeof window.saveGame === 'function') window.saveGame();
    }
    else if (code === "HELLTEST") {
        window.unlockedDungeon = 20; 
        window.gold += 1e15; 
        window.dia += 100000; 
        window.bossMarks += 100;
        for(let i=0; i<30; i++) window.artifactCounts[i] = 1; 
        alert("🔥 [각성 테스트 완료] 1,000조 골드 / 10만 다이아 / 보스징표 100개 / 유물 올클리어!\n이제 23레벨 2개를 합쳐 봉인을 해제해보세요!");
        if(typeof window.updateUI === 'function') window.updateUI(); 
        if(typeof window.saveGame === 'function') window.saveGame();
        if(typeof window.renderDungeonList === 'function') window.renderDungeonList();
        if(typeof window.renderArtifacts === 'function') window.renderArtifacts();
    }
    else { alert("유효하지 않은 쿠폰입니다."); } 
};

window.toggleSound = function() {
    window.isMuted =!window.isMuted;
    if(typeof window.saveGame === 'function') window.saveGame();
    window.updateSoundBtn();
};

window.updateSoundBtn = function() {
    const btn = document.getElementById('sound-toggle-btn');
    if(btn) btn.innerText = window.isMuted? "🔇 BGM/SFX OFF" : "🔊 BGM/SFX ON";
};

window.changeVolume = function() {
    const val = document.getElementById('volume-slider').value;
    window.masterVolume = parseInt(val);
    if(typeof window.saveGame === 'function') window.saveGame();
    try { if(typeof window.playSfx === 'function') window.playSfx('hit'); } catch(e){}
};

window.checkReset = function() {
    if(confirm("정말로 모든 데이터를 삭제하시겠습니까? 복구할 수 없습니다!")) {
        window.isResetting = true;
        localStorage.clear(); 
        location.reload();
    }
};

window.openGuide = function() {
    const m = document.getElementById('guide-modal');
    if(m) {
        m.style.display = 'flex';
        document.getElementById('guide-scroll-content').innerHTML = `
            <div style="padding-top:10px;">
                <h3 style="color:var(--gold);">🦷 치아 연대기 레트로 가이드</h3>
                <p><strong>1. 채굴과 합성 (24단계)</strong><br>치아를 캐고 합쳐서 다음 단계로 나아가세요. 23레벨 2개를 합치면 전설의 치아가 탄생합니다!</p>
                <p><strong>2. 유물 파밍 시스템 (NEW)</strong><br>던전 보스를 잡고 '유물'을 1개씩 수집하세요. 완성된 유물이 <strong>3종류가 될 때마다 기본 채굴 레벨이 +1 영구 상승</strong>합니다!</p>
                <p><strong>3. 보스 토벌전 & 봉인 해제</strong><br>토벌전에서 살아남아 '보스 징표'를 획득하세요. 24레벨 전설 무기의 봉인을 풀 수 있는 핵심 재료입니다.</p>
            </div>
        `;
    }
};

window.closeGuide = function() {
    const m = document.getElementById('guide-modal');
    if(m) m.style.display = 'none';
};
