// Version: 8.1.0 - Core Data / Balance / Icons / Sound

// =========================
// 기본 상수
// =========================
window.SAVE_KEY = "toothSaveV700";

window.MINING_MAX_LEVEL = 12;          // 직접 채굴 최대 레벨
window.MERGE_MAX_LEVEL = 24;           // 일반 합성 최대 레벨
window.TOOTH_MAX_LEVEL = 25;           // Lv.MAX
window.TOP_ATTACK_SLOT_COUNT = 8;      // 전투 슬롯
window.INVENTORY_SIZE = 56;            // 최대 인벤토리 칸

// =========================
// 게임 데이터
// =========================
window.TOOTH_DATA = {
    // 곡괭이
    pickaxes: [
        {
            name: "낡은 곡괭이",
            cost: 0,
            power: 10,
            luck: 0.00,
            icon: "⛏️"
        },
        {
            name: "청동 곡괭이",
            cost: 500,
            power: 15,
            luck: 0.03,
            icon: "⛏️"
        },
        {
            name: "철 곡괭이",
            cost: 3000,
            power: 23,
            luck: 0.05,
            icon: "⚒️"
        },
        {
            name: "강철 곡괭이",
            cost: 15000,
            power: 34,
            luck: 0.08,
            icon: "⚒️"
        },
        {
            name: "황금 곡괭이",
            cost: 80000,
            power: 50,
            luck: 0.12,
            icon: "🔨"
        },
        {
            name: "다이아 곡괭이",
            cost: 300000,
            power: 75,
            luck: 0.16,
            icon: "💎"
        },
        {
            name: "신화의 곡괭이",
            cost: 1200000,
            power: 110,
            luck: 0.22,
            icon: "🌟"
        },
        {
            name: "초월의 곡괭이",
            cost: 5000000,
            power: 160,
            luck: 0.30,
            icon: "🌈"
        }
    ],

    // 용병
    mercenaries: [
        {
            name: "초보 치아 수호자",
            icon: "🧑‍🚀",
            cost: 0,
            baseHp: 100,
            atkMul: 1.0,
            spd: 1.0,
            desc: "가장 기본적인 용병입니다."
        },
        {
            name: "숙련된 광부",
            icon: "👷",
            cost: 20000,
            baseHp: 140,
            atkMul: 1.15,
            spd: 1.05,
            desc: "체력과 공격력이 조금 높습니다."
        },
        {
            name: "치아 기사",
            icon: "🛡️",
            cost: 120000,
            baseHp: 230,
            atkMul: 1.35,
            spd: 0.95,
            desc: "단단한 체력으로 버티는 전투형 용병입니다."
        },
        {
            name: "치아 닌자",
            icon: "🥷",
            cost: 550000,
            baseHp: 170,
            atkMul: 1.55,
            spd: 1.35,
            desc: "이동속도가 빠르고 공격 배율이 높습니다."
        },
        {
            name: "치아 마법사",
            icon: "🧙",
            cost: 2500000,
            baseHp: 200,
            atkMul: 1.95,
            spd: 1.05,
            desc: "강력한 공격 배율을 가진 후반 용병입니다."
        },
        {
            name: "왕관 수호자",
            icon: "👑",
            cost: 12000000,
            baseHp: 360,
            atkMul: 2.6,
            spd: 1.15,
            desc: "왕관 치아의 힘을 다루는 전설 용병입니다."
        },
        {
            name: "지옥 정복자",
            icon: "🔥",
            cost: 80000000,
            baseHp: 520,
            atkMul: 3.4,
            spd: 1.25,
            desc: "HELL 던전을 위해 태어난 초월 용병입니다."
        }
    ],

    // 일반 던전 20개
    dungeons: [
        "충치 동굴 입구",
        "흔들리는 어금니 길",
        "검은 플라그 숲",
        "치석 바위산",
        "균열난 법랑질",
        "우식균 소굴",
        "잇몸 협곡",
        "상아질 미로",
        "치수의 문",
        "붉은 근관",
        "고대 치아 유적",
        "망가진 보철 성채",
        "균사체 늪지",
        "감염된 치근",
        "교합의 전장",
        "심연의 치주낭",
        "부러진 왕관의 길",
        "검은 치아 제단",
        "봉인의 회랑",
        "최종 우식왕의 성"
    ],

    // HELL 던전 20개
    hellDungeons: [
        "HELL 충치 동굴",
        "HELL 어금니 길",
        "HELL 플라그 숲",
        "HELL 치석 바위산",
        "HELL 법랑질 균열",
        "HELL 우식균 둥지",
        "HELL 잇몸 협곡",
        "HELL 상아질 미로",
        "HELL 치수의 문",
        "HELL 붉은 근관",
        "HELL 고대 유적",
        "HELL 보철 성채",
        "HELL 균사체 늪지",
        "HELL 감염 치근",
        "HELL 교합 전장",
        "HELL 치주낭 심연",
        "HELL 왕관의 길",
        "HELL 검은 제단",
        "HELL 봉인의 회랑",
        "HELL 우식마왕 성"
    ],

    // 일반 던전 몬스터 테마
    dungeonMobs: [
        { theme: "bg-cave", mobs: ["🦠", "🪱", "🦷"], boss: "🦠👑" },
        { theme: "bg-cave", mobs: ["🪨", "🦠", "🦴"], boss: "🪨👑" },
        { theme: "bg-stone", mobs: ["🌫️", "🦠", "🧫"], boss: "🧫👑" },
        { theme: "bg-stone", mobs: ["🪨", "🧱", "🦠"], boss: "🧱👑" },
        { theme: "bg-ice", mobs: ["❄️", "🧊", "🦠"], boss: "🧊👑" },

        { theme: "bg-cave", mobs: ["🦠", "🧫", "🪱"], boss: "🦠🔥" },
        { theme: "bg-stone", mobs: ["🌿", "🦠", "🦷"], boss: "🌿👑" },
        { theme: "bg-cave", mobs: ["🌀", "🦠", "🦴"], boss: "🌀👑" },
        { theme: "bg-fire", mobs: ["❤️‍🔥", "🦠", "🔥"], boss: "❤️‍🔥👑" },
        { theme: "bg-fire", mobs: ["🔥", "🦠", "🩸"], boss: "🔥👑" },

        { theme: "bg-cosmic", mobs: ["🏺", "🦠", "✨"], boss: "🏺👑" },
        { theme: "bg-stone", mobs: ["🛡️", "🦠", "🧱"], boss: "🛡️👑" },
        { theme: "bg-cave", mobs: ["🕸️", "🦠", "🪱"], boss: "🕸️👑" },
        { theme: "bg-fire", mobs: ["🦷", "🩸", "🦠"], boss: "🦷🔥" },
        { theme: "bg-cosmic", mobs: ["⚔️", "🦠", "💥"], boss: "⚔️👑" },

        { theme: "bg-cave", mobs: ["🕳️", "🦠", "🩸"], boss: "🕳️👑" },
        { theme: "bg-cosmic", mobs: ["👑", "🦷", "🦠"], boss: "👑🦷" },
        { theme: "bg-fire", mobs: ["🖤", "🦠", "🔥"], boss: "🖤👑" },
        { theme: "bg-cosmic", mobs: ["🔒", "🦷", "🦠"], boss: "🔒👑" },
        { theme: "bg-fire", mobs: ["👹", "🦠", "🔥"], boss: "👹🦷" }
    ],

    // HELL 몬스터 테마
    hellMobs: [
        { theme: "bg-hell", mobs: ["🔥", "👹", "🦠"], boss: "👹🔥" },
        { theme: "bg-hell", mobs: ["💀", "🔥", "🦷"], boss: "💀👑" },
        { theme: "bg-hell", mobs: ["🩸", "👹", "🦠"], boss: "🩸👑" },
        { theme: "bg-hell", mobs: ["🌋", "🔥", "🦠"], boss: "🌋👑" },
        { theme: "bg-hell", mobs: ["🧊", "🔥", "👹"], boss: "🔥🧊" },

        { theme: "bg-hell", mobs: ["🦠", "👹", "💥"], boss: "🦠👹" },
        { theme: "bg-hell", mobs: ["🌿", "🔥", "👹"], boss: "🌿🔥" },
        { theme: "bg-hell", mobs: ["🌀", "🔥", "👹"], boss: "🌀🔥" },
        { theme: "bg-hell", mobs: ["❤️‍🔥", "👹", "🩸"], boss: "❤️‍🔥👹" },
        { theme: "bg-hell", mobs: ["🔥", "💀", "🩸"], boss: "🔥💀" },

        { theme: "bg-cosmic", mobs: ["🏺", "🔥", "👹"], boss: "🏺🔥" },
        { theme: "bg-hell", mobs: ["🛡️", "🔥", "👹"], boss: "🛡️🔥" },
        { theme: "bg-hell", mobs: ["🕸️", "🔥", "👹"], boss: "🕸️🔥" },
        { theme: "bg-hell", mobs: ["🦷", "🔥", "🩸"], boss: "🦷👹" },
        { theme: "bg-cosmic", mobs: ["⚔️", "🔥", "👹"], boss: "⚔️🔥" },

        { theme: "bg-hell", mobs: ["🕳️", "🔥", "💀"], boss: "🕳️🔥" },
        { theme: "bg-cosmic", mobs: ["👑", "🔥", "🦷"], boss: "👑🔥" },
        { theme: "bg-hell", mobs: ["🖤", "🔥", "💀"], boss: "🖤🔥" },
        { theme: "bg-cosmic", mobs: ["🔒", "🔥", "👹"], boss: "🔒🔥" },
        { theme: "bg-hell", mobs: ["👹", "🔥", "👑"], boss: "👹👑" }
    ],

    // 유물: 일반 20개 + HELL 20개
    artifacts: [
        { name: "오래된 칫솔", icon: "🪥", desc: "채굴 속도에 미세한 축복을 줍니다." },
        { name: "부러진 어금니 조각", icon: "🦷", desc: "전투 치아의 힘을 조금 끌어올립니다." },
        { name: "플라그 결정", icon: "🧫", desc: "던전 보상 감각을 일깨웁니다." },
        { name: "치석 석판", icon: "🪨", desc: "단단한 방어 의지를 남깁니다." },
        { name: "법랑질 파편", icon: "💠", desc: "치아 성장의 기억이 담겨 있습니다." },

        { name: "우식균의 핵", icon: "🦠", desc: "강한 적을 쓰러뜨린 증표입니다." },
        { name: "잇몸의 씨앗", icon: "🌱", desc: "용병의 생존력을 북돋습니다." },
        { name: "상아질 나침반", icon: "🧭", desc: "던전 속 길을 찾는 데 도움을 줍니다." },
        { name: "치수의 붉은 보석", icon: "❤️", desc: "위험한 힘이 응축되어 있습니다." },
        { name: "근관의 불씨", icon: "🔥", desc: "공격 본능을 자극합니다." },

        { name: "고대 치아 항아리", icon: "🏺", desc: "잊힌 치아 문명의 유산입니다." },
        { name: "보철 방패", icon: "🛡️", desc: "전투 중 버티는 힘을 상징합니다." },
        { name: "균사체 표본", icon: "🕸️", desc: "광역 공격 연구의 단서입니다." },
        { name: "감염된 치근", icon: "🩸", desc: "HELL의 기운을 조금 품고 있습니다." },
        { name: "교합 검", icon: "⚔️", desc: "정확한 공격의 상징입니다." },

        { name: "심연의 돌", icon: "🕳️", desc: "깊은 던전의 어둠이 깃들었습니다." },
        { name: "부러진 왕관", icon: "👑", desc: "왕관 치아의 전설과 이어집니다." },
        { name: "검은 제단의 잔재", icon: "🖤", desc: "봉인을 해제하는 의식의 흔적입니다." },
        { name: "봉인의 자물쇠", icon: "🔒", desc: "Lv.MAX 해방의 비밀을 품고 있습니다." },
        { name: "우식왕의 심장", icon: "👹", desc: "일반 던전 최종 보스의 증표입니다." },

        { name: "HELL 낡은 칫솔", icon: "🔥🪥", desc: "지옥에서 불타오른 칫솔입니다." },
        { name: "HELL 어금니 조각", icon: "🔥🦷", desc: "지옥의 압력을 견딘 치아 조각입니다." },
        { name: "HELL 플라그 결정", icon: "🔥🧫", desc: "붉게 타오르는 플라그 결정입니다." },
        { name: "HELL 치석 석판", icon: "🔥🪨", desc: "지옥열에 단련된 석판입니다." },
        { name: "HELL 법랑질 파편", icon: "🔥💠", desc: "초월 각성의 잔광이 남아 있습니다." },

        { name: "HELL 우식균의 핵", icon: "🔥🦠", desc: "HELL 우식균의 심장부입니다." },
        { name: "HELL 잇몸의 씨앗", icon: "🔥🌱", desc: "지옥에서도 생존하는 씨앗입니다." },
        { name: "HELL 상아질 나침반", icon: "🔥🧭", desc: "지옥의 길을 가리킵니다." },
        { name: "HELL 치수 보석", icon: "🔥❤️", desc: "위험한 생명력이 깃든 보석입니다." },
        { name: "HELL 근관의 불씨", icon: "🔥🔥", desc: "끝없이 타오르는 전투의 불씨입니다." },

        { name: "HELL 고대 항아리", icon: "🔥🏺", desc: "지옥 문명의 잔해입니다." },
        { name: "HELL 보철 방패", icon: "🔥🛡️", desc: "고열을 버틴 지옥 방패입니다." },
        { name: "HELL 균사체 표본", icon: "🔥🕸️", desc: "광역 공격 연구의 심화 재료입니다." },
        { name: "HELL 감염 치근", icon: "🔥🩸", desc: "어둠에 물든 치근입니다." },
        { name: "HELL 교합 검", icon: "🔥⚔️", desc: "지옥의 전장에서 벼려진 검입니다." },

        { name: "HELL 심연의 돌", icon: "🔥🕳️", desc: "지옥 심연의 결정체입니다." },
        { name: "HELL 부러진 왕관", icon: "🔥👑", desc: "초월 왕관의 어두운 그림자입니다." },
        { name: "HELL 검은 제단", icon: "🔥🖤", desc: "지옥 의식의 중심입니다." },
        { name: "HELL 봉인의 자물쇠", icon: "🔥🔒", desc: "최후 봉인의 파편입니다." },
        { name: "HELL 우식마왕의 심장", icon: "🔥👹", desc: "HELL 최종 보스의 증표입니다." }
    ],

    // 인벤토리 확장 비용
    invExpansion: [
        { slots: 32, cost: 20000 },
        { slots: 40, cost: 120000 },
        { slots: 48, cost: 700000 },
        { slots: 56, cost: 3500000 }
    ],

    // Lv.MAX 해방 재료
    AWAKEN_REQ: {
        gold: 100000000,
        dia: 5000,
        bossMarks: 20,
        artifacts: 20
    },

    // 랭킹용 이름
    REAL_NICKNAMES: [
        "충치사냥꾼",
        "치아장인",
        "법랑질수호자",
        "왕관치아",
        "근관탐험가",
        "치석파괴자",
        "교합마스터",
        "HELL정복자",
        "초월치아",
        "우식왕킬러"
    ]
};

