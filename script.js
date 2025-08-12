(function() {
  const doc = document.documentElement;
  const body = document.body;
  const themeBtn = document.getElementById('themeToggle');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const yearEl = document.getElementById('year');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const storageKey = 'loon-theme';

  yearEl && (yearEl.textContent = new Date().getFullYear());

  function applyTheme(mode) {
    if (mode === 'dark') {
      body.classList.add('dark');
    } else {
      body.classList.remove('dark');
    }
  }

  function initTheme() {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      applyTheme(saved);
      return;
    }
    applyTheme(prefersDark.matches ? 'dark' : 'light');
  }

  initTheme();

  themeBtn?.addEventListener('click', () => {
    const isDark = body.classList.contains('dark');
    const newMode = isDark ? 'light' : 'dark';
    localStorage.setItem(storageKey, newMode);
    applyTheme(newMode);
  });

  prefersDark.addEventListener('change', (e) => {
    if (!localStorage.getItem(storageKey)) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });

  navToggle?.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    navMenu.dataset.open = !expanded;
  });

  document.addEventListener('click', (e) => {
    if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
      navToggle.setAttribute('aria-expanded', 'false');
      navMenu.dataset.open = false;
    }
  });

  // Smooth close nav on link click (mobile)
  navMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navToggle.setAttribute('aria-expanded', 'false');
      navMenu.dataset.open = false;
    });
  });

  // Copy snippet
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const selector = btn.getAttribute('data-copy');
      const el = document.querySelector(selector);
      if (!el) return;
      const code = el.innerText.replace(/^\n+|\n+$/g, '');
      navigator.clipboard.writeText(code).then(() => {
        const original = btn.textContent;
        btn.textContent = 'Copiado';
        btn.disabled = true;
        setTimeout(() => {
          btn.textContent = original;
          btn.disabled = false;
        }, 1800);
      });
    });
  });

  // Fake form send
  window.fakeSend = function(form) {
    const status = form.querySelector('.form-status');
    status.textContent = 'Enviando...';
    setTimeout(() => {
      status.textContent = 'Mensaje enviado (demo). ¡Gracias!';
      form.reset();
    }, 1100);
  };

  // Reduce motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.orb, .pulse, .scroll-indicator span').forEach(el => {
      el.style.animation = 'none';
    });
  }
})();