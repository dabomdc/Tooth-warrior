/* data.js v8.2.0
   치아 연대기 - 데이터 / 밸런스 / 이름 / 아이콘 정의
   이번 버전 핵심:
   - 치아 Lv.25 / Lv.MAX 초월 왕관 치아 추가
   - 채굴 직접 획득 최대 Lv.12 고정
   - 합성 최대 Lv.24 고정
   - Lv.25는 봉인해제로만 제작
   - 16~18 용암, 19~21 오로라, 22~24 왕관, 25 초월 왕관
   - 곡괭이 도구 + 재료 배지 방식 정리
*/

"use strict";

window.GAME_VERSION = "8.2.0";

window.BALANCE = {
  MINING_MAX_LEVEL: 12,
  MERGE_MAX_LEVEL: 24,
  TRANSCEND_LEVEL: 25,
  PICKAXE_MAX_LEVEL: 8,
  TOP_SLOT_COUNT: 8,
  BASE_INVENTORY_SIZE: 56,
  MAX_INVENTORY_SIZE: 96
};

window.TRANSCEND_COST = {
  gold: 1_000_000_000_000_000,
  diamond: 5000,
  bossToken: 5
};

/* =========================
   치아 레벨 체계
========================= */

window.TOOTH_TIERS = [
  {
    from: 1,
    to: 3,
    icon: "🦷",
    baseName: "일반 치아",
    themeClass: "tooth-normal"
  },
  {
    from: 4,
    to: 6,
    icon: "🦴",
    baseName: "뿌리 치아",
    themeClass: "tooth-root"
  },
  {
    from: 7,
    to: 9,
    icon: "🛡️",
    baseName: "수호 치아",
    themeClass: "tooth-guard"
  },
  {
    from: 10,
    to: 12,
    icon: "⚜️",
    baseName: "성문장 치아",
    themeClass: "tooth-emblem"
  },
  {
    from: 13,
    to: 15,
    icon: "💎",
    baseName: "다이아 치아",
    themeClass: "tooth-diamond"
  },
  {
    from: 16,
    to: 18,
    icon: "🌋",
    baseName: "용암 치아",
    themeClass: "tooth-lava"
  },
  {
    from: 19,
    to: 21,
    icon: "🌌",
    baseName: "오로라 치아",
    themeClass: "tooth-aurora"
  },
  {
    from: 22,
    to: 24,
    icon: "👑",
    baseName: "왕관 치아",
    themeClass: "tooth-crown"
  },
  {
    from: 25,
    to: 25,
    icon: "✨👑✨",
    baseName: "초월 왕관 치아",
    themeClass: "tooth-transcend"
  }
];

function clampToothLevel(level) {
  const lv = Number(level) || 1;
  return Math.max(1, Math.min(window.BALANCE.TRANSCEND_LEVEL, lv));
}

function getToothTier(level) {
  const lv = clampToothLevel(level);
  return window.TOOTH_TIERS.find((tier) => lv >= tier.from && lv <= tier.to) || window.TOOTH_TIERS[0];
}

function getToothStep(level) {
  const lv = clampToothLevel(level);

  if (lv >= window.BALANCE.TRANSCEND_LEVEL) return "max";

  const step = ((lv - 1) % 3) + 1;

  if (step === 1) return "small";
  if (step === 2) return "middle";
  return "large";
}

function getToothSizeClass(level) {
  const step = getToothStep(level);

  if (step === "small") return "tooth-size-small";
  if (step === "middle") return "tooth-size-middle";
  if (step === "large") return "tooth-size-large";
  return "tooth-size-max";
}

function getToothEmoji(level) {
  const lv = clampToothLevel(level);
  return getToothTier(lv).icon;
}

function getSimpleToothEmoji(level) {
  return getToothEmoji(level);
}

function getToothName(level) {
  const lv = clampToothLevel(level);
  const tier = getToothTier(lv);

  if (lv >= window.BALANCE.TRANSCEND_LEVEL) {
    return "초월 왕관 치아";
  }

  const step = getToothStep(lv);

  if (step === "small") return `작은 ${tier.baseName}`;
  if (step === "middle") return tier.baseName;
  if (step === "large") return `거대한 ${tier.baseName}`;

  return tier.baseName;
}

