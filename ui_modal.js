/* ui_modal.js v8.3.0
   도감 / 설정 / 랭킹 / 공용 모달 UI
*/
"use strict";

function modalFmt(value) {
  if (typeof window.formatNumber === "function") return window.formatNumber(value);
  return String(Math.floor(Number(value) || 0));
}

function modalToast(message, type = "info", duration = 1700) {
  if (typeof window.showToast === "function") window.showToast(message, type, duration);
  else console.log(message);
}

function closeAnyModal() {
  if (typeof window.closeGenericModal === "function") window.closeGenericModal();
  document.querySelectorAll(".modal-layer, .modal-overlay").forEach((el) => {
    if (el.id !== "generic-modal") {
      el.style.display = "none";
      el.classList.remove("active");
    }
  });
}

function isToothDiscovered(level) {
  const lv = Number(level) || 0;
  if (lv <= 0) return false;
  if (Array.isArray(window.discoveredTeeth) && window.discoveredTeeth[lv]) return true;
  if (Array.isArray(window.inventory) && window.inventory.includes(lv)) return true;
  return false;
}

function getToothAttackText(level) {
  const lv = Number(level) || 1;
  const atk = typeof window.getBaseAttackByLevel === "function" ? window.getBaseAttackByLevel(lv) : lv * 10;
  return modalFmt(atk);
}

function buildToothCard(level) {
  const lv = Number(level) || 1;
  const discovered = isToothDiscovered(lv);
  const emoji = typeof window.getToothEmoji === "function" ? window.getToothEmoji(lv) : "🦷";
  const name = typeof window.getToothName === "function" ? window.getToothName(lv) : `Lv.${lv} 치아`;
  const levelText = typeof window.getToothDisplayLevel === "function" ? window.getToothDisplayLevel(lv) : `Lv.${lv}`;
  const sizeClass = typeof window.getToothSizeClass === "function" ? window.getToothSizeClass(lv) : "";
  const themeClass = typeof window.getToothThemeClass === "function" ? window.getToothThemeClass(lv) : "";
  const isSealed = lv === (window.BALANCE?.MERGE_MAX_LEVEL || 24);
  const isMax = lv >= (window.BALANCE?.TRANSCEND_LEVEL || 25);
  return `
    <div class="dex-card tooth-dex-card ${themeClass} ${discovered ? "discovered" : "locked"} ${isSealed ? "sealed-card" : ""} ${isMax ? "max-card" : ""}">
      <div class="dex-level">${levelText}</div>
      ${isSealed ? `<div class="dex-seal">🔒</div>` : ""}
      <div class="dex-icon ${sizeClass}">${discovered ? emoji : "❔"}</div>
      <div class="dex-name">${discovered ? name : "미발견 치아"}</div>
      <div class="dex-stat"><span>기본 공격력</span><b>${getToothAttackText(lv)}</b></div>
      <div class="dex-desc">${isMax ? "봉인해제로 제작되는 최종 MAX 치아입니다." : isSealed ? "합성으로 도달하는 봉인된 왕관 치아입니다." : discovered ? "수집 완료" : "아직 수집하지 못했습니다."}</div>
    </div>
  `;
}

function openToothDex() {
  const max = window.BALANCE?.TRANSCEND_LEVEL || 25;
  const discoveredCount = Array.from({ length: max }, (_, i) => i + 1).filter((lv) => isToothDiscovered(lv)).length;
  const cards = Array.from({ length: max }, (_, i) => buildToothCard(i + 1)).join("");
  window.openGenericModal(`
    <div class="dex-modal-inner">
      <div class="modal-header-row">
        <div><h2>🦷 치아도감</h2><p>수집한 치아와 기본 공격력을 확인합니다.</p></div>
        <button class="modal-close-btn" onclick="closeAnyModal()">×</button>
      </div>
      <div class="dex-summary">
        <div><span>수집률</span><b>${discoveredCount} / ${max}</b></div>
        <div><span>채굴 최대</span><b>Lv.${window.BALANCE?.MINING_MAX_LEVEL || 12}</b></div>
        <div><span>합성 최대</span><b>Lv.${window.BALANCE?.MERGE_MAX_LEVEL || 24}</b></div>
        <div><span>최종</span><b>Lv.MAX</b></div>
      </div>
      <div class="dex-note">도감의 공격력은 치아 자체의 <b>기본 공격력</b>입니다. 슬롯 제련, 용병, 훈련 효과는 전투에서 추가 반영됩니다.</div>
      <div class="dex-grid tooth-dex-grid">${cards}</div>
      <button class="btn-sub full" onclick="closeAnyModal()">닫기</button>
    </div>
  `);
}

