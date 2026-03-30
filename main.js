import './style.css'
import { auth, db, googleProvider } from './firebase.js'
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut 
} from "firebase/auth"
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  setDoc,
  serverTimestamp
} from "firebase/firestore"

// ===== REBRICKABLE API KEY =====
const REBRICKABLE_API_KEY = '707249e899b50ed2cd5d0512bf5863ff';

let userSets = [];
let currentUser = null;

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
  'ideas': '💡',
  'brickheadz': '🗿',
  'disney': '🏰',
  'minecraft': '⛏️',
  'super-mario': '🍄',
  'jurassic-world': 'REX',
  'minifigures': '🕴️',
  'dreamzzz': '💤',
  'sonic': '🦔',
  'animal-crossing': '🍃',
  'space': '🚀'
};

const categoryLabels = {
  'duplo': 'Duplo', 'city': 'City', 'creator-3in1': 'Creator 3in1', 'technic': 'Technic',
  'friends': 'Friends', 'ninjago': 'Ninjago', 'star-wars': 'Star Wars', 'marvel-dc': 'Marvel/DC',
  'classic': 'Classic', 'harry-potter': 'HP/Disney/MC', 'icons-architecture': 'Icons/Architecture',
  'art': 'Art', 'botanical': 'Botanical', 'speed-champions': 'Speed Champions', 'ideas': 'Ideas',
  'brickheadz': 'BrickHeadz', 'disney': 'Disney', 'minecraft': 'Minecraft', 'super-mario': 'Super Mario',
  'jurassic-world': 'Jurassic World', 'minifigures': 'Minifigures', 'dreamzzz': 'DREAMZzz',
  'sonic': 'Sonic', 'animal-crossing': 'Animal Crossing', 'space': 'Space'
};

const statusLabels = {
  'not-started': '🆕 Not Started',
  'in-progress': '⏳ In Progress',
  'completed': '✅ Completed'
};

const categoryColors = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E74C3C', '#2ECC71',
  '#3498DB', '#F39C12', '#8E44AD'
];

// ===== CHART.JS =====
let categoryChart = null;

function updateChart() {
  const sets = userSets;
  const canvas = document.getElementById('category-chart');
  if (!canvas) return;

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

  if (categoryChart) categoryChart.destroy();
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
          labels: { color: textColor, padding: 15, font: { size: 13 } }
        }
      }
    }
  });
}

// ===== DASHBOARD =====
function updateDashboard() {
  const sets = userSets;
  document.getElementById('total-sets').textContent = sets.length;
  const totalPieces = sets.reduce((sum, set) => sum + (set.pieceCount || 0), 0);
  document.getElementById('total-pieces').textContent = totalPieces.toLocaleString();

  const recentlyAdded = sets.length > 0 ? sets[0] : null;
  const recentlyAddedElement = document.getElementById('recently-added');
  recentlyAddedElement.textContent = recentlyAdded ? recentlyAdded.name : '-';

  document.getElementById('status-completed').textContent = sets.filter(s => s.status === 'completed').length;
  document.getElementById('status-in-progress').textContent = sets.filter(s => s.status === 'in-progress').length;
  document.getElementById('status-not-started').textContent = sets.filter(s => s.status === 'not-started').length;

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
      if (cache.length > 200) cache.shift();
      localStorage.setItem(IMG_CACHE_KEY, JSON.stringify(cache));
    }
  } catch (e) { localStorage.removeItem(IMG_CACHE_KEY); }
}

function loadAndCacheImage(imgEl, originalUrl) {
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

  grid.querySelectorAll('img[data-original-url]').forEach(img => {
    const originalUrl = img.dataset.originalUrl;
    if (!isImageCached(originalUrl)) loadAndCacheImage(img, originalUrl);
    else {
      img.onload = function() { this.style.opacity = '1'; this.parentElement.classList.remove('card-image-skeleton'); };
      img.onerror = function() { this.style.opacity = '1'; this.src = 'https://images.pexels.com/photos/3961954/pexels-photo-3961954.jpeg?w=200'; this.parentElement.classList.remove('card-image-skeleton'); };
    }
  });
}

