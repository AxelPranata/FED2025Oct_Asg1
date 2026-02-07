console.log("✅ analytics-dashboard.js loaded");

// ===== FIREBASE IMPORTS =====
import { db, auth } from "./firebase.js";
import {
  collection,
  getDocs,
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
const totalUsersEl = document.getElementById("total-users");

const totalComplaintsEl = document.getElementById("total-complaints");
const avgRatingEl = document.getElementById("avg-rating");
const reviewCountEl = document.getElementById("review-count");

const tableBody = document.getElementById("top-stalls-body");

const complaintPolarCtx = document
  .getElementById("complaintPolarChart")
  .getContext("2d");

const categoryAreaCtx = document
  .getElementById("categoryAreaChart")
  .getContext("2d");

const monthlyLineCtx = document
  .getElementById("monthlyLineChart")
  .getContext("2d");  

/* =========================
   MAIN LOADER
========================= */
async function loadAnalytics() {
  try {
    const [ordersSnap, issuesSnap, reviewsSnap] = await Promise.all([
      getDocs(collection(db, "orders")),
      getDocs(collection(db, "issues")),
      getDocs(collection(db, "reviews")),
      getDocs(collection(db, "users"))
    ]);

    const orders = [];
    ordersSnap.forEach(d => orders.push(d.data()));

    const issues = [];
    issuesSnap.forEach(d => issues.push(d.data()));

    const reviews = [];
    reviewsSnap.forEach(d => reviews.push(d.data()));

    // ----- TOP CARDS -----
    computeBestHawker(orders);
    computeTotalComplaints(issues);
    computeAverageRating(reviews);
    totalUsersEl.textContent = (await getDocs(collection(db, "users"))).size;

    // ----- TABLE -----
    buildTopStallsTable(orders, reviews);
    buildTopComplaintsPolarChart(issues);
    buildCategoryAreaChart(issues);
    buildMonthlyLineChart(issues);

  } catch (err) {
    console.error("Analytics load error:", err);
  }
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

/* ====== CHARTS ================ */

/* =========================
   CHART #1: TOP 5 MOST COMPLAINED HAWKER (POLAR AREA)
========================= */
function buildTopComplaintsPolarChart(issues) {
  // Count complaints per hawker centre
  const counts = {};

  issues.forEach(issue => {
    const centre = issue.hawkerCenterName || "Unknown";
    counts[centre] = (counts[centre] || 0) + 1;
  });

  // Convert to array and sort DESC
  const sorted = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // top 5 only

  const labels = sorted.map(i => i.name);
  const data = sorted.map(i => i.count);

  new Chart(complaintPolarCtx, {
    type: "polarArea",
    data: {
      labels: labels,
      datasets: [
      {
        data: data,
        backgroundColor: [
          "#22C55E", // green
          "#3B82F6", // blue
          "#FACC15", // yellow
          "#EA580C", // your orange
          "#EC4899"  // little pink for fun
        ],
        borderColor: "#ffffff",
        borderWidth: 1
      }
    ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right"
        }
      }
    }
  });
}

/* =========================
   CHART #2: COMPLAINTS BY CATEGORY (pie chart)
========================= */
function buildCategoryAreaChart(issues) {
  const categoryCounts = {};

  issues.forEach(issue => {
    const category = issue.category || "Others";
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  const labels = Object.keys(categoryCounts);
  const data = Object.values(categoryCounts);

  new Chart(categoryAreaCtx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Complaints by Category",
          data: data,
          backgroundColor: [
            "#3B82F6", // blue
            "#22C55E", // green
            "#FACC15", // yellow
            "#EA580C", // orange
            "#A855F7"  // purple
          ],
          borderColor: "#ffffff",
          borderWidth: 1
          }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

/* =========================
   CHART #3: MONTHLY COMPLAINT TREND (LINE)
========================= */
function buildMonthlyLineChart(issues) {
  const monthCounts = {};

  issues.forEach(issue => {
    if (!issue.date) return;

    const d = issue.date.toDate(); // Firestore timestamp → JS Date
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`; // e.g. "2026-2"

    monthCounts[key] = (monthCounts[key] || 0) + 1;
  });

  // Sort months chronologically
  const sortedMonths = Object.keys(monthCounts).sort((a, b) => new Date(a) - new Date(b));

  const labels = sortedMonths;
  const data = sortedMonths.map(m => monthCounts[m]);

  new Chart(monthlyLineCtx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
      {
        label: "Complaints per Month",
        data: data,
        tension: 0.3,
        borderColor: "#3B82F6", // blue line
        backgroundColor: "rgba(59, 130, 246, 0.2)", // light blue fill
        fill: true
      }
    ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}