function isArtifactDiscovered(artifact) {
  if (!artifact) return false;
  const id = artifact.id || artifact.name;
  return !!(window.discoveredArtifacts && window.discoveredArtifacts[id]) || !!(window.artifactCounts && Number(window.artifactCounts[id]) > 0);
}

function getArtifactCount(artifact) {
  if (!artifact) return 0;
  const id = artifact.id || artifact.name;
  if (window.artifactCounts && Number(window.artifactCounts[id]) > 0) return Number(window.artifactCounts[id]);
  return isArtifactDiscovered(artifact) ? 1 : 0;
}

function openArtifactDex() {
  const artifacts = window.TOOTH_DATA?.artifacts || [];
  const discoveredCount = artifacts.filter(isArtifactDiscovered).length;
  const cards = artifacts.length ? artifacts.map((artifact, index) => {
    const discovered = isArtifactDiscovered(artifact);
    const count = getArtifactCount(artifact);
    return `
      <div class="dex-card artifact-dex-card ${discovered ? "discovered" : "locked"}">
        <div class="artifact-index">No.${index + 1}</div>
        <div class="dex-icon artifact-icon">${discovered ? artifact.icon : "❔"}</div>
        <div class="dex-name">${discovered ? artifact.name : "미발견 유물"}</div>
        <div class="artifact-count">보유 ${count}개</div>
        <div class="dex-desc">${discovered ? artifact.desc : "아직 발견하지 못했습니다."}</div>
        <div class="artifact-effect"><span>효과</span><b>${discovered ? artifact.effectText : "???"}</b></div>
      </div>
    `;
  }).join("") : `<div class="empty-dex-message">등록된 유물 데이터가 없습니다.</div>`;
  window.openGenericModal(`
    <div class="dex-modal-inner">
      <div class="modal-header-row">
        <div><h2>🏺 유물도감</h2><p>던전에서 획득한 유물을 확인합니다.</p></div>
        <button class="modal-close-btn" onclick="closeAnyModal()">×</button>
      </div>
      <div class="dex-summary"><div><span>발견</span><b>${discoveredCount} / ${artifacts.length}</b></div><div><span>획득처</span><b>던전</b></div></div>
      <div class="dex-grid artifact-dex-grid">${cards}</div>
      <button class="btn-sub full" onclick="closeAnyModal()">닫기</button>
    </div>
  `);
}

function buildReplayVideoButton(video) {
  const unlocked = typeof window.isReplayVideoUnlocked === "function" ? window.isReplayVideoUnlocked(video.key) : video.key === "intro";
  return `
    <button class="setting-video-btn ${unlocked ? "" : "locked"}" onclick="${unlocked ? `replayVideo('${video.key}')` : `modalToast('아직 해금되지 않은 영상입니다.', 'info')`}">
      <span class="video-icon">${unlocked ? video.icon : "🔒"}</span><b>${video.title}</b><em>${unlocked ? "다시보기" : "잠김"}</em>
    </button>
  `;
}

