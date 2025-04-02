// Connect to WebSocket server
const socket = io();

// DOM Elements
const userView = document.getElementById('user-view');
const adminView = document.getElementById('admin-view');
const btnUserMode = document.getElementById('btn-user-mode');
const btnAdminMode = document.getElementById('btn-admin-mode');
const btnDarkMode = document.getElementById('btn-dark-mode');
const accessStatus = document.getElementById('access-status');
const accessDetails = document.getElementById('access-details');
const userName = document.getElementById('user-name');
const cardId = document.getElementById('card-id');
const btnScanCard = document.getElementById('btn-scan-card');
const userList = document.getElementById('user-list');
const btnAddUser = document.getElementById('btn-add-user');
const userModal = document.getElementById('user-modal');
const modalTitle = document.getElementById('modal-title');
const userForm = document.getElementById('user-form');
const userIdInput = document.getElementById('user-id');
const userNameInput = document.getElementById('user-name-input');
const cardIdInput = document.getElementById('card-id-input');
const roleInput = document.getElementById('role-input');
const btnScanForId = document.getElementById('btn-scan-for-id');
const confirmModal = document.getElementById('confirm-modal');
const confirmMessage = document.getElementById('confirm-message');
const confirmAction = document.getElementById('confirm-action');
const searchUsers = document.getElementById('search-users');
const notificationContainer = document.getElementById('notification-container');

// Create auth modal elements
const authModal = document.createElement('div');
authModal.id = 'auth-modal';
authModal.className = 'modal';
authModal.innerHTML = `
  <div class="modal-content">
    <div class="modal-header">
      <h3>Management Authentication</h3>
      <button class="close-modal"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body">
      <div class="auth-options">
        <div class="auth-option">
          <h4>Password Authentication</h4>
          <div class="form-group">
            <label for="admin-password">Password:</label>
            <input type="password" id="admin-password" placeholder="Enter admin password">
          </div>
          <button id="btn-password-auth" class="button-primary">Login</button>
        </div>
        <div class="auth-divider">OR</div>
        <div class="auth-option">
          <h4>Admin Card Authentication</h4>
          <p>Present your admin card to the reader</p>
          <button id="btn-card-auth" class="button-secondary">
            <i class="fas fa-credit-card"></i> Scan Admin Card
          </button>
        </div>
      </div>
      <div id="auth-status" class="hidden"></div>
    </div>
  </div>
`;
document.getElementById('app').appendChild(authModal);

// Add new DOM elements
const authStatusElement = document.getElementById('auth-status');
const adminPasswordInput = document.getElementById('admin-password');
const btnPasswordAuth = document.getElementById('btn-password-auth');
const btnCardAuth = document.getElementById('btn-card-auth');

// State
let users = [];
let currentUser = null;
let isEditMode = false;
let isScanningForId = false;
let isAuthenticating = false;
let actionToConfirm = null;
let isDarkMode = true; // Always use dark mode

// Event Listeners
btnUserMode.addEventListener('click', () => switchView('user'));
btnAdminMode.addEventListener('click', () => switchView('admin'));
btnAddUser.addEventListener('click', () => openUserModal());
btnScanForId.addEventListener('click', startScanningForId);
searchUsers.addEventListener('input', filterUsers);
btnPasswordAuth.addEventListener('click', authenticateWithPassword);
btnCardAuth.addEventListener('click', authenticateWithCard);

document.querySelectorAll('.close-modal').forEach(button => {
  button.addEventListener('click', () => {
    userModal.classList.remove('open');
    confirmModal.classList.remove('open');
    authModal.classList.remove('open');
    isScanningForId = false;
    isAuthenticating = false;
  });
});

userForm.addEventListener('submit', handleUserFormSubmit);
confirmAction.addEventListener('click', handleConfirmAction);

// Socket events
socket.on('connect', () => {
  console.log('Connected to server');
  showNotification('Connected to server', 'info');
});

socket.on('access-event', handleAccessEvent);

socket.on('disconnect', () => {
  console.log('Disconnected from server');
  showNotification('Disconnected from server', 'error');
});

// Initialize app
loadUsers();
applyDarkMode();

// Functions
function applyDarkMode() {
  document.body.classList.add('dark-mode');
  // Hide dark mode button since we don't need it anymore
  btnDarkMode.style.display = 'none';
}

function switchView(viewName) {
  if (viewName === 'user') {
    userView.classList.add('active');
    adminView.classList.remove('active');
    btnUserMode.classList.add('active');
    btnAdminMode.classList.remove('active');
    resetAccessDisplay();
  } else if (viewName === 'admin') {
    // Show authentication modal instead of switching directly
    showAuthModal();
  }
}

function showAuthModal() {
  authModal.classList.add('open');
  adminPasswordInput.value = '';
  authStatusElement.classList.add('hidden');
  isAuthenticating = false;
}

