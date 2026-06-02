// Version: 8.0.0 - Master Data Preserved + Lv.MAX System

// =========================
// 전역 상수
// =========================
window.GAME_VERSION = "8.0.0";

window.MINING_MAX_LEVEL = 12;       // 직접 채굴 최대 레벨
window.MERGE_MAX_LEVEL = 24;        // 일반 합성 최대 레벨
window.TOOTH_MAX_LEVEL = 25;        // 최종 초월 레벨
window.TOP_ATTACK_SLOT_COUNT = 8;   // Top8 공격 슬롯
window.INVENTORY_SIZE = 56;

// =========================
// 마스터 데이터
// =========================
const TOOTH_DATA = {
    icons: ["🦷", "🦴", "🛡️", "⚜️", "💎", "🌋", "🌌", "👑", "✨👑✨"],

    baseNames: [
        "유치",
        "푸른 치아",
        "초록 치아",
        "붉은 치아",
        "보라 치아",
        "황금 치아",
        "다이아 치아",
        "왕관 치아"
    ],

    prefix: ["일반", "단단한", "거대한"],

    pickaxes: [
        { name: "허름한 나무 곡괭이", cost: 0, luck: 0, power: 15, icon: "🪵" },
        { name: "무딘 구리 곡괭이", cost: 300, luck: 0.10, power: 25, icon: "🪨" },
        { name: "튼튼한 철 곡괭이", cost: 2000, luck: 0.20, power: 45, icon: "⛏️" },
        { name: "연마된 강철 곡괭이", cost: 15000, luck: 0.30, power: 80, icon: "⚔️" },
        { name: "빛나는 황금 곡괭이", cost: 100000, luck: 0.40, power: 150, icon: "⚜️" },
        { name: "고강도 티타늄 곡괭이", cost: 800000, luck: 0.50, power: 300, icon: "💠" },
        { name: "영롱한 다이아 곡괭이", cost: 5000000, luck: 0.60, power: 600, icon: "💎" },
        { name: "카본 초합금 곡괭이", cost: 50000000, luck: 0.70, power: 1200, icon: "🔮" },
        { name: "신화의 오리할콘 곡괭이", cost: 1000000000, luck: 0.80, power: 3000, icon: "👑" }
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

    dungeons: [
        "시작의 이끼 동굴",
        "낡은 해골 병영",
        "침묵의 지하 수로",
        "버려진 광산 심부",
        "혹한의 얼음 감옥",
        "작열하는 용암 터널",
        "맹독의 늪지대",
        "고대 거인의 무덤",
        "환영의 안개 숲",
        "천공의 무너진 성채",
        "심연의 수직 낙하",
        "차원의 균열 지대",
        "초월자의 시험장",
        "파멸의 잿더미",
        "영겁의 감시자 탑",
        "신의 영역: 입구",
        "황혼의 그림자 성소",
        "우주 너머의 공허",
        "혼돈의 끝자락",
        "카오스 울트라 최종장"
    ],

    hellDungeons: [
        "지옥: 피의 강물",
        "지옥: 절망의 절벽",
        "지옥: 악몽의 요람",
        "지옥: 뼈의 산",
        "지옥: 영혼 파쇄기",
        "지옥: 타락한 여명",
        "지옥: 심연의 심장",
        "지옥: 멸망의 전조",
        "지옥: 신살자의 투기장",
        "지옥: 절대 카오스"
    ],

    artifacts: [
        { name: "이끼 낀 톱니", icon: "⚙️" },
        { name: "부서진 해골바가지", icon: "💀" },
        { name: "하수구 쥐의 꼬리", icon: "🐁" },
        { name: "녹슨 곡괭이 날", icon: "🪓" },
        { name: "얼어붙은 눈물", icon: "💧" },
        { name: "식지 않는 용암석", icon: "🌋" },
        { name: "맹독 버섯 포자", icon: "🍄" },
        { name: "거인의 부러진 뼈", icon: "🦴" },
        { name: "안개꽃 잎사귀", icon: "🌿" },
        { name: "부유석 조각", icon: "☁️" },
        { name: "심연의 비늘", icon: "🐟" },
        { name: "차원의 파편", icon: "🌌" },
        { name: "초월자의 징표", icon: "🏅" },
        { name: "꺼지지 않는 불씨", icon: "🔥" },
        { name: "감시자의 눈알", icon: "👁️" },
        { name: "신성한 깃털", icon: "🪽" },
        { name: "그림자 단검", icon: "🗡️" },
        { name: "공허의 결정", icon: "🔮" },
        { name: "혼돈의 주사위", icon: "🎲" },
        { name: "카오스의 왕관", icon: "👑" },

        { name: "피로 물든 성배", icon: "🍷" },
        { name: "절망의 밧줄", icon: "🪢" },
        { name: "악몽의 드림캐처", icon: "🕸️" },
        { name: "마수석 뼈대", icon: "☠️" },
        { name: "영혼을 담은 호리병", icon: "🏺" },
        { name: "타락한 천사의 고리", icon: "🪹" },
        { name: "마왕의 심장", icon: "🫀" },
        { name: "멸망의 나침반", icon: "🧭" },
        { name: "신살자의 투구", icon: "🪖" },
        { name: "절대자의 증명", icon: "📜" }
    ],

    dungeonMobs: [
        { theme: "bg-grass", mobs: ["🍄", "🐌", "🐛"], boss: "🥦" },
        { theme: "bg-stone", mobs: ["💀", "🦴", "🦇"], boss: "☠️" },
        { theme: "bg-water", mobs: ["🐀", "💧", "🐊"], boss: "🐙" },
        { theme: "bg-brick", mobs: ["🐜", "🕷️", "⛏️"], boss: "🗿" },
        { theme: "bg-ice", mobs: ["🐧", "❄️", "☃️"], boss: "🐻‍❄️" },
        { theme: "bg-lava", mobs: ["🔥", "🦎", "💣"], boss: "👹" },
        { theme: "bg-poison", mobs: ["🐸", "🐍", "🦠"], boss: "🐉" },
        { theme: "bg-dark", mobs: ["👻", "🧟", "🕯️"], boss: "🧛" },
        { theme: "bg-fog", mobs: ["🐺", "🦉", "🌫️"], boss: "🦌" },
        { theme: "bg-brick", mobs: ["🛡️", "⚔️", "🦅"], boss: "🤴" },
        { theme: "bg-water", mobs: ["🐡", "🌪️", "👁️"], boss: "🐋" },
        { theme: "bg-space", mobs: ["👽", "🛸", "👾"], boss: "🪐" },
        { theme: "bg-sky", mobs: ["👼", "🕊️", "☀️"], boss: "🗽" },
        { theme: "bg-stone", mobs: ["🦂", "🐪", "🌵"], boss: "🦁" },
        { theme: "bg-brick", mobs: ["🤖", "🦾", "📡"], boss: "🏗️" },
        { theme: "bg-sky", mobs: ["🌩️", "🦅", "🧚"], boss: "⚡" },
        { theme: "bg-dark", mobs: ["🥷", "👺", "🗡️"], boss: "👹" },
        { theme: "bg-space", mobs: ["🌟", "☄️", "🚀"], boss: "☀️" },
        { theme: "bg-chaos", mobs: ["🤡", "🃏", "🎭"], boss: "😈" },
        { theme: "bg-tooth", mobs: ["🍬", "🍫", "🦠"], boss: "👑" }
    ],

    hellMobs: [
        { theme: "bg-hell", mobs: ["🩸", "🔪", "🩸"], boss: "🧛‍♂️" },
        { theme: "bg-hell", mobs: ["👁️", "🧠", "🫀"], boss: "🕷️" },
        { theme: "bg-hell", mobs: ["🦇", "🦂", "🐍"], boss: "🧟‍♂️" },
        { theme: "bg-hell", mobs: ["💀", "☠️", "👻"], boss: "🧌" },
        { theme: "bg-hell", mobs: ["🔥", "🌋", "☄️"], boss: "🐉" },
        { theme: "bg-hell", mobs: ["🌑", "🌒", "🌓"], boss: "🌚" },
        { theme: "bg-hell", mobs: ["⚡", "🌩️", "🌪️"], boss: "🧞‍♂️" },
        { theme: "bg-hell", mobs: ["⚔️", "🗡️", "🛡️"], boss: "🥷" },
        { theme: "bg-hell", mobs: ["👹", "👺", "👿"], boss: "😈" },
        { theme: "bg-hell", mobs: ["👑", "🔱", "⚜️"], boss: "👁️‍🗨️" }
    ],

    invExpansion: [2000, 20000, 200000, 2000000],

    // 기존 세팅값 보존
    AWAKEN_REQ: {
        gold: 1000000000000000,
        dia: 100000,
        bossMarks: 50
    },

    REAL_NICKNAMES: [
        "빛나는금니",
        "DarkKnight",
        "임플란트마스터",
        "치아파괴자",
        "스케일링장인",
        "치석브레이커",
        "충치사냥꾼",
        "ProGamer",
        "양치질만렙",
        "건치미남",
        "사랑니발치러",
        "지옥의치과의사",
        "황금임플란트",
        "무과금전사",
        "서버1위"
    ]
};

window.TOOTH_DATA = TOOTH_DATA;

// =========================
// 사운드 시스템
// =========================
let audioCtx = null;

function getAudioCtx() {
    if (audioCtx) return audioCtx;

    const AudioClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioClass) return null;

    try {
        audioCtx = new AudioClass();
        return audioCtx;
    } catch (e) {
        return null;
    }
}

