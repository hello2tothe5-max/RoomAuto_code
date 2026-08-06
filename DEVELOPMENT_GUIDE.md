# RoomAuto 개발 가이드

> **1인 가구를 위한 AI 인테리어 큐레이션 웹 사이트를 만드는 전체 과정을 담은 학습용 문서입니다.**
>
> 이 문서는 **프로그래밍 초보자**가 따라 하면서 배울 수 있도록 아주 쉽고 자세하게 작성했습니다.
> HTML · CSS · JavaScript(프론트엔드)와 Express · SQLite(백엔드)를 모두 경험할 수 있습니다.

---

## 목차

1. [프로젝트 소개](#0-프로젝트-소개)
2. [사전 준비 작업](#1-사전-준비-작업)
3. [전체 작업 계획(순서)](#2-전체-작업-계획순서)
4. [단계별 작업 진행 내용 & 완료 확인 방법](#3-단계별-작업-진행-내용--완료-확인-방법)

---

# 0. 프로젝트 소개

## 0-1. 무엇을 만드는가?

1인 가구가 늘어나면서 "내 공간을 어떻게 꾸밀까?" 고민하는 사람들이 많아졌습니다.
**RoomAuto**는 이런 사람들에게 다음 기능을 제공하는 웹 사이트입니다.

| 번호 | 기능 | 설명 |
|------|------|------|
| 1 | **AI 인테리어 디자인** | 빈 방 사진을 올리고 "미니멀, 북유럽" 같은 문장을 입력하면 AI가 가구 배치가 완성된 이미지를 만들어 줍니다. |
| 2 | **평면도 3D 변환** | 평면 도면을 올리면 입체 이미지로 바꿔 주고, 마우스로 돌려볼 수 있습니다. |
| 3 | **취향 데이터 분석** | 사용자들이 어떤 공간·스타일을 선호하는지 데이터로 보여줍니다. |
| 4 | **갤러리 & 리뷰** | 인테리어 예시를 둘러보고, 좋아요와 북마크를 할 수 있습니다. |
| 5 | **회원 시스템** | 이메일 회원가입, 구글·깃허브 로그인, 마이 페이지를 제공합니다. |

## 0-2. 기술 스택

| 구분 | 기술 | 역할 |
|------|------|------|
| 프론트엔드 | HTML, CSS, JavaScript | 화면(페이지)과 사용자 조작 처리 |
| 백엔드 | **Express** (Node.js) | 서버 만들기, API(요청 주소) 제공 |
| 데이터베이스 | **SQLite** | 회원, 갤러리, 리뷰, 좋아요 등 데이터 저장 |
| AI 이미지 생성 | **pollinations.ai** | 무료로 사용할 수 있는 이미지 AI (Flux 모델) |

> pollinations.ai는 별도 API 키가 필요 없는 무료 이미지 생성 서비스입니다.
> 프로젝트에서는 이 서비스를 호출해서 인테리어 이미지를 만듭니다.

## 0-3. 완성된 폴더 구조

```
RoomAuto/
├── server.js            ← 서버 시작점 (Express 설정)
├── db.js                ← 데이터베이스 연결 + 테이블 생성 + 예시 데이터
├── package.json         ← 프로젝트 정보와 필요한 패키지 목록
├── .env.example         ← 환경 변수 설정 예시 (복사해서 .env로 사용)
├── data/                ← SQLite 데이터베이스 파일이 생기는 곳
├── uploads/             ← 사용자가 업로드한 이미지가 저장되는 곳
├── routes/              ← API 코드 모음
│   ├── auth.js          ←   로그인, 회원가입, 구글·깃허브 로그인
│   ├── ai.js            ←   AI 이미지 생성
│   ├── content.js       ←   갤러리, 리뷰, 좋아요, 북마크, 분석
│   ├── user.js          ←   마이 페이지 관련 API
│   └── helpers.js       ←   공통 도구(로그인 확인 등)
└── public/              ← 브라우저에 바로 보여주는 파일들
    ├── index.html       ← 메인 페이지
    ├── design.html      ← AI 디자인 페이지
    ├── analysis.html    ← 취향 분석 페이지
    ├── gallery.html     ← 갤러리 목록
    ├── gallery-detail.html ← 갤러리 상세
    ├── reviews.html     ← 리뷰 목록
    ├── review-detail.html  ← 리뷰 상세
    ├── login.html       ← 로그인
    ├── register.html    ← 회원가입
    ├── mypage.html      ← 마이 페이지
    ├── css/             ← 스타일(CSS) 파일들
    ├── js/              ← 페이지별 자바스크립트 파일들
    └── images/          ← 사진, 아이콘 등
```

## 0-4. 동작 방식(요청 흐름) 이해하기

```
[브라우저] --화면 요청--> [Express 서버] --public 폴더의 HTML/CSS/JS 전달--> [브라우저에 화면 표시]
[브라우저] --API 요청(예: 로그인)--> [Express 서버] --SQL 명령--> [SQLite DB]
                                                                    |--저장/조회 결과--|
[브라우저] <--JSON 결과-- [Express 서버] <--------------------------------------------|
```

- **정적 파일**: `public/` 폴더의 HTML, CSS, JS는 그대로 브라우저로 전달됩니다.
- **API**: `/api/...` 로 시작하는 주소는 서버가 요청을 받아 데이터베이스를 다루고 결과를 **JSON**으로 돌려줍니다.
- **JSON이란**: `{ "name": "홍길동" }` 처럼 컴퓨터끼리 주고받기 쉽게 만든 글 형식입니다.

---

# 1. 사전 준비 작업

## 1-1. 개발 환경 준비 (Node.js 설치)

이 프로젝트의 서버는 **Node.js** 위에서 돌아갑니다. 터미널에서 아래 명령어로 설치 여부를 확인하세요.

```bash
node --version
npm --version
```

두 명령어 모두 버전이 출력되면 준비 완료입니다. (Node.js는 공식 사이트에서 다운로드할 수 있습니다.)

- `node` : JavaScript를 터미널에서 실행하는 프로그램
- `npm` : 필요한 외부 패키지(도구)를 설치해 주는 프로그램

## 1-2. 프로젝트 폴더 만들기

```bash
mkdir roomauto
cd roomauto
```

## 1-3. package.json 만들기

`package.json`은 "이 프로젝트가 무엇이고, 어떤 패키지를 쓰는지"를 적어 두는 이력서 같은 파일입니다.
직접 만들거나 아래 명령어로 만들 수 있습니다.

```bash
npm init -y
```

## 1-4. 필요한 패키지 설치

아래 명령어로 서버를 만드는 데 필요한 패키지들을 설치합니다.

```bash
npm install express express-session passport passport-local passport-google-oauth20 passport-github2 bcryptjs better-sqlite3 multer dotenv
```

각 패키지의 역할:

| 패키지 | 역할 |
|--------|------|
| `express` | 웹 서버 프레임워크. URL에 따른 화면/API 응답을 쉽게 처리 |
| `express-session` | 로그인 상태를 세션(쿠키)으로 기억 |
| `passport` | 로그인 처리 도구 (이메일, 구글, 깃허브) |
| `passport-local` | 이메일/비밀번호 로그인 방식 |
| `passport-google-oauth20` | 구글 로그인 방식 |
| `passport-github2` | 깃허브 로그인 방식 |
| `bcryptjs` | 비밀번호를 암호화(해시)해서 안전하게 저장 |
| `better-sqlite3` | SQLite 데이터베이스 사용 도구 |
| `multer` | 사용자가 올린 이미지 파일을 서버에 저장 |
| `dotenv` | `.env` 파일의 설정값을 읽어서 사용 |

설치가 끝나면 `node_modules` 폴더가 생깁니다(여기서부터 실제 실행 코드가 들어있습니다).

## 1-5. 폴더 구조 만들기

```bash
mkdir routes public data uploads
mkdir public/css public/js public/images
```

## 1-6. 디자인 시스템 만들기

> **디자인 시스템이란?** 모든 페이지에서 같은 느낌을 주기 위해 색, 글꼴, 버튼 모양 등을 미리 규칙으로 정해 두는 것.

만든 파일: `public/css/style.css`

핵심 개념 몇 가지를 소개합니다.

### (1) CSS 변수로 색 정해두기

```css
:root {
  --bg: #f7f4ef;        /* 페이지 배경색 */
  --primary: #3b6b4e;   /* 초록 포인트 색 */
  --accent: #c99b5a;    /* 금색 포인트 색 */
  --radius: 16px;       /* 카드 모서리 둥글기 */
}
```

한 번 정해 두면 `background: var(--primary);` 처럼 **같은 이름을 계속 재사용**할 수 있습니다.
나중에 색을 바꾸고 싶으면 여기 한 곳만 수정하면 됩니다.

### (2) 공통 버튼 스타일

```css
.btn { padding: 12px 22px; border-radius: 999px; font-weight: 700; }
.btn-primary { background: var(--primary); color: #fff; }
```

HTML에서는 `class="btn btn-primary"` 처럼 조합해서 씁니다.

### (3) 반응형 웹 (PC / 태블릿 / 모바일)

```css
@media (max-width: 900px) { ... }   /* 태블릿 이하에서 적용할 스타일 */
@media (max-width: 600px) { ... }   /* 모바일에서 적용할 스타일 */
```

화면 폭에 따라 칸 수를 바꾸는 방식입니다. 예를 들어 갤러리 그리드는
PC에서 3칸, 태블릿에서 2칸, 모바일에서 1칸으로 줄어듭니다.

## 1-7. 환경 변수 파일 만들기

`.env.example` 파일을 복사해서 `.env` 파일을 만듭니다. (구글/깃허브 로그인을 사용하지 않으면 그대로 두어도 됩니다.)

```bash
cp .env.example .env
```

`.env` 파일 내용 예시:

```
PORT=3000
SESSION_SECRET=내가-정한-긴-비밀문자열
```

> **보안 상식**: `.env`는 비밀 정보를 담으므로 GitHub에 올리지 않아야 합니다.
> 이미 `.gitignore`에 등록되어 있어 안전합니다.

### `.env` 없이도 동작하는 것 / `.env`가 필요한 것

| 구분 | 내용 |
|------|------|
| **`.env` 없이 동작** | 이메일 회원가입·로그인, 갤러리, 리뷰, 좋아요/북마크, AI 디자인 생성, 취향 분석 등 **모든 핵심 기능** |
| **`.env` 필요** | **구글 로그인, 깃허브 로그인** (키가 없으면 버튼을 눌러도 "설정 필요" 안내와 함께 로그인 페이지로 돌아오지만, 나머지 기능은 정상 동작) |

즉, **`.env` 파일을 아예 만들지 않아도 서버는 정상적으로 실행됩니다.**
`.env`는 구글/깃허브 로그인을 켜고 싶을 때와 포트·세션 시크릿을 바꾸고 싶을 때만 필요합니다.

### 구글 로그인 설정 방법 (`.env` 작성 전에 콘솔 작업이 먼저!)

`.env`에 키를 넣는 것만으로는 구글 로그인이 켜지지 않습니다. 아래 순서대로 진행하세요.

1. [Google Cloud Console](https://console.cloud.google.com/) 에 접속
2. 프로젝트 생성 → **OAuth 동의 화면** 설정 → **사용자 인증 정보 > OAuth 클라이언트 ID 만들기**
3. 애플리케이션 유형: **웹 애플리케이션**
4. **승인된 리다이렉트 URI**에 아래 주소를 정확히 등록
   ```
   http://localhost:3000/auth/google/callback
   ```
5. 발급된 **클라이언트 ID**와 **클라이언트 보안 비밀번호**를 `.env`에 입력
   ```
   GOOGLE_CLIENT_ID=클라이언트-ID
   GOOGLE_CLIENT_SECRET=클라이언트-보안-비밀번호
   ```

### 깃허브 로그인 설정 방법

1. [GitHub Developer Settings](https://github.com/settings/developers) → **New OAuth App**
2. **Authorization callback URL**에 아래 주소를 정확히 등록
   ```
   http://localhost:3000/auth/github/callback
   ```
3. 발급된 **Client ID**와 **Client secrets**를 `.env`에 입력
   ```
   GITHUB_CLIENT_ID=클라이언트-ID
   GITHUB_CLIENT_SECRET=클라이언트-보안-비밀번호
   ```

### 콜백 URL이 꼭 일치해야 해요 (자주 하는 실수)

로그인 버튼을 누르면 서버가 `redirect_uri`라는 주소로 구글/깃허브에 "여기로 돌아갈게요"라고 알려줍니다.
**콘솔에 등록한 주소와 이 주소가 똑같아야만** 로그인이 성공합니다.

- 서버가 요청하는 기본 콜백 주소는 서버 주소를 보고 자동으로 만들어집니다.
  예) `http://localhost:3000/auth/google/callback`
- **`PORT`를 바꾸면** 콜백 주소의 포트 번호도 달라지므로, 콘솔에 등록한 주소도 같이 바꿔야 합니다.
  예) `PORT=4000`으로 실행하면 → `http://localhost:4000/auth/google/callback`
- 콘솔 등록 주소가 다르면 로그인 버튼을 눌렀을 때 `redirect_uri mismatch` 같은 오류가 납니다.

> 원한다면 `.env`의 `GOOGLE_CALLBACK_URL` / `GITHUB_CALLBACK_URL`에 콜백 주소를 직접 적어 고정할 수도 있습니다.

### 세션 저장 방식 참고 사항

- 이 프로젝트는 로그인 상태를 **서버 메모리**에 저장합니다(개발용 기본 세션 저장소).
- 따라서 **서버를 재시작하면 로그인이 풀립니다.** 이것은 버그가 아니라 개발 단계의 정상 동작입니다.
- 배포(운영) 시에는 SQLite나 별도 저장소에 세션을 저장하도록 바꾸는 것을 권장합니다.

### 현재 코드 검증 결과

이 프로젝트의 코드로 실제로 확인해 본 결과입니다.

- `.env` 없이 서버 실행 → 이메일 회원가입/로그인, 갤러리, 좋아요/북마크, AI 생성, 분석 모두 정상 동작 확인
- `GOOGLE_CLIENT_ID/SECRET`을 `.env`에 넣고 서버 실행 → `/auth/google` 접속 시
  `accounts.google.com` 로 정상 이동하는 것 확인 (콜백 주소도 자동 생성 확인)
- `GITHUB_CLIENT_ID/SECRET`을 `.env`에 넣고 서버 실행 → `/auth/github` 접속 시
  `github.com/login/oauth/authorize` 로 정상 이동하는 것 확인

즉 **`.env` 입력 + 콘솔에 콜백 URL 등록, 이 2가지가 맞으면 구글/깃허브 로그인까지 전부 동작**합니다.

## 1-8. 서버를 띄워 보기 (가장 먼저 해보는 테스트)

`server.js` 파일을 만들고 가장 기본적인 서버를 실행합니다.

```javascript
// server.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('RoomAuto 서버가 열렸어요!');
});

app.listen(PORT, () => {
  console.log(`RoomAuto 서버가 실행됐어요! http://localhost:${PORT}`);
});
```

**실행 및 확인 방법**

```bash
node server.js
```

- 터미널에 `RoomAuto 서버가 실행됐어요!` 가 보이면 성공.
- 브라우저에서 `http://localhost:3000` 을 열면 문구가 보입니다.
- `Ctrl + C` 를 누르면 서버가 멈춥니다.

## 1-9. 프로젝트 실행·종료 방법 (최종 정리)

프로젝트 전체를 완성한 뒤에는 아래 순서대로 실행하면 됩니다.

### (1) 처음 한 번만 - 의존성 설치

```bash
npm install
```

> 패키지가 이미 설치된 폴더(`node_modules`가 존재)에서는 이 명령을 건너뛰어도 됩니다.

### (2) 서버 실행

```bash
node server.js
```

- 터미널에 `RoomAuto 서버가 실행됐어요! http://localhost:3000` 이 보이면 성공.
- 브라우저에서 `http://localhost:3000` 을 열면 메인 페이지가 보입니다.

### (3) 서버 종료

```bash
Ctrl + C
```

- `Ctrl` 키와 `C` 키를 함께 누르면 서버가 멈춥니다.
- 종료된 뒤에도 서버가 계속 살아 있으면, 포트를 점유하고 있는 다른 프로세스가 있는지 확인하세요.
  (같은 포트에서 서버를 여러 번 띄우면 `EADDRINUSE` 오류가 납니다)

### (4) 재시작

```bash
# 먼저 종료
Ctrl + C

# 다시 실행
node server.js
```

### (5) 빠른 체험 - 데모 계정

별도 회원가입 없이 바로 기능을 체험하고 싶다면 로그인 페이지에서 아래 계정을 쓰세요.

- 이메일: `demo@roomauto.com`
- 비밀번호: `1234`

### (6) 데이터를 처음 상태로 되돌리기 (선택)

학습하다가 데이터가 지저분해졌다면 DB를 초기화할 수 있습니다.

```bash
node db.js
```

> DB 파일(`data/roomauto.db`)을 지운 뒤 `node db.js`를 실행하면 예시 데이터가 새로 들어옵니다.
> 이 프로젝트는 학습용이므로 가능한 방법입니다.

### (7) 실행 전 체크리스트

- [ ] `node_modules` 폴더가 있다 (없으면 `npm install`)
- [ ] `.env` 파일이 있다 (없어도 실행은 되지만, 구글/깃허브 로그인을 쓰려면 필요)
- [ ] 포트 3000이 비어 있다 (다른 프로그램이 안 쓰고 있는지)
- [ ] `http://localhost:3000` 이 열리는지 확인

---

# 2. 전체 작업 계획(순서)

초보자가 이해하기 좋도록 **백엔드(데이터) → 프론트엔드(화면)** 순서로 진행합니다.

| 단계 | 작업 | 결과물 | 요점 |
|------|------|--------|------|
| 1 | 데이터베이스 만들기 | `db.js` | SQLite 테이블 설계, 예시 데이터 |
| 2 | 로그인/회원가입 API | `routes/auth.js`, `routes/helpers.js` | 세션, 비밀번호 암호화, 구글/깃허브 로그인 |
| 3 | AI 이미지 생성 API | `routes/ai.js` | 파일 업로드, pollinations.ai 호출 |
| 4 | 갤러리/리뷰/분석 API | `routes/content.js` | 조회, 좋아요/북마크, 집계 |
| 5 | 마이 페이지 API | `routes/user.js` | 정보 수정, 비밀번호 변경, 탈퇴 |
| 6 | 서버 연결 | `server.js` | 모든 라우터 연결, 정적 파일 제공 |
| 7 | 공통 화면 요소 | `style.css`, `common.js` | 하이드 온 스크롤 내비, 로그인 상태 표시 |
| 8 | 메인 페이지 | `index.html`, `home.css`, `main.js` | 히어로 영상, 비포&애프터, 무한 슬라이더, 스티키 리뷰 |
| 9 | AI 디자인 페이지 | `design.html`, `design.css`, `design.js` | 업로드, 프롬프트, 필터 칩, 3D 회전 |
| 10 | 취향 분석 페이지 | `analysis.html`, `analysis.css`, `analysis.js` | 요청 데이터를 막대 그래프로 표현 |
| 11 | 갤러리·리뷰 페이지 | `gallery*.html`, `reviews*.html` | 목록/상세, 빵 부스러기, 좋아요/북마크 |
| 12 | 로그인·회원가입 페이지 | `login.html`, `register.html`, `auth.js` | 폼 검증, 소셜 로그인 버튼 |
| 13 | 마이 페이지 | `mypage.html`, `mypage.css`, `mypage.js` | 프로필, 좋아요/북마크, 설정 |
| 14 | 전체 테스트와 마무리 | 전체 | API 테스트, 화면 점검, 문서 정리 |

---

# 3. 단계별 작업 진행 내용 & 완료 확인 방법

각 단계마다 **무엇을 만들었는지**와 **제대로 됐는지 확인하는 방법**을 정리했습니다.

---

## 단계 1. 데이터베이스 만들기 (`db.js`)

### 목표
SQLite 데이터베이스 파일을 만들고, 서비스에 필요한 **테이블 8개**를 만들고, 처음 실행할 때 **예시 데이터(Seed)** 를 넣습니다.

### 핵심 개념
- **테이블(Table)**: 데이터를 담는 엑셀 시트 같은 것. 세로줄(열)에 항목을 정해 둡니다.
- **SQL**: 데이터베이스에게 명령을 내리는 언어. 예: `CREATE TABLE`, `INSERT INTO`, `SELECT`.
- **기본키(PK)**: 각 행을 구별하는 번호. `id` 열이 대표적입니다.
- **외래키(FK)**: 다른 테이블을 가리키는 번호. 예: `ai_requests.user_id`는 `users.id`를 가리킵니다.
- **좋아요/북마크 복합 기본키**: 같은 사람이 같은 게시물을 두 번 누르지 못하도록 `(user_id, image_id)` 둘을 묶어서 키로 씁니다.

### 만든 테이블

| 테이블 | 저장하는 것 |
|--------|-------------|
| `users` | 회원 정보 (이메일, 암호화된 비밀번호, 닉네임, 로그인 방식) |
| `ai_requests` | AI 디자인 요청 기록 (공간, 스타일, 원본/결과 이미지) - **분석의 원본** |
| `gallery_images` | 갤러리 예시 이미지 |
| `image_likes` / `image_bookmarks` | 갤러리 좋아요 / 북마크 |
| `reviews` | 사용자 리뷰 |
| `review_likes` / `review_bookmarks` | 리뷰 좋아요 / 북마크 |

### 주요 코드와 설명

**테이블 만들기** - `db.js` 안의 `CREATE TABLE IF NOT EXISTS` 구문입니다.

```sql
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT UNIQUE,
  password_hash TEXT,
  nickname      TEXT NOT NULL,
  provider      TEXT DEFAULT 'local',
  provider_id   TEXT,
  avatar        TEXT,
  created_at    TEXT DEFAULT (datetime('now','localtime'))
);
```

- `PRIMARY KEY AUTOINCREMENT`: 번호를 자동으로 1씩 올려가며 붙여줍니다.
- `UNIQUE`: 같은 이메일로 가입을 막아줍니다.
- `DEFAULT`: 값을 안 넣으면 자동으로 들어가는 기본값입니다.

**예시 데이터 넣기** - 처음 실행할 때만 동작하는 `seed()` 함수입니다.

```javascript
function seed() {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (userCount > 0) return;  // 이미 데이터가 있으면 건너뜀
  // ... 예시 회원, 갤러리 6장, 리뷰 4개를 INSERT
}
```

예시 회원: `demo@roomauto.com` / 비밀번호 `1234` (비밀번호는 bcrypt로 암호화해 저장합니다).

### 완료 확인 방법

```bash
node db.js
```

- 터미널에 `예시 데이터(Seed)를 넣었습니다.` 라고 나오면 성공.
- `data/roomauto.db` 파일이 생겼는지 확인.
- 갤러리 예시 이미지 6장이 `public/images/seed/` 폴더에 생겼는지 확인.

```bash
ls data public/images/seed
```

---

## 단계 2. 로그인/회원가입 API (`routes/auth.js`, `routes/helpers.js`)

### 목표
이메일 회원가입/로그인/로그아웃과 **구글·깃허브 로그인**을 만듭니다.

### 핵심 개념
- **세션(Session)**: 로그인 상태를 서버가 기억하는 것. 쿠키에 세션 번호를 담아 둡니다. 로그아웃 전까지 유지됩니다.
- **비밀번호 암호화(bcrypt)**: 원래 비밀번호를 그대로 저장하지 않고, 복원이 어려운 "해시" 형태로 저장합니다. DB가 유출되어도 비밀번호가 그대로 노출되지 않게 하는 안전 장치입니다.
- **OAuth**: 구글/깃허브 계정으로 로그인하는 방식. 비밀번호 대신 구글/깃허브가 확인해 주는 방식입니다.
- **미들웨어**: 요청이 도착했을 때 처리 전에 "중간에서 검문"하는 함수. `requireAuth`가 대표적입니다.

### 만든 API

| 메서드 | 주소 | 동작 |
|--------|------|------|
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/login` | 이메일 로그인 |
| POST | `/api/auth/logout` | 로그아웃 |
| GET | `/api/auth/me` | 지금 로그인한 회원 정보 확인 |
| GET | `/auth/google` | 구글 로그인 시작 |
| GET | `/auth/google/callback` | 구글 로그인 후 돌아오는 곳 |
| GET | `/auth/github` | 깃허브 로그인 시작 |
| GET | `/auth/github/callback` | 깃허브 로그인 후 돌아오는 곳 |

### 주요 코드와 설명

**로그인 확인 미들웨어** - `routes/helpers.js`

```javascript
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: '로그인이 필요한 기능이에요.' });
  }
  next();
}
```

- `req.user`가 없으면(로그인 안 함) 401 에러를 돌려주고,
- 있으면 `next()` 로 다음 단계를 진행합니다.

**회원가입** - 비밀번호를 암호화해서 저장합니다.

```javascript
const hash = bcrypt.hashSync(password, 10);   // 암호화
db.prepare('INSERT INTO users (email, password_hash, nickname, provider) VALUES (?, ?, ?, ?)')
  .run(email, hash, nickname, 'local');
