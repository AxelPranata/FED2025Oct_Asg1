import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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

function closeAllEditors() {
  if (els.editor) els.editor.style.display = "none";
  if (els.paymentEdit) els.paymentEdit.style.display = "none";
  if (els.addrFields) els.addrFields.style.display = "none";
}

/* =========================
   AUTH STATE
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  userRef = doc(db, "users", user.uid)

  const snap = await getDoc(userRef);

if (!snap.exists()) {
  console.error("Profile not found for user:", user.uid);
  alert("Profile not found. Please complete signup.");
  return;
}

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
  
  els.saveBtn.onclick = () => saveEdit(user);

  const paymentBtn = document.getElementById("editPaymentBtn");
  if (paymentBtn) {
    paymentBtn.onclick = () => {
      if (els.paymentEdit.style.display === "block") {
        closeAllEditors();
        return;
      }

      closeAllEditors();
      currentEdit = "payment";
      els.paymentEdit.style.display = "block";
    };
  }
  });

/* =========================
   OPEN EDITOR
========================= */
function openEditor(type, user) {
  // 🔁 If clicking the SAME edit again → close it
  if (currentEdit === type && els.editor.style.display === "block") {
    closeAllEditors();
    return;
  }

  // Otherwise, switch editor
  closeAllEditors();
  currentEdit = type;

  els.editor.style.display = "block";
  els.editInput.style.display = "block";
  els.addrFields.style.display = "none";

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

    closeAllEditors();

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
  window.location.href = "index.html";
};


/* =========================
   VENDOR RECEIVE METHOD (NEW ADDITION)
========================= */

// Add new DOM elements (won't break existing code)
const vendorEls = {
  receiveMethod: document.getElementById("profileReceiveMethod"),
  receiveMethodEdit: document.getElementById("receiveMethodEdit"),
  receiveMethodType: document.getElementById("receiveMethodType"),
  bankAccountNumber: document.getElementById("bankAccountNumber")
};

// Check if we're on vendor user page
if (vendorEls.receiveMethod) {
  
  // Display receive method when page loads
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    const data = snap.data();
    
    if (data.receiveMethod) {
      vendorEls.receiveMethod.textContent =
        data.receiveMethod.type === "Bank Transfer"
          ? `Bank Transfer •••• ${data.receiveMethod.accountLast4}`
          : data.receiveMethod.type;
    } else {
      vendorEls.receiveMethod.textContent = "Not set";
    }
  });

  // Edit button click
  document.getElementById("editReceiveMethodBtn")?.addEventListener("click", () => {
    if (vendorEls.receiveMethodEdit.style.display === "block") {
      vendorEls.receiveMethodEdit.style.display = "none";
      return;
    }
    
    // Close other editors
    if (els.editor) els.editor.style.display = "none";
    if (els.paymentEdit) els.paymentEdit.style.display = "none";
    if (els.addrFields) els.addrFields.style.display = "none";
    
    vendorEls.receiveMethodEdit.style.display = "block";
  });

  // Save button click
  document.getElementById("saveReceiveMethodBtn")?.addEventListener("click", async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const type = vendorEls.receiveMethodType.value;
      const accountLast4 = vendorEls.bankAccountNumber.value.trim();

      if (!type) {
        alert("Select a receive method");
        return;
      }

      if (type === "Bank Transfer" && accountLast4.length !== 4) {
        alert("Enter last 4 digits of bank account");
        return;
      }

      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        receiveMethod: {
          type,
          accountLast4: type === "Bank Transfer" ? accountLast4 : ""
        }
      });

      vendorEls.receiveMethod.textContent =
        type === "Bank Transfer" ? `Bank Transfer •••• ${accountLast4}` : type;

      vendorEls.receiveMethodEdit.style.display = "none";
      alert("Receive method updated");

    } catch (err) {
      console.error(err);
      alert("Receive method update failed");
    }
});
}