function playNoise(duration, vol) {
    const ctx = getAudioCtx();
    if (!ctx || window.isMuted || document.hidden) return;

    if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
    }

    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const finalVol = vol * (window.masterVolume || 2) * 0.5;

    gain.gain.setValueAtTime(finalVol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    source.buffer = buffer;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    source.stop(ctx.currentTime + duration);
}

function playTone(freq, type, duration, vol = 0.1) {
    if (window.isMuted || document.hidden) return;

    if (type === "noise") {
        playNoise(duration, vol);
        return;
    }

    const ctx = getAudioCtx();
    if (!ctx) return;

    if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
    }

    try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const finalVol = vol * (window.masterVolume || 2) * 0.5;
        gain.gain.setValueAtTime(finalVol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch (e) {}
}

function playSfx(name) {
    if (window.isMuted || document.hidden) return;

    switch (name) {
        case "mine":
            playTone(150, "square", 0.1, 0.1);
            break;

        case "merge":
            playTone(400, "sine", 0.1, 0.1);
            setTimeout(() => playTone(600, "sine", 0.1, 0.1), 100);
            break;

        case "great":
            playTone(500, "triangle", 0.1, 0.1);
            setTimeout(() => playTone(1000, "triangle", 0.3, 0.1), 150);
            break;

        case "attack":
            playTone(800, "sawtooth", 0.05, 0.05);
            break;

        case "hit":
            playTone(100, "noise", 0.05, 0.1);
            break;

        case "upgrade":
            playTone(600, "square", 0.1, 0.1);
            setTimeout(() => playTone(900, "square", 0.1, 0.1), 100);
            break;

        case "damage":
            playTone(80, "sawtooth", 0.2, 0.2);
            break;

        case "unlock":
            playTone(440, "sine", 0.2, 0.2);
            setTimeout(() => playTone(554, "sine", 0.2, 0.2), 200);
            setTimeout(() => playTone(659, "sine", 0.4, 0.2), 400);
            break;

        case "awaken":
            playTone(300, "sine", 0.5, 0.2);
            setTimeout(() => playTone(600, "sine", 1.0, 0.3), 500);
            break;
    }
}