```

> `?` 를 쓰는 이유: 사용자가 입력한 값을 SQL 문장에 그대로 넣으면 **SQL 인젝션** 공격을 받을 수 있습니다.
> `?` 자리에 값을 바꿔 넣는 방식(better-sqlite3의 `run(값)`)은 공격을 자동으로 막아 줍니다.

**로그인** - passport를 이용합니다.

```javascript
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  (email, password, done) => {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim());
    if (!user) return done(null, false, { message: '이메일 또는 비밀번호가 틀렸어요.' });
    if (!bcrypt.compareSync(password, user.password_hash)) {
      return done(null, false, { message: '이메일 또는 비밀번호가 틀렸어요.' });
    }
    return done(null, user);
  }
));
```

- `compareSync`는 입력한 비밀번호와 저장된 해시가 같은지 확인합니다.
- 성공하면 `req.login(user, ...)` 으로 세션을 만들어 줍니다.

**깃허브 로그인 특별 처리**

깃허브는 사용자가 이메일을 공개하지 않았으면 이메일을 안 알려줍니다. 그래서 이메일 대신 깃허브 아이디로 가상 이메일을 만들어 줍니다.

```javascript
const email = (profile.emails && profile.emails[0])
  ? profile.emails[0].value
  : `${profile.username || profile.id}@github.local`;  // 이메일이 없으면 대체
