import './style.css'

// ===== REBRICKABLE API KEY =====
const REBRICKABLE_API_KEY = '707249e899b50ed2cd5d0512bf5863ff';

let currentUser = null;
const USERS_KEY = 'legoTrackerUsers';

function getStorageKey() {
  return `legoSets_${currentUser}`;
}

const categoryEmojis = {
  'duplo': '🧒',
  'city': '🏙️',
  'creator-3in1': '🎨',
  'technic': '⚙️',
  'friends': '💜',
  'ninjago': '🥷',
  'star-wars': '⭐',
  'marvel-dc': '🦸',
  'classic': '🧱',
  'harry-potter': '🧙',
  'icons-architecture': '🏛️',
  'art': '🖼️',
  'botanical': '🌿',
  'speed-champions': '🏎️',
  // Yeni eklenenler:
  'ideas': '💡',
  'brickheadz': '🗿',
  'disney': '🏰',
  'minecraft': '⛏️',
  'super-mario': '🍄',
  'jurassic-world': '🦖',
  'minifigures': '🕴️',
  'dreamzzz': '💤',
  'sonic': '🦔',
  'animal-crossing': '🍃',
  'space': '🚀' // 2024-2026 arası tüm temalarda ortak kullanılan bir etiket
};

const categoryLabels = {
  'duplo': 'Duplo',
  'city': 'City',
  'creator-3in1': 'Creator 3in1',
  'technic': 'Technic',
  'friends': 'Friends',
  'ninjago': 'Ninjago',
  'star-wars': 'Star Wars',
  'marvel-dc': 'Marvel/DC',
  'classic': 'Classic',
  'harry-potter': 'HP/Disney/MC',
  'icons-architecture': 'Icons/Architecture',
  'art': 'Art',
  'botanical': 'Botanical',
  'speed-champions': 'Speed Champions',
  'ideas': 'Ideas',
  'brickheadz': 'BrickHeadz',
  'disney': 'Disney',
  'minecraft': 'Minecraft',
  'super-mario': 'Super Mario',
  'jurassic-world': 'Jurassic World',
  'minifigures': 'Minifigures',
  'dreamzzz': 'DREAMZzz',
  'sonic': 'Sonic',
  'animal-crossing': 'Animal Crossing',
  'space': 'Space'
};

const statusLabels = {
  'not-started': '🆕 Not Started',
  'in-progress': '⏳ In Progress',
  'completed': '✅ Completed'
};

const categoryColors = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
  '#9966FF', '#FF9F40', '#E74C3C', '#2ECC71',
  '#3498DB', '#F39C12', '#8E44AD'
];

const mockSets = [
  {
    id: 1,
    name: 'Millennium Falcon',
    category: 'star-wars',
    pieceCount: 7541,
    status: 'completed',
    imageUrl: 'https://cdn.rebrickable.com/media/sets/75192-1/30881.jpg',
    dateAdded: new Date('2025-01-15').getTime()
  },
  {
    id: 2,
    name: 'Orchid',
    category: 'botanical',
    pieceCount: 608,
    status: 'completed',
    imageUrl: 'https://cdn.rebrickable.com/media/sets/10311-1/148060.jpg',
    dateAdded: new Date('2025-03-10').getTime()
  },
  {
    id: 3,
    name: 'Eiffel Tower',
    category: 'icons-architecture',
    pieceCount: 10001,
    status: 'not-started',
    imageUrl: 'https://cdn.rebrickable.com/media/sets/10307-1/112417.jpg',
    dateAdded: new Date('2025-05-12').getTime()
  }
];

function initializeStorage() {
  if (!localStorage.getItem(getStorageKey())) {
    localStorage.setItem(getStorageKey(), JSON.stringify(mockSets))
  }
}

function getSets() {
  if (!currentUser) return [];
  const data = localStorage.getItem(getStorageKey())
  return data ? JSON.parse(data) : []
}

