// mypage.js - 마이 페이지 전용 자바스크립트
// 프로필 보기, 좋아요/북마크 목록 보기, 회원 정보 수정, 비밀번호 변경, 회원 탈퇴

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 로그인 확인
  const user = await requireLogin();
  if (!user) return;
  currentUser = user;

  // initTabs();
  await loadProfile();
  // await loadHistory();
  // await loadList('likes');
  // await loadList('bookmarks');
  initSettings();
});

// ---------------------------------------------------------------
// 탭 전환
// ---------------------------------------------------------------
function initTabs() {
  document.querySelectorAll('.mp-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.mp-tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.mp-panel').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('panel-' + tab.dataset.panel).classList.add('active');
    });
  });
}

// ---------------------------------------------------------------
// 프로필 카드 그리기
// ---------------------------------------------------------------
// 프로필 카드 그리기 (기존 + 새 UI 동시 지원)
// ---------------------------------------------------------------
async function loadProfile() {
  // 1. 기존 UI 업데이트
  const card = document.getElementById('profileCard');
  if (card) {
    const avatar = currentUser.avatar
      ? `<img src="${currentUser.avatar}" alt="프로필">`
      : `<span>${escapeHtml(currentUser.nickname.slice(0, 1))}</span>`;
    const providerName = {
      local: '이메일 계정',
      google: '구글 로그인',
      github: '깃허브 로그인',
    }[currentUser.provider] || currentUser.provider;
    card.innerHTML = `
      <div class="profile-avatar">${avatar}</div>
      <div class="profile-info">
        <div class="p-nick">${escapeHtml(currentUser.nickname)}</div>
        <div class="p-email">${escapeHtml(currentUser.email || '이메일 없음')}</div>
        <div class="p-meta">
          <span class="badge">${providerName}</span>
          <span class="badge">가입일: ${formatDate(currentUser.created_at)}</span>
        </div>
      </div>
    `;
  }
  // 2. 새 UI 업데이트
  const displayUsername = document.getElementById('displayUsername');
  const avatarImg = document.querySelector('.mp-avatar img');
  if (displayUsername) displayUsername.textContent = currentUser.nickname;
  if (avatarImg && currentUser.avatar) avatarImg.src = currentUser.avatar;
  // 3. 새 UI 로그아웃 버튼 연결
  const logoutBtn = document.getElementById('mpLogoutBtn');
  if (logoutBtn && !logoutBtn.dataset.bound) {
    logoutBtn.dataset.bound = 'true';
    logoutBtn.addEventListener('click', async () => {
      if (!confirm('로그아웃 하시겠습니까?')) return;
      try {
        await api('/auth/logout', { method: 'POST' });
        window.location.href = 'index.html';
      } catch (err) {
        console.error(err);
      }
    });
  }
}

// ---------------------------------------------------------------
// 나의 생성 내역 (AI 요청 기록) 그리기
// ---------------------------------------------------------------
async function loadHistory() {
  const panel = document.getElementById('panel-history');
  try {
    const { history } = await api('/user/me/history');
    if (!history.length) {
      panel.innerHTML = `<h3 class="mp-section-title">아직 생성한 AI 이미지가 없어요. 첫 인테리어를 만들어 보세요!</h3>`;
      return;
    }
    const html = `
      <h3 class="mp-section-title">내가 만든 AI 이미지 ${history.length}개</h3>
      ${mpGrid(history.map((h) => `
        <div class="mp-item" style="cursor: default; text-decoration: none;">
          <img src="${h.output_image}" alt="결과 이미지" loading="lazy" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'400\\'%3E%3Crect width=\\'100%25\\' height=\\'100%25\\' fill=\\'%23eee\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' fill=\\'%23999\\' font-family=\\'sans-serif\\' font-size=\\'14\\' text-anchor=\\'middle\\' dy=\\'0.3em\\'%3E이미지가 삭제됨%3C/text%3E%3C/svg%3E';" style="aspect-ratio: 1/1; object-fit: cover; width: 100%;">
          <div class="mp-body" style="padding: 14px;">
            <span class="mp-kind" style="background:var(--primary); color:#fff;">${h.type === 'decor' ? '빈 방 꾸미기' : '평면도 3D'}</span>
            <div style="font-weight: 800; margin: 8px 0 4px; color: var(--ink);">${escapeHtml(h.room)} · ${escapeHtml(h.style)}</div>
            <div style="font-size: 13px; color: var(--muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${escapeHtml(h.prompt)}</div>
            <div style="font-size: 11px; color: var(--line); margin-top: 8px;">${formatDate(h.created_at)}</div>
          </div>
        </div>
      `))}
    `;
    panel.innerHTML = html;
  } catch (err) {
    panel.innerHTML = `<p style="color:var(--danger);">${escapeHtml(err.message)}</p>`;
  }
}