// =========================
// 숫자 포맷
// =========================
window.fNum = function(num) {
    num = Number(num) || 0;

    if (Math.abs(num) < 1000) return Math.floor(num).toString();

    const units = [
        "",
        "K",
        "M",
        "B",
        "T",
        "Qa",
        "Qi",
        "Sx",
        "Sp",
        "Oc",
        "No",
        "Dc"
    ];

    let unit = 0;

    while (Math.abs(num) >= 1000 && unit < units.length - 1) {
        num /= 1000;
        unit++;
    }

    const fixed = num >= 100 ? 0 : num >= 10 ? 1 : 2;

    return num.toFixed(fixed).replace(/\.0+$|(\.\d*[1-9])0+$/, "$1") + units[unit];
};

// =========================
// 치아 이름 / 표시
// =========================
window.getToothDisplayLevel = function(lv) {
    lv = Number(lv) || 0;

    if (lv >= 25) return "MAX";
    return lv.toString();
};

window.getToothName = function(lv) {
    lv = Number(lv) || 0;

    if (lv <= 0) return "빈 칸";

    const names = {
        1: "작은 유치",
        2: "튼튼한 유치",
        3: "흔들리는 영구치",
        4: "하얀 영구치",
        5: "강한 송곳니",
        6: "단단한 소구치",
        7: "전투 어금니",
        8: "빛나는 어금니",
        9: "푸른 법랑질 치아",
        10: "황금 치아",
        11: "고대 치아",
        12: "신비한 치아",
        13: "보석 치아",
        14: "용기의 치아",
        15: "심연의 치아",
        16: "화산 치아",
        17: "번개의 치아",
        18: "성스러운 치아",
        19: "전설의 치아",
        20: "신화의 치아",
        21: "초월의 치아",
        22: "우주의 치아",
        23: "왕의 치아",
        24: "봉인된 왕관 치아",
        25: "Lv.MAX 초월 왕관 치아"
    };

    return names[lv] || `Lv.${lv} 치아`;
};

