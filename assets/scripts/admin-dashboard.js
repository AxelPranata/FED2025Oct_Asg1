console.log("✅ admin-dashboard.js loaded");

import { db, auth } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

/* =========================
   ADMIN AUTH CHECK
========================= */

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Not logged in");
    window.location.href = "login-admin.html";
    return;
  }

  console.log("Admin logged in:", user.uid);

  loadDashboardStats();
  loadRecentComplaints();
});


/* =========================
   NAV
========================= */

const hamburger = document.getElementById("hamburger");
const nav_links = document.getElementById("nav-links");

hamburger.addEventListener("click", () => {
  nav_links.classList.toggle("active");
});


/* =========================
   DATE
========================= */

const dateElement = document.querySelector(".date");
const today = new Date();

const options = {
  weekday: "long",
  day: "2-digit",
  month: "short",
  year: "numeric"
};

dateElement.textContent = today.toLocaleDateString("en-GB", options);


/* =========================
   DOM IDs
========================= */

const totalStallsEl = document.getElementById("total-stalls");
const totalUsersEl = document.getElementById("total-users");
const pendingComplaintsEl = document.getElementById("pending-complaints");
const avgRatingEl = document.getElementById("avg-rating");
const reviewCountTextEl = document.getElementById("review-count-text");
const recentComplaintsContainer = document.getElementById("recent-complaints");


/* =========================
   LOAD DASHBOARD STATS
========================= */

async function loadDashboardStats() {
  try {
    console.log("Loading dashboard stats...");

    /* ---------- TOTAL STALLS (REAL STRUCTURE) ---------- */
    const centersSnap = await getDocs(collection(db, "hawker-centers"));

    let stallCount = 0;

    for (const centerDoc of centersSnap.docs) {
      const stallsSnap = await getDocs(
        collection(db, "hawker-centers", centerDoc.id, "food-stalls")
      );
      stallCount += stallsSnap.size;
    }

    totalStallsEl.textContent = stallCount.toLocaleString();


    /* ---------- TOTAL USERS ---------- */
    const usersSnap = await getDocs(collection(db, "users"));
    totalUsersEl.textContent = usersSnap.size.toLocaleString();


    /* ---------- PENDING COMPLAINTS ---------- */
    const pendingQ = query(
      collection(db, "issues"),
      where("status", "==", "pending")
    );
    const pendingSnap = await getDocs(pendingQ);
    pendingComplaintsEl.textContent = pendingSnap.size.toLocaleString();


    /* ---------- AVERAGE RATING ---------- */
    const reviewsSnap = await getDocs(collection(db, "reviews"));

    let total = 0;
    let count = 0;

    reviewsSnap.forEach(docu => {
      const r = Number(docu.data().rating);
      if (!Number.isNaN(r)) {
        total += r;
        count++;
      }
    });

    const avg = count ? (total / count).toFixed(1) : "0.0";
    avgRatingEl.textContent = avg;

    if (reviewCountTextEl) {
      reviewCountTextEl.textContent =
        `Based on ${count.toLocaleString()} reviews`;
    }

    console.log("Dashboard stats loaded successfully");

  } catch (err) {
    console.error("Dashboard stats error:", err);
  }
}


/* =========================
   RECENT COMPLAINTS
========================= */

async function loadRecentComplaints() {
  try {
    const issuesSnap = await getDocs(collection(db, "issues"));

    let issues = [];
    issuesSnap.forEach(docu => issues.push(docu.data()));

    /* ---------- SORT NEWEST FIRST ---------- */
    issues.sort((a, b) => b.date.toDate() - a.date.toDate());

    /* ---------- TAKE LATEST 3 ---------- */
    const latestIssues = issues.slice(0, 3);

    recentComplaintsContainer.innerHTML = "";

    /* ---------- NUMBERING FIX ---------- */
    let number = latestIssues.length;

    latestIssues.forEach((data) => {
      const dateStr = data.date?.toDate().toLocaleDateString("en-GB") ?? "";

      const complaint = document.createElement("div");
      complaint.className = "complaint";

      complaint.innerHTML = `
        <div class="complaint-header">
          <h4>Complaint #${number--}</h4>
          <span class="progress">${formatStatus(data.status)}</span>
        </div>
        <p>
          ${data.category ?? "Unknown"} |
          ${data.foodStallName ?? "Unknown Stall"}
        </p>
        <small>${dateStr}</small>
      `;

      recentComplaintsContainer.appendChild(complaint);
    });

    console.log("Recent complaints loaded");

  } catch (err) {
    console.error("Recent complaints error:", err);
  }
}


/* =========================
   STATUS FORMATTER
========================= */

function formatStatus(status) {
  if (!status) return "Pending";

  const s = status.toLowerCase();

  if (s === "pending") return "Pending";
  if (s === "resolved") return "Resolved";
  if (s === "in progress") return "In Progress";

  return status;
}