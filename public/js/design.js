// design.js - AI 디자인 페이지 전용 자바스크립트
// 1) 탭 전환  2) 이미지 업로드 미리보기  3) 필터 칩  4) AI 생성 요청  5) 결과 표시
// 6) 평면도 결과를 마우스로 회전하는 3D 기능

let currentType = 'decor';   // 지금 선택된 탭: 'decor' 또는 'floorplan'
let selectedFile = null;     // 사용자가 고른 이미지 파일

document.addEventListener('DOMContentLoaded', () => {
  // initTabs();
  initUpload();
  initChips();
  initGenerate();
  // initRotate3D();
});

// ---------------------------------------------------------------
// 1) 탭 전환 - 빈 방 꾸미기 / 평면도 3D
// ---------------------------------------------------------------
// function initTabs() {
//   const tabs = document.querySelectorAll('.tab');
//   tabs.forEach((tab) => {
//     tab.addEventListener('click', () => {
//       tabs.forEach((t) => t.classList.remove('active'));
//       tab.classList.add('active');
//       currentType = tab.dataset.type;

//       // 탭에 맞게 설명 글자 바꾸기
//       const panelTitle = document.getElementById('panelTitle');
//       panelTitle.textContent = currentType === 'decor' ? '1. 빈 방 사진 올리기' : '1. 평면도 이미지 올리기';
//       const prompt = document.getElementById('prompt');
//       prompt.placeholder = currentType === 'decor'
//         ? '예) 7평 원룸, 미니멀 스타일로 꾸며줘\n예) 빈티지 감성의 거실, 따뜻한 조명'
//         : '예) 아늑한 2룸, 밝은 분위기\n예) 모던한 스튜디오, 화이트 톤';
//       // 결과 영역 초기화
//       document.getElementById('resultArea').innerHTML =
//         '<p class="result-empty">탭이 바뀌었어요. 다시 생성해 보세요.</p>';
//     });
//   });
// }

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

      box.style.display = "none";
    };
    reader.readAsDataURL(file);
  }

  // 선택한 파일 삭제
  removeBtn.addEventListener('click', () => {
    selectedFile = null;
    input.value = '';
    preview.classList.remove('show');
    previewImg.src = '';

    box.style.display = "flex";
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
    if (error) error.textContent = '';
    // 로그인 확인
    let user;
    try {
      user = await requireLogin();
    } catch (e) {
      document.getElementById('login-modal').classList.add('show');
      return;
    }
    if (!user) return;
    const prompt = document.getElementById('prompt').value.trim();
    window.promptHistory = prompt;
    if (!selectedFile) {
      if (error) error.textContent = '이미지를 먼저 올려주세요.';
      return;
    }
    if (!prompt) {
      if (error) error.textContent = '원하는 분위기를 적어주세요.';
      return;
    }
    // 1. 기존 양식 숨기고 결과 영역 노출 (원페이지 교체)
    document.querySelector('.design-wrapper').style.display = 'none';
    const resultArea = document.getElementById('resultArea');
    resultArea.style.display = 'block';

    // 💡 [핵심 해결] 화면 멈춤 버그를 유발하던 스크롤 에러를 해결한 코드
    window.scrollTo(0, 0);
    // 2. 로딩 화면 보여주기
    setLoading(true);
    try {
      const form = new FormData();
      form.append('image', selectedFile);
      form.append('prompt', prompt);
      const result = await api(currentType === 'decor' ? '/ai/decor' : '/ai/floorplan', {
        method: 'POST',
        body: form,
      });
      // 3. 결과 화면 그리기
      if (currentType === 'decor') renderDecorResult(result, window.promptHistory);
      else renderFloorplanResult(result, window.promptHistory);
    } catch (err) {
      resultArea.innerHTML = `
        <div style="text-align:center; padding:100px 0;">
          <p style="color:var(--danger); font-size:18px; margin-bottom: 20px;">생성에 실패했어요.</p>
          <button class="btn btn-primary" onclick="location.reload();">처음으로 돌아가기</button>
        </div>`;
    }
  });
}
// 로딩 상태 표시/해제
function setLoading(on) {
  const area = document.getElementById('resultArea');
  if (!area || !on) return;
  area.innerHTML = `
    <div style="height:60vh; display:flex; flex-direction:column; align-items:center; justify-content:center;">
      <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
      <img src="./images/loading.png" style="width:120px; animation:spin 1.5s linear infinite; margin-bottom:30px;">
      <h2 style="font-size:32px; font-weight:800; color:var(--primary-mid); margin-bottom:12px;">AI가 디자인 중 입니다</h2>
      <p style="font-size:20px; font-weight:600; color:var(--primary-mid);">잠시만 기다려 주세요</p>
    </div>
  `;
}
// ---------------------------------------------------------------
// 5-1) 빈 방 꾸미기 결과
// ---------------------------------------------------------------
function renderDecorResult(result, prompt) {
  const area = document.getElementById('resultArea');
  area.innerHTML = `
    <div style="max-width:1360px; margin:0 auto; padding:40px 0 100px;">
      <img src="${result.outputImage}" style="width:100%; aspect-ratio:1360/720; object-fit:cover; background:#e0e0e0; margin-bottom:40px;">
      
      <div style="font-size:20px; line-height:1.6; font-weight:600; margin-bottom:60px; color:var(--ink);">
        <p>요청 문장: ${escapeHtml(prompt)}</p><br>
        <p>Lorem ipsum dolor sit amet consectetur.<br>
        Vel posuere pharetra morbi mauris odio metus.<br>
        Nisi id vestibulum cras pellentesque eu nisl scelerisque suspendisse tortor.<br>
        Ullamcorper vitae odio sed enim amet tincidunt.<br>
        Morbi quam cursus quis porttitor id dui potenti viverra sed.<br>
        Lectus quam viverra mattis condimentum.<br>
        Ornare in velit in aliquet interdum pellentesque nibh sed viverra.</p>
      </div>
     <!-- 부모 상자로 묶기 (여기서 1090px과 가운데 정렬을 한 번에 처리) -->
      <div style="width: 1090px; max-width: 100%; margin: 0 auto;">
        
        <!-- 입력 상자 (부모 상자의 너비인 100%를 따라감) -->
        <div class="prompt-bar" style="width: 100%; height: 60px; align-items: center; margin: 0;">
          <input type="text" class="prompt-input" placeholder="예) 20평 건물, 모던 스타일">
          <button class="btn btn-primary prompt-submit" onclick="regenerateDesign();">
            <i style="
              display: inline-block; 
              width: 24px; 
              height: 24px; 
              background-color: var(--bg); 
              -webkit-mask: url('./images/ai_star.png') no-repeat center / contain; 
              mask: url('./images/ai_star.png') no-repeat center / contain; 
              vertical-align: middle; 
              margin-right: 4px;"></i>
            디자인 시작
          </button>
        </div>
        <!-- 하단 텍스트 (부모 상자 안에서 자연스럽게 왼쪽 정렬됨) -->
        <p style="margin: 6px 0 0 0; text-align: left; padding-left: 12px; font-size: 16px; font-weight: 400; color: var(--ink);">수정, 보완하고 싶은 점 작성하기</p>
      </div>
  `;
}