function getToothDisplayLevel(level) {
  const lv = clampToothLevel(level);
  if (lv >= window.BALANCE.TRANSCEND_LEVEL) return "Lv.MAX";
  return `Lv.${lv}`;
}

function getToothThemeClass(level) {
  return getToothTier(level).themeClass;
}

function isMaxTooth(level) {
  return clampToothLevel(level) >= window.BALANCE.TRANSCEND_LEVEL;
}

function isSealedCrownTooth(level) {
  return clampToothLevel(level) === window.BALANCE.MERGE_MAX_LEVEL;
}

function canMergeLevel(level) {
  const lv = clampToothLevel(level);
  return lv < window.BALANCE.MERGE_MAX_LEVEL;
}

function canTranscendLevel(level) {
  return clampToothLevel(level) === window.BALANCE.MERGE_MAX_LEVEL;
}

/* 기본 공격력
   도감에는 이 값만 표시.
   슬롯 제련, 훈련, 용병, 유물 효과는 실제 전투 계산에서 추가.
*/
function getBaseAttackByLevel(level) {
  const lv = clampToothLevel(level);

  const table = {
    1: 10,
    2: 18,
    3: 32,
    4: 58,
    5: 105,
    6: 190,
    7: 340,
    8: 610,
    9: 1100,
    10: 1980,
    11: 3560,
    12: 6400,
    13: 11500,
    14: 20700,
    15: 37300,
    16: 67100,
    17: 120800,
    18: 217400,
    19: 391300,
    20: 704300,
    21: 1268000,
    22: 2282000,
    23: 4108000,
    24: 7394000,
    25: 15000000
  };

  return table[lv] || Math.floor(10 * Math.pow(1.8, lv - 1));
}

/* 기존 코드 호환용 별칭 */
window.getAtk = window.getAtk || getBaseAttackByLevel;
window.getBaseAtk = getBaseAttackByLevel;
window.getBaseAttackByLevel = getBaseAttackByLevel;
window.getToothEmoji = getToothEmoji;
window.getSimpleToothEmoji = getSimpleToothEmoji;
window.getToothName = getToothName;
window.getToothDisplayLevel = getToothDisplayLevel;
window.getToothSizeClass = getToothSizeClass;
window.getToothThemeClass = getToothThemeClass;
window.clampToothLevel = clampToothLevel;
window.isMaxTooth = isMaxTooth;
window.isSealedCrownTooth = isSealedCrownTooth;
window.canMergeLevel = canMergeLevel;
window.canTranscendLevel = canTranscendLevel;

/* 1-based 배열 호환용 */
window.toothIcons = Array.from({ length: 26 }, (_, index) => {
  if (index === 0) return "";
  return getToothEmoji(index);
});

window.toothNames = Array.from({ length: 26 }, (_, index) => {
  if (index === 0) return "";
  return getToothName(index);
});

/* =========================
   곡괭이 체계
========================= */

window.PICKAXES = [
  {
    level: 1,
    icon: "🪵⛏️",
    name: "나무 곡괭이",
    power: 1,
    cost: 0,
    desc: "기본 채굴 도구"
  },
  {
    level: 2,
    icon: "🪨⛏️",
    name: "돌 곡괭이",
    power: 2,
    cost: 100,
    desc: "조금 더 단단한 곡괭이"
  },
  {
    level: 3,
    icon: "⚙️⛏️",
    name: "철 곡괭이",
    power: 5,
    cost: 1200,
    desc: "안정적인 채굴 성능"
  },
  {
    level: 4,
    icon: "🪙⛏️",
    name: "황금 곡괭이",
    power: 12,
    cost: 15000,
    desc: "황금빛 채굴 도구"
  },
  {
    level: 5,
    icon: "💎⛏️",
    name: "다이아 곡괭이",
    power: 30,
    cost: 240000,
    desc: "고급 광맥을 뚫는 곡괭이"
  },
  {
    level: 6,
    icon: "🔥⛏️",
    name: "용암 곡괭이",
    power: 75,
    cost: 4_500_000,
    desc: "뜨거운 광맥을 녹여 채굴"
  },
  {
    level: 7,
    icon: "⚡⛏️",
    name: "번개 곡괭이",
    power: 180,
    cost: 100_000_000,
    desc: "순간적으로 광석을 쪼개는 곡괭이"
  },
  {
    level: 8,
    icon: "🔱⛏️",
    name: "신화의 곡괭이",
    power: 420,
    cost: 3_000_000_000,
    desc: "최고 등급 채굴 도구"
  }
];