function saveSets(sets) {
  if (!currentUser) return;
  localStorage.setItem(getStorageKey(), JSON.stringify(sets))
}

// ===== CHART.JS =====
let categoryChart = null;

function updateChart() {
  const sets = getSets();
  const canvas = document.getElementById('category-chart');

  // Count sets per category
  const categoryCount = {};
  sets.forEach(set => {
    const cat = set.category || 'other';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });

  const labels = Object.keys(categoryCount).map(k => categoryLabels[k] || k);
  const data = Object.values(categoryCount);
  const bgColors = Object.keys(categoryCount).map((_, i) => categoryColors[i % categoryColors.length]);

  const isDark = document.documentElement.dataset.theme === 'dark';
  const textColor = isDark ? '#e0e0e0' : '#333333';

  if (categoryChart) {
    categoryChart.destroy();
  }

  if (sets.length === 0) {
    canvas.style.display = 'none';
    return;
  }
  canvas.style.display = 'block';

  categoryChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: bgColors,
        borderColor: isDark ? '#1e1e1e' : '#ffffff',
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
            padding: 15,
            font: { size: 13 }
          }
        }
      }
    }
  });
}

// ===== DASHBOARD =====
function updateDashboard() {
  const sets = getSets()

  document.getElementById('total-sets').textContent = sets.length

  const totalPieces = sets.reduce((sum, set) => sum + set.pieceCount, 0)
  document.getElementById('total-pieces').textContent = totalPieces.toLocaleString()

  const recentlyAdded = sets.length > 0
    ? sets.reduce((latest, set) => set.dateAdded > latest.dateAdded ? set : latest)
    : null

  const recentlyAddedElement = document.getElementById('recently-added')
  if (recentlyAdded) {
    recentlyAddedElement.textContent = recentlyAdded.name
  } else {
    recentlyAddedElement.textContent = '-'
  }

  const completed = sets.filter(s => s.status === 'completed').length;
  const inProgress = sets.filter(s => s.status === 'in-progress').length;
  const notStarted = sets.filter(s => s.status === 'not-started').length;

  document.getElementById('status-completed').textContent = completed;
  document.getElementById('status-in-progress').textContent = inProgress;
  document.getElementById('status-not-started').textContent = notStarted;

  updateChart();
}

// ===== IMAGE CACHE =====
const IMG_CACHE_KEY = 'legoImgCache';

function isImageCached(url) {
  try {
    const cache = JSON.parse(localStorage.getItem(IMG_CACHE_KEY) || '[]');
    return cache.includes(url);
  } catch { return false; }
}

function markImageCached(url) {
  try {
    const cache = JSON.parse(localStorage.getItem(IMG_CACHE_KEY) || '[]');
    if (!cache.includes(url)) {
      cache.push(url);
      // Keep cache list manageable (max 200 entries)
      if (cache.length > 200) cache.shift();
      localStorage.setItem(IMG_CACHE_KEY, JSON.stringify(cache));
    }
  } catch (e) {
    localStorage.removeItem(IMG_CACHE_KEY);
  }
}

function loadAndCacheImage(imgEl, originalUrl) {
  // Set a timeout - if image hasn't loaded in 10 seconds, use fallback
  const timeout = setTimeout(() => {
    if (!imgEl.complete || imgEl.naturalWidth === 0) {
      imgEl.src = 'https://images.pexels.com/photos/3961954/pexels-photo-3961954.jpeg?w=200';
      imgEl.style.opacity = '1';
      imgEl.parentElement.classList.remove('card-image-skeleton');
    }
  }, 10000);

  imgEl.onload = function() {
    clearTimeout(timeout);
    this.style.opacity = '1';
    this.parentElement.classList.remove('card-image-skeleton');
    markImageCached(originalUrl);
  };
  imgEl.onerror = function() {
    clearTimeout(timeout);
    this.style.opacity = '1';
    this.src = 'https://images.pexels.com/photos/3961954/pexels-photo-3961954.jpeg?w=200';
    this.parentElement.classList.remove('card-image-skeleton');
  };
}

