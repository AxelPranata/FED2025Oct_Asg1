import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
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

// Get URL param
const params = new URLSearchParams(window.location.search);
const hawkerCenterId = params.get('hc');

function createItem(id, name, img) {
    // Create card div
    const item = document.createElement('div');
    item.classList.add('item');
    item.style.background = `
        linear-gradient(to top right, rgba(3, 8, 31, 1), rgba(3, 8, 31, 0.8), rgba(3, 8, 31, 0.0), rgba(3, 8, 31, 0), rgba(3, 8, 31, 0)),
        linear-gradient(to left, rgba(3, 8, 31, 1), rgba(3, 8, 31, 0.4), rgba(3, 8, 31, 0.2), rgba(3, 8, 31, 0), rgba(3, 8, 31, 0)),
        url('${img}') no-repeat center center / cover`;

    // Add content
    const foodStallId = document.createElement('p');
    foodStallId.classList.add('highlight');
    foodStallId.textContent = `#${id}`;

    const foodStallName = document.createElement('p');
    foodStallName.textContent = name;

    // Append content
    item.appendChild(foodStallId);
    item.appendChild(foodStallName);

    // Make card clickable (navigate with URL param)
    item.addEventListener('click', () => {
        window.location.href = `order.html?hc=${hawkerCenterId}&fs=${id}`;
    });

    console.log(`Created ${id} ${name} ${img}`)

    return item;
}

// Load cards from Firestore
async function loadCards() {
    const container = document.querySelector('.container');
    const snapshot = await getDocs(collection(db, `hawker-centers/${hawkerCenterId}/food-stalls`));

    snapshot.forEach(doc => {
        const data = doc.data();
        const item = createItem(doc.id, data.name, data.imagePath);
        container.appendChild(item);
    });
}

// Load hawker center info from Firestore
async function loadHawkerCenter() {
    const hawker_center_title = document.querySelector("#hawker-center-description h2");
    const hawker_center_desc = document.querySelector("#hawker-center-description p");
    const hawker_center_img = document.querySelector("#hawker-center-info img");
    const docRef = doc(db, "hawker-centers", hawkerCenterId);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
        const data = snapshot.data()
        hawker_center_title.textContent = data.name;
        hawker_center_desc.textContent = data.description;

        console.log(`Created ${data.name} ${data.description}`)
        hawker_center_img.src = data.imagePath;
    } else {
        console.log("Hawker center does not exist");
    }
}

document.addEventListener("DOMContentLoaded", (e) => {
    loadHawkerCenter();
    loadCards();
})
