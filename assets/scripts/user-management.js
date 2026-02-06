console.log("✅ user-management.js loaded");

import { db, auth } from "./firebase.js";
import {
  collection,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

/* =========================
   NAV
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
  await loadAllUsers();
});

/* =========================
   DOM ELEMENTS
========================= */
const usersBody = document.getElementById("users-body");

const searchInput = document.querySelector(".search-bar");
const roleDropdown = document.querySelector(".dropdown");

const statVendors = document.getElementById("stat-vendors");
const statCustomers = document.getElementById("stat-customers");
const statAdmins = document.getElementById("stat-admins");
const statTotal = document.getElementById("stat-total");

/* =========================
   GLOBAL STORE
========================= */
let ALL_USERS = [];
const MAX_ROWS = 20; // 👈 limit table length

/* =========================
   LOAD USERS
========================= */
async function loadAllUsers() {
  try {
    const snap = await getDocs(collection(db, "users"));

    ALL_USERS = [];

    snap.forEach(d => {
      ALL_USERS.push({
        id: d.id,
        ...d.data()
      });
    });

    updateStats(ALL_USERS);
    renderTable(ALL_USERS);

  } catch (err) {
    console.error("Load users error:", err);
  }
}

/* =========================
   UPDATE STATS
========================= */
function updateStats(users) {
  let vendors = 0;
  let customers = 0;
  let admins = 0;

  users.forEach(u => {
    const role = (u.role || "user").toLowerCase();

    if (role === "vendor") vendors++;
    else if (role === "admin") admins++;
    else customers++;
  });

  statVendors.textContent = vendors;
  statCustomers.textContent = customers;
  statAdmins.textContent = admins;
  statTotal.textContent = users.length;
}

/* =========================
   RENDER TABLE
========================= */
function renderTable(users) {
  usersBody.innerHTML = "";

  // 👇 limit to 20 rows
  users.slice(0, MAX_ROWS).forEach(user => {
    const role = (user.role || "user").toLowerCase();
    const roleLabel = capitalize(role);

    const stall = role === "vendor" ? (user.stallName || "-") : "-";

    const badgeClass =
      role === "vendor" ? "vendor" :
      role === "admin" ? "admin" :
      "customer";

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${user.displayName || "No Name"}</td>
      <td>${user.email || "-"}</td>
      <td><span class="badge ${badgeClass}">${roleLabel}</span></td>
      <td>${stall}</td>
      <td>
        <img src="assets/icons/Dashboard/delete.png"
             alt="Delete"
             class="delete-btn"
             data-id="${user.id}">
      </td>
    `;

    usersBody.appendChild(tr);
  });

  attachDeleteEvents();
}

/* =========================
   DELETE USER
========================= */
function attachDeleteEvents() {
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {

      const confirmDelete = confirm("Delete this user?");
      if (!confirmDelete) return;

      try {
        await deleteDoc(doc(db, "users", btn.dataset.id));
        await loadAllUsers();
      } catch (err) {
        console.error("Delete error:", err);
        alert("Failed to delete user");
      }
    });
  });
}

/* =========================
   SEARCH + FILTER (FIXED)
========================= */
searchInput.addEventListener("input", applyFilters);
roleDropdown.addEventListener("change", applyFilters);

function applyFilters() {
  const search = searchInput.value.toLowerCase();
  const roleFilter = roleDropdown.value.toLowerCase();

  const filtered = ALL_USERS.filter(user => {
    const name = (user.displayName || "").toLowerCase();
    const role = (user.role || "user").toLowerCase();

    const matchSearch = name.includes(search);

    // 👇 FIXED ROLE MATCHING
    const matchRole =
      roleFilter === "all roles" ||
      role === roleFilter.replace(/s$/, ""); // vendors→vendor, admins→admin, user→user

    return matchSearch && matchRole;
  });

  renderTable(filtered);
}

/* =========================
   HELPERS
========================= */
function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}