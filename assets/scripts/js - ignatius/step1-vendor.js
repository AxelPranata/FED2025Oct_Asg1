import { auth } from "./firebase.js";
import { saveProfile } from "./db.js";
import { bindImagePreview } from "./ui.js";

bindImagePreview("coverPhoto", "coverBox");

document.getElementById("btnPublishStall")?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return alert("You are not logged in (practice). Go back to signup/login.");

  const stallName = document.getElementById("stallName").value.trim();
  const stallDesc = document.getElementById("stallDesc").value.trim();
  const stallAddr = document.getElementById("stallAddr").value.trim();

  await saveProfile(user.uid, "vendor", { stallName, stallDesc, stallAddr });
  window.location.href = "step2-vendor.html";
});
