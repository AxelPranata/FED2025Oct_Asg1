import { db, auth } from './kiki_firebase.js';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc,
  onAuthStateChanged
} from './kiki_firebase.js';
// Import these directly from Firebase instead of from kiki_firebase.js
import { 
  serverTimestamp,
  query,
  where
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

document.addEventListener("DOMContentLoaded", () => {
  const storesGrid = document.getElementById("storesGrid");
  const addStoreBtn = document.getElementById("addStoreBtn");
  const searchInput = document.getElementById("searchInput");
  const gradeFilter = document.getElementById("gradeFilter");
  const statusFilter = document.getElementById("statusFilter");
  
  let currentUserUID = null;
  let allStores = [];

  // Auth state listener
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUserUID = user.uid;
      loadStores();
    } else {
      window.location.href = 'login.html';
    }
  });

  const gradeClass = (grade) => `badge-${grade.toLowerCase()}`;

  const statusBadge = (status) =>
    status === "open"
      ? `<span class="badge badge-open">Open</span>`
      : `<span class="badge badge-closed">Closed</span>`;

  // Load stores from Firestore
  async function loadStores() {
    try {
      // Path: /vendors/{uid}/stores
      const storesRef = collection(db, 'vendors', currentUserUID, 'stores');
      const querySnapshot = await getDocs(storesRef);
      const stores = [];
      
      querySnapshot.forEach((docSnap) => {
        stores.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });

      allStores = stores;
      renderStores(stores);
    } catch (error) {
      console.error("Error loading stores:", error);
      alert("Error loading stores. Please try again.");
    }
  }

  function renderStores(stores) {
    storesGrid.innerHTML = "";

    if (stores.length === 0) {
      storesGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
          <svg class="icon-xl" style="color: #d1d5db; margin-bottom: 1rem;" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4
                 M7 13L5.4 5M7 13l-2.293 2.293
                 c-.63.63-.184 1.707.707 1.707H17
                 m0 0a2 2 0 100 4 2 2 0 000-4
                 zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 style="color: #374151; margin-bottom: 0.5rem;">No stores found</h3>
          <p style="color: #6b7280; margin-bottom: 1.5rem;">Add your first store to get started!</p>
          <button class="btn btn-primary" onclick="document.getElementById('addStoreBtn').click()">
            Add Your First Store
          </button>
        </div>
      `;
      return;
    }

    stores.forEach((store) => {
      storesGrid.insertAdjacentHTML(
        "beforeend",
        `
        <div class="store-card">
          <div class="store-image">
            <img src="${store.image || 'https://images.unsplash.com/photo-1581184953963-d15972933db1'}" alt="${store.name}">
            <button class="upload-btn" data-id="${store.id}">
              <svg class="icon" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1
                     m-4-8l-4-4m0 0L8 8m4-4v12"/>
              </svg>
            </button>
            <div class="badges">
              <span class="badge ${gradeClass(store.grade)}">Grade ${store.grade}</span>
              ${statusBadge(store.status)}
            </div>
          </div>

          <div class="store-header">
            <h3>${store.name}</h3>
            <p class="store-location">
              <svg class="icon" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              ${store.location} ${store.unitNumber ? '• ' + store.unitNumber : ''}
            </p>
          </div>

          <div class="store-content">
            <div class="detail-row">
              <span class="detail-label">Cuisine Type:</span>
              <span class="detail-value">${store.cuisine}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Opening Hours:</span>
              <span class="detail-value">${store.hours}</span>
            </div>

            
          </div>
        </div>
      `
      );
    });
  }

  // Filter stores
  function filterStores() {
    const searchTerm = searchInput.value.toLowerCase();
    const gradeValue = gradeFilter.value;
    const statusValue = statusFilter.value;

    let filtered = allStores;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(store => 
        store.name.toLowerCase().includes(searchTerm) ||
        store.location.toLowerCase().includes(searchTerm) ||
        (store.unitNumber && store.unitNumber.toLowerCase().includes(searchTerm)) ||
        store.cuisine.toLowerCase().includes(searchTerm)
      );
    }

    // Grade filter
    if (gradeValue) {
      filtered = filtered.filter(store => store.grade === gradeValue);
    }

    // Status filter
    if (statusValue) {
      filtered = filtered.filter(store => store.status === statusValue);
    }

    renderStores(filtered);
  }

  // Event listeners for filters
  searchInput.addEventListener('input', filterStores);
  gradeFilter.addEventListener('change', filterStores);
  statusFilter.addEventListener('change', filterStores);

  // Event delegation for dynamic buttons
  storesGrid.addEventListener("click", async (e) => {
    if (e.target.closest(".view-store-btn")) {
      const storeId = e.target.closest(".view-store-btn").dataset.id;
      window.location.href = `vendor_store_profile.html?id=${storeId}`;
    }

    if (e.target.closest(".upload-btn")) {
      const storeId = e.target.closest(".upload-btn").dataset.id;
      handleImageUpload(storeId);
    }
  });

  // Handle image upload
  function handleImageUpload(storeId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const storeRef = doc(db, 'vendors', currentUserUID, 'stores', storeId);
            await updateDoc(storeRef, {
              image: e.target.result,
              updatedAt: serverTimestamp()
            });
            alert('Image uploaded successfully!');
            loadStores();
          } catch (error) {
            console.error("Error uploading image:", error);
            alert("Error uploading image. Please try again.");
          }
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  }

  // Add new store
  addStoreBtn.addEventListener("click", () => {
    showAddStoreModal();
  });

  function showAddStoreModal() {
    const modalHTML = `
      <div id="addStoreModal" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      ">
        <div style="
          background: white;
          padding: 30px;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        ">
          <h2 style="margin-top: 0;">Add New Store</h2>
          <form id="addStoreForm">
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Store Name *</label>
              <input type="text" name="name" required style="
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
              ">
            </div>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Location *</label>
              <input type="text" name="location" placeholder="e.g., ABC Hawker Centre" required style="
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
              ">
            </div>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Unit Number *</label>
              <input type="text" name="unitNumber" placeholder="e.g., #01-01" required style="
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
              ">
            </div>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Cuisine Type *</label>
              <select name="cuisine" required style="
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
              ">
                <option value="">Select cuisine type</option>
                <option value="Chinese">Chinese</option>
                <option value="Malay">Malay</option>
                <option value="Indian">Indian</option>
                <option value="Peranakan">Peranakan</option>
                <option value="Western">Western</option>
                <option value="Japanese">Japanese</option>
                <option value="Korean">Korean</option>
                <option value="Thai">Thai</option>
                <option value="Vietnamese">Vietnamese</option>
                <option value="Indonesian">Indonesian</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Opening Hours *</label>
              <input type="text" name="hours" placeholder="e.g., 10:00 AM - 8:00 PM" required style="
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
              ">
            </div>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Hygiene Grade *</label>
              <select name="grade" required style="
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
              ">
                <option value="">Select grade</option>
                <option value="A">A - Excellent</option>
                <option value="B">B - Good</option>
                <option value="C">C - Adequate</option>
                <option value="D">D - Pass</option>
              </select>
            </div>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Status *</label>
              <select name="status" required style="
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
              ">
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 20px;">
              <button type="submit" class="btn btn-primary" style="flex: 1;">Add Store</button>
              <button type="button" id="cancelModal" class="btn btn-outline" style="flex: 1;">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.getElementById('addStoreForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(e.target);
      const storeData = {
        name: formData.get('name'),
        location: formData.get('location'),
        unitNumber: formData.get('unitNumber'),
        cuisine: formData.get('cuisine'),
        hours: formData.get('hours'),
        grade: formData.get('grade'),
        status: formData.get('status'),
        image: 'https://images.unsplash.com/photo-1581184953963-d15972933db1',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      try {
        const storesRef = collection(db, 'vendors', currentUserUID, 'stores');
        await addDoc(storesRef, storeData);
        alert('Store added successfully!');
        document.getElementById('addStoreModal').remove();
        loadStores();
      } catch (error) {
        console.error("Error adding store:", error);
        alert("Error adding store. Please try again.");
      }
    });
    
    document.getElementById('cancelModal').addEventListener('click', () => {
      document.getElementById('addStoreModal').remove();
    });
  }
});