// routes/user.js - 마이 페이지 API
// 내 정보 보기/수정, 비밀번호 변경, 회원 탈퇴, 내 좋아요/북마크 목록

const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAuth, safeUser } = require('./helpers');

const router = express.Router();
router.use(requireAuth); // 이 라우터의 모든 API는 로그인 필요

// GET /api/user/me - 내 정보
router.get('/me', (req, res) => res.json({ user: safeUser(req.user) }));

// PUT /api/user/me - 닉네임/이메일 수정
router.put('/me', (req, res) => {
  const { nickname, email } = req.body;
  const update = [];
  const args = [];

  if (nickname && nickname.trim()) {
    update.push('nickname = ?');
    args.push(nickname.trim());
  }
  if (email && email.trim()) {
    // 이메일 중복 확인 (다른 회원이 쓰는 이메일이면 거부)
    const dup = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.trim(), req.user.id);
    if (dup) return res.status(400).json({ error: '이미 사용 중인 이메일이에요.' });
    update.push('email = ?');
    args.push(email.trim());
  }
  if (update.length === 0) return res.status(400).json({ error: '수정할 내용을 입력해 주세요.' });

  args.push(req.user.id);
  db.prepare(`UPDATE users SET ${update.join(', ')} WHERE id = ?`).run(...args);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: safeUser(user) });
});

// PUT /api/user/me/password - 비밀번호 변경
router.put('/me/password', (req, res) => {
  const { current, next } = req.body;
  if (!current || !next) return res.status(400).json({ error: '현재 비밀번호와 새 비밀번호를 입력해 주세요.' });
  if (next.length < 4) return res.status(400).json({ error: '새 비밀번호는 4자리 이상이어야 해요.' });

  // 현재 비밀번호가 맞는지 확인
  if (!req.user.password_hash || !bcrypt.compareSync(current, req.user.password_hash)) {
    return res.status(400).json({ error: '현재 비밀번호가 틀렸어요.' });
  }
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    .run(bcrypt.hashSync(next, 10), req.user.id);
  res.json({ ok: true });
});

// DELETE /api/user/me - 회원 탈퇴
router.delete('/me', (req, res) => {
  const { password } = req.body;
  // 소셜 로그인 계정은 비밀번호가 없으므로 바로 탈퇴 가능
  if (req.user.password_hash) {
    if (!password || !bcrypt.compareSync(password, req.user.password_hash)) {
      return res.status(400).json({ error: '비밀번호가 틀렸어요.' });
    }
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
  req.logout(() => res.json({ ok: true }));
});

// GET /api/user/me/likes - 내가 좋아요/북마크한 갤러리와 리뷰
router.get('/me/likes', (req, res) => {
  const images = db.prepare(
    `SELECT g.*, 'image' AS kind FROM gallery_images g
     JOIN image_likes l ON l.image_id = g.id WHERE l.user_id = ? ORDER BY l.created_at DESC`
  ).all(req.user.id);
  const reviews = db.prepare(
    `SELECT r.*, 'review' AS kind FROM reviews r
     JOIN review_likes l ON l.review_id = r.id WHERE l.user_id = ? ORDER BY l.created_at DESC`
  ).all(req.user.id);
  res.json({ images, reviews });
});

router.get('/me/bookmarks', (req, res) => {
  const images = db.prepare(
    `SELECT g.*, 'image' AS kind FROM gallery_images g
     JOIN image_bookmarks b ON b.image_id = g.id WHERE b.user_id = ? ORDER BY b.created_at DESC`
  ).all(req.user.id);
  const reviews = db.prepare(
    `SELECT r.*, 'review' AS kind FROM reviews r
     JOIN review_bookmarks b ON b.review_id = r.id WHERE b.user_id = ? ORDER BY b.created_at DESC`
  ).all(req.user.id);
  res.json({ images, reviews });
});

// GET /api/user/me/history - 내 AI 생성 내역
router.get('/me/history', (req, res) => {
  const history = db.prepare(
    `SELECT * FROM ai_requests WHERE user_id = ? ORDER BY created_at DESC`
  ).all(req.user.id);
  res.json({ history });
});

module.exports = router;
