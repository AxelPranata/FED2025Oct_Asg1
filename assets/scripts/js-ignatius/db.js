import { db } from "./firebase.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * Save onboarding data keyed by uid + role.
 * Keeping it simple for FED practice.
 */
export async function saveProfile(uid, role, payload){
  const ref = doc(db, "profiles", `${role}_${uid}`);
  await setDoc(ref, { ...payload, role, updatedAt: serverTimestamp() }, { merge:true });
}
