document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const MUSIC_FILE_PATH = "retro-8bit-happy-videogame-music-246631.mp3";

    // --- MOBILE DETECTION ---
    const isMobile = () => {
        return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };

    // --- DOM Elements ---
    const canvas = document.getElementById('pixelboard');
    const mobileCanvas = document.getElementById('mobile-pixelboard');
    const ctx = canvas.getContext('2d');
    const mobileCtx = mobileCanvas.getContext('2d');
    const exportBtn = document.getElementById('export-button');
    const counterDisplay = document.getElementById('counter-display');
    
    // Menu Elements
    const startMenuContainer = document.getElementById('start-menu-container');
    const newGameBtn = document.getElementById('new-game');
    const customGameBtn = document.getElementById('custom-game');
    const customModal = document.getElementById('custom-modal');
    const closeCustomModalBtn = document.getElementById('close-custom-modal');
    const customSizeOptions = document.querySelectorAll('.custom-size-option');
    const customModeOptions = document.querySelectorAll('.custom-mode-option');
    const startCustomModalGameBtn = document.getElementById('start-custom-modal-game');
    const uploadGameBtn = document.getElementById('upload-game');
    // Upload Modal Elements
    const uploadModal = document.getElementById('upload-modal');
    const closeUploadModalBtn = document.getElementById('close-upload-modal');
    const uploadStep1 = document.getElementById('upload-step-1');
    const uploadStep2 = document.getElementById('upload-step-2');
    const imageUploadInput = document.getElementById('image-upload-input');
    const uploadFeedback = document.getElementById('upload-feedback');
    const uploadSizeOptions = document.querySelectorAll('.upload-size-option');
    const uploadModeOptions = document.querySelectorAll('.upload-mode-option');
    const startUploadGameBtn = document.getElementById('start-upload-game');
    let uploadImageData = null;
    let selectedUploadSize = null;
    let selectedUploadMode = null;
    
    // Music Elements
    const musicToggle = document.getElementById('music-toggle');
    const speakerOnIcon = document.getElementById('speaker-on');
    const speakerOffIcon = document.getElementById('speaker-off');
    const backgroundMusic = document.getElementById('background-music');
    backgroundMusic.src = MUSIC_FILE_PATH;
    backgroundMusic.muted = true; // Start with sound muted
    backgroundMusic.loop = true; // Loop the music

    // Modal Elements
    const aboutMenu = document.getElementById('about-menu');
    const aboutModal = document.getElementById('about-modal');
    const closeAboutModalBtn = document.getElementById('close-about-modal');
    const exportModal = document.getElementById('export-modal');
    const closeExportModalBtn = document.getElementById('close-export-modal');
    const exportYesBtn = document.getElementById('export-yes-button');
    const exportNoBtn = document.getElementById('export-no-button');
    
    // Save Confirmation Modal Elements
    const saveConfirmModal = document.getElementById('save-confirm-modal');
    const closeSaveConfirmModalBtn = document.getElementById('close-save-confirm-modal');
    const saveConfirmYesBtn = document.getElementById('save-confirm-yes');
    const saveConfirmNoBtn = document.getElementById('save-confirm-no');
    
    // Store new game settings for after save confirmation
    let pendingNewGameSettings = null;

    // --- Game State ---
    let gameState = {
        grid: [],
        gridSize: 30,
        mode: 'Creative',
        colorChangesLeft: Infinity,
        colorPalette: [],
        selectedPixel: null,
    };
    
    let isMusicPlaying = false;
    let clickTimeout = null;
    let lastClickedPixel = null;
    let inColorCycle = false;
    let selectionTimeout = null;
    let pixelSelectionTime = null; // When pixel was first selected
    let lastColorChangeTime = null; // When last color change occurred
    let colorChangeAllowed = false; // Whether color changes are allowed





    // --- Initialization ---
    function init() {
        if (MUSIC_FILE_PATH) backgroundMusic.src = MUSIC_FILE_PATH;
        
        // Initialize music toggle state
        updateMusicToggleDisplay();
        
        // Initialize game state if not already set
        if (!gameState.gridSize) {
            gameState.gridSize = 10; // Default grid size
            gameState.mode = 'Classic';
            gameState.grid = [];
            gameState.colorPalette = [];
            startNewGame(gameState.gridSize, gameState.mode);
        } else {
            loadState();
        }
        
        setupEventListeners();
        drawBoard();
        
        // Browser handles all zoom - no custom zoom needed
        
        // Upload modal reset on open
        if (uploadModal) {
            uploadModal.addEventListener('transitionend', () => {
                if (uploadModal.classList.contains('hidden')) resetUploadModal();
            });
        }
    }



    // --- State Persistence ---
    function saveState() {

        localStorage.setItem('px1rt_gameState', JSON.stringify(gameState));
    }


    function loadState() {
        const savedState = localStorage.getItem('px1rt_gameState');
        if (savedState) {
            gameState = JSON.parse(savedState);
            gameState.selectedPixel = null;
        } else {
            startNewGame(30, 'Creative');
        }
        updateCounterDisplay();
        updateCustomMenuUI();
    }

    // --- Game Setup ---
    function startNewGame(size, mode) {
        gameState.gridSize = size;
        gameState.mode = mode;
        gameState.colorChangesLeft = (mode === 'Survival') ? size : Infinity;
        gameState.selectedPixel = null;
        
        // Reset all timing variables
        pixelSelectionTime = null;
        lastColorChangeTime = null;
        colorChangeAllowed = false;
        clearSelectionTimeout();
        inColorCycle = false;
        

        
        generatePixelboard();
        updateCounterDisplay();
        drawBoard();
        saveState();
        // Always close the Start dropdown menu after starting a new game
        if (startMenuContainer) startMenuContainer.classList.remove('active');
        
        // Browser zoom is handled automatically
    }
    
    function generatePixelboard() {
        const baseColor = `hsl(${Math.random() * 360}, 60%, 50%)`;
        gameState.colorPalette = generateColorPalette(baseColor, 5 + Math.floor(Math.random() * 5));
        let percentages = [];
        let remainingPct = 1.0;
        for (let i = 0; i < gameState.colorPalette.length - 1; i++) {
            let pct = Math.random() * remainingPct * 0.7;
            percentages.push(pct);
            remainingPct -= pct;
        }
        percentages.push(remainingPct);
        percentages.sort((a, b) => b - a);
        const totalPixels = gameState.gridSize * gameState.gridSize;
        
        // Calculate color counts based on percentages
        const colorCounts = percentages.map(pct => Math.floor(pct * totalPixels));
        
        let pixelColors = [];
        colorCounts.forEach((count, i) => {
            for (let j = 0; j < count; j++) {
                pixelColors.push(gameState.colorPalette[i]);
            }
        });
        while(pixelColors.length < totalPixels) {
            pixelColors.push(gameState.colorPalette[0]);
        }
        for (let i = pixelColors.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pixelColors[i], pixelColors[j]] = [pixelColors[j], pixelColors[i]];
        }
        if (Math.random() > 0.75) applyFibonacciPattern(pixelColors);
        gameState.grid = [];
        for (let y = 0; y < gameState.gridSize; y++) {
            gameState.grid[y] = [];
            for (let x = 0; x < gameState.gridSize; x++) {
                gameState.grid[y][x] = pixelColors.pop();
            }
        }
    }

    function applyFibonacciPattern(colors) {
        let a = 0, b = 1;
        while(b < colors.length) {
            let temp = colors[b];
            let swapIndex = Math.min(b + 1, colors.length - 1);
            colors[b] = colors[swapIndex];
            colors[swapIndex] = temp;
            [a, b] = [b, a + b];
        }
    }

    function generateColorPalette(baseHsl, count) {
        const palette = [];
        const [h, s, l] = baseHsl.match(/\d+/g).map(Number);
        for (let i = 0; i < count; i++) {
            const newHue = (h + (i * 20) + Math.random() * 10) % 360;
            const newSat = Math.max(20, Math.min(90, s + (Math.random() - 0.5) * 40));
            const newLight = Math.max(30, Math.min(80, l + (Math.random() - 0.5) * 40));
            palette.push(`hsl(${newHue}, ${newSat}%, ${newLight}%)`);
        }
        return palette;
    }

    // --- Upload Game Logic ---
    function resetUploadModal() {
        uploadStep1.classList.remove('hidden');
        uploadStep2.classList.add('hidden');
        imageUploadInput.value = '';
        uploadFeedback.textContent = '';
        uploadImageData = null;
        selectedUploadSize = null;
        selectedUploadMode = null;
        uploadSizeOptions.forEach(btn => btn.classList.remove('selected'));
        uploadModeOptions.forEach(btn => btn.classList.remove('selected'));
        startUploadGameBtn.disabled = true;
    }

    function showUploadStep2() {
        uploadStep1.classList.add('hidden');
        uploadStep2.classList.remove('hidden');
        uploadFeedback.textContent = '';
    }

    function processImageToGrid(img, gridSize) {
        // Draw image to temp canvas, scale to gridSize x gridSize, get color for each cell
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = gridSize;
        tempCanvas.height = gridSize;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0, gridSize, gridSize);
        const imgData = tempCtx.getImageData(0, 0, gridSize, gridSize).data;
        const grid = [];
        for (let y = 0; y < gridSize; y++) {
            grid[y] = [];
            for (let x = 0; x < gridSize; x++) {
                const idx = (y * gridSize + x) * 4;
                const r = imgData[idx];
                const g = imgData[idx + 1];
                const b = imgData[idx + 2];
                grid[y][x] = `rgb(${r},${g},${b})`;
            }
        }
        return grid;
    }

    function startUploadGame() {
        if (!uploadImageData || !selectedUploadSize || !selectedUploadMode) return;
        gameState.gridSize = selectedUploadSize;
        gameState.mode = selectedUploadMode;
        gameState.grid = processImageToGrid(uploadImageData, selectedUploadSize);
        gameState.colorPalette = extractPaletteFromGrid(gameState.grid);
        gameState.selectedPixel = null;
        inColorCycle = false;
        // Set color change limits for Survival mode
        if (selectedUploadMode === 'Survival') {
            gameState.colorChangesLeft = selectedUploadSize;
        } else {
            gameState.colorChangesLeft = Infinity;
        }
        updateCounterDisplay();
        drawBoard();
        saveState();
        uploadModal.classList.add('hidden');
        
        // Browser zoom is handled automatically
    }

    function extractPaletteFromGrid(grid) {
        // Get unique colors, up to 20
        const colorSet = new Set();
        for (let row of grid) for (let c of row) colorSet.add(c);
        return Array.from(colorSet).slice(0, 20);
    }

    // --- Rendering ---
    function drawBoard() {
        let pixelSize;
        let currentCanvas, currentCtx;
        
        if (isMobile()) {
            currentCanvas = mobileCanvas;
            currentCtx = mobileCtx;
            
            // Mobile: calculate pixel size to fill the available height completely
            const container = document.querySelector('.mobile-zoom-container');
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            
            // Calculate pixel size based on both width and height to ensure it fills the space
            const widthBasedSize = Math.floor(containerWidth / gameState.gridSize);
            const heightBasedSize = Math.floor(containerHeight / gameState.gridSize);
            pixelSize = Math.min(widthBasedSize, heightBasedSize);
            
            // Ensure minimum pixel size for visibility and quality
            pixelSize = Math.max(pixelSize, 3);
            
            // Set canvas size to fill the container completely
            currentCanvas.width = pixelSize * gameState.gridSize;
            currentCanvas.height = pixelSize * gameState.gridSize;
            
            // Set canvas size
            currentCanvas.style.width = currentCanvas.width + 'px';
            currentCanvas.style.height = currentCanvas.height + 'px';
            
            // Improve pixel quality with better rendering settings
            currentCtx.imageSmoothingEnabled = false; // Disable anti-aliasing for crisp pixels
            currentCtx.imageSmoothingQuality = 'high';
        } else {
            currentCanvas = canvas;
            currentCtx = ctx;
            
            // PC: calculate pixel size to fit exactly in 600px
            pixelSize = 600 / gameState.gridSize;
            currentCanvas.width = 600;
            currentCanvas.height = 600;
            
            // Improve pixel quality for PC as well
            currentCtx.imageSmoothingEnabled = false;
            currentCtx.imageSmoothingQuality = 'high';
        }
        
        currentCtx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
        
        for (let y = 0; y < gameState.gridSize; y++) {
            for (let x = 0; x < gameState.gridSize; x++) {
                currentCtx.fillStyle = gameState.grid[y][x];
                // Use Math.floor and Math.ceil to ensure pixels align properly
                const pixelX = Math.floor(x * pixelSize);
                const pixelY = Math.floor(y * pixelSize);
                const pixelWidth = Math.floor((x + 1) * pixelSize) - pixelX;
                const pixelHeight = Math.floor((y + 1) * pixelSize) - pixelY;
                currentCtx.fillRect(pixelX, pixelY, pixelWidth, pixelHeight);
            }
        }
        
        if (gameState.selectedPixel) {
            currentCtx.strokeStyle = '#FFFFFF';
            currentCtx.lineWidth = Math.max(1, Math.floor(pixelSize / 10));
            
            const selX = gameState.selectedPixel.x;
            const selY = gameState.selectedPixel.y;
            const pixelX = Math.floor(selX * pixelSize);
            const pixelY = Math.floor(selY * pixelSize);
            const pixelWidth = Math.floor((selX + 1) * pixelSize) - pixelX;
            const pixelHeight = Math.floor((selY + 1) * pixelSize) - pixelY;
            
            currentCtx.strokeRect(
                pixelX + currentCtx.lineWidth / 2,
                pixelY + currentCtx.lineWidth / 2,
                pixelWidth - currentCtx.lineWidth,
                pixelHeight - currentCtx.lineWidth
            );
        }
    }

    function updateCounterDisplay() {
        counterDisplay.textContent = (gameState.mode === 'Creative') ? "Changes: ∞" : `Changes: ${gameState.colorChangesLeft}`;
    }

    // Show save confirmation dialog
    function showSaveConfirmation(onConfirm) {
        // If there's no active game or no changes, just run the callback
        if (!gameState || gameState.moves === 0) {
            onConfirm();
            return;
        }
        
        // Store the callback to run after user makes a choice
        pendingNewGameSettings = onConfirm;
        
        // Show the save confirmation modal
        saveConfirmModal.classList.remove('hidden');
    }
    
    // Show export modal with optional callback
    function showExportModal(withWatermark, callback) {
        const onExportComplete = (watermark) => {
            exportBoard(watermark);
            if (callback) callback();
        };
        
        exportModal.classList.remove('hidden');
        
        // Set up one-time event listeners for the export buttons
        const exportHandler = (watermark) => {
            exportYesBtn.removeEventListener('click', exportYesHandler);
            exportNoBtn.removeEventListener('click', exportNoHandler);
            onExportComplete(watermark);
            exportModal.classList.add('hidden');
        };
        
        const exportYesHandler = () => exportHandler(true);
        const exportNoHandler = () => exportHandler(false);
        
        exportYesBtn.addEventListener('click', exportYesHandler);
        exportNoBtn.addEventListener('click', exportNoHandler);
    }
    
    // --- Event Listeners and Interaction ---
    function setupEventListeners() {
        // Menu Dropdown Logic
        const menuLabel = startMenuContainer.querySelector('.menu-label');
        
        // Toggle menu when clicking the menu label
        if (menuLabel) {
            menuLabel.addEventListener('click', (e) => {
                e.stopPropagation();
                startMenuContainer.classList.toggle('active');
            });
        }
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!startMenuContainer.contains(e.target)) {
                startMenuContainer.classList.remove('active');
            }
        });
        
        // Prevent clicks inside dropdown from closing it
        const dropdown = document.getElementById('start-dropdown');
        if (dropdown) {
            dropdown.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        
        // Custom modal logic
        if (customGameBtn) {
            customGameBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (customModal) {
                    customModal.classList.remove('hidden');
                    startMenuContainer.classList.remove('active');
                    resetCustomModal();
                }
            });
        }
        if (closeCustomModalBtn) {
            closeCustomModalBtn.addEventListener('click', () => customModal.classList.add('hidden'));
        }
        if (customModal) {
            customModal.addEventListener('click', (e) => {
                if (e.target === customModal) customModal.classList.add('hidden');
            });
        }
        // Custom modal size selection
        customSizeOptions.forEach(btn => {
            btn.addEventListener('click', () => {
                customSizeOptions.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedCustomSize = parseInt(btn.dataset.size);
                startCustomModalGameBtn.disabled = !(selectedCustomSize && selectedCustomMode);
            });
        });
        // Custom modal mode selection
        customModeOptions.forEach(btn => {
            btn.addEventListener('click', () => {
                customModeOptions.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedCustomMode = btn.dataset.mode;
                startCustomModalGameBtn.disabled = !(selectedCustomSize && selectedCustomMode);
            });
        });
        // Start game from custom modal
        if (startCustomModalGameBtn) {
            startCustomModalGameBtn.addEventListener('click', () => {
                if (selectedCustomSize && selectedCustomMode) {
                    startNewGame(selectedCustomSize, selectedCustomMode);
                    customModal.classList.add('hidden');
                }
            });
        }

        // Close save confirm modal
        closeSaveConfirmModalBtn.addEventListener('click', () => {
            saveConfirmModal.classList.add('hidden');
            pendingNewGameSettings = null;
        });
        
        // Save confirm yes - show export options
        saveConfirmYesBtn.addEventListener('click', () => {
            saveConfirmModal.classList.add('hidden');
            // Show export modal with a callback to start new game after export
            showExportModal(true, () => {
                if (pendingNewGameSettings) {
                    pendingNewGameSettings();
                    pendingNewGameSettings = null;
                }
            });
        });
        
        // Save confirm no - just start new game
        saveConfirmNoBtn.addEventListener('click', () => {
            saveConfirmModal.classList.add('hidden');
            if (pendingNewGameSettings) {
                pendingNewGameSettings();
                pendingNewGameSettings = null;
            }
        });
        
        // New Game button
        newGameBtn.addEventListener('click', () => {
            showSaveConfirmation(() => {
                startNewGame(30, 'Creative');
            });
            startMenuContainer.classList.remove('active');
        });
        
        // Upload menu logic
        if (uploadGameBtn) {
            uploadGameBtn.addEventListener('click', () => {
                uploadModal.classList.remove('hidden');
                resetUploadModal();
                startMenuContainer.classList.remove('active');
            });
        }
        if (closeUploadModalBtn) {
            closeUploadModalBtn.addEventListener('click', () => uploadModal.classList.add('hidden'));
        }
        if (uploadModal) {
            uploadModal.addEventListener('click', (e) => {
                if (e.target === uploadModal) uploadModal.classList.add('hidden');
            });
        }
        if (imageUploadInput) {
            imageUploadInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (!file.type.startsWith('image/')) {
                    uploadFeedback.textContent = 'Invalid file type.';
                    return;
                }
                uploadFeedback.textContent = 'Uploading...';
                const reader = new FileReader();
                reader.onload = function(ev) {
                    const img = new window.Image();
                    img.onload = function() {
                        uploadImageData = img;
                        uploadFeedback.textContent = 'Processing image...';
                        setTimeout(() => {
                            showUploadStep2();
                        }, 400);
                    };
                    img.onerror = function() {
                        uploadFeedback.textContent = 'Could not load image.';
                    };
                    img.src = ev.target.result;
                };
                reader.onerror = function() {
                    uploadFeedback.textContent = 'Error reading file.';
                };
                reader.readAsDataURL(file);
            });
        }
        // Upload step 2: grid size selection
        uploadSizeOptions.forEach(btn => {
            btn.addEventListener('click', () => {
                uploadSizeOptions.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedUploadSize = parseInt(btn.dataset.size);
                startUploadGameBtn.disabled = !(selectedUploadSize && selectedUploadMode);
            });
        });
        // Upload step 2: mode selection
        uploadModeOptions.forEach(btn => {
            btn.addEventListener('click', () => {
                uploadModeOptions.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedUploadMode = btn.dataset.mode;
                startUploadGameBtn.disabled = !(selectedUploadSize && selectedUploadMode);
            });
        });
        // Start game from upload
        if (startUploadGameBtn) {
            startUploadGameBtn.addEventListener('click', startUploadGame);
        }

        // Canvas Clicks - handle both mouse and touch
        if (isMobile()) {
            // Mobile: use touch events
            mobileCanvas.addEventListener('touchstart', handleCanvasTouch, { passive: false });
            mobileCanvas.addEventListener('touchend', handleCanvasTouchEnd, { passive: false });
        } else {
            // PC: use mouse events
            canvas.addEventListener('click', handleCanvasClick);
        }

        // About modal logic
        if (aboutMenu) {
            aboutMenu.addEventListener('click', () => {
                aboutModal.classList.remove('hidden');
            });
        }
        if (closeAboutModalBtn) {
            closeAboutModalBtn.addEventListener('click', () => aboutModal.classList.add('hidden'));
        }
        if (aboutModal) {
            aboutModal.addEventListener('click', (e) => {
                if (e.target === aboutModal) aboutModal.classList.add('hidden');
            });
        }
        // Music toggle logic (ensure user interaction triggers play)
        if (musicToggle) {
            musicToggle.addEventListener('click', () => {
                // On first interaction, load and play if not already loaded
                if (backgroundMusic.src !== MUSIC_FILE_PATH) {
                    backgroundMusic.src = MUSIC_FILE_PATH;
                }
                toggleMusic();
            });
        }
        // Export modal logic
        if (exportBtn) {
            exportBtn.addEventListener('click', () => exportModal.classList.remove('hidden'));
        }
        if (closeExportModalBtn) {
            closeExportModalBtn.addEventListener('click', () => exportModal.classList.add('hidden'));
        }
        if (exportModal) {
            exportModal.addEventListener('click', (e) => {
                if (e.target === exportModal) exportModal.classList.add('hidden');
            });
        }
        if (exportYesBtn) {
            exportYesBtn.addEventListener('click', () => {
                exportModal.classList.add('hidden');
                exportBoard(true);
            });
        }
        if (exportNoBtn) {
            exportNoBtn.addEventListener('click', () => {
                exportModal.classList.add('hidden');
                exportBoard(false);
            });
        }
        if (closeExportModalBtn) {
            closeExportModalBtn.addEventListener('click', () => {
                exportModal.classList.add('hidden');
            });
        }
        
        // Handle window resize for mobile
        window.addEventListener('resize', () => {
            if (isMobile()) {
                drawBoard();
            }
        });
        
        // Handle orientation change for mobile
        window.addEventListener('orientationchange', () => {
            if (isMobile()) {
                setTimeout(() => {
                    drawBoard();
                }, 100);
            }
        });
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            
        });
    }
    
    // --- MOBILE TOUCH HANDLING ---
    function handleCanvasTouch(event) {
        // Simple touch handling - browser handles zoom
        if (event.touches.length > 1) {
            return; // Let browser handle multi-touch zoom
        }
        
        const touch = event.touches[0];
        const rect = mobileCanvas.getBoundingClientRect();
        
        // Calculate scaling between display size and internal canvas size
        const scaleX = mobileCanvas.width / rect.width;
        const scaleY = mobileCanvas.height / rect.height;
        const pixelSize = mobileCanvas.width / gameState.gridSize;
        
        // Calculate touch position relative to canvas internal coordinates
        const canvasX = (touch.clientX - rect.left) * scaleX;
        const canvasY = (touch.clientY - rect.top) * scaleY;
        
        const pixelX = Math.floor(canvasX / pixelSize);
        const pixelY = Math.floor(canvasY / pixelSize);
        
        // Check bounds
        if (pixelX < 0 || pixelX >= gameState.gridSize || pixelY < 0 || pixelY >= gameState.gridSize) {
            return;
        }
        
        const currentPixel = { x: pixelX, y: pixelY };

        clearTimeout(clickTimeout);
        
        // Check if clicking the SAME selected pixel after 3 seconds - should deselect
        // Different pixels can ALWAYS be swapped regardless of time
        if (gameState.selectedPixel && 
            gameState.selectedPixel.x === pixelX && 
            gameState.selectedPixel.y === pixelY) {
            
            const currentTime = Date.now();
            const timeSinceSelection = currentTime - pixelSelectionTime;
            const timeSinceLastColorChange = lastColorChangeTime ? currentTime - lastColorChangeTime : Infinity;
            const timeSinceLastInteraction = Math.min(timeSinceSelection, timeSinceLastColorChange);
            
            if (timeSinceLastInteraction > 3000) {
                // More than 3 seconds - deselect instead of color cycling
                gameState.selectedPixel = null;
                pixelSelectionTime = null;
                lastColorChangeTime = null;
                colorChangeAllowed = false;
                inColorCycle = false;
                lastClickedPixel = null; // Clear so pixel can be selected again
                clearSelectionTimeout();
                drawBoard();
                return;
            }
        }
        
        if (lastClickedPixel && lastClickedPixel.x === pixelX && lastClickedPixel.y === pixelY) {
            cyclePixelColor(pixelX, pixelY);
        } else {
            inColorCycle = false;
            clickTimeout = setTimeout(() => handleSingleClick(currentPixel), 250);
        }
        lastClickedPixel = currentPixel;
    }
    
    function handleCanvasTouchEnd(event) {
        // Touch ended - browser handles everything
    }
    
    function handleCustomGameStart() {
        const selectedSize = document.querySelector('.size-option.selected')?.dataset.size || gameState.gridSize;
        const selectedMode = document.querySelector('.mode-option.selected')?.dataset.mode || gameState.mode;
        startNewGame(parseInt(selectedSize), selectedMode);
    }
    
    function updateCustomMenuUI() {
        // This function is no longer needed as Custom modal handles size/mode selection
    }

    function handleCanvasClick(event) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const pixelSize = canvas.width / gameState.gridSize;
        
        // Calculate mouse position relative to canvas internal coordinates
        const canvasX = (event.clientX - rect.left) * scaleX;
        const canvasY = (event.clientY - rect.top) * scaleY;
        
        const x = Math.floor(canvasX / pixelSize);
        const y = Math.floor(canvasY / pixelSize);
        
        // Ensure coordinates are within grid bounds
        if (x < 0 || x >= gameState.gridSize || y < 0 || y >= gameState.gridSize) {
            return;
        }
        
        const currentPixel = { x, y };

        clearTimeout(clickTimeout);
        
        // Check if clicking the SAME selected pixel after 3 seconds - should deselect
        // Different pixels can ALWAYS be swapped regardless of time
        if (gameState.selectedPixel && 
            gameState.selectedPixel.x === x && 
            gameState.selectedPixel.y === y) {
            
            const currentTime = Date.now();
            const timeSinceSelection = currentTime - pixelSelectionTime;
            const timeSinceLastColorChange = lastColorChangeTime ? currentTime - lastColorChangeTime : Infinity;
            const timeSinceLastInteraction = Math.min(timeSinceSelection, timeSinceLastColorChange);
            
            if (timeSinceLastInteraction > 3000) {
                // More than 3 seconds - deselect instead of color cycling
                gameState.selectedPixel = null;
                pixelSelectionTime = null;
                lastColorChangeTime = null;
                colorChangeAllowed = false;
                inColorCycle = false;
                lastClickedPixel = null; // Clear so pixel can be selected again
                clearSelectionTimeout();
                drawBoard();
                return;
            }
        }
        
        if (lastClickedPixel && lastClickedPixel.x === x && lastClickedPixel.y === y) {
            cyclePixelColor(x, y);
        } else {
            inColorCycle = false;
            clickTimeout = setTimeout(() => handleSingleClick(currentPixel), 250);
        }
        lastClickedPixel = currentPixel;
    }
    
    function handleSingleClick(pixelCoords) {
        // Only block if we're trying to select the same pixel that's in color cycle
        if (inColorCycle && gameState.selectedPixel && 
            gameState.selectedPixel.x === pixelCoords.x && 
            gameState.selectedPixel.y === pixelCoords.y) {
            return;
        }
        
        const currentTime = Date.now();
        
        // If we have a selected pixel but it's been auto-deselected, reset everything
        // BUT only if we're clicking the SAME pixel - different pixels should still swap
        if (gameState.selectedPixel && !colorChangeAllowed && 
            gameState.selectedPixel.x === pixelCoords.x && 
            gameState.selectedPixel.y === pixelCoords.y) {
            gameState.selectedPixel = null;
            pixelSelectionTime = null;
            lastColorChangeTime = null;
            inColorCycle = false;
            clearSelectionTimeout();
        }
        
        if (!gameState.selectedPixel) {
            // First time selecting this pixel
            gameState.selectedPixel = pixelCoords;
            pixelSelectionTime = currentTime;
            colorChangeAllowed = true;
            lastColorChangeTime = null;
            inColorCycle = false; // Reset color cycle state for new selection
            
            // Start 3-second timer for color change window
            clearSelectionTimeout();
            selectionTimeout = setTimeout(() => {
                colorChangeAllowed = false;
            }, 3000);
            
        } else {
            if (gameState.selectedPixel.x === pixelCoords.x && gameState.selectedPixel.y === pixelCoords.y) {
                // Clicking the same selected pixel
                const timeSinceSelection = currentTime - pixelSelectionTime;
                const timeSinceLastColorChange = lastColorChangeTime ? currentTime - lastColorChangeTime : Infinity;
                
                // Find the most recent interaction time
                const timeSinceLastInteraction = Math.min(timeSinceSelection, timeSinceLastColorChange);
                
                if (timeSinceLastInteraction > 3000) {
                    // More than 3 seconds since last interaction - deselect
                    gameState.selectedPixel = null;
                    pixelSelectionTime = null;
                    lastColorChangeTime = null;
                    colorChangeAllowed = false;
                    inColorCycle = false; // Reset color cycle state
                    lastClickedPixel = null; // Clear so pixel can be selected again
                    clearSelectionTimeout();
                } else {
                    // Within 3 seconds - this will be handled by double-click detection
                    // Do nothing here, let the double-click handler manage color changes
                }
            } else {
                // Clicking a different pixel - swap colors
                swapPixels(gameState.selectedPixel, pixelCoords);
                gameState.selectedPixel = null;
                pixelSelectionTime = null;
                lastColorChangeTime = null;
                colorChangeAllowed = false;
                inColorCycle = false; // Reset color cycle state
                lastClickedPixel = null; // Clear so swapped pixels can be selected again
                clearTimeout(clickTimeout); // Clear any pending click timeouts
                clearSelectionTimeout();
                saveState();
            }
        }
        drawBoard();
    }
    
    function cyclePixelColor(x, y) {
        // Check if color changes are allowed based on timing
        if (!colorChangeAllowed) return;
        
        if (gameState.mode === 'Survival' && gameState.colorChangesLeft <= 0 && !inColorCycle) return;
        
        const currentTime = Date.now();
        
        if (!inColorCycle) {
            if (gameState.mode === 'Survival') gameState.colorChangesLeft--;
            inColorCycle = true;
        }
        
        const currentColor = gameState.grid[y][x];
        const currentIndex = gameState.colorPalette.indexOf(currentColor);
        const nextIndex = (currentIndex + 1) % gameState.colorPalette.length;
        gameState.grid[y][x] = gameState.colorPalette[nextIndex];
        
        // Update timing for color change
        lastColorChangeTime = currentTime;
        
        updateCounterDisplay();
        drawBoard();
        saveState();
        
        // Start 2-second timer to finalize color and deselect
        clearSelectionTimeout();
        selectionTimeout = setTimeout(() => {
            // Finalize color and deselect pixel
            gameState.selectedPixel = null;
            pixelSelectionTime = null;
            lastColorChangeTime = null;
            colorChangeAllowed = false;
            inColorCycle = false;
            lastClickedPixel = null; // Clear this so pixel can be selected again
            drawBoard();
        }, 2000);
    }
    

    
    function clearSelectionTimeout() {
        clearTimeout(selectionTimeout);
        selectionTimeout = null;
    }
    
    function swapPixels(p1, p2) {
        const tempColor = gameState.grid[p1.y][p1.x];
        gameState.grid[p1.y][p1.x] = gameState.grid[p2.y][p2.x];
        gameState.grid[p2.y][p2.x] = tempColor;
    }

    function updateMusicToggleDisplay() {
        if (isMusicPlaying) {
            speakerOnIcon.classList.remove('hidden');
            speakerOffIcon.classList.add('hidden');
        } else {
            speakerOnIcon.classList.add('hidden');
            speakerOffIcon.classList.remove('hidden');
        }
    }

    function toggleMusic() {
        if (!isMusicPlaying) {
            // Unmute and play
            backgroundMusic.muted = false;
            isMusicPlaying = true;
            const playPromise = backgroundMusic.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Audio play failed:", error);
                    // If autoplay was prevented, show a message to the user
                    alert('Please interact with the page first to enable audio, then click the music button again.');
                    isMusicPlaying = false;
                    return;
                });
            }
            speakerOnIcon.classList.remove('hidden');
            speakerOffIcon.classList.add('hidden');
        } else {
            // Mute and pause
            backgroundMusic.muted = true;
            backgroundMusic.pause();
            isMusicPlaying = false;
            speakerOnIcon.classList.add('hidden');
            speakerOffIcon.classList.remove('hidden');
        }
    }
    
    function exportBoard(withWatermark = false) {
        // Use the correct canvas based on device type
        const activeCanvas = isMobile() ? mobileCanvas : canvas;
        
        return new Promise((resolve) => {
            if (withWatermark) {
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                tempCanvas.width = activeCanvas.width;
                tempCanvas.height = activeCanvas.height;

                // Draw the original canvas content
                tempCtx.drawImage(activeCanvas, 0, 0);

                // Add watermark image
                const watermarkImg = new Image();
                watermarkImg.crossOrigin = 'anonymous';
                watermarkImg.onload = function() {
                    // Calculate watermark size (proportional to canvas size)
                    const maxWatermarkSize = Math.min(activeCanvas.width / 8, activeCanvas.height / 8);
                    const aspectRatio = watermarkImg.width / watermarkImg.height;
                    let watermarkWidth = maxWatermarkSize;
                    let watermarkHeight = maxWatermarkSize / aspectRatio;
                    
                    // If height is too large, scale based on height instead
                    if (watermarkHeight > maxWatermarkSize) {
                        watermarkHeight = maxWatermarkSize;
                        watermarkWidth = maxWatermarkSize * aspectRatio;
                    }
                    
                    // Position in bottom right corner with some padding
                    const padding = 5;
                    const x = tempCanvas.width - watermarkWidth - padding;
                    const y = tempCanvas.height - watermarkHeight - padding;
                    
                    // Draw watermark with slight transparency
                    tempCtx.globalAlpha = 0.8;
                    tempCtx.drawImage(watermarkImg, x, y, watermarkWidth, watermarkHeight);
                    tempCtx.globalAlpha = 1.0; // Reset alpha
                    
                    // Download the image after watermark is added
                    const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
                    const link = document.createElement('a');
                    link.download = `px1rt_board_${timestamp}.png`;
                    link.href = tempCanvas.toDataURL('image/png');
                    link.click();
                    resolve();
                };
                watermarkImg.onerror = function() {
                    // If watermark fails to load, just export without it
                    console.error('Failed to load watermark');
                    downloadCanvas(activeCanvas);
                    resolve();
                };
                watermarkImg.src = 'watermark.png';
            } else {
                // Download without watermark
                downloadCanvas(activeCanvas);
                resolve();
            }
        });
        
        function downloadCanvas(canvas) {
            const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
            const link = document.createElement('a');
            link.download = `px1rt_board_${timestamp}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    }

    function resetCustomModal() {
        selectedCustomSize = null;
        selectedCustomMode = null;
        customSizeOptions.forEach(btn => btn.classList.remove('selected'));
        customModeOptions.forEach(btn => btn.classList.remove('selected'));
        startCustomModalGameBtn.disabled = true;
    }

    init();
});