function filterAndRenderCollection() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase()
  const activeFilter = document.querySelector('.filter-btn.active')
  const selectedCategory = activeFilter ? activeFilter.dataset.filter : 'all'
  const selectedPieceCount = document.getElementById('piece-count-filter').value;

  let sets = [...userSets];
  if (selectedCategory !== 'all') sets = sets.filter(set => set.category === selectedCategory);
  if (searchTerm) sets = sets.filter(set => set.name.toLowerCase().includes(searchTerm));
  if (selectedPieceCount !== 'all') {
    sets = sets.filter(set => {
      if (selectedPieceCount === 'under-200') return set.pieceCount < 200;
      if (selectedPieceCount === '200-500') return set.pieceCount >= 200 && set.pieceCount <= 500;
      if (selectedPieceCount === '500-1000') return set.pieceCount > 500 && set.pieceCount <= 1000;
      if (selectedPieceCount === 'over-1000') return set.pieceCount > 1000;
      return true;
    });
  }
  renderCollectionGrid(sets)
}

// ===== NAVIGATION =====
function initializeNavigation() {
  const navLinks = document.querySelectorAll('.nav-link')
  navLinks.forEach(link => {
    if (link.id === 'logout-btn') return;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = link.dataset.section;
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.getElementById(sectionId).classList.add('active');
      navLinks.forEach(l => { if (l.id !== 'logout-btn') l.classList.remove('active'); });
      link.classList.add('active');
      sessionStorage.setItem('legoTrackerActiveSection', sectionId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    })
  })
}

function restoreActiveSection() {
  const savedSection = sessionStorage.getItem('legoTrackerActiveSection');
  if (savedSection) {
    const link = document.querySelector(`[data-section="${savedSection}"]`);
    if (link) { link.click(); }
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
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      filterAndRenderCollection();
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
    if (editBtn) openEditModal(editBtn.dataset.id);
    else if (deleteBtn) deleteSet(deleteBtn.dataset.id);
  });

  closeBtn.addEventListener('click', () => { modal.style.display = 'none'; editingSetId = null; });

  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser || !editingSetId) return;

    const fileInput = document.getElementById('edit-image');
    const file = fileInput.files[0];

    const updateFirestoreSet = async (imgUrl) => {
      try {
        const setRef = doc(db, `users/${currentUser.uid}/sets`, editingSetId);
        await updateDoc(setRef, {
          name: document.getElementById('edit-name').value,
          pieceCount: parseInt(document.getElementById('edit-pieces').value),
          category: document.getElementById('edit-category').value,
          status: document.getElementById('edit-status').value,
          imageUrl: imgUrl
        });
        modal.style.display = 'none';
        editingSetId = null;
        editForm.reset();
      } catch (err) { console.error("Update error:", err); }
    };

    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => updateFirestoreSet(event.target.result);
      reader.readAsDataURL(file);
    } else {
      const existingSet = userSets.find(s => s.id === editingSetId);
      updateFirestoreSet(existingSet.imageUrl);
    }
  });
}

function deleteSet(id) {
  if (confirm('Are you sure you want to delete this Lego set?')) {
    const setRef = doc(db, `users/${currentUser.uid}/sets`, id);
    deleteDoc(setRef).catch(err => console.error("Delete error:", err));
  }
}

function openEditModal(id) {
  const set = userSets.find(s => s.id === id);
  if (!set) return;
  editingSetId = id;
  document.getElementById('edit-name').value = set.name;
  document.getElementById('edit-pieces').value = set.pieceCount;
  document.getElementById('edit-category').value = set.category;
  document.getElementById('edit-status').value = set.status || 'not-started';
  document.getElementById('edit-modal').style.display = 'flex';
}

// ===== ADD SET FORM =====
let apiImageUrl = null;

function initializeAddSetForm() {
  const form = document.getElementById('add-set-form')
  const successMessage = document.getElementById('success-message')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (!currentUser) return;

    const formData = new FormData(form)
    const newSetName = formData.get('set-name').trim().toLowerCase();
    
    // Duplicate check
    const isDuplicate = userSets.some(s => s.name.toLowerCase() === newSetName);
    if (isDuplicate) {
      alert('⚠️ This set is already in your collection!');
      return;
    }

    const fileInput = document.getElementById('image-upload');
    const file = fileInput.files[0];

    const createSetInFirestore = async (imgUrl) => {
      try {
        await addDoc(collection(db, `users/${currentUser.uid}/sets`), {
          name: formData.get('set-name'),
          pieceCount: parseInt(formData.get('piece-count')),
          category: formData.get('category'),
          status: formData.get('status') || 'not-started',
          imageUrl: imgUrl,
          dateAdded: serverTimestamp()
        });
        form.reset(); apiImageUrl = null;
        successMessage.style.display = 'block';
        setTimeout(() => successMessage.style.display = 'none', 3000);
      } catch (err) { console.error("Add error:", err); }
    };

    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => createSetInFirestore(event.target.result);
      reader.readAsDataURL(file);
    } else if (apiImageUrl) { createSetInFirestore(apiImageUrl); }
    else { createSetInFirestore('https://images.pexels.com/photos/3961954/pexels-photo-3961954.jpeg?w=200'); }
  })
}

