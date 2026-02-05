import { auth, db } from "./firebase.js";
import { doc, getDoc, updateDoc } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { signOut, updateEmail } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const els = {
  username: document.getElementById("profileUsername"),
  description: document.getElementById("profileDescription"),
  email: document.getElementById("profileEmail"),
  address: document.getElementById("profileAddress"),
  payment: document.getElementById("profilePayment"),

  editor: document.getElementById("editor"),
  editInput: document.getElementById("editInput"),
  saveEditBtn: document.getElementById("saveEditBtn"),

  addrFields: document.getElementById("addressFields"),
  addrLine: document.getElementById("addrLine"),
  addrCity: document.getElementById("addrCity"),
  addrPostal: document.getElementById("addrPostal"),

  editPaymentBtn: document.getElementById("editPaymentBtn"),
  paymentEdit: document.getElementById("paymentEdit"),
  paymentMethod: document.getElementById("paymentMethod"),
  cardLast4: document.getElementById("cardLast4"),
  savePaymentBtn: document.getElementById("savePaymentBtn"),

  logoutBtn: document.getElementById("logoutBtn")
};

let currentEdit = null;
let userRef = null;

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "/hawkers-app-ignatius/index.html";
    return;
  }

  userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  const data = snap.data();

  els.username.textContent = data.displayName || "Not set";
  els.description.textContent = data.description || "Not set";
  els.email.textContent = user.email;

  if (data.address) {
    els.address.textContent =
      `${data.address.line1}, ${data.address.city}, ${data.address.postalCode}`;
  }

  if (data.payment) {
    els.payment.textContent =
      data.payment.method === "Card"
        ? `Card •••• ${data.payment.last4}`
        : data.payment.method;
  }

  document.querySelectorAll("[data-edit]").forEach(btn => {
    btn.onclick = () => openEditor(btn.dataset.edit, data);
  });
});

// ================= EDITOR =================
function openEditor(type, data) {
  currentEdit = type;
  els.editor.style.display = "block";
  els.paymentEdit.style.display = "none";
  els.addrFields.style.display = "none";
  els.editInput.style.display = "block";

  if (type === "address") {
    els.editInput.style.display = "none";
    els.addrFields.style.display = "block";
    els.addrLine.value = data.address?.line1 || "";
    els.addrCity.value = data.address?.city || "";
    els.addrPostal.value = data.address?.postalCode || "";
    return;
  }

  els.editInput.value =
    type === "email" ? auth.currentUser.email : data[type];
}

els.saveEditBtn.onclick = async () => {
  const user = auth.currentUser;

  if (currentEdit === "email") {
    await updateEmail(user, els.editInput.value);
    els.email.textContent = els.editInput.value;
  }

  if (currentEdit === "username") {
    await updateDoc(userRef, { displayName: els.editInput.value });
    els.username.textContent = els.editInput.value;
  }

  if (currentEdit === "description") {
    await updateDoc(userRef, { description: els.editInput.value });
    els.description.textContent = els.editInput.value;
  }

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
};

// ================= PAYMENT =================
els.editPaymentBtn.onclick = () => {
  els.paymentEdit.style.display =
    els.paymentEdit.style.display === "block" ? "none" : "block";
  els.editor.style.display = "none";
};

els.savePaymentBtn.onclick = async () => {
  const method = els.paymentMethod.value;
  const last4 = els.cardLast4.value.trim();

  if (!method) return alert("Select payment method");
  if (method === "Card" && last4.length !== 4)
    return alert("Enter last 4 digits");

  await updateDoc(userRef, {
    payment: {
      method,
      last4: method === "Card" ? last4 : ""
    }
  });

  els.payment.textContent =
    method === "Card" ? `Card •••• ${last4}` : method;

  els.paymentEdit.style.display = "none";
};

// ================= LOGOUT =================
els.logoutBtn.onclick = async () => {
  await signOut(auth);
  window.location.href = "/hawkers-app-ignatius/index.html";
};
