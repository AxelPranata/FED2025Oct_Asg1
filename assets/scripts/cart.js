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

/* TEMP USER (replace with Auth later) */
const userId = "guest";

const itemsRef = collection(db, "carts", userId, "items");

const container = document.getElementById("cart-items");
const subtotalEl = document.getElementById("subtotal");
const totalEl = document.getElementById("total");

let subtotal = 0;

const snap = await getDocs(itemsRef);

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