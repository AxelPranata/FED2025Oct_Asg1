import { auth } from "./firebase.js";
import { saveProfile } from "./db.js";
import { bindChips } from "./ui.js";

const chips = bindChips("chipList", 1);

document.getElementById("btnNextVendorCuisines")?.addEventListener("click", async () => {
  if (!chips.validate()) return;

  const user = auth.currentUser;
  if (!user) return alert("You are not logged in (practice).");

  const selected = chips.getSelected();
  const other = document.getElementById("otherCuisine").value.trim();
  const cuisines = other ? [...selected, other] : selected;

  await saveProfile(user.uid, "vendor", { cuisines });
  window.location.href = "step3-vendor.html";
});
