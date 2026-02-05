console.log("✅ analytics-dashboard.js loaded");

// ===== FIREBASE IMPORTS =====
import { db, auth } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

/* =========================
   NAV TOGGLE (KEEP)
========================= */
const hamburger = document.getElementById("hamburger");
const nav_links = document.getElementById("nav-links");

hamburger.addEventListener("click", () => {
  nav_links.classList.toggle("active");
});

/* =========================
   AUTH CHECK
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Not logged in");
    window.location.href = "login-admin.html";
    return;
  }

  console.log("Admin logged in:", user.uid);
  await loadAnalytics();
});

/* =========================
   DOM ELEMENTS (NON-CHART)
========================= */
const bestHawkerEl = document.getElementById("best-hawker");
const bestStallEl = document.getElementById("best-stall");
const bestStallCentreEl = document.getElementById("best-stall-centre");

const totalComplaintsEl = document.getElementById("total-complaints");
const avgRatingEl = document.getElementById("avg-rating");
const reviewCountEl = document.getElementById("review-count");

const tableBody = document.getElementById("top-stalls-body");

/* =========================
   MAIN LOADER
========================= */
async function loadAnalytics() {
  try {
    const [ordersSnap, issuesSnap, reviewsSnap] = await Promise.all([
      getDocs(collection(db, "orders")),
      getDocs(collection(db, "issues")),
      getDocs(collection(db, "reviews"))
    ]);

    const orders = [];
    ordersSnap.forEach(d => orders.push(d.data()));

    const issues = [];
    issuesSnap.forEach(d => issues.push(d.data()));

    const reviews = [];
    reviewsSnap.forEach(d => reviews.push(d.data()));

    // ----- TOP CARDS -----
    computeBestStall(orders);
    computeBestHawker(orders);
    computeTotalComplaints(issues);
    computeAverageRating(reviews);

    // ----- TABLE -----
    buildTopStallsTable(orders, reviews);

  } catch (err) {
    console.error("Analytics load error:", err);
  }
}

/* =========================
   BEST SELLING STALL
========================= */
function computeBestStall(orders) {
  const stallTotals = {};

  orders.forEach(order => {
    if (!order.items) return;

    order.items.forEach(item => {
      const stall = item.stallName;
      const centre = item.centreName;
      const qty = item.quantity || 0;

      if (!stallTotals[stall]) {
        stallTotals[stall] = { qty: 0, centre };
      }
      stallTotals[stall].qty += qty;
    });
  });

  let bestStall = "N/A";
  let bestCentre = "";
  let maxQty = 0;

  Object.entries(stallTotals).forEach(([stall, data]) => {
    if (data.qty > maxQty) {
      maxQty = data.qty;
      bestStall = stall;
      bestCentre = data.centre;
    }
  });

  bestStallEl.textContent = bestStall;
  bestStallCentreEl.textContent = bestCentre || " ";
}

/* =========================
   BEST HAWKER (BY REVENUE)
========================= */
function computeBestHawker(orders) {
  const hawkerRevenue = {};

  orders.forEach(order => {
    const centre = order.hawker?.centreName || "Unknown Hawker";
    const total = order.pricing?.total || 0;

    if (!hawkerRevenue[centre]) {
      hawkerRevenue[centre] = 0;
    }
    hawkerRevenue[centre] += total;
  });

  let bestHawker = "N/A";
  let maxRev = 0;

  Object.entries(hawkerRevenue).forEach(([centre, rev]) => {
    if (rev > maxRev) {
      maxRev = rev;
      bestHawker = centre;
    }
  });

  bestHawkerEl.textContent = bestHawker;
}

/* =========================
   TOTAL COMPLAINTS
========================= */
function computeTotalComplaints(issues) {
  totalComplaintsEl.textContent = issues.length;
}

/* =========================
   AVERAGE RATING
========================= */
function computeAverageRating(reviews) {
  if (reviews.length === 0) {
    avgRatingEl.textContent = "0.0/5";
    reviewCountEl.textContent = "0";
    return;
  }

  const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
  const avg = (sum / reviews.length).toFixed(1);

  avgRatingEl.textContent = `${avg}/5`;
  reviewCountEl.textContent = reviews.length;
}

/* =========================
   TOP PERFORMING STALLS TABLE
========================= */
function buildTopStallsTable(orders, reviews) {
  const stallData = {};

  // --- ORDERS + REVENUE (FIXED) ---
  orders.forEach(order => {                 
    if (!order.items) return;

    order.items.forEach(item => {
      const stall = item.stallName;
      const revenue = order.pricing?.total || 0; 

      if (!stallData[stall]) {
        stallData[stall] = {
          orders: 0,
          revenue: 0,
          ratings: []
        };
      }

      stallData[stall].orders += item.quantity || 0;
      stallData[stall].revenue += revenue;
    });
  });

  // --- RATINGS (UNCHANGED) ---
  reviews.forEach(r => {
    const stall = r.foodStallName;
    if (!stallData[stall]) {
      stallData[stall] = { orders: 0, revenue: 0, ratings: [] };
    }
    if (typeof r.rating === "number") {
      stallData[stall].ratings.push(r.rating);
    }
  });

  // Convert to array
  const rows = Object.entries(stallData).map(([stall, data]) => {
    const avgRating =
      data.ratings.length > 0
        ? (data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length).toFixed(1)
        : "0.0";

    return {
      stall,
      orders: data.orders,
      revenue: data.revenue,
      rating: avgRating
    };
  });

  // Sort by revenue DESC
  rows.sort((a, b) => b.revenue - a.revenue);

  // Render table
  tableBody.innerHTML = "";

  rows.slice(0, 5).forEach((row, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${row.stall}</td>
      <td><span>${row.rating}</span>/5</td>
      <td>${row.orders}</td>
      <td style="color: green">$${row.revenue.toFixed(2)}</td>
    `;

    tableBody.appendChild(tr);
  });
}