// =========================
// 치아 아이콘
// =========================
window.getToothIcon = function(lv) {
    lv = Number(lv) || 0;

    if (lv <= 0) return "";

    const icon = getToothEmoji(lv);
    const cls = lv >= 25 ? "effect-tier-max" : `effect-tier-${lv}`;

    return `<span class="tooth-icon ${cls}">${icon}</span>`;
};

window.getToothEmoji = function(lv) {
    lv = Number(lv) || 0;

    if (lv <= 0) return "";

    if (lv <= 3) return "🦷";
    if (lv <= 6) return "🦴";
    if (lv <= 9) return "💠";
    if (lv <= 12) return "🟡";
    if (lv <= 15) return "💎";
    if (lv <= 18) return "🔥";
    if (lv <= 21) return "🌌";
    if (lv <= 23) return "🌠";
    if (lv === 24) return "👑";
    return "🌈👑";
};

// 전투 발사체용 단순 아이콘
// getToothIcon()은 HTML 효과가 들어가므로 미사일에는 사용하지 않음
window.getProjectileIcon = function(lv) {
    lv = Number(lv) || 0;

    if (lv <= 0) return "";

    if (lv <= 3) return "🦷";
    if (lv <= 6) return "🦴";
    if (lv <= 9) return "💠";
    if (lv <= 12) return "🟡";
    if (lv <= 15) return "💎";
    if (lv <= 18) return "🔥";
    if (lv <= 21) return "🌌";
    if (lv <= 23) return "🌠";
    if (lv === 24) return "👑";
    return "✨";
};