window.playTone = playTone;
window.playSfx = playSfx;

// =========================
// 숫자 포맷
// =========================
function fNum(num) {
    num = Number(num) || 0;

    if (Math.abs(num) < 1000) return Math.floor(num).toString();

    const units = [
        "",
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
        "i",
        "j",
        "k",
        "l",
        "m",
        "n",
        "o",
        "p",
        "q",
        "r",
        "s",
        "t",
        "u",
        "v",
        "w",
        "x",
        "y",
        "z"
    ];

    const unitIdx = Math.min(units.length - 1, Math.floor(Math.log10(Math.abs(num)) / 3));
    const shortNum = num / Math.pow(10, unitIdx * 3);

    return shortNum.toFixed(2).replace(/\.00$/, "") + units[unitIdx];
}

function safeFNum(val) {
    return fNum(val);
}

window.fNum = fNum;
window.safeFNum = safeFNum;

// =========================
// 치아 레벨 / 공격력 계산
// =========================
function getToothDisplayLevel(lv) {
    lv = Number(lv) || 0;
    if (lv >= window.TOOTH_MAX_LEVEL) return "MAX";
    return String(lv);
}

function getToothName(lv) {
    lv = Number(lv) || 0;

    if (lv <= 0) return "";

    if (lv >= 25) {
        return "Lv.MAX 초월 왕관 치아";
    }

    if (lv === 24) {
        return "봉인된 왕관 치아";
    }

    const safeLv = Math.min(23, lv);
    const tier = Math.floor((safeLv - 1) / 3);
    const step = (safeLv - 1) % 3;

    const baseName = TOOTH_DATA.baseNames[tier] || "신비한 치아";
    const prefix = TOOTH_DATA.prefix[step] || "일반";

    return prefix + " " + baseName;
}

