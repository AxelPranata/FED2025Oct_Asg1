import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  addDoc,
  query,
  where
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

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

const auth = getAuth(app);

const container = document.getElementById("cart-items");
const subtotalEl = document.getElementById("subtotal");
const totalEl = document.getElementById("total");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const userId = user.uid;
  console.log("Logged in as:", userId);

  const itemsRef = collection(db, "carts", userId, "items");

  const snap = await getDocs(itemsRef);

  let subtotal = 0;
  container.innerHTML = "";

  snap.forEach(docSnap => {
    const item = docSnap.data();
    subtotal += (item.unitPrice ?? item.price ?? 0) * item.quantity;

    const div = document.createElement("div");
    div.className = "cart-item";

    div.innerHTML = `
      <img src="${item.imagePath}">
      <div class="cart-info">
        <h4>${item.quantity}x ${item.name}</h4>
        <p>${item.description ?? ""}</p>
        <span class="cart-price">$${Number(item.unitPrice ?? item.price ?? 0).toFixed(2)}</span>
        <div class="remove">Remove</div>
      </div>
    `;

    div.querySelector(".remove").onclick = async () => {
      await deleteDoc(doc(itemsRef, docSnap.id));
      location.reload();
    };

    container.appendChild(div);
  });

  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  // =========================
// FULFILLMENT LOGIC
// =========================
let fulfillmentType = "takeout";

const feesContainer = document.getElementById("fees");
const radios = document.querySelectorAll("input[name='fulfillment']");

radios.forEach(r => {
  r.addEventListener("change", () => {
    fulfillmentType = r.value;
    updateTotal(subtotal);
  });
});

function updateTotal(subtotal) {
  let total = subtotal;
  feesContainer.innerHTML = "";

  if (fulfillmentType === "takeout") {
    const takeoutFee = 0.30;
    total += takeoutFee;

    feesContainer.innerHTML = `
      <div class="summary-row">
        <span>Takeaway Charge</span>
        <span>$${takeoutFee.toFixed(2)}</span>
      </div>
    `;
  }

  if (fulfillmentType === "delivery") {
    const deliveryFee = 2.00;

    let minOrderFee = 0;
    if (subtotal < 10) {
      minOrderFee = 10 - subtotal;
      total += minOrderFee;
    }

    total += deliveryFee;

    feesContainer.innerHTML = `
      ${minOrderFee > 0 ? `
        <div class="summary-row">
          <span>Min Order Fee</span>
          <span>$${minOrderFee.toFixed(2)}</span>
        </div>
      ` : ""}

      <div class="summary-row">
        <span>Delivery Fee</span>
        <span>$${deliveryFee.toFixed(2)}</span>
      </div>
    `;
  }

  totalEl.textContent = `$${total.toFixed(2)}`;

  // store for payment.js
  sessionStorage.setItem("total", total.toFixed(2));
  sessionStorage.setItem("fulfillmentType", fulfillmentType);
}

// run once on load
updateTotal(subtotal);



  
  loadAppliedCodes(userId, subtotal);

  const promoCode = document.getElementById("promo-code");
  promoCode.addEventListener("submit", async (e) => {
    e.preventDefault();

    const inputCode = document.getElementById("input-code");
    const promoQuery = query(collection(db, "promotions"), where("code", "==", inputCode.value));
    const promoSnapshot = await getDocs(promoQuery);

    if (promoSnapshot.empty) {
      return alert("ℹ️ No promo codes found.");
    }

    const redemptionQuery = query(
      collection(db, "redemptions"),
      where("userId", "==", userId),
      where("code", "==", inputCode.value)
    );
    const redemptionSnapshot = await getDocs(redemptionQuery);

    if (!redemptionSnapshot.empty) {
      return alert("⚠️ You have already redeemed this promo code.");
    }

    const promoDoc = promoSnapshot.docs[0];
    const data = promoDoc.data();

    await addDoc(collection(db, "carts", userId, "appliedCodes"), {
      code: inputCode.value,
      discount: data.discount,
      type: data.type,
      description: data.description,
      redeemedAt: new Date().toLocaleDateString()
    });

    await addDoc(collection(db, "redemptions"), {
      userId,
      code: inputCode.value,
      type: data.type,
      description: data.description,
      redeemedAt: new Date()
    });

    await loadAppliedCodes(userId, subtotal);


    alert("✅ Promo code redeemed successfully!");
    promoCode.reset();
  });
});

/* =========================
   PAYMENT METHOD UI
========================= */

const paymentButtons = document.querySelectorAll(".payments button");
let selectedPaymentMethod = null;

paymentButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    // remove active (green) from all
    paymentButtons.forEach(b => b.classList.remove("active"));

    // make clicked one green
    btn.classList.add("active");

    // store selected payment method
    selectedPaymentMethod = btn.dataset.method;

    console.log("Selected payment:", selectedPaymentMethod);
  });
});

/* =========================
   PAY NOW BUTTON
========================= */
const payNowBtn = document.getElementById("pay-now");
payNowBtn.addEventListener("click", async () => {
  if (!selectedPaymentMethod) {
    alert("Please select a payment method");
    return;
  }

  const user = auth.currentUser;
  const fulfillmentType = sessionStorage.getItem("fulfillmentType") ?? "takeout";

  // 🔴 BLOCK delivery without address BEFORE payment page
  if (fulfillmentType === "delivery") {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    const hasAddress = userSnap.exists() && userSnap.data()?.address?.line1;

    if (!hasAddress) {
      alert("Please add your delivery address in your profile before checkout.");
      window.location.href = "user.html";
      return; // ⛔ STOP navigation to payment
    }
  }

  // ✅ continue to payment
  sessionStorage.setItem("paymentMethod", selectedPaymentMethod);
  window.location.href = "payment.html";
});



/* =========================
   CALCULATE PROMOTIONS
========================= */
function applyDiscount(total, discount, type) {
  if (type === "percent") {
    return total * (1 - discount / 100);
  }
  return total - discount;
}

function createDiscount(description, discount, type) {
  const div = document.createElement("div");
  div.className = "summary-row";

  const labelSpan = document.createElement("span");
  labelSpan.textContent = description;

  const valueSpan = document.createElement("span");
  valueSpan.className = "amount";
  valueSpan.textContent = type === "percent" ? `-${discount}%` : `-$${discount}`;

  div.append(labelSpan, valueSpan);
  return div;
}

async function loadAppliedCodes(userId, subtotal) {
  // const order_summary = document.querySelector(".order-summary");
  const discounts = document.getElementById("discounts")
  const appliedCodesRef = collection(db, "carts", userId, "appliedCodes");
  const snapshot = await getDocs(appliedCodesRef);

  let total = subtotal + 0.3;
  discounts.querySelectorAll("div").forEach(el => el.remove());

  snapshot.forEach(doc => {
    const data = doc.data();
    total = applyDiscount(total, data.discount, data.type);

    discounts.append(createDiscount(data.description, data.discount, data.type));
  });

  totalEl.textContent = `$${Math.max(total, 0).toFixed(2)}`;
  sessionStorage.setItem("total", Math.max(total, 0).toFixed(2));
}