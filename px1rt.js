// ----- Canvas: random pixelboard -----
function drawRandomBoard() {
  const canvas = document.getElementById('pixelboard');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Size the canvas to a nice square inside the container
  const container = document.getElementById('game-container');
  const size = Math.min(container.clientWidth - 40, window.innerHeight - 180);
  canvas.width = size;
  canvas.height = size;

  const cells = 59; // grid size (change if you want)
  const cell = Math.floor(size / cells);

  // simple palette
  const palette = ['#ff3b30', '#ffcc00', '#34c759', '#007aff', '#af52de'];
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      ctx.fillStyle = palette[Math.floor(Math.random() * palette.length)];
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }
}

// ----- Menu + Music -----
function setupUI() {
  const musicEl = document.getElementById('background-music');
  const musicToggle = document.getElementById('music-toggle');
  const speakerOn = document.getElementById('speaker-on');
  const speakerOff = document.getElementById('speaker-off');

  // optional: autoplay once user interacts
  function toggleMusic() {
    if (!musicEl) return;
    if (musicEl.paused) {
      musicEl.play().catch(() => {});
      speakerOn?.classList.remove('hidden');
      speakerOff?.classList.add('hidden');
    } else {
      musicEl.pause();
      speakerOn?.classList.add('hidden');
      speakerOff?.classList.remove('hidden');
    }
  }

  musicToggle?.addEventListener('click', toggleMusic);

  // Start menu dropdown
  const startContainer = document.getElementById('start-menu-container');
  const startDropdown = document.getElementById('start-dropdown');
  startContainer?.addEventListener('click', () => {
    startDropdown?.classList.toggle('hidden');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!startContainer?.contains(e.target)) {
      startDropdown?.classList.add('hidden');
    }
  });

  // Menu item handlers
  const newGameBtn = document.getElementById('new-game');
  const customGameBtn = document.getElementById('custom-game');
  const uploadGameBtn = document.getElementById('upload-game');

  newGameBtn?.addEventListener('click', () => {
    startDropdown?.classList.add('hidden');
    // Start new game with default settings
    startNewGame(59, 'Creative');
  });

  customGameBtn?.addEventListener('click', () => {
    startDropdown?.classList.add('hidden');
    document.getElementById('custom-modal')?.classList.remove('hidden');
  });

  uploadGameBtn?.addEventListener('click', () => {
    startDropdown?.classList.add('hidden');
    document.getElementById('upload-modal')?.classList.remove('hidden');
  });

  // About modal
  const aboutBtn = document.getElementById('about-menu');
  const aboutModal = document.getElementById('about-modal');
  const closeAbout = document.getElementById('close-about-modal');
  aboutBtn?.addEventListener('click', () => aboutModal?.classList.remove('hidden'));
  closeAbout?.addEventListener('click', () => aboutModal?.classList.add('hidden'));

  // Export modal
  const exportBtn = document.getElementById('export-button');
  const exportModal = document.getElementById('export-modal');
  const closeExport = document.getElementById('close-export-modal');
  const exportYesBtn = document.getElementById('export-yes-button');
  const exportNoBtn = document.getElementById('export-no-button');
  
  exportBtn?.addEventListener('click', () => exportModal?.classList.remove('hidden'));
  closeExport?.addEventListener('click', () => exportModal?.classList.add('hidden'));
  
  exportYesBtn?.addEventListener('click', () => {
    exportModal?.classList.add('hidden');
    exportCanvas(true);
  });
  
  exportNoBtn?.addEventListener('click', () => {
    exportModal?.classList.add('hidden');
    exportCanvas(false);
  });

  // Upload modal
  const uploadModal = document.getElementById('upload-modal');
  const closeUpload = document.getElementById('close-upload-modal');
  const imageUploadInput = document.getElementById('image-upload-input');
  const uploadFeedback = document.getElementById('upload-feedback');
  const uploadStep1 = document.getElementById('upload-step-1');
  const uploadStep2 = document.getElementById('upload-step-2');
  const startUploadGame = document.getElementById('start-upload-game');

  closeUpload?.addEventListener('click', () => {
    uploadModal?.classList.add('hidden');
    uploadStep1?.classList.remove('hidden');
    uploadStep2?.classList.add('hidden');
    imageUploadInput.value = '';
    uploadFeedback.textContent = '';
  });

  imageUploadInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadFeedback.textContent = `Selected: ${file.name}`;
      uploadStep1?.classList.add('hidden');
      uploadStep2?.classList.remove('hidden');
    }
  });

  // Upload size and mode selection
  const uploadSizeOptions = document.querySelectorAll('.upload-size-option');
  const uploadModeOptions = document.querySelectorAll('.upload-mode-option');
  let selectedSize = null;
  let selectedMode = null;

  uploadSizeOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      uploadSizeOptions.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedSize = parseInt(btn.dataset.size);
      checkUploadReady();
    });
  });

  uploadModeOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      uploadModeOptions.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedMode = btn.dataset.mode;
      checkUploadReady();
    });
  });

  function checkUploadReady() {
    startUploadGame.disabled = !(selectedSize && selectedMode);
  }

  startUploadGame?.addEventListener('click', () => {
    if (selectedSize && selectedMode) {
      uploadModal?.classList.add('hidden');
      startNewGame(selectedSize, selectedMode);
    }
  });

  // Custom modal
  const customModal = document.getElementById('custom-modal');
  const closeCustom = document.getElementById('close-custom-modal');
  const customSizeOptions = document.querySelectorAll('.custom-size-option');
  const customModeOptions = document.querySelectorAll('.custom-mode-option');
  const startCustomGame = document.getElementById('start-custom-modal-game');
  let customSelectedSize = null;
  let customSelectedMode = null;

  closeCustom?.addEventListener('click', () => {
    customModal?.classList.add('hidden');
    customSizeOptions.forEach(b => b.classList.remove('selected'));
    customModeOptions.forEach(b => b.classList.remove('selected'));
    customSelectedSize = null;
    customSelectedMode = null;
    startCustomGame.disabled = true;
  });

  customSizeOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      customSizeOptions.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      customSelectedSize = parseInt(btn.dataset.size);
      checkCustomReady();
    });
  });

  customModeOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      customModeOptions.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      customSelectedMode = btn.dataset.mode;
      checkCustomReady();
    });
  });

  function checkCustomReady() {
    startCustomGame.disabled = !(customSelectedSize && customSelectedMode);
  }

  startCustomGame?.addEventListener('click', () => {
    if (customSelectedSize && customSelectedMode) {
      customModal?.classList.add('hidden');
      startNewGame(customSelectedSize, customSelectedMode);
    }
  });
}

