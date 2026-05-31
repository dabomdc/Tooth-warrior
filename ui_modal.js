/* ui_modal.js v8.2.0
   치아 연대기 - 도감 / 설정 / 공용 모달 UI
   핵심:
   - 치아도감 25단계 카드형 복구
   - 기본 공격력 표시
   - 유물도감 카드형 복구
   - 설정 탭에서 영상 다시보기
*/

"use strict";

/* =========================
   공통 유틸
========================= */

function modalFmt(value) {
  if (typeof window.formatNumber === "function") return window.formatNumber(value);
  if (typeof window.fmt === "function") return window.fmt(value);
  return String(Math.floor(Number(value) || 0));
}

function modalToast(message, type = "info", duration = 1700) {
  if (typeof window.showToast === "function") {
    window.showToast(message, type, duration);
  } else {
    console.log(message);
  }
}

function getModalRoot() {
  let modal = document.getElementById("generic-modal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "generic-modal";
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-box generic-modal-box">
        <div id="generic-modal-content"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  return modal;
}

function setModalContent(html) {
  const modal = getModalRoot();
  let content = document.getElementById("generic-modal-content");

  if (!content) {
    content = document.createElement("div");
    content.id = "generic-modal-content";
    modal.innerHTML = `
      <div class="modal-box generic-modal-box">
        <div id="generic-modal-content"></div>
      </div>
    `;
    content = document.getElementById("generic-modal-content");
  }

  content.innerHTML = html;

  modal.style.display = "flex";
  modal.classList.add("active");
}

function closeModal() {
  const modal = document.getElementById("generic-modal");
  if (!modal) return;

  modal.classList.remove("active");
  modal.style.display = "none";
}

function openModal(html) {
  if (typeof window.openGenericModal === "function") {
    window.openGenericModal(html);
  } else {
    setModalContent(html);
  }
}

function closeAnyModal() {
  if (typeof window.closeGenericModal === "function") {
    window.closeGenericModal();
  } else {
    closeModal();
  }

  const ids = [
    "shop-modal",
    "result-modal",
    "mercenary-modal",
    "training-modal",
    "retreat-confirm-modal"
  ];

  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = "none";
      el.classList.remove("active");
    }
  });
}

/* =========================
   치아도감
========================= */

function isToothDiscovered(level) {
  const lv = Number(level) || 0;

  if (lv <= 0) return false;

  if (Array.isArray(window.discoveredTeeth) && window.discoveredTeeth[lv]) {
    return true;
  }

  if (Array.isArray(window.inventory) && window.inventory.includes(lv)) {
    return true;
  }

  return false;
}

function getToothAttackText(level) {
  const lv = Number(level) || 1;

  const atk =
    typeof window.getBaseAttackByLevel === "function"
      ? window.getBaseAttackByLevel(lv)
      : typeof window.getBaseAtk === "function"
      ? window.getBaseAtk(lv)
      : typeof window.getAtk === "function"
      ? window.getAtk(lv)
      : lv * 10;

  return modalFmt(atk);
}

