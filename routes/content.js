// routes/content.js - 갤러리, 리뷰, 좋아요, 북마크, 데이터 분석 API

const express = require('express');
const db = require('../db');
const { requireAuth } = require('./helpers');

const router = express.Router();

// ---------------------------------------------------------------
// 좋아요/북마크 개수와 내가 눌렀는지 여부를 붙여주는 보조 함수
// ---------------------------------------------------------------
function withMyState(rows, userId, likeTable, bookmarkTable, idCol) {
  return rows.map((row) => {
    const likeCnt = db.prepare(`SELECT COUNT(*) AS c FROM ${likeTable} WHERE ${idCol} = ?`).get(row.id).c;
    const bmCnt = db.prepare(`SELECT COUNT(*) AS c FROM ${bookmarkTable} WHERE ${idCol} = ?`).get(row.id).c;
    const myLike = userId
      ? db.prepare(`SELECT 1 AS x FROM ${likeTable} WHERE ${idCol} = ? AND user_id = ?`).get(row.id, userId)
      : null;
    const myBm = userId
      ? db.prepare(`SELECT 1 AS x FROM ${bookmarkTable} WHERE ${idCol} = ? AND user_id = ?`).get(row.id, userId)
      : null;
    return { ...row, like_count: likeCnt, bookmark_count: bmCnt, my_like: !!myLike, my_bookmark: !!myBm };
  });
}

// ---------------------------------------------------------------
// 갤러리
// ---------------------------------------------------------------
router.get('/gallery', (req, res) => {
  const { room, style, q } = req.query;
  let sql = 'SELECT * FROM gallery_images WHERE 1=1';
  const args = [];
  if (room) { sql += ' AND room = ?'; args.push(room); }
  if (style) { sql += ' AND style = ?'; args.push(style); }
  if (q) { sql += ' AND title LIKE ?'; args.push(`%${q}%`); }
  sql += ' ORDER BY id DESC';
  const rows = db.prepare(sql).all(...args);
  res.json(withMyState(rows, req.user?.id, 'image_likes', 'image_bookmarks', 'image_id'));
});

router.get('/gallery/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM gallery_images WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: '이미지를 찾을 수 없어요.' });
  res.json(withMyState([row], req.user?.id, 'image_likes', 'image_bookmarks', 'image_id')[0]);
});

// ---------------------------------------------------------------
// 리뷰
// ---------------------------------------------------------------
router.get('/reviews', (req, res) => {
  const rows = db.prepare('SELECT * FROM reviews ORDER BY id DESC').all();
  res.json(withMyState(rows, req.user?.id, 'review_likes', 'review_bookmarks', 'review_id'));
});

router.get('/reviews/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: '리뷰를 찾을 수 없어요.' });
  res.json(withMyState([row], req.user?.id, 'review_likes', 'review_bookmarks', 'review_id')[0]);
});

// ---------------------------------------------------------------
// 좋아요 / 북마크 (누르면 저장, 다시 누르면 취소 - 토글 방식)
// ---------------------------------------------------------------
function toggle(likeTable, bookmarkTable, idCol, idKey) {
  return (req, res) => {
    const id = Number(req.params.id);
    const { action } = req.body; // 'like' | 'bookmark'
    if (action !== 'like' && action !== 'bookmark') {
      return res.status(400).json({ error: 'action은 like 또는 bookmark여야 해요.' });
    }
    const table = action === 'like' ? likeTable : bookmarkTable;
    const exists = db.prepare(`SELECT 1 AS x FROM ${table} WHERE ${idCol} = ? AND user_id = ?`).get(id, req.user.id);
    if (exists) {
      db.prepare(`DELETE FROM ${table} WHERE ${idCol} = ? AND user_id = ?`).run(id, req.user.id);
    } else {
      db.prepare(`INSERT INTO ${table} (${idCol}, user_id) VALUES (?, ?)`).run(id, req.user.id);
    }
    const cnt = db.prepare(`SELECT COUNT(*) AS c FROM ${table} WHERE ${idCol} = ?`).get(id).c;
    res.json({ active: !exists, count: cnt });
  };
}

router.post('/images/:id/toggle', requireAuth, toggle('image_likes', 'image_bookmarks', 'image_id', 'image_id'));
router.post('/reviews/:id/toggle', requireAuth, toggle('review_likes', 'review_bookmarks', 'review_id', 'review_id'));

// ---------------------------------------------------------------
// 핵심 기능 3) 데이터 분석 - 사용자들이 선호하는 공간/스타일
// ---------------------------------------------------------------
router.get('/analysis', (req, res) => {
  const rooms = db.prepare(
    `SELECT room AS label, COUNT(*) AS count FROM ai_requests GROUP BY room ORDER BY count DESC`
  ).all();
  const styles = db.prepare(
    `SELECT style AS label, COUNT(*) AS count FROM ai_requests GROUP BY style ORDER BY count DESC`
  ).all();
  const total = db.prepare('SELECT COUNT(*) AS c FROM ai_requests').get().c;
  const typeCount = db.prepare(
    `SELECT type AS label, COUNT(*) AS count FROM ai_requests GROUP BY type`
  ).all();
  res.json({ total, rooms, styles, types: typeCount });
});

module.exports = router;