function authenticateWithPassword() {
  const password = adminPasswordInput.value.trim();
  
  if (!password) {
    showAuthError('Please enter a password');
    return;
  }
  
  // For demonstration, let's use a simple password "admin"
  // In production, this should be properly secured and validated on the server
  if (password === 'admin') {
    authenticationSuccess();
  } else {
    showAuthError('Invalid password');
  }
}

function authenticateWithCard() {
  isAuthenticating = true;
  showAuthStatus('Scanning for admin card...', 'info');
  
  // Request a card scan via the server
  socket.emit('request-scan');
}

function showAuthStatus(message, type) {
  authStatusElement.innerHTML = `<div class="auth-message ${type}">${message}</div>`;
  authStatusElement.classList.remove('hidden');
}

function showAuthError(message) {
  showAuthStatus(message, 'error');
}

function authenticationSuccess() {
  showAuthStatus('Authentication successful', 'success');
  setTimeout(() => {
    authModal.classList.remove('open');
    
    // Switch to admin view
    userView.classList.remove('active');
    adminView.classList.add('active');
    btnUserMode.classList.remove('active');
    btnAdminMode.classList.add('active');
    loadUsers();
  }, 1000);
}

function resetAccessDisplay() {
  accessStatus.className = 'pending';
  accessStatus.innerHTML = `
    <div class="status-icon-wrapper">
      <i class="fas fa-credit-card status-icon"></i>
    </div>
    <h2>Awaiting Credentials</h2>
  `;
  accessDetails.classList.add('hidden');
  
  // Remove access-granted class from card-status and user-view
  const cardStatusElement = document.querySelector('.card-status');
  if (cardStatusElement) {
    cardStatusElement.classList.remove('access-granted');
  }
  userView.classList.remove('access-granted');
}

function requestCardScan() {
  resetAccessDisplay();
  accessStatus.innerHTML = `
    <i class="fas fa-sync-alt status-icon fa-spin"></i>
    <h2>Scanning...</h2>
  `;
  
  fetch('/api/scan-card')
    .then(response => response.json())
    .catch(error => {
      console.error('Error:', error);
      showNotification('Error connecting to server', 'error');
      resetAccessDisplay();
    });
    
  // Alternatively, use WebSocket:
  socket.emit('request-scan');
}

function handleAccessEvent(event) {
  console.log('Received access event:', event);
  
  if (isAuthenticating) {
    // Handle authentication with admin card
    if (event.userData && event.userData.role === 'admin') {
      isAuthenticating = false;
      authenticationSuccess();
    } else {
      isAuthenticating = false;
      showAuthError('Invalid admin card. Please use an authorized admin card.');
    }
    return;
  }
  
  if (isScanningForId) {
    console.log('Adding card to form:', event.userData.cardId);
    const scannedCardId = event.userData && event.userData.cardId ? event.userData.cardId : null;
    
    if (scannedCardId) {
      cardIdInput.value = scannedCardId;
      isScanningForId = false;
      showNotification('Card ID scanned successfully', 'success');
    }
    return;
  }
  
  // Get the card status element
  const cardStatusElement = document.querySelector('.card-status');
  
  if (event.granted) {
    console.log('Access granted for user:', event.userData);
    accessStatus.className = 'allowed';
    accessStatus.innerHTML = `
      <div class="status-icon-wrapper">
        <i class="fas fa-check-circle status-icon"></i>
      </div>
      <h2>Access Granted</h2>
    `;
    
    // Add the access-granted class to the card and the user view
    cardStatusElement.classList.add('access-granted');
    userView.classList.add('access-granted');
    
    userName.textContent = event.userData.name;
    cardId.innerHTML = `Card ID: <span>${event.userData.cardId}</span>`;
    accessDetails.classList.remove('hidden');
  } else {
    console.log('Access denied for card:', event.userData);
    accessStatus.className = 'denied';
    accessStatus.innerHTML = `
      <div class="status-icon-wrapper">
        <i class="fas fa-times-circle status-icon"></i>
      </div>
      <h2>Access Denied</h2>
    `;
    
    // Remove the access-granted class if it exists
    cardStatusElement.classList.remove('access-granted');
    userView.classList.remove('access-granted');
    
    accessDetails.classList.add('hidden');
  }
  
  // Auto-reset after 5 seconds
  setTimeout(() => {
    if (userView.classList.contains('active')) {
      resetAccessDisplay();
      // Also remove the access-granted class
      cardStatusElement.classList.remove('access-granted');
      userView.classList.remove('access-granted');
    }
  }, 5000);
}

async function loadUsers() {
  try {
    const response = await fetch('/api/users');
    users = await response.json();
    renderUsers();
  } catch (error) {
    console.error('Error loading users:', error);
    showNotification('Failed to load users', 'error');
  }
}

