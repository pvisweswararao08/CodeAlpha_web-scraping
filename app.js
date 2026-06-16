/* ================================================================
   BookVault — app.js  (clean rewrite)
================================================================ */
'use strict';

// ── Apply saved theme BEFORE paint to avoid flash ────────────
(function() {
  const saved = localStorage.getItem('bv-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
})();

// Hide scroll-reveal elements immediately to prevent flash of content (progressive enhancement)
document.querySelectorAll('.scroll-reveal').forEach(sec => sec.classList.add('scroll-hidden'));

const PER_PAGE = 24;
let allBooks   = [];
let filtered   = [];
let page       = 1;
let isListMode = false;
let isShelfMode = false;

const STARS = ['','⭐','⭐⭐','⭐⭐⭐','⭐⭐⭐⭐','⭐⭐⭐⭐⭐'];
const STAR_LABELS = ['','★','★★','★★★','★★★★','★★★★★'];

// ── Boot ─────────────────────────────────────────────────────
fetch('data.json')
  .then(r => r.json())
  .then(data => {
    allBooks = data.books;
    filtered  = [...allBooks];

    updateHeroStats(data.stats);
    updateMetrics(data.stats);
    updateKPIs(data.stats);
    buildHeroBooks();
    buildFeatured();
    buildGems(data.budget_gems);
    buildCatFilter(data.categories);
    buildCharts(data);
    renderGrid();
    renderPagination();
    attachFilters();
    attachModal();
    attachViewToggle();
    initScrollReveal();
  })
  .catch(err => {
    console.error('data.json failed:', err);
    const g = document.getElementById('bookGrid');
    if (g) g.innerHTML = `<p style="color:#f87171;text-align:center;padding:3rem;grid-column:1/-1">
      Could not load data.json. Make sure the server is running.<br/>
      <code>python -m http.server 8080</code>
    </p>`;
  });

// ── Navbar ───────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const nb = document.getElementById('navbar');
  if (nb) {
    if (window.scrollY > 40) {
      nb.classList.add('scrolled');
    } else {
      nb.classList.remove('scrolled');
    }
  }
});

// ── Hero stats ────────────────────────────────────────────────
function updateHeroStats(s) {
  set('hs-books',  s.total.toLocaleString());
  set('hs-cats',   s.categories);
  set('hs-price',  `£${s.avg_price}`);
  set('hs-rating', `${s.avg_rating}★`);
}

// ── Metric cards ──────────────────────────────────────────────
function updateMetrics(s) {
  set('mc-total',  s.total.toLocaleString());
  set('mc-avg',    `£${s.avg_price}`);
  set('mc-rating', `${s.avg_rating} / 5`);
  set('mc-cheap',  `£${s.min_price}`);
  set('mc-exp',    `£${s.max_price}`);
  set('mc-cats',   s.categories);
}

// ── Analytics KPI strip ───────────────────────────────────────
function updateKPIs(s) {
  set('kpi-total',  s.total.toLocaleString());
  set('kpi-avg',    `£${s.avg_price}`);
  set('kpi-rating', `${s.avg_rating}`);
  set('kpi-cats',   s.categories);
}

// ── Hero floating books ───────────────────────────────────────
function buildHeroBooks() {
  const picks = allBooks.filter(b => b.image && b.rating === 5).slice(0, 5);
  ['hb1','hb2','hb3','hb4','hb5'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el || !picks[i]) return;
    const b = picks[i];
    el.innerHTML = `<img src="${b.image}" alt="${escHtml(b.title)}"
      onerror="this.parentElement.innerHTML='<div style=\'display:flex;align-items:center;justify-content:center;height:100%;background:var(--bg3);color:#475569;font-size:.7rem;padding:.5rem;text-align:center\'>${escHtml(b.title.slice(0,30))}</div>'"
    />`;
    el.parentElement.onclick = () => openModal(b);
  });
}

