import { auth } from "./firebase.js";
import { saveProfile } from "./db.js";
import { bindChips } from "./ui.js";

const chips = bindChips("chipList", 1);

document
  .getElementById("btnNextVendorCuisines")
  .addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("You are not logged in (practice).");
      return;
    }

    const selected = chips.getSelected();
    const other = document.getElementById("otherCuisine").value.trim();
    const cuisines = other ? [...selected, other] : selected;

    await saveProfile(user.uid, "vendor", { cuisines });

    // redirect AFTER save
    window.location.href = "/home.html";
  });
