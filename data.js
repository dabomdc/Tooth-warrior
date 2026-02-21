// Version: 6.7.0 - Data Structure (Hell & Codex)
const TOOTH_DATA = {
    // 8개의 기본 티어 이모지 (5레벨마다 바뀜)
    icons: ["🦷", "🦴", "🛡️", "⚜️", "💎", "🌋", "🌌", "👑"],
    // 8개의 기본 테마 이름
    baseNames: ["유치", "영구치", "강철 치아", "황금 치아", "다이아 치아", "용암 치아", "공허 치아", "신성 치아"],
    // 5단계 강화 접두사
    prefix: ["일반", "예리한", "단단한", "빛나는", "완벽한"],
    
    pickaxes: [
        { name: "허름한 나무 곡괭이", cost: 0, luck: 0, icon: "🪵" },
        { name: "무딘 구리 곡괭이", cost: 300, luck: 0.10, icon: "🪨" }, 
        { name: "튼튼한 철 곡괭이", cost: 2000, luck: 0.20, icon: "⛏️" }, 
        { name: "연마된 강철 곡괭이", cost: 15000, luck: 0.30, icon: "⚔️" },
        { name: "빛나는 황금 곡괭이", cost: 100000, luck: 0.40, icon: "⚜️" },
        { name: "고강도 티타늄 곡괭이", cost: 800000, luck: 0.50, icon: "💠" },
        { name: "영롱한 다이아 곡괭이", cost: 5000000, luck: 0.60, icon: "💎" },
        { name: "카본 초합금 곡괭이", cost: 50000000, luck: 0.70, icon: "🔮" },
        { name: "신화의 오리할콘 곡괭이", cost: 1000000000, luck: 0.80, icon: "👑" }
    ],
    mercenaries: [
        { id: 0, name: "농부 듀드", cost: 0, atkMul: 1.0, baseHp: 100, spd: 1.0, icon: "👨‍🌾" },
        { id: 1, name: "마을 경비병", cost: 500, atkMul: 1.2, baseHp: 150, spd: 1.1, icon: "👮‍♂️" },
        { id: 2, name: "견습 검사", cost: 3000, atkMul: 1.5, baseHp: 200, spd: 1.2, icon: "🤺" },
        { id: 3, name: "숙련된 사냥꾼", cost: 12000, atkMul: 1.8, baseHp: 180, spd: 1.3, icon: "🏹" },
        { id: 4, name: "왕국 기사", cost: 50000, atkMul: 2.2, baseHp: 300, spd: 1.1, icon: "💂‍♂️" },
        { id: 5, name: "전투 사제", cost: 200000, atkMul: 2.6, baseHp: 250, spd: 1.2, icon: "🧙‍♂️" },
        { id: 6, name: "그림자 암살자", cost: 800000, atkMul: 3.2, baseHp: 200, spd: 1.5, icon: "🥷" },
        { id: 7, name: "엘프 명사수", cost: 3000000, atkMul: 4.0, baseHp: 280, spd: 1.4, icon: "🧝‍♀️" },
        { id: 8, name: "오크 전사", cost: 10000000, atkMul: 5.0, baseHp: 500, spd: 1.0, icon: "👹" },
        { id: 9, name: "드워프 공학자", cost: 40000000, atkMul: 6.5, baseHp: 400, spd: 1.2, icon: "👷" },
        { id: 10, name: "화염 마법사", cost: 150000000, atkMul: 8.5, baseHp: 350, spd: 1.3, icon: "🔥" },
        { id: 11, name: "냉기 마녀", cost: 600000000, atkMul: 11.0, baseHp: 400, spd: 1.3, icon: "❄️" },
        { id: 12, name: "강철의 골렘", cost: 2500000000, atkMul: 15.0, baseHp: 1000, spd: 0.8, icon: "🤖" },
        { id: 13, name: "뱀파이어 로드", cost: 10000000000, atkMul: 20.0, baseHp: 600, spd: 1.4, icon: "🧛" },
        { id: 14, name: "드래곤 슬레이어", cost: 50000000000, atkMul: 30.0, baseHp: 800, spd: 1.3, icon: "🐲" },
        { id: 15, name: "성기사 단장", cost: 200000000000, atkMul: 45.0, baseHp: 1200, spd: 1.2, icon: "⚜️" },
        { id: 16, name: "차원 방랑자", cost: 1000000000000, atkMul: 70.0, baseHp: 900, spd: 1.6, icon: "🌌" },
        { id: 17, name: "데몬 헌터", cost: 5000000000000, atkMul: 100.0, baseHp: 1500, spd: 1.5, icon: "😈" },
        { id: 18, name: "천상의 수호자", cost: 25000000000000, atkMul: 150.0, baseHp: 2000, spd: 1.4, icon: "👼" },
        { id: 19, name: "치아의 신", cost: 100000000000000, atkMul: 300.0, baseHp: 5000, spd: 2.0, icon: "🦷" }
    ],
    // 일반 던전 20종
    dungeons: [
        "시작의 이끼 동굴", "낡은 해골 병영", "침묵의 지하 수로", "버려진 광산 심부", 
        "혹한의 얼음 감옥", "작열하는 용암 터널", "맹독의 늪지대", "고대 거인의 무덤", 
        "환영의 안개 숲", "천공의 무너진 성채", "심연의 수직 낙하", "차원의 균열 지대", 
        "초월자의 시험장", "파멸의 잿더미", "영겁의 감시자 탑", "신의 영역: 입구", 
        "황혼의 그림자 성소", "우주 너머의 공허", "혼돈의 끝자락", "카오스 울트라 최종장"
    ],
    // 신규: HELL 모드 던전 10종
    hellDungeons: [
        "지옥: 피의 강물", "지옥: 절망의 절벽", "지옥: 악몽의 요람", "지옥: 뼈의 산", 
        "지옥: 영혼 파쇄기", "지옥: 타락한 여명", "지옥: 심연의 심장", "지옥: 멸망의 전조", 
        "지옥: 신살자의 투기장", "지옥: 절대 카오스"
    ],
    dungeonMobs: [
        { theme: 'bg-grass', mobs: ['🍄','🐌','🐛'], boss: '🥦' }, 
        { theme: 'bg-stone', mobs: ['💀','🦴','🦇'], boss: '☠️' }, 
        { theme: 'bg-water', mobs: ['🐀','💧','🐊'], boss: '🐙' }, 
        { theme: 'bg-brick', mobs: ['🐜','🕷️','⛏️'], boss: '🗿' }, 
        { theme: 'bg-ice', mobs: ['🐧','❄️','☃️'], boss: '🐻‍❄️' }, 
        { theme: 'bg-lava', mobs: ['🔥','🦎','💣'], boss: '👹' }, 
        { theme: 'bg-poison', mobs: ['🐸','🐍','🦠'], boss: '🐉' }, 
        { theme: 'bg-dark', mobs: ['👻','🧟','🕯️'], boss: '🧛' }, 
        { theme: 'bg-fog', mobs: ['🐺','🦉','🌫️'], boss: '🦌' }, 
        { theme: 'bg-brick', mobs: ['🛡️','⚔️','🦅'], boss: '🤴' }, 
        { theme: 'bg-water', mobs: ['🐡','🌪️','👁️'], boss: '🐋' }, 
        { theme: 'bg-space', mobs: ['👽','🛸','👾'], boss: '🪐' }, 
        { theme: 'bg-sky', mobs: ['👼','🕊️','☀️'], boss: '🗽' }, 
        { theme: 'bg-stone', mobs: ['🦂','🐪','🌵'], boss: '🦁' }, 
        { theme: 'bg-brick', mobs: ['🤖','🦾','📡'], boss: '🏗️' }, 
        { theme: 'bg-sky', mobs: ['🌩️','🦅','🧚'], boss: '⚡' }, 
        { theme: 'bg-dark', mobs: ['🥷','👺','🗡️'], boss: '👹' }, 
        { theme: 'bg-space', mobs: ['🌟','☄️','🚀'], boss: '☀️' }, 
        { theme: 'bg-chaos', mobs: ['🤡','🃏','🎭'], boss: '😈' }, 
        { theme: 'bg-tooth', mobs: ['🍬','🍫','🦠'], boss: '👑' }  
    ],
    // 신규: HELL 몬스터 및 보스
    hellMobs: [
        { theme: 'bg-hell', mobs: ['🩸','🔪','🩸'], boss: '🧛‍♂️' },
        { theme: 'bg-hell', mobs: ['👁️','🧠','🫀'], boss: '🕷️' },
        { theme: 'bg-hell', mobs: ['🦇','🦂','🐍'], boss: '🧟‍♂️' },
        { theme: 'bg-hell', mobs: ['💀','☠️','👻'], boss: '🧌' },
        { theme: 'bg-hell', mobs: ['🔥','🌋','☄️'], boss: '🐉' },
        { theme: 'bg-hell', mobs: ['🌑','🌒','🌓'], boss: '🌚' },
        { theme: 'bg-hell', mobs: ['⚡','🌩️','🌪️'], boss: '🧞‍♂️' },
        { theme: 'bg-hell', mobs: ['⚔️','🗡️','🛡️'], boss: '🥷' },
        { theme: 'bg-hell', mobs: ['👹','👺','👿'], boss: '😈' },
        { theme: 'bg-hell', mobs: ['👑','🔱','⚜️'], boss: '👁️‍🗨️' }
    ],
    botNames: ["이빨요정", "치과무서워", "Driller", "Gold_Hunter", "사랑니", "임플란트", "충치균", "양치질", "스케일링", "치아왕", "강철턱", "GumGuard", "RootCanal", "MolarBear", "ToothHurty", "FlossBoss"],
    invExpansion: [2000, 20000, 200000, 2000000]
};

