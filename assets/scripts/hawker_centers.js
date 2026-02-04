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

function createItem(id, name, img) {
  // Create card div
  const item = document.createElement('div');
  item.classList.add('item');
  item.style.background = `
    linear-gradient(to top right, rgba(3, 8, 31, 1), rgba(3, 8, 31, 0.8), rgba(3, 8, 31, 0.0), rgba(3, 8, 31, 0), rgba(3, 8, 31, 0)),
    linear-gradient(to left, rgba(3, 8, 31, 1), rgba(3, 8, 31, 0.4), rgba(3, 8, 31, 0.2), rgba(3, 8, 31, 0), rgba(3, 8, 31, 0)),
    url('${img}') no-repeat center center / cover`;

  // Add content
  const hawkerCenterId = document.createElement('p');
  hawkerCenterId.classList.add('highlight');
  hawkerCenterId.textContent = `#${id}`;

  const hawkerCenterName = document.createElement('p');
  hawkerCenterName.textContent = name;

  // Append content
  item.appendChild(hawkerCenterId);
  item.appendChild(hawkerCenterName);

  // Make card clickable (navigate with URL param)
  item.addEventListener('click', () => {
    window.location.href = `food_stalls.html?centerId=${id}`;
  });

  console.log(`Created ${id} ${name} ${img}`)

  return item;
}

// Load cards from Firestore
async function loadCards() {
  const container = document.querySelector('.container');
  const snapshot = await getDocs(collection(db, "hawker-centers"));

  snapshot.forEach(doc => {
    const data = doc.data();
    const item = createItem(doc.id, data.name, data.imagePath);
    container.appendChild(item);
  });
}

document.addEventListener("DOMContentLoaded", (e) => {
    loadCards();
})

