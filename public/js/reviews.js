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
    document.querySelectorAll('.icon-btn[data-kind]').forEach((btn) => {
      bindToggle(btn, btn.dataset.kind, Number(btn.dataset.id));
    });
  } catch (err) {
    grid.innerHTML = `<p style="color:var(--danger);text-align:center;">${escapeHtml(err.message)}</p>`;
  }
}

// 리뷰 카드 하나의 HTML
function reviewCard(r) {
  const likeActive = r.my_like ? ' liked' : '';
  const bmActive = r.my_bookmark ? ' bookmarked' : '';
  return `
    <div class="review-card-wrap">
      <a class="card review-card" href="review-detail.html?id=${r.id}">
        <img class="card-img" src="${r.image_url}" alt="${escapeHtml(r.title)}" loading="lazy">
        <div class="card-body">
          <div class="review-head">
            <span class="badge">${escapeHtml(r.author)}</span>
            <span class="stars">${starHtml(r.rating)}</span>
          </div>
          <div class="card-title" style="margin-top:10px;">${escapeHtml(r.title)}</div>
          <p class="review-excerpt">${escapeHtml(r.content)}</p>
        </div>
      </a>
      <div class="review-actions">
        <button class="icon-btn${likeActive}" data-kind="reviews" data-id="${r.id}" data-action="like">
          <span class="ic">♥</span> 좋아요 <span class="cnt">${r.like_count}</span>
        </button>
        <button class="icon-btn${bmActive}" data-kind="reviews" data-id="${r.id}" data-action="bookmark">
          <span class="ic">☆</span> 북마크 <span class="cnt">${r.bookmark_count}</span>
        </button>
      </div>
    </div>`;
}
