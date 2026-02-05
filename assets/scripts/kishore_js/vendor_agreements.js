import { 
  db, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  onSnapshot 
} from './kiki_firebase.js';

let currentVendorId = '4I9X843cHGcdTZINaPiAY0DRwFx2'; // Replace with actual logged-in vendor ID

function getWrapperClass(status) {
  const classes = {
    valid: 'wrapper-valid',
    expiring: 'wrapper-expiring',
    expired: 'wrapper-expired'
  };
  return classes[status] || '';
}

function getStatusIcon(status) {
  const icons = {
    valid: { icon: 'check-circle', class: 'icon-valid' },
    expiring: { icon: 'clock', class: 'icon-expiring' },
    expired: { icon: 'alert-circle', class: 'icon-expired' }
  };
  return icons[status];
}

function getStatusBadge(status) {
  const badges = {
    valid: { text: 'Valid', class: 'badge-valid' },
    expiring: { text: 'Expiring Soon', class: 'badge-expiring' },
    expired: { text: 'Expired', class: 'badge-expired' }
  };
  return badges[status];
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-GB', options);
}

// Real-time listener for agreements
function listenToAgreements() {
  const agreementsRef = collection(db, 'vendors', currentVendorId, 'agreements');
  
  onSnapshot(agreementsRef, (snapshot) => {
    const documents = [];
    snapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    renderDocuments(documents);
  });
}

function renderDocuments(documents) {
  const grid = document.getElementById('documents-grid');
  grid.innerHTML = ''; // Clear existing content
  
  documents.forEach(doc => {
    const statusIcon = getStatusIcon(doc.status);
    const statusBadge = getStatusBadge(doc.status);
    const wrapperClass = getWrapperClass(doc.status);
    const formattedDate = formatDate(doc.expiryDate);
    
    // Check if document has been uploaded (has fileUrl)
    const hasFile = doc.fileUrl && doc.fileUrl.trim() !== '';
    
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-header">
        <div class="card-header-top">
          <div class="icon-wrapper ${wrapperClass}">
            <i data-lucide="file-text" class="icon-lg"></i>
          </div>
          <i data-lucide="${statusIcon.icon}" class="icon ${statusIcon.class}"></i>
        </div>
        <h3 class="card-title">${doc.name}</h3>
        <p class="card-description">${doc.type}</p>
      </div>
      <div class="card-content">
        <div class="content-space">
          <div class="info-row">
            <span class="info-label">Status:</span>
            <span class="badge ${statusBadge.class}">${statusBadge.text}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Expiry Date:</span>
            <span class="info-value">${formattedDate}</span>
          </div>
          <div class="button-group">
            ${hasFile ? `
              <button class="btn btn-outline" onclick="viewDocument('${doc.id}', '${doc.fileUrl}', '${doc.name}')">
                <i data-lucide="eye" class="icon"></i>
                View
              </button>
              <button class="btn btn-outline" onclick="replaceDocument('${doc.id}')">
                <i data-lucide="upload" class="icon"></i>
                Replace
              </button>
            ` : `
              <button class="btn btn-primary" onclick="uploadDocument('${doc.id}')">
                <i data-lucide="upload" class="icon"></i>
                Upload
              </button>
            `}
            <button class="btn btn-outline" onclick="editDocument('${doc.id}', '${doc.name}', '${doc.type}', '${doc.expiryDate}')">
              <i data-lucide="edit" class="icon"></i>
            </button>
            <button class="btn btn-outline btn-delete" onclick="deleteDocument('${doc.id}')">
              <i data-lucide="trash-2" class="icon"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    
    grid.appendChild(card);
  });

  // Safely initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// View document
window.viewDocument = function(docId, fileUrl, docName) {
  if (fileUrl && fileUrl.trim() !== '') {
    // Open in new tab
    window.open(fileUrl, '_blank');
  } else {
    showModal('Error', 'No file available to view.');
  }
};

// Upload/Replace document
window.uploadDocument = function(docId) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.pdf,.jpg,.jpeg,.png';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Uploading file:', file.name);
      
      // TODO: Upload to Firebase Storage and get URL
      // For now, using placeholder
      const fileUrl = `https://placeholder.com/${file.name}`;
      
      try {
        const docRef = doc(db, 'vendors', currentVendorId, 'agreements', docId);
        await updateDoc(docRef, {
          uploaded: true,
          fileUrl: fileUrl,
          fileName: file.name,
          uploadedAt: new Date().toISOString()
        });
        showModal('Success', `File "${file.name}" uploaded successfully!`);
      } catch (error) {
        console.error('Error uploading:', error);
        showModal('Error', 'Failed to upload file. Please try again.');
      }
    }
  };
  input.click();
};