function renderUsers() {
  userList.innerHTML = '';
  
  if (users.length === 0) {
    userList.innerHTML = `
      <tr>
        <td colspan="4" class="text-center">No users found</td>
      </tr>
    `;
    return;
  }
  
  users.forEach(user => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${user.name}</td>
      <td>${user.cardId}</td>
      <td>${user.role}</td>
      <td>
        <div class="user-actions">
          <button class="edit" data-id="${user.id}" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="delete" data-id="${user.id}" title="Delete">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </td>
    `;
    
    userList.appendChild(row);
    
    // Add event listeners
    row.querySelector('.edit').addEventListener('click', () => {
      editUser(user);
    });
    
    row.querySelector('.delete').addEventListener('click', () => {
      confirmDelete(user);
    });
  });
}

function filterUsers() {
  const searchTerm = searchUsers.value.toLowerCase();
  
  if (!searchTerm) {
    renderUsers();
    return;
  }
  
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm) || 
    user.cardId.toLowerCase().includes(searchTerm)
  );
  
  userList.innerHTML = '';
  
  if (filteredUsers.length === 0) {
    userList.innerHTML = `
      <tr>
        <td colspan="4" class="text-center">No matching users found</td>
      </tr>
    `;
    return;
  }
  
  filteredUsers.forEach(user => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${user.name}</td>
      <td>${user.cardId}</td>
      <td>${user.role}</td>
      <td>
        <div class="user-actions">
          <button class="edit" data-id="${user.id}" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="delete" data-id="${user.id}" title="Delete">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </td>
    `;
    
    userList.appendChild(row);
    
    // Add event listeners
    row.querySelector('.edit').addEventListener('click', () => {
      editUser(user);
    });
    
    row.querySelector('.delete').addEventListener('click', () => {
      confirmDelete(user);
    });
  });
}

function openUserModal(user = null) {
  isEditMode = !!user;
  
  if (isEditMode) {
    modalTitle.textContent = 'Edit User';
    userIdInput.value = user.id;
    userNameInput.value = user.name;
    cardIdInput.value = user.cardId;
    roleInput.value = user.role;
  } else {
    modalTitle.textContent = 'Add New User';
    userForm.reset();
    userIdInput.value = '';
  }
  
  userModal.classList.add('open');
}

function editUser(user) {
  currentUser = user;
  openUserModal(user);
}

function confirmDelete(user) {
  currentUser = user;
  confirmMessage.textContent = `Are you sure you want to delete ${user.name}?`;
  actionToConfirm = 'delete';
  confirmAction.textContent = 'Delete';
  confirmAction.className = 'button-danger';
  confirmModal.classList.add('open');
}

async function handleUserFormSubmit(event) {
  event.preventDefault();
  
  const userData = {
    name: userNameInput.value,
    cardId: cardIdInput.value,
    role: roleInput.value,
    active: true
  };
  
  try {
    let response;
    
    if (isEditMode) {
      response = await fetch(`/api/users/${userIdInput.value}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
    } else {
      response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
    }
    
    if (response.ok) {
      showNotification(
        `User ${isEditMode ? 'updated' : 'added'} successfully`,
        'success'
      );
      userModal.classList.remove('open');
      loadUsers();
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save user');
    }
  } catch (error) {
    console.error('Error saving user:', error);
    showNotification(error.message, 'error');
  }
}

async function handleConfirmAction() {
  if (actionToConfirm === 'delete') {
    try {
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        showNotification('User deleted successfully', 'success');
        loadUsers();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showNotification(error.message, 'error');
    }
  }
  
  confirmModal.classList.remove('open');
}

function startScanningForId() {
  isScanningForId = true;
  showNotification('Scanning for card...', 'info');
  fetch('/api/scan-card')
    .catch(error => {
      console.error('Error:', error);
      isScanningForId = false;
      showNotification('Error connecting to server', 'error');
    });
  
  // Alternatively, use WebSocket:
  socket.emit('request-scan');
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  let icon;
  switch (type) {
    case 'success':
      icon = 'check-circle';
      break;
    case 'error':
      icon = 'exclamation-circle';
      break;
    case 'warning':
      icon = 'exclamation-triangle';
      break;
    default:
      icon = 'info-circle';
  }
  
  notification.innerHTML = `
    <i class="fas fa-${icon} notification-icon"></i>
    <div class="notification-message">
      ${message}
    </div>
    <button class="notification-close">&times;</button>
  `;
  
  notificationContainer.appendChild(notification);
  
  notification.querySelector('.notification-close').addEventListener('click', () => {
    notification.style.animation = 'notificationFadeOut 0.3s forwards';
    setTimeout(() => {
      notification.remove();
    }, 300);
  });
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'notificationFadeOut 0.3s forwards';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }
  }, 5000);
} 