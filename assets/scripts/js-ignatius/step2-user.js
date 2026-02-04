import { auth } from "./firebase.js";
import { saveProfile } from "./db.js";
import { bindChips } from "./ui.js";

const chips = bindChips("chipList", 3);

document.getElementById("btnNextUserPrefs")?.addEventListener("click", async () => {
  if (!chips.validate()) return;

  const user = auth.currentUser;
  if (!user) return alert("You are not logged in (practice).");

  const prefs = chips.getSelected();
  localStorage.setItem("userPrefs", JSON.stringify(prefs));
  await saveProfile(user.uid, "user", { preferences: prefs });

  // TODO: redirect to your actual home/feed page later
  window.location.href = "../home.html";


});