// ---------------------------------------------------------------
// 7) 결과 화면에서 새로운 프롬프트로 디자인 재요청하기
// ---------------------------------------------------------------
async function regenerateDesign() {
  const resultArea = document.getElementById('resultArea');

  // 결과 화면 하단에 있는 새로운 프롬프트 입력창을 찾습니다.
  const newPromptInput = resultArea.querySelector('.prompt-input');
  if (!newPromptInput) return;

  const newPrompt = newPromptInput.value.trim();
  if (!newPrompt) {
    alert('수정, 보완하고 싶은 점을 입력해주세요.');
    newPromptInput.focus();
    return;
  }
  // 💡 [추가] 기존 기록에 새로운 프롬프트를 이어서 누적합니다.
  window.promptHistory = window.promptHistory + " ➔ " + newPrompt;

  // 다시 스크롤을 맨 위로 올리고 로딩 스피너 화면으로 교체
  window.scrollTo(0, 0);
  setLoading(true);

  try {
    const form = new FormData();
    // 사용자가 맨 처음 올렸던 이미지는 전역 변수(selectedFile)에 저장되어 있으므로 그대로 재사용합니다.
    form.append('image', selectedFile);
    // 프롬프트만 새로 입력받은 내용으로 교체합니다.
    form.append('prompt', window.promptHistory);

    // 똑같이 API를 호출하여 AI 생성을 요청합니다.
    const result = await api(currentType === 'decor' ? '/ai/decor' : '/ai/floorplan', {
      method: 'POST',
      body: form,
    });

    // 생성에 성공하면 새로운 결과물과 새로운 프롬프트로 화면을 다시 그립니다.
    if (currentType === 'decor') renderDecorResult(result, window.promptHistory);
    else renderFloorplanResult(result, window.promptHistory);

  } catch (err) {
    resultArea.innerHTML = `
      <div style="text-align:center; padding:100px 0;">
        <p style="color:var(--danger); font-size:18px; margin-bottom: 20px;">생성에 실패했어요.</p>
        <button class="btn btn-primary" onclick="location.reload();">처음으로 돌아가기</button>
      </div>`;
  }
}

