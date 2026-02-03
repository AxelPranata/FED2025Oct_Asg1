import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

/* Firebase config (DO NOT CHANGE) */
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

/* DOM */
const productCard = document.getElementById("product-card");
const qtyEl = document.getElementById("qty");
const priceEl = document.getElementById("total-price");
const minusBtn = document.getElementById("qty-minus");
const plusBtn = document.getElementById("qty-plus");

/* Get productId */
const params = new URLSearchParams(window.location.search);
const productId = params.get("productId");

if (!productId) {
  productCard.innerHTML = "<p>❌ No product selected</p>";
  throw new Error("Missing productId");
}

/* Fetch product */
const productSnap = await getDoc(doc(db, "products", productId));

if (!productSnap.exists()) {
  productCard.innerHTML = "<p>❌ Product not found</p>";
  throw new Error("Product not found");
}

const product = productSnap.data();

/* ✅ Use basePrice from Firebase (your DB field) */
let basePrice = Number(product.basePrice ?? 0);
let quantity = 1;

/* Render product */
productCard.innerHTML = `
  <h2 class="product-title">${product.name ?? ""}</h2>
  <img src="${product.imagePath ?? ""}" alt="${product.name ?? "Product"}">
  <p class="product-desc">${product.description ?? ""}</p>
`;

/* Fetch addons (subcollection) */
const addonsSnap = await getDocs(collection(db, "products", productId, "addons"));

/* Render addon groups */
addonsSnap.forEach(docSnap => {
  const addon = docSnap.data();
  if (!addon || !Array.isArray(addon.options)) return;

  const group = document.createElement("div");
  group.className = "addon-group";

  group.innerHTML = `<h4>${addon.title ?? "Options"}</h4>`;

  addon.options.forEach((opt, index) => {
    const optPrice = Number(opt.price ?? 0);

    // For required radio groups: make first option checked by default
    const shouldDefaultCheck =
      addon.type === "radio" && addon.required === true && index === 0;

    group.innerHTML += `
      <div class="addon-item">
        <label>
          <input
            type="${addon.type === "radio" ? "radio" : "checkbox"}"
            name="${addon.title ?? docSnap.id}"
            data-price="${optPrice}"
            ${addon.required === true && addon.type === "radio" ? "required" : ""}
            ${shouldDefaultCheck ? "checked" : ""}
          >
          ${opt.label ?? ""}
        </label>
        <span>$${optPrice.toFixed(2)}</span>
      </div>
    `;
  });

  productCard.appendChild(group);
});

/* ✅ Price calculation */
function calculateTotal() {
  let addonsTotal = 0;

  document
    .querySelectorAll(".addon-item input:checked")
    .forEach(input => {
      addonsTotal += Number(input.dataset.price || 0);
    });

  const total = (basePrice + addonsTotal) * quantity;
  priceEl.textContent = `$${total.toFixed(2)}`;
}

/* ✅ Live update when options change */
document.addEventListener("change", e => {
  if (e.target && e.target.matches(".addon-item input")) {
    calculateTotal();
  }
});

/* ✅ Quantity controls */
plusBtn.addEventListener("click", () => {
  quantity++;
  qtyEl.textContent = quantity;
  calculateTotal();
});

minusBtn.addEventListener("click", () => {
  if (quantity > 1) {
    quantity--;
    qtyEl.textContent = quantity;
    calculateTotal();
  }
});

/* ✅ Initial total (after we rendered default selections) */
calculateTotal();