function openSettingsModal() {
  const videos = window.REPLAY_VIDEOS || [];
  const videoHtml = videos.map(buildReplayVideoButton).join("");
  window.openGenericModal(`
    <div class="settings-modal-inner">
      <div class="modal-header-row">
        <div><h2>⚙️ 설정</h2><p>저장 관리와 영상 다시보기를 사용할 수 있습니다.</p></div>
        <button class="modal-close-btn" onclick="closeAnyModal()">×</button>
      </div>
      <div class="settings-section"><h3>🎞️ 영상 다시보기</h3><p>인트로는 항상 볼 수 있고, HELL/초월 영상은 해금 후 다시 볼 수 있습니다.</p><div class="setting-video-list">${videoHtml}</div></div>
      <div class="settings-section"><h3>💾 저장 관리</h3><div class="settings-grid">
        <button class="btn-sub" onclick="saveGame(true); modalToast('저장되었습니다.', 'success')">수동 저장</button>
        <button class="btn-sub" onclick="exportSave()">저장코드 복사</button>
        <button class="btn-sub" onclick="importSave()">저장코드 불러오기</button>
        <button class="btn-danger" onclick="resetGame()">초기화</button>
      </div></div>
      <div class="settings-section"><h3>ℹ️ 게임 정보</h3><div class="settings-info-box">
        <div><span>버전</span><b>${window.GAME_VERSION || "8.3.0"}</b></div>
        <div><span>채굴 최대</span><b>Lv.${window.BALANCE?.MINING_MAX_LEVEL || 12}</b></div>
        <div><span>합성 최대</span><b>Lv.${window.BALANCE?.MERGE_MAX_LEVEL || 24}</b></div>
        <div><span>최종 단계</span><b>Lv.MAX</b></div>
      </div></div>
      <button class="btn-main full" onclick="closeAnyModal()">닫기</button>
    </div>
  `);
}

function openRanking() {
  const power = Array.isArray(window.inventory)
    ? window.inventory.slice(0, window.BALANCE?.TOP_SLOT_COUNT || 8).reduce((sum, lv) => sum + (typeof window.getBaseAttackByLevel === "function" ? window.getBaseAttackByLevel(lv) : 0), 0)
    : 0;
  window.openGenericModal(`
    <div class="settings-modal-inner">
      <div class="modal-header-row"><div><h2>🏆 랭킹</h2><p>현재는 로컬 기록 기준 표시입니다.</p></div><button class="modal-close-btn" onclick="closeAnyModal()">×</button></div>
      <div class="settings-info-box">
        <div><span>최고 치아</span><b>${typeof window.getToothDisplayLevel === "function" ? window.getToothDisplayLevel(window.highestToothLevel) : window.highestToothLevel}</b></div>
        <div><span>클리어 던전</span><b>${window.clearedStage || 0}</b></div>
        <div><span>Top8 기본 화력</span><b>${modalFmt(power)}</b></div>
        <div><span>총 채굴</span><b>${modalFmt(window.totalMineCount || 0)}</b></div>
      </div>
      <button class="btn-main full" onclick="closeAnyModal()">닫기</button>
    </div>
  `);
}

function openCollectionModal(type) {
  if (type === "artifact" || type === "artifacts" || type === "유물") openArtifactDex();
  else openToothDex();
}
function openCodex(type) { openCollectionModal(type); }
function openArtifacts() { openArtifactDex(); }
function openSettings() { openSettingsModal(); }

window.closeAnyModal = closeAnyModal;
window.closeModal = closeAnyModal;
window.openToothDex = openToothDex;
window.openToothBook = openToothDex;
window.openToothCodex = openToothDex;
window.openToothCollection = openToothDex;
window.showToothDex = openToothDex;
window.openArtifactDex = openArtifactDex;
window.openArtifactBook = openArtifactDex;
window.openArtifactCodex = openArtifactDex;
window.openArtifactCollection = openArtifactDex;
window.showArtifactDex = openArtifactDex;
window.openArtifacts = openArtifacts;
window.openSettingsModal = openSettingsModal;
window.openSettings = openSettings;
window.openSettingModal = openSettingsModal;
window.showSettings = openSettingsModal;
window.openRanking = openRanking;
window.openCollectionModal = openCollectionModal;
window.openCodex = openCodex;

console.log("치아 연대기 ui_modal.js loaded v8.3.0");
