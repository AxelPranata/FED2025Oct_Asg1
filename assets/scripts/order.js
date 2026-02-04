import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
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

let centerId = params.get("centerId") || params.get("hc");
let stallId = params.get("stallId") || params.get("fs");

if (!centerId || !stallId) {
  console.error("❌ Missing centerId or stallId in URL");
  console.error("Expected: ?centerId=050335&stallId=01-01");
  throw new Error("Missing navigation context");
}

/* =========================
   Load hawker centre + stall info
========================= */

const centerRef = doc(db, "hawker-centers", centerId);
const stallRef = doc(centerRef, "food-stalls", stallId);

const [centerSnap, stallSnap] = await Promise.all([
  getDoc(centerRef),
  getDoc(stallRef)
]);

if (!centerSnap.exists() || !stallSnap.exists()) {
  throw new Error("❌ Hawker centre or stall not found");
}

const center = centerSnap.data();
const stall = stallSnap.data();

/* =========================
   Inject into HTML
========================= */

document.getElementById("stall-name").textContent =
  `${stall.name || "Stall"} #${stallId}`;

document.getElementById("stall-location").textContent =
  center.name;

document.querySelector(".stall-banner").src =
  stall.imagePath || center.imagePath;

/* Back button */
document.getElementById("back-btn").href =
  `food_stalls.html?centerId=${centerId}`;



/* =========================
   Render products (REUSABLE)
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

const productsSnap = await getDocs(productsRef);

grid.innerHTML = "";

if (productsSnap.empty) {
  grid.innerHTML = "<p>No products available.</p>";
}

productsSnap.forEach(productDoc => {
  const product = productDoc.data();
  const productId = productDoc.id;

  const card = document.createElement("div");
  card.className = "product-card";

  card.innerHTML = `
    <img src="${product.imagePath}" alt="${product.name}">
    <div class="info">
      <h4>${product.name}</h4>
      <p class="price">$${product.basePrice ?? "--"}</p>

      <button class="like-btn">
        ❤️ <span class="like-count">${product.likes ?? 0}</span>
      </button>
    </div>
  `;

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

  card.addEventListener("click", () => {
    window.location.href =
      `addtocart.html?centerId=${centerId}&stallId=${stallId}&productId=${productId}`;
  });

  grid.appendChild(card);
});

