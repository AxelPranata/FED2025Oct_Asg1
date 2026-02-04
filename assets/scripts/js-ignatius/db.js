import { db } from "./firebase.js";
import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function saveProfile(uid, role, payload){
  const ref = doc(db, "users", uid);
  await setDoc(
    ref,
    {
      ...payload,
      role,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}
