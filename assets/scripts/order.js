import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";



/* =========================
   Firebase config
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyDac46txTyLdtBlJ4gvcvl2yxTlduC_FUE",
  authDomain: "hawkers-native.firebaseapp.com",
  projectId: "hawkers-native",
  storageBucket: "hawkers-native.firebasestorage.app",
  messagingSenderId: "25256491882",
  appId: "1:25256491882:web:99a54c487373e155278313"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =========================
   Render products
========================= */
console.log("order.js loaded");

const grid = document.getElementById("product-grid");

if (!grid) {
  throw new Error("❌ #product-grid not found");
}

const snap = await getDocs(collection(db, "products"));

snap.forEach(docSnap => {
  const product = docSnap.data();
  const productId = docSnap.id; // ✅ FIRESTORE DOC ID

  const card = document.createElement("div");
  card.className = "product-card";

card.innerHTML = `
  <img src="${product.imagePath}">
  <div class="info">
    <h4>${product.name}</h4>
    <p class="desc">${product.description}</p>

    <button class="like-btn">
      <img src="assets/icons/order/likes.png" class="like-icon">
      <span class="like-count">${product.likes ?? 0}</span>
    </button>

    <p class="price">$${product.basePrice}</p>
  </div>
`;

const likeBtn = card.querySelector(".like-btn");
const likeCount = card.querySelector(".like-count");

likeBtn.addEventListener("click", async (e) => {
  e.stopPropagation();

  likeCount.textContent =
    Number(likeCount.textContent) + 1;

  await updateDoc(
    doc(db, "products", productId),
    { likes: increment(1) }
  );
});


  // ✅ THIS IS THE MAGIC LINE
  card.addEventListener("click", () => {
    window.location.href =
      `addtocart.html?productId=${encodeURIComponent(productId)}`;
  });

  grid.appendChild(card);
});
