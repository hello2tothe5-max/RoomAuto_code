// routes/auth.js - 로그인, 회원가입, 구글/깃허브 로그인 처리

const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAuth, safeUser } = require('./helpers');

const router = express.Router();

// ---------------------------------------------------------------
// passport 기본 설정 - 세션에 회원 id만 저장했다가 요청마다 회원을 찾음
// ---------------------------------------------------------------
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  done(null, user);
});

// ---------------------------------------------------------------
// 1) 이메일/비밀번호 로컬 로그인
// ---------------------------------------------------------------
passport.use(new LocalStrategy(
  { usernameField: 'email' }, // 화면에서 'email' 이름으로 받음
  (email, password, done) => {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim());
    if (!user) return done(null, false, { message: '이메일 또는 비밀번호가 틀렸어요.' });
    if (!user.password_hash) return done(null, false, { message: '소셜 로그인으로 가입한 계정이에요. 소셜 로그인을 이용해 주세요.' });
    if (!bcrypt.compareSync(password, user.password_hash)) {
      return done(null, false, { message: '이메일 또는 비밀번호가 틀렸어요.' });
    }
    return done(null, user);
  }
));

// POST /api/auth/register - 회원가입
router.post('/api/auth/register', (req, res) => {
  const { email, password, nickname } = req.body;
  if (!email || !password || !nickname) {
    return res.status(400).json({ error: '이메일, 비밀번호, 닉네임을 모두 입력해 주세요.' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: '비밀번호는 4자리 이상이어야 해요.' });
  }

  // 같은 이메일이 있는지 확인
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim());
  if (exists) return res.status(400).json({ error: '이미 가입된 이메일이에요.' });

  // 비밀번호를 안전하게 암호화(bcrypt)해서 저장
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(
    'INSERT INTO users (email, password_hash, nickname, provider) VALUES (?, ?, ?, ?)'
  ).run(email.trim(), hash, nickname.trim(), 'local');

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  req.login(user, (err) => {
    if (err) return res.status(500).json({ error: '로그인 처리 중 오류가 발생했어요.' });
    res.json({ user: safeUser(user) });
  });
});

// POST /api/auth/login - 이메일/비밀번호 로그인
router.post('/api/auth/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return res.status(500).json({ error: '로그인 처리 중 오류가 발생했어요.' });
    if (!user) return res.status(400).json({ error: info.message });
    req.login(user, (e) => {
      if (e) return res.status(500).json({ error: '로그인 처리 중 오류가 발생했어요.' });
      res.json({ user: safeUser(user) });
    });
  })(req, res, next);
});

// POST /api/auth/logout - 로그아웃
router.post('/api/auth/logout', (req, res) => {
  req.logout(() => {
    res.json({ ok: true });
  });
});

// GET /api/auth/me - 지금 로그인한 회원 정보 (페이지 로딩 때 확인용)
router.get('/api/auth/me', (req, res) => {
  res.json({ user: safeUser(req.user || null) });
});

// ---------------------------------------------------------------
// 2) 구글 로그인
//    (구글 OAuth 앱을 만들면 .env에 GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET 입력)
// ---------------------------------------------------------------
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
    },
    (accessToken, refreshToken, profile, done) => {
      // provider_id로 기존 회원을 찾거나 새로 만듦
      let user = db.prepare('SELECT * FROM users WHERE provider = ? AND provider_id = ?')
        .get('google', profile.id);
      if (!user) {
        const email = (profile.emails && profile.emails[0] && profile.emails[0].value)
          || `${profile.id}@google.local`;
        const info = db.prepare(
          `INSERT INTO users (email, nickname, provider, provider_id, avatar)
           VALUES (?, ?, 'google', ?, ?)`
        ).run(email, profile.displayName || '구글 사용자', profile.id, profile.photos?.[0]?.value || null);
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
      }
      done(null, user);
    }
  ));
}

router.get('/auth/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.redirect('/login.html?error=구글 로그인은 설정이 필요해요(.env 파일을 확인하세요).');
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login.html?error=구글 로그인에 실패했어요.' }),
  (req, res) => res.redirect('/mypage.html')
);

// ---------------------------------------------------------------
// 3) 깃허브 로그인
//    (깃허브 앱을 만들면 .env에 GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET 입력)
//    사용자가 이메일을 공개하지 않았을 수 있으므로 깃허브 아이디로 이메일을 만들어 줌
// ---------------------------------------------------------------
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL || '/auth/github/callback',
    },
    (accessToken, refreshToken, profile, done) => {
      let user = db.prepare('SELECT * FROM users WHERE provider = ? AND provider_id = ?')
        .get('github', profile.id);
      if (!user) {
        const email = (profile.emails && profile.emails[0] && profile.emails[0].value)
          || `${profile.username || profile.id}@github.local`; // 이메일이 비공개면 대체 이메일
        const info = db.prepare(
          `INSERT INTO users (email, nickname, provider, provider_id, avatar)
           VALUES (?, ?, 'github', ?, ?)`
        ).run(email, profile.displayName || profile.username || '깃허브 사용자', profile.id, profile.photos?.[0]?.value || null);
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
      }
      done(null, user);
    }
  ));
}

router.get('/auth/github', (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID) {
    return res.redirect('/login.html?error=깃허브 로그인은 설정이 필요해요(.env 파일을 확인하세요).');
  }
  passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
});

router.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login.html?error=깃허브 로그인에 실패했어요.' }),
  (req, res) => res.redirect('/mypage.html')
);

module.exports = router;
