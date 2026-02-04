import { auth } from "./firebase.js";
import { saveProfile } from "./db.js";
import { bindImagePreview } from "./ui.js";

bindImagePreview("userPhoto", "userPhotoBox");

document.getElementById("btnCompleteUser")?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return alert("You are not logged in (practice). Go back to signup/login.");

  const username = document.getElementById("username").value.trim();
  const desc = document.getElementById("desc").value.trim();

  await saveProfile(user.uid, "user", { username, description: desc });
  window.location.href = "step2-user.html";
});
