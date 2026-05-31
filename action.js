// Version: 7.5.1 - Action & Interaction (Manual Mining, Drag & Drop Handlers)

window.lastTapTime = 0;
window.lastTapIdx = -1;

// --- [ 1. 수동 채굴 (광클) 액션 ] ---
window.setupMiningTouch = function() { 
    const mineArea = document.getElementById('mine-rock-area'); 
    if(!mineArea) return;
    
    // 모바일 환경에서 딜레이 없는 즉각적인 반응을 위해 pointerdown 이벤트 사용
    mineArea.addEventListener('pointerdown', (e) => { 
        e.preventDefault(); // 브라우저 스크롤 및 확대 등 방해 동작 차단
        
        const miner = document.getElementById('miner-char'); 
        if(miner) {
            miner.style.animation = 'none'; 
            miner.offsetHeight; // 브라우저 리플로우 강제 유발 (애니메이션 리셋)
            miner.style.animation = 'hammer 0.08s ease-in-out'; 
        }
        
        try { if(typeof window.playSfx === 'function') window.playSfx('mine'); } catch(e){}
        
        // 장착 중인 곡괭이 파워 불러오기
        let miningPower = 15;
        if (typeof window.TOOTH_DATA!== 'undefined' && window.TOOTH_DATA.pickaxes[window.pickaxeIdx]) {
            miningPower = window.TOOTH_DATA.pickaxes[window.pickaxeIdx].power || 15;
        }

        // 특정 티어(4레벨 이상) 달성 시 수동 채굴 골드 획득 보너스
        if (window.highestToothLevel >= 4 && Math.random() < 0.2) { 
            let tapGold = window.getBaseMiningLevel() * 50;
            window.gold += tapGold;
            const worldDiv = document.getElementById('battle-world');
            
            // 던전 전투 중이 아닐 때만 화면에 골드 획득 텍스트 표시
            if(!worldDiv || worldDiv.style.display === 'none' ||!document.getElementById('battle-screen').offsetParent) {
                const txt = document.createElement('div');
                txt.className = 'gold-text';
                txt.innerText = `💰+${window.fNum? window.fNum(tapGold) : tapGold}`;
                txt.style.left = e.clientX + 'px'; 
                txt.style.top = (e.clientY - 30) + 'px';
                txt.style.pointerEvents = 'none';
                document.body.appendChild(txt);
                setTimeout(() => txt.remove(), 800);
            }
        }
        
        if (window.highestToothLevel >= 4) miningPower *= 1.2;
        if (typeof window.processMining === 'function') window.processMining(miningPower); 
        
        // 터치 지점에 폭발 이펙트 생성
        const effect = document.createElement('div'); 
        effect.className = 'hit-effect'; 
        effect.innerText = "💥"; 
        effect.style.left = e.clientX + 'px'; 
        effect.style.top = e.clientY + 'px'; 
        effect.style.pointerEvents = 'none';
        document.body.appendChild(effect); 
        setTimeout(() => effect.remove(), 400); 

        // 🌟 수동 조작 손맛: 자동 채굴이 꺼져있을 때 광클하면 다이얼이 번쩍이는 효과
        if (!window.isAutoMineOn) {
            const mDial = document.getElementById('mine-dial');
            if (mDial) {
                mDial.style.filter = "brightness(2) drop-shadow(0 0 10px #00fbff)";
                setTimeout(() => { mDial.style.filter = "grayscale(1) brightness(0.6)"; }, 100);
            }
        }
        
        if (typeof window.updateUI === 'function') window.updateUI(); 
        if (typeof window.saveGame === 'function') window.saveGame();
    }); 
};


// --- [ 2. 인벤토리 드래그 앤 드롭 및 합성 로직 ] ---
window.moveProxy = function(e) { 
    const dragProxy = document.getElementById('drag-proxy');
    if(!dragProxy) return;
    
    // 드래그 중인 아이템(프록시)을 포인터 위치로 이동
    dragProxy.style.left = e.clientX + 'px'; 
    dragProxy.style.top = e.clientY + 'px'; 
    
    // 이전 드래그 타겟 하이라이트 제거
    document.querySelectorAll('.slot').forEach(s => s.classList.remove('drag-target')); 
    
    // 현재 포인터 아래에 있는 요소를 검사하여 타겟 슬롯 하이라이트
    const elements = document.elementsFromPoint(e.clientX, e.clientY); 
    const targetSlot = elements.find(el => el.classList.contains('slot')); 
    if(targetSlot && parseInt(targetSlot.dataset.index) < window.maxSlots) {
        targetSlot.classList.add('drag-target'); 
    }
};

window.handleMoveOrMerge = function(from, to) { 
    if (from === to) return; 
    
    // 1. 같은 치아일 경우 -> 합성 로직
    if (window.inventory[from] === window.inventory[to] && window.inventory[from] > 0) { 
        if (window.inventory[from] >= 24) { 
            // alert 대체: 추후 ui_modal.js에서 토스트 팝업으로 연동할 수도 있음
            alert("최대 레벨입니다!"); 
            return; 
        } 
        
        let curLv = window.inventory[from];
        let nextLv = curLv + 1; 
        let isGreat = false;

        // 대성공 확률 체크 (2업)
        if (curLv < 23 && Math.random() < (window.greatChanceLevel * 0.02)) {
            nextLv = Math.min(24, curLv + 2);
            isGreat = true;
        }

        window.inventory[to] = nextLv; 
        window.inventory[from] = 0; 
        
        if(typeof window.checkHighestTier === 'function') window.checkHighestTier(nextLv);
        
        // 🌟 렌더링을 먼저 실행하여 이펙트가 붙을 DOM 슬롯 확보
        if(typeof window.renderInventory === 'function') window.renderInventory(); 

        if (isGreat) {
            try { if(typeof playSfx === 'function') playSfx('great'); } catch(e){}
            window.showGreatSuccessEffect(to);
        } else {
            try { if(typeof playSfx === 'function') playSfx('merge'); } catch(e){}
        }

        // 🌟 수동 조작 손맛: 자동 합성이 꺼져있을 때 합치면 번쩍이는 효과
        if (!window.isAutoMergeOn) {
            const mDial = document.getElementById('merge-dial');
            if (mDial) {
                mDial.style.filter = "brightness(2) drop-shadow(0 0 10px #9b59b6)";
                setTimeout(() => { mDial.style.filter = "grayscale(1) brightness(0.6)"; }, 150);
            }
        }

    // 2. 다른 치아이거나 빈 칸일 경우 -> 위치 교환 로직
    } else { 
        [window.inventory[from], window.inventory[to]] = [window.inventory[to], window.inventory[from]]; 
        if(typeof window.renderInventory === 'function') window.renderInventory(); 
    } 
    
    if(typeof window.saveGame === 'function') window.saveGame(); 
};

// 🌟 대성공 시각 효과 버그 수정 (DOM 준비 후 렌더링)
window.showGreatSuccessEffect = function(slotIdx) {
    setTimeout(() => {
        const slot = document.getElementById(`slot-${slotIdx}`);
        if(slot) {
            const txt = document.createElement('div');
            txt.className = 'great-success-text';
            txt.innerText = '✨ +2';
            slot.appendChild(txt);
            setTimeout(() => txt.remove(), 800); // 애니메이션 후 DOM 삭제 처리
        }
    }, 10); // 렌더링 딜레이 보정
};
