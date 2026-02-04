import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

/* Firebase config (UNCHANGED) */
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
const centerId = params.get("centerId");
const stallId = params.get("stallId");
const productId = params.get("productId");

if (!centerId || !stallId || !productId) {
  throw new Error("❌ Missing centerId / stallId / productId");
}

/* =========================
   PRODUCT DOC
========================= */
const productRef = doc(
  db,
  "hawker-centers",
  centerId,
  "food-stalls",
  stallId,
  "products",
  productId
);

const productSnap = await getDoc(productRef);
if (!productSnap.exists()) throw new Error("❌ Product not found");

const product = productSnap.data();

/* =========================
   DOM
========================= */
const productCard = document.getElementById("product-card");
const qtyEl = document.getElementById("qty");
const priceEl = document.getElementById("total-price");

let quantity = 1;
let basePrice = Number(product.basePrice ?? 0);

/* =========================
   RENDER PRODUCT
========================= */
productCard.innerHTML = `
  <h2 class="product-title">${product.name}</h2>
  <img src="${product.imagePath}">
  <p class="product-desc">${product.description}</p>
`;

/* =========================
   ADDONS (extras / meat / rice)
========================= */
const addonsRef = collection(productRef, "addons");
const addonsSnap = await getDocs(addonsRef);

addonsSnap.forEach(groupSnap => {
  const group = groupSnap.data();
  if (!Array.isArray(group.options)) return;

  const wrapper = document.createElement("div");
  wrapper.className = "addon-group";
  wrapper.innerHTML = `<h4>${group.title}</h4>`;

  group.options.forEach((opt, i) => {
    const checked =
      group.type === "radio" && group.required && i === 0
        ? "checked"
        : "";

    wrapper.innerHTML += `
      <div class="addon-item">
        <label>
          <input
            type="${group.type}"
            name="${groupSnap.id}"
            data-price="${opt.price}"
            ${checked}
          >
          ${opt.label}
        </label>
        <span>$${opt.price.toFixed(2)}</span>
      </div>
    `;
  });

  productCard.appendChild(wrapper);
});

/* =========================
   PRICE LOGIC (UNCHANGED)
========================= */
function calculateTotal() {
  let addonsTotal = 0;

  document.querySelectorAll(".addon-item input:checked")
    .forEach(i => addonsTotal += Number(i.dataset.price || 0));

  priceEl.textContent =
    `$${((basePrice + addonsTotal) * quantity).toFixed(2)}`;
}

document.addEventListener("change", calculateTotal);

document.getElementById("qty-plus").onclick = () => {
  quantity++;
  qtyEl.textContent = quantity;
  calculateTotal();
};

document.getElementById("qty-minus").onclick = () => {
  if (quantity > 1) quantity--;
  qtyEl.textContent = quantity;
  calculateTotal();
};

calculateTotal();
