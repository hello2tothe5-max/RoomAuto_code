// main.js - 메인 페이지 전용 자바스크립트
// 1) 비포&애프터 슬라이더  2) 무한 갤러리 슬라이더  3) 리뷰  4) 로그인 모달 창

document.addEventListener('DOMContentLoaded', () => {
  initBeforeAfter();
  initMarquee();
  initReviews();
});

// ---------------------------------------------------------------
// 1) 비포 & 애프터 슬라이더 - 손잡이를 드래그하면 사진이 갈라짐
// ---------------------------------------------------------------
function initBeforeAfter() {
  const wrap = document.getElementById('beforeAfter');
  if (!wrap) return;

  let pos = 50; // 현재 나누는 위치(%)

  function setPos(x) {
    const rect = wrap.getBoundingClientRect();
    // 클릭한 x좌표를 0~100%로 변환
    pos = Math.min(100, Math.max(0, ((x - rect.left) / rect.width) * 100));
    wrap.style.setProperty('--pos', pos + '%');
  }

  // 마우스로 드래그하기
  wrap.addEventListener('pointerdown', (e) => {
    wrap.setPointerCapture(e.pointerId);
    setPos(e.clientX);
  });
  wrap.addEventListener('pointermove', (e) => {
    if (e.buttons === 1) setPos(e.clientX); // 마우스 버튼을 누르는 동안만
  });
}

// ---------------------------------------------------------------
// 2) 무한 갤러리 슬라이더 - 갤러리 사진을 좌측으로 자동 슬라이드
//    사진을 2번 이어 붙여서 계속 반복되는 것처럼 보이게 합니다.
// ---------------------------------------------------------------
async function initMarquee() {
  const track = document.getElementById('marqueeTrack');
  if (!track) return;
  try {
    const images = await api('/gallery');
    if (!images.length) return;
    // 2배로 만들어서 왼쪽으로 계속 흐르게 함
    track.innerHTML = buildMarqueeCards(images) + buildMarqueeCards(images);
  } catch (err) {
    // 연결 실패 시 조용히 넘어감
  }
}

function buildMarqueeCards(images) {
  return images.map((img) => `
    <a class="marquee-card" href="gallery-detail.html?id=${img.id}">
      <img src="${img.image_url}" alt="${escapeHtml(img.title)}" loading="lazy">
    </a>
  `).join('');
}

async function initReviews() {
  const stack = document.getElementById('reviewStack');
  if (!stack) return;
  try {
    const reviews = await api('/reviews');
    if (!reviews.length) return;
    // '고정된 리뷰 카드' HTML 생성
    stack.innerHTML = reviews.slice(0, 3).map((r) => `
      <div class="review-fixed-card">
        
        <!-- 좌측: 리뷰 이미지 -->
        <div class="rfc-left">
          <img src="${r.image_url}" class="rfc-img" alt="${escapeHtml(r.author)}님의 리뷰 사진">
        </div>
        
        <!-- 우측: 리뷰 내용 (이름, 별점, 제목, 본문) -->
        <div class="rfc-right">
          <div class="rfc-head">
            <img src="./images/mypage.png" class="rfc-avatar" alt="프로필">
            <div class="rfc-info">
              <span class="rfc-name">${escapeHtml(r.author)}</span>
              <div class="rfc-meta">
                <span class="rfc-stars">${starHtml(r.rating)}</span>
                <span class="rfc-date">2026-07-29</span> 
              </div>
            </div>
          </div>
          <!-- 아래 두 줄은 리뷰의 제목과 본문을 다시 띄우는 코드입니다 -->
          <strong class="rfc-title">${escapeHtml(r.title)}</strong>
          <p class="rfc-content">${escapeHtml(r.content)}</p>
        </div>
        
      </div>
    `).join('');
  } catch (err) {
    stack.innerHTML = '<p style="color:var(--muted);text-align:center;">리뷰를 불러오지 못했어요.</p>';
  }
}

// ---------------------------------------------------------------
// 4) 예전 로그인 모달 제어 로직 (헤더 버튼 & 본문 버튼 동시 처리)
// ---------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const loginModal = document.getElementById('login-modal');
  // 👉 이벤트 위임(Event Delegation)을 사용하여 전체 화면에서 클릭을 감지합니다.
  document.addEventListener('click', async (e) => {

    // 클릭한 요소가 '디자인 시작' 버튼이거나 '헤더 시작' 버튼인지 확인
    const targetBtn = e.target.closest('#start-design-b') || e.target.closest('#start-btn');

    // 두 버튼 중 하나라도 클릭되었다면 작동
    if (targetBtn) {
      e.preventDefault(); // 기본 이동(href) 멈춤
      try {
        // 서버에 로그인 상태 확인
        const { user } = await api('/auth/me');
        if (user) {
          // 로그인 상태라면 디자인 페이지로 이동
          window.location.href = 'design.html';
        } else {
          // 비로그인 상태라면 모달창 띄우기
          loginModal.style.display = 'flex';
        }
      } catch (err) {
        // 통신 에러나 비로그인 상태 시 모달창 띄우기
        loginModal.style.display = 'flex';
      }
    }
  });
  // 모달 영역 밖(어두운 배경) 클릭 시 닫기
  if (loginModal) {
    loginModal.addEventListener('click', (e) => {
      if (e.target === loginModal) {
        loginModal.style.display = 'none';
      }
    });
  }
});