```

**소셜 로그인 설정 안내**
- 구글/깃허브 앱을 만들지 않으면 `.env`에 값이 없으므로, 페이지의 로그인 버튼을 눌러도 "설정 필요" 안내와 함께 로그인 페이지로 돌아옵니다.
- 설정 방법은 `.env.example` 파일과 `routes/auth.js` 주석에 자세히 적어 두었습니다.

### 완료 확인 방법

서버를 실행한 뒤 터미널에서 API를 직접 호출해 봅니다.

```bash
node server.js
```

다른 터미널에서:

```bash
# 회원가입
curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"1234","nickname":"테스터"}'
```

- `{"user":{"email":"test@test.com", ...}}` 가 돌아오면 성공.

```bash
# 로그인 (쿠키를 /tmp/cookie.txt에 저장)
curl -c /tmp/cookie.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"1234"}'
```

- 잘못된 비밀번호로 시도하면 `이메일 또는 비밀번호가 틀렸어요.` 에러가 나야 합니다.

```bash
# 로그인 상태 확인
curl -b /tmp/cookie.txt http://localhost:3000/api/auth/me
```

- 로그인한 회원 정보가 나오면 성공.

---

## 단계 3. AI 이미지 생성 API (`routes/ai.js`)

### 목표
1. **빈 방 꾸미기(decor)**: 빈 방 사진 + 문장 → 가구가 채워진 인테리어 이미지
2. **평면도 3D 변환(floorplan)**: 평면도 + 문장 → 입체 느낌 이미지

두 기능 모두 **pollinations.ai** 라는 무료 AI 이미지 서비스를 사용합니다.

### 핵심 개념
- **멀터(Multer)**: 업로드된 파일을 서버 폴더에 저장해 주는 도구. `uploads/` 폴더에 저장합니다.
- **파일 크기 제한**: 사용자가 큰 파일을 올려 서버에 부담을 주지 않도록 **최대 10MB**로 제한합니다.
- **fetch**: 서버(노드)에서 다른 서버로 요청을 보내는 JavaScript 함수.
- **AbortController**: 요청이 너무 오래 걸리면(120초) 강제로 멈추게 하는 안전장치.

### 만든 API

| 메서드 | 주소 | 동작 |
|--------|------|------|
| POST | `/api/ai/decor` | 빈 방 이미지 + 문장 → 인테리어 이미지 |
| POST | `/api/ai/floorplan` | 평면도 + 문장 → 3D 이미지 |

### 주요 코드와 설명

**이미지 업로드 설정**

```javascript
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },   // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('이미지 파일만 업로드할 수 있어요.'));
  },
});
```

**pollinations.ai 호출 함수**

```javascript
async function generateImage(basePrompt, width, height, type) {
  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(basePrompt)}` +
    `?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true&enhance=true`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
  const res = await fetch(url, { signal: controller.signal });
  clearTimeout(timer);

  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(파일경로, buf);   // 받은 이미지를 서버에 저장
  return '/generated/파일이름.jpg';
}
```

