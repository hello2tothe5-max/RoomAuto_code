// routes/helpers.js - 공통으로 쓰는 작은 도구 모음
// 1) 로그인 확인 미들웨어  2) DB 회원을 화면용 데이터로 바꾸기

const db = require('../db');

// 로그인한 회원만 접근 가능하게 하는 미들웨어
// passport가 로그인 시 req.user에 회원 정보를 넣어줍니다.
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: '로그인이 필요한 기능이에요.' });
  }
  next();
}

// 회원 정보에서 비밀번호 해시처럼 보여주면 안 되는 부분을 지우고 반환
function safeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    provider: user.provider,
    avatar: user.avatar,
    created_at: user.created_at,
  };
}

module.exports = { requireAuth, safeUser };