// =========================
// 공격력 계산
// =========================
// 기본 성장: Lv.1~24는 자연 성장
window.getBaseAtk = function(lv) {
    lv = Number(lv) || 0;

    if (lv <= 0) return 0;

    if (lv >= 25) {
        // Lv.MAX는 Lv.24 기준 폭발 성장
        return window.getBaseAtk(24) * 1000;
    }

    return Math.floor(20 * Math.pow(1.8, lv - 1));
};

window.getAtk = function(lv) {
    lv = Number(lv) || 0;

    if (lv <= 0) return 0;

    let atk;

    if (lv >= 25) {
        // Lv.MAX는 최종적으로 Lv.24 공격력의 1000배
        atk = window.getAtk(24) * 1000;
        return Math.floor(atk);
    }

    atk = window.getBaseAtk(lv);

    // 기존 후반 보너스 유지
    // Lv.19 이상 전체에 동일하게 적용되므로 Lv.23 -> Lv.24 증가율은 자연스럽게 유지됨
    if (lv >= 19) {
        atk *= 10;
    }

    return Math.floor(atk);
};

// =========================
// 게임 효과음
// =========================
window.soundEnabled = true;
window.masterVolume = 0.7;

let __toothAudioCtx = null;

function getAudioCtx() {
    if (__toothAudioCtx) return __toothAudioCtx;

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return null;

        __toothAudioCtx = new AudioContext();
        return __toothAudioCtx;
    } catch (e) {
        return null;
    }
}

