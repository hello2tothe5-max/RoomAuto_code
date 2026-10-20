// gallery.js - 갤러리 목록 페이지 전용 자바스크립트
// 필터를 선택하면 서버에 다시 물어봐서 사진을 바꿔 보여줍니다.

let currentRoom = '';
let currentStyle = '';
let currentSearch = '';

document.addEventListener('DOMContentLoaded', () => {
  if (typeof initFilters === 'function') {
    initFilters();
  }
  loadGallery();
});

// ---------------------------------------------------------------
// 필터(칩)와 검색창 이벤트 연결
// ---------------------------------------------------------------
// function initFilters() {
//   // 공간 칩
//   document.querySelectorAll('[data-room]').forEach((chip) => {
//     chip.addEventListener('click', () => {
//       currentRoom = chip.dataset.room;
//       document.querySelectorAll('[data-room]').forEach((c) => c.classList.toggle('selected', c === chip));
//       loadGallery();
//     });
//   });
//   // 스타일 칩
//   document.querySelectorAll('[data-style]').forEach((chip) => {
//     chip.addEventListener('click', () => {
//       currentStyle = chip.dataset.style;
//       document.querySelectorAll('[data-style]').forEach((c) => c.classList.toggle('selected', c === chip));
//       loadGallery();
//     });
//   });
//   // 검색창 (엔터 칠 때)
//   const search = document.getElementById('searchInput');
//   if (search) { // ✅ 검색창이 화면에 존재할 때만 실행되도록 보호 조치
//     search.addEventListener('keydown', (e) => {
//       if (e.key === 'Enter') {
//         currentSearch = search.value.trim();
//         loadGallery();
//       }
//     });
//   }
// }

// ---------------------------------------------------------------
// 서버에서 갤러리 이미지 목록을 받아 그리드에 그리기
// ---------------------------------------------------------------
async function loadGallery() {
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = '<div class="loading-box"><div class="spinner"></div><p>불러오는 중...</p></div>';

  // // 쿼리 문자열 만들기 (?room=원룸&style=미니멀&q=검색어)
  // const params = new URLSearchParams();
  // // if (currentRoom) params.set('room', currentRoom);
  // // if (currentStyle) params.set('style', currentStyle);
  // // if (currentSearch) params.set('q', currentSearch);
  // const qs = params.toString() ? '?' + params.toString() : '';

  const qs = '';

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
  // DB에서 가져온 상태에 따라 버튼에 'liked' 또는 'bookmarked' 클래스 추가
  const likeActive = img.my_like ? ' liked' : '';
  const bmActive = img.my_bookmark ? ' bookmarked' : '';

  const description = img.description || "Lorem ipsum dolor sit amet consectetur.\nPharetra volutpat vivamus sed condimentum arcu risus eget.\nDiam arcu sed in sed nibh praesent cursus maecenas.\nMetus arcu ornare aliquam sapien consectetur ut amet sed.";

  return `
    <div class="custom-gallery-card">
      <a href="gallery-detail.html?id=${img.id}" style="text-decoration: none;">
        <img class="cg-img" src="${img.image_url}" alt="${escapeHtml(img.title || '갤러리 이미지')}" loading="lazy">
      </a>
      <div class="cg-body">
       <!-- ▼▼▼ 카테고리 영역 ▼▼▼ -->
        <div class="cg-categories">
          <span class="cg-category">${escapeHtml(img.style || '보태니컬')}</span>
          ${img.style2 ? `<span class="cg-category">${escapeHtml(img.style2)}</span>` : ''}
          <span class="cg-category">${escapeHtml(img.room || '원룸')}</span>
        </div>
        
        <div class="cg-title">${escapeHtml(img.title || '이미지 제목')}</div>
        <p class="cg-desc">
          ${description.replace(/\n/g, '<br>')}
        </p>
        <hr class="cg-divider">
        
        <div class="cg-footer">
          <!-- 기존 코드에 icon-btn 클래스를 다시 추가했습니다! -->
          <button class="icon-btn cg-btn cg-like-btn${likeActive}" data-kind="images" data-id="${img.id}" data-action="like">
            <span class="icon-like"></span> <span class="cnt">${img.like_count || 0}</span>
          </button>
          <button class="icon-btn cg-btn cg-bm-btn${bmActive}" data-kind="images" data-id="${img.id}" data-action="bookmark">
            <span class="icon-bm"></span>
          </button>
        </div>
      </div>
    </div>`;
}