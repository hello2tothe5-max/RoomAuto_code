// design.js - AI 디자인 페이지 전용 자바스크립트
// 1) 탭 전환  2) 이미지 업로드 미리보기  3) 필터 칩  4) AI 생성 요청  5) 결과 표시
// 6) 평면도 결과를 마우스로 회전하는 3D 기능

let currentType = 'decor';   // 지금 선택된 탭: 'decor' 또는 'floorplan'
let selectedFile = null;     // 사용자가 고른 이미지 파일

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initUpload();
  initChips();
  initGenerate();
  initRotate3D();
});

// ---------------------------------------------------------------
// 1) 탭 전환 - 빈 방 꾸미기 / 평면도 3D
// ---------------------------------------------------------------
function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentType = tab.dataset.type;

      // 탭에 맞게 설명 글자 바꾸기
      const panelTitle = document.getElementById('panelTitle');
      panelTitle.textContent = currentType === 'decor' ? '1. 빈 방 사진 올리기' : '1. 평면도 이미지 올리기';
      const prompt = document.getElementById('prompt');
      prompt.placeholder = currentType === 'decor'
        ? '예) 7평 원룸, 미니멀 스타일로 꾸며줘\n예) 빈티지 감성의 거실, 따뜻한 조명'
        : '예) 아늑한 2룸, 밝은 분위기\n예) 모던한 스튜디오, 화이트 톤';
      // 결과 영역 초기화
      document.getElementById('resultArea').innerHTML =
        '<p class="result-empty">탭이 바뀌었어요. 다시 생성해 보세요.</p>';
    });
  });
}

