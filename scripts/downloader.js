/**
 * Video Downloader - Frontend
 * ===========================
 * Script para descargar videos de múltiples plataformas
 */

(function () {
    // ==================== API CONFIGURATION ====================
    const API_BASE_URL = 'https://api.loonbac-dev.moe';

    // ==================== DOM ELEMENTS ====================
    const body = document.body;
    const themeBtn = document.getElementById('flipTheme');
    const videoUrlInput = document.getElementById('videoUrl');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultPanel = document.getElementById('resultPanel');
    const videoResult = document.getElementById('videoResult');
    const loadingPanel = document.getElementById('loadingPanel');
    const errorPanel = document.getElementById('errorPanel');
    const errorMessage = document.getElementById('errorMessage');

    // ==================== STATE ====================
    let currentVideoInfo = null;

    // ==================== THEME ====================
    function getTheme() {
        return document.documentElement.getAttribute('data-theme') || 'dark';
    }

    function setTheme(t) {
        document.documentElement.setAttribute('data-theme', t);
        body.classList.add('theme-flip');
        setTimeout(() => body.classList.remove('theme-flip'), 450);
        if (themeBtn) {
            const label = themeBtn.querySelector('.theme-name');
            if (label) label.textContent = t === 'dark' ? 'Dark' : 'Light';
        }
        try { localStorage.setItem('retro-theme', t); } catch (e) { }
    }

    const saved = localStorage.getItem('retro-theme');
    setTheme(saved || 'dark');
    themeBtn?.addEventListener('click', () => setTheme(getTheme() === 'dark' ? 'light' : 'dark'));

    // Year
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // ==================== PLATFORM DETECTION ====================
    function detectPlatform(url) {
        const platforms = {
            'twitter': ['twitter.com', 'x.com'],
            'youtube': ['youtube.com', 'youtu.be'],
            'tiktok': ['tiktok.com'],
            'instagram': ['instagram.com'],
            'reddit': ['reddit.com', 'redd.it'],
            'facebook': ['facebook.com', 'fb.watch']
        };

        for (const [platform, domains] of Object.entries(platforms)) {
            for (const domain of domains) {
                if (url.includes(domain)) {
                    return platform;
                }
            }
        }
        return 'unknown';
    }

    function getPlatformIcon(platform) {
        const icons = {
            'twitter': '🐦',
            'youtube': '▶️',
            'tiktok': '🎵',
            'instagram': '📷',
            'reddit': '🤖',
            'facebook': '📘',
            'unknown': '🎬'
        };
        return icons[platform] || '🎬';
    }

    function getPlatformName(platform) {
        const names = {
            'twitter': 'Twitter/X',
            'youtube': 'YouTube',
            'tiktok': 'TikTok',
            'instagram': 'Instagram',
            'reddit': 'Reddit',
            'facebook': 'Facebook',
            'unknown': 'Video'
        };
        return names[platform] || 'Video';
    }

    // ==================== UI FUNCTIONS ====================
    function showLoading() {
        resultPanel.style.display = 'none';
        errorPanel.style.display = 'none';
        loadingPanel.style.display = 'block';
        analyzeBtn.disabled = true;
    }

    function hideLoading() {
        loadingPanel.style.display = 'none';
        analyzeBtn.disabled = false;
    }

    function showError(message) {
        hideLoading();
        resultPanel.style.display = 'none';
        errorPanel.style.display = 'block';
        errorMessage.textContent = message;
    }

    function showResult(info) {
        hideLoading();
        errorPanel.style.display = 'none';
        resultPanel.style.display = 'block';
        currentVideoInfo = info;
        renderVideoInfo(info);
    }

    function formatDuration(seconds) {
        if (!seconds || seconds === 0) return 'N/A';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function formatFileSize(bytes) {
        if (!bytes) return 'N/A';
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(1)} MB`;
    }

    function renderVideoInfo(info) {
        const platform = detectPlatform(info.url || videoUrlInput.value);
        const platformIcon = getPlatformIcon(platform);
        const platformName = getPlatformName(platform);
        const isYouTube = info.is_youtube || false;

        // Build video formats options
        let formatsHTML = '';
        if (info.formats && info.formats.length > 0) {
            formatsHTML = info.formats.map(f => {
                const quality = f.quality || f.format_note || 'N/A';
                const ext = f.ext || 'mp4';
                const size = f.filesize ? formatFileSize(f.filesize) : '';
                return `<option value="${f.format_id}" data-type="video">${quality} (${ext}) ${size}</option>`;
            }).join('');
        } else {
            formatsHTML = '<option value="best" data-type="video">Mejor calidad disponible</option>';
        }

        // Build audio formats for YouTube
        let audioFormatsHTML = '';
        if (isYouTube && info.audio_formats && info.audio_formats.length > 0) {
            audioFormatsHTML = info.audio_formats.map(f => {
                return `<option value="${f.format_id}" data-type="audio">🎵 ${f.description || f.quality}</option>`;
            }).join('');
        }

        // Combine formats
        const allFormatsHTML = isYouTube && audioFormatsHTML
            ? `<optgroup label="📹 Video">${formatsHTML}</optgroup><optgroup label="🎵 Audio (MP3)">${audioFormatsHTML}</optgroup>`
            : formatsHTML;

        videoResult.innerHTML = `
            <div class="video-preview">
                <img src="${info.thumbnail || 'img/ico.png'}" alt="Thumbnail" onerror="this.src='img/ico.png'">
                <span class="platform-badge">${platformIcon} ${platformName}</span>
            </div>
            <div class="video-info">
                <h3 class="video-title">${info.title || 'Video sin título'}</h3>
                <div class="video-meta">
                    <div class="meta-item">
                        <span class="meta-icon">⏱️</span>
                        <span class="meta-label">Duración:</span>
                        <span class="meta-value">${formatDuration(info.duration)}</span>
                    </div>
                    ${info.uploader ? `
                    <div class="meta-item">
                        <span class="meta-icon">👤</span>
                        <span class="meta-label">Autor:</span>
                        <span class="meta-value">${info.uploader}</span>
                    </div>
                    ` : ''}
                </div>
                <div class="format-section">
                    <label class="format-label" for="formatSelect">Formato:</label>
                    <select id="formatSelect" class="format-select">
                        ${allFormatsHTML}
                    </select>
                </div>
                <div class="download-actions">
                    <button class="download-btn" id="downloadBtn">
                        <span class="btn-icon">📥</span>
                        <span id="downloadBtnText">Descargar Video</span>
                    </button>
                </div>
            </div>
        `;

        // Attach download handler
        document.getElementById('downloadBtn').addEventListener('click', handleDownload);
        
        // Update button text based on selection
        const formatSelect = document.getElementById('formatSelect');
        const downloadBtnText = document.getElementById('downloadBtnText');
        
        formatSelect.addEventListener('change', () => {
            const selectedOption = formatSelect.options[formatSelect.selectedIndex];
            const type = selectedOption.getAttribute('data-type');
            if (type === 'audio') {
                downloadBtnText.textContent = 'Descargar Audio (MP3)';
            } else {
                downloadBtnText.textContent = 'Descargar Video';
            }
        });
    }

    // ==================== API FUNCTIONS ====================
    async function analyzeVideo() {
        const url = videoUrlInput.value.trim();

        if (!url) {
            showError('Por favor, ingresa una URL de video');
            return;
        }

        // Validate URL
        try {
            new URL(url);
        } catch {
            showError('URL inválida. Ingresa una URL válida');
            return;
        }

        showLoading();

        try {
            const response = await fetch(`${API_BASE_URL}/api/video/info?url=${encodeURIComponent(url)}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Error ${response.status}`);
            }

            const data = await response.json();
            data.url = url;
            showResult(data);

        } catch (error) {
            console.error('Error analyzing video:', error);
            showError(error.message || 'Error al analizar el video');
        }
    }

    async function handleDownload() {
        const formatSelect = document.getElementById('formatSelect');
        const downloadBtn = document.getElementById('downloadBtn');
        const downloadBtnText = document.getElementById('downloadBtnText');
        const format = formatSelect?.value || 'best';
        const url = videoUrlInput.value.trim();

        if (!url) return;

        // Determine download type
        const selectedOption = formatSelect.options[formatSelect.selectedIndex];
        const type = selectedOption.getAttribute('data-type') || 'video';

        downloadBtn.disabled = true;
        downloadBtnText.textContent = type === 'audio' ? 'Preparando audio...' : 'Preparando descarga...';

        try {
            // Open download in new tab/trigger download
            const downloadUrl = `${API_BASE_URL}/api/video/download?url=${encodeURIComponent(url)}&format=${encodeURIComponent(format)}&type=${type}`;

            // Create a temporary link to trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            downloadBtnText.textContent = 'Descarga iniciada';

            setTimeout(() => {
                downloadBtn.disabled = false;
                downloadBtnText.textContent = type === 'audio' ? 'Descargar Audio (MP3)' : 'Descargar Video';
            }, 3000);

        } catch (error) {
            console.error('Error downloading:', error);
            downloadBtnText.textContent = 'Error';
            setTimeout(() => {
                downloadBtn.disabled = false;
                downloadBtnText.textContent = type === 'audio' ? 'Descargar Audio (MP3)' : 'Descargar Video';
            }, 2000);
        }
    }

    // ==================== EVENT LISTENERS ====================
    analyzeBtn?.addEventListener('click', analyzeVideo);

    videoUrlInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            analyzeVideo();
        }
    });

    // Auto-paste from clipboard on focus (optional UX improvement)
    videoUrlInput?.addEventListener('focus', async () => {
        if (!videoUrlInput.value && navigator.clipboard) {
            try {
                const text = await navigator.clipboard.readText();
                if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
                    // Check if it's a video URL
                    const platform = detectPlatform(text);
                    if (platform !== 'unknown') {
                        videoUrlInput.value = text;
                        videoUrlInput.select();
                    }
                }
            } catch {
                // Clipboard access denied, ignore
            }
        }
    });

})();