window.playSfx = function(type) {
    if (!window.soundEnabled) return;

    const ctx = getAudioCtx();
    if (!ctx) return;

    try {
        if (ctx.state === "suspended") {
            ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        let freq = 440;
        let duration = 0.08;
        let wave = "square";

        switch (type) {
            case "mine":
                freq = 280;
                duration = 0.045;
                wave = "square";
                break;
            case "merge":
                freq = 660;
                duration = 0.09;
                wave = "triangle";
                break;
            case "great":
                freq = 880;
                duration = 0.18;
                wave = "sine";
                break;
            case "attack":
                freq = 520;
                duration = 0.035;
                wave = "square";
                break;
            case "hit":
                freq = 190;
                duration = 0.04;
                wave = "sawtooth";
                break;
            case "damage":
                freq = 120;
                duration = 0.08;
                wave = "sawtooth";
                break;
            case "unlock":
                freq = 720;
                duration = 0.16;
                wave = "triangle";
                break;
            case "buy":
                freq = 760;
                duration = 0.08;
                wave = "sine";
                break;
            case "error":
                freq = 90;
                duration = 0.12;
                wave = "sawtooth";
                break;
            default:
                freq = 440;
                duration = 0.06;
                wave = "square";
        }

        osc.type = wave;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08 * window.masterVolume, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration + 0.02);
    } catch (e) {}
};

