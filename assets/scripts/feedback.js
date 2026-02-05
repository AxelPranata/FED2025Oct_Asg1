import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  addDoc,
  doc,
  updateDoc,
  increment,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Get user id and name
let userId = "";
let userName = "";

onAuthStateChanged(auth, async (user) => {
  if (user) {
    userId = user.uid;

    const usersRef = doc(db, "users", user.uid);
    const usersSnap = await getDoc(usersRef);

    if (usersSnap.exists()) {
      const data = usersSnap.data();
      userName = data.username;
    }
  }
});

// Get hawker center and stall ID
const params = new URLSearchParams(window.location.search);
const hawkerCenterId = params.get("centerId");
const foodStallId = params.get("stallId");

async function getFoodStallName(hawkerCenterId, foodStallId) {
  const stallRef = doc(db, "hawker-centers", hawkerCenterId, "food-stalls", foodStallId);
  const stallSnap = await getDoc(stallRef);

  if (stallSnap.exists()) {
    return stallSnap.data().name;
  }
  return null;
}

let foodStallName = "";
async function loadFoodStall() {
  foodStallName = await getFoodStallName(hawkerCenterId, foodStallId);
}
loadFoodStall();

// Rating variables
let reviewCount = 0;
let totalRating = 0;

// Load reviews
async function loadReviews() {
  const q = query(
    collection(db, "reviews"),
    where("hawkercenterid", "==", hawkerCenterId),
    where("foodstallid", "==", foodStallId)
  );

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    snapshot.forEach((review) => {
      const data = review.data();

      if (data.description != "") {
        create_review("", data.username, data.date, data.rating, data.description);
      }

      reviewCount += 1;
      totalRating += data.rating;
    });

    updateRating();
  }
}

// Review Overlay
const reviewOverlay = document.getElementById("review-overlay");
const writeReview = document.getElementById("write-review");

writeReview.addEventListener("click", () => {
  reviewOverlay.style.display = "flex";
});

reviewOverlay.addEventListener("click", (e) => {
  if (e.target === reviewOverlay) {
    reviewOverlay.style.display = "none";
  }
});

// POST review
reviewOverlay.addEventListener("submit", async (e) => {
  e.preventDefault();

  const reviewRating = document.querySelector('#review-options input[name="rating"]:checked')?.value;
  const reviewDesc = document.querySelector('#review-description textarea[name="description"]')?.value?.trim();
  const reviewDate = new Date().toLocaleDateString();

  if (!reviewRating) {
    alert("❌ Rating is required.");
    return;
  }

  try {
    await addDoc(
      // collection(db, "stalls", foodStallId, "reviews"),
      collection(db, "reviews"),
      {
        userId: userId,
        username: userName ?? "Anonymous",
        hawkercenterid: hawkerCenterId,
        foodstallid: foodStallId,
        foodstallname: foodStallName,
        rating: parseInt(reviewRating),
        description: reviewDesc,
        date: new Date()
      }
    );

    reviewCount += 1;
    totalRating += parseInt(reviewRating);
    updateRating();

    if (reviewDesc) {
      create_review("", userName ?? "Anonymous", reviewDate.toLocaleDateString(), reviewRating, reviewDesc);
    }

    reviewOverlay.style.display = "none";
    alert("✅ Review submitted successfully!");
    reviewOverlay.reset();

  } catch (error) {
    console.error("Error adding review:", error);
    alert("⚠️ Could not save review.");
  }
});

// Create review card
function create_review(userProfile, userName, reviewDate, reviewRating, reviewDesc) {
  let reviewCarousel = document.getElementById("review-carousel");

  let review = document.createElement("div");
  review.className = "review";

  let img = document.createElement("img");
  img.className = "review-profile";
  img.src = userProfile || "assets/icons/feedback/blank-profile.svg";

  let name = document.createElement("p");
  name.className = "review-name";
  name.textContent = userName;

  let date = document.createElement("p");
  date.className = "review-date";
  date.textContent = reviewDate;

  let rating = document.createElement("img");
  rating.className = "review-rating";
  rating.src = `assets/icons/feedback/star-${reviewRating}.svg`;

  let desc = document.createElement("p");
  desc.className = "review-desc";
  desc.textContent = reviewDesc;

  review.append(img, name, date, rating, desc);
  reviewCarousel.appendChild(review);
}

// Update overall rating
function updateRating() {
  document.querySelector("#rating-count p").textContent = `${reviewCount} Reviews`;

  let ratingOverall = (totalRating / reviewCount).toFixed(1);
  const ratingOverall_img = document.querySelector("#rating-overall img")
  const ratingOverall_h3 = document.querySelector("#rating-overall h3")
  ratingOverall_h3.textContent = ratingOverall;

  if (ratingOverall <= 0) {
    ratingOverall_h3.style.color = "#474747"
    ratingOverall_img.src = "assets/icons/feedback/star-empty-5.svg"
  }
  else if (ratingOverall <= 1) {
    ratingOverall_h3.style.color = "#AD343E"
    ratingOverall_img.src = "assets/icons/feedback/star-1.svg"
  }
  else if (ratingOverall <= 2) {
    ratingOverall_h3.style.color = "#FF9247"
    ratingOverall_img.src = "assets/icons/feedback/star-2.svg"
  }
  else if (ratingOverall <= 3) {
    ratingOverall_h3.style.color = "#FFD447"
    ratingOverall_img.src = "assets/icons/feedback/star-3.svg"
  }
  else if (ratingOverall <= 4) {
    ratingOverall_h3.style.color = "#4CAF50"
    ratingOverall_img.src = "assets/icons/feedback/star-4.svg"
  }
  else if (ratingOverall >= 4.5) {
    ratingOverall_h3.style.color = "#2E7D32"
    ratingOverall_img.src = "assets/icons/feedback/star-5.svg"
  }
}



// Issue Overlay
const issueOverlay = document.getElementById("issue-overlay");
const writeIssue = document.getElementById("write-issue");

writeIssue.addEventListener("click", () => {
  // Opens overlay
  issueOverlay.style.display = "flex";
});

issueOverlay.addEventListener("click", (e) => {
  // Closes overlay when clicking out
  if (e.target === issueOverlay) {
    issueOverlay.style.display = "none";
  }
});

// POST issue to database
issueOverlay.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get data
  const issueSelected = document.querySelector('#issue-options input[name="choice"]:checked')?.value;
  const issueDesc = document.querySelector('#issue-description textarea[name="description"]')?.value;

  // Validation of data
  if (!issueSelected || !issueDesc) {
      alert("❌ Category and description are required.");
      return;
  }

  try {
    await addDoc(
      collection(db, "issues"),
      {
        userId: userId,
        username: userName ?? "Anonymous",
        hawkercenterid: hawkerCenterId,
        foodstallid: foodStallId,
        foodstallname: foodStallName,
        category: issueSelected,
        description: issueDesc,
        status: "pending",
        date: new Date()
      }
    );

    issueOverlay.style.display = "none";
    alert("✅ Issue submitted successfully!");
    issueOverlay.reset();

  } catch (error) {
    console.error("Error adding issue:", error);
    alert("⚠️ Could not save issue.");
  }
});



// Auto-resize text area
document.querySelector("#review-description textarea").addEventListener("input", (e) => {
  e.target.style.height = "auto";
  e.target.style.height = e.target.scrollHeight + "px";
});

document.querySelector("#issue-description textarea").addEventListener("input", (e) => {
  e.target.style.height = "auto";
  e.target.style.height = e.target.scrollHeight + "px";
});



// Load reviews from database
document.addEventListener("DOMContentLoaded", () => {
  loadReviews();
});