function getPickaxeInfo(level) {
  const lv = Math.max(1, Math.min(window.BALANCE.PICKAXE_MAX_LEVEL, Number(level) || 1));
  return window.PICKAXES[lv - 1] || window.PICKAXES[0];
}

function getPickaxeDisplay(level) {
  const pickaxe = getPickaxeInfo(level);
  return `${pickaxe.icon} ${pickaxe.name} Lv.${pickaxe.level} / ${window.BALANCE.PICKAXE_MAX_LEVEL}`;
}

window.getPickaxeInfo = getPickaxeInfo;
window.getPickaxeDisplay = getPickaxeDisplay;

window.pickaxeIcons = window.PICKAXES.map((p) => p.icon);
window.pickaxeNames = window.PICKAXES.map((p) => p.name);
window.pickaxePowers = window.PICKAXES.map((p) => p.power);
window.pickaxeCosts = window.PICKAXES.map((p) => p.cost);

/* =========================
   던전 테마
========================= */

window.DUNGEON_THEMES = {
  forest: {
    name: "숲의 충치굴",
    className: "dungeon-theme-forest"
  },
  cave: {
    name: "회색 석회동굴",
    className: "dungeon-theme-cave"
  },
  ice: {
    name: "푸른 결정 폐허",
    className: "dungeon-theme-ice"
  },
  lava: {
    name: "용암 치근 지대",
    className: "dungeon-theme-lava"
  },
  royal: {
    name: "왕관의 성역",
    className: "dungeon-theme-royal"
  },
  boss: {
    name: "보스의 방",
    className: "dungeon-theme-boss"
  },
  hell: {
    name: "HELL 심연",
    className: "dungeon-theme-hell"
  },
  hellboss: {
    name: "HELL 보스 심장부",
    className: "dungeon-theme-hellboss"
  }
};

function getDungeonThemeKey(stage, mode) {
  const type = String(mode || "").toLowerCase();

  if (type === "hellboss") return "hellboss";
  if (type === "hell") return "hell";
  if (type === "boss") return "boss";

  const s = Number(stage) || 1;

  if (s <= 5) return "forest";
  if (s <= 10) return "cave";
  if (s <= 15) return "ice";
  if (s <= 20) return "lava";
  return "royal";
}

function getDungeonThemeClass(stage, mode) {
  const key = getDungeonThemeKey(stage, mode);
  return window.DUNGEON_THEMES[key]?.className || window.DUNGEON_THEMES.forest.className;
}

window.getDungeonThemeKey = getDungeonThemeKey;
window.getDungeonThemeClass = getDungeonThemeClass;

/* =========================
   던전 / 몬스터 / 유물
========================= */