- URL에 문장을 넣어 보내면 AI가 이미지를 만들어 줍니다(보통 20~60초 소요).
- 받은 이미지는 `public/generated/` 폴더에 저장하고, 브라우저에서 `/generated/...` 주소로 접근할 수 있게 합니다.

**빈 방 꾸미기 처리**

```javascript
router.post('/ai/decor', requireAuth, upload.single('image'), async (req, res) => {
  const prompt = (req.body.prompt || '').trim();
  const aiPrompt = `${prompt}. 빈 방(공실)을 가구와 인테리어 소품으로 완성한 사진으로 바꿔주세요. ...`;
  const outputImage = await generateImage(aiPrompt, 1024, 1024, 'decor');

  // 데이터 분석에 쓰이도록 요청 기록 저장!
  db.prepare(`INSERT INTO ai_requests (user_id, type, room, style, prompt, input_image, output_image)
              VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(req.user.id, 'decor', room, style, prompt, inputImage, outputImage);

  res.json({ outputImage, inputImage, room, style });
});
```

**문장에서 공간/스타일 찾아내기**

분석을 위해 입력 문장에서 "원룸, 침실..." 이나 "미니멀, 북유럽..." 같은 단어를 찾아 기록합니다.

```javascript
const ROOMS = ['원룸', '침실', '거실', '주방', '서재', '드레스룸', '욕실', '베란다'];
const STYLES = ['미니멀', '모던', '북유럽', '빈티지', '내추럴', '파스텔', '클래식', '인더스트리얼'];

function findKeyword(text, list) {
  for (const word of list) {
    if (text.includes(word)) return word;
  }
  return null;
}
```

### 완료 확인 방법

이미지 하나를 준비한 뒤(여기서는 예시 이미지 사용) 호출해 봅니다.

```bash
# 데모 계정으로 로그인해서 쿠키 저장
curl -c /tmp/cookie.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@roomauto.com","password":"1234"}'

# 빈 방 꾸미기 요청 (예시 이미지 사용)
curl -b /tmp/cookie.txt -X POST http://localhost:3000/api/ai/decor \
  -F "image=@public/images/seed/gal_1.svg" \
  -F "prompt=7평 원룸, 미니멀 스타일"
```

- 30~60초 뒤 `{"outputImage":"/generated/decor_....jpg","room":"원룸","style":"미니멀"}` 처럼 돌아오면 성공.
- `ls public/generated` 로 생성된 이미지 확인.
- `curl http://localhost:3000/api/analysis` 를 호출하면 방금 기록이 반영됩니다.

> **참고**: pollinations.ai 서버 상태에 따라 요청이 실패할 수 있습니다. 그럴 때는 서버가
> "AI 생성 서버가 잠시 혼잡해요. 잠시 후 다시 시도해 주세요." 라는 친절한 에러를 돌려줍니다.

---

## 단계 4. 갤러리/리뷰/분석 API (`routes/content.js`)

### 목표
갤러리·리뷰 목록과 상세 조회, 좋아요/북마크 토글, 그리고 취향 분석용 집계 API를 만듭니다.

### 핵심 개념
- **토글(Toggle)**: 누르면 켜지고 다시 누르면 꺼지는 스위치처럼, 좋아요/북마크를 "있다 ↔ 없다"로 바꿉니다.
- **JOIN**: 두 테이블을 연결해서 한 번에 조회하는 SQL 기능. "내가 좋아요한 이미지"를 찾을 때 사용합니다.
- **GROUP BY**: 같은 값끼리 묶어서 개수를 세는 SQL 기능. 분석 그래프의 기본이 됩니다.
- **쿼리스트링**: 주소 뒤 `?room=원룸&style=미니멀` 처럼 붙는 조건값.

### 만든 API

| 메서드 | 주소 | 동작 |
|--------|------|------|
| GET | `/api/gallery` | 갤러리 목록 (필터/검색 가능) |
| GET | `/api/gallery/:id` | 갤러리 상세 1개 |
| GET | `/api/reviews` | 리뷰 목록 |
| GET | `/api/reviews/:id` | 리뷰 상세 1개 |
| POST | `/api/images/:id/toggle` | 갤러리 좋아요/북마크 토글 (로그인 필요) |
| POST | `/api/reviews/:id/toggle` | 리뷰 좋아요/북마크 토글 (로그인 필요) |
| GET | `/api/analysis` | 취향 분석 집계 |

### 주요 코드와 설명

**목록에 좋아요 수와 내 상태 붙이기**

목록 API가 돌려주는 각 항목에 `like_count`, `my_like` 같은 정보를 붙여줍니다.

```javascript
function withMyState(rows, userId, likeTable, bookmarkTable, idCol) {
  return rows.map((row) => {
    const likeCnt = db.prepare(`SELECT COUNT(*) AS c FROM ${likeTable} WHERE ${idCol} = ?`).get(row.id).c;
    const myLike = userId
      ? db.prepare(`SELECT 1 AS x FROM ${likeTable} WHERE ${idCol} = ? AND user_id = ?`).get(row.id, userId)
      : null;
    return { ...row, like_count: likeCnt, my_like: !!myLike, ... };
  });
}
```

**토글 기능**

```javascript
const exists = db.prepare(`SELECT 1 AS x FROM ${table} WHERE ${idCol} = ? AND user_id = ?`).get(id, req.user.id);
if (exists) {
  db.prepare(`DELETE FROM ${table} WHERE ${idCol} = ? AND user_id = ?`).run(id, req.user.id);
} else {
  db.prepare(`INSERT INTO ${table} (${idCol}, user_id) VALUES (?, ?)`).run(id, req.user.id);
}
```

**취향 분석 집계**

```javascript
router.get('/analysis', (req, res) => {
  const rooms = db.prepare(
    `SELECT room AS label, COUNT(*) AS count FROM ai_requests GROUP BY room ORDER BY count DESC`
  ).all();
  const styles = db.prepare(
    `SELECT style AS label, COUNT(*) AS count FROM ai_requests GROUP BY style ORDER BY count DESC`
  ).all();
  res.json({ total, rooms, styles, types });
});
```

### 완료 확인 방법

```bash
# 목록 조회
curl http://localhost:3000/api/gallery
curl http://localhost:3000/api/gallery?room=원룸
curl http://localhost:3000/api/reviews

# 로그인 후 좋아요 토글
curl -b /tmp/cookie.txt -X POST http://localhost:3000/api/images/1/toggle \
  -H 'Content-Type: application/json' -d '{"action":"like"}'

# 다시 누르면 취소
curl -b /tmp/cookie.txt -X POST http://localhost:3000/api/images/1/toggle \
  -H 'Content-Type: application/json' -d '{"action":"like"}'

# 분석 데이터
curl http://localhost:3000/api/analysis
```

- 첫 토글 응답이 `{"active":true,"count":1}`, 두 번째가 `{"active":false,"count":0}` 이면 성공.
- 분석 응답에 `rooms`, `styles` 배열이 나오면 성공.

---

## 단계 5. 마이 페이지 API (`routes/user.js`)

### 목표
내 정보 보기/수정, 비밀번호 변경, 회원 탈퇴, 그리고 내가 좋아요/북마크한 목록 조회를 만듭니다.

### 핵심 개념
- 이 라우터 전체에 `router.use(requireAuth)` 를 적용해서 **모든 API가 로그인을 요구**하게 합니다.
- 비밀번호 변경/탈퇴 시에는 **현재 비밀번호를 한 번 더 확인**해서 안전하게 처리합니다.

### 만든 API

| 메서드 | 주소 | 동작 |
|--------|------|------|
| GET | `/api/user/me` | 내 정보 |
| PUT | `/api/user/me` | 닉네임/이메일 수정 |
| PUT | `/api/user/me/password` | 비밀번호 변경 |
| DELETE | `/api/user/me` | 회원 탈퇴 |
| GET | `/api/user/me/likes` | 내가 좋아요한 이미지/리뷰 |
| GET | `/api/user/me/bookmarks` | 내가 북마크한 이미지/리뷰 |

### 주요 코드와 설명

**내가 좋아요한 이미지 찾기 (JOIN 사용)**

```javascript
const images = db.prepare(
  `SELECT g.*, 'image' AS kind FROM gallery_images g
   JOIN image_likes l ON l.image_id = g.id
   WHERE l.user_id = ? ORDER BY l.created_at DESC`
).all(req.user.id);
```

`JOIN`으로 "내 좋아요 기록"과 "갤러리 이미지"를 연결해서 한 번에 조회합니다.

**비밀번호 변경**

```javascript
if (!req.user.password_hash || !bcrypt.compareSync(current, req.user.password_hash)) {
  return res.status(400).json({ error: '현재 비밀번호가 틀렸어요.' });
}
db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
  .run(bcrypt.hashSync(next, 10), req.user.id);
```

**회원 탈퇴**

```javascript
router.delete('/me', (req, res) => {
  if (req.user.password_hash) {
    if (!password || !bcrypt.compareSync(password, req.user.password_hash)) {
      return res.status(400).json({ error: '비밀번호가 틀렸어요.' });
    }
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
  req.logout(() => res.json({ ok: true }));
});
```

- 소셜 로그인 회원은 비밀번호가 없으므로(해시가 null) 비밀번호 없이 탈퇴 가능하게 처리했습니다.

### 완료 확인 방법

```bash
# 내 정보 수정
curl -b /tmp/cookie.txt -X PUT http://localhost:3000/api/user/me \
  -H 'Content-Type: application/json' -d '{"nickname":"새닉네임"}'

# 비밀번호 변경
curl -b /tmp/cookie.txt -X PUT http://localhost:3000/api/user/me/password \
  -H 'Content-Type: application/json' -d '{"current":"1234","next":"5678"}'

# 틀린 현재 비밀번호로 시도하면 에러가 나야 함
curl -b /tmp/cookie.txt -X PUT http://localhost:3000/api/user/me/password \
  -H 'Content-Type: application/json' -d '{"current":"9999","next":"5678"}'

# 내 좋아요 목록
curl -b /tmp/cookie.txt http://localhost:3000/api/user/me/likes
```

