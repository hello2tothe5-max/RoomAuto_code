// common.js - 모든 페이지에서 공통으로 쓰는 자바스크립트
// 1) API 호출 도우미  2) 내비게이션(하이드 온 스크롤)  3) 로그인 상태 표시  4) 토스트 알림

// ---------------------------------------------------------------
// 1) API 호출 도우미 - 주소와 옵션을 받아 JSON으로 통신
// ---------------------------------------------------------------
async function api(path, options = {}) {
  const opts = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };
  // FormData(이미지 업로드)면 Content-Type을 자동으로 맞춰야 하므로 제거
  if (options.body instanceof FormData) {
    delete opts.headers['Content-Type'];
  }
  const res = await fetch('/api' + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || '요청에 실패했어요.');
  }
  return data;
}

// ---------------------------------------------------------------
// 2) 토스트 알림 - 화면 아래쪽에 잠깐 메시지 보여주기
// ---------------------------------------------------------------
function showToast(msg, ms = 2200) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), ms);
}

// ---------------------------------------------------------------
// 3) 내비게이션 - 하이드 온 스크롤 + 모바일 메뉴
// ---------------------------------------------------------------
function initNav() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  // 아래로 스크롤하면 숨기고, 위로 스크롤하면 보여주기
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > lastY && y > 120) navbar.classList.add('hide');
    else navbar.classList.remove('hide');
    lastY = y;
  });

  // 모바일에서 햄버거 버튼을 누르면 메뉴 열고 닫기
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
  }
}

// ---------------------------------------------------------------
// 4) 로그인 상태에 따라 내비게이션 오른쪽 부분을 바꾸기
// ---------------------------------------------------------------
async function initAuthNav() {
  const navRight = document.querySelector('.nav-right');
  if (!navRight) return;
  try {
    const { user } = await api('/auth/me');
    if (user) {
      // 로그인한 상태: 사용자 이름과 로그아웃 버튼을 없애고 mypage-login.png 이미지만 표시
      // 로그인한 상태: 프로필 이미지와 숨겨진 드롭다운 메뉴 추가
      navRight.innerHTML = `
        <div class="user-menu-wrapper" style="position: relative; display: inline-block;">
          <img src="./images/mypage-login.png" id="userAvatarBtn" alt="프로필" style="width: 46px; height: 46px; object-fit: cover; border-radius: 50%; cursor: pointer;">
          <div id="userDropdown" class="user-dropdown">
            <a href="mypage.html">마이 페이지</a>
            <button id="logoutBtn">로그아웃</button>
          </div>
        </div>
      `;
      // 드롭다운 열기/닫기 토글
      const avatarBtn = document.getElementById('userAvatarBtn');
      const dropdown = document.getElementById('userDropdown');

      avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 클릭 이벤트가 문서 전체로 퍼지는 것 방지
        dropdown.classList.toggle('show');
      });
      // 아이콘 바깥(다른 곳)을 클릭하면 드롭다운 닫기
      document.addEventListener('click', (e) => {
        if (!avatarBtn.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.classList.remove('show');
        }
      });
      // 로그아웃 버튼 기능
      document.getElementById('logoutBtn').addEventListener('click', async () => {
        await api('/auth/logout', { method: 'POST' });
        showToast('로그아웃 완료!');
        window.location.href = 'index.html';
      });
    } else {
      // 로그인 전: 시작하기 버튼 표시
      navRight.innerHTML = `
        <a class="btn btn-ghost btn-sm" href="login.html" id="start-btn">시작하기</a>
      `;
    }
  } catch (err) {
    // 서버 연결이 안 되면 시작하기 버튼만 표시
    navRight.innerHTML = `<a class="btn btn-ghost btn-sm" href="login.html" id="start-btn">시작하기</a>`;
  }
}

// ---------------------------------------------------------------
// 5) 작은 도구들
// ---------------------------------------------------------------
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatDate(str) {
  if (!str) return '';
  const d = new Date(String(str).replace(' ', 'T'));
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

// 별점(1~5)을 별 표시로 바꾸기
function starHtml(rating) {
  const r = Math.round(rating);
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

// 로그인 여부 확인 (없으면 로그인 모달을 띄우는 용도)
async function requireLogin() {
  const { user } = await api('/auth/me');

  // 로그인 안 된 상태일 때
  if (!user) {
    showToast('로그인이 필요해요.');

    // 기존의 페이지 이동 코드(window.location.href = 'login.html')를 지우고
    // 아래처럼 모달을 띄우는 코드로 변경합니다.
    const loginModal = document.getElementById('login-modal');
    if (loginModal) {
      // setTimeout을 사용해 1.75초(1750ms) 뒤에 모달을 띄웁니다.
      setTimeout(() => {
        loginModal.classList.add('show');
      }, 1750);
    }
    return null;
  }

  return user;
}
// 좋아요 / 북마크 버튼에 클릭 이벤트 달기
function bindToggle(btn, kind, id) {
  btn.addEventListener('click', async () => {
    const user = await requireLogin();
    if (!user) return;
    try {
      const { active, count } = await api(`/${kind}/${id}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ action: btn.dataset.action }),
      });
      // 버튼 모양을 눌린 상태로 바꾸기
      btn.classList.toggle('liked', btn.dataset.action === 'like' && active);
      btn.classList.toggle('bookmarked', btn.dataset.action === 'bookmark' && active);
      const cnt = btn.querySelector('.cnt');
      if (cnt) cnt.textContent = count;
      showToast(active
        ? (btn.dataset.action === 'like' ? '좋아요를 눌렀어요.' : '북마크했어요.')
        : (btn.dataset.action === 'like' ? '좋아요를 취소했어요.' : '북마크를 해제했어요.'));
    } catch (err) {
      showToast(err.message);
    }
  });
}

// 페이지 로딩 시 공통 초기화
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initAuthNav();

  // 스크롤하면서 나타나는 fade-up 효과
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el));
});

// 로그인 모달 창 여닫기
document.addEventListener('DOMContentLoaded', () => {
  const loginModal = document.getElementById('login-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');

  if (loginModal) {
    // 이벤트 위임을 사용하여 동적으로 다시 그려지는 버튼 처리
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#start-btn');
      if (btn) {
        e.preventDefault(); // 기본 링크 이동 방지
        loginModal.classList.add('show');
      }
    });

    // 닫기(X) 버튼 클릭 시 모달 닫기
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        loginModal.classList.remove('show');
      });
    }

    // 모달 바깥쪽(어두운 배경) 클릭 시 모달 닫기
    loginModal.addEventListener('click', (e) => {
      if (e.target === loginModal) {
        loginModal.classList.remove('show');
      }
    });
  }
});