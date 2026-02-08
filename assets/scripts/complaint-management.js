console.log("✅ complaint-management.js loaded");

import { db, auth } from "./firebase.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
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
  await loadAllComplaints();
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
   DOM ELEMENTS
========================= */

const complaintsContainer = document.getElementById("complaints-container");

const pendingCountEl = document.getElementById("pending-count");
const progressCountEl = document.getElementById("progress-count");
const resolvedCountEl = document.getElementById("resolved-count");

const filterButtons = document.querySelectorAll(".filter .button");

/* =========================
   GLOBAL DATA STORE
========================= */

let ALL_ISSUES = [];

/* =========================
   LOAD ALL COMPLAINTS
========================= */

async function loadAllComplaints() {
  try {
    const snap = await getDocs(collection(db, "issues"));

    ALL_ISSUES = [];
    snap.forEach(d => {
      ALL_ISSUES.push({
        id: d.id,
        ...d.data()
      });
    });

    // newest first
    ALL_ISSUES.sort((a, b) => b.date.toDate() - a.date.toDate());

    updateStats(ALL_ISSUES);
    renderComplaints(ALL_ISSUES);

  } catch (err) {
    console.error("Load complaints error:", err);
  }
}

/* =========================
   UPDATE TOP STATS CARDS
========================= */

function updateStats(issues) {
  let pending = 0;
  let inProgress = 0;
  let resolved = 0;

  issues.forEach(i => {
    const s = (i.status || "pending").toLowerCase();

    if (s === "pending") pending++;
    else if (s === "in progress") inProgress++;
    else if (s === "resolved") resolved++;
  });

  pendingCountEl.textContent = pending;
  progressCountEl.textContent = inProgress;
  resolvedCountEl.textContent = resolved;
}

/* =========================
   RENDER COMPLAINTS
========================= */

function renderComplaints(issues) {
  complaintsContainer.innerHTML = "";

  issues.forEach((data, index) => {

    const dateStr = data.date?.toDate().toLocaleDateString("en-GB") ?? "";

    const status = (data.status || "pending").toLowerCase();
    const statusLabel = formatStatus(status);
    const statusClass = getStatusClass(status);

    const section = document.createElement("section");
    section.className = "complaints";

    section.innerHTML = `
      <div class="complaint-top">

        <div class="complaint-info">
          <h3>
            Complaint #${issues.length - index}
            <span class="progress ${statusClass}">${statusLabel}</span>
          </h3>

          <p>
            ${data.category} | 
            ${data.foodStallName ?? "Unknown Stall"} | 
            submitted by ${data.displayName ?? "Anonymous"}
          </p>
        </div>

        <div class="complaint-action">
          <label>Update Status</label>
          <select data-id="${data.id}">
            <option value="">Select option</option>
            <option value="pending" ${status === "pending" ? "selected" : ""}>Pending</option>
            <option value="in progress" ${status === "in progress" ? "selected" : ""}>In Progress</option>
            <option value="resolved" ${status === "resolved" ? "selected" : ""}>Resolved</option>
          </select>

          <button class="delete-btn" data-delete-id="${data.id}">
            Delete
          </button>
        </div>

      </div>

      <div class="comment">
        <h4>Complaint Details</h4>
        <p>${data.description}</p>
        <small>${dateStr}</small>
      </div>
    `;

    complaintsContainer.appendChild(section);
  });

  attachActionEvents();
}

/* =========================
   STATUS COLORS
========================= */

function getStatusClass(status) {
  if (status === "pending") return "tag-pending";
  if (status === "in progress") return "tag-progress";
  if (status === "resolved") return "tag-resolved";
  return "tag-pending";
}

/* =========================
   BUTTON EVENTS
========================= */

function attachActionEvents() {
  // status update
  document.querySelectorAll(".complaint-action select").forEach(select => {
    select.addEventListener("change", async () => {
      if (!select.value) return;
      await updateStatus(select.dataset.id, select.value);
    });
  });

  // delete complaint
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      await deleteComplaint(btn.dataset.deleteId);
    });
  });
}
/* =========================
   UPDATE STATUS IN FIRESTORE
========================= */

async function updateStatus(issueId, newStatus) {
  try {
    const ref = doc(db, "issues", issueId);

    await updateDoc(ref, {
      status: newStatus
    });

    console.log("Status updated:", newStatus);

    // reload everything
    await loadAllComplaints();

  } catch (err) {
    console.error("Update status error:", err);
  }
}

/* =========================
   DELETE COMPLAINT 
========================= */

async function deleteComplaint(issueId) {
  const confirmDelete = confirm("Are you sure you want to delete this complaint?");

  if (!confirmDelete) return;

  try {
    await deleteDoc(doc(db, "issues", issueId));
    console.log("Complaint deleted:", issueId);

    // reload list after delete
    await loadAllComplaints();

  } catch (err) {
    console.error("Delete error:", err);
    alert("Failed to delete complaint");
  }
}



/* =========================
   FORMAT STATUS TEXT
========================= */

function formatStatus(status) {
  if (status === "pending") return "Pending";
  if (status === "in progress") return "In Progress";
  if (status === "resolved") return "Resolved";
  return status;
}

/* =========================
   FILTERS (STATUS + CATEGORY)
========================= */

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {

    // remove active highlight from all
    filterButtons.forEach(b => b.classList.remove("active-filter"));
    btn.classList.add("active-filter");

    const filter = btn.textContent.trim().toLowerCase();

    if (filter === "all") {
      renderComplaints(ALL_ISSUES);
      return;
    }

    const filtered = ALL_ISSUES.filter(issue => {
      const status = (issue.status || "pending").toLowerCase();
      const category = (issue.category || "").toLowerCase();

      return status === filter || category === filter;
    });

    renderComplaints(filtered);
  });

});