// ---------------------------------------------------------------
// 좋아요 / 북마크 목록 그리기
// ---------------------------------------------------------------
async function loadList(kind) {
  const panel = document.getElementById('panel-' + kind);
  try {
    const { images, reviews } = await api(`/user/me/${kind}`);
    const imageHtml = images.length
      ? `<h3 class="mp-section-title">갤러리 이미지 ${images.length}개</h3>
         ${mpGrid(images.map((i) => `
           <a class="mp-item" href="gallery-detail.html?id=${i.id}">
             <img src="${i.image_url}" alt="${escapeHtml(i.title)}" loading="lazy">
             <div class="mp-body"><span class="mp-kind">이미지</span> ${escapeHtml(i.title)}</div>
           </a>`))}`
      : `<h3 class="mp-section-title">좋아요한 이미지가 아직 없어요</h3>`;

    const reviewHtml = reviews.length
      ? `<h3 class="mp-section-title">리뷰 ${reviews.length}개</h3>
         ${mpGrid(reviews.map((r) => `
           <a class="mp-item" href="review-detail.html?id=${r.id}">
             <img src="${r.image_url}" alt="${escapeHtml(r.title)}" loading="lazy">
             <div class="mp-body"><span class="mp-kind">리뷰</span> ${escapeHtml(r.title)}</div>
           </a>`))}`
      : `<h3 class="mp-section-title">${kind === 'likes' ? '좋아요한' : '북마크한'} 리뷰가 아직 없어요</h3>`;

    panel.innerHTML = imageHtml + reviewHtml;
  } catch (err) {
    panel.innerHTML = `<p style="color:var(--danger);">${escapeHtml(err.message)}</p>`;
  }
}

function mpGrid(items) {
  return `<div class="mp-list">${items.join('')}</div>`;
}

// ---------------------------------------------------------------
// 설정 탭 - 정보 수정 / 회원 탈퇴 (소셜 로그인 전용)
// ---------------------------------------------------------------
function initSettings() {
  const editNick = document.getElementById('editNickname');

  if (editNick) {
    editNick.value = currentUser.nickname;
  }
  // 1) 회원 정보 수정 (닉네임만 변경)
  document.getElementById('saveProfileBtn')?.addEventListener('click', async () => {
    try {
      // 닉네임이 기존과 다르게 변경되었을 때만 업데이트 실행
      if (editNick && editNick.value.trim() !== currentUser.nickname) {
        const { user } = await api('/user/me', {
          method: 'PUT',
          body: JSON.stringify({ nickname: editNick.value.trim() }),
        });
        currentUser = user;

        await loadProfile(); // 프로필 카드 닉네임 즉시 갱신
        if (editNick) editNick.value = user.nickname;
        showToast('계정 정보가 성공적으로 수정되었습니다.');
      } else {
        showToast('변경된 내용이 없습니다.');
      }
    } catch (err) {
      showToast(err.message);
    }
  });
  // 2) 회원 탈퇴 (커스텀 모달 팝업 사용)
  const deleteBtn = document.getElementById('deleteBtn');
  const deleteModal = document.getElementById('deleteModalOverlay');
  const btnDeleteYes = document.getElementById('btnDeleteYes');
  const btnDeleteNo = document.getElementById('btnDeleteNo');
  if (deleteBtn && deleteModal) {
    // 탈퇴 버튼 클릭 시 모달 열기
    deleteBtn.addEventListener('click', () => {
      deleteModal.classList.add('active');
    });
    // '아니오' 버튼 클릭 시 모달 닫기
    btnDeleteNo.addEventListener('click', () => {
      deleteModal.classList.remove('active');
    });
    // ▼ 추가할 코드: 모달창 외부(어두운 배경) 클릭 시 닫기
    deleteModal.addEventListener('click', (e) => {
      // 클릭한 요소가 정확히 배경(오버레이)일 때만 동작하도록 설정 (내부 박스 클릭 제외)
      if (e.target === deleteModal) {
        deleteModal.classList.remove('active');
      }
    });
    // '네' 버튼 클릭 시 실제 탈퇴 API 호출
    btnDeleteYes.addEventListener('click', async () => {
      try {
        await api('/user/me', {
          method: 'DELETE',
          body: JSON.stringify({ password: '' }), // 소셜 로그인이므로 비밀번호 공백 전송
        });
        showToast('탈퇴되었어요. 그동안 이용해 주셔서 감사해요.');
        deleteModal.classList.remove('active'); // 모달 닫기
        setTimeout(() => { window.location.href = 'index.html'; }, 600);
      } catch (err) {
        showToast(err.message);
      }
    });
  }
}