function buildToothCard(level) {
  const lv = Number(level) || 1;
  const discovered = isToothDiscovered(lv);

  const emoji =
    typeof window.getToothEmoji === "function"
      ? window.getToothEmoji(lv)
      : lv >= 25
      ? "✨👑✨"
      : "🦷";

  const name =
    typeof window.getToothName === "function"
      ? window.getToothName(lv)
      : lv >= 25
      ? "초월 왕관 치아"
      : `Lv.${lv} 치아`;

  const levelText =
    typeof window.getToothDisplayLevel === "function"
      ? window.getToothDisplayLevel(lv)
      : lv >= 25
      ? "Lv.MAX"
      : `Lv.${lv}`;

  const sizeClass =
    typeof window.getToothSizeClass === "function"
      ? window.getToothSizeClass(lv)
      : "";

  const themeClass =
    typeof window.getToothThemeClass === "function"
      ? window.getToothThemeClass(lv)
      : "";

  const atkText = getToothAttackText(lv);

  const isSealed = lv === (window.BALANCE?.MERGE_MAX_LEVEL || 24);
  const isMax = lv >= (window.BALANCE?.TRANSCEND_LEVEL || 25);

  return `
    <div class="dex-card tooth-dex-card ${themeClass} ${discovered ? "discovered" : "locked"} ${
    isSealed ? "sealed-card" : ""
  } ${isMax ? "max-card" : ""}">
      <div class="dex-level">${levelText}</div>
      ${isSealed ? `<div class="dex-seal">🔒</div>` : ""}
      <div class="dex-icon ${sizeClass}">
        ${discovered ? emoji : "❔"}
      </div>
      <div class="dex-name">${discovered ? name : "미발견 치아"}</div>
      <div class="dex-stat">
        <span>기본 공격력</span>
        <b>${atkText}</b>
      </div>
      <div class="dex-desc">
        ${
          isMax
            ? "봉인해제를 통해 제작되는 최종 MAX 치아입니다."
            : isSealed
            ? "합성으로 도달하는 봉인된 왕관 치아입니다."
            : discovered
            ? "수집 완료"
            : "아직 수집하지 못했습니다."
        }
      </div>
    </div>
  `;
}

function openToothDex() {
  const max = window.BALANCE?.TRANSCEND_LEVEL || 25;

  const discoveredCount = Array.from({ length: max }, (_, i) => i + 1).filter((lv) =>
    isToothDiscovered(lv)
  ).length;

  const cards = Array.from({ length: max }, (_, i) => buildToothCard(i + 1)).join("");

  const html = `
    <div class="dex-modal-inner">
      <div class="modal-header-row">
        <div>
          <h2>🦷 치아도감</h2>
          <p>수집한 치아와 기본 공격력을 확인합니다.</p>
        </div>
        <button class="modal-close-btn" onclick="closeAnyModal()">×</button>
      </div>

      <div class="dex-summary">
        <div>
          <span>수집률</span>
          <b>${discoveredCount} / ${max}</b>
        </div>
        <div>
          <span>채굴 최대</span>
          <b>Lv.${window.BALANCE?.MINING_MAX_LEVEL || 12}</b>
        </div>
        <div>
          <span>합성 최대</span>
          <b>Lv.${window.BALANCE?.MERGE_MAX_LEVEL || 24}</b>
        </div>
        <div>
          <span>최종 단계</span>
          <b>Lv.MAX</b>
        </div>
      </div>

      <div class="dex-note">
        도감의 공격력은 치아 자체의 <b>기본 공격력</b>입니다.
        슬롯 제련, 용병, 훈련, 유물 효과는 실제 전투에서 추가로 반영됩니다.
      </div>

      <div class="dex-grid tooth-dex-grid">
        ${cards}
      </div>

      <button class="btn-sub full" onclick="closeAnyModal()">닫기</button>
    </div>
  `;

  openModal(html);
}

/* =========================
   유물도감
========================= */

function isArtifactDiscovered(artifact) {
  if (!artifact) return false;

  const id = artifact.id || artifact.name;

  if (window.discoveredArtifacts && window.discoveredArtifacts[id]) return true;
  if (window.artifactCounts && Number(window.artifactCounts[id]) > 0) return true;

  return false;
}

function getArtifactCount(artifact) {
  if (!artifact) return 0;

  const id = artifact.id || artifact.name;

  if (window.artifactCounts && Number(window.artifactCounts[id]) > 0) {
    return Number(window.artifactCounts[id]);
  }

  return isArtifactDiscovered(artifact) ? 1 : 0;
}