- 틀린 비밀번호 시도 시 `현재 비밀번호가 틀렸어요.` 에러가 나면 성공.
- 좋아요/북마크 목록에 방금 누른 항목이 보이면 성공.

---

## 단계 6. 서버 연결 (`server.js`)

### 목표
지금까지 만든 모든 라우터를 하나의 서버에 연결하고, `public/` 폴더의 화면 파일들을 제공합니다.

### 핵심 코드와 설명

```javascript
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');

require('./db');   // 데이터베이스 연결 + 테이블 생성

const app = express();

app.use(express.json());                      // JSON 요청을 읽음
app.use(express.urlencoded({ extended: true }));  // 폼 요청을 읽음

// 세션(로그인 상태) 관리
app.use(session({
  secret: process.env.SESSION_SECRET || 'roomauto-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 },   // 7일
}));

app.use(passport.initialize());
app.use(passport.session());

// 정적 파일 제공 (public 폴더)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API 라우터 연결
// (auth 라우터는 루트에 연결 - /api/auth/* (회원가입 등)과 /auth/* (소셜 로그인) 둘 다 사용)
app.use(require('./routes/auth'));
app.use('/api', require('./routes/ai'));
app.use('/api', require('./routes/content'));
app.use('/api/user', require('./routes/user'));
```

### 완료 확인 방법

```bash
node server.js
```

- 터미널에 서버 실행 메시지가 나오고,
- 브라우저에서 `http://localhost:3000/` 을 열면 (아직 화면이 없으면) 기본 화면이 보이면 성공.

---

## 단계 7. 공통 화면 요소 (`style.css`, `common.js`)

### 목표
모든 페이지가 공유하는 디자인 시스템과 공통 자바스크립트를 만듭니다.

### 핵심 개념
- **하이드 온 스크롤(Hide on Scroll)**: 아래로 스크롤하면 내비게이션 바가 숨고, 위로 스크롤하면 다시 나타납니다.
- **fetch**: 브라우저가 서버 API에 요청을 보내는 함수.
- **IntersectionObserver**: 요소가 화면에 보이는 순간을 감지하는 기능(스크롤 애니메이션에 사용).
- **템플릿 리터럴**: 백틱(`)과 `${변수}`로 HTML을 조합해 만드는 방식.

### 공통 내비게이션 (하이드 온 스크롤)

**HTML** (모든 페이지에 동일하게 들어감)

```html
<nav class="navbar">
  <div class="nav-inner">
    <a href="index.html" class="logo">...</a>
    <ul class="nav-links">
      <li><a href="index.html">홈</a></li>
      <li><a href="design.html">AI 디자인</a></li>
      ...
    </ul>
    <div class="nav-right"><!-- 로그인/로그아웃 버튼이 JS로 채워짐 --></div>
    <button class="nav-toggle">☰</button>
  </div>
</nav>
```

**CSS** - 숨김 효과의 핵심입니다.

```css
.navbar { position: fixed; transition: transform 0.35s ease; }
.navbar.hide { transform: translateY(-100%); }   /* 위로 사라짐 */
```

**JavaScript** - 스크롤 방향에 따라 `.hide` 클래스를 붙였다 뗐다 합니다.

```javascript
let lastY = window.scrollY;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (y > lastY && y > 120) navbar.classList.add('hide');    // 아래로 스크롤 → 숨김
  else navbar.classList.remove('hide');                       // 위로 스크롤 → 보임
  lastY = y;
});
```

### 공통 API 호출 도우미

모든 페이지에서 서버와 통신할 때 쓰는 함수입니다. `common.js`에 있습니다.

```javascript
async function api(path, options = {}) {
  const res = await fetch('/api' + path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || '요청에 실패했어요.');
  return data;
}
```

### 로그인 상태에 따라 버튼 바꾸기

페이지가 열릴 때 `/api/auth/me`로 로그인 여부를 확인해서, 로그인했으면 프로필+로그아웃 버튼을, 아니면 로그인/회원가입 버튼을 보여줍니다.

```javascript
async function initAuthNav() {
  const { user } = await api('/auth/me');
  if (user) {
    navRight.innerHTML = `프로필 버튼 + 로그아웃 버튼`;
  } else {
    navRight.innerHTML = `로그인 버튼 + 회원가입 버튼`;
  }
}
```

### 완료 확인 방법

- 모든 페이지의 상단에 같은 내비게이션 바가 보이고,
- 아래로 스크롤하면 숨고 위로 스크롤하면 다시 나타나는지 확인.
- 로그인하기 전에는 "로그인/회원가입" 버튼, 로그인 후에는 "닉네임 + 로그아웃" 버튼이 보이면 성공.

---

## 단계 8. 메인 페이지 (`index.html`, `home.css`, `main.js`)

### 목표
메인 페이지의 아래 기능을 모두 구현합니다.

1. **히어로 영상**: 인테리어 영상이 반복 재생
2. **비포&애프터 슬라이더**: 예시 이미지를 손잡이로 좌우 비교
3. **갤러리 무한 슬라이더**: 이미지가 왼쪽으로 계속 흐름
4. **스티키 리뷰**: 스크롤하면 리뷰가 겹쳐 올라옴
5. **디자인 시작 버튼**: AI 디자인 페이지로 이동

### 핵심 개념
- **position: fixed** - 뷰포트 기준으로 고정(내비게이션, 히어로 배경).
- **clip-path** - 이미지 일부만 보이게 잘라내는 CSS (비포&애프터 비교에 사용).
- **CSS 애니메이션** - `@keyframes`로 반복 동작을 만듦.
- **position: sticky** - 스크롤하다가 지정한 위치에 도달하면 멈추는 CSS (리뷰 겹치기).

### (1) 히어로 섹션 - 짧은 영상 반복

```html
<header class="hero">
  <video autoplay muted loop playsinline poster="/images/hero-poster.svg">
    <source src="동영상주소.mp4" type="video/mp4">
  </video>
  <div class="hero-content">
    <h1>RoomAuto</h1>
    <a href="design.html" class="btn btn-accent btn-lg">디자인 시작하기</a>
  </div>
</header>
```

- `autoplay` 자동 재생, `muted` 음소거(자동 재생 조건), `loop` 반복 → 영상이 계속 반복됩니다.
- 영상이 로딩되지 않는 환경을 위해 포스터 이미지가 천천히 확대되는(켄번즈) 효과도 넣었습니다.

```css
.hero { position: relative; height: 100vh; }
.hero video { position: absolute; inset: 0; object-fit: cover; }
```

> `height: 100vh`는 화면 높이만큼, `object-fit: cover`는 화면을 빈틈없이 채우라는 뜻입니다.
> 실제 서비스에서는 내부 동영상 폴더에 영상을 넣고 주소만 바꾸면 됩니다.

### (2) 비포 & 애프터 슬라이더

```html
<div class="ba-wrap" id="beforeAfter">
  <div class="ba-img ba-after"><img src="after.svg"><span class="ba-label after">AFTER</span></div>
  <div class="ba-img ba-before"><img src="before.svg"><span class="ba-label before">BEFORE</span></div>
  <div class="ba-divider"><div class="ba-handle">⇄</div></div>
</div>
```

- 두 장의 이미지를 겹쳐 놓고, `clip-path`로 손잡이 위치에서 갈라지게 합니다.

```css
.ba-after  { clip-path: inset(0 calc(100% - var(--pos, 50%)) 0 0); }  /* 왼쪽만 보임 */
.ba-before { clip-path: inset(0 0 0 var(--pos, 50%)); }               /* 오른쪽만 보임 */
```

- 마우스를 누르고 움직이면 `--pos` 값을 바꿔서 이미지가 갈라지는 위치가 이동합니다.

```javascript
wrap.addEventListener('pointermove', (e) => {
  if (e.buttons === 1) {
    pos = ((e.clientX - rect.left) / rect.width) * 100;
    wrap.style.setProperty('--pos', pos + '%');
  }
});
```

### (3) 갤러리 무한 슬라이더 (Infinite Slider)

이미지를 **2번 이어 붙이고**, 그 줄을 50%만큼 왼쪽으로 옮기는 애니메이션을 반복하면
마치 무한히 흐르는 것처럼 보입니다.

```javascript
track.innerHTML = buildCards(images) + buildCards(images);   // 2번 붙이기
```

```css
.marquee-track { width: max-content; animation: marquee 40s linear infinite; }
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }   /* 정확히 한 벌만큼 이동 */
}
.marquee:hover .marquee-track { animation-play-state: paused; }  /* 마우스 올리면 멈춤 */
```

### (4) 스티키 리뷰

각 리뷰 카드에 `position: sticky`와 서로 다른 `top` 값을 주면,
스크롤할 때 카드가 아래에서 올라와 차례로 겹칩니다.

```css
.sticky-card { position: sticky; }
.sticky-card:nth-child(1) { top: 84px; }
.sticky-card:nth-child(2) { top: 120px; }
.sticky-card:nth-child(3) { top: 156px; }
.sticky-card:nth-child(4) { top: 192px; }
```

### 완료 확인 방법

브라우저에서 `http://localhost:3000/` 을 열고 다음을 확인합니다.

- 히어로 영상이 반복 재생된다.
- 아래로 스크롤하면 내비게이션이 숨고, 위로 스크롤하면 다시 나타난다.
- 비포&애프터 손잡이를 좌우로 움직이면 이미지가 갈라진다.
- 갤러리 이미지가 좌측으로 자동 슬라이드되고, 마우스를 올리면 멈춘다.
- 리뷰 부분을 스크롤하면 카드가 겹쳐 올라온다.
- "디자인 시작하기" 버튼을 누르면 `design.html`로 이동한다.