// // ---------------------------------------------------------------
// // 5-2) 평면도 3D 결과 - 마우스로 돌려보는 이미지
// // ---------------------------------------------------------------
// function renderFloorplanResult(result, prompt) {
//   const area = document.getElementById('resultArea');
//   area.innerHTML = `
//     <div class="rotate3d-scene" id="rotateScene">
//       <div class="rotate3d" id="rotateBox">
//         <img src="${result.outputImage}" alt="AI가 만든 3D 공간" draggable="false" ondragstart="return false;">
//         <div class="glow"></div>
//       </div>
//     </div>
//     <div class="rotate3d-hint">
//       <span>마우스로 드래그해서 입체 이미지를 돌려보세요.</span>
//       <button id="resetRotate" type="button">원래대로</button>
//     </div>
//     <div class="result-tags">
//       <span class="badge">공간: ${escapeHtml(result.room)}</span>
//       <span class="badge">스타일: ${escapeHtml(result.style)}</span>
//     </div>
//     <p style="color:var(--muted);font-size:14px;margin-top:14px;">
//       요청 문장: ${escapeHtml(prompt)}
//     </p>
//   `;
//   initRotate3D(); // 새로 만들어진 이미지에 회전 기능 다시 연결
// }

// // ---------------------------------------------------------------
// // 6) 3D 회전 - 마우스를 누른 채 움직이면 이미지가 돌아감
// // ---------------------------------------------------------------
// function initRotate3D() {
//   const scene = document.getElementById('rotateScene');
//   if (!scene) return;
//   const box = document.getElementById('rotateBox');

//   let dragging = false;
//   let lastX = 0, lastY = 0;
//   let rx = 0, ry = 0; // 현재 회전 각도

//   scene.addEventListener('pointerdown', (e) => {
//     if (e.button !== 0) return; // 좌클릭(0)만 허용
//     e.preventDefault(); // 브라우저의 기본 이미지 드래그 방지 (이것 때문에 회전이 끊겼음)
//     dragging = true;
//     scene.classList.add('dragging');
//     lastX = e.clientX;
//     lastY = e.clientY;
//     scene.setPointerCapture(e.pointerId);
//   });
//   scene.addEventListener('pointermove', (e) => {
//     if (!dragging) return;
//     // 움직인 만큼만 회전 각도에 더하기 (x는 위아래, y는 좌우)
//     ry += (e.clientX - lastX) * 0.6;
//     rx -= (e.clientY - lastY) * 0.6;
//     lastX = e.clientX;
//     lastY = e.clientY;
//     box.style.setProperty('--rx', rx + 'deg');
//     box.style.setProperty('--ry', ry + 'deg');
//   });
//   scene.addEventListener('pointerup', () => {
//     dragging = false;
//     scene.classList.remove('dragging');
//   });
//   scene.addEventListener('pointerleave', () => {
//     dragging = false;
//     scene.classList.remove('dragging');
//   });

//   const resetBtn = document.getElementById('resetRotate');
//   if (resetBtn) {
//     resetBtn.addEventListener('click', () => {
//       rx = 0; ry = 0;
//       box.style.setProperty('--rx', '0deg');
//       box.style.setProperty('--ry', '0deg');
//     });
//   }
// }
