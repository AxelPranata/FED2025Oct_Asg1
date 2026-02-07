import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  increment,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import {
  getAuth
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

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
const auth = getAuth(app);

/* =========================
   URL PARAMS
========================= */
const params = new URLSearchParams(window.location.search);

let centerId = params.get("centerId");
let stallId = params.get("stallId");
document.querySelector('#breadcrumbs ul li:nth-child(2) a').href = `/food_stalls.html?centerId=${centerId}`;

if (!centerId || !stallId) {
  console.error("❌ Missing centerId or stallId in URL");
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
   Load products from Firestore  ✅ FIXED
========================= */
const productsRef = collection(stallRef, "products");
const productsSnap = await getDocs(productsRef);

const allProducts = productsSnap.docs.map(docSnap => ({
  id: docSnap.id,
  ...docSnap.data()
}));

/* =========================
   Render products
========================= */
const grid = document.getElementById("products-grid");

let renderToken = 0;

function renderProducts(products, isSearch = false) {
  const currentToken = ++renderToken;

  grid.innerHTML = "";

  const searchTitle = document.getElementById("search-title");
  searchTitle.style.display = isSearch ? "block" : "none";

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="empty-search">
        <h4>No products found</h4>
        <p>Try searching something else.</p>
      </div>
    `;
    return;
  }

  (async () => {
    for (const product of products) {

      // 🛑 stop if a new render started
      if (currentToken !== renderToken) return;

      const card = document.createElement("div");
      card.className = "product-card";

      card.innerHTML = `
        <img src="${product.imagePath || "assets/images/placeholder.png"}" alt="${product.name}">
        <div class="info">
          <h4>${product.name}</h4>
          <p class="price">$${product.basePrice ?? "--"}</p>

          <button class="like-btn">
            <img class="like-icon" src="assets/icons/order/unlike.svg" alt="like">
            <span class="like-count">${product.likes ?? 0}</span>
          </button>
        </div>
      `;

      const likeBtn = card.querySelector(".like-btn");
      const likeIcon = card.querySelector(".like-icon");
      const likeCount = card.querySelector(".like-count");

      const userId = auth.currentUser?.uid;
      const productRef = doc(productsRef, product.id);
      const likeRef = doc(productRef, "likes", userId);

      if (userId) {
        const likeDoc = await getDoc(likeRef);

        // 🛑 stop if render changed while awaiting
        if (currentToken !== renderToken) return;

        likeIcon.src = likeDoc.exists()
          ? "assets/icons/order/unlike.svg"
          : "assets/icons/order/like.svg";
      }

      likeBtn.addEventListener("click", async (e) => {
        e.stopPropagation();

        const userId = auth.currentUser?.uid;
        if (!userId) {
          alert("You must be signed in to like!");
          return;
        }

        try {
          await runTransaction(db, async (transaction) => {
            const likeDoc = await transaction.get(likeRef);

            if (!likeDoc.exists()) {
              transaction.set(likeRef, { userId, timestamp: serverTimestamp() });
              transaction.update(productRef, { likes: increment(1) });

              likeCount.textContent = Number(likeCount.textContent) + 1;
              likeIcon.src = "assets/icons/order/unlike.svg";
            } else {
              transaction.delete(likeRef);
              transaction.update(productRef, { likes: increment(-1) });

              likeCount.textContent = Number(likeCount.textContent) - 1;
              likeIcon.src = "assets/icons/order/like.svg";
            }
          });
        } catch (e) {
          console.error("Transaction failed: ", e);
        }
      });

      card.addEventListener("click", () => {
        window.location.href =
          `addtocart.html?centerId=${centerId}&stallId=${stallId}&productId=${product.id}`;
      });

      grid.appendChild(card);
    }
  })();
}

/* Initial render */
renderProducts(allProducts);

/* SEARCH */
const searchInput = document.getElementById("search-input");

searchInput.addEventListener("input", () => {
  const keyword = searchInput.value.toLowerCase().trim();

  if (!keyword) {
    renderProducts(allProducts, false);
    return;
  }

  const filtered = allProducts.filter(p =>
    p.name?.toLowerCase().includes(keyword)
  );

  renderProducts(filtered, true);
});



