// reviews.js - 리뷰 목록 페이지 전용 자바스크립트

document.addEventListener('DOMContentLoaded', loadReviews);

async function loadReviews() {
  const grid = document.getElementById('reviewGrid');
  try {
    const reviews = await api('/reviews');
    if (!reviews.length) {
      grid.innerHTML = '<p style="color:var(--muted);text-align:center;grid-column:1/-1;padding:40px;">아직 리뷰가 없어요.</p>';
      return;
    }
    grid.innerHTML = reviews.map((r) => reviewCard(r)).join('');

    // 좋아요/북마크 버튼 연결
    // document.querySelectorAll('.icon-btn[data-kind]').forEach((btn) => {
    //   bindToggle(btn, btn.dataset.kind, Number(btn.dataset.id));
    // });
  } catch (err) {
    grid.innerHTML = `<p style="color:var(--danger);text-align:center;">${escapeHtml(err.message)}</p>`;
  }
}

// 리뷰 카드 하나의 HTML
// 리뷰 카드 하나의 HTML (메인 페이지의 가로형 디자인 적용, 하단 버튼 제거)

function reviewCard(r) {
  // 작성일 데이터가 있다면 사용하고, 없다면 고정된 날짜를 사용합니다.
  const dateStr = r.created_at ? r.created_at.substring(0, 10) : '2026-07-29';
  return `
    <!-- a 태그가 바깥에서 감싸 전체 카드를 클릭할 수 있게 합니다 -->
    <a href="review-detail.html?id=${r.id}" style="text-decoration: none; color: inherit; display: block; outline: none;">
      <div class="review-fixed-card">
        
        <!-- 좌측: 리뷰 이미지 영역 -->
        <div class="rfc-left">
          <img src="${r.image_url}" class="rfc-img" alt="${escapeHtml(r.author)}님의 리뷰 사진">
        </div>
        
        <!-- 우측: 텍스트 정보 영역 -->
        <div class="rfc-right">
          <!-- 상단: 프로필 이미지 + 이름, 별점, 날짜 -->
          <div class="rfc-head">
            <img src="./images/mypage.png" class="rfc-avatar" alt="프로필">
            
            <!-- 이름과 (별점+날짜)를 세로로 감싸는 영역 -->
            <div class="rfc-info">
              <span class="rfc-name">${escapeHtml(r.author)}</span>
              <!-- 별점과 날짜 가로 배치 영역 -->
              <div class="rfc-meta">
                <span class="rfc-stars">${starHtml(r.rating)}</span>
                <span class="rfc-date">${dateStr}</span> 
              </div>
            </div>
          </div>
          
          <!-- 하단: 리뷰 제목과 본문 -->
          <div class="rfc-title">${escapeHtml(r.title)}</div>
          <p class="rfc-content">${escapeHtml(r.content)}</p>
        </div>
        
      </div>
    </a>`;
}