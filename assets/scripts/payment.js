import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
  
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  deleteDoc,
  serverTimestamp
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

// 🔹 Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 🔹 Run once user is confirmed
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    console.warn("User not logged in");
    return;
  }

  const userId = user.uid;

  // 🔹 Read cart
  const cartRef = collection(db, "carts", userId, "items");
  const snap = await getDocs(cartRef);

  if (snap.empty) {
    console.log("Cart already processed");
    return;
  }

  let items = [];
  let subtotal = 0;

  snap.forEach(docSnap => {
    const item = docSnap.data();
    const itemTotal = (item.unitPrice ?? item.price ?? 0) * item.quantity;
    subtotal += itemTotal;

    items.push({
      name: item.name,
      quantity: item.quantity,
      price: item.unitPrice ?? item.price ?? 0,
      itemTotal,

      // 🔥 pass hawker info forward
      centerName: item.centerName,
      centreLocation: item.centreLocation,
      stallName: item.stallName
    });
  });

// 🔹 Get final total from cart page (source of truth)
const fulfillmentType = sessionStorage.getItem("fulfillmentType") ?? "takeout";
const total = Number(sessionStorage.getItem("total")) || 0;

// Promo info (read from appliedCodes instead of meta/appliedPromo)
let promoCode = null;
let promoDiscount = 0;
let promoType = null;

// 🔹 Read applied promo codes from cart
const appliedCodesRef = collection(db, "carts", userId, "appliedCodes");
const appliedSnap = await getDocs(appliedCodesRef);

appliedSnap.forEach(d => {
  const data = d.data();
  promoCode = data.code;
  promoDiscount = data.discount;
  promoType = data.type;   // ⭐ THIS LINE IS REQUIRED
});

  let deliveryAddress = null;

  if (fulfillmentType === "delivery") {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    deliveryAddress = userSnap.data()?.address ?? null;
  }

  let deliveryFee = 0;
let takeoutFee = 0;
let minOrderFee = 0;

if (fulfillmentType === "delivery") {
  deliveryFee = 2.00;

  if (subtotal < 10) {
    minOrderFee = 10 - subtotal;
  }
}

if (fulfillmentType === "takeout") {
  takeoutFee = 0.30;
}


  // 🔹 Create order
  await addDoc(collection(db, "orders"), {
    user: {
      userId: user.uid,
      name: user.displayName ?? "Unknown User",
      email: user.email ?? "No email"
    },

    status: "paid",

    fulfillment: {
      type: fulfillmentType,
      address: deliveryAddress
    },

    payment: {
      method: sessionStorage.getItem("paymentMethod") ?? "unknown",
      paidAt: serverTimestamp()
    },

    items,

    

  pricing: {
  subtotal,
  total,
  promoType,
  promoCode,
  promoDiscount,
  deliveryFee,
  takeoutFee,
  minOrderFee,
},


    createdAt: serverTimestamp(),

    hawker: {
      centreName: items[0]?.centerName ?? "Unknown Centre",
      location: items[0]?.centreLocation ?? "Unknown Location",
      stallName: items[0]?.stallName ?? "Unknown Stall"
    },
  });

  // 🔹 Clear cart
  for (const d of snap.docs) {
    await deleteDoc(d.ref);
  }

  // 🔹 Clear appliedCodes
  const appliedCodeRef = collection(db, "carts", userId, "appliedCodes");
  const appliedCodeSnap = await getDocs(appliedCodeRef);

  for (const d of appliedCodeSnap.docs) {
    await deleteDoc(d.ref);
  }

  console.log("Order placed successfully");
});
