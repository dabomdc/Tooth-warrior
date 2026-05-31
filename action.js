// Version: 8.1.0 - Player Actions, Mining, Merge, Inventory, Coupon

// --- [ 1. 내부 상태 ] ---
let lastTapTime = 0; 
let lastTapIdx = -1;


// --- [ 2. 작은 슬롯용 치아 아이콘 ] ---
window.getSimpleToothEmoji = function(lv) {
    if (!lv || lv <= 0) return "";

    let safeLv = Math.min(24, lv);

    if (safeLv === 24) {
        return window.isToothAwakened ? "👑" : "🔒";
    }

    if (!window.TOOTH_DATA || !window.TOOTH_DATA.icons) return "🦷";

    const tier = Math.floor((safeLv - 1) / 3);
    return window.TOOTH_DATA.icons[tier] || "🦷";
};


// --- [ 3. 채굴 처리 ] ---
window.processMining = function(amt) { 
    window.mineProgress += amt; 

    if (window.mineProgress >= 100) { 
        window.mineProgress = 100; 

        if (window.addMinedItem()) { 
            window.mineProgress = 0; 
        } 
    } 
};

window.addMinedItem = function() { 
    if (typeof window.cleanupInventory === 'function') {
        window.cleanupInventory();
    }

    let emptyIdx = -1; 

    for (let i = 0; i < window.maxSlots; i++) { 
        if (window.inventory[i] === 0) { 
            emptyIdx = i; 
            break; 
        } 
    } 

    if (emptyIdx === -1) return false; 
    
    let resultLv = window.getBaseMiningLevel ? window.getBaseMiningLevel() : 1; 

    if (typeof window.TOOTH_DATA !== 'undefined' && window.TOOTH_DATA.pickaxes[window.pickaxeIdx]) {
        if (Math.random() < window.TOOTH_DATA.pickaxes[window.pickaxeIdx].luck) {
            resultLv += 1; 
        }
    }
    
    resultLv = Math.min(24, resultLv);
    window.inventory[emptyIdx] = resultLv;

    if (typeof window.checkHighestTier === 'function') {
        window.checkHighestTier(resultLv);
    }

    if (window.getView && window.getView() === 'mine' && typeof window.renderInventory === 'function') {
        window.renderInventory(); 
    }

    try { 
        if (typeof window.playSfx === 'function') window.playSfx('mine'); 
    } catch(e) {}

    return true; 
};


// --- [ 4. 합성 대성공 시각 효과 ] ---
window.showGreatSuccessEffect = function(slotIdx) {
    setTimeout(() => {
        const slot = document.getElementById(`slot-${slotIdx}`);

        if (slot) {
            const txt = document.createElement('div');

            txt.className = 'great-success-text';
            txt.innerText = '✨ +2';

            slot.appendChild(txt);

            setTimeout(() => {
                if (txt && txt.parentNode) txt.remove();
            }, 800);
        }
    }, 10);
};


// --- [ 5. 자동 합성 ] ---
window.autoMergeLowest = function() { 
    let levelCounts = {}; 

    for (let i = 8; i < window.maxSlots; i++) { 
        const lv = window.inventory[i]; 

        if (lv > 0 && lv < 24) {
            levelCounts[lv] = (levelCounts[lv] || 0) + 1; 
        }
    } 

    let targetLv = -1; 
    const levels = Object.keys(levelCounts).map(Number).sort((a, b) => a - b); 

    for (let lv of levels) { 
        if (levelCounts[lv] >= 2) { 
            targetLv = lv; 
            break; 
        } 
    } 

    if (targetLv !== -1 && typeof window.massMerge === 'function') {
        window.massMerge(targetLv, true); 
    }
};


