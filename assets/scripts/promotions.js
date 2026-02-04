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

// Create promocode card
function createCodeCard(promoCode, promoText, discount, daysRemaining, img) {
  // Create card div
  const card = document.createElement("div");
  card.classList.add("card");
  card.style.background = `
    linear-gradient(to top right, rgba(3, 8, 31, 1), rgba(3, 8, 31, 0.8), rgba(3, 8, 31, 0.0), rgba(3, 8, 31, 0), rgba(3, 8, 31, 0)),
    linear-gradient(to left, rgba(3, 8, 31, 1), rgba(3, 8, 31, 0.4), rgba(3, 8, 31, 0.2), rgba(3, 8, 31, 0), rgba(3, 8, 31, 0)),
    url('${img}') no-repeat center center / cover`;

  // Add content
  // Left details section
  const detailsLeft = document.createElement("div");
  detailsLeft.className = "details-left";

  const days = document.createElement("p");
  days.className = "days-remaining";
  days.textContent = `${daysRemaining} Days Remaining`;

  const subText = document.createElement("p");
  subText.className = "sub-text";
  subText.textContent = promoText;

  const mainText = document.createElement("p");
  mainText.className = "main-text";
  mainText.textContent = promoCode;

  detailsLeft.appendChild(days);
  detailsLeft.appendChild(subText);
  detailsLeft.appendChild(mainText);

  // Right details section
  const detailsRight = document.createElement("div");
  detailsRight.className = "details-right";

  const percentage = document.createElement("p");
  percentage.className = "percentage";
  percentage.textContent = `-${discount}%`;

  detailsRight.appendChild(percentage);

  // Append content
  card.appendChild(detailsLeft);
  card.appendChild(detailsRight);

  return card;
}

// Load promotions from Firestore
async function loadPromotions() {
  const promotions_list = document.querySelector("#promotions-list .group");
  const promotionsh3 = document.querySelector("#promotions-list .group h3");
  const snapshot = await getDocs(collection(db, "promotions"));

  // In case there is promotions but not happening today
  let hasValidPromotions = false;

  if (!snapshot.empty) {
    snapshot.forEach(promo => {
      const data = promo.data();

      const currentDate = new Date();
      const startDate = data.start.toDate();
      const endDate = data.end.toDate();

      if (currentDate > startDate && currentDate < endDate) {
        hasValidPromotions = true;
        let daysRemaining = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24)); // Gives date
        let card = createCodeCard(data.code, data.description, data.discount, daysRemaining, data.imagePath);
        promotions_list.appendChild(card);
      }
    });
  }

  if (!hasValidPromotions) {
    promotionsh3.textContent = "No promotions currently";
  }
}

document.addEventListener("DOMContentLoaded", (e) => {
  loadPromotions();
})