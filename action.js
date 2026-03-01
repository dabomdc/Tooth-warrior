// Version: 8.0.0 - User Action (Manual Mine, Auto Merge, Drag & Drop, Inventory Render)

window.manualMineProgress = 0; // 수동 채굴 누적 파워 (오토와 완전히 분리됨)

// --- [ 1. 채굴 시스템 (오토 & 수동 완벽 분리) ] ---

// 1-1. 수동 채굴 터치 액션 (초과 파워 누적 적용!)
window.mineTooth = function() {
    let pickaxe = TOOTH_DATA.pickaxes[window.pickaxeLevel];
    
    // 버프 물약(거인의 영약) 효과 적용
    let powerMult = (window.activeBuffs && window.activeBuffs['manual_power']) ? window.activeBuffs['manual_power'].multiplier : 1;
    let finalPower = pickaxe.power * powerMult;

    // 수동 채굴 파워 누적
    window.manualMineProgress += finalPower;

    // 🌟 100을 넘을 때마다 치아 생성 (파워가 300이면 한 번에 3개 생성!)
    let teethToGenerate = Math.floor(window.manualMineProgress / 100);
    window.manualMineProgress = window.manualMineProgress % 100;

    let addedCount = 0;
    if (teethToGenerate > 0) {
        for (let i = 0; i < teethToGenerate; i++) {
            let level = 1;
            // 최고렙 곡괭이의 행운 확률 적용 (+1 레벨업 상태로 드랍)
            if (Math.random() < pickaxe.luck) level = 2;
            if (window.addTooth(level)) addedCount++;
        }
        
        if (addedCount > 0) {
            try { if(typeof playSfx === 'function') playSfx('mine'); } catch(e){}
            window.renderInventory();
        }
    }

    // 곡괭이 흔드는 애니메이션 타격감 추가
    const char = document.getElementById('miner-char');
    if (char) {
        char.classList.remove('swing');
        void char.offsetWidth; // DOM 리플로우 강제 트리거
        char.classList.add('swing');
    }
    
    // 이펙트 텍스트 (화면 클릭한 곳 주변에 파워 표시)
    showHitEffect(`+${finalPower}`);
};

// 1-2. 오토 채굴 (엔진에서 호출됨, 무조건 1개만 생성)
window.autoAddTooth = function() {
    let pickaxe = TOOTH_DATA.pickaxes[window.pickaxeLevel];
    let level = 1;
    if (Math.random() < pickaxe.luck) level = 2;
    
    if (window.addTooth(level)) {
        window.renderInventory();
    }
};

// 1-3. 치아를 인벤토리에 추가 및 신규 티어 달성 체크
window.addTooth = function(level) {
    if (window.inventory.length < window.maxSlots) {
        window.inventory.push(level);
        if (level > window.highestToothLevel) {
            window.highestToothLevel = level;
            checkTierUnlock(level);
            if(typeof window.updateStats === 'function') window.updateStats();
        }
        return true;
    }
    return false;
};

function checkTierUnlock(level) {
    if (level === 24) return; // 24레벨은 별도의 각성 이벤트가 있음
    if (level > 1 && (level - 1) % 3 === 0) {
        let tier = Math.floor((level - 1) / 3);
        const name = TOOTH_DATA.baseNames[tier];
        const icon = TOOTH_DATA.icons[tier];
        
        openModal('tier-unlock-modal');
        document.getElementById('tier-unlock-icon').innerHTML = `<div class="tooth-icon effect-tier-${tier} effect-size-2">${icon}</div>`;
        document.getElementById('tier-unlock-name').innerText = `[${name}] 도달!`;
        document.getElementById('tier-unlock-desc').innerText = "새로운 힘이 개방되었습니다.";
    }
}

// 1-4. 타격 텍스트 이펙트
function showHitEffect(text) {
    const effect = document.createElement('div');
    effect.className = 'hit-effect';
    effect.innerText = text;
    // 거대 치아 근처에서 랜덤하게 튀어오름
    effect.style.left = (window.innerWidth / 2 - 20 + (Math.random() * 40 - 20)) + 'px';
    effect.style.top = '30%'; 
    document.body.appendChild(effect);
    setTimeout(() => effect.remove(), 400);
}