// ===== COLLECTION GRID =====
function renderCollectionGrid(sets) {
  const grid = document.getElementById('collection-grid')
  const noResults = document.getElementById('no-results')

  if (sets.length === 0) {
    grid.innerHTML = ''
    noResults.style.display = 'block'
    return
  }

  noResults.style.display = 'none'
  grid.innerHTML = sets.map(set => {
    const cached = isImageCached(set.imageUrl);
    const skeletonClass = cached ? '' : 'card-image-skeleton';
    const imgOpacity = cached ? '1' : '0';
    return `
    <div class="collection-card">
      <div class="card-actions">
        <button class="icon-btn edit-btn" data-id="${set.id}" aria-label="Edit" title="Edit">✏️</button>
        <button class="icon-btn delete-btn" data-id="${set.id}" aria-label="Delete" title="Delete">🗑️</button>
      </div>
      <div class="card-image ${skeletonClass}">
        <img src="${set.imageUrl}" alt="${set.name}" data-original-url="${set.imageUrl}" loading="lazy" decoding="async" style="width: 100%; height: 200px; object-fit: cover; opacity: ${imgOpacity}; transition: opacity 0.3s ease;">
      </div>
      <div class="card-content">
        <div class="card-name">${set.name}</div>
        <div style="margin-bottom: 0.75rem;">
          <span class="card-category">${categoryEmojis[set.category] || '📦'} ${categoryLabels[set.category] || set.category}</span>
          <span class="card-category" style="background-color: #eee;">${statusLabels[set.status || 'not-started']}</span>
        </div>
        <div class="card-pieces">🧱 ${set.pieceCount.toLocaleString()} pieces</div>
      </div>
    </div>
  `;
  }).join('');

  // Attach image loading/caching for non-cached images
  grid.querySelectorAll('img[data-original-url]').forEach(img => {
    const originalUrl = img.dataset.originalUrl;
    if (!isImageCached(originalUrl)) {
      loadAndCacheImage(img, originalUrl);
    } else {
      // Already cached by browser, just ensure onload fires
      img.onload = function() {
        this.style.opacity = '1';
        this.parentElement.classList.remove('card-image-skeleton');
      };
      img.onerror = function() {
        this.style.opacity = '1';
        this.src = 'https://images.pexels.com/photos/3961954/pexels-photo-3961954.jpeg?w=200';
        this.parentElement.classList.remove('card-image-skeleton');
      };
    }
  });
}

function filterAndRenderCollection() {
  if (!currentUser) return;
  const searchTerm = document.getElementById('search-input').value.toLowerCase()
  const activeFilter = document.querySelector('.filter-btn.active')
  const selectedCategory = activeFilter ? activeFilter.dataset.filter : 'all'
  const selectedPieceCount = document.getElementById('piece-count-filter').value;

  let sets = getSets()

  if (selectedCategory !== 'all') {
    sets = sets.filter(set => set.category === selectedCategory)
  }

  if (searchTerm) {
    sets = sets.filter(set => set.name.toLowerCase().includes(searchTerm))
  }

  if (selectedPieceCount !== 'all') {
    sets = sets.filter(set => {
      if (selectedPieceCount === 'under-200') return set.pieceCount < 200;
      if (selectedPieceCount === '200-500') return set.pieceCount >= 200 && set.pieceCount <= 500;
      if (selectedPieceCount === '500-1000') return set.pieceCount > 500 && set.pieceCount <= 1000;
      if (selectedPieceCount === 'over-1000') return set.pieceCount > 1000;
      return true;
    });
  }

  sets.sort((a, b) => b.dateAdded - a.dateAdded)
  renderCollectionGrid(sets)
}