---

## 단계 9. AI 디자인 페이지 (`design.html`, `design.css`, `design.js`)

### 목표
사용자가 이미지(최대 10MB)와 문장을 입력하면, 로딩 화면("AI가 분석 중이에요...")을 거쳐 결과를 보여주고,
평면도 결과는 마우스로 회전할 수 있는 3D 이미지로 표시합니다.

### 핵심 개념
- **FormData**: 이미지 파일과 문장을 함께 서버로 보낼 때 사용하는 형식.
- **FileReader**: 선택한 이미지를 화면에 미리보기로 띄우는 브라우저 기능.
- **placeholder**: 입력창에 회색으로 보이는 예시 문장.
- **필터 칩**: 막막한 초보자를 위해 "원룸, 미니멀" 같은 예시 단어를 눌러 입력창에 채우게 해주는 버튼.
- **3D 회전(CSS transform)**: `perspective` + `rotateX/rotateY`로 이미지를 입체로 돌리는 효과.

### 페이지 구성

```
┌──────────────────────────┬──────────────────────────┐
│ 1. 빈 방 사진 올리기        │ 3. 결과 확인              │
│    [업로드 영역]            │   (비어 있음 / 로딩 / 결과) │
│ 2. 원하는 분위기 적기        │                          │
│    [입력창 + 필터 칩]        │                          │
│ [AI 디자인 생성하기]         │                          │
└──────────────────────────┴──────────────────────────┘
```

### 주요 코드와 설명

**업로드 미리보기**

```javascript
function handleFile(file) {
  if (!file.type.startsWith('image/')) { ... }   // 이미지인지 확인
  if (file.size > 10 * 1024 * 1024) { ... }      // 10MB 확인
  const reader = new FileReader();
  reader.onload = (e) => { previewImg.src = e.target.result; };
  reader.readAsDataURL(file);
}
```

**필터 칩으로 입력창 채우기**

```javascript
chip.addEventListener('click', () => {
  if (chip.classList.contains('selected')) {
    // 선택 해제 → 입력창에서 그 단어 빼기
  } else {
    // 선택 → 입력창에 단어 추가
  }
});
```

**생성 요청과 로딩 화면**

```javascript
setLoading(true);   // 버튼 비활성화 + "AI가 분석 중이에요..." 표시
try {
  const form = new FormData();
  form.append('image', selectedFile);
  form.append('prompt', prompt);
  const result = await api('/ai/decor', { method: 'POST', body: form });
  renderDecorResult(result, prompt);
} finally {
  setLoading(false);
}
```

**빈 방 꾸미기 결과** - 내가 올린 방(BEFORE)과 AI 추천(AFTER)을 나란히 보여줍니다.

**평면도 3D 결과** - 마우스 드래그로 회전합니다.

```javascript
scene.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  ry += (e.clientX - lastX) * 0.6;   // 좌우 움직임
  rx -= (e.clientY - lastY) * 0.6;   // 위아래 움직임
  box.style.setProperty('--rx', rx + 'deg');
  box.style.setProperty('--ry', ry + 'deg');
});
```

```css
.rotate3d-scene { perspective: 1200px; }                 /* 입체 원근감 */
.rotate3d { transform: rotateX(var(--rx)) rotateY(var(--ry)); transform-style: preserve-3d; }
```

### 완료 확인 방법

`http://localhost:3000/design.html` 을 열고 (로그인 후):

1. 이미지를 업로드하면 미리보기가 표시된다.
2. 필터 칩("원룸", "미니멀")을 누르면 입력창에 문장이 조합된다.
3. 10MB가 넘는 파일을 올리면 에러 메시지가 보인다.
4. "AI 디자인 생성하기"를 누르면 로딩 화면("AI가 분석 중이에요...")이 나온다.
5. 완료되면 BEFORE/AFTER 이미지가 나란히 표시된다.
6. "평면도 3D 변환" 탭에서 결과 이미지를 마우스로 드래그하면 회전된다.

> 참고: AI 이미지 생성은 수십 초 걸릴 수 있고, pollinations.ai 서버 상황에 따라 실패할 수도 있습니다.
> 로그인하지 않으면 "로그인이 필요해요" 안내 후 로그인 페이지로 이동합니다.

---

## 단계 10. 취향 분석 페이지 (`analysis.html`, `analysis.css`, `analysis.js`)

### 목표
AI 디자인 요청 기록(`ai_requests` 테이블)을 집계해서,
**어떤 공간·스타일을 가장 많이 선호하는지** 막대 그래프로 보여줍니다.

### 핵심 개념
- **데이터 분석 흐름**: 사용자 요청이 쌓임 → `GROUP BY`로 집계 → 그래프로 시각화.
- 외부 차트 라이브러리를 쓰지 않고 **CSS로 만든 막대 그래프**라 초보자가 이해하기 쉽습니다.

### 주요 코드와 설명

**막대 비율 계산** - 가장 많은 항목을 100%로 하고 나머지를 상대 비율로 표시합니다.

```javascript
const max = Math.max(...rows.map((r) => r.count));
const width = Math.round((r.count / max) * 100);
```

```css
.bar-fill { width: 0; transition: width 0.8s ease; }   /* 처음엔 0, 나중에 채움 */
```

**렌더링 시 애니메이션** - 데이터를 그린 직후에 너비를 지정해서 막대가 차오르게 합니다.

```javascript
setTimeout(() => {
  document.querySelectorAll('.bar-fill').forEach((fill) => {
    fill.style.width = fill.dataset.width + '%';
  });
}, 200);
```

**데이터가 없을 때** - 안내 화면과 함께 "AI 디자인 하러 가기" 버튼을 보여줍니다.

### 완료 확인 방법

`http://localhost:3000/analysis.html` 을 열고:

- AI 디자인을 한 번도 안 했다면 "아직 분석할 데이터가 없어요" 안내가 보인다.
- AI 디자인을 생성한 후 새로고침하면 막대 그래프가 차오르는 애니메이션과 함께 표시된다.
- 요약 카드(총 요청 수, 인기 공간, 인기 스타일)가 갱신된다.

---

## 단계 11. 갤러리·리뷰 페이지 (`gallery*.html`, `reviews*.html`)

### 목표
- 갤러리: 그리드 형태 배치, 공간/스타일 필터와 검색, 대표 이미지를 누르면 상세 페이지로 이동, 상세에서 비슷한 이미지 추가 표시.
- 리뷰: 그리드 형태 표시, 상세 페이지에서 전체 내용과 좋아요/북마크.
- 두 페이지 상단에 **빵 부스러기(Breadcrumb)** 를 넣어 이동을 쉽게 합니다.

### 핵심 개념
- **빵 부스러기**: `홈 › 갤러리 › 상세` 처럼 현재 위치를 보여주는 내비게이션.
- **쿼리스트링으로 상세 이동**: `gallery-detail.html?id=3` 처럼 주소에 번호를 담아 상세 페이지가 어떤 글인지 알려줍니다.
- **동적 HTML**: `map()`으로 배열을 HTML 문자열로 바꿔 화면에 넣습니다.

### 주요 코드와 설명

**카드 목록 만들기**

```javascript
grid.innerHTML = images.map((img) => `
  <div class="gallery-card-wrap">
    <a class="card gallery-card" href="gallery-detail.html?id=${img.id}">
      <img class="card-img" src="${img.image_url}" alt="...">
      ...
    </a>
    <div class="card-actions">
      <button class="icon-btn" data-kind="images" data-id="${img.id}" data-action="like">♥ 좋아요</button>
      ...
    </div>
  </div>`).join('');
```

**상세 페이지에서 id 읽기**

```javascript
const id = new URLSearchParams(location.search).get('id');
const img = await api(`/gallery/${id}`);
```

**비슷한 이미지 더 보기** - 같은 스타일의 다른 이미지를 불러와 아래에 표시합니다.

```javascript
const images = await api(`/gallery?style=${encodeURIComponent(current.style)}`);
const related = images.filter((i) => i.id !== current.id).slice(0, 4);
```

**좋아요/북마크 버튼 연결** - `common.js`의 `bindToggle`을 사용합니다.

```javascript
bindToggle(document.getElementById('likeBtn'), 'images', img.id);
```

> `bindToggle`은 클릭 시 `POST /api/images/:id/toggle`을 호출하고, 버튼 모양과 개수를 갱신합니다.

### 완료 확인 방법

- `http://localhost:3000/gallery.html`: 그리드가 보이고, 필터 칩을 누르면 목록이 바뀌며, 검색이 동작한다.
- 이미지를 누르면 `gallery-detail.html?id=...` 상세 페이지로 이동하고, 아래에 비슷한 스타일 이미지가 보인다.
- `reviews.html`: 리뷰 그리드가 보이고, 상세 페이지에서 좋아요/북마크가 동작한다.
- 상단 빵 부스러기로 원하는 화면(홈/갤러리/리뷰)에 쉽게 이동한다.
- 로그인하지 않은 상태에서 좋아요를 누르면 로그인 페이지로 이동한다.

---

## 단계 12. 로그인·회원가입 페이지 (`login.html`, `register.html`, `auth.js`)

### 목표
이메일 회원가입/로그인 폼과 **구글·깃허브 로그인 버튼**을 만듭니다.
미리 예시 문장(placeholder)과 오류 메시지로 초보자도 쉽게 사용하게 합니다.

### 핵심 개념
- **form + submit 이벤트**: 제출 시 `e.preventDefault()`로 페이지 새로고침을 막고, JavaScript로 서버에 요청합니다.
- **데모 계정 안내**: 설정 없는 초보자가 바로 체험해볼 수 있도록 로그인 화면에 데모 계정을 안내합니다.

### 주요 코드와 설명

**로그인 처리**

```javascript
form.addEventListener('submit', async (e) => {
  e.preventDefault();   // 새로고침 막기
  const { user } = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  showToast(`${user.nickname}님, 환영해요!`);
  setTimeout(() => { window.location.href = 'mypage.html'; }, 500);
});
```