// --- [ 2. 듀얼 다이얼 버튼 토글 로직 ] ---
window.toggleAutoMine = function() {
    window.isAutoMineOn = !window.isAutoMineOn;
    if(typeof window.updateToggleButtons === 'function') window.updateToggleButtons();
    try { if(typeof playSfx === 'function') playSfx('hit'); } catch(e){}
};

window.toggleAutoMerge = function() {
    window.isAutoMergeOn = !window.isAutoMergeOn;
    if(typeof window.updateToggleButtons === 'function') window.updateToggleButtons();
    try { if(typeof playSfx === 'function') playSfx('hit'); } catch(e){}
};

// --- [ 3. 인벤토리 렌더링 및 드래그 앤 드롭 (UI 분리된 핵심) ] ---
let draggedIdx = null;

window.renderInventory = function() {
    const grid = document.getElementById('inventory-grid');
    if(!grid) return;
    grid.innerHTML = '';

    for (let i = 0; i < window.maxSlots; i++) {
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.dataset.idx = i;

        if (i < window.inventory.length) {
            let lv = window.inventory[i];
            slot.innerHTML = getToothIcon(lv) + `<div class="lv-text">Lv.${lv}</div>`;
            slot.draggable = true;
            
            // 드래그 이벤트 바인딩
            slot.addEventListener('dragstart', function(e) {
                draggedIdx = parseInt(this.dataset.idx);
                this.classList.add('picked');
                e.dataTransfer.effectAllowed = 'move';
                
                // 모바일 터치 대응 고스트 이미지 비활성
                const img = new Image();
                img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                e.dataTransfer.setDragImage(img, 0, 0);
            });
            slot.addEventListener('dragend', function() {
                this.classList.remove('picked');
                document.querySelectorAll('.slot').forEach(s => s.classList.remove('drag-target'));
                draggedIdx = null;
            });
        }

        // 드롭 이벤트 바인딩
        slot.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('drag-target');
        });
        slot.addEventListener('dragleave', function() {
            this.classList.remove('drag-target');
        });
        slot.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-target');
            let targetIdx = parseInt(this.dataset.idx);
            if (draggedIdx !== null && draggedIdx !== targetIdx) {
                handleDrop(draggedIdx, targetIdx);
            }
        });

        // 모바일 터치 이벤트 바인딩
        setupTouchEvents(slot);
        grid.appendChild(slot);
    }
};

// 모바일 드래그 전용 터치 세팅
function setupTouchEvents(slot) {
    let touchTimeout;
    slot.addEventListener('touchstart', function(e) {
        if(this.draggable) {
            draggedIdx = parseInt(this.dataset.idx);
            touchTimeout = setTimeout(() => { this.classList.add('picked'); }, 100);
        }
    }, {passive: true});

    slot.addEventListener('touchmove', function(e) {
        if (draggedIdx !== null) {
            e.preventDefault();
            let touch = e.touches[0];
            let elem = document.elementFromPoint(touch.clientX, touch.clientY);
            document.querySelectorAll('.slot').forEach(s => s.classList.remove('drag-target'));
            if (elem && elem.classList.contains('slot')) {
                elem.classList.add('drag-target');
            }
        }
    }, {passive: false});

    slot.addEventListener('touchend', function(e) {
        clearTimeout(touchTimeout);
        this.classList.remove('picked');
        document.querySelectorAll('.slot').forEach(s => s.classList.remove('drag-target'));
        
        if (draggedIdx !== null) {
            let touch = e.changedTouches[0];
            let elem = document.elementFromPoint(touch.clientX, touch.clientY);
            let targetSlot = elem ? elem.closest('.slot') : null;
            
            if (targetSlot) {
                let targetIdx = parseInt(targetSlot.dataset.idx);
                if (draggedIdx !== targetIdx) {
                    handleDrop(draggedIdx, targetIdx);
                }
            }
        }
        draggedIdx = null;
    });
}

