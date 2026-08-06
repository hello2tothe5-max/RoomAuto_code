// gallery-detail.js - 갤러리 상세 페이지 전용 자바스크립트
// URL의 ?id= 숫자를 읽어 해당 사진의 정보와 비슷한 사진을 보여줍니다.

document.addEventListener('DOMContentLoaded', () => {
  const id = new URLSearchParams(location.search).get('id');
  loadDetail(id);
});

async function loadDetail(id) {
  const area = document.getElementById('detailArea');
  try {
    const img = await api(`/gallery/${id}`);

    // 빵 부스러기에 제목 반영
    document.getElementById('breadcrumbTitle').textContent = img.title;

    const likeActive = img.my_like ? ' liked' : '';
    const bmActive = img.my_bookmark ? ' bookmarked' : '';

    area.innerHTML = `
      <div class="detail-layout">
        <div class="detail-img">
          <img src="${img.image_url}" alt="${escapeHtml(img.title)}">
        </div>
        <div class="detail-info">
          <h1 class="d-title">${escapeHtml(img.title)}</h1>
          <div class="d-meta">
            <span class="badge">${escapeHtml(img.room)}</span>
            <span class="badge">${escapeHtml(img.style)}</span>
          </div>
          <p class="d-desc">${escapeHtml(img.description)}</p>
          <p style="color:var(--muted);font-size:13px;">작성: ${escapeHtml(img.author)} · ${formatDate(img.created_at)}</p>
          <div class="d-actions">
            <button class="icon-btn${likeActive}" id="likeBtn" data-action="like">
              <span class="ic">♥</span> 좋아요 <span class="cnt">${img.like_count}</span>
            </button>
            <button class="icon-btn${bmActive}" id="bmBtn" data-action="bookmark">
              <span class="ic">☆</span> 북마크 <span class="cnt">${img.bookmark_count}</span>
            </button>
          </div>
        </div>
      </div>

      <hr class="detail-divider">
      <h2 style="margin-bottom:18px;">비슷한 스타일 둘러보기</h2>
      <div class="related-grid" id="relatedGrid"></div>
    `;

    // 좋아요/북마크 버튼 연결
    bindToggle(document.getElementById('likeBtn'), 'images', img.id);
    bindToggle(document.getElementById('bmBtn'), 'images', img.id);

    loadRelated(img);
  } catch (err) {
    area.innerHTML = `<p style="color:var(--danger);text-align:center;">${escapeHtml(err.message)}</p>`;
  }
}

// 같은 스타일이나 공간의 다른 사진을 아래에 보여주기
async function loadRelated(current) {
  try {
    const images = await api(`/gallery?style=${encodeURIComponent(current.style)}`);
    // 지금 보고 있는 사진은 제외하고 최대 4장
    const related = images.filter((i) => i.id !== current.id).slice(0, 4);
    const grid = document.getElementById('relatedGrid');
    if (!related.length) {
      grid.innerHTML = '<p style="color:var(--muted);">관련 사진이 아직 없어요.</p>';
      return;
    }
    grid.innerHTML = related.map((r) => `
      <a class="related-item" href="gallery-detail.html?id=${r.id}">
        <img src="${r.image_url}" alt="${escapeHtml(r.title)}" loading="lazy">
        <div class="rel-body">${escapeHtml(r.title)}</div>
      </a>
    `).join('');
  } catch (err) {
    // 관련 사진은 문제가 생겨도 치명적이지 않으므로 조용히 넘어감
  }
}
