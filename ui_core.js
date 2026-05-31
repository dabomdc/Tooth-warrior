// Version: 8.0.0 - Core UI, View Switch, Dungeon List, Result, Mercenary Camp

// --- [ 1. 메인 뷰 전환 ] ---
window.switchView = function(viewName) {
    window.currentView = viewName;

    const mineView = document.getElementById('mine-view');
    const inventorySection = document.getElementById('inventory-section');
    const refineView = document.getElementById('refine-view');
    const warView = document.getElementById('war-view');

    const tabMine = document.getElementById('tab-mine');
    const tabRefine = document.getElementById('tab-refine');
    const tabWar = document.getElementById('tab-war');

    if (mineView) mineView.style.display = 'none';
    if (inventorySection) inventorySection.style.display = 'none';
    if (refineView) refineView.style.display = 'none';
    if (warView) warView.style.display = 'none';
    
    if (tabMine) tabMine.classList.remove('active');
    if (tabRefine) tabRefine.classList.remove('active');
    if (tabWar) tabWar.classList.remove('active');
    
    if (viewName === 'mine') {
        if (mineView) mineView.style.display = 'flex';
        if (inventorySection) inventorySection.style.display = 'flex';
        if (tabMine) tabMine.classList.add('active');

        if (typeof window.renderInventory === 'function') {
            window.renderInventory();
        }
    } 
    else if (viewName === 'refine') {
        if (refineView) refineView.style.display = 'flex';
        if (tabRefine) tabRefine.classList.add('active');

        if (typeof window.renderRefineView === 'function') {
            window.renderRefineView();
        }
    } 
    else if (viewName === 'war') {
        if (warView) warView.style.display = 'flex';
        if (tabWar) tabWar.classList.add('active');
        
        const hellTab = document.getElementById('d-tab-hell');
        const hellBossTab = document.getElementById('d-tab-hellboss');

        if (window.unlockedDungeon > 20) {
            if (hellTab) hellTab.style.display = 'inline-block';
            if (hellBossTab) hellBossTab.style.display = 'inline-block';
        }
        
        if (typeof window.renderMercenaryCamp === 'function') {
            window.renderMercenaryCamp();
        }

        if (typeof window.switchDungeonTab === 'function') {
            window.switchDungeonTab(window.currentDungeonTab || 'normal'); 
        }
    }
    
    try { 
        if (typeof window.playSfx === 'function') window.playSfx('hit'); 
    } catch(e) {}
};