// ===== REBRICKABLE API =====
function initializeApiAutoFill() {
  const btn = document.getElementById('api-autofill-btn');
  const input = document.getElementById('api-set-number');
  const statusEl = document.getElementById('api-status');

  btn.addEventListener('click', async () => {
    let setNum = input.value.trim();
    if (!setNum) { statusEl.textContent = '⚠️ Please enter a set number'; return; }
    if (!setNum.includes('-')) setNum += '-1';

    btn.disabled = true; btn.textContent = 'Fetching...'; statusEl.textContent = '🔄 Searching...';

    try {
      const response = await fetch(`https://rebrickable.com/api/v3/lego/sets/${setNum}/`, {
        headers: { 'Authorization': `key ${REBRICKABLE_API_KEY}` }
      });
      if (!response.ok) throw new Error('Set not found!');
      
      const data = await response.json();
      document.getElementById('set-name').value = data.name || '';
      document.getElementById('piece-count').value = data.num_parts || '';
      if (data.set_img_url) apiImageUrl = data.set_img_url;
      statusEl.textContent = `✅ Found: ${data.name}`;
      statusEl.style.color = '#28a745';
    } catch (err) { statusEl.textContent = `❌ ${err.message}`; statusEl.style.color = '#dc3545'; }
    finally { btn.disabled = false; btn.textContent = 'Auto-Fill'; }
  });
}

// ===== THEME =====
function initializeThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('legoTrackerTheme') || 'light';
  document.documentElement.dataset.theme = savedTheme;
  toggleBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

  toggleBtn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    toggleBtn.textContent = next === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('legoTrackerTheme', next);
    updateChart();
  });
}

// ===== AUTH =====
function initializeAuth() {
  const googleBtn = document.getElementById('google-login-btn');
  const logoutBtn = document.getElementById('logout-btn');

  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        await setDoc(doc(db, "users", result.user.uid), {
          username: result.user.displayName,
          email: result.user.email,
          lastLogin: serverTimestamp()
        }, { merge: true });
        localStorage.setItem('legoTrackerLoggedIn', 'true');
      } catch (err) {
        console.error("Login Error:", err);
      }
    });
  }

  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('legoTrackerLoggedIn');
    signOut(auth);
  });
}

// ===== REAL-TIME SYNC =====
let unsubscribeSets = null;
function setupRealtimeSync(user) {
  if (unsubscribeSets) unsubscribeSets();
  const q = query(collection(db, `users/${user.uid}/sets`), orderBy("dateAdded", "desc"));
  unsubscribeSets = onSnapshot(q, (snapshot) => {
    userSets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    updateDashboard(); filterAndRenderCollection();
  });
}

function handleAuthChange(user) {
  currentUser = user;
  const landingPage = document.getElementById('landing-page');
  const navbar = document.getElementById('main-navbar');
  const content = document.getElementById('main-content');

  if (user) {
    localStorage.setItem('legoTrackerLoggedIn', 'true');
    landingPage.style.display = 'none';
    navbar.style.display = 'block';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    setupRealtimeSync(user);
    restoreActiveSection();
  } else {
    localStorage.removeItem('legoTrackerLoggedIn');
    landingPage.style.display = 'flex';
    navbar.style.display = 'none';
    content.style.display = 'none';
    userSets = [];
    if (unsubscribeSets) unsubscribeSets();
  }

  const earlyStyle = document.getElementById('early-auth-style');
  if (earlyStyle) earlyStyle.remove();
}

// ===== INIT =====
function init() {
  initializeThemeToggle()
  initializeNavigation()
  initializeCollectionFilters()
  initializeAddSetForm()
  initializeCardActions()
  initializeAuth()
  initializeApiAutoFill()
  onAuthStateChanged(auth, handleAuthChange);
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
else { init(); }