// 3-1. 치아 합성 및 스왑 로직
function handleDrop(fromIdx, toIdx) {
    if (fromIdx >= window.inventory.length) return;
    
    let fromLv = window.inventory[fromIdx];
    
    if (toIdx >= window.inventory.length) {
        // 빈 슬롯으로 이동
        window.inventory.splice(fromIdx, 1);
        window.inventory.push(fromLv);
        window.renderInventory();
        return;
    }

    let toLv = window.inventory[toIdx];

    // 합성이 불가능한 최종 레벨 예외 처리 (24레벨)
    if (fromLv === 24 || toLv === 24) {
        swapItems(fromIdx, toIdx);
        return;
    }

    if (fromLv === toLv) {
        // 🌟 합성 대성공 판정 (+2 레벨 점프)
        let isGreat = Math.random() < window.greatSuccessProb;
        let newLv = isGreat ? fromLv + 2 : fromLv + 1;
        
        // 최고 레벨(24) 초과 방지
        if (newLv > 24) newLv = 24;

        window.inventory[toIdx] = newLv;
        window.inventory.splice(fromIdx, 1);
        
        // 24레벨 전설의 치아 최초 달성 이벤트
        if (newLv === 24 && window.highestToothLevel < 24) {
            window.highestToothLevel = 24;
            openLockedToothModal();
        } else if (newLv > window.highestToothLevel) {
            window.highestToothLevel = newLv;
            checkTierUnlock(newLv);
        }
        
        if (isGreat) {
            try { if(typeof playSfx === 'function') playSfx('great'); } catch(e){}
            showGreatSuccessText(toIdx); // 대성공 팝콘 텍스트 연출
        } else {
            try { if(typeof playSfx === 'function') playSfx('merge'); } catch(e){}
        }
        
        if(typeof window.updateStats === 'function') window.updateStats();
        window.renderInventory();
    } else {
        // 레벨이 다르면 위치 교환
        swapItems(fromIdx, toIdx);
    }
}

function swapItems(i, j) {
    let temp = window.inventory[i];
    window.inventory[i] = window.inventory[j];
    window.inventory[j] = temp;
    window.renderInventory();
}

function showGreatSuccessText(idx) {
    const grid = document.getElementById('inventory-grid');
    if (!grid) return;
    const slots = grid.children;
    if (slots[idx]) {
        const rect = slots[idx].getBoundingClientRect();
        const msg = document.createElement('div');
        msg.className = 'great-success-text';
        msg.innerText = "✨+2";
        msg.style.left = (rect.left + rect.width / 2) + 'px';
        msg.style.top = rect.top + 'px';
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 800);
    }
}

// 3-2. 일괄 자동 정렬
window.sortInventory = function() {
    window.inventory.sort((a, b) => b - a);
    window.renderInventory();
    try { if(typeof playSfx === 'function') playSfx('hit'); } catch(e){}
};

// 3-3. 오토 합성 로직 (엔진에서 주기적으로 호출)
window.autoMergeAll = function() {
    let merged = false;
    // 인벤토리 뒤에서부터 검색하여 같은 레벨 합치기
    for (let i = window.inventory.length - 1; i >= 0; i--) {
        if (window.inventory[i] === 24) continue; 
        for (let j = i - 1; j >= 0; j--) {
            if (window.inventory[i] === window.inventory[j]) {
                handleDrop(i, j);
                merged = true;
                break;
            }
        }
        if (merged) break; // 한 번에 하나씩만 합성하여 렌더링 과부하 방지
    }
};

// 거대 치아 터치 이벤트 리스너 등록
document.addEventListener("DOMContentLoaded", () => {
    const rockArea = document.getElementById('mine-rock-area');
    if(rockArea) {
        // PC & Mobile 모두 대응
        rockArea.addEventListener('mousedown', window.mineTooth);
        rockArea.addEventListener('touchstart', (e) => {
            e.preventDefault(); // 더블 탭 줌 방지
            window.mineTooth();
        }, {passive: false});
    }
});
