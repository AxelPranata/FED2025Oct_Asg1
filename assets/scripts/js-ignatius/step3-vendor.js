import { auth } from "./firebase.js";
import { saveProfile } from "./db.js";
import { bindImagePreview } from "./ui.js";

bindImagePreview("dishPhoto", "dishBox");

document.getElementById("btnPublishDish")?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return alert("You are not logged in (practice).");

  const dishPrice = document.getElementById("dishPrice").value.trim();
  const dishName = document.getElementById("dishName").value.trim();
  const dishDesc = document.getElementById("dishDesc").value.trim();

  await saveProfile(user.uid, "vendor", {
    firstMenuItem: { dishPrice, dishName, dishDesc }
  });

   window.location.href = "../vendor_menu.html";
});