// ---------------------------------------------------------------
// 2) 이미지 업로드 - 클릭/드래그로 파일 선택, 미리보기 표시
// ---------------------------------------------------------------
function initUpload() {
  const box = document.getElementById('uploadBox');
  const input = document.getElementById('fileInput');
  const preview = document.getElementById('uploadPreview');
  const previewImg = document.getElementById('previewImg');
  const fileName = document.getElementById('fileName');
  const removeBtn = document.getElementById('removeFile');
  const error = document.getElementById('formError');

  // 클릭하면 파일 선택창 열기
  box.addEventListener('click', () => input.click());

  // 드래그로 파일 놓기
  box.addEventListener('dragover', (e) => { e.preventDefault(); box.classList.add('dragover'); });
  box.addEventListener('dragleave', () => box.classList.remove('dragover'));
  box.addEventListener('drop', (e) => {
    e.preventDefault();
    box.classList.remove('dragover');
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });

  input.addEventListener('change', () => {
    if (input.files[0]) handleFile(input.files[0]);
  });

  function handleFile(file) {
    // 이미지 파일인지 확인
    if (!file.type.startsWith('image/')) {
      error.textContent = '이미지 파일만 올릴 수 있어요.';
      return;
    }
    // 10MB 이하인지 확인
    if (file.size > 10 * 1024 * 1024) {
      error.textContent = '파일은 최대 10MB까지 올릴 수 있어요.';
      return;
    }
    error.textContent = '';
    selectedFile = file;

    // 미리보기: FileReader로 파일 내용 읽기
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      fileName.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`;
      preview.classList.add('show');
    };
    reader.readAsDataURL(file);
  }

  // 선택한 파일 삭제
  removeBtn.addEventListener('click', () => {
    selectedFile = null;
    input.value = '';
    preview.classList.remove('show');
    previewImg.src = '';
  });
}

// ---------------------------------------------------------------
// 3) 필터 칩 - 누르면 입력창에 텍스트 더하고, 다시 누르면 빼기
// ---------------------------------------------------------------
function initChips() {
  const prompt = document.getElementById('prompt');
  document.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const text = chip.dataset.text;
      const parts = prompt.value.split(',').map((p) => p.trim()).filter(Boolean);

      if (chip.classList.contains('selected')) {
        // 선택 해제: 입력창에서 그 글자 빼기
        chip.classList.remove('selected');
        const idx = parts.indexOf(text);
        if (idx !== -1) parts.splice(idx, 1);
      } else {
        // 선택: 아직 없으면 입력창에 추가
        chip.classList.add('selected');
        if (!parts.includes(text)) parts.push(text);
      }
      prompt.value = parts.join(', ');
    });
  });
}

// ---------------------------------------------------------------
// 4) AI 생성 요청
// ---------------------------------------------------------------
function initGenerate() {
  const btn = document.getElementById('generateBtn');
  btn.addEventListener('click', async () => {
    const error = document.getElementById('formError');
    error.textContent = '';

    // 로그인 확인
    const user = await requireLogin();
    if (!user) return;

    const prompt = document.getElementById('prompt').value.trim();
    if (!selectedFile) { error.textContent = '이미지를 먼저 올려주세요.'; return; }
    if (!prompt) { error.textContent = '원하는 분위기를 적어주세요.'; return; }

    // 로딩 화면 보여주기
    setLoading(true);

    try {
      const form = new FormData();
      form.append('image', selectedFile);
      form.append('prompt', prompt);

      const result = await api(currentType === 'decor' ? '/ai/decor' : '/ai/floorplan', {
        method: 'POST',
        body: form,
      });

      // 결과 화면 그리기
      if (currentType === 'decor') renderDecorResult(result, prompt);
      else renderFloorplanResult(result, prompt);
    } catch (err) {
      showToast(err.message, 3500);
      document.getElementById('resultArea').innerHTML =
        '<p class="result-empty">생성에 실패했어요. 조금 후에 다시 시도해 주세요.</p>';
    } finally {
      setLoading(false);
    }
  });
}

// 로딩 상태 표시/해제
function setLoading(on) {
  const btn = document.getElementById('generateBtn');
  const area = document.getElementById('resultArea');
  if (on) {
    btn.disabled = true;
    btn.textContent = 'AI가 디자인 중이에요...';
    area.innerHTML = `
      <div class="loading-box">
        <div class="spinner"></div>
        <p class="loading-text">AI가 분석 중이에요...</p>
        <p>이미지 생성은 보통 30~60초 정도 걸립니다.</p>
      </div>`;
  } else {
    btn.disabled = false;
    btn.textContent = 'AI 디자인 생성하기';
  }
}

// ---------------------------------------------------------------
// 5-1) 빈 방 꾸미기 결과 - 내 방(BEFORE) vs AI 추천(AFTER)
// ---------------------------------------------------------------
function renderDecorResult(result, prompt) {
  const area = document.getElementById('resultArea');
  area.innerHTML = `
    <div class="decor-result">
      <div class="decor-card before">
        <img src="${result.inputImage}" alt="내가 올린 방">
        <div class="dc-label">BEFORE · 내가 올린 방</div>
      </div>
      <div class="decor-card after">
        <img src="${result.outputImage}" alt="AI 추천 인테리어">
        <div class="dc-label">AFTER · AI 추천</div>
      </div>
    </div>
    <div class="result-tags">
      <span class="badge">공간: ${escapeHtml(result.room)}</span>
      <span class="badge">스타일: ${escapeHtml(result.style)}</span>
    </div>
    <p style="color:var(--muted);font-size:14px;margin-top:14px;">
      요청 문장: ${escapeHtml(prompt)}
    </p>
  `;
}

// ---------------------------------------------------------------
// 5-2) 평면도 3D 결과 - 마우스로 돌려보는 이미지
// ---------------------------------------------------------------
function renderFloorplanResult(result, prompt) {
  const area = document.getElementById('resultArea');
  area.innerHTML = `
    <div class="rotate3d-scene" id="rotateScene">
      <div class="rotate3d" id="rotateBox">
        <img src="${result.outputImage}" alt="AI가 만든 3D 공간" draggable="false" ondragstart="return false;">
        <div class="glow"></div>
      </div>
    </div>
    <div class="rotate3d-hint">
      <span>마우스로 드래그해서 입체 이미지를 돌려보세요.</span>
      <button id="resetRotate" type="button">원래대로</button>
    </div>
    <div class="result-tags">
      <span class="badge">공간: ${escapeHtml(result.room)}</span>
      <span class="badge">스타일: ${escapeHtml(result.style)}</span>
    </div>
    <p style="color:var(--muted);font-size:14px;margin-top:14px;">
      요청 문장: ${escapeHtml(prompt)}
    </p>
  `;
  initRotate3D(); // 새로 만들어진 이미지에 회전 기능 다시 연결
}

// ---------------------------------------------------------------
// 6) 3D 회전 - 마우스를 누른 채 움직이면 이미지가 돌아감
// ---------------------------------------------------------------
function initRotate3D() {
  const scene = document.getElementById('rotateScene');
  if (!scene) return;
  const box = document.getElementById('rotateBox');

  let dragging = false;
  let lastX = 0, lastY = 0;
  let rx = 0, ry = 0; // 현재 회전 각도

  scene.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return; // 좌클릭(0)만 허용
    e.preventDefault(); // 브라우저의 기본 이미지 드래그 방지 (이것 때문에 회전이 끊겼음)
    dragging = true;
    scene.classList.add('dragging');
    lastX = e.clientX;
    lastY = e.clientY;
    scene.setPointerCapture(e.pointerId);
  });
  scene.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    // 움직인 만큼만 회전 각도에 더하기 (x는 위아래, y는 좌우)
    ry += (e.clientX - lastX) * 0.6;
    rx -= (e.clientY - lastY) * 0.6;
    lastX = e.clientX;
    lastY = e.clientY;
    box.style.setProperty('--rx', rx + 'deg');
    box.style.setProperty('--ry', ry + 'deg');
  });
  scene.addEventListener('pointerup', () => {
    dragging = false;
    scene.classList.remove('dragging');
  });
  scene.addEventListener('pointerleave', () => {
    dragging = false;
    scene.classList.remove('dragging');
  });

  const resetBtn = document.getElementById('resetRotate');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      rx = 0; ry = 0;
      box.style.setProperty('--rx', '0deg');
      box.style.setProperty('--ry', '0deg');
    });
  }
}