window.TOOTH_DATA = {
  maxLevel: window.BALANCE.TRANSCEND_LEVEL,
  mergeMaxLevel: window.BALANCE.MERGE_MAX_LEVEL,
  miningMaxLevel: window.BALANCE.MINING_MAX_LEVEL,
  transcendLevel: window.BALANCE.TRANSCEND_LEVEL,

  icons: window.toothIcons,
  baseNames: window.toothNames,

  stageNames: [
    "입문자의 충치굴",
    "작은 법랑질 동굴",
    "초록 플라그 숲",
    "붉은 치석 협곡",
    "보라 세균 늪",
    "은빛 치근 광산",
    "황금 교합 평원",
    "다이아 법랑 성소",
    "용암 치수 지대",
    "오로라 치아 성역",
    "왕관의 문",
    "봉인된 왕관의 방"
  ],

  dungeonMobs: [
    { name: "작은 충치균", icon: "🦠", hp: 40, atk: 5, speed: 0.55, reward: 8 },
    { name: "플라그 덩어리", icon: "🟢", hp: 90, atk: 8, speed: 0.48, reward: 18 },
    { name: "산성 세균", icon: "🧪", hp: 180, atk: 14, speed: 0.52, reward: 36 },
    { name: "치석 골렘", icon: "🪨", hp: 360, atk: 24, speed: 0.42, reward: 75 },
    { name: "검은 충치 기사", icon: "♟️", hp: 720, atk: 40, speed: 0.58, reward: 150 },
    { name: "치근 흡수귀", icon: "🦴", hp: 1350, atk: 70, speed: 0.62, reward: 320 },
    { name: "균열 수호자", icon: "🛡️", hp: 2600, atk: 115, speed: 0.50, reward: 700 },
    { name: "용암 세균", icon: "🌋", hp: 5200, atk: 190, speed: 0.55, reward: 1600 },
    { name: "오로라 포식자", icon: "🌌", hp: 9500, atk: 320, speed: 0.66, reward: 3800 },
    { name: "왕관 파수꾼", icon: "👑", hp: 18000, atk: 520, speed: 0.58, reward: 9000 }
  ],

  hellMobs: [
    { name: "HELL 충치균", icon: "😈", hp: 50000, atk: 900, speed: 0.72, reward: 25000 },
    { name: "심연의 플라그", icon: "🕳️", hp: 85000, atk: 1400, speed: 0.64, reward: 45000 },
    { name: "검붉은 치석마", icon: "🔥", hp: 140000, atk: 2300, speed: 0.70, reward: 80000 },
    { name: "지옥 왕관 수호자", icon: "💀", hp: 240000, atk: 3800, speed: 0.62, reward: 150000 }
  ],

  bosses: [
    { name: "거대 충치균", icon: "🦠", hp: 2500, atk: 60, reward: 2000, token: 1 },
    { name: "치석 군주", icon: "🪨", hp: 18000, atk: 220, reward: 15000, token: 1 },
    { name: "용암 치수룡", icon: "🐉", hp: 90000, atk: 850, reward: 80000, token: 2 },
    { name: "오로라 균왕", icon: "🌌", hp: 260000, atk: 2200, reward: 260000, token: 3 },
    { name: "봉인 왕관의 그림자", icon: "👑", hp: 800000, atk: 5200, reward: 900000, token: 5 }
  ],

  hellBosses: [
    { name: "HELL 충치 대마왕", icon: "👿", hp: 1800000, atk: 9000, reward: 2500000, token: 8 },
    { name: "심연의 왕관 파괴자", icon: "💀", hp: 5000000, atk: 18000, reward: 9000000, token: 12 }
  ],

  artifacts: [
    {
      id: "root_core",
      name: "치근의 핵",
      icon: "🦴",
      desc: "기본 공격력 증가",
      effectText: "전체 치아 공격력 증가"
    },
    {
      id: "enamel_shield",
      name: "법랑 방패",
      icon: "🛡️",
      desc: "용병 생존력 증가",
      effectText: "용병 체력 증가"
    },
    {
      id: "golden_cusp",
      name: "황금 교두",
      icon: "🪙",
      desc: "골드 획득량 증가",
      effectText: "골드 보상 증가"
    },
    {
      id: "diamond_pulp",
      name: "다이아 치수",
      icon: "💎",
      desc: "채굴 보상 강화",
      effectText: "채굴 보상 증가"
    },
    {
      id: "lava_root",
      name: "용암 치근",
      icon: "🌋",
      desc: "스플래시 공격 강화",
      effectText: "범위 피해 증가"
    },
    {
      id: "aurora_nerve",
      name: "오로라 신경",
      icon: "🌌",
      desc: "공격 속도 강화",
      effectText: "공격 쿨타임 감소"
    },
    {
      id: "crown_seal",
      name: "왕관의 봉인",
      icon: "👑",
      desc: "초월의 단서",
      effectText: "최종 각성의 흔적"
    },
    {
      id: "transcend_spark",
      name: "초월의 불꽃",
      icon: "✨",
      desc: "초월 왕관 치아의 흔적",
      effectText: "Lv.MAX의 증표"
    }
  ]
};

window.DATA = window.TOOTH_DATA;

/* =========================
   용병 / 훈련 데이터
========================= */

