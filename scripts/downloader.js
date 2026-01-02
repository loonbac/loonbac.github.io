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
            'twitter': '<svg class="badge-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
            'youtube': '<svg class="badge-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
            'tiktok': '<svg class="badge-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>',
            'instagram': '<svg class="badge-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>',
            'reddit': '<svg class="badge-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>',
            'facebook': '<svg class="badge-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
            'unknown': '<svg class="badge-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>'
        };
        return icons[platform] || icons['unknown'];
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

        // Build formats options
        let formatsHTML = '';
        if (info.formats && info.formats.length > 0) {
            formatsHTML = info.formats.map(f => {
                const quality = f.quality || f.format_note || 'N/A';
                const ext = f.ext || 'mp4';
                const size = f.filesize ? formatFileSize(f.filesize) : '';
                return `<option value="${f.format_id}">${quality} (${ext}) ${size}</option>`;
            }).join('');
        } else {
            formatsHTML = '<option value="best">Mejor calidad disponible</option>';
        }

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
                        ${formatsHTML}
                    </select>
                </div>
                <div class="download-actions">
                    <button class="download-btn" id="downloadBtn">
                        <span class="btn-icon">📥</span>
                        Descargar Video
                    </button>
                </div>
            </div>
        `;

        // Attach download handler
        document.getElementById('downloadBtn').addEventListener('click', handleDownload);
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
        const format = formatSelect?.value || 'best';
        const url = videoUrlInput.value.trim();

        if (!url) return;

        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<span class="btn-icon">⏳</span> Preparando descarga...';

        try {
            // Open download in new tab/trigger download
            const downloadUrl = `${API_BASE_URL}/api/video/download?url=${encodeURIComponent(url)}&format=${encodeURIComponent(format)}`;

            // Create a temporary link to trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            downloadBtn.innerHTML = '<span class="btn-icon">✅</span> Descarga iniciada';

            setTimeout(() => {
                downloadBtn.disabled = false;
                downloadBtn.innerHTML = '<span class="btn-icon">📥</span> Descargar Video';
            }, 3000);

        } catch (error) {
            console.error('Error downloading:', error);
            downloadBtn.innerHTML = '<span class="btn-icon">❌</span> Error';
            setTimeout(() => {
                downloadBtn.disabled = false;
                downloadBtn.innerHTML = '<span class="btn-icon">📥</span> Descargar Video';
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