// --- 사운드 시스템 ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration, vol = 0.1) {
    if (!window.isMuted) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        // 설정에서 조절한 볼륨 적용 (masterVolume 1, 2, 3 단계)
        const finalVol = vol * (window.masterVolume || 2) * 0.5;
        gain.gain.setValueAtTime(finalVol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    }
}

function playSfx(name) {
    if (window.isMuted) return;
    if (document.hidden) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    switch (name) {
        case 'mine': playTone(150, 'square', 0.1, 0.1); break;
        case 'merge': playTone(400, 'sine', 0.1, 0.1); setTimeout(() => playTone(600, 'sine', 0.1, 0.1), 100); break;
        case 'great': playTone(500, 'triangle', 0.1, 0.1); setTimeout(() => playTone(1000, 'triangle', 0.3, 0.1), 150); break;
        case 'attack': playTone(800, 'sawtooth', 0.05, 0.05); break;
        case 'hit': playTone(100, 'noise', 0.05, 0.1); break;
        case 'upgrade': playTone(600, 'square', 0.1, 0.1); setTimeout(() => playTone(900, 'square', 0.1, 0.1), 100); break;
        case 'damage': playTone(80, 'sawtooth', 0.2, 0.2); break;
        // 신규: 티어 개방 축하 팡파레
        case 'unlock': playTone(440, 'sine', 0.2, 0.2); setTimeout(() => playTone(554, 'sine', 0.2, 0.2), 200); setTimeout(() => playTone(659, 'sine', 0.4, 0.2), 400); break;
    }
}