// --- [ 2. 던전 탭 전환 ] ---
window.switchDungeonTab = function(tabName) {
    window.currentDungeonTab = tabName;
    
    document.querySelectorAll('.war-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const tabBtn = document.getElementById('d-tab-' + tabName);
    if (tabBtn) tabBtn.classList.add('active');
    
    const bossInfo = document.getElementById('boss-rush-info');

    if (bossInfo) {
        if (tabName === 'boss' || tabName === 'hellboss') {
            bossInfo.style.display = 'block';
        } else {
            bossInfo.style.display = 'none';
        }
    }
    
    if (typeof window.renderDungeonList === 'function') {
        window.renderDungeonList();
    }
};


// --- [ 3. 용병 캠프 ] ---
window.renderMercenaryCamp = function() { 
    const display = document.getElementById('current-mercenary-display');

    if (!display || typeof window.TOOTH_DATA === 'undefined') return;

    const curId = window.mercenaryIdx;
    const merc = window.TOOTH_DATA.mercenaries[curId];

    if (!merc) return;

    let bonusText = "";

    if (window.highestToothLevel >= 16) {
        bonusText = `<div style="color:#2ecc71; font-size:10px; font-weight:bold; margin-top:3px;">✨ 16치아 보너스: 공격력 x2 적용 중!</div>`;
    }

    let trainAtk = (window.trainingLevels && window.trainingLevels.atk) ? window.trainingLevels.atk * 10 : 0;
    let trainHp = (window.trainingLevels && window.trainingLevels.hp) ? window.trainingLevels.hp * 5 : 0;
    let trainSpd = (window.trainingLevels && window.trainingLevels.spd) ? window.trainingLevels.spd * 10 : 0;

    let atkStr = trainAtk > 0 ? `<span style="color:#2ecc71; font-weight:bold;">(+${trainAtk}%)</span>` : '';
    let hpStr = trainHp > 0 ? `<span style="color:#2ecc71; font-weight:bold;">(+${trainHp}%)</span>` : '';
    let spdStr = trainSpd > 0 ? `<span style="color:#2ecc71; font-weight:bold;">(+${trainSpd}%)</span>` : '';

    let critLv = (window.trainingLevels && window.trainingLevels.crit) ? window.trainingLevels.crit : 0;
    let splashDmgLv = (window.trainingLevels && window.trainingLevels.splashDmg) ? window.trainingLevels.splashDmg : 0;
    let splashRangeLv = (window.trainingLevels && window.trainingLevels.splashRange) ? window.trainingLevels.splashRange : 0;

    let critChance = 5 + (critLv * 2); 
    let critMul = 2.0 + (critLv * 0.2);
    let splashRatio = 20 + (splashDmgLv * 5); 
    let splashRange = 50 + (splashRangeLv * 10); 

    let advStatsHtml = "";

    if (window.highestToothLevel >= 7 || critLv > 0 || splashDmgLv > 0) {
        advStatsHtml = `<div style="font-size:10px; color:#f1c40f; margin-top:3px; font-weight:bold;">
            ⚡치명타: ${critChance}% (x${critMul.toFixed(1)}) | 💥광역: ${splashRatio}% (${splashRange}px)
        </div>`;
    }

    display.innerHTML = `
        <div style="font-size:40px; background:#1a1a2e; width:60px; height:60px; display:flex; align-items:center; justify-content:center; border:2px solid #555; box-shadow: 2px 2px 0 #000;">${merc.icon}</div>
        <div style="flex:1;">
            <div style="font-size:16px; font-weight:bold; color:white;">${merc.name} <span style="font-size:12px; color:#aaa; font-weight:normal;">(Lv.${curId})</span></div>
            <div style="font-size:11px; color:#ccc; margin-top:2px;">
                공격 x<span style="color:var(--gold);">${merc.atkMul}</span> ${atkStr} | 
                체력 <span style="color:#ff4757;">${window.safeFNum ? window.safeFNum(merc.baseHp) : merc.baseHp}</span> ${hpStr} | 
                이동속도 <span style="color:#3498db;">${merc.spd.toFixed(1)}</span> ${spdStr}
            </div>
            ${advStatsHtml}
            ${bonusText}
        </div>
    `;
};


// --- [ 4. 용병 모달 ] ---
window.openMercenaryModal = function() {
    const m = document.getElementById('mercenary-modal');

    if (m) { 
        m.style.display = 'flex'; 

        if (typeof window.renderMercenaryModalList === 'function') {
            window.renderMercenaryModalList(); 
        }
    }
};

window.closeMercenaryModal = function() {
    const m = document.getElementById('mercenary-modal');
    if (m) m.style.display = 'none';
};

window.renderMercenaryModalList = function() {
    const list = document.getElementById('mercenary-list-modal');

    if (!list || typeof window.TOOTH_DATA === 'undefined') return;

    list.innerHTML = '';

    const maxOwned = Math.max(...window.ownedMercenaries);
    let tier6Text = (window.highestToothLevel >= 16) ? `<span style="color:yellow;">(x2)</span>` : "";

    let trainAtk = (window.trainingLevels && window.trainingLevels.atk) ? window.trainingLevels.atk * 10 : 0;
    let atkStr = trainAtk > 0 ? `<span style="color:#2ecc71;">(+${trainAtk}%)</span>` : '';

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
            <div style="font-size:10px; color:#f55;">HP ${window.safeFNum ? window.safeFNum(merc.baseHp) : merc.baseHp} <span style="color:#3498db;">| 속도 ${merc.spd.toFixed(1)}</span></div> 
        `;

        if (isEquipped) {
            div.style.border = '2px solid #2ecc71';
            div.innerHTML += `<button class="btn-sm" style="background:#2ecc71; color:white; width:100%; margin-top:5px; cursor:default; box-shadow:none;">장착중</button>`;
        } 
        else if (isOwned) {
            div.innerHTML += `<button onclick="window.equipMerc(${merc.id})" class="btn-sm" style="background:#777; width:100%; margin-top:5px;">장착하기</button>`;
        } 
        else {
            div.innerHTML += `<button onclick="window.buyMerc(${merc.id}, ${merc.cost})" class="btn-gold" style="padding:4px 5px; font-size:11px; width:100%; margin-top:5px;">${window.safeFNum ? window.safeFNum(merc.cost) : merc.cost}G</button>`;
        }

        list.appendChild(div);
    });
};

window.buyMerc = function(id, cost) { 
    if (window.gold >= cost) { 
        window.gold -= cost; 

        try { 
            if (typeof window.playSfx === 'function') window.playSfx('upgrade'); 
        } catch(e) {} 

        window.ownedMercenaries.push(id); 

        if (typeof window.renderMercenaryModalList === 'function') {
            window.renderMercenaryModalList(); 
        }

        if (typeof window.renderMercenaryCamp === 'function') {
            window.renderMercenaryCamp();
        }

        if (typeof window.updateUI === 'function') {
            window.updateUI(); 
        }

        if (typeof window.saveGame === 'function') {
            window.saveGame();
        }
    } else { 
        alert("골드가 부족합니다!"); 
    } 
};

window.equipMerc = function(id) { 
    window.mercenaryIdx = id; 

    if (typeof window.renderMercenaryModalList === 'function') {
        window.renderMercenaryModalList(); 
    }

    if (typeof window.renderMercenaryCamp === 'function') {
        window.renderMercenaryCamp();
    }

    if (typeof window.saveGame === 'function') {
        window.saveGame(); 
    }
};


// --- [ 5. 던전 리스트 렌더링 ] ---
window.renderDungeonList = function() { 
    const list = document.getElementById('dungeon-list'); 

    if (!list || typeof window.TOOTH_DATA === 'undefined') return;

    list.innerHTML = ''; 
    
    const tab = window.currentDungeonTab || 'normal';
    const isHell = (tab === 'hell' || tab === 'hellboss');
    const isBoss = (tab === 'boss' || tab === 'hellboss');
    const currentUnlocked = isHell ? window.unlockedHellDungeon : window.unlockedDungeon;
    
    if (isBoss) {
        const rushNames = isHell ? 
            ["HELL 1~5구간", "HELL 6~10구간", "HELL 11~15구간", "HELL 16~20구간"] :
            ["일반 1~5구간", "일반 6~10구간", "일반 11~15구간", "일반 16~20구간"];
        
        rushNames.forEach((name, i) => {
            const reqLevel = (i * 5) + 6; 
            const isUnlocked = currentUnlocked >= reqLevel;

            const div = document.createElement('div'); 
            div.className = `dungeon-card ${isUnlocked ? 'unlocked' : 'locked'}`; 
            
            let goldFee = Math.floor(5000 * Math.pow(2.0, i * 5));
            let diaFee = 5 + ((i * 5) * 5);

            if (isHell) { 
                goldFee *= 10; 
                diaFee *= 5; 
            }

            if (isUnlocked) {
                div.innerHTML = `
                    <h4 style="margin:0;">🔥 ${name} 보스 토벌전</h4>
                    <p style="margin:5px 0 0 0; font-size:12px; color:#ff8888;">입장료: <span style="color:var(--gold);">${window.safeFNum ? window.safeFNum(goldFee) : goldFee}G</span>, ♦️${diaFee}</p>
                    <p style="color:#f1c40f; font-size:11px; margin:5px 0 0 0;">보스 5연속 처치 시 엄청난 보상 & 보스 징표 획득!</p>
                `;

                div.onclick = function() { 
                    if (typeof window.startDungeon === 'function') {
                        window.startDungeon(i * 5); 
                    }
                };
            } else {
                div.innerHTML = `
                    <h4 style="margin:0;">🔒 잠김</h4>
                    <p style="margin:5px 0 0 0; font-size:12px; color:#888;">${isHell ? 'HELL ' : '일반 '}던전 ${reqLevel - 1}단계 클리어 시 열림</p>
                `;
            }

            list.appendChild(div);
        });
    } 
    else {
        const dungeonData = isHell ? window.TOOTH_DATA.hellDungeons : window.TOOTH_DATA.dungeons;

        dungeonData.forEach((name, idx) => { 
            const div = document.createElement('div'); 
            const isUnlocked = idx < currentUnlocked; 

            div.className = `dungeon-card ${isUnlocked ? 'unlocked' : 'locked'}`; 
            
            let baseHp = Math.floor(100 * Math.pow(isHell ? 2.5 : 2.2, idx));

            if (isHell) baseHp *= 50;

            const recAtk = (baseHp * 30) / 40;

            let artifactIdx = isHell ? idx + 20 : idx;
            let artifactHtml = "";

            if (window.artifactCounts === undefined) {
                window.artifactCounts = new Array(30).fill(0);
            }

            if (window.TOOTH_DATA.artifacts[artifactIdx]) {
                const art = window.TOOTH_DATA.artifacts[artifactIdx];
                const myCount = window.artifactCounts[artifactIdx] || 0;

                artifactHtml = `
                    <div style="margin-top:8px; padding-top:8px; border-top:1px dashed #555; font-size:11px; color:#ccc; display:flex; justify-content:space-between; align-items:center;">
                        <span>드랍 유물: ${art.icon} ${art.name}</span>
                        <span style="color:${myCount >= 1 ? '#2ecc71' : '#f39c12'};">보유: ${myCount}/1</span>
                    </div>
                `;
            }

            if (isUnlocked) { 
                div.innerHTML = `
                    <h4 style="margin:0;">⚔️ Lv.${idx + 1} ${name}</h4>
                    <p style="margin:5px 0 0 0; font-size:12px; color:#aaa;">권장 공격력: ${window.safeFNum ? window.safeFNum(recAtk) : recAtk}+</p>
                    ${artifactHtml}
                `;

                div.onclick = function() { 
                    if (typeof window.startDungeon === 'function') {
                        window.startDungeon(idx); 
                    }
                };
            } else { 
                div.innerHTML = `
                    <h4 style="margin:0;">🔒 잠김</h4>
                    <p style="margin:5px 0 0 0; font-size:12px; color:#888;">이전 던전 클리어 시 열림</p>
                `; 
            } 

            list.appendChild(div); 
        }); 
    }
};


// --- [ 6. 던전 결과 팝업 ] ---
window.showResultModal = function() {
    const modal = document.getElementById('dungeon-result-modal');

    if (!modal || typeof window.TOOTH_DATA === 'undefined') return;

    modal.style.display = 'flex';
    
    let dName = window.isHellMode ? 
        window.TOOTH_DATA.hellDungeons[window.currentDungeonIdx] : 
        window.TOOTH_DATA.dungeons[window.currentDungeonIdx];

    if (window.isBossRush) {
        dName = `[토벌전] ` + dName;
    }

    const titleEl = document.getElementById('result-title');
    if (titleEl) titleEl.innerText = `${dName} CLEAR!`;
    
    let nextStr = "";
    
    if (!window.isBossRush) {
        if (window.isHellMode) {
            if (window.unlockedHellDungeon <= window.currentDungeonIdx + 1 && window.currentDungeonIdx < 19) {
                window.unlockedHellDungeon = window.currentDungeonIdx + 2;
                nextStr = `신규 HELL 던전 오픈!`;
            }
        } 
        else {
            if (window.currentDungeonIdx === 19 && window.unlockedDungeon === 20) {
                window.unlockedDungeon = 21;
                nextStr = `🔥 경고: 지옥문이 열렸습니다... 🔥`;

                setTimeout(() => {
                    const layer = document.getElementById('hell-video-layer');
                    const vid = document.getElementById('hell-video');
                    const skipBtn = document.getElementById('skip-hell-btn');

                    if (layer && vid) {
                        layer.style.display = 'flex';
                        vid.style.display = 'block';

                        if (skipBtn) skipBtn.style.display = 'block';

                        vid.volume = window.masterVolume ? window.masterVolume * 0.3 : 0.6;
                        vid.muted = window.isMuted;

                        vid.play().catch(() => { 
                            if (typeof window.skipHellIntro === 'function') {
                                window.skipHellIntro(); 
                            }
                        });

                        vid.onended = function() { 
                            setTimeout(window.skipHellIntro, 500); 
                        };
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
        let earnedMarks = window.isHellMode ? 2 : 1;

        if (window.bossMarks === undefined) {
            window.bossMarks = 0;
        }

        window.bossMarks += earnedMarks;

        markHtml = `<div style="color:#e74c3c; font-weight:bold; margin-top:5px;">획득한 보스 징표: +${earnedMarks}개 (총 ${window.bossMarks}개)</div>`;
    }

    const descEl = document.getElementById('result-desc');

    if (descEl) {
        descEl.innerHTML = `
            <div style="margin: 15px 0; font-size:16px;">
                골드: <span style="color:var(--gold); font-weight:bold;">+${window.safeFNum ? window.safeFNum(window.dungeonGoldEarned) : window.dungeonGoldEarned}G</span><br>
                다이아: <span style="color:#ff4757; font-weight:bold;">+${window.dungeonDiaEarned}♦️</span>
                ${markHtml}
            </div>
            <div style="color:#2ecc71; font-weight:bold; font-size:12px;">${nextStr}</div>
        `;
    }

    const artArea = document.getElementById('result-artifact-area');

    if (artArea) {
        if (window.dungeonArtifactDropped && window.dungeonArtifactDropped.count > 0) {
            artArea.innerHTML = `
                <div style="background:#222; border:2px dashed var(--gold); padding:10px; border-radius:4px; display:inline-block; animation: pulse 1s infinite alternate;">
                    <div style="font-size:10px; color:#aaa; margin-bottom:5px;">🎊 유물 발견! 🎊</div>
                    <div style="font-size:20px;">${window.dungeonArtifactDropped.icon} <span style="font-size:14px; color:white;">${window.dungeonArtifactDropped.name}</span></div>
                </div>
            `;
        } else {
            artArea.innerHTML = `<div style="font-size:11px; color:#555;">(발견된 유물 없음)</div>`;
        }
    }

    const btnNext = document.getElementById('btn-next-dungeon');

    if (btnNext) {
        if (window.isBossRush || window.currentDungeonIdx >= 19) {
            btnNext.style.display = 'none';
        } else {
            btnNext.style.display = 'block';
        }
    }

    if (typeof window.saveGame === 'function') {
        window.saveGame();
    }
};

window.closeResultModal = function() {
    const modal = document.getElementById('dungeon-result-modal');

    if (modal) {
        modal.style.display = 'none';
    }

    if (typeof window.exitDungeon === 'function') {
        window.exitDungeon();
    }
};

window.retryDungeon = function() {
    const modal = document.getElementById('dungeon-result-modal');

    if (modal) {
        modal.style.display = 'none';
    }

    if (typeof window.exitDungeon === 'function') {
        window.exitDungeon();
    }
    
    setTimeout(() => {
        if (typeof window.startDungeon === 'function') {
            window.startDungeon(window.currentDungeonIdx);
        }
    }, 100);
};

window.nextDungeon = function() {
    const modal = document.getElementById('dungeon-result-modal');

    if (modal) {
        modal.style.display = 'none';
    }

    if (typeof window.exitDungeon === 'function') {
        window.exitDungeon();
    }
    
    setTimeout(() => {
        if (typeof window.startDungeon === 'function') {
            window.startDungeon(window.currentDungeonIdx + 1);
        }
    }, 100);
};


// --- [ 7. 기본 UI 업데이트 ] ---
window.updateUI = function() { 
    const gd = document.getElementById('gold-display');

    if (gd) {
        gd.innerText = window.safeFNum ? window.safeFNum(window.gold) : window.gold; 
    }

    const dd = document.getElementById('dia-display');

    if (dd) {
        dd.innerText = window.safeFNum ? window.safeFNum(window.dia) : window.dia; 
    }
    
    const mineDial = document.getElementById('mine-dial'); 

    if (mineDial && window.isAutoMineOn) {
        mineDial.style.background = `conic-gradient(#00fbff 0%, #00fbff ${window.mineProgress}%, #333 ${window.mineProgress}%, #333 100%)`;
    } 
    
    const mergeDial = document.getElementById('merge-dial'); 

    if (mergeDial && window.isAutoMergeOn) {
        mergeDial.style.background = `conic-gradient(#9b59b6 0%, #9b59b6 ${window.mergeProgress}%, #333 ${window.mergeProgress}%, #333 100%)`;
    } 
    
    const pn = document.getElementById('pickaxe-name');

    if (pn && typeof window.TOOTH_DATA !== 'undefined' && window.TOOTH_DATA.pickaxes[window.pickaxeIdx]) {
        pn.innerText = window.TOOTH_DATA.pickaxes[window.pickaxeIdx].name; 
    }
};


// --- [ 8. 자동 ON/OFF 버튼 상태 ] ---
window.updateToggleButtons = function() {
    const mineBtn = document.getElementById('auto-mine-btn');
    const mineDial = document.getElementById('mine-dial');

    if (mineBtn) {
        mineBtn.innerText = window.isAutoMineOn ? "자동 ON" : "자동 OFF"; 

        if (!window.isAutoMineOn) {
            mineBtn.classList.add('off');

            if (mineDial) mineDial.classList.add('dial-off');
        } else {
            mineBtn.classList.remove('off');

            if (mineDial) mineDial.classList.remove('dial-off');
        }
    }
    
    const mergeBtn = document.getElementById('auto-merge-btn');
    const mergeDial = document.getElementById('merge-dial');

    if (mergeBtn) {
        mergeBtn.innerText = window.isAutoMergeOn ? "자동 ON" : "자동 OFF"; 

        if (!window.isAutoMergeOn) {
            mergeBtn.classList.add('off');

            if (mergeDial) mergeDial.classList.add('dial-off');
        } else {
            mergeBtn.classList.remove('off');

            if (mergeDial) mergeDial.classList.remove('dial-off');
        }
    }
};