function buildArtifactCard(artifact, index) {
  const discovered = isArtifactDiscovered(artifact);
  const count = getArtifactCount(artifact);

  const icon = artifact?.icon || "🏺";
  const name = artifact?.name || `유물 ${index + 1}`;
  const desc = artifact?.desc || "던전에서 발견되는 유물입니다.";
  const effectText = artifact?.effectText || artifact?.effect || "특수 효과";

  return `
    <div class="dex-card artifact-dex-card ${discovered ? "discovered" : "locked"}">
      <div class="artifact-index">No.${index + 1}</div>
      <div class="dex-icon artifact-icon">${discovered ? icon : "❔"}</div>
      <div class="dex-name">${discovered ? name : "미발견 유물"}</div>
      <div class="artifact-count">보유 ${count}개</div>
      <div class="dex-desc">${discovered ? desc : "아직 발견하지 못했습니다."}</div>
      <div class="artifact-effect">
        <span>효과</span>
        <b>${discovered ? effectText : "???"}</b>
      </div>
    </div>
  `;
}

function openArtifactDex() {
  const artifacts = window.TOOTH_DATA?.artifacts || window.artifacts || [];

  const discoveredCount = artifacts.filter((artifact) => isArtifactDiscovered(artifact)).length;

  const cards =
    artifacts.length > 0
      ? artifacts.map((artifact, index) => buildArtifactCard(artifact, index)).join("")
      : `
        <div class="empty-dex-message">
          등록된 유물 데이터가 없습니다.
        </div>
      `;

  const html = `
    <div class="dex-modal-inner">
      <div class="modal-header-row">
        <div>
          <h2>🏺 유물도감</h2>
          <p>던전에서 획득한 유물을 확인합니다.</p>
        </div>
        <button class="modal-close-btn" onclick="closeAnyModal()">×</button>
      </div>

      <div class="dex-summary">
        <div>
          <span>발견</span>
          <b>${discoveredCount} / ${artifacts.length}</b>
        </div>
        <div>
          <span>획득처</span>
          <b>던전</b>
        </div>
      </div>

      <div class="dex-grid artifact-dex-grid">
        ${cards}
      </div>

      <button class="btn-sub full" onclick="closeAnyModal()">닫기</button>
    </div>
  `;

  openModal(html);
}

/* =========================
   영상 다시보기 / 설정
========================= */

function isVideoUnlockedForSettings(video) {
  if (!video) return false;

  if (typeof window.isReplayVideoUnlocked === "function") {
    return window.isReplayVideoUnlocked(video.key);
  }

  if (video.key === "intro") return true;
  if (video.key === "hell") return !!window.hellUnlocked || !!window.hasSeenHellIntro;
  if (video.key === "awaken") return !!window.hasPlayedAwakenVideo;

  return false;
}

function buildReplayVideoButton(video) {
  const unlocked = isVideoUnlockedForSettings(video);

  return `
    <button
      class="setting-video-btn ${unlocked ? "" : "locked"}"
      onclick="${unlocked ? `replayVideo('${video.key}')` : `modalToast('아직 해금되지 않은 영상입니다.', 'info')`}"
    >
      <span class="video-icon">${unlocked ? video.icon : "🔒"}</span>
      <b>${video.title}</b>
      <em>${unlocked ? "다시보기" : "잠김"}</em>
    </button>
  `;
}

