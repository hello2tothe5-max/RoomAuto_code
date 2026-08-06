// server.js - 서버의 시작점
// Express로 웹 서버를 만들고, 정적 파일과 API 라우터를 연결합니다.

require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const passport = require('passport');

require('./db'); // 데이터베이스 연결 + 테이블 생성 + 예시 데이터

const app = express();

// ---------------------------------------------------------------
// 기본 미들웨어
// ---------------------------------------------------------------
app.use(express.json());                        // JSON 요청 본문을 읽기 위함
app.use(express.urlencoded({ extended: true })); // 로그인 폼 등 일반 폼을 읽기 위함

// 세션 관리 (로그인 상태를 기억)
app.use(session({
  secret: process.env.SESSION_SECRET || 'roomauto-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // 7일 동안 로그인 유지
}));

// passport (소셜 로그인) 초기화
app.use(passport.initialize());
app.use(passport.session());

// ---------------------------------------------------------------
// 정적 파일 제공 (HTML, CSS, JS, 이미지)
// ---------------------------------------------------------------
app.use(express.static(path.join(__dirname, 'public')));

// 사용자가 올린 이미지와 AI가 만든 이미지 제공
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 파비콘 요청을 아이콘 파일로 연결
app.get('/favicon.ico', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'images', 'favicon.svg'))
);

// API 라우터 연결
// (auth 라우터는 루트에 연결 - /api/auth/* 와 /auth/*(소셜 로그인) 둘 다 사용)
app.use(require('./routes/auth'));
app.use('/api', require('./routes/ai'));
app.use('/api', require('./routes/content'));
app.use('/api/user', require('./routes/user'));

// 홈 페이지로 들어오면 메인 화면(index.html) 보여주기
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ---------------------------------------------------------------
// 서버 실행
// ---------------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`RoomAuto 서버가 실행됐어요! http://localhost:${PORT}`);
});