// --- [ 6. 대량 합성 ] ---
window.massMerge = function(lv, once = false) { 
    let indices = []; 

    window.inventory.forEach((val, idx) => { 
        if (idx >= 8 && val === lv && idx < window.maxSlots) {
            indices.push(idx); 
        }
    }); 

    if (indices.length < 2 || lv >= 24) return; 
    
    const loopCount = once ? 1 : Math.floor(indices.length / 2); 
    let greatCount = 0;
    let lastGreatIdx = -1;

    for (let i = 0; i < loopCount; i++) { 
        let idx1 = indices[2 * i]; 
        let idx2 = indices[2 * i + 1]; 
        
        let nextLv = lv + 1; 
        
        if (lv < 23 && Math.random() < (window.greatChanceLevel * 0.02)) {
            nextLv = Math.min(24, lv + 2);
            greatCount++;
            lastGreatIdx = idx2;
        }
        
        window.inventory[idx2] = nextLv; 
        window.inventory[idx1] = 0; 

        if (typeof window.checkHighestTier === 'function') {
            window.checkHighestTier(nextLv); 
        }
    } 

    if (window.getView && window.getView() === 'mine' && typeof window.renderInventory === 'function') {
        window.renderInventory(); 
    }

    if (greatCount > 0) {
        try { 
            if (typeof window.playSfx === 'function') window.playSfx('great'); 
        } catch(e) {}

        if (lastGreatIdx !== -1) {
            window.showGreatSuccessEffect(lastGreatIdx);
        }
    } else {
        try { 
            if (typeof window.playSfx === 'function') window.playSfx('merge'); 
        } catch(e) {}
    }

    if (typeof window.saveGame === 'function') {
        window.saveGame();
    }
};


// --- [ 7. 최고 티어 체크 ] ---
window.checkHighestTier = function(level) {
    if (level > window.highestToothLevel && level <= 24) {
        window.highestToothLevel = level;

        if (typeof window.saveGame === 'function') {
            window.saveGame();
        }

        if ((level - 1) % 3 === 0 && level > 1) {
            if (typeof window.showTierUnlock === 'function') {
                window.showTierUnlock(level);
            }
        }
    }
};


// --- [ 8. 인벤토리 렌더링 ] ---
window.renderInventory = function() { 
    const grid = document.getElementById('inventory-grid'); 
    if (!grid) return;
    
    if (grid.children.length === 0) {
        for (let i = 0; i < 56; i++) { 
            const slot = document.createElement('div'); 

            slot.dataset.index = i; 
            slot.id = `slot-${i}`; 
            
            slot.onpointerdown = function(e) { 
                if (window.inventory[i] > 0) { 
                    const currentTime = new Date().getTime(); 
                    const tapLength = currentTime - lastTapTime; 
                    
                    if (tapLength < 300 && tapLength > 0 && lastTapIdx === i) { 
                        e.preventDefault(); 

                        if (window.inventory[i] === 24 && !window.isToothAwakened) {
                            if (typeof window.openLockedToothModal === 'function') {
                                window.openLockedToothModal(i);
                            }
                        } else {
                            window.massMerge(window.inventory[i]); 
                        }

                        lastTapTime = 0; 
                        return; 
                    } 
                    
                    lastTapTime = currentTime; 
                    lastTapIdx = i; 

                    e.preventDefault(); 
                    
                    if (window.inventory[i] === 24 && !window.isToothAwakened) return;
                    
                    window.dragStartIdx = i; 
                    slot.classList.add('picked'); 

                    const dragProxy = document.getElementById('drag-proxy');

                    if (dragProxy) {
                        dragProxy.innerHTML = `<span class="drag-tooth-emoji">${window.getSimpleToothEmoji(window.inventory[i])}</span>`; 
                        dragProxy.style.display = 'block'; 
                        window.moveProxy(e); 
                    }

                    try {
                        slot.setPointerCapture(e.pointerId); 
                    } catch(err) {}
                } 
            }; 

            slot.onpointermove = function(e) { 
                if (window.dragStartIdx !== null && typeof window.moveProxy === 'function') {
                    window.moveProxy(e); 
                }
            }; 

            slot.onpointerup = function(e) { 
                if (window.dragStartIdx !== null) { 
                    try {
                        slot.releasePointerCapture(e.pointerId); 
                    } catch(err) {}

                    slot.classList.remove('picked'); 

                    const dragProxy = document.getElementById('drag-proxy');
                    if (dragProxy) dragProxy.style.display = 'none'; 

                    const elements = document.elementsFromPoint(e.clientX, e.clientY); 
                    const targetSlot = elements.find(el => el.classList && el.classList.contains('slot') && el !== slot); 

                    if (targetSlot) { 
                        const toIdx = parseInt(targetSlot.dataset.index); 

                        if (toIdx < window.maxSlots && typeof window.handleMoveOrMerge === 'function') {
                            window.handleMoveOrMerge(window.dragStartIdx, toIdx); 
                        }
                    } 

                    document.querySelectorAll('.slot').forEach(s => s.classList.remove('drag-target')); 

                    window.dragStartIdx = null; 
                } 
            }; 

            grid.appendChild(slot); 
        }
    }
    
    for (let i = 0; i < 56; i++) {
        const slot = document.getElementById(`slot-${i}`);
        if (!slot) continue;
        
        slot.className = `slot ${i < 8 ? 'attack-slot' : ''} ${i >= window.maxSlots ? 'locked-slot' : ''}`; 
        
        if (i < window.maxSlots && window.inventory[i] > 0) { 
            const lv = window.inventory[i];
            const emoji = window.getSimpleToothEmoji(lv);

            if (lv === 24 && !window.isToothAwakened) {
                slot.innerHTML = `
                    <span class="inv-tooth-emoji locked-tooth-small">👑</span>
                    <span class="slot-lock-mark">🔒</span>
                    <span class="lv-text">Lv.${lv}</span>
                `;
            } else {
                slot.innerHTML = `
                    <span class="inv-tooth-emoji">${emoji}</span>
                    <span class="lv-text">Lv.${lv}</span>
                `;
            }
        } else if (i >= window.maxSlots) { 
            slot.innerHTML = `<span class="slot-lock-only">🔒</span>`; 
        } else {
            slot.innerHTML = "";
        }
    }
};