// =========================
// 유물 보너스 계산
// =========================
window.getOwnedArtifactCount = function() {
    if (!Array.isArray(window.artifactCounts)) return 0;

    return window.artifactCounts.reduce((sum, v) => {
        return sum + (Number(v) > 0 ? 1 : 0);
    }, 0);
};

window.normalizeArtifactCounts = function() {
    if (!Array.isArray(window.artifactCounts)) return;

    for (let i = 0; i < window.artifactCounts.length; i++) {
        window.artifactCounts[i] = Number(window.artifactCounts[i]) > 0 ? 1 : 0;
    }
};

// =========================
// 쿠폰 정의
// 실제 처리는 engine.js에서 함
// =========================
window.COUPON_DATA = {
    START: {
        gold: 10000,
        dia: 100,
        message: "시작 지원 쿠폰을 사용했습니다."
    },
    DABOM: {
        gold: 50000,
        dia: 300,
        message: "다봄 쿠폰을 사용했습니다."
    },
    HELLTEST: {
        hellTest: true,
        message: "HELL 오픈 직전 테스트 상태가 적용되었습니다."
    },
    AWAKENTEST: {
        awakenTest: true,
        message: "Lv.MAX 해방 테스트 재료가 지급되었습니다."
    }
};

// =========================
// 안전 초기화 보조
// =========================
window.ensureArrayLength = function(arr, len, fillValue) {
    if (!Array.isArray(arr)) arr = [];

    while (arr.length < len) {
        arr.push(fillValue);
    }

    if (arr.length > len) {
        arr.length = len;
    }

    return arr;
};
