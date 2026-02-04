import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  deleteDoc
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
    subtotal += item.price * item.quantity;

    const div = document.createElement("div");
    div.className = "cart-item";

    div.innerHTML = `
      <img src="${item.imagePath}">
      <div class="cart-info">
        <h4>${item.quantity}x ${item.name}</h4>
        <p>${item.description ?? ""}</p>
        <span class="cart-price">$${item.price.toFixed(2)}</span>
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
  totalEl.textContent = `$${(subtotal + 0.3).toFixed(2)}`;
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

payNowBtn.addEventListener("click", () => {
  if (!selectedPaymentMethod) {
    alert("Please select a payment method");
    return;
  }

  // store for payment page
  sessionStorage.setItem("paymentMethod", selectedPaymentMethod);

  window.location.href = "payment.html";
});

