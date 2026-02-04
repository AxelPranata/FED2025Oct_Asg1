import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔒 YOUR VENDOR / AUTH UID
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
              ? `<img src="${item.image}" />`
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
          <p class="item-description">${item.description}</p>
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
            >
              Edit
            </button>
          </div>
        </div>
      `;

      grid.appendChild(card);
    });

    container.appendChild(section);
  });
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
    { label: "Total Items", value: menuItems.length },
    { label: "Categories", value: categories.length },
    { label: "Popular Items", value: menuItems.filter(i => i.popular).length },
    { label: "Avg Price", value: `$${avgPrice}` }
  ];

  stats.forEach(stat => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="card-content stats-card">
        <p class="stat-label">${stat.label}</p>
        <p class="stat-value">${stat.value}</p>
      </div>
    `;

    statsGrid.appendChild(card);
  });
}

/* =========================
   EDIT MENU ITEM
========================= */
async function editMenuItem(item) {
  const newName = prompt("Edit name:", item.name);
  if (newName === null) return;

  const newPrice = prompt("Edit price:", item.price);
  if (newPrice === null) return;

  const newCategory = prompt("Edit category:", item.category);
  if (newCategory === null) return;

  const itemRef = doc(
    db,
    "vendors",
    VENDOR_ID,
    "menu",
    item.id
  );

  await updateDoc(itemRef, {
    name: newName,
    price: Number(newPrice),
    category: newCategory
  });

  alert("Menu item updated");
  loadMenu();
}

/* =========================
   CLICK HANDLER (EDIT)
========================= */
document.addEventListener("click", e => {
  const btn = e.target.closest(".btn-edit");
  if (!btn) return;

  const item = menuItems.find(i => i.id === btn.dataset.id);
  if (!item) return;

  editMenuItem(item);
});

/* =========================
   INIT
========================= */
loadMenu();