function openSettingsModal() {
  const videos = window.REPLAY_VIDEOS || [
    {
      key: "intro",
      title: "인트로 영상",
      icon: "🎬",
      playFunction: "playIntroVideo"
    },
    {
      key: "hell",
      title: "지옥문 개방 영상",
      icon: "🔥",
      playFunction: "playHellVideo"
    },
    {
      key: "awaken",
      title: "초월 왕관 치아 각성 영상",
      icon: "👑",
      playFunction: "playAwakenVideo"
    }
  ];

  const videoHtml = videos.map((video) => buildReplayVideoButton(video)).join("");

  const html = `
    <div class="settings-modal-inner">
      <div class="modal-header-row">
        <div>
          <h2>⚙️ 설정</h2>
          <p>저장 관리와 영상 다시보기를 사용할 수 있습니다.</p>
        </div>
        <button class="modal-close-btn" onclick="closeAnyModal()">×</button>
      </div>

      <div class="settings-section">
        <h3>🎞️ 영상 다시보기</h3>
        <p>한 번 재생된 주요 영상은 이곳에서 다시 볼 수 있습니다.</p>
        <div class="setting-video-list">
          ${videoHtml}
        </div>
      </div>

      <div class="settings-section">
        <h3>💾 저장 관리</h3>
        <div class="settings-grid">
          <button class="btn-sub" onclick="saveGame(true); modalToast('저장되었습니다.', 'success')">수동 저장</button>
          <button class="btn-sub" onclick="exportSave()">저장코드 복사</button>
          <button class="btn-sub" onclick="importSave()">저장코드 불러오기</button>
          <button class="btn-danger" onclick="resetGame()">초기화</button>
        </div>
      </div>

      <div class="settings-section">
        <h3>ℹ️ 게임 정보</h3>
        <div class="settings-info-box">
          <div><span>버전</span><b>${window.GAME_VERSION || "8.2.0"}</b></div>
          <div><span>채굴 최대</span><b>Lv.${window.BALANCE?.MINING_MAX_LEVEL || 12}</b></div>
          <div><span>합성 최대</span><b>Lv.${window.BALANCE?.MERGE_MAX_LEVEL || 24}</b></div>
          <div><span>최종 단계</span><b>Lv.MAX</b></div>
        </div>
      </div>

      <button class="btn-main full" onclick="closeAnyModal()">닫기</button>
    </div>
  `;

  openModal(html);
}

function replayVideo(key) {
  const videos = window.REPLAY_VIDEOS || [];
  const video = videos.find((item) => item.key === key);

  if (!video) {
    modalToast("영상을 찾을 수 없습니다.", "danger");
    return;
  }

  if (!isVideoUnlockedForSettings(video)) {
    modalToast("아직 해금되지 않은 영상입니다.", "info");
    return;
  }

  const fn = window[video.playFunction];

  if (typeof fn === "function") {
    fn(true);
  } else {
    modalToast("영상 재생 함수를 찾을 수 없습니다.", "danger");
  }
}

/* =========================
   기존 버튼명 호환용 별칭
========================= */

function openToothBook() {
  openToothDex();
}

function openToothCodex() {
  openToothDex();
}

function openToothCollection() {
  openToothDex();
}

function showToothDex() {
  openToothDex();
}

function openArtifactBook() {
  openArtifactDex();
}

function openArtifactCodex() {
  openArtifactDex();
}

function openArtifactCollection() {
  openArtifactDex();
}

function showArtifactDex() {
  openArtifactDex();
}

function openSettings() {
  openSettingsModal();
}

function openSettingModal() {
  openSettingsModal();
}

function showSettings() {
  openSettingsModal();
}

function openCollectionModal(type) {
  if (type === "artifact" || type === "artifacts" || type === "유물") {
    openArtifactDex();
    return;
  }

  openToothDex();
}

function openCodex(type) {
  openCollectionModal(type);
}

/* =========================
   전역 노출
========================= */

window.closeAnyModal = closeAnyModal;
window.closeModal = closeModal;

window.openToothDex = openToothDex;
window.openToothBook = openToothBook;
window.openToothCodex = openToothCodex;
window.openToothCollection = openToothCollection;
window.showToothDex = showToothDex;

window.openArtifactDex = openArtifactDex;
window.openArtifactBook = openArtifactBook;
window.openArtifactCodex = openArtifactCodex;
window.openArtifactCollection = openArtifactCollection;
window.showArtifactDex = showArtifactDex;

window.openSettingsModal = openSettingsModal;
window.openSettings = openSettings;
window.openSettingModal = openSettingModal;
window.showSettings = showSettings;

window.replayVideo = replayVideo;

window.openCollectionModal = openCollectionModal;
window.openCodex = openCodex;

console.log("치아 연대기 ui_modal.js loaded v8.2.0");
