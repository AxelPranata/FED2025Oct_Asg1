import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth, db } from "./kiki_firebase.js";  // ✅ Import both from same file
import {
  collection,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const VENDOR_ID = "4I9X843cHGcdTZINaPiAY0DRwFx2";

let menuItems = [];
let categories = [];

/* =========================
   LOAD MENU FROM FIRESTORE
========================= */
async function loadMenu() {
  try {
    const menuRef = collection(db, "vendors", VENDOR_ID, "menu");
    const snapshot = await getDocs(menuRef);

    menuItems = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    categories = [...new Set(menuItems.map(i => i.category))];

    renderMenuCategories();
    renderStats();
  } catch (err) {
    console.error("Failed to load menu:", err);
    // Show user-friendly error
    document.getElementById("menu-categories").innerHTML = 
      '<p style="color: red; padding: 20px;">Please log in to view the menu.</p>';
  }
}

// ... rest of your functions stay the same ...

/* =========================
   INIT - WAIT FOR AUTH
========================= */
onAuthStateChanged(auth, user => {
  console.log("AUTH USER:", user);
  
  if (user) {
    // User is logged in, load the menu
    loadMenu();
  } else {
    // Not logged in, redirect to login or show message
    console.log("No user logged in");
    document.getElementById("menu-categories").innerHTML = 
      '<p style="padding: 20px;">Please log in to continue.</p>';
  }
});

// Remove the old loadMenu() call at the bottom