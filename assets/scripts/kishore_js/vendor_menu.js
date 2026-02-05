import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth, db } from "./kiki_firebase.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const VENDOR_ID = "4I9X843cHGcdTZINaPiAY0DRwFx2";

let menuItems = [];
let categories = [];

/* =========================
   LOAD MENU FROM FIRESTORE
========================= */
async function loadMenu() {
  try {
    const menuRef = collection(db, "vendors", VENDOR_ID, "menu");
    const snapshot = await getDocs(menuRef);

    menuItems = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    categories = [...new Set(menuItems.map(i => i.category))];

    renderMenuCategories();
    renderStats();
  } catch (err) {
    console.error("Failed to load menu:", err);
    document.getElementById("menu-categories").innerHTML = 
      '<p style="color: red; padding: 20px;">Please log in to view the menu.</p>';
  }
}

/* =========================
   RENDER MENU
========================= */
function renderMenuCategories() {
  const container = document.getElementById("menu-categories");
  container.innerHTML = "";

  categories.forEach(category => {
    const items = menuItems.filter(i => i.category === category);
    if (items.length === 0) return;

    const section = document.createElement("div");
    section.className = "category-section";

    section.innerHTML = `
      <div class="category-header">
        <h3 class="category-title">${category}</h3>
        <span class="badge badge-count">${items.length} items</span>
      </div>
      <div class="grid"></div>
    `;

    const grid = section.querySelector(".grid");

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <div class="item-image">
          ${
            item.image
              ? `<img src="${item.image}" alt="${item.name}" />`
              : `<div class="no-image">No image</div>`
          }
          ${
            item.popular
              ? `<div class="badge-overlay badge-left">
                   <span class="badge badge-popular">🔥 Popular</span>
                 </div>`
              : ""
          }
        </div>

        <div class="item-header">
          <h4 class="item-title">${item.name}</h4>
          <p class="item-description">${item.description || 'No description'}</p>
        </div>

        <div class="card-content">
          <div class="price-display">
            <span class="price-amount">${Number(item.price).toFixed(2)}</span>
            <span class="price-currency">SGD</span>
          </div>

          <div class="button-group">
            <button
              class="btn btn-outline btn-sm btn-edit"
              data-id="${item.id}"
              title="Edit item"
            >
              <i data-lucide="edit" class="icon"></i>
              Edit
            </button>
            <button
              class="btn btn-outline btn-sm btn-delete"
              data-id="${item.id}"
              title="Delete item"
            >
              <i data-lucide="trash-2" class="icon"></i>
              Delete
            </button>
          </div>
        </div>
      `;

      grid.appendChild(card);
    });

    container.appendChild(section);
  });

  // Re-init Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

/* =========================
   STATS
========================= */
function renderStats() {
  const statsGrid = document.getElementById("stats-grid");
  statsGrid.innerHTML = "";

  const avgPrice =
    menuItems.length === 0
      ? 0
      : (
          menuItems.reduce((sum, i) => sum + Number(i.price), 0) /
          menuItems.length
        ).toFixed(2);

  const stats = [
    { label: "Total Items", value: menuItems.length, icon: "utensils" },
    { label: "Categories", value: categories.length, icon: "folder" },
    { label: "Popular Items", value: menuItems.filter(i => i.popular).length, icon: "flame" },
    { label: "Avg Price", value: `$${avgPrice}`, icon: "dollar-sign" }
  ];

  stats.forEach(stat => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="card-content stats-card">
        <i data-lucide="${stat.icon}" class="stat-icon"></i>
        <p class="stat-label">${stat.label}</p>
        <p class="stat-value">${stat.value}</p>
      </div>
    `;

    statsGrid.appendChild(card);
  });

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

/* =========================
   ADD MENU ITEM
========================= */
window.addMenuItem = function() {
  const modalHTML = `
    <div id="addModal" class="modal">
      <div class="modal-content">
        <h3>Add Menu Item</h3>
        <form id="addItemForm">
          <div class="form-group">
            <label>Item Name:</label>
            <input type="text" id="addName" placeholder="e.g., Chicken Rice" required>
          </div>
          <div class="form-group">
            <label>Description:</label>
            <textarea id="addDescription" placeholder="Brief description of the item" rows="3"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Price (SGD):</label>
              <input type="number" id="addPrice" placeholder="5.00" step="0.01" min="0" required>
            </div>
            <div class="form-group">
              <label>Category:</label>
              <input type="text" id="addCategory" placeholder="e.g., Main Dishes" list="categories" required>
              <datalist id="categories">
                ${categories.map(cat => `<option value="${cat}">`).join('')}
              </datalist>
            </div>
          </div>
          <div class="form-group">
            <label>Image URL (optional):</label>
            <input type="url" id="addImage" placeholder="https://...">
          </div>
          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" id="addPopular">
              Mark as Popular Item
            </label>
          </div>
          <div class="modal-buttons">
            <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Add Item</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  document.getElementById('addItemForm').onsubmit = async (e) => {
    e.preventDefault();
    
    const newItem = {
      name: document.getElementById('addName').value,
      description: document.getElementById('addDescription').value,
      price: Number(document.getElementById('addPrice').value),
      category: document.getElementById('addCategory').value,
      image: document.getElementById('addImage').value,
      popular: document.getElementById('addPopular').checked,
      createdAt: new Date().toISOString()
    };
    
    try {
      const menuRef = collection(db, "vendors", VENDOR_ID, "menu");
      await addDoc(menuRef, newItem);
      closeModal();
      showNotification('Success', 'Menu item added successfully!');
      loadMenu();
    } catch (error) {
      console.error('Error adding item:', error);
      showNotification('Error', 'Failed to add menu item. Please try again.');
    }
  };
};

/* =========================
   EDIT MENU ITEM
========================= */
async function editMenuItem(item) {
  const modalHTML = `
    <div id="editModal" class="modal">
      <div class="modal-content">
        <h3>Edit Menu Item</h3>
        <form id="editItemForm">
          <div class="form-group">
            <label>Item Name:</label>
            <input type="text" id="editName" value="${item.name}" required>
          </div>
          <div class="form-group">
            <label>Description:</label>
            <textarea id="editDescription" rows="3">${item.description || ''}</textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Price (SGD):</label>
              <input type="number" id="editPrice" value="${item.price}" step="0.01" min="0" required>
            </div>
            <div class="form-group">
              <label>Category:</label>
              <input type="text" id="editCategory" value="${item.category}" list="categories" required>
              <datalist id="categories">
                ${categories.map(cat => `<option value="${cat}">`).join('')}
              </datalist>
            </div>
          </div>
          <div class="form-group">
            <label>Image URL:</label>
            <input type="url" id="editImage" value="${item.image || ''}" placeholder="https://...">
          </div>
          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" id="editPopular" ${item.popular ? 'checked' : ''}>
              Mark as Popular Item
            </label>
          </div>
          <div class="modal-buttons">
            <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  document.getElementById('editItemForm').onsubmit = async (e) => {
    e.preventDefault();
    
    const updates = {
      name: document.getElementById('editName').value,
      description: document.getElementById('editDescription').value,
      price: Number(document.getElementById('editPrice').value),
      category: document.getElementById('editCategory').value,
      image: document.getElementById('editImage').value,
      popular: document.getElementById('editPopular').checked,
      updatedAt: new Date().toISOString()
    };
    
    try {
      const itemRef = doc(db, "vendors", VENDOR_ID, "menu", item.id);
      await updateDoc(itemRef, updates);
      closeModal();
      showNotification('Success', 'Menu item updated successfully!');
      loadMenu();
    } catch (error) {
      console.error('Error updating item:', error);
      showNotification('Error', 'Failed to update menu item. Please try again.');
    }
  };
}

/* =========================
   DELETE MENU ITEM
========================= */
async function deleteMenuItem(itemId) {
  if (confirm('Are you sure you want to delete this menu item? This action cannot be undone.')) {
    try {
      const itemRef = doc(db, "vendors", VENDOR_ID, "menu", itemId);
      await deleteDoc(itemRef);
      showNotification('Success', 'Menu item deleted successfully!');
      loadMenu();
    } catch (error) {
      console.error('Error deleting item:', error);
      showNotification('Error', 'Failed to delete menu item. Please try again.');
    }
  }
}

/* =========================
   CLICK HANDLERS
========================= */
document.addEventListener("click", e => {
  // Edit button
  const editBtn = e.target.closest(".btn-edit");
  if (editBtn) {
    const item = menuItems.find(i => i.id === editBtn.dataset.id);
    if (item) editMenuItem(item);
    return;
  }
  
  // Delete button
  const deleteBtn = e.target.closest(".btn-delete");
  if (deleteBtn) {
    deleteMenuItem(deleteBtn.dataset.id);
    return;
  }
  
  // Add button (in header)
  const addBtn = e.target.closest(".btn-primary");
  if (addBtn && addBtn.textContent.includes('Add Menu Item')) {
    addMenuItem();
    return;
  }
});

/* =========================
   HELPER FUNCTIONS
========================= */
window.closeModal = function() {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => modal.remove());
};

function showNotification(title, message) {
  const modalHTML = `
    <div id="notifModal" class="modal">
      <div class="modal-content modal-small">
        <h3>${title}</h3>
        <p>${message}</p>
        <button class="btn btn-primary" onclick="closeModal()">OK</button>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/* =========================
   INIT - WAIT FOR AUTH
========================= */
onAuthStateChanged(auth, user => {
  console.log("AUTH USER:", user);
  
  if (user) {
    loadMenu();
  } else {
    console.log("No user logged in");
    document.getElementById("menu-categories").innerHTML = 
      '<p style="padding: 20px;">Please log in to continue.</p>';
  }
});