import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

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
const auth = getAuth(app);

/* =========================
   DOM
========================= */
const listEl = document.getElementById("history-list");
const statTotal = document.getElementById("stat-total");
const statCompleted = document.getElementById("stat-completed");
const statSpent = document.getElementById("stat-spent");

/* =========================
   LOAD HISTORY
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // 🔹 query only this user's orders
  const q = query(
    collection(db, "orders"),
    where("user.userId", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    listEl.innerHTML = `<p class="empty">No orders yet</p>`;
    return;
  }

  let totalOrders = 0;
  let completedOrders = 0;
  let totalSpent = 0;

  snap.forEach(docSnap => {
    const order = docSnap.data();

    totalOrders++;

    if (order.status === "paid") completedOrders++;

    totalSpent += order.pricing?.total ?? 0;

    // 🔹 Get first item name (for card title)
    const firstItem = order.items?.[0]?.name ?? "Order";

    // 🔹 Format time
    let timeText = "";
    if (order.payment?.paidAt?.toDate) {
      const date = order.payment.paidAt.toDate();
      timeText = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    // 🔹 Create card
    const card = document.createElement("div");
    card.className = "history-card";

    card.innerHTML = `
    <div class="status">Delivered</div>

    <div class="history-row main-row">
        <div>
        <div class="title">${firstItem}</div>
        <div class="meta">
            <span>🕒 ${timeText}</span>
            <span>📍 ${
            order.fulfillment?.type === "delivery"
              ? order.fulfillment?.address?.line1 ?? "No Address"
              : order.hawker?.centreName ?? "Unknown Centre"}</span>
            <span>📍 ${order.fulfillment?.type ?? "Takeout"}</span>
        </div>
        </div>

        <div class="price">$${order.pricing?.total?.toFixed(2) ?? "0.00"}</div>
    </div>

    <div class="history-details" style="display:none;">
  ${order.items.map(i => `
    <div class="detail-item">
      ${i.quantity}× ${i.name} — $${i.itemTotal.toFixed(2)}
    </div>
  `).join("")}

  <div class="detail-item">
    Subtotal: $${order.pricing?.subtotal?.toFixed(2) ?? "0.00"}
  </div>

  ${order.fulfillment?.type === "delivery"
    ? `<div class="detail-item">Delivery Fee: $${order.pricing?.deliveryFee?.toFixed(2) ?? "0.00"}</div>`
    : `<div class="detail-item">Takeaway Charge: $${order.pricing?.takeoutFee?.toFixed(2) ?? "0.00"}</div>`}

  ${order.pricing?.minOrderFee > 0
    ? `<div class="detail-item">Min Order Fee: $${order.pricing.minOrderFee.toFixed(2)}</div>`
    : ""}

  ${order.pricing?.promoCode
    ? `<div class="detail-item">
        Promo (${order.pricing.promoCode}): ${
          order.pricing?.promoType === "percent"
            ? `-${order.pricing.promoDiscount}%`
            : `-$${Number(order.pricing?.promoDiscount ?? 0).toFixed(2)}`
        }
      </div>`
    : ""}

    <div class="detail-item">
      Payment Method: ${order.payment?.method?.toUpperCase() ?? "UNKNOWN"}
    </div>

  <div class="detail-total">
    Total: $${order.pricing?.total?.toFixed(2) ?? "0.00"}
  </div>
</div>

    `;

    card.querySelector(".main-row").onclick = () => {
    const details = card.querySelector(".history-details");
    details.style.display =
        details.style.display === "none" ? "block" : "none";
    };


    listEl.appendChild(card);
  });

  /* =========================
     STATS
  ========================= */
  statTotal.textContent = `Total Order: ${totalOrders}`;
  statCompleted.textContent = `Completed: ${completedOrders}`;
  statSpent.textContent = `Total Spent: $${totalSpent.toFixed(2)}`;
});
