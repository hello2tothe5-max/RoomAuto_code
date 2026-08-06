// gallery.js - 갤러리 목록 페이지 전용 자바스크립트
// 필터를 선택하면 서버에 다시 물어봐서 사진을 바꿔 보여줍니다.

let currentRoom = '';
let currentStyle = '';
let currentSearch = '';

document.addEventListener('DOMContentLoaded', () => {
  initFilters();
  loadGallery();
});

// ---------------------------------------------------------------
// 필터(칩)와 검색창 이벤트 연결
// ---------------------------------------------------------------
function initFilters() {
  // 공간 칩
  document.querySelectorAll('[data-room]').forEach((chip) => {
    chip.addEventListener('click', () => {
      currentRoom = chip.dataset.room;
      document.querySelectorAll('[data-room]').forEach((c) => c.classList.toggle('selected', c === chip));
      loadGallery();
    });
  });
  // 스타일 칩
  document.querySelectorAll('[data-style]').forEach((chip) => {
    chip.addEventListener('click', () => {
      currentStyle = chip.dataset.style;
      document.querySelectorAll('[data-style]').forEach((c) => c.classList.toggle('selected', c === chip));
      loadGallery();
    });
  });
  // 검색창 (엔터 칠 때)
  const search = document.getElementById('searchInput');
  search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      currentSearch = search.value.trim();
      loadGallery();
    }
  });
}

// ---------------------------------------------------------------
// 서버에서 갤러리 이미지 목록을 받아 그리드에 그리기
// ---------------------------------------------------------------
async function loadGallery() {
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = '<div class="loading-box"><div class="spinner"></div><p>불러오는 중...</p></div>';

  // 쿼리 문자열 만들기 (?room=원룸&style=미니멀&q=검색어)
  const params = new URLSearchParams();
  if (currentRoom) params.set('room', currentRoom);
  if (currentStyle) params.set('style', currentStyle);
  if (currentSearch) params.set('q', currentSearch);
  const qs = params.toString() ? '?' + params.toString() : '';

  try {
    const images = await api('/gallery' + qs);
    if (!images.length) {
      grid.innerHTML = '<p style="color:var(--muted);text-align:center;grid-column:1/-1;padding:40px;">조건에 맞는 사진이 없어요.</p>';
      return;
    }
    grid.innerHTML = images.map((img) => galleryCard(img)).join('');

    // 좋아요/북마크 버튼에 이벤트 달기
    document.querySelectorAll('.icon-btn[data-kind]').forEach((btn) => {
      bindToggle(btn, btn.dataset.kind, Number(btn.dataset.id));
    });
  } catch (err) {
    grid.innerHTML = `<p style="color:var(--danger);text-align:center;">${escapeHtml(err.message)}</p>`;
  }
}

// 갤러리 카드 하나의 HTML
function galleryCard(img) {
  const likeActive = img.my_like ? ' liked' : '';
  const bmActive = img.my_bookmark ? ' bookmarked' : '';
  return `
    <div class="gallery-card-wrap">
      <a class="card gallery-card" href="gallery-detail.html?id=${img.id}">
        <div class="card-top">
          <img class="card-img" src="${img.image_url}" alt="${escapeHtml(img.title)}" loading="lazy">
          <span class="badge">${escapeHtml(img.style)}</span>
        </div>
        <div class="card-body">
          <div class="card-title">${escapeHtml(img.title)}</div>
          <div class="card-meta">${escapeHtml(img.room)} · ${escapeHtml(img.author || 'RoomAuto')}</div>
        </div>
      </a>
      <div class="card-actions">
        <button class="icon-btn${likeActive}" data-kind="images" data-id="${img.id}" data-action="like">
          <span class="ic">♥</span> 좋아요 <span class="cnt">${img.like_count}</span>
        </button>
        <button class="icon-btn${bmActive}" data-kind="images" data-id="${img.id}" data-action="bookmark">
          <span class="ic">☆</span> 북마크 <span class="cnt">${img.bookmark_count}</span>
        </button>
      </div>
    </div>`;
}
