import { auth, db } from "./firebase.js";
import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* =========================
   DOM ELEMENTS
========================= */
const els = {
  username: document.getElementById("profileUsername"),
  description: document.getElementById("profileDescription"),
  email: document.getElementById("profileEmail"),
  address: document.getElementById("profileAddress"),
  payment: document.getElementById("profilePayment"),

  editor: document.getElementById("editor"),
  editInput: document.getElementById("editInput"),
  saveBtn: document.getElementById("saveEditBtn"),

  addrFields: document.getElementById("addressFields"),
  addrLine: document.getElementById("addrLine"),
  addrCity: document.getElementById("addrCity"),
  addrPostal: document.getElementById("addrPostal"),

  paymentEdit: document.getElementById("paymentEdit"),
  paymentMethod: document.getElementById("paymentMethod"),
  cardLast4: document.getElementById("cardLast4"),

  logoutBtn: document.getElementById("logoutBtn")
};

let currentEdit = null;
let userRef = null;
let cachedData = null;

/* =========================
   AUTH STATE
========================= */
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "/hawkers-app-ignatius/index.html";
    return;
  }

  userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  cachedData = snap.data();

  // Populate UI
  els.username.textContent = cachedData.displayName || "Not set";
  els.description.textContent = cachedData.description || "Not set";
  els.email.textContent = user.email;

  if (cachedData.address) {
    els.address.textContent =
      `${cachedData.address.line1}, ${cachedData.address.city}, ${cachedData.address.postalCode}`;
  } else {
    els.address.textContent = "Not set";
  }

  if (cachedData.payment) {
    els.payment.textContent =
      cachedData.payment.method === "Card"
        ? `Card •••• ${cachedData.payment.last4}`
        : cachedData.payment.method;
  } else {
    els.payment.textContent = "Not set";
  }

  // Attach edit buttons
  document.querySelectorAll("[data-edit]").forEach(btn => {
    btn.onclick = () => openEditor(btn.dataset.edit, user);
  });

  document.getElementById("editPaymentBtn").onclick = () => {
    els.paymentEdit.style.display = "block";
  };

  els.saveBtn.onclick = () => saveEdit(user);
});

/* =========================
   OPEN EDITOR
========================= */
function openEditor(type, user) {
  currentEdit = type;

  els.editor.style.display = "block";
  els.paymentEdit.style.display = "none";
  els.addrFields.style.display = "none";
  els.editInput.style.display = "block";

  if (type === "address") {
    els.editInput.style.display = "none";
    els.addrFields.style.display = "block";
    els.addrLine.value = cachedData.address?.line1 || "";
    els.addrCity.value = cachedData.address?.city || "";
    els.addrPostal.value = cachedData.address?.postalCode || "";
    return;
  }

  if (type === "email") {
    els.editInput.value = user.email;
    return;
  }

  els.editInput.value = cachedData[type] || "";
}

/* =========================
   SAVE EDIT
========================= */
async function saveEdit(user) {
  try {
    /* EMAIL (AUTH LEVEL) */
    if (currentEdit === "email") {
      const newEmail = els.editInput.value.trim();
      const password = prompt("Enter your password to change email:");

      if (!password) {
        alert("Password required");
        return;
      }

      const credential = EmailAuthProvider.credential(
        user.email,
        password
      );

      await reauthenticateWithCredential(user, credential);
      await updateEmail(user, newEmail);
      await sendEmailVerification(user);

      els.email.textContent = newEmail;
      alert("Email updated. Please verify your new email.");
    }

    /* USERNAME */
    if (currentEdit === "username") {
      await updateDoc(userRef, { displayName: els.editInput.value });
      els.username.textContent = els.editInput.value;
    }

    /* DESCRIPTION */
    if (currentEdit === "description") {
      await updateDoc(userRef, { description: els.editInput.value });
      els.description.textContent = els.editInput.value;
    }

    /* ADDRESS */
    if (currentEdit === "address") {
      const addr = {
        line1: els.addrLine.value,
        city: els.addrCity.value,
        postalCode: els.addrPostal.value
      };

      await updateDoc(userRef, { address: addr });
      els.address.textContent =
        `${addr.line1}, ${addr.city}, ${addr.postalCode}`;
    }

    els.editor.style.display = "none";

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

/* =========================
   PAYMENT SAVE
========================= */
document.getElementById("savePaymentBtn").onclick = async () => {
  try {
    const method = els.paymentMethod.value;
    const last4 = els.cardLast4.value.trim();

    if (!method) {
      alert("Select a payment method");
      return;
    }

    if (method === "Card" && last4.length !== 4) {
      alert("Enter last 4 digits");
      return;
    }

    await updateDoc(userRef, {
      payment: {
        method,
        last4: method === "Card" ? last4 : ""
      }
    });

    els.payment.textContent =
      method === "Card" ? `Card •••• ${last4}` : method;

    els.paymentEdit.style.display = "none";
    alert("Payment updated");

  } catch (err) {
    console.error(err);
    alert("Payment update failed");
  }
};

/* =========================
   LOGOUT
========================= */
els.logoutBtn.onclick = async () => {
  await signOut(auth);
  window.location.href = "/hawkers-app-ignatius/index.html";
};