// --- [ 9. 수동 이동 / 합성 ] ---
window.handleMoveOrMerge = function(from, to) { 
    if (from === to) return; 

    if (window.inventory[from] === window.inventory[to] && window.inventory[from] > 0) { 
        if (window.inventory[from] >= 24) { 
            alert("최대 레벨입니다!"); 
            return; 
        } 
        
        let curLv = window.inventory[from];
        let nextLv = curLv + 1; 
        let isGreat = false;

        if (curLv < 23 && Math.random() < (window.greatChanceLevel * 0.02)) {
            nextLv = Math.min(24, curLv + 2);
            isGreat = true;
        }

        window.inventory[to] = nextLv; 
        window.inventory[from] = 0; 

        if (typeof window.checkHighestTier === 'function') {
            window.checkHighestTier(nextLv);
        }
        
        if (typeof window.renderInventory === 'function') {
            window.renderInventory(); 
        }

        if (isGreat) {
            try { 
                if (typeof window.playSfx === 'function') window.playSfx('great'); 
            } catch(e) {}

            window.showGreatSuccessEffect(to);
        } else {
            try { 
                if (typeof window.playSfx === 'function') window.playSfx('merge'); 
            } catch(e) {}
        }

        if (!window.isAutoMergeOn) {
            const mDial = document.getElementById('merge-dial');

            if (mDial) {
                mDial.style.filter = "brightness(2) drop-shadow(0 0 10px #9b59b6)";

                setTimeout(() => { 
                    mDial.style.filter = "grayscale(1) brightness(0.6)"; 
                }, 150);
            }
        }

    } else { 
        [window.inventory[from], window.inventory[to]] = [window.inventory[to], window.inventory[from]]; 

        if (typeof window.renderInventory === 'function') {
            window.renderInventory(); 
        }
    } 

    if (typeof window.saveGame === 'function') {
        window.saveGame(); 
    }
};


