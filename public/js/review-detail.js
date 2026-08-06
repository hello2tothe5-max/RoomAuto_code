// review-detail.js - 리뷰 상세 페이지 전용 자바스크립트

document.addEventListener('DOMContentLoaded', () => {
  const id = new URLSearchParams(location.search).get('id');
  loadDetail(id);
});

async function loadDetail(id) {
  const area = document.getElementById('detailArea');
  try {
    const r = await api(`/reviews/${id}`);

    document.getElementById('breadcrumbTitle').textContent = r.title;

    const likeActive = r.my_like ? ' liked' : '';
    const bmActive = r.my_bookmark ? ' bookmarked' : '';

    area.innerHTML = `
      <div class="review-detail-card">
        <div class="rd-head">
          <h1 class="rd-title">${escapeHtml(r.title)}</h1>
          <div class="rd-meta">
            <span class="badge">${escapeHtml(r.author)}</span>
            <span class="stars">${starHtml(r.rating)}</span>
            <span>작성일: ${formatDate(r.created_at)}</span>
          </div>
        </div>
        <div class="rd-img">
          <img src="${r.image_url}" alt="${escapeHtml(r.title)}">
        </div>
        <p class="rd-content">${escapeHtml(r.content)}</p>
        <div class="rd-actions">
          <button class="icon-btn${likeActive}" id="likeBtn" data-action="like">
            <span class="ic">♥</span> 좋아요 <span class="cnt">${r.like_count}</span>
          </button>
          <button class="icon-btn${bmActive}" id="bmBtn" data-action="bookmark">
            <span class="ic">☆</span> 북마크 <span class="cnt">${r.bookmark_count}</span>
          </button>
        </div>
      </div>
    `;

    bindToggle(document.getElementById('likeBtn'), 'reviews', r.id);
    bindToggle(document.getElementById('bmBtn'), 'reviews', r.id);
  } catch (err) {
    area.innerHTML = `<p style="color:var(--danger);text-align:center;">${escapeHtml(err.message)}</p>`;
  }
}