function getBaseAtk(lv) {
    lv = Number(lv) || 0;

    if (lv <= 0) return 0;

    if (lv >= 25) {
        const base24 = Math.floor(20 * Math.pow(1.8, 23));
        return base24 * 1000;
    }

    if (lv === 24) {
        const base23 = Math.floor(20 * Math.pow(1.8, 22));
        return Math.floor(base23 * 1.2);
    }

    return Math.floor(20 * Math.pow(1.8, lv - 1));
}

function getAtk(lv) {
    lv = Number(lv) || 0;

    let atk = getBaseAtk(lv);

    if (lv < 25 && window.highestToothLevel >= 19) {
        atk *= 10;
    }

    if (lv >= 25) {
        atk *= 10;
    }

    return Math.floor(atk);
}

function getToothIcon(lv) {
    lv = Number(lv) || 0;

    if (lv <= 0) return "";

    if (lv >= 25) {
        return `<div class="tooth-icon effect-tier-8 effect-size-2">✨👑✨</div>`;
    }

    if (lv === 24) {
        return `
            <div style="position:relative; display:inline-block; width:100%; height:100%;">
                <div class="tooth-icon effect-tier-7 effect-size-2" style="filter:grayscale(1) drop-shadow(0 0 8px #777);">👑</div>
                <span style="position:absolute; font-size:15px; top:50%; left:50%; transform:translate(-50%, -50%); text-shadow:1px 1px 0 #000;">🔒</span>
            </div>
        `;
    }

    const safeLv = Math.min(23, lv);
    const tier = Math.floor((safeLv - 1) / 3);
    const step = (safeLv - 1) % 3;
    const icon = TOOTH_DATA.icons[tier] || "🦷";

    return `<div class="tooth-icon effect-tier-${tier} effect-size-${step}">${icon}</div>`;
}

window.getToothDisplayLevel = getToothDisplayLevel;
window.getToothName = getToothName;
window.getBaseAtk = getBaseAtk;
window.getAtk = getAtk;
window.getToothIcon = getToothIcon;

// 구버전 호환용 alias
window.getToothDisplayName = getToothName;
