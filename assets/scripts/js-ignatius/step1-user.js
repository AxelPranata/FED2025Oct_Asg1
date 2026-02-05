console.log("✅ step1-user.js loaded");
import { auth } from "./firebase.js";
import { saveProfile } from "./db.js";
import { bindImagePreview } from "./ui.js";

bindImagePreview("userPhoto", "userPhotoBox");

document.getElementById("btnCompleteUser")?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("You are not logged in (practice). Go back to signup/login.");
    return;
  }

  const displayName = document.getElementById("username").value.trim();
  const description = document.getElementById("desc").value.trim();

  const addressLine = document.getElementById("addressLine").value.trim();
  const postalCode = document.getElementById("postalCode").value.trim();
  const city = document.getElementById("city").value.trim();

  const paymentMethod = document.getElementById("paymentMethod").value;
  const cardLast4 = document.getElementById("cardLast4").value.trim();

  if (!displayName) {
    alert("Username is required");
    return;
  }

  await saveProfile(user.uid, "user", {
    displayName,
    description,

    address: {
      line1: addressLine,
      postalCode,
      city
    },

    payment: paymentMethod
      ? {
          method: paymentMethod,
          last4: cardLast4 || ""
        }
      : null
  });

  window.location.href = "step2-user.html";
});

