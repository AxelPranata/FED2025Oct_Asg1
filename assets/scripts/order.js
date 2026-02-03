import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

console.log("🔥 order.js loaded (v9)");

// ======================
// Firebase configuration
// ======================
const firebaseConfig = {
  apiKey: "AIzaSyDac46txTyLdtBlJ4gvcvl2yxTlduC_FUE",
  authDomain: "hawkers-native.firebaseapp.com",
  projectId: "hawkers-native",
  storageBucket: "hawkers-native.firebasestorage.app",
  messagingSenderId: "25256491882",
  appId: "1:25256491882:web:99a54c487373e155278313"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ======================
// Load products
// ======================
async function loadProducts() {
  const grid = document.getElementById("product-grid");

  if (!grid) {
    console.error("❌ product-grid not found in HTML");
    return;
  }

  grid.innerHTML = "";

  try {
    const snapshot = await getDocs(collection(db, "products"));
    console.log("📦 Products found:", snapshot.size);

    if (snapshot.size > 0) {
      snapshot.forEach(docSnap => {
        const p = docSnap.data();
        renderProduct(grid, p, docSnap.id);
      });
      return;
    }
  } catch (err) {
    console.warn("⚠ Firestore blocked (school WiFi)", err);
  }

  // ======================
  // FALLBACK DATA
  // ======================
  const fallbackProduct = {
    name: "Steam Chicken Rice",
    basePrice: 5,
    description: "Steam chicken rice is a classic dish featuring tender chicken.",
    imagePath: "assets/images/order/Steam Chicken Rice.jpg",
    likes: 201
  };

  renderProduct(grid, fallbackProduct, null);
}

// ======================
// Render product card
// ======================
function renderProduct(grid, p, docId) {
  const card = document.createElement("div");
  card.className = "product-card";

  let likes = p.likes ?? 0;

  card.innerHTML = `
    <img src="${p.imagePath}" alt="${p.name}">
    <div class="info">
      <div class="title-row">
        <h4>${p.name}</h4>
        <span class="price">$${Number(p.basePrice).toFixed(2)}</span>
      </div>

      <p class="description">${p.description ?? ""}</p>

      <div class="card-footer">
        <button class="like-btn">
          <img src="assets/icons/order/likes.png" alt="Like">
          <span class="like-count">${likes}</span>
        </button>
      </div>
    </div>
  `;

  const likeBtn = card.querySelector(".like-btn");
  const likeCount = card.querySelector(".like-count");

  likeBtn.addEventListener("click", async () => {
    likes += 1;
    likeCount.textContent = likes;

    if (!docId) return; // fallback mode, no Firestore

    try {
      await updateDoc(doc(db, "products", docId), {
        likes: likes
      });
    } catch (err) {
      console.error("❌ Failed to update likes", err);
    }
  });

  grid.appendChild(card);
}

// ======================
// Run on page load
// ======================
loadProducts();
