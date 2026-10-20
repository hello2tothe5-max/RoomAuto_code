// gallery-detail.js - 갤러리 상세 페이지 전용 자바스크립트
// URL의 ?id= 숫자를 읽어 해당 사진의 정보와 비슷한 사진을 보여줍니다.

document.addEventListener('DOMContentLoaded', () => {
  const id = new URLSearchParams(location.search).get('id');
  loadDetail(id);
});

async function loadDetail(id) {
  const area = document.getElementById('detailArea');
  try {
    const img = await api(`/gallery/${id}`);

    // 빵 부스러기에 제목 반영
    document.getElementById('breadcrumbTitle').textContent = img.title;

    const match = img.image_url.match(/\d+/);
    const seedNumber = match ? match[0] : 1;

    // 이미지 너비 800px, 높이 700px, 상하/좌우 갭 조정 적용
    area.innerHTML = `
      <style>
        .detail-gallery-grid {
          display: grid;
          /* 2열 배치: 각각 800px 고정 너비 지정 */
          grid-template-columns: repeat(2, 800px); 
          /* 상하 갭 112px, 좌우 갭 40px */
          row-gap: 112px;
          column-gap: 40px;
          justify-content: center; /* 전체 그리드를 화면 중앙에 정렬 */
          margin: 60px auto;
          padding: 0 0px 80px 0px;
        }
        .detail-gallery-grid img {
          width: 800px;
          height: 700px;
          border-radius: 12px;
          object-fit: cover;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease;
          cursor: pointer;
        }
        .detail-gallery-grid img:hover {
          transform: scale(1.02);
        }
        
        /* 모바일 등 작은 화면일 때는 다시 1열 및 가변 크기로 반응형 조정 */
        @media (max-width: 1680px) {
          .detail-gallery-grid {
            /* 화면이 800+800+40보다 작아지면 비율에 맞게 줄어들도록 설정 */
            grid-template-columns: repeat(2, 1fr);
            max-width: 1640px;
          }
          .detail-gallery-grid img {
            width: 100%;
            height: auto;
            aspect-ratio: 8/7; /* 800:700 비율 유지 */
          }
        }
        @media (max-width: 768px) {
          .detail-gallery-grid {
            grid-template-columns: 1fr; 
            row-gap: 30px; /* 모바일에서는 갭 축소 */
          }
        }

        /* 팝업(모달) 스타일 */
        #imageModal {
          display: none; 
          position: fixed; 
          top: 0; 
          left: 0; 
          width: 100%; 
          height: 100%; 
          background: rgba(0, 0, 0, 0.50); 
          z-index: 9999; 
          justify-content: center; 
          align-items: center; 
          cursor: pointer;
        }
        #imageModal img {
          max-width: 90%; 
          max-height: 90%; 
          border-radius: 12px; 
          box-shadow: 0 5px 25px rgba(0,0,0,0.5);
          animation: zoomIn 0.3s ease;
        }
        @keyframes zoomIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      </style>
      
      <!-- 2x2 이미지 그리드 (추출한 seedNumber 적용) -->
      <div class="detail-gallery-grid">
        <img src="/images/seed/popup_img${seedNumber}-1.png" alt="${escapeHtml(img.title)} 1">
        <img src="/images/seed/popup_img${seedNumber}-2.png" alt="${escapeHtml(img.title)} 2">
        <img src="/images/seed/popup_img${seedNumber}-3.png" alt="${escapeHtml(img.title)} 3">
        <img src="/images/seed/popup_img${seedNumber}-4.png" alt="${escapeHtml(img.title)} 4">
      </div>

      <!-- 클릭 시 나타날 확대 모달 창 -->
      <div id="imageModal">
        <img id="modalImage" src="" alt="Enlarged Image">
      </div>
    `;

    // ===== 클릭 이벤트(팝업 로직) 등록 =====
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const gridImages = document.querySelectorAll('.detail-gallery-grid img');

    // 각 갤러리 이미지 클릭 시 모달 열기
    gridImages.forEach(image => {
      image.addEventListener('click', () => {
        modalImg.src = image.src;
        modal.style.display = 'flex';
      });
    });

    // 모달 배경이나 모달 이미지를 다시 클릭하면 닫기
    modal.addEventListener('click', () => {
      modal.style.display = 'none';
      modalImg.src = '';
    });

  } catch (err) {
    area.innerHTML = `<p style="color:var(--danger);text-align:center;">${escapeHtml(err.message)}</p>`;
  }
}