// Start new game function
function startNewGame(size, mode) {
  const canvas = document.getElementById('pixelboard');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const container = document.getElementById('game-container');
  const canvasSize = Math.min(container.clientWidth - 40, window.innerHeight - 180);
  
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  
  const cell = Math.floor(canvasSize / size);
  const palette = ['#ff3b30', '#ffcc00', '#34c759', '#007aff', '#af52de'];
  
  // Clear and redraw with new size
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      ctx.fillStyle = palette[Math.floor(Math.random() * palette.length)];
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }
  
  // Update counter
  const counter = document.getElementById('counter-display');
  if (counter) {
    counter.textContent = 'Changes: 0';
  }
}

// Export canvas function
function exportCanvas(withWatermark) {
  const canvas = document.getElementById('pixelboard');
  if (!canvas) return;
  
  const link = document.createElement('a');
  link.download = 'px1rt-export.png';
  
  if (withWatermark) {
    // Create a new canvas with watermark
    const watermarkCanvas = document.createElement('canvas');
    const watermarkCtx = watermarkCanvas.getContext('2d');
    watermarkCanvas.width = canvas.width;
    watermarkCanvas.height = canvas.height;
    
    // Draw original canvas
    watermarkCtx.drawImage(canvas, 0, 0);
    
    // Add watermark (simple text for now)
    watermarkCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    watermarkCtx.font = '16px Arial';
    watermarkCtx.textAlign = 'right';
    watermarkCtx.fillText('px1rt', canvas.width - 10, canvas.height - 10);
    
    link.href = watermarkCanvas.toDataURL();
  } else {
    link.href = canvas.toDataURL();
  }
  
  link.click();
}

function init() {
  drawRandomBoard();
  setupUI();
}

window.addEventListener('DOMContentLoaded', init);
window.addEventListener('resize', drawRandomBoard);