// ===== NAVIGATION =====
function initializeNavigation() {
  const navLinks = document.querySelectorAll('.nav-link')

  navLinks.forEach(link => {
    if (link.id === 'logout-btn') return;

    link.addEventListener('click', (e) => {
      e.preventDefault()

      const sectionId = link.dataset.section

      document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active')
      })
      document.getElementById(sectionId).classList.add('active')

      navLinks.forEach(l => {
        if (l.id !== 'logout-btn') l.classList.remove('active')
      })
      link.classList.add('active')

      // Save active section for page reload
      sessionStorage.setItem('legoTrackerActiveSection', sectionId);

      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  })
}

function restoreActiveSection() {
  const savedSection = sessionStorage.getItem('legoTrackerActiveSection');
  if (savedSection) {
    const link = document.querySelector(`[data-section="${savedSection}"]`);
    if (link) {
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.getElementById(savedSection).classList.add('active');
      document.querySelectorAll('.nav-link').forEach(l => {
        if (l.id !== 'logout-btn') l.classList.remove('active');
      });
      link.classList.add('active');
    }
  }
}

// ===== COLLECTION FILTERS =====
function initializeCollectionFilters() {
  const searchInput = document.getElementById('search-input')
  const filterButtons = document.querySelectorAll('.filter-btn')
  const pieceCountFilter = document.getElementById('piece-count-filter')

  searchInput.addEventListener('input', filterAndRenderCollection)
  pieceCountFilter.addEventListener('change', filterAndRenderCollection)

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterButtons.forEach(btn => btn.classList.remove('active'))
      button.classList.add('active')
      filterAndRenderCollection()
    })
  })
}

// ===== CARD ACTIONS (EDIT & DELETE) =====
let editingSetId = null;

function initializeCardActions() {
  const grid = document.getElementById('collection-grid');
  const editForm = document.getElementById('edit-set-form');
  const closeBtn = document.getElementById('close-edit-modal');
  const modal = document.getElementById('edit-modal');

  grid.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-btn');
    const deleteBtn = e.target.closest('.delete-btn');

    if (editBtn) {
      const id = parseInt(editBtn.dataset.id);
      openEditModal(id);
    } else if (deleteBtn) {
      const id = parseInt(deleteBtn.dataset.id);
      deleteSet(id);
    }
  });

  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    editingSetId = null;
  });

  editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const sets = getSets();
    const index = sets.findIndex(s => s.id === editingSetId);
    if (index === -1) return;

    const fileInput = document.getElementById('edit-image');
    const file = fileInput.files[0];

    const saveUpdatedSet = (imgUrl) => {
      sets[index] = {
        ...sets[index],
        name: document.getElementById('edit-name').value,
        pieceCount: parseInt(document.getElementById('edit-pieces').value),
        category: document.getElementById('edit-category').value,
        status: document.getElementById('edit-status').value,
        imageUrl: imgUrl
      };

      saveSets(sets);
      modal.style.display = 'none';
      editingSetId = null;
      editForm.reset();
      updateDashboard();
      filterAndRenderCollection();
    };

    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => saveUpdatedSet(event.target.result);
      reader.readAsDataURL(file);
    } else {
      saveUpdatedSet(sets[index].imageUrl);
    }
  });
}

function deleteSet(id) {
  if (confirm('Are you sure you want to delete this Lego set?')) {
    let sets = getSets();
    sets = sets.filter(s => s.id !== id);
    saveSets(sets);
    updateDashboard();
    filterAndRenderCollection();
  }
}

function openEditModal(id) {
  const sets = getSets();
  const set = sets.find(s => s.id === id);
  if (!set) return;

  editingSetId = id;
  document.getElementById('edit-name').value = set.name;
  document.getElementById('edit-pieces').value = set.pieceCount;
  document.getElementById('edit-category').value = set.category;
  document.getElementById('edit-status').value = set.status || 'not-started';

  document.getElementById('edit-modal').style.display = 'flex';
}

// ===== ADD SET FORM =====
let apiImageUrl = null; // Store image URL from API