// --- [ 10. 드래그 프록시 이동 ] ---
window.moveProxy = function(e) { 
    const dragProxy = document.getElementById('drag-proxy');
    if (!dragProxy) return;

    dragProxy.style.left = e.clientX + 'px'; 
    dragProxy.style.top = e.clientY + 'px'; 

    document.querySelectorAll('.slot').forEach(s => s.classList.remove('drag-target')); 

    const elements = document.elementsFromPoint(e.clientX, e.clientY); 
    const targetSlot = elements.find(el => el.classList && el.classList.contains('slot')); 

    if (targetSlot && parseInt(targetSlot.dataset.index) < window.maxSlots) {
        targetSlot.classList.add('drag-target'); 
    }
};


// --- [ 11. 인벤토리 정리 ] ---
window.cleanupInventory = function() {
    const minMiningLv = window.getBaseMiningLevel ? window.getBaseMiningLevel() : 1;
    let cleared = false;

    for (let i = 0; i < window.maxSlots; i++) {
        if (window.inventory[i] > 0 && window.inventory[i] < minMiningLv) {
            window.inventory[i] = 0; 
            cleared = true;
        }
    }

    if (cleared && window.getView && window.getView() === 'mine' && typeof window.renderInventory === 'function') {
        window.renderInventory();
    }
};

window.sortInventory = function() { 
    let items = window.inventory.filter(v => v > 0); 

    items.sort((a, b) => b - a); 
    window.inventory.fill(0); 

    items.forEach((v, i) => { 
        if (i < 56) window.inventory[i] = v; 
    }); 

    if (typeof window.renderInventory === 'function') {
        window.renderInventory(); 
    }

    if (typeof window.saveGame === 'function') {
        window.saveGame(); 
    }
};


// --- [ 12. 곡괭이 시각화 ] ---
window.updatePickaxeVisual = function() { 
    const miner = document.getElementById('miner-char');

    if (miner && typeof window.TOOTH_DATA !== 'undefined' && window.TOOTH_DATA.pickaxes[window.pickaxeIdx]) {
        miner.innerText = window.TOOTH_DATA.pickaxes[window.pickaxeIdx].icon || "⛏️"; 
    }
};


// --- [ 13. 채굴 터치 실제 동작 ] ---
function handleMiningPointer(e) {
    if (e.target.closest('button')) return;

    e.preventDefault(); 

    const miner = document.getElementById('miner-char'); 

    if (miner) {
        miner.style.animation = 'none'; 
        miner.offsetHeight; 
        miner.style.animation = 'hammer 0.08s ease-in-out'; 
    }

    try { 
        if (typeof window.playSfx === 'function') window.playSfx('mine'); 
    } catch(err) {}
    
    let miningPower = 15;

    if (typeof window.TOOTH_DATA !== 'undefined' && window.TOOTH_DATA.pickaxes[window.pickaxeIdx]) {
        miningPower = window.TOOTH_DATA.pickaxes[window.pickaxeIdx].power || 15;
    }

    if (window.highestToothLevel >= 4 && Math.random() < 0.2) { 
        let tapGold = (window.getBaseMiningLevel ? window.getBaseMiningLevel() : 1) * 50;

        window.gold += tapGold;

        const txt = document.createElement('div');

        txt.className = 'gold-text';
        txt.innerText = `💰+${window.safeFNum ? window.safeFNum(tapGold) : tapGold}`;
        txt.style.left = e.clientX + 'px'; 
        txt.style.top = (e.clientY - 30) + 'px';
        txt.style.pointerEvents = 'none';

        document.body.appendChild(txt);

        setTimeout(() => {
            if (txt && txt.parentNode) txt.remove();
        }, 800);
    }

    if (window.highestToothLevel >= 4) miningPower *= 1.2;

    if (typeof window.processMining === 'function') {
        window.processMining(miningPower); 
    }
    
    const effect = document.createElement('div'); 

    effect.className = 'hit-effect'; 
    effect.innerText = "💥"; 
    effect.style.left = e.clientX + 'px'; 
    effect.style.top = e.clientY + 'px'; 
    effect.style.pointerEvents = 'none';

    document.body.appendChild(effect); 

    setTimeout(() => {
        if (effect && effect.parentNode) effect.remove();
    }, 400); 

    if (!window.isAutoMineOn) {
        const mDial = document.getElementById('mine-dial');

        if (mDial) {
            mDial.style.filter = "brightness(2) drop-shadow(0 0 10px #00fbff)";

            setTimeout(() => { 
                mDial.style.filter = "grayscale(1) brightness(0.6)"; 
            }, 100);
        }
    }
    
    if (typeof window.updateUI === 'function') {
        window.updateUI(); 
    }

    if (typeof window.saveGame === 'function') {
        window.saveGame();
    }
}


