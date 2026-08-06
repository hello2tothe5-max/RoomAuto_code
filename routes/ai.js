// routes/ai.js - AI 인테리어 생성 기능
// 1) 빈 방 이미지 + 문장 -> 가구가 채워진 인테리어 이미지 (decor)
// 2) 평면도 이미지 + 문장 -> 입체 3D 느낌 이미지 (floorplan)
// 무료 이미지 AI인 'pollinations.ai'를 사용해서 이미지를 만듭니다.

const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const db = require('../db');
const { requireAuth } = require('./helpers');

const router = express.Router();

// ---------------------------------------------------------------
// 파일 업로드 설정 (이미지만 받고, 크기는 최대 10MB)
// ---------------------------------------------------------------
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `upload_${Date.now()}_${Math.round(Math.random() * 10000)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 제한
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('이미지 파일만 업로드할 수 있어요.'));
  },
});

// ---------------------------------------------------------------
// pollinations.ai 이미지 생성 헬퍼 함수
// URL을 직접 만든 뒤 이미지를 내려받아 서버에 저장하고 경로를 돌려줍니다.
// ---------------------------------------------------------------
async function generateImage(basePrompt, width, height, type) {
  const seed = Math.floor(Math.random() * 999999);
  // 모델은 flux 사용, 로고(watermark) 없음
  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(basePrompt)}` +
    `?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true&enhance=true`;

  // 이미지 생성은 보통 20~60초 걸립니다. 120초까지 기다립니다.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
  const res = await fetch(url, { signal: controller.signal });
  clearTimeout(timer);

  if (!res.ok) throw new Error(`pollinations.ai 요청 실패 (${res.status})`);

  const buf = Buffer.from(await res.arrayBuffer());
  const fileName = `${type}_${Date.now()}_${seed}.jpg`;
  const generatedDir = path.join(__dirname, '..', 'public', 'generated');
  if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });
  const filePath = path.join(generatedDir, fileName);
  fs.writeFileSync(filePath, buf);
  return `/generated/${fileName}`;
}

// ---------------------------------------------------------------
// 문장에서 공간(room)과 스타일(style)을 찾아내는 함수 (데이터 분석용)
// ---------------------------------------------------------------
const ROOMS = ['원룸', '침실', '거실', '주방', '서재', '드레스룸', '욕실', '베란다', '발코니'];
const STYLES = ['미니멀', '모던', '북유럽', '빈티지', '내추럴', '파스텔', '클래식', '인더스트리얼', '스칸디나비아'];

function findKeyword(text, list) {
  for (const word of list) {
    if (text.includes(word)) return word;
  }
  return null;
}

// ---------------------------------------------------------------
// 핵심 기능 1) 빈 방 -> 인테리어 꾸미기
// ---------------------------------------------------------------
router.post('/ai/decor', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const prompt = (req.body.prompt || '').trim();
    if (!prompt) return res.status(400).json({ error: '원하는 분위기를 적어주세요. (예: 7평 원룸, 미니멀 스타일)' });

    // AI에 보낼 문장을 영어 키워드와 함께 더 자세하게 만들어 줍니다 (한국어만 쓰면 AI가 엉뚱한 그림(예: 애니메이션 캐릭터)을 그릴 수 있습니다).
    const aiPrompt =
      `A photorealistic interior design photography of ${prompt}. empty room filled with beautiful furniture, cozy atmosphere, architectural visualization, 8k resolution, highly detailed. ` +
      `한국어 조건: ${prompt}. 빈 방(공실)을 가구와 인테리어 소품으로 완성한 사진으로 바꿔주세요. ` +
      `벽지, 바닥재, 조명, 소파, 테이블, 침대 등 가구의 색상과 재질이 어울리게 배치하세요. ` +
      `실제 인테리어 사진처럼 자연스럽고 아름답게, 자연광, 고품질 사진`;

    const outputImage = await generateImage(aiPrompt, 1024, 1024, 'decor');

    const room = findKeyword(prompt, ROOMS) || '기타';
    const style = findKeyword(prompt, STYLES) || '기타';
    const inputImage = req.file ? `/uploads/${req.file.filename}` : null;

    // 데이터 분석에 쓰이도록 요청 기록을 저장
    db.prepare(
      `INSERT INTO ai_requests (user_id, type, room, style, prompt, input_image, output_image)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(req.user.id, 'decor', room, style, prompt, inputImage, outputImage);

    res.json({ outputImage, inputImage, room, style });
  } catch (err) {
    console.error('decor 오류:', err.message);
    res.status(502).json({ error: 'AI 생성 서버가 잠시 혼잡해요. 잠시 후 다시 시도해 주세요.' });
  }
});

// ---------------------------------------------------------------
// 핵심 기능 2) 평면도 -> 3D 느낌 이미지
// ---------------------------------------------------------------
router.post('/ai/floorplan', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const prompt = (req.body.prompt || '').trim();
    if (!prompt) return res.status(400).json({ error: '원하는 분위기를 적어주세요. (예: 아늑한 원룸)' });

    const aiPrompt =
      `A beautiful 3D isometric floorplan rendering of ${prompt}, furnished interior architecture, realistic materials, high quality 3D visualization. ` +
      `한국어 조건: ${prompt}. 이 평면도를 입체감 있는 3D 실내 공간 이미지로 바꿔주세요. ` +
      `바닥, 벽, 가구가 실제 공간처럼 보이도록 원근감 있는 3D 렌더링, 실사 스타일`;

    const outputImage = await generateImage(aiPrompt, 1024, 1024, 'floorplan');

    const room = findKeyword(prompt, ROOMS) || '기타';
    const style = findKeyword(prompt, STYLES) || '기타';
    const inputImage = req.file ? `/uploads/${req.file.filename}` : null;

    db.prepare(
      `INSERT INTO ai_requests (user_id, type, room, style, prompt, input_image, output_image)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(req.user.id, 'floorplan', room, style, prompt, inputImage, outputImage);

    res.json({ outputImage, inputImage, room, style });
  } catch (err) {
    console.error('floorplan 오류:', err.message);
    res.status(502).json({ error: 'AI 생성 서버가 잠시 혼잡해요. 잠시 후 다시 시도해 주세요.' });
  }
});

module.exports = router;
