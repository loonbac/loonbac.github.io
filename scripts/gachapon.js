/**
 * Gachapon Collection - View Only
 * ================================
 * Script para mostrar la colección de cartas (solo lectura)
 * Sin funciones de editar, mejorar o reciclar
 */

(function () {
    // ==================== API CONFIGURATION ====================
    const API_BASE_URL = 'https://93e9c4be1495.ngrok-free.app';

    const body = document.body;
    const themeBtn = document.getElementById('flipTheme');

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

    // ==================== CARD COLLECTION ====================
    let collectionData = [];

    // Clean data
    function cleanCardData(card) {
        return {
            numero: parseInt(String(card.numero || '0').replace(/[`\s]/g, '') || '0'),
            estrellas: card.estrellas_num || parseInt(String(card.estrellas || '0').replace(/[`\s]/g, '') || '0'),
            tier: String(card.tier || 'E').replace(/[`\s]/g, ''),
            id: card.id_limpio || String(card.id || '').replace(/[`\s]/g, ''),
            serie: card.serie_limpia || card.serie || 'Unknown',
            personaje: String(card.personaje || 'Unknown').replace(/\*+/g, ''),
            imagen: card.imagen || null,
            is_portrait: card.is_portrait || false
        };
    }

    // Calculate stats
    function calculateStats(cards) {
        const series = new Set();
        let fiveStar = 0;
        let fourStar = 0;

        cards.forEach(card => {
            series.add(card.serie);
            if (card.estrellas === 5) fiveStar++;
            if (card.estrellas === 4) fourStar++;
        });

        return {
            total: cards.length,
            fiveStar,
            fourStar,
            uniqueSeries: series.size
        };
    }

    // Update stats display
    function updateStatsDisplay(stats) {
        const totalEl = document.getElementById('totalCards');
        const fiveEl = document.getElementById('fiveStarCards');
        const fourEl = document.getElementById('fourStarCards');
        const seriesEl = document.getElementById('uniqueSeries');

        if (totalEl) totalEl.textContent = stats.total || 0;
        if (fiveEl) fiveEl.textContent = stats.fiveStar || 0;
        if (fourEl) fourEl.textContent = stats.fourStar || 0;
        if (seriesEl) seriesEl.textContent = stats.uniqueSeries || 0;
    }

    // Create star rating
    function createStarRating(stars) {
        let html = '<div class="star-rating">';
        for (let i = 1; i <= 5; i++) {
            html += `<span class="star ${i <= stars ? 'filled' : 'empty'}">★</span>`;
        }
        html += '</div>';
        return html;
    }

    // Create card HTML (VIEW ONLY - no buttons)
    function createCardHTML(card) {
        const portraitClass = card.is_portrait ? 'portrait' : '';
        return `
      <article class="anime-card ${portraitClass}" data-stars="${card.estrellas}" data-series="${card.serie}">
        <figure class="card-image">
          ${card.imagen
                ? `<img data-src="${API_BASE_URL}${card.imagen}" alt="${card.personaje}" loading="lazy">`
                : `<div class="image-placeholder">🎴</div>`
            }
          <span class="tier-badge">Tier ${card.tier}</span>
        </figure>
        <div class="card-body">
          <h3 class="card-character">${card.personaje}</h3>
          <p class="card-series">${card.serie}</p>
          ${createStarRating(card.estrellas)}
          <span class="card-id">#${card.numero} · ID: ${card.id}</span>
        </div>
      </article>
    `;
    }

    // Cargar imágenes con header para ngrok
    async function loadImagesWithHeader() {
        const images = document.querySelectorAll('img[data-src]');
        for (const img of images) {
            const url = img.dataset.src;
            try {
                const response = await fetch(url, {
                    headers: { 'ngrok-skip-browser-warning': 'true' }
                });
                if (response.ok) {
                    const blob = await response.blob();
                    img.src = URL.createObjectURL(blob);
                }
            } catch (e) {
                console.log('Error loading image:', url);
            }
        }
    }

    // Render cards
    function renderCards(cards) {
        const grid = document.getElementById('cardsGrid');
        const countEl = document.getElementById('cardCount');

        if (!grid) return;

        if (cards.length === 0) {
            grid.innerHTML = '<div class="empty-state">No hay cartas que coincidan con los filtros</div>';
            if (countEl) countEl.textContent = '';
            return;
        }

        grid.innerHTML = cards.map(card => createCardHTML(card)).join('');
        if (countEl) countEl.textContent = `(${cards.length})`;

        // Cargar imágenes con header ngrok
        loadImagesWithHeader();
    }

    // Sort cards
    function sortCards(cards, sortBy) {
        const sorted = [...cards];

        switch (sortBy) {
            case 'stars-desc':
                sorted.sort((a, b) => b.estrellas - a.estrellas);
                break;
            case 'stars-asc':
                sorted.sort((a, b) => a.estrellas - b.estrellas);
                break;
            case 'series':
                sorted.sort((a, b) => a.serie.localeCompare(b.serie));
                break;
            case 'character':
                sorted.sort((a, b) => a.personaje.localeCompare(b.personaje));
                break;
        }

        return sorted;
    }

    // Filter cards
    function filterCards(cards, starFilter, seriesFilter) {
        let filtered = cards;

        if (starFilter !== 'all') {
            const stars = parseInt(starFilter);
            filtered = filtered.filter(card => card.estrellas === stars);
        }

        if (seriesFilter !== 'all') {
            filtered = filtered.filter(card => card.serie === seriesFilter);
        }

        return filtered;
    }

    // Populate series dropdown
    function populateSeriesDropdown(cards) {
        const dropdown = document.getElementById('filterSeries');
        if (!dropdown) return;

        const series = [...new Set(cards.map(card => card.serie))].sort();
        const currentValue = dropdown.value;

        dropdown.innerHTML = '<option value="all">Todas las series</option>';
        series.forEach(serie => {
            const option = document.createElement('option');
            option.value = serie;
            option.textContent = serie;
            dropdown.appendChild(option);
        });

        if (currentValue !== 'all' && series.includes(currentValue)) {
            dropdown.value = currentValue;
        }
    }

    // Apply filters and sorting
    function applyFiltersAndSort() {
        const sortBy = document.getElementById('sortBy')?.value || 'stars-desc';
        const filterStars = document.getElementById('filterStars')?.value || 'all';
        const filterSeries = document.getElementById('filterSeries')?.value || 'all';

        let filtered = filterCards(collectionData, filterStars, filterSeries);
        let sorted = sortCards(filtered, sortBy);

        renderCards(sorted);
    }

    // Load collection from API
    async function loadCollection() {
        const grid = document.getElementById('cardsGrid');

        try {
            if (grid) {
                grid.innerHTML = `
          <div class="loading-state">
            <span class="loading-icon">⏳</span>
            <span class="loading-text">Cargando colección...</span>
          </div>
        `;
            }

            const response = await fetch(`${API_BASE_URL}/api/coleccion`, {
                headers: {
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            if (!response.ok) throw new Error('Error al conectar con la API');

            const data = await response.json();
            collectionData = data.map(cleanCardData);

            // Stats
            const stats = calculateStats(collectionData);
            updateStatsDisplay(stats);

            // Populate series filter
            populateSeriesDropdown(collectionData);

            // Render
            applyFiltersAndSort();

        } catch (error) {
            console.error('Error loading collection:', error);
            if (grid) {
                grid.innerHTML = `
          <div class="error-state">
            <div class="error-icon">❌</div>
            <p>Error al cargar la colección</p>
            <p style="font-size: .7rem; opacity: .7">${error.message}</p>
            <p style="font-size: .6rem; opacity: .5; margin-top: 1rem;">
              API: ${API_BASE_URL}
            </p>
          </div>
        `;
            }
        }
    }

    // Event listeners
    document.getElementById('sortBy')?.addEventListener('change', applyFiltersAndSort);
    document.getElementById('filterStars')?.addEventListener('change', applyFiltersAndSort);
    document.getElementById('filterSeries')?.addEventListener('change', applyFiltersAndSort);

    // Initial load
    if (document.getElementById('cardsGrid')) {
        loadCollection();
    }
})();
