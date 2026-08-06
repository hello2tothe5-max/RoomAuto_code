// db.js - 데이터베이스 연결과 테이블 생성, 예시 데이터(Seed) 넣기
// better-sqlite3은 동기 방식이라 초보자도 순서대로 읽기 쉽습니다.

const path = require('path');
const fs = require('fs');
const { DatabaseSync: Database } = require('node:sqlite');
const bcrypt = require('bcryptjs');

// data 폴더가 없으면 만듭니다
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// SQLite 데이터베이스 파일 열기
const db = new Database(path.join(dataDir, 'roomauto.db'));
db.exec('PRAGMA journal_mode = WAL');

// ---------------------------------------------------------------
// 테이블 생성
// ---------------------------------------------------------------
db.exec(`
  -- 회원 테이블
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT UNIQUE,               -- 로그인 아이디(이메일). 소셜 로그인 시 없을 수도 있음
    password_hash TEXT,                      -- 비밀번호를 암호화해서 저장 (bcrypt)
    nickname      TEXT NOT NULL,             -- 표시 이름
    provider      TEXT DEFAULT 'local',      -- 'local' | 'google' | 'github'
    provider_id   TEXT,                      -- 소셜 로그인에서 받은 고유 아이디
    avatar        TEXT,                      -- 프로필 이미지 주소
    created_at    TEXT DEFAULT (datetime('now','localtime'))
  );

  -- AI 디자인 요청 기록 테이블 (데이터 분석의 원본이 됨)
  CREATE TABLE IF NOT EXISTS ai_requests (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER,
    type         TEXT,                       -- 'decor'(빈방 꾸미기) | 'floorplan'(평면도 3D)
    room         TEXT,                       -- 예: 원룸, 침실, 거실
    style        TEXT,                       -- 예: 미니멀, 빈티지, 북유럽
    prompt       TEXT,                       -- 사용자가 입력한 전체 문장
    input_image  TEXT,                       -- 사용자가 올린 원본 이미지 경로
    output_image TEXT,                       -- AI가 만든 결과 이미지 경로
    created_at   TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- 갤러리 이미지 테이블
  CREATE TABLE IF NOT EXISTS gallery_images (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    room        TEXT,                        -- 공간 종류
    style       TEXT,                        -- 스타일 종류
    description TEXT,
    image_url   TEXT NOT NULL,
    author      TEXT,
    created_at  TEXT DEFAULT (datetime('now','localtime'))
  );

  -- 갤러리 좋아요 (user_id + image_id 중복 방지를 위해 복합 기본키)
  CREATE TABLE IF NOT EXISTS image_likes (
    user_id INTEGER,
    image_id INTEGER,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    PRIMARY KEY (user_id, image_id)
  );

  -- 갤러리 북마크
  CREATE TABLE IF NOT EXISTS image_bookmarks (
    user_id INTEGER,
    image_id INTEGER,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    PRIMARY KEY (user_id, image_id)
  );

  -- 리뷰 테이블
  CREATE TABLE IF NOT EXISTS reviews (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    author      TEXT NOT NULL,
    rating      REAL DEFAULT 5,              -- 평점 (1~5)
    content     TEXT NOT NULL,
    image_url   TEXT NOT NULL,
    created_at  TEXT DEFAULT (datetime('now','localtime'))
  );

  -- 리뷰 좋아요
  CREATE TABLE IF NOT EXISTS review_likes (
    user_id INTEGER,
    review_id INTEGER,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    PRIMARY KEY (user_id, review_id)
  );

  -- 리뷰 북마크
  CREATE TABLE IF NOT EXISTS review_bookmarks (
    user_id INTEGER,
    review_id INTEGER,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    PRIMARY KEY (user_id, review_id)
  );
`);

// ---------------------------------------------------------------
// 예시 이미지(SVG) 생성 함수 - 갤러리/리뷰에 사용할 샘플 이미지
// ---------------------------------------------------------------
function makeSvg(name, hue, label, room, style) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue},70%,82%)"/>
      <stop offset="100%" stop-color="hsl(${hue + 40},70%,62%)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#g)"/>
  <!-- 바닥 -->
  <polygon points="0,420 800,420 800,600 0,600" fill="hsl(${hue},45%,75%)" opacity="0.55"/>
  <!-- 벽(소파 모양 느낌) -->
  <rect x="120" y="300" width="560" height="90" rx="10" fill="rgba(255,255,255,0.55)"/>
  <rect x="160" y="330" width="480" height="60" rx="8" fill="rgba(255,255,255,0.35)"/>
  <!-- 창문 -->
  <rect x="330" y="150" width="140" height="120" rx="6" fill="rgba(255,255,255,0.7)"/>
  <line x1="400" y1="150" x2="400" y2="270" stroke="rgba(120,120,120,0.5)" stroke-width="4"/>
  <!-- 화분 -->
  <circle cx="640" cy="330" r="30" fill="rgba(80,150,90,0.6)"/>
  <rect x="625" y="340" width="30" height="40" rx="4" fill="rgba(160,110,70,0.8)"/>
  <text x="400" y="560" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="rgba(255,255,255,0.9)" font-weight="bold">${label}</text>
  <text x="400" y="85" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="rgba(255,255,255,0.8)">${room} · ${style}</text>
