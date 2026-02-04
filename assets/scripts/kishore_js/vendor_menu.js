import { db, auth } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";




let menuItems = [];
let categories = [];

async function loadMenu() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      console.error("User not logged in");
      return;
    }

    const vendorId = user.uid;

    const menuRef = collection(db, "vendors", vendorId, "menu");
    const snapshot = await getDocs(menuRef);

    menuItems = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // derive categories dynamically
    categories = [...new Set(menuItems.map(i => i.category))];

    renderMenuCategories();
    renderStats();
  });
}


function renderMenuCategories() {
  const container = document.getElementById('menu-categories');
  container.innerHTML = "";

  categories.forEach(category => {
    const categoryItems = menuItems.filter(item => item.category === category);
    
    if (categoryItems.length === 0) return;

    const section = document.createElement('div');
    section.className = 'category-section';

    section.innerHTML = `
      <div class="category-header">
        <i data-lucide="tag" class="icon icon-orange"></i>
        <h3 class="category-title">${category}</h3>
        <span class="badge badge-count">${categoryItems.length} items</span>
      </div>
      <div class="grid" id="category-${category.replace(/\s+/g, '-')}"></div>
    `;

    container.appendChild(section);

    const grid = section.querySelector('.grid');
    categoryItems.forEach(item => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="item-image">
          ${item.image ? 
            `<img src="${item.image}" alt="${item.name}" />` : 
            `<div class="no-image">
              <i data-lucide="camera" class="icon-xl icon-gray"></i>
              <p class="no-image-text">No image</p>
            </div>`
          }
          ${item.popular ? 
            `<div class="badge-overlay badge-left">
              <span class="badge badge-popular">🔥 Popular</span>
            </div>` : ''
          }
        </div>
        <div class="item-header">
          <h4 class="item-title">${item.name}</h4>
          <p class="item-description">${item.description}</p>
        </div>
        <div class="card-content">
          <div class="price-section">
            <div class="price-display">
              <i data-lucide="dollar-sign" class="icon icon-orange"></i>
              <span class="price-amount">${item.price.toFixed(2)}</span>
              <span class="price-currency">SGD</span>
            </div>
          </div>
          <div class="button-group">
            <button class="btn btn-outline btn-sm flex-1">
              <i data-lucide="edit" class="icon"></i>
              Edit
            </button>
            <button class="btn btn-outline btn-sm btn-delete">
              <i data-lucide="trash-2" class="icon"></i>
            </button>
          </div>
        </div>
      `;
      
      grid.appendChild(card);
    });
  });

  lucide.createIcons();
}

function renderStats() {
  const statsGrid = document.getElementById('stats-grid');
  
  const avgPrice = (menuItems.reduce((sum, i) => sum + i.price, 0) / menuItems.length).toFixed(2);

  const stats = [
    { label: 'Total Items', value: menuItems.length, color: 'default' },
    { label: 'Categories', value: categories.length, color: 'orange' },
    { label: 'Popular Items', value: menuItems.filter(i => i.popular).length, color: 'amber' },
    { label: 'Avg Price', value: `$${avgPrice}`, color: 'default' }
  ];

  stats.forEach(stat => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-content stats-card">
        <p class="stat-label">${stat.label}</p>
        <p class="stat-value stat-value-${stat.color}">${stat.value}</p>
      </div>
    `;
    statsGrid.appendChild(card);
  });
}

loadMenu();