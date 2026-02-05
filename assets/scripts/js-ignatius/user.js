import { auth, db } from "./firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

window.addEventListener("DOMContentLoaded", () => {

  // ==========================
  // DOM ELEMENTS
  // ==========================
  const usernameEl = document.getElementById("profileUsername");
  const descEl = document.getElementById("profileDescription");
  const emailEl = document.getElementById("profileEmail");
  const addressEl = document.getElementById("profileAddress");
  const logoutBtn = document.getElementById("logoutBtn");

  const profilePayment = document.getElementById("profilePayment");
  const editPaymentBtn = document.getElementById("editPaymentBtn");
  const paymentEdit = document.getElementById("paymentEdit");
  const paymentMethodInput = document.getElementById("paymentMethod");
  const cardLast4Input = document.getElementById("cardLast4");
  const savePaymentBtn = document.getElementById("savePaymentBtn");

  // ==========================
  // AUTH + LOAD PROFILE
  // ==========================
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    emailEl.textContent = user.email;

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    // Create user document if missing
    if (!snap.exists()) {
      await setDoc(userRef, {
        displayName: user.displayName || "User",
        description: "",
        email: user.email,
        address: null,
        payment: null
      });
    }

    const data = snap.exists() ? snap.data() : {};

    // ==========================
    // BASIC INFO
    // ==========================
    usernameEl.textContent = data.displayName || "Not set";
    descEl.textContent = data.description || "No description";

    // ==========================
    // ADDRESS (OBJECT → STRING)
    // ==========================
    if (data.address && typeof data.address === "object") {
      const { line1, city, postalCode } = data.address;

      addressEl.textContent = [line1, city, postalCode]
        .filter(Boolean)
        .join(", ");
    } else {
      addressEl.textContent = "Not set";
    }

    // ==========================
    // PAYMENT
    // ==========================
    if (data.payment && data.payment.method) {
      profilePayment.textContent =
        data.payment.method === "Card"
          ? `${data.payment.method} •••• ${data.payment.last4}`
          : data.payment.method;
    } else {
      profilePayment.textContent = "Not set";
    }
  });

  // ==========================
  // PAYMENT UI
  // ==========================
  if (editPaymentBtn && paymentEdit) {
    editPaymentBtn.addEventListener("click", () => {
      paymentEdit.style.display =
        paymentEdit.style.display === "none" ? "block" : "none";
    });
  }

  if (savePaymentBtn) {
    savePaymentBtn.addEventListener("click", async () => {
      const user = auth.currentUser;
      if (!user) return;

      const method = paymentMethodInput.value;
      const last4 = cardLast4Input.value.trim();

      if (!method) {
        alert("Please select a payment method");
        return;
      }

      if (method === "Card" && last4.length !== 4) {
        alert("Please enter the last 4 digits");
        return;
      }

      try {
        await updateDoc(doc(db, "users", user.uid), {
          payment: {
            method,
            last4: method === "Card" ? last4 : ""
          }
        });

        profilePayment.textContent =
          method === "Card"
            ? `${method} •••• ${last4}`
            : method;

        paymentEdit.style.display = "none";
        alert("Payment updated!");
      } catch (err) {
        console.error(err);
        alert("Failed to update payment");
      }
    });
  }

  // ==========================
  // LOGOUT
  // ==========================
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });
});