window.replaceDocument = function(docId) {
  if (confirm('Are you sure you want to replace this document?')) {
    window.uploadDocument(docId);
  }
};

// Edit document details
window.editDocument = async function(docId, currentName, currentType, currentExpiry) {
  // Create modal
  const modalHTML = `
    <div id="editModal" class="modal">
      <div class="modal-content">
        <h3>Edit Document Details</h3>
        <form id="editForm">
          <div class="form-group">
            <label>Document Name:</label>
            <input type="text" id="editName" value="${currentName}" required>
          </div>
          <div class="form-group">
            <label>Document Type:</label>
            <input type="text" id="editType" value="${currentType}" required>
          </div>
          <div class="form-group">
            <label>Expiry Date:</label>
            <input type="date" id="editExpiry" value="${currentExpiry}" required>
          </div>
          <div class="modal-buttons">
            <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Handle form submission
  document.getElementById('editForm').onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('editName').value;
    const type = document.getElementById('editType').value;
    const expiryDate = document.getElementById('editExpiry').value;
    
    try {
      const docRef = doc(db, 'vendors', currentVendorId, 'agreements', docId);
      await updateDoc(docRef, {
        name,
        type,
        expiryDate,
        updatedAt: new Date().toISOString()
      });
      closeModal();
      showModal('Success', 'Document updated successfully!');
    } catch (error) {
      console.error('Error updating:', error);
      showModal('Error', 'Failed to update document. Please try again.');
    }
  };
};

// Delete document
window.deleteDocument = async function(docId) {
  if (confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
    try {
      const docRef = doc(db, 'vendors', currentVendorId, 'agreements', docId);
      await deleteDoc(docRef);
      showModal('Success', 'Document deleted successfully!');
    } catch (error) {
      console.error('Error deleting document:', error);
      showModal('Error', 'Failed to delete document. Please try again.');
    }
  }
};

// Add new agreement
window.addNewAgreement = async function() {
  const modalHTML = `
    <div id="addModal" class="modal">
      <div class="modal-content">
        <h3>Add New Agreement</h3>
        <form id="addForm">
          <div class="form-group">
            <label>Document Name:</label>
            <input type="text" id="addName" placeholder="e.g., Business License" required>
          </div>
          <div class="form-group">
            <label>Document Type:</label>
            <input type="text" id="addType" placeholder="e.g., License" required>
          </div>
          <div class="form-group">
            <label>Expiry Date:</label>
            <input type="date" id="addExpiry" required>
          </div>
          <div class="modal-buttons">
            <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Add Agreement</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  document.getElementById('addForm').onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('addName').value;
    const type = document.getElementById('addType').value;
    const expiryDate = document.getElementById('addExpiry').value;
    
    try {
      const agreementsRef = collection(db, 'vendors', currentVendorId, 'agreements');
      await addDoc(agreementsRef, {
        name,
        type,
        status: 'valid',
        expiryDate,
        uploaded: false,
        fileUrl: '',
        createdAt: new Date().toISOString()
      });
      closeModal();
      showModal('Success', 'Agreement added successfully!');
    } catch (error) {
      console.error('Error adding agreement:', error);
      showModal('Error', 'Failed to add agreement. Please try again.');
    }
  };
};

// Helper: Close modal
window.closeModal = function() {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => modal.remove());
};

// Helper: Show notification modal
function showModal(title, message) {
  const modalHTML = `
    <div id="notifModal" class="modal">
      <div class="modal-content modal-small">
        <h3>${title}</h3>
        <p>${message}</p>
        <button class="btn btn-primary" onclick="closeModal()">OK</button>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Initialize
listenToAgreements();