**소셜 로그인 버튼** - 버튼을 누르면 해당 주소로 이동합니다.

```html
<a class="social-btn" href="/auth/google"> 구글 로그인 </a>
<a class="social-btn" href="/auth/github"> 깃허브 로그인 </a>
```

**오류 메시지 표시** - URL에 `?error=...` 가 있으면(소셜 로그인 실패 시) 화면에 보여줍니다.

```javascript
const errMsg = new URLSearchParams(location.search).get('error');
if (errMsg) showError(errMsg);
```

### 완료 확인 방법

- `http://localhost:3000/register.html`: 닉네임/이메일/비밀번호로 가입하면 마이 페이지로 이동한다.
- 비밀번호 확인이 다르면 오류 메시지가 보인다.
- `http://localhost:3000/login.html`: 데모 계정 `demo@roomauto.com` / `1234` 로 로그인된다.
- 잘못된 비밀번호면 오류 메시지가 보인다.
- 구글/깃허브 버튼을 누르면(설정 안 된 경우) "설정 필요" 안내와 함께 돌아온다.

---

## 단계 13. 마이 페이지 (`mypage.html`, `mypage.css`, `mypage.js`)

### 목표
프로필 확인, 내가 누른 좋아요/북마크 확인(이미지·리뷰), 회원 정보 수정, 비밀번호 변경, 회원 탈퇴 기능을 제공합니다.

### 페이지 구성 (탭 3개)

```
┌──────────────────────────────┐
│ [프로필 카드: 아바타/닉네임/로그인 방식/가입일] │
├──────────────────────────────┤
│  좋아요 | 북마크 | 설정       │  ← 탭
├──────────────────────────────┤
│  좋아요 탭: 좋아요한 이미지/리뷰 목록 │
│  북마크 탭: 북마크한 이미지/리뷰 목록 │
│  설정 탭: 정보수정 / 비번변경 / 탈퇴 │
└──────────────────────────────┘
```

### 주요 코드와 설명

**탭 전환** - `data-panel` 속성으로 패널을 열고 닫습니다.

```javascript
document.querySelectorAll('.mp-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.getElementById('panel-' + tab.dataset.panel).classList.add('active');
  });
});
```

**로그인 확인** - 마이 페이지가 열리면 먼저 로그인 여부를 확인합니다.

```javascript
const user = await requireLogin();   // 로그인 안 되어 있으면 로그인 페이지로 이동
```

**회원 탈퇴** - 확인창(`confirm`)을 거쳐 진행합니다.

```javascript
if (!confirm('정말 탈퇴하시겠어요? 이 작업은 되돌릴 수 없어요.')) return;
await api('/user/me', { method: 'DELETE', body: JSON.stringify({ password }) });
```

### 완료 확인 방법

- 로그인하지 않은 상태에서 `http://localhost:3000/mypage.html` 을 열면 로그인 페이지로 이동한다.
- 프로필 카드에 닉네임, 로그인 방식, 가입일이 보인다.
- 갤러리/리뷰에서 좋아요나 북마크를 누른 뒤 마이 페이지의 해당 탭에 목록이 보인다.
- 설정 탭에서 닉네임을 바꾸면 프로필에 바로 반영된다.
- 비밀번호를 변경한 뒤 이전 비밀번호로 로그인하면 실패하고 새 비밀번호로 로그인된다.
- 회원 탈퇴를 하면 다시 로그인할 수 없다.

---

## 단계 14. 전체 테스트와 마무리

### API 전체 점검 목록

| 주소 | 로그인 | 기대 결과 |
|------|--------|-----------|
| `GET /api/gallery` | X | 이미지 목록 JSON |
| `GET /api/gallery/1` | X | 이미지 1개 JSON |
| `GET /api/reviews` | X | 리뷰 목록 JSON |
| `GET /api/analysis` | X | 분석 집계 JSON |
| `POST /api/auth/register` | X | 회원가입 성공 JSON |
| `POST /api/auth/login` | X | 로그인 성공 JSON |
| `POST /api/auth/logout` | X | 로그아웃 JSON |
| `GET /api/auth/me` | X | 로그인 정보 JSON |
| `POST /api/ai/decor` | O | AI 이미지 결과 JSON |
| `POST /api/ai/floorplan` | O | AI 이미지 결과 JSON |
| `POST /api/images/1/toggle` | O | `{active, count}` |
| `GET /api/user/me` | O | 내 정보 JSON |
| `PUT /api/user/me` | O | 수정된 내 정보 JSON |
| `PUT /api/user/me/password` | O | 비밀번호 변경 JSON |
| `GET /api/user/me/likes` | O | 좋아요 목록 JSON |
| `DELETE /api/user/me` | O | 탈퇴 JSON |

### 화면 전체 점검 목록

- [ ] 모든 페이지가 반응형(PC/태블릿/모바일)에서 자연스럽게 보인다.
- [ ] 내비게이션이 하이드 온 스크롤 동작을 한다.
- [ ] 로그인 전/후의 버튼이 바뀐다.
- [ ] 갤러리/리뷰에서 좋아요·북마크가 동작한다.
- [ ] AI 디자인이 로딩 화면을 거쳐 결과를 보여준다.
- [ ] 분석 페이지에 그래프가 그려진다.
- [ ] 마이 페이지에서 수정/변경/탈퇴가 동작한다.

### 서버 실행 방법 (최종)

```bash
# 최초 1회 (패키지 설치)
npm install

# 서버 실행
node server.js
```

브라우저에서 `http://localhost:3000` 을 열면 됩니다.

---

## 부록 A. 자주 쓰는 명령어 모음

```bash
# 서버 실행
node server.js

# DB 초기화/예시 데이터 (새로 만들고 싶을 때)
node db.js

# 갤러리 API 테스트
curl http://localhost:3000/api/gallery
```

