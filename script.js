/* Retro interactions */
(function() {
  const typeLine = document.getElementById('typeLine');
  const fullText = typeLine?.dataset.text || "";
  let idx = 0;
  const speed = 24; // ms per char
  function type() {
    if (!typeLine) return;
    typeLine.textContent = fullText.slice(0, idx) + (idx % 2 === 0 ? "▌" : " ");
    idx++;
    if (idx <= fullText.length) {
      setTimeout(type, speed + Math.random()*40);
    } else {
      typeLine.textContent = fullText; // final
    }
  }
  setTimeout(type, 300);

  // Tabs
  const tabs = document.querySelectorAll('.tab-bar .tab');
  const slider = document.querySelector('.tab-bar .slider');
  const panes = {
    tech: document.getElementById('pane-tech'),
    social: document.getElementById('pane-social')
  };
  function activate(tab) {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const name = tab.dataset.tab;
    Object.entries(panes).forEach(([k, el])=>{
      el.classList.toggle('active', k === name);
    });
    if (slider) {
      const parent = tab.parentElement;
      const idx = Array.from(parent.children).filter(n => n.classList.contains('tab')).indexOf(tab);
      slider.style.left = (idx * 50) + '%';
    }
  }
  tabs.forEach(t => t.addEventListener('click', () => activate(t)));

  // Theme flip (dark/light)
  const flipBtn = document.getElementById('flipTheme');
  const body = document.body;
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    body.classList.add('theme-flip');
    setTimeout(()=>body.classList.remove('theme-flip'), 450);
    const label = flipBtn?.querySelector('.theme-name');
    if (label) label.textContent = theme === 'dark' ? 'Dark' : 'Light';
    try { localStorage.setItem('retro-theme', theme); } catch(e){}
  }
  const saved = localStorage.getItem('retro-theme');
  setTheme(saved || 'dark');
  flipBtn?.addEventListener('click', () => {
    setTheme(currentTheme()==='dark' ? 'light':'dark');
  });

  // Scanline toggle
  const scanToggle = document.getElementById('scanToggle');
  scanToggle?.addEventListener('click', ()=>{
    const off = document.body.classList.toggle('no-scan');
    scanToggle.setAttribute('aria-pressed', String(!off));
    scanToggle.textContent = off ? 'CRT Off' : 'CRT';
  });

  // Year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Prefers color scheme sync if no manual choice
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  mq.addEventListener('change', e => {
    if (!localStorage.getItem('retro-theme')) {
      setTheme(e.matches ? 'light' : 'dark');
    }
  });
})();