// ── Featured scroll ───────────────────────────────────────────
function buildFeatured() {
  const row = document.getElementById('featuredRow');
  if (!row) return;
  const picks = allBooks
    .filter(b => b.image && b.rating >= 4)
    .sort(() => Math.random() - 0.5)
    .slice(0, 20);

  row.innerHTML = picks.map(b => {
    const safeB = JSON.stringify(b).replace(/"/g, '&quot;');
    return `
    <div class="featured-card" onclick="openModal(${safeB})">
      <div class="fc-img">
        <div class="book-3d">
          <div class="book-cover">
            <img src="${b.image}" alt="${escHtml(b.title)}"
              onerror="this.src='';this.parentElement.style.background='var(--bg3)'"/>
          </div>
          <div class="book-pages-inside">
            <div class="book-inside-content">
              <div class="inside-title">${escHtml(b.title.slice(0, 30))}...</div>
              <div class="inside-price">£${(+b.price_gbp).toFixed(2)}</div>
              <div class="inside-stars">${STARS[b.rating] || ''}</div>
              <span class="inside-click">Read Info</span>
            </div>
          </div>
        </div>
        <div class="fc-rating-badge">${STAR_LABELS[b.rating]} ${b.rating}/5</div>
      </div>
      <div class="fc-body">
        <div class="fc-cat">${escHtml(b.category || 'Unknown')}</div>
        <div class="fc-title">${escHtml(b.title)}</div>
        <div class="fc-price">£${(+b.price_gbp).toFixed(2)}</div>
      </div>
    </div>`;
  }).join('');
}

// ── Budget Gems ───────────────────────────────────────────────
function buildGems() {
  const row = document.getElementById('gemsRow');
  if (!row) return;
  const gemBooks = allBooks
    .filter(b => b.rating === 5 && b.price_gbp < 15)
    .sort((a,b) => a.price_gbp - b.price_gbp)
    .slice(0, 10);

  row.innerHTML = gemBooks.map(b => {
    const safeB = JSON.stringify(b).replace(/"/g, '&quot;');
    return `
    <div class="gem-card" onclick="openModal(${safeB})">
      <div class="gem-badge">Best Value</div>
      <div class="gem-img">
        <img src="${b.image || ''}" alt="${escHtml(b.title)}"
          onerror="this.src='';this.parentElement.style.background='var(--bg3)'"/>
      </div>
      <div class="gem-body">
        <div class="gem-title">${escHtml(b.title)}</div>
        <div class="gem-foot">
          <div class="gem-price">£${(+b.price_gbp).toFixed(2)}</div>
          <div class="gem-stars">${STARS[5]}</div>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── Category filter ───────────────────────────────────────────
function buildCatFilter(cats) {
  const sel = document.getElementById('catFilter');
  if (!sel) return;
  Object.keys(cats).sort().forEach(cat => {
    const o = document.createElement('option');
    o.value = cat;
    o.textContent = `${cat} (${cats[cat]})`;
    sel.appendChild(o);
  });
}

// ── Filters ───────────────────────────────────────────────────
function attachFilters() {
  ['searchInput','catFilter','ratingFilter','priceFilter','sortFilter'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', applyFilters);
      el.addEventListener('change', applyFilters);
    }
  });
}

function applyFilters() {
  const q     = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const cat   = document.getElementById('catFilter')?.value || '';
  const rat   = document.getElementById('ratingFilter')?.value || '';
  const price = document.getElementById('priceFilter')?.value || '';
  const sort  = document.getElementById('sortFilter')?.value || 'default';

  filtered = allBooks.filter(b => {
    if (q && !b.title.toLowerCase().includes(q) && !(b.category||'').toLowerCase().includes(q)) return false;
    if (cat && b.category !== cat) return false;
    if (rat && b.rating !== +rat) return false;
    if (price) {
      const parts = price.split('-').map(Number);
      const lo = parts[0], hi = parts[1] || 9999;
      if (b.price_gbp < lo || b.price_gbp > hi) return false;
    }
    return true;
  });

  if (sort === 'price-asc')   filtered.sort((a,b) => a.price_gbp - b.price_gbp);
  if (sort === 'price-desc')  filtered.sort((a,b) => b.price_gbp - a.price_gbp);
  if (sort === 'rating-desc') filtered.sort((a,b) => b.rating - a.rating);
  if (sort === 'title-asc')   filtered.sort((a,b) => a.title.localeCompare(b.title));

  page = 1;
  const countEl = document.getElementById('book-count');
  if (countEl) countEl.textContent = filtered.length.toLocaleString();
  renderGrid();
  renderPagination();
}

// ── Render book grid ──────────────────────────────────────────
function renderGrid() {
  const grid = document.getElementById('bookGrid');
  if (!grid) return;

  const start = (page - 1) * PER_PAGE;
  const slice = filtered.slice(start, start + PER_PAGE);

  if (!slice.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-title">No books found</div>
        <div class="empty-sub">Try adjusting your search or filters</div>
      </div>`;
    return;
  }

  if (isShelfMode) {
    const shelfSize = 8;
    const shelvesCount = Math.ceil(slice.length / shelfSize);
    let shelvesHtml = '<div class="book-shelf-container">';
    
    for (let s = 0; s < shelvesCount; s++) {
      const shelfBooks = slice.slice(s * shelfSize, (s + 1) * shelfSize);
      shelvesHtml += '<div class="book-shelf">';
      
      shelvesHtml += shelfBooks.map((b, i) => {
        const safeB = JSON.stringify(b).replace(/"/g, '&quot;');
        
        const spineColors = [
          '#6f2232', '#950740', '#1a1a1d', '#4e4e50', '#0f2027', '#203a43', 
          '#1e3c72', '#2a5298', '#16222f', '#36096d', '#37ecba', '#ff758c',
          '#ff7eb3', '#3a1c1c', '#004e92', '#30e891', '#42275a', '#7303c0'
        ];
        let hash = 0;
        for (let charIndex = 0; charIndex < b.title.length; charIndex++) {
          hash = b.title.charCodeAt(charIndex) + ((hash << 5) - hash);
        }
        const color = spineColors[Math.abs(hash) % spineColors.length];
        
        return `
        <div class="shelf-book" onclick="openModal(${safeB})" style="--spine-color: ${color}; animation-delay: ${(s * shelfSize + i) * 0.02}s">
          <div class="book-spine">${escHtml(b.title)}</div>
          <div class="book-cover-wrap">
            <div class="bc-img-wrap">
              <img src="${b.image || ''}" alt="${escHtml(b.title)}"
                onerror="this.src='';this.parentElement.style.background='var(--bg-widget-solid)'"/>
            </div>
          </div>
        </div>`;
      }).join('');
      
      shelvesHtml += '</div>';
    }
    
    shelvesHtml += '</div>';
    grid.innerHTML = shelvesHtml;
    return;
  }

  grid.innerHTML = slice.map((b, i) => {
    const avail = (b.availability || '').toLowerCase().includes('in stock');
    const safeB = JSON.stringify(b).replace(/"/g, '&quot;');
    const badge = avail
      ? 'background:rgba(48,209,88,.12);color:#30d158;border:1px solid rgba(48,209,88,.2)'
      : 'background:rgba(255,55,95,.12);color:#ff375f;border:1px solid rgba(255,55,95,.2)';

    if (isListMode) {
      return `
      <div class="book-card list-card" onclick="openModal(${safeB})" style="animation-delay: ${i * 0.02}s">
        <div class="bc-img-wrap">
          <img src="${b.image || ''}" alt="${escHtml(b.title)}"
            onerror="this.src='';this.parentElement.style.background='var(--bg3)'"/>
        </div>
        <div class="bc-body">
          <div>
            <div class="bc-cat">${escHtml(b.category || 'Unknown')}</div>
            <div class="bc-title">${escHtml(b.title)}</div>
          </div>
          <div class="bc-foot">
            <div class="bc-price">£${(+b.price_gbp).toFixed(2)}</div>
            <div class="bc-stars">${STARS[b.rating] || ''}</div>
            <span style="display:inline-block;padding:.15rem .6rem;border-radius:99px;font-size:.7rem;font-weight:600;${badge}">
              ${avail ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
        </div>
      </div>`;
    }

    return `
    <div class="book-card" onclick="openModal(${safeB})" style="animation-delay: ${i * 0.02}s">
      <div class="bc-img-wrap">
        <div class="book-3d">
          <div class="book-cover">
            <img src="${b.image || ''}" alt="${escHtml(b.title)}"
              onerror="this.src='';this.parentElement.style.background='var(--bg3)'"/>
          </div>
          <div class="book-pages-inside">
            <div class="book-inside-content">
              <div class="inside-title">${escHtml(b.title.slice(0, 30))}...</div>
              <div class="inside-price">£${(+b.price_gbp).toFixed(2)}</div>
              <div class="inside-stars">${STARS[b.rating] || ''}</div>
              <span class="inside-click">Read Info</span>
            </div>
          </div>
        </div>
        <div class="bc-overlay">
          <div class="bc-view-btn">View Details</div>
        </div>
      </div>
      <div class="bc-body">
        <div class="bc-cat">${escHtml(b.category || 'Unknown')}</div>
        <div class="bc-title">${escHtml(b.title)}</div>
        <div class="bc-foot">
          <div class="bc-price">£${(+b.price_gbp).toFixed(2)}</div>
          <div class="bc-stars">${STARS[b.rating] || ''}</div>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── View toggle ───────────────────────────────────────────────
function attachViewToggle() {
  document.getElementById('viewGrid')?.addEventListener('click', () => {
    isListMode = false;
    isShelfMode = false;
    const bg = document.getElementById('bookGrid');
    if (bg) bg.className = 'book-grid';
    setActiveViewBtn('viewGrid');
    renderGrid();
  });
  document.getElementById('viewList')?.addEventListener('click', () => {
    isListMode = true;
    isShelfMode = false;
    const bg = document.getElementById('bookGrid');
    if (bg) bg.className = 'book-grid list-mode';
    setActiveViewBtn('viewList');
    renderGrid();
  });
  document.getElementById('viewShelf')?.addEventListener('click', () => {
    isListMode = false;
    isShelfMode = true;
    const bg = document.getElementById('bookGrid');
    if (bg) bg.className = 'book-grid shelf-mode';
    setActiveViewBtn('viewShelf');
    renderGrid();
  });
}

function setActiveViewBtn(activeId) {
  ['viewGrid', 'viewList', 'viewShelf'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      if (id === activeId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });
}

// ── Pagination ────────────────────────────────────────────────
function renderPagination() {
  const total = Math.ceil(filtered.length / PER_PAGE);
  const el    = document.getElementById('pagination');
  if (!el) return;
  if (total <= 1) { el.innerHTML = ''; return; }

  let html = `<button class="pg-btn" onclick="goPage(${page-1})" ${page===1?'disabled':''}>‹ Prev</button>`;

  getPageNums(page, total).forEach(p => {
    if (p === '…') {
      html += `<span style="color:#475569;display:flex;align-items:center;padding:0 .3rem">…</span>`;
    } else {
      html += `<button class="pg-btn ${p===page?'active':''}" onclick="goPage(${p})">${p}</button>`;
    }
  });

  html += `<button class="pg-btn" onclick="goPage(${page+1})" ${page===total?'disabled':''}>Next ›</button>`;
  el.innerHTML = html;
}

function getPageNums(cur, total) {
  if (total <= 7) return Array.from({length:total}, (_,i) => i+1);
  const pages = [1];
  if (cur > 3) pages.push('…');
  for (let i = Math.max(2, cur-1); i <= Math.min(total-1, cur+1); i++) pages.push(i);
  if (cur < total-2) pages.push('…');
  pages.push(total);
  return pages;
}

function goPage(p) {
  const total = Math.ceil(filtered.length / PER_PAGE);
  if (p < 1 || p > total) return;
  page = p;
  renderGrid();
  renderPagination();
  document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Modal ─────────────────────────────────────────────────────
function attachModal() {
  document.getElementById('modalClose')?.addEventListener('click', closeModal);
  document.getElementById('modalOverlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

function openModal(book) {
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  if (!overlay || !content) return;

  const avail = (book.availability || '').toLowerCase().includes('in stock');

  content.innerHTML = `
    <div class="modal-top">
      <div class="modal-img">
        <img src="${book.image || ''}" alt="${escHtml(book.title)}"
          onerror="this.style.display='none'"/>
      </div>
      <div class="modal-info">
        <div class="modal-cat">${escHtml(book.category || 'Unknown')}</div>
        <h2 class="modal-title">${escHtml(book.title)}</h2>
        <div class="modal-stars">${STARS[book.rating] || ''}
          <span style="color:#475569;font-size:.82rem;margin-left:.3rem">${book.rating} / 5 stars</span>
        </div>
        <div class="modal-price">£${(+book.price_gbp).toFixed(2)}</div>
        <span class="modal-avail ${avail ? 'modal-in' : 'modal-out'}">
          ${avail ? 'In Stock' : 'Out of Stock'}
        </span>
      </div>
    </div>
    ${book.description ? `
      <hr class="modal-divider"/>
      <div class="modal-desc-label">Description</div>
      <div class="modal-desc">${escHtml(book.description)}</div>
    ` : ''}
    <a href="${book.url}" target="_blank" class="modal-link">View on Site →</a>`;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

// ── Charts ────────────────────────────────────────────────────
function buildCharts(data) {
  // iOS style muted labels
  Chart.defaults.color = 'rgba(255, 255, 255, 0.45)';
  Chart.defaults.font  = { family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', size: 10, weight: '500' };

  // Faint or hidden grid lines
  const gridLine = { color: 'rgba(255, 255, 255, 0.02)', drawTicks: false };

  // Apple System Blue solid/tint colors
  const primaryFill = 'rgba(0, 122, 255, 0.15)';
  const primaryStroke = 'rgba(0, 122, 255, 0.85)';

  // 1. Category bar (Clean Monochromatic Apple Blue)
  const canvasCats = document.getElementById('chartCats');
  new Chart(canvasCats, {
    type: 'bar',
    data: {
      labels: Object.keys(data.categories),
      datasets: [{
        data: Object.values(data.categories),
        backgroundColor: primaryFill,
        borderColor: primaryStroke,
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(28, 28, 30, 0.9)',
          titleFont: { weight: '600' },
          padding: 8,
          cornerRadius: 8,
          borderColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          callbacks: { label: c => ` ${c.raw} books` }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: 'rgba(255, 255, 255, 0.45)', font: { size: 9 } } },
        y: { grid: gridLine, beginAtZero: true, ticks: { color: 'rgba(255, 255, 255, 0.45)' } }
      }
    }
  });

  // 2. Rating horizontal bar
  const canvasRating = document.getElementById('chartRating');
  new Chart(canvasRating, {
    type: 'bar',
    data: {
      labels: ['1','2','3','4','5'],
      datasets: [{
        data: Object.values(data.ratings),
        backgroundColor: primaryFill,
        borderColor: primaryStroke,
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(28, 28, 30, 0.9)',
          titleFont: { weight: '600' },
          padding: 8,
          cornerRadius: 8,
          borderColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          callbacks: { label: c => ` ${c.raw} books` }
        }
      },
      scales: {
        x: { grid: gridLine, beginAtZero: true, ticks: { color: 'rgba(255, 255, 255, 0.45)' } },
        y: { grid: { display: false }, ticks: { color: 'rgba(255, 255, 255, 0.45)' } }
      }
    }
  });

  // 3. Price doughnut (Apple Storage report style)
  const canvasPrice = document.getElementById('chartPrice');
  const priceFills = [
    'rgba(0, 122, 255, 0.75)',    // Apple Blue
    'rgba(48, 176, 199, 0.75)',   // Apple Teal
    'rgba(175, 82, 222, 0.75)',   // Apple Purple
    'rgba(142, 142, 147, 0.65)',  // Apple Gray
    'rgba(142, 142, 147, 0.25)'   // Fainter Apple Gray
  ];

  new Chart(canvasPrice, {
    type: 'doughnut',
    data: {
      labels: ['£10–20','£20–30','£30–40','£40–50','£50–60'],
      datasets: [{
        data: Object.values(data.price_dist),
        backgroundColor: priceFills,
        borderWidth: 1.5,
        borderColor: 'rgba(28, 28, 30, 0.8)',
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      cutout: '72%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 12,
            usePointStyle: true,
            font: { size: 10, weight: '500' },
            color: 'rgba(255, 255, 255, 0.45)'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(28, 28, 30, 0.9)',
          titleFont: { weight: '600' },
          padding: 8,
          cornerRadius: 8,
          borderColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          callbacks: { label: c => ` ${c.label}: ${c.raw} books` }
        }
      }
    }
  });

  // 4. Price bar chart
  const canvasPriceBar = document.getElementById('chartPriceBar');
  if (canvasPriceBar) {
    new Chart(canvasPriceBar, {
      type: 'bar',
      data: {
        labels: ['£10–20','£20–30','£30–40','£40–50','£50–60'],
        datasets: [{
          data: Object.values(data.price_dist),
          backgroundColor: primaryFill,
          borderColor: primaryStroke,
          borderWidth: 1.5,
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(28, 28, 30, 0.9)',
            titleFont: { weight: '600' },
            padding: 8,
            cornerRadius: 8,
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: 1,
            callbacks: { label: c => ` ${c.raw} books` }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: 'rgba(255, 255, 255, 0.45)' } },
          y: { grid: gridLine, beginAtZero: true, ticks: { color: 'rgba(255, 255, 255, 0.45)' } }
        }
      }
    });
  }
}

// ── Utils ─────────────────────────────────────────────────────
function set(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function initScrollReveal() {
  const sections = document.querySelectorAll('.scroll-reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('scroll-hidden');
        entry.target.classList.add('reveal-active');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.05,
    rootMargin: '0px 0px -40px 0px'
  });

  sections.forEach(sec => observer.observe(sec));
}

function initMouseHalo() {
  const halo = document.getElementById('mouseHalo');
  if (!halo) return;

  document.addEventListener('mousemove', (e) => {
    halo.style.opacity = '1';
    halo.style.transform = `translate3d(${e.clientX - 150}px, ${e.clientY - 150}px, 0)`;
  });

  document.addEventListener('mouseleave', () => {
    halo.style.opacity = '0';
  });

  const hoverTargets = 'a, button, select, input, .book-card, .featured-card, .metric-card, .hbook';
  
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverTargets)) {
      halo.classList.add('active');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverTargets)) {
      halo.classList.remove('active');
    }
  });
}

function initHoloTilt() {
  const container = document.body;
  
  container.addEventListener('mousemove', (e) => {
    const card = e.target.closest('.book-card, .featured-card');
    if (!card) return;
    if (card.classList.contains('list-card') || card.closest('.book-shelf')) return;
    
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const angleX = -(y - yc) / (yc / 10);
    const angleY = (x - xc) / (xc / 10);
    
    card.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) translateY(-4px)`;
    
    const img = card.querySelector('.bc-img-wrap img, .fc-img img');
    if (img) {
      const transX = (x - xc) / (xc / 10);
      const transY = (y - yc) / (yc / 10);
      img.style.transform = `scale(1.03) translate3d(${transX}px, ${transY}px, 10px)`;
    }
  });
  
  container.addEventListener('mouseout', (e) => {
    const card = e.target.closest('.book-card, .featured-card');
    if (!card) return;
    
    card.style.transform = '';
    const img = card.querySelector('.bc-img-wrap img, .fc-img img');
    if (img) {
      img.style.transform = '';
    }
  });
}

function initNebulaCanvas() {
  const canvas = document.getElementById('nebulaCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = (canvas.width = window.innerWidth);
    height = (canvas.height = window.innerHeight);
  });

  let mouse = { x: null, y: null, active: false };
  document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });
  document.addEventListener('mouseleave', () => {
    mouse.active = false;
  });

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = Math.random() * 2 + 1;
      this.baseAlpha = Math.random() * 0.15 + 0.05;
      this.alpha = this.baseAlpha;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.color = Math.random() > 0.5 ? '100, 130, 252' : '191, 90, 242';
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
        this.reset();
      }

      if (mouse.active && mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 250) {
          const force = (250 - dist) / 2500;
          this.x += (dx / dist) * force;
          this.y += (dy / dist) * force;
          this.alpha = this.baseAlpha + (1 - dist / 250) * 0.15;
        } else {
          this.alpha = this.baseAlpha;
        }
      } else {
        this.alpha = this.baseAlpha;
      }
    }
    draw() {
      ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const particles = Array.from({ length: 80 }, () => new Particle());

  function loop() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p) => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(loop);
  }
  loop();
}

// ── Theme Toggle ─────────────────────────────────────────────
function initThemeToggle() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const html   = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    const next   = isDark ? 'light' : 'dark';

    // Animate: quick scale‑down, switch, scale‑up
    btn.style.transform = 'scale(0.82) rotate(20deg)';
    setTimeout(() => {
      html.setAttribute('data-theme', next);
      localStorage.setItem('bv-theme', next);
      btn.style.transform = '';
    }, 120);
  });
}

// Boot cursor, dynamic layouts and theme toggle
initMouseHalo();
initHoloTilt();
initNebulaCanvas();
initThemeToggle();

window.openModal = openModal;
window.goPage    = goPage;