// --- 유틸리티 및 데이터 계산 ---
function fNum(num) {
    if (num < 1000) return Math.floor(num);
    const units = ["", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
    const unitIdx = Math.floor(Math.log10(num) / 3);
    const shortNum = num / Math.pow(10, unitIdx * 3);
    return shortNum.toFixed(2).replace(/\.00$/, "") + units[unitIdx];
}

// 40레벨 압축 공격력 공식 & 36렙 10배 버프 적용
function getAtk(lv) { 
    if(lv === 0) return 0;
    let atk = Math.floor(20 * Math.pow(1.6, lv - 1));
    
    // 36레벨 이상 도달 시 모든 치아 공격력 10배
    if(window.highestToothLevel >= 36) {
        atk *= 10; 
    }
    return atk;
}

// 신규: 도감을 위한 이름 생성기 (예: 완벽한 황금 치아)
function getToothName(lv) {
    if (lv === 0) return "";
    let safeLv = Math.min(40, lv); // 최대 40레벨 고정
    let tier = Math.floor((safeLv - 1) / 5);
    let step = (safeLv - 1) % 5;
    return TOOTH_DATA.prefix[step] + " " + TOOTH_DATA.baseNames[tier];
}

// 신규: CSS Tiers가 적용된 치아 아이콘 반환기
function getToothIcon(lv) {
    if (lv === 0) return "";
    let safeLv = Math.min(40, lv); // 최대 40레벨 고정
    let tier = Math.floor((safeLv - 1) / 5);
    let step = (safeLv - 1) % 5;
    
    let icon = TOOTH_DATA.icons[tier] || "🦷";
    return `<div class="tooth-icon effect-${step}">${icon}</div>`;
}
