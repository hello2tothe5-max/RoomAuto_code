// auth.js - 로그인/회원가입 페이지 전용 자바스크립트
// login.html과 register.html 두 페이지에서 함께 사용합니다.
document.addEventListener('DOMContentLoaded', () => {
  // URL에 ?error= 메시지가 붙어 왔으면 표시 (소셜 로그인 실패 시)
  const errMsg = new URLSearchParams(location.search).get('error');
  if (errMsg) showError(errMsg);
  const loginForm = document.getElementById('loginForm');
  if (loginForm) initLogin(loginForm);
  const registerForm = document.getElementById('registerForm');
  if (registerForm) initRegister(registerForm);
});
function showError(msg) {
  const el = document.getElementById('formError');
  if (el) el.textContent = msg;
}

// auth.js - 소셜 로그인 전용 자바스크립트
document.addEventListener('DOMContentLoaded', () => {
  // URL에 ?error= 메시지가 붙어 왔으면 표시 (예: 구글 로그인 취소/실패 시)
  const errMsg = new URLSearchParams(location.search).get('error');
  if (errMsg) {
    const el = document.getElementById('formError');
    if (el) el.textContent = errMsg;
  }
});


// // ---------------------------------------------------------------
// // 로그인 처리
// // ---------------------------------------------------------------
// function initLogin(form) {
//   form.addEventListener('submit', async (e) => {
//     e.preventDefault(); // 페이지가 새로고침되지 않게 막기
//     const email = document.getElementById('email').value.trim();
//     const password = document.getElementById('password').value;
//     if (!email || !password) {
//       showError('이메일과 비밀번호를 모두 입력해 주세요.');
//       return;
//     }
//     try {
//       const { user } = await api('/auth/login', {
//         method: 'POST',
//         body: JSON.stringify({ email, password }),
//       });
//       showToast(`${user.nickname}님, 환영해요!`);

//       // ✅ [수정된 부분] 모달(iframe) 내부인지 판단하여 다르게 동작
//       setTimeout(() => {
//         if (window.parent !== window) {
//           // 1. 모달창 안에서 로그인한 경우: 부모 창(홈페이지) 새로고침
//           window.parent.location.reload();
//         } else {
//           // 2. 모달이 아닌 일반 전체 창에서 로그인한 경우: 마이페이지 또는 홈으로 이동
//           window.location.href = 'index.html';
//         }
//       }, 500);
//     } catch (err) {
//       showError(err.message);
//     }
//   });
// }
// // ---------------------------------------------------------------
// // 회원가입 처리
// // ---------------------------------------------------------------
// function initRegister(form) {
//   form.addEventListener('submit', async (e) => {
//     e.preventDefault();
//     const nickname = document.getElementById('nickname').value.trim();
//     const email = document.getElementById('email').value.trim();
//     const password = document.getElementById('password').value;
//     const password2 = document.getElementById('password2').value;
//     if (!nickname || !email || !password) {
//       showError('모든 항목을 입력해 주세요.');
//       return;
//     }
//     if (password !== password2) {
//       showError('비밀번호가 서로 다릅니다. 다시 확인해 주세요.');
//       return;
//     }
//     try {
//       const { user } = await api('/auth/register', {
//         method: 'POST',
//         body: JSON.stringify({ email, password, nickname }),
//       });
//       showToast(`${user.nickname}님, 가입을 환영해요!`);

//       // ✅ [수정된 부분] 모달(iframe) 내부인지 판단하여 다르게 동작
//       setTimeout(() => {
//         if (window.parent !== window) {
//           // 1. 모달창 안에서 가입한 경우: 부모 창 새로고침
//           window.parent.location.reload();
//         } else {
//           // 2. 모달이 아닌 일반 전체 창에서 가입한 경우: 마이페이지 또는 홈으로 이동
//           window.location.href = 'index.html';
//         }
//       }, 500);
//     } catch (err) {
//       showError(err.message);
//     }
//   });
// }