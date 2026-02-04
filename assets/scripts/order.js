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
   Firebase config (UNCHANGED)
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
   URL PARAMS (NEW)
========================= */
const params = new URLSearchParams(window.location.search);

let centerId = params.get("centerId");
let stallId = params.get("stallId");

if (!centerId || !stallId) {
  console.error("❌ Missing centerId or stallId in URL");
  console.error("Expected: ?centerId=050335&stallId=01-01");
  throw new Error("Missing navigation context");
}


/* =========================
   Render products (SAME LOGIC)
========================= */
const grid = document.getElementById("product-grid");
if (!grid) throw new Error("❌ #product-grid not found");

const productsRef = collection(
  db,
  "hawker-centers",
  centerId,
  "food-stalls",
  stallId,
  "products"
);

console.log("centerId:", centerId);
console.log("stallId:", stallId);
console.log("Loading products...");

const snap = await getDocs(productsRef);

snap.forEach(docSnap => {
  const product = docSnap.data();
  const productId = docSnap.id;

  const card = document.createElement("div");
  card.className = "product-card";

  card.innerHTML = `
    <img src="${product.imagePath}">
    <div class="info">
      <h4>${product.name}</h4>
      <p class="desc">${product.description}</p>

      <button class="like-btn">
        <img src="assets/icons/order/likes.png">
        <span class="like-count">${product.likes ?? 0}</span>
      </button>

      <p class="price">$${product.basePrice}</p>
    </div>
  `;

  /* LIKE BUTTON (UNCHANGED) */
  const likeBtn = card.querySelector(".like-btn");
  const likeCount = card.querySelector(".like-count");

  likeBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    likeCount.textContent = Number(likeCount.textContent) + 1;

    await updateDoc(
      doc(productsRef, productId),
      { likes: increment(1) }
    );
  });

  /* NAVIGATION (UNCHANGED, just added params) */
  card.addEventListener("click", () => {
    window.location.href =
      `addtocart.html?centerId=${centerId}&stallId=${stallId}&productId=${productId}`;
  });

  grid.appendChild(card);
});
