// review-detail.js - 리뷰 상세 페이지 전용 자바스크립트
document.addEventListener('DOMContentLoaded', () => {
  const id = new URLSearchParams(location.search).get('id');
  loadDetail(id);
});
async function loadDetail(id) {
  const area = document.getElementById('detailArea');
  try {
    const r = await api(`/reviews/${id}`);
    // 상단 빵부스러기 제목 변경
    document.getElementById('breadcrumbTitle').textContent = escapeHtml(r.title);
    // CSS에 추가하신 새 디자인 클래스(.review-detail-page 등)를 뼈대로 사용합니다.
    area.innerHTML = `
      <div class="review-detail-page">
        
        <!-- 1. 상단: 아바타와 작성자 정보 -->
        <div class="rd-profile-head">
          <img src="./images/mypage.png" class="rd-avatar" alt="프로필">
          <div class="rd-profile-info">
            <span class="rd-name">${escapeHtml(r.author)}</span>
            <span class="rd-stars">${starHtml(r.rating)}</span>
          </div>
        </div>
        <!-- 2. 중앙: 큰 이미지 영역 -->
        <div class="rd-image-container">
          <!-- 첫 번째 이미지 (필수) -->
          <img src="${r.image_url}" alt="${escapeHtml(r.title)}">
          
          <!-- 두 번째 이미지 (DB에 image_url2 값이 있을 때만 추가로 출력) -->
          ${r.image_url2 ? `<img src="${r.image_url2}" alt="${escapeHtml(r.title)} 추가 사진">` : ''}
        </div>
        <!-- 3. 하단: 크고 굵은 본문 텍스트 --><div class="rd-text-content">${escapeHtml(r.content)}
        </div>
        
      </div>
    `;
  } catch (err) {
    area.innerHTML = `<p style="color:var(--danger);text-align:center;">${escapeHtml(err.message)}</p>`;
  }
}