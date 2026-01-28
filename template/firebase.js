
// ADD THIS SCRIPT TO YOUR HTML (FOR EXAMPLE)
// <script type="module" src="firebase.js"></script>
// WIP

/* ================================
   1. Import Firebase modules
================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
    getDatabase,
    ref,
    push,
    set,
    get,
    update,
    remove,
    child
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js";

/* ================================
   Firebase configuration
================================ */
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBanWtDqAlIO22oNB2DhGY3QPj2er_1Uzg",
    authDomain: "hawkers-b4691.firebaseapp.com",
    databaseURL: "https://hawkers-b4691-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "hawkers-b4691",
    storageBucket: "hawkers-b4691.firebasestorage.app",
    messagingSenderId: "595551259410",
    appId: "1:595551259410:web:98d614906aa354509a41cb"
};

/* ================================
   Initialize Firebase
================================ */
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* ================================
   CREATE Example (For reference)
================================ */
document.getElementById("btn-create").addEventListener("click", function (e) {
    e.preventDefault();
 
    const name = document.getElementById("create-name").value;
    const age = document.getElementById("create-age").value;
 
    // Validation of data
    if (!name || !age) {
        writeLog("❌ Name and age are required.");
        return;
    }
 
    const studentsRef = ref(db, "students");
    const newStudentRef = push(studentsRef);
 
    set(newStudentRef, {
        "name" : name, // Complete the code
        "age" : age // Complete the code
    })
    .then(() => {
        writeLog(`✅ Student created with ID: ${newStudentRef.key}`);
    })
    .catch((error) => {
        writeLog("❌ Error creating student: " + error.message);
    });
});


/* ================================
   READ Example (For reference)
================================ */
document.getElementById("btn-read-all").addEventListener("click", function (e) {
    e.preventDefault();
 
    get(ref(db, "students"))
        .then((snapshot) => {
            if (!snapshot.exists()) {
                writeLog("ℹ️ No students found.");
                return;
            }

            let content = "";
            writeLog("📚 All Students:");
            snapshot.forEach((childSnap) => {
                const id = childSnap.key;
                const data = childSnap.val();
 
                writeLog(`ID: ${id}`);
                writeLog(`Name: ${data.name}`); // modify this
                writeLog(`Age: ${data.age}`); // modify this
                writeLog("-------------------");
 
                content = `${content}<tr id='${id}' style='font-size: 12px;'>
                            <td>ID:${id}<br />
                            Name: ${data.name}&nbsp;&nbsp; 
                            Age: ${data.age}</td>
                            </tr>`;
            });
            document.getElementById("student-list").getElementsByTagName("tbody")[0].innerHTML = content;
        })
        .catch((error) => {
            writeLog("❌ Error reading students: " + error.message);
        });
});         


/* ================================
   UPDATE Example (For reference)
================================ */
document.getElementById("btn-update").addEventListener("click", function (e) {
    e.preventDefault();
 
   // Start writing your answers here, for the 3 elements that are required.
   let id = document.getElementById("update-id").value;
   let name = document.getElementById("update-name").value;
   let age = document.getElementById("update-age").value;
 
    if (!id) {
        writeLog("❌ Student ID is required.");
        return;
    }
 
    const updatedData = {};
    if (name) updatedData.name = name;
    if (age) updatedData.age = Number(age);
 
    if (Object.keys(updatedData).length === 0) {
        writeLog("❌ Nothing to update.");
        return;
    }
 
    update(ref(db, `students/${id}`), updatedData)
        .then(() => {
            writeLog(`✏️ Student ${id} updated successfully.`);
        })
        .catch((error) => {
            writeLog("❌ Error updating student: " + error.message);
        });
});


/* ================================
   9. DELETE Example (For reference)
================================ */
document.getElementById("btn-delete").addEventListener("click", function (e) {
    e.preventDefault();

    const id = document.getElementById("delete-id").value;

    if (!id) {
        writeLog("❌ Student ID is required.");
        return;
    }

    remove(ref(db, `students/${id}`))
        .then(() => {
            writeLog(`🗑️ Student ${id} deleted.`);
        })
        .catch((error) => {
            writeLog("❌ Error deleting student: " + error.message);
        });
});