function initializeAddSetForm() {
  const form = document.getElementById('add-set-form')
  const successMessage = document.getElementById('success-message')

  form.addEventListener('submit', (e) => {
    e.preventDefault()

    const formData = new FormData(form)
    const fileInput = document.getElementById('image-upload');
    const file = fileInput.files[0];

    const createSet = (imgUrl) => {
      const newSet = {
        id: Date.now(),
        name: formData.get('set-name'),
        pieceCount: parseInt(formData.get('piece-count')),
        category: formData.get('category'),
        status: formData.get('status') || 'not-started',
        imageUrl: imgUrl,
        dateAdded: Date.now()
      }

      const sets = getSets()
      sets.push(newSet)
      saveSets(sets)

      form.reset()
      apiImageUrl = null; // Clear saved API image

      updateDashboard()
      filterAndRenderCollection()

      successMessage.style.display = 'block'
      setTimeout(() => {
        successMessage.style.display = 'none'
      }, 3000)

      const collectionLink = document.querySelector('[data-section="collection"]')
      collectionLink.click()
    };

    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        createSet(event.target.result);
      };
      reader.readAsDataURL(file);
    } else if (apiImageUrl) {
      createSet(apiImageUrl);
    } else {
      createSet('https://images.pexels.com/photos/3961954/pexels-photo-3961954.jpeg?w=200');
    }
  })
}

