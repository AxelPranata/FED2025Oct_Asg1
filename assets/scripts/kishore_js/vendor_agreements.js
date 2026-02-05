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

let currentVendorId = 'vendor_001'; // Replace with actual logged-in vendor ID

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
            ${doc.uploaded ? `
              <button class="btn btn-outline" onclick="viewDocument('${doc.id}')">
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
            <button class="btn btn-outline btn-delete" onclick="deleteDocument('${doc.id}')">
              <i data-lucide="trash-2" class="icon"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    
    grid.appendChild(card);
  });

  lucide.createIcons();
}

// View document
window.viewDocument = function(docId) {
  alert(`Viewing document: ${docId}`);
  // Add logic to open document in new tab or modal
};

// Upload/Replace document
window.uploadDocument = function(docId) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.pdf,.jpg,.png';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Uploading file:', file.name);
      alert(`File "${file.name}" uploaded successfully!`);
      
      // Update Firestore
      const docRef = doc(db, 'vendors', currentVendorId, 'agreements', docId);
      await updateDoc(docRef, {
        uploaded: true,
        fileUrl: 'path/to/file',
      });
    }
  };
  input.click();
};

window.replaceDocument = function(docId) {
  window.uploadDocument(docId);
};

// Delete document
window.deleteDocument = async function(docId) {
  if (confirm('Are you sure you want to delete this document?')) {
    try {
      const docRef = doc(db, 'vendors', currentVendorId, 'agreements', docId);
      await deleteDoc(docRef);
      alert('Document deleted successfully!');
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error deleting document');
    }
  }
};

// Add new agreement
window.addNewAgreement = async function() {
  const name = prompt('Enter document name:');
  const type = prompt('Enter document type:');
  const expiryDate = prompt('Enter expiry date (YYYY-MM-DD):');
  
  if (name && type && expiryDate) {
    try {
      const agreementsRef = collection(db, 'vendors', currentVendorId, 'agreements');
      await addDoc(agreementsRef, {
        name,
        type,
        status: 'valid',
        expiryDate,
        uploaded: false,
        createdAt: new Date().toISOString(),
        fileUrl: ''
      });
      alert('Agreement added successfully!');
    } catch (error) {
      console.error('Error adding agreement:', error);
      alert('Error adding agreement');
    }
  }
};

// Initialize
listenToAgreements();