// --- [ 14. 채굴 터치 영역 등록 ] ---
window.setupMiningTouch = function() { 
    const mineView = document.getElementById('mine-view'); 
    if (!mineView) return;

    if (mineView.dataset.miningTouchReady === 'true') return;
    mineView.dataset.miningTouchReady = 'true';

    mineView.addEventListener('pointerdown', handleMiningPointer, { passive: false });
};


// --- [ 15. 자동 채굴 / 자동 합성 토글 ] ---
window.toggleAutoMine = function() { 
    window.isAutoMineOn = !window.isAutoMineOn; 

    if (typeof window.updateToggleButtons === 'function') {
        window.updateToggleButtons();
    }

    if (typeof window.saveGame === 'function') {
        window.saveGame(); 
    }
};

window.toggleAutoMerge = function() { 
    window.isAutoMergeOn = !window.isAutoMergeOn; 

    if (typeof window.updateToggleButtons === 'function') {
        window.updateToggleButtons();
    }

    if (typeof window.saveGame === 'function') {
        window.saveGame(); 
    }
};


// --- [ 16. 쿠폰 ] ---
window.checkCoupon = function(code) { 
    if (code === "100b" || code === "RICH100B") { 
        window.gold += 100000000000; 
        alert("치트키 적용!"); 

        if (typeof window.updateUI === 'function') window.updateUI(); 
        if (typeof window.saveGame === 'function') window.saveGame(); 
    } 
    else if (code === "DIA100") { 
        window.dia += 10000; 
        alert("다이아 치트 적용!"); 

        if (typeof window.updateUI === 'function') window.updateUI(); 
        if (typeof window.saveGame === 'function') window.saveGame(); 
    }
    else if (code === "TEST") { 
        window.gold += 1e25; 
        window.dia += 999999; 

        alert("테스트용 절대 재화가 지급되었습니다!"); 

        if (typeof window.updateUI === 'function') window.updateUI(); 
        if (typeof window.saveGame === 'function') window.saveGame();
    }
    else if (code === "HELLTEST") {
        window.unlockedDungeon = 20; 
        window.gold += 1e15; 
        window.dia += 100000; 
        window.bossMarks += 100;

        for (let i = 0; i < 30; i++) {
            window.artifactCounts[i] = 1; 
        }

        alert("🔥 [각성 테스트 완료] 1,000조 골드 / 10만 다이아 / 보스징표 100개 / 유물 올클리어!\n이제 23레벨 2개를 합쳐 봉인을 해제해보세요!");

        if (typeof window.updateUI === 'function') window.updateUI(); 
        if (typeof window.saveGame === 'function') window.saveGame();

        if (typeof window.renderDungeonList === 'function') window.renderDungeonList();
        if (typeof window.renderArtifacts === 'function') window.renderArtifacts();
    }
    else { 
        alert("유효하지 않은 쿠폰입니다."); 
    } 
};


// --- [ 17. 저장 코드 불러오기 ] ---
window.importSave = function() { 
    const str = prompt("코드 붙여넣기:"); 

    if (str) { 
        try { 
            const decoded = decodeURIComponent(atob(str)); 

            localStorage.setItem('toothSaveV700', decoded); 
            location.reload(); 
        } catch (e) { 
            alert("오류가 발생했습니다. 코드를 확인해주세요."); 
        } 
    } 
};