</svg>`;
  fs.writeFileSync(path.join(__dirname, 'public', 'images', 'seed', `${name}.svg`), svg);
}

// ---------------------------------------------------------------
// 예시 데이터 넣기 (처음 실행할 때만)
// ---------------------------------------------------------------
function seed() {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (userCount > 0) return; // 이미 데이터가 있으면 건너뜀

  const seedDir = path.join(__dirname, 'public', 'images', 'seed');
  if (!fs.existsSync(seedDir)) fs.mkdirSync(seedDir, { recursive: true });

  // 1) 데모 회원 만들기 (비밀번호: 1234)
  const demoHash = bcrypt.hashSync('1234', 10);
  db.prepare(`INSERT INTO users (email, password_hash, nickname, provider, avatar)
              VALUES ('demo@roomauto.com', ?, '데모 사용자', 'local', NULL)`).run(demoHash);

  // 2) 갤러리 샘플 이미지 6장
  const galleries = [
    ['gal_1.jpeg', '미니멀 원룸', '원룸', '미니멀'],
    ['gal_2.jpg', '북유럽 침실', '침실', '북유럽'],
    ['gal_3.jpeg', '빈티지 거실', '거실', '빈티지'],
    ['gal_4.jpeg', '모던한 주방', '주방', '모던'],
    ['gal_5.jpeg', '우드톤 서재', '서재', '내추럴'],
    ['gal_6.jpeg', '파스텔 드레스룸', '드레스룸', '파스텔'],
  ];
  const insGal = db.prepare(
    `INSERT INTO gallery_images (title, room, style, description, image_url, author)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  galleries.forEach(([name, title, room, style]) => {
    // makeSvg(name, hue, title, room, style);
    insGal.run(
      title,
      room,
      style,
      `${room} 공간에 ${style} 스타일을 적용한 예시입니다. 작은 공간을 넓어 보이게 배치했어요.`,
      `/images/seed/${name}.svg`,
      'RoomAuto'
    );
  });

  // 3) 리뷰 샘플 4개
  const reviews = [
    ['후기', '인테리어 초보자도 끝!', '김인테리어', 5,
      '처음에는 무엇부터 해야 할지 막막했는데, 빈 방 사진을 올리고 스타일을 고르니 AI가 바로 추천해줬어요. 벽지 색부터 소파 위치까지 잡아줘서 너무 편했어요. 실제로 적용해보니 사진 그대로 예뻐요!',
      '/images/seed/gal_1.svg'],
    ['후기', '원룸이 2배 넓어 보여요', '이싱글', 4.5,
      '7평 원룸이라 좁은 게 고민이었는데 미니멀 스타일로 추천받고 나니 공간이 훨씬 넓어 보입니다. 밝은 톤의 가구 조합을 추천해줘서 좋았어요.',
      '/images/seed/gal_3.svg'],
    ['후기', '평면도 3D가 신기해요', '박자취', 5,
      '평면도만 있었는데 AI가 입체로 바꿔주고 마우스로 돌려볼 수 있어서 배치를 머릿속으로 그릴 수 있었어요. 거실 소파 자리 정하는 데 큰 도움이 됐습니다.',
      '/images/seed/gal_4.svg'],
    ['후기', '취향 분석이 재밌어요', '최북유럽', 4,
      '내가 좋아하는 스타일이 뭔지 데이터로 보여줘서 신기했어요. 북유럽, 내추럴 스타일을 가장 많이 고르더라고요. 친구들한테도 추천하고 싶은 사이트예요.',
      '/images/seed/gal_2.svg'],
  ];
  const insRev = db.prepare(
    `INSERT INTO reviews (title, author, rating, content, image_url)
     VALUES (?, ?, ?, ?, ?)`
  );
  reviews.forEach(([title, name, author, rating, content, img]) => {
    insRev.run(title, author, rating, content, img);
  });

  console.log('예시 데이터(Seed)를 넣었습니다. 데모 로그인: demo@roomauto.com / 1234');
}

seed();

module.exports = db;

// --- 갤러리 이미지 강제 업데이트 (1회용) ---
// db.prepare("UPDATE gallery_images SET image_url = '/images/seed/gal_1.jpeg' WHERE title = '미니멀 원룸'").run();
// db.prepare("UPDATE gallery_images SET image_url = '/images/seed/gal_2.jpg'  WHERE title = '북유럽 침실'").run();
// db.prepare("UPDATE gallery_images SET image_url = '/images/seed/gal_3.jpeg' WHERE title = '빈티지 거실'").run();
// db.prepare("UPDATE gallery_images SET image_url = '/images/seed/gal_4.jpeg' WHERE title = '모던한 주방'").run();
// db.prepare("UPDATE gallery_images SET image_url = '/images/seed/gal_5.jpeg' WHERE title = '우드톤 서재'").run();
// db.prepare("UPDATE gallery_images SET image_url = '/images/seed/gal_6.jpeg' WHERE title = '파스텔 드레스룸'").run();

// --- 리뷰 이미지 강제 업데이트 ---
// (예: 작성자가 '김인테리어'인 리뷰의 사진을 로컬 이미지로 교체)
// db.prepare("UPDATE reviews SET image_url = '/images/review01.jpeg' WHERE author = '최북유럽'").run();
// db.prepare("UPDATE reviews SET image_url = '/images/review02.jpeg' WHERE author = '박자취'").run();
// db.prepare("UPDATE reviews SET image_url = '/images/review03.jpeg' WHERE author = '이싱글'").run();