- 서버 종료는 터미널에서 `Ctrl + C`
- 실행/종료에 대한 더 자세한 설명은 [1-9. 프로젝트 실행·종료 방법](#1-9-프로젝트-실행종료-방법-최종-정리) 참고

> 참고: DB를 완전히 초기화하려면 `data/roomauto.db` 파일을 지운 뒤 `node db.js`를 실행하면 됩니다.
> (이 프로젝트는 데이터가 중요하지 않은 학습용이므로 가능한 방법입니다.)

## 부록 B. 학습을 더 하고 싶다면 (다음 과제)

1. **검색 기능 확장**: 갤러리 검색을 제목뿐 아니라 설명까지 확장해 보기.
2. **페이지 나누기(페이징)**: 목록이 많아지면 한 번에 보여줄 개수를 제한하고 `page` 번호로 이동.
3. **AI 요청 내역 페이지**: 내가 생성한 디자인을 모아 보는 페이지 추가.
4. **댓글 기능**: 리뷰에 댓글 테이블을 추가해 보기.
5. **실제 동영상 교체**: 히어로 영상을 직접 만든 인테리어 영상으로 교체.
6. **배포(Deploy)**: 상용 서버(예: Render, Railway)에 올려 보기.

---

## 부록 C. 트러블슈팅: SQLite와 Node.js 최신 버전 호환성 문제 해결 (중요)

프로젝트를 진행하며 Node.js의 최신 버전(v24 이상)을 사용할 때 데이터베이스 모듈(`better-sqlite3`) 설치 및 실행 과정에서 발생할 수 있는 문제와 그 해결 과정을 상세히 기록합니다. 추후 다른 프로젝트를 세팅할 때 반드시 참고해야 할 중요한 정보입니다.

### 1. 문제 발생: `Cannot find module 'dotenv'` 및 `better-sqlite3` 오류
처음 서버를 실행할 때 패키지 누락으로 `Cannot find module 'dotenv'` 오류가 발생하여 `npm install dotenv`를 실행했습니다. 그러나 설치 과정에서 `better-sqlite3` 모듈의 네이티브 C++ 바인딩을 빌드하지 못해 설치가 실패하는 연쇄적인 문제가 발생했습니다.

이후 `--ignore-scripts` 옵션으로 패키지를 강제 설치한 뒤 서버를 다시 실행하자, 이번에는 아래와 같은 바인딩 파일 누락 오류가 발생했습니다.
```text
Error: Could not locate the bindings file. Tried:
 → .../node_modules/better-sqlite3/build/Release/better_sqlite3.node
```

### 2. 원인 분석: 최신 Node.js (v24)와 C++ 네이티브 애드온
`better-sqlite3`는 내부적으로 C++ 언어로 작성된 바인딩 코드를 사용합니다.
- **Node.js LTS 버전(예: v20, v22)** 에서는 운영체제별로 미리 컴파일된(Pre-built) 바이너리 파일이 제공되므로 별도의 빌드 과정 없이 즉시 설치됩니다.
- 그러나 **Node.js v24.14.1**과 같은 극초기/최신 버전 환경에서는 아직 미리 빌드된 파일이 제공되지 않으므로, 패키지 설치 시 시스템에서 C++ 코드를 직접 컴파일하려고 시도합니다.
- 이때 Windows 환경에 C++ 컴파일 도구(Visual Studio Build Tools)가 없어서 `node-gyp`가 빌드에 실패하고 설치가 중단된 것입니다.

### 3. 실패한 접근 방법: `windows-build-tools`
과거에는 위와 같은 컴파일 환경 문제를 해결하기 위해 PowerShell 관리자 모드에서 아래 명령어로 빌드 도구를 전역 설치하는 것이 정석이었습니다.
```bash
npm install --global windows-build-tools
```
하지만 이 방식은 다음과 같은 두 가지 큰 문제로 인해 현재는 **사용 불가능**합니다.
1. **PowerShell 보안 정책 차단**: Windows의 기본 실행 정책(`ExecutionPolicy`)으로 인해 스크립트 실행이 차단됨. (해결: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` 실행)
2. **패키지 노후화(Deprecated)**: 실행 권한 문제를 해결하고 설치를 진행하더라도, `windows-build-tools`는 유지보수가 중단된 오래된 도구여서 최신 Node.js 환경에서 `TypeError: 'process.env' only accepts a configurable, writable, and enumerable data descriptor` 라는 치명적인 오류를 뿜으며 설치가 중단됩니다.

결과적으로, 최신 환경에서 C++ 빌드 도구가 필요하다면 마이크로소프트 공식 홈페이지에서 **Visual Studio Build Tools**를 직접 다운로드하여 "C++ 데스크톱 개발" 워크로드를 수동 설치하는 방법밖에 없습니다.

### 4. 최종 해결책: Node.js 22.5.0+ 내장 `node:sqlite` 모듈 도입
무거운 C++ 컴파일러를 설치하거나 Node.js 버전을 강제로 다운그레이드하는 대신, 최신 버전의 이점을 완벽히 활용하는 가장 깔끔한 방법으로 문제를 해결했습니다.

**Node.js v22.5.0 부터 자체적으로 SQLite 모듈(`node:sqlite`)이 내장되었습니다.** 이 내장 모듈은 외부 의존성 패키지나 C++ 빌드 툴을 전혀 요구하지 않으면서도, 기존 `better-sqlite3`와 API 사용법이 99% 동일한 동기식(Synchronous) 데이터베이스 제어를 지원합니다.

#### 실제 적용한 코드 변경 사항 (`db.js`)
기존 `better-sqlite3`의 의존성을 완전히 제거하고, 단 두 줄의 코드를 수정하여 내장 SQLite 모듈로 교체했습니다.

**변경 전 (`better-sqlite3` 사용):**
```javascript
const Database = require('better-sqlite3');
const db = new Database(path.join(dataDir, 'roomauto.db'));
db.pragma('journal_mode = WAL');
```

**변경 후 (`node:sqlite` 내장 모듈 사용):**
```javascript
const { DatabaseSync: Database } = require('node:sqlite');
const db = new Database(path.join(dataDir, 'roomauto.db'));
db.exec('PRAGMA journal_mode = WAL');
```
이후 `npm uninstall better-sqlite3` 명령어로 외부 의존성을 완전히 제거하였으며, 아무런 추가 설치 없이 `node server.js`로 서버가 쾌적하게 실행됨을 확인했습니다.

### 5. 핵심 요약 (미래 프로젝트를 위한 팁)
- **Node.js 버전 선택**: 새로운 프로젝트를 시작할 때는 최신 버전보다는 짝수 번호로 끝나는 **LTS(Long Term Support) 버전(v20, v22 등)**을 사용하는 것이 서드파티 패키지 호환성(Pre-built 바이너리 지원 등) 측면에서 압도적으로 유리합니다.
- **SQLite 사용의 패러다임 변화**: Node.js v22.5.0 이상의 환경이라면 더 이상 `sqlite3`나 `better-sqlite3` 같은 외부 패키지를 고집할 필요가 없습니다. 네이티브 빌드 스트레스가 없는 내장 `node:sqlite` 모듈을 적극적으로 활용하세요.

---

## 부록 D. 심화 가이드: 원본 방 구조와 평면도를 완벽하게 유지하는 AI 이미지 생성법

현재 프로젝트에서 AI 이미지 생성 기능('빈 방 꾸미기', '평면도 3D 변환')을 사용할 때, 사용자가 업로드한 원본 사진의 방 구조(벽, 창문, 문의 위치 등)나 도면의 형태가 무시되고 완전히 새로운 이미지가 출력되는 현상이 있습니다. 이 현상의 원인과 이를 완벽하게 해결하기 위한 상용 서비스 수준의 AI 업그레이드 방안을 기록합니다.

### 1. 현상의 원인: 텍스트-투-이미지 (Text-to-Image) 방식의 한계
현재 프로젝트(`routes/ai.js`)는 초보자 교육용으로서 가입이나 API 키 발급 없이 완전히 무료로 사용할 수 있는 `pollinations.ai` 서비스를 활용하고 있습니다.

이 방식의 가장 큰 한계는 다음과 같습니다.
- 사용자가 이미지를 업로드하긴 하지만, 정작 AI 서버로 요청을 보낼 때는 **오직 텍스트 프롬프트(글자)만 URL에 담아서 보냅니다.**
- 즉, 현재 사용 중인 AI는 사용자가 올린 방 사진이나 평면도를 **아예 보지 못하고**, 오직 "원룸, 모던 스타일" 또는 "아늑한 원룸 3D 평면도"라는 텍스트만 읽은 뒤 백지상태에서 무작위로 새로운 공간을 상상해서 그리는 **'텍스트-투-이미지 (Text-to-Image)'** 방식으로 작동합니다.
- 이로 인해 원본 이미지(사진/도면)와는 전혀 다른 엉뚱한 결과물이 생성되는 것입니다. (현재 프로젝트의 AI 기능은 일종의 '페이크(Fake) 이미지 변환' 체험에 가깝습니다.)

### 2. 완벽한 해결책: 이미지-투-이미지 (Image-to-Image) 및 ControlNet 도입
원본 방의 고유한 구조(창문 위치, 문, 천장 높이 등)나 평면도의 직선(벽체 위치)을 1mm도 어긋나지 않게 유지하려면, 원본 이미지를 직접 분석해서 그 틀 안에서 렌더링을 수행하는 기술이 필요합니다.

이를 해결하기 위해서는 다음과 같은 상용 AI API 중 하나로 서버 코드(`routes/ai.js`)를 업그레이드해야 합니다.

*   **Replicate API (가장 강력하고 추천하는 방법)**: 현재 전 세계 인테리어 AI 서비스 개발자들이 가장 많이 사용하는 플랫폼입니다. 
    - **Stable Diffusion + ControlNet (MLSD 또는 Segmentation 모델)**을 조합하여 사용합니다.
    - **원리**: 원본 방 사진에서 선(엣지)과 깊이감(구조)을 완벽하게 추출하거나, 도면 이미지에서 직선(벽체)을 정확하게 인식한 뒤, 그 구조를 절대 벗어나지 않도록 강제(Control)하면서 3D 입체 렌더링 및 가구를 입힙니다.
    - **단점**: API 키 발급이 필요하며, 이미지 생성 시 약간의 비용(과금)이 발생합니다.
*   **OpenAI API (DALL-E)**: 이미지 편집(Inpainting) 기능을 지원하는 엔드포인트를 사용하여 원본 이미지의 특정 영역만 수정하는 방식을 취할 수 있습니다.
*   **Interior AI 등 특화 상용 API**: 이미 인테리어에 최적화된 프롬프트와 컨트롤넷 설정이 완료된 전문 API를 연동하는 방법도 있습니다.

### 결론
현재의 텍스트 기반 무료 AI 연동 방식은 웹 서비스의 전체적인 동작 흐름(파일 업로드 -> API 호출 -> 결과 출력)을 배우기 위한 훌륭한 디딤돌입니다. 
하지만 추후 진짜 상용 서비스 수준의 결과물이 필요한 실전 프로젝트를 진행하신다면, 반드시 **Replicate API의 ControlNet 모델(또는 그에 준하는 Img2Img 특화 API)**을 도입하여 아키텍처를 업그레이드하시기 바랍니다.

---

## 부록 E. 심화 가이드: 브라우저 CSS를 활용한 가상 3D 회전 효과 (Fake 3D)

이 프로젝트의 '평면도 3D 변환' 결과 화면에서 마우스로 이미지를 드래그하면 입체적으로 회전하는 기능이 있습니다. 이 기능에 대한 기술적 배경과 트러블슈팅 내역을 기록합니다.

### 1. 3D 이미지가 얇은 종이처럼 보이는 이유
회전하는 3D 결과물을 보면 마치 두께가 없는 얇은 종이(사진 인화지)처럼 보입니다. 이는 정상적인 동작입니다.
현재 프로젝트의 "3D 회전" 기능은 실제 3D 모델(입체 블록이나 공간)을 만든 것이 아니라, AI가 생성해 준 **'2D 평면 이미지(그림)'를 웹 브라우저의 CSS 3D 변환 기능(`transform: rotateX`, `rotateY`)을 이용해 강제로 기울여서 보여주는 일종의 '눈속임(Fake 3D)' 기법**이기 때문입니다.

진짜 집처럼 두께와 부피가 있는 완벽한 3D를 웹에서 구현하려면 이미지 AI가 아니라 **Three.js** 같은 WebGL 기반의 3D 렌더링 라이브러리와, 이미지가 아닌 **3D 전용 파일 모델(GLTF, OBJ 등)**을 생성해주는 완전히 다른 기술 스택을 도입해야 하는 매우 복잡한 작업이 필요합니다. 본 프로젝트에서는 초보자의 흥미와 직관적인 재미를 위해 CSS만으로 입체감을 흉내 낸 것입니다.

### 2. 트러블슈팅: 마우스 우클릭 시 회전되는 버그 수정
초기 코드에서는 마우스 좌클릭뿐만 아니라 우클릭을 한 상태로 드래그해도 이미지가 회전하는 문제가 있었습니다. 이는 자바스크립트의 `pointerdown` 이벤트에서 "어떤 마우스 버튼이 눌렸는지"를 검사하는 방어 로직이 누락되었기 때문입니다.

**수정된 코드 (`public/js/design.js` 255번째 줄 부근):**
```javascript
  scene.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return; // 좌클릭(0)만 허용하도록 예외 처리 추가
    dragging = true;
    // ... 생략
```
이 한 줄의 코드를 추가함으로써, 우클릭 시 나타나는 브라우저 기본 컨텍스트 메뉴와 커스텀 회전 기능이 충돌하는 사용자 경험(UX) 버그를 완벽하게 해결했습니다.

---

*이 문서는 RoomAuto 프로젝트를 처음부터 끝까지 만드는 과정을 학습 목적으로 기록한 가이드입니다.*