// ===== REBRICKABLE API =====
function initializeApiAutoFill() {
  const btn = document.getElementById('api-autofill-btn');
  const input = document.getElementById('api-set-number');
  const statusEl = document.getElementById('api-status');

  btn.addEventListener('click', async () => {
    let setNum = input.value.trim();
    if (!setNum) {
      statusEl.textContent = '⚠️ Please enter a set number (e.g. 75192-1)';
      statusEl.style.color = '#ffc107';
      return;
    }

    // Auto-append "-1" if user didn't include a dash
    if (!setNum.includes('-')) {
      setNum = setNum + '-1';
    }

    btn.disabled = true;
    btn.textContent = 'Fetching...';
    statusEl.textContent = '🔄 Searching Rebrickable database...';
    statusEl.style.color = '#ccc';

    try {
      const response = await fetch(`https://rebrickable.com/api/v3/lego/sets/${setNum}/`, {
        headers: {
          'Authorization': `key ${REBRICKABLE_API_KEY}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Set not found! Check the set number.');
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Fill form fields
      document.getElementById('set-name').value = data.name || '';
      document.getElementById('piece-count').value = data.num_parts || '';

      // Try to detect category from theme
      if (data.theme_id) {
        detectCategory(data.theme_id);
      }

      // Store image for later use
      if (data.set_img_url) {
        apiImageUrl = data.set_img_url;
      }

      statusEl.textContent = `✅ Found: ${data.name} (${data.num_parts} pieces, Year: ${data.year})`;
      statusEl.style.color = '#28a745';

    } catch (err) {
      statusEl.textContent = `❌ ${err.message}`;
      statusEl.style.color = '#dc3545';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Auto-Fill';
    }
  });

  // Allow Enter key in the input
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      btn.click();
    }
  });
}

// Map common Rebrickable theme IDs to our categories
const themeIdMap = {
  // Star Wars
  158: 'star-wars', 171: 'star-wars', 172: 'star-wars', 434: 'star-wars', 503: 'star-wars',
  // Technic
  1: 'technic',
  // City
  52: 'city', 53: 'city',
  // Ninjago
  577: 'ninjago',
  // Friends
  494: 'friends',
  // Creator (3-in-1)
  22: 'creator-3in1',
  // Duplo
  504: 'duplo', 10: 'duplo',
  // Harry Potter / Disney / Minecraft
  246: 'harry-potter', 601: 'harry-potter', 497: 'harry-potter',
  // Marvel / DC
  696: 'marvel-dc', 697: 'marvel-dc', 607: 'marvel-dc',
  // Icons / Architecture
  252: 'icons-architecture', 578: 'icons-architecture', 721: 'icons-architecture',
  // Classic
  621: 'classic',
  // Art
  709: 'art',
  // Botanical
  769: 'botanical',
  // Speed Champions
  601: 'speed-champions'
};

function detectCategory(themeId) {
  const category = themeIdMap[themeId];
  if (category) {
    document.getElementById('category').value = category;
  }
}

// ===== DARK MODE =====
function initializeThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('legoTrackerTheme') || 'light';

  // Apply saved theme on load
  document.documentElement.dataset.theme = savedTheme;
  toggleBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

  toggleBtn.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme;
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    toggleBtn.textContent = next === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('legoTrackerTheme', next);

    // Re-render chart with new theme colors
    if (currentUser) {
      updateChart();
    }
  });
}

// ===== AUTH =====
function initializeAuth() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const showRegisterLink = document.getElementById('show-register');
  const showLoginLink = document.getElementById('show-login');
  const logoutBtn = document.getElementById('logout-btn');

  showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
  });

  showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
  });

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    if (users[username] && users[username] === password) {
      handleLoginSuccess(username);
      loginForm.reset();
      errorEl.style.display = 'none';
    } else {
      errorEl.textContent = 'Invalid username or password!';
      errorEl.style.display = 'block';
    }
  });

  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const errorEl = document.getElementById('register-error');

    if (username.length < 3) {
      errorEl.textContent = 'Username must be at least 3 characters!';
      errorEl.style.display = 'block';
      return;
    }

    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    if (users[username]) {
      errorEl.textContent = 'This username is already taken!';
      errorEl.style.display = 'block';
    } else {
      users[username] = password;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      handleLoginSuccess(username);
      registerForm.reset();
      errorEl.style.display = 'none';
    }
  });

  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    currentUser = null;
    sessionStorage.removeItem('legoTrackerCurrentUser');
    sessionStorage.removeItem('legoTrackerActiveSection');
    document.getElementById('landing-page').style.display = 'flex';
    document.getElementById('main-navbar').style.display = 'none';
    document.getElementById('main-content').style.display = 'none';

    document.querySelector('[data-section="dashboard"]').click();
  });
}

function handleLoginSuccess(username) {
  currentUser = username;
  sessionStorage.setItem('legoTrackerCurrentUser', username);
  document.getElementById('landing-page').style.display = 'none';
  document.getElementById('main-navbar').style.display = 'block';
  document.getElementById('main-content').style.display = 'flex';
  document.getElementById('main-content').style.flexDirection = 'column';

  initializeStorage();
  updateDashboard();
  filterAndRenderCollection();
  restoreActiveSection();
}

// ===== INIT =====

// Instant session check - runs before DOM is fully ready to prevent flash
(function earlySessionCheck() {
  const savedUser = sessionStorage.getItem('legoTrackerCurrentUser');
  if (savedUser) {
    // Hide landing page immediately via inline style injection
    const style = document.createElement('style');
    style.id = 'early-auth-style';
    style.textContent = '#landing-page{display:none!important}#main-navbar{display:block!important}#main-content{display:flex!important;flex-direction:column}';
    document.head.appendChild(style);
  }
})();

function init() {
  initializeThemeToggle()
  initializeNavigation()
  initializeCollectionFilters()
  initializeAddSetForm()
  initializeCardActions()
  initializeAuth()
  initializeApiAutoFill()

  // Remove early style override
  const earlyStyle = document.getElementById('early-auth-style');
  if (earlyStyle) earlyStyle.remove();

  // Restore session on page reload
  const savedUser = sessionStorage.getItem('legoTrackerCurrentUser');
  if (savedUser) {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    if (users[savedUser]) {
      handleLoginSuccess(savedUser);
    } else {
      sessionStorage.removeItem('legoTrackerCurrentUser');
      sessionStorage.removeItem('legoTrackerActiveSection');
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