// ===============================================================
// 마이페이지 내 갤러리 화면 전환 기능 (나의 디자인, 좋아요, 북마크)
// ===============================================================
document.addEventListener('DOMContentLoaded', () => {
  const mainView = document.getElementById('mypage-main-view');
  const subView = document.getElementById('mypage-sub-view');
  const subHeader = document.getElementById('sub-view-header');
  const subGrid = document.getElementById('sub-view-grid');

  const myDesignsCard = document.getElementById('mydesigns-card');
  const likesCard = document.getElementById('card-likes');
  const bookmarksCard = document.getElementById('card-bookmarks');

  // 화면 전환 함수 (기존 화면 숨김 + 갤러리 노출)
  function showSubView(title, breadcrumbTitle) {
    // 1) 기존 메인 화면 숨기기, 서브 뷰(갤러리)만 켜기
    mainView.style.display = 'none';
    subView.style.display = 'block';
    // 2) 하단으로 스크롤하지 않고 화면 최상단으로 고정
    window.scrollTo(0, 0);
    // 빵부스러기와 타이틀 렌더링
    subHeader.innerHTML = `
      <nav class="breadcrumb">
        <a href="index.html">홈</a><span class="sep">›</span>
        <a href="#" id="bc-back-btn">마이 페이지</a><span class="sep">›</span>
        <span>${breadcrumbTitle}</span>
      </nav>
      <h1 class="mp-main-title">${title}</h1>
    `;

    // 빵부스러기의 '마이 페이지' 클릭 이벤트 (즉시 원상복구)
    document.getElementById('bc-back-btn').addEventListener('click', (e) => {
      e.preventDefault();

      // 서브 뷰(갤러리) 끄고 다시 메인 화면 켜기
      subView.style.display = 'none';
      mainView.style.display = 'block';

      // 화면 최상단으로 복귀
      window.scrollTo(0, 0);
    });
  }

  // 1) 나의 디자인 클릭
  if (myDesignsCard) {
    myDesignsCard.addEventListener('click', async () => {
      showSubView('나의 디자인', '나의 디자인');
      subGrid.innerHTML = '<h3 style="color:var(--primary-mid);">불러오는 중...</h3>';
      try {
        const { history } = await api('/user/me/history');
        if (!history || history.length === 0) {
          subGrid.innerHTML = '<h3 style="color:var(--primary-mid); grid-column: span 2;">아직 생성한 디자인이 없습니다.</h3>';
          return;
        }
        // 첨부 이미지처럼 깔끔한 2단 이미지 렌더링
        subGrid.innerHTML = history.map(h => `
          <div style="width: 100%; aspect-ratio: 4/3; overflow: hidden; border-radius: 8px;">
            <img src="${h.output_image}" alt="나의 디자인" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
        `).join('');
      } catch (err) {
        subGrid.innerHTML = `<p style="color:var(--danger); grid-column: span 2;">${escapeHtml(err.message)}</p>`;
      }
    });
  }

  // 2) 좋아요 / 북마크 클릭 공통 로직
  async function handleLikeBookmarkClick(apiPath, title) {
    showSubView(title, title);
    subGrid.innerHTML = '<h3 style="color:var(--primary-mid);">불러오는 중...</h3>';
    try {
      const { images, reviews } = await api(`/user/me/${apiPath}`);
      // 이미지 배열과 리뷰 배열을 합침
      const combined = [...images, ...reviews];

      if (combined.length === 0) {
        subGrid.innerHTML = '<h3 style="color:var(--primary-mid); grid-column: span 2;">해당하는 디자인이 없습니다.</h3>';
        return;
      }
      // 첨부 이미지처럼 깔끔한 2단 이미지 렌더링 (해당 갤러리/리뷰 원본으로 이동 가능하도록 a 태그 사용)
      subGrid.innerHTML = combined.map(item => {
        // 리뷰인지 갤러리인지 구분하여 링크 생성
        const detailUrl = item.room_id ? `review-detail.html?id=${item.id}` : `gallery-detail.html?id=${item.id}`;
        return `
          <a href="${detailUrl}" style="display: block; width: 100%; aspect-ratio: 4/3; overflow: hidden; border-radius: 8px; text-decoration: none;">
            <img src="${item.image_url}" alt="디자인 이미지" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          </a>
        `;
      }).join('');
    } catch (err) {
      subGrid.innerHTML = `<p style="color:var(--danger); grid-column: span 2;">${escapeHtml(err.message)}</p>`;
    }
  }

  // 좋아요 클릭
  if (likesCard) {
    likesCard.addEventListener('click', () => handleLikeBookmarkClick('likes', '좋아요 한 디자인'));
  }

  // 북마크 클릭
  if (bookmarksCard) {
    bookmarksCard.addEventListener('click', () => handleLikeBookmarkClick('bookmarks', '북마크 한 디자인'));
  }
});