window.MERCENARIES = [
  {
    id: 0,
    name: "견습 치아병",
    icon: "🧑‍🚀",
    cost: 0,
    hp: 800,
    atkRate: 1,
    speed: 1,
    desc: "기본 용병"
  },
  {
    id: 1,
    name: "방패 치아병",
    icon: "🛡️",
    cost: 5000,
    hp: 1800,
    atkRate: 1.05,
    speed: 0.95,
    desc: "높은 체력"
  },
  {
    id: 2,
    name: "번개 궁수",
    icon: "⚡",
    cost: 80000,
    hp: 2400,
    atkRate: 1.2,
    speed: 1.15,
    desc: "빠른 공격"
  },
  {
    id: 3,
    name: "용암 기사",
    icon: "🌋",
    cost: 900000,
    hp: 5200,
    atkRate: 1.45,
    speed: 1,
    desc: "강한 공격력"
  },
  {
    id: 4,
    name: "오로라 사수",
    icon: "🌌",
    cost: 12000000,
    hp: 8500,
    atkRate: 1.8,
    speed: 1.25,
    desc: "상위 공격 용병"
  },
  {
    id: 5,
    name: "왕관 수호자",
    icon: "👑",
    cost: 250000000,
    hp: 18000,
    atkRate: 2.4,
    speed: 1.15,
    desc: "왕관급 최종 용병"
  }
];

window.TRAINING_TYPES = [
  {
    key: "hp",
    name: "체력 훈련",
    icon: "❤️",
    desc: "용병 최대 체력 증가",
    max: 50
  },
  {
    key: "atk",
    name: "공격 훈련",
    icon: "⚔️",
    desc: "용병 공격력 증가",
    max: 50
  },
  {
    key: "spd",
    name: "속도 훈련",
    icon: "🏃",
    desc: "이동 속도 증가",
    max: 30
  },
  {
    key: "crit",
    name: "치명 훈련",
    icon: "💥",
    desc: "치명타 확률 증가",
    max: 30
  },
  {
    key: "splashDmg",
    name: "범위 피해 훈련",
    icon: "🌊",
    desc: "스플래시 피해 증가",
    max: 30
  },
  {
    key: "splashRange",
    name: "범위 확장 훈련",
    icon: "📡",
    desc: "스플래시 범위 증가",
    max: 30
  }
];

/* =========================
   영상 다시보기 데이터
========================= */

window.REPLAY_VIDEOS = [
  {
    key: "intro",
    title: "인트로 영상",
    icon: "🎬",
    unlockType: "always",
    playFunction: "playIntroVideo"
  },
  {
    key: "hell",
    title: "지옥문 개방 영상",
    icon: "🔥",
    unlockType: "hell",
    playFunction: "playHellVideo"
  },
  {
    key: "awaken",
    title: "초월 왕관 치아 각성 영상",
    icon: "👑",
    unlockType: "awaken",
    playFunction: "playAwakenVideo"
  }
];

function isReplayVideoUnlocked(key) {
  if (key === "intro") return true;
  if (key === "hell") return !!window.hasSeenHellIntro || !!window.hellUnlocked;
  if (key === "awaken") return !!window.hasPlayedAwakenVideo;
  return false;
}

window.isReplayVideoUnlocked = isReplayVideoUnlocked;

/* =========================
   안전 초기값
   실제 저장 데이터 로드는 engine.js에서 덮어씀
========================= */

if (typeof window.hasSeenTranscendGuide === "undefined") {
  window.hasSeenTranscendGuide = false;
}

if (typeof window.hasPlayedAwakenVideo === "undefined") {
  window.hasPlayedAwakenVideo = false;
}

if (typeof window.hasSeenHellIntro === "undefined") {
  window.hasSeenHellIntro = false;
}

if (typeof window.hellUnlocked === "undefined") {
  window.hellUnlocked = false;
}

/* =========================
   디버그 확인용
========================= */

console.log(`치아 연대기 data.js loaded v${window.GAME_VERSION}`);
console.log(
  `채굴 최대 Lv.${window.BALANCE.MINING_MAX_LEVEL}, 합성 최대 Lv.${window.BALANCE.MERGE_MAX_LEVEL}, 초월 Lv.${window.BALANCE.TRANSCEND_LEVEL}`
);
