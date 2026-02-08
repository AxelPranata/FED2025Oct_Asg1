// Import Firebase core
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";

// Import Firestore
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// Import Auth  
import { getAuth } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

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

// Initialize app
const app = initializeApp(firebaseConfig);

// Export Firestore
export const db = getFirestore(app);

// Export Auth  
export const auth = getAuth(app);