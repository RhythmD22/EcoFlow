import { EcoScan } from './scan.js';
import { navigateTo } from './nav.js';
import { escapeHTML, showToast } from './utils.js';
import { Icons } from './icons.js';
import { setPendingPrompt } from './coach-page.js';

const CAMERA_BUTTON_HTML = `${Icons.cameraBtn} Scan with Camera`;

let scanCleanup = null;

export function getScanCleanup() {
  return scanCleanup;
}

function initScan() {
  const input = document.getElementById('scan-barcode');
  const btn = document.getElementById('btn-scan');
  const loadingEl = document.getElementById('scan-loading');
  const errorEl = document.getElementById('scan-error');
  const resultEl = document.getElementById('scan-result');
  const recentEl = document.getElementById('scan-recent');
  const cameraBtn = document.getElementById('btn-camera');
  const viewfinder = document.getElementById('scan-viewfinder');

  let html5QrCode = null;
  let lastProductInfo = null;
  let isScanning = false;

  renderRecentScans();

  btn.addEventListener('click', () => performScan());
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') performScan();
  });

  cameraBtn.addEventListener('click', () => {
    if (html5QrCode && html5QrCode.isScanning) {
      stopCamera();
    } else {
      startCamera();
    }
  });

  const askCoachBtn = document.getElementById('btn-ask-coach');
  if (askCoachBtn) {
    askCoachBtn.addEventListener('click', () => {
      if (!lastProductInfo) return;
      const prompt = EcoScan.coachPrompt(lastProductInfo);
      setPendingPrompt(prompt);
      navigateTo('coach');
    });
  }

  scanCleanup = () => {
    if (html5QrCode && html5QrCode.isScanning) {
      html5QrCode.stop().catch(() => { });
      html5QrCode = null;
    }
    viewfinder.hidden = true;
    cameraBtn.innerHTML = CAMERA_BUTTON_HTML;
    cameraBtn.removeAttribute('aria-pressed');
    cameraBtn.removeAttribute('aria-controls');
  };

  function startCamera() {
    if (typeof Html5Qrcode === 'undefined') {
      showToast('Camera library failed to load. Check your connection.', '');
      return;
    }
    viewfinder.hidden = false;
    cameraBtn.innerHTML = 'Stop Camera';
    cameraBtn.setAttribute('aria-pressed', 'true');
    cameraBtn.setAttribute('aria-controls', 'scan-viewfinder');

    html5QrCode = new Html5Qrcode('scan-viewfinder');
    html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 4 / 3 },
      (decodedText) => {
        input.value = decodedText;
        stopCamera();
        performScan();
      },
      () => { }
    ).catch((err) => {
      viewfinder.hidden = true;
      cameraBtn.innerHTML = CAMERA_BUTTON_HTML;
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        showToast('Camera requires HTTPS on mobile. Use a local HTTPS server or deploy.', '');
      } else {
        showToast(err.message || 'Could not start camera.', '');
      }
    });
  }

  function stopCamera() {
    if (html5QrCode) {
      html5QrCode.stop().catch(() => { });
      html5QrCode = null;
    }
    viewfinder.hidden = true;
    cameraBtn.innerHTML = CAMERA_BUTTON_HTML;
    cameraBtn.removeAttribute('aria-pressed');
    cameraBtn.removeAttribute('aria-controls');
  }

  async function performScan() {
    const barcode = input.value.trim();
    if (!barcode || isScanning) return;
    isScanning = true;

    loadingEl.hidden = false;
    errorEl.hidden = true;
    resultEl.hidden = true;

    const response = await EcoScan.lookupBarcode(barcode);

    loadingEl.hidden = true;
    isScanning = false;

    if (response.error) {
      errorEl.textContent = response.error;
      errorEl.hidden = false;
      return;
    }

    const info = EcoScan.extractProductInfo(response.product);
    lastProductInfo = info;
    renderProduct(info);
    EcoScan.saveRecentScan(barcode, info);
    renderRecentScans();
  }

  function renderProduct(info) {
    const img = document.getElementById('scan-img');
    img.src = info.image || '';
    img.alt = info.name || 'Product image';
    img.style.display = info.image ? '' : 'none';

    document.getElementById('scan-name').textContent = info.name;
    document.getElementById('scan-brand').textContent = info.brand || '';

    const gradeEl = document.getElementById('eco-grade');
    const valueEl = document.getElementById('eco-value');
    const scoreBox = document.getElementById('eco-score');

    if (info.ecoscoreGrade) {
      gradeEl.textContent = info.ecoscoreGrade;
      gradeEl.style.color = EcoScan.getEcoScoreColor(info.ecoscoreGrade);
      valueEl.textContent = EcoScan.getEcoScoreDescription(info.ecoscoreGrade);
      scoreBox.style.borderColor = EcoScan.getEcoScoreColor(info.ecoscoreGrade);
      scoreBox.setAttribute('aria-label', `Eco-Score grade ${info.ecoscoreGrade}: ${EcoScan.getEcoScoreDescription(info.ecoscoreGrade)}`);
    } else {
      gradeEl.textContent = '?';
      gradeEl.style.color = 'var(--text-tertiary)';
      valueEl.textContent = 'No Eco-Score available';
      scoreBox.style.borderColor = 'transparent';
      scoreBox.removeAttribute('aria-label');
    }

    document.getElementById('detail-packaging').textContent = info.packaging;
    document.getElementById('detail-origins').textContent = info.origins;
    document.getElementById('detail-labels').textContent = info.labels;

    resultEl.hidden = false;
  }

  function renderRecentScans() {
    const recent = EcoScan.getRecentScans();
    const list = document.getElementById('scan-recent-list');

    if (recent.length === 0) {
      recentEl.hidden = true;
      return;
    }

    recentEl.hidden = false;
    list.innerHTML = recent.map(r => `
      <button class="scan-recent-item" data-barcode="${r.barcode}">
        ${r.image ? `<img class="scan-recent-img" src="${r.image}" alt="" onerror="this.style.display='none'">` : ''}
        <span class="scan-recent-name">${escapeHTML(r.name)}</span>
        ${r.grade ? `<span class="scan-recent-grade" style="background:${EcoScan.getEcoScoreColor(r.grade)}22;color:${EcoScan.getEcoScoreColor(r.grade)}">${r.grade}</span>` : ''}
      </button>
    `).join('');

    list.querySelectorAll('.scan-recent-item').forEach(item => {
      item.addEventListener('click', () => {
        input.value = item.dataset.barcode;
        performScan();
      });
    });
  }
}

export { initScan };