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

  // 🔹 Get applied promo from Firestore
  const promoRef = doc(db, "carts", userId, "meta", "appliedPromo");
  const promoSnap = await getDoc(promoRef);

  let appliedPromo = null;
  if (promoSnap.exists()) {
    appliedPromo = promoSnap.data();
  }

  // 🔹 Pricing
  const smallOrderFee = 0;
  const takeoutFee = 0.30;

  // ✅ declare fulfillmentType BEFORE using it
  const fulfillmentType = sessionStorage.getItem("fulfillmentType") ?? "takeout";

  // ✅ declare total FIRST (keeps your original logic intact)
  let total = parseFloat(sessionStorage.getItem("total")) || 0;

  // keep original promo math (not removed)
  const promo = total - (subtotal + takeoutFee);

  // ✅ delivery rules
  const deliveryFee = fulfillmentType === "delivery" ? 2.0 : 0;

  const minOrderFee =
    fulfillmentType === "delivery" && subtotal < 10
      ? 10 - subtotal
      : 0;

  const promoDiscount = appliedPromo?.discountAmount || 0;

  // ✅ final corrected total overwrite
  total = subtotal + deliveryFee + minOrderFee - promoDiscount;

  let deliveryAddress = null;

  if (fulfillmentType === "delivery") {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    deliveryAddress = userSnap.data()?.address ?? null;
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
      smallOrderFee,
      takeoutFee,
      promo,
      total,
      promoCode: appliedPromo?.code || null,
      promoDiscount,
      deliveryFee,
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
