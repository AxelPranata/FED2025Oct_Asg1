import { auth, provider } from "./firebase.js";
import { saveProfile } from "./db.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/**
 * Binds auth buttons on signup/login pages.
 * Decides redirect based on page role.
 */
function getRole(){
  const form = document.querySelector("form[data-role]");
  return form?.dataset.role || "";
}

function getRedirect(role){
  // Link login pages to onboarding pages as requested
  if (role === "user") return "step1-user.html";
  if (role === "vendor") return "step1-vendor.html";
  if (role === "user_login") return "../home.html";   
  if (role === "vendor_login") return "../home.html";
  if (role === "admin_login") return "../admin.html"; // placeholder; replace with your admin dashboard later
  return "index.html";
}

function getInputs(){
  return {
    name: document.getElementById("name")?.value?.trim() || "",
    email: document.getElementById("email")?.value?.trim() || "",
    password: document.getElementById("password")?.value || "",
    terms: document.getElementById("terms")?.checked ?? true
  };
}

async function postAuthProfile(user, role, name){
  // Optional: save basic identity
  const minimal = { displayName: name || user.displayName || "" };
  await saveProfile(user.uid, role.includes("vendor") ? "vendor" : role.includes("admin") ? "admin" : "user", minimal);
}

async function handleEmail(){
  const role = getRole();
  const { name, email, password, terms } = getInputs();
  const redirect = getRedirect(role);

  if (!email || !password) return alert("Please fill in email + password.");
  if (!terms) return alert("Please agree to the terms & policy.");

  try{
    if (role === "user" || role === "vendor"){
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await postAuthProfile(cred.user, role, name);
      window.location.href = redirect;
    } else {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await postAuthProfile(cred.user, role, name);
      window.location.href = redirect;
    }
  } catch(err){
    alert(err.message);
  }
}

async function handleGoogle(){
  const role = getRole();
  const redirect = getRedirect(role);
  try{
    const cred = await signInWithPopup(auth, provider);
    await postAuthProfile(cred.user, role, "");
    window.location.href = redirect;
  } catch(err){
    alert(err.message);
  }
}

document.getElementById("btnPrimary")?.addEventListener("click", handleEmail);
document.getElementById("btnGoogle")?.addEventListener("click", handleGoogle);
