// mypage.js - 마이 페이지 전용 자바스크립트
// 프로필 보기, 좋아요/북마크 목록 보기, 회원 정보 수정, 비밀번호 변경, 회원 탈퇴

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 로그인 확인
  const user = await requireLogin();
  if (!user) return;
  currentUser = user;

  initTabs();
  await loadProfile();
  await loadHistory();
  await loadList('likes');
  await loadList('bookmarks');
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
async function loadProfile() {
  const card = document.getElementById('profileCard');
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
// 설정 탭 - 정보 수정 / 비밀번호 변경 / 탈퇴
// ---------------------------------------------------------------
function initSettings() {
  const editNick = document.getElementById('editNickname');
  const editEmail = document.getElementById('editEmail');
  editNick.value = currentUser.nickname;
  editEmail.value = currentUser.email || '';

  // 1) 회원 정보 수정
  document.getElementById('saveProfileBtn').addEventListener('click', async () => {
    const editError = document.getElementById('editError');
    editError.textContent = '';
    try {
      const { user } = await api('/user/me', {
        method: 'PUT',
        body: JSON.stringify({ nickname: editNick.value.trim(), email: editEmail.value.trim() }),
      });
      currentUser = user;
      await loadProfile();
      editNick.value = user.nickname;
      editEmail.value = user.email || '';
      showToast('회원 정보를 수정했어요.');
    } catch (err) {
      editError.textContent = err.message;
    }
  });

  // 2) 비밀번호 변경
  document.getElementById('changePwBtn').addEventListener('click', async () => {
    const pwError = document.getElementById('pwError');
    pwError.textContent = '';
    const current = document.getElementById('pwCurrent').value;
    const next = document.getElementById('pwNext').value;
    const next2 = document.getElementById('pwNext2').value;
    if (!current || !next || !next2) {
      pwError.textContent = '모든 칸을 입력해 주세요.';
      return;
    }
    if (next !== next2) {
      pwError.textContent = '새 비밀번호가 서로 다릅니다.';
      return;
    }
    try {
      await api('/user/me/password', {
        method: 'PUT',
        body: JSON.stringify({ current, next }),
      });
      document.getElementById('pwCurrent').value = '';
      document.getElementById('pwNext').value = '';
      document.getElementById('pwNext2').value = '';
      showToast('비밀번호를 변경했어요.');
    } catch (err) {
      pwError.textContent = err.message;
    }
  });

  // 3) 회원 탈퇴
  document.getElementById('deleteBtn').addEventListener('click', async () => {
    const delError = document.getElementById('delError');
    delError.textContent = '';
    if (!confirm('정말 탈퇴하시겠어요? 이 작업은 되돌릴 수 없어요.')) return;
    try {
      await api('/user/me', {
        method: 'DELETE',
        body: JSON.stringify({ password: document.getElementById('delPassword').value }),
      });
      showToast('탈퇴되었어요. 그동안 이용해 주셔서 감사해요.');
      setTimeout(() => { window.location.href = 'index.html'; }, 600);
    } catch (err) {
      delError.textContent = err.message;
    }
  });
}
