fetch('./vendor_nav.html')
  .then(response => response.text())
  .then(html => {
    // Inject nav HTML
    document.getElementById('nav-container').innerHTML = html;

    /* =========================
       Highlight active tab
    ========================= */
    const currentPage = window.location.pathname.split('/').pop();

    // Highlight desktop tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      const href = tab.getAttribute('href');
      if (href === currentPage) {
        tab.classList.add('active');
      }
    });

    // Highlight mobile tabs
    document.querySelectorAll('.mobile-nav-tab').forEach(tab => {
      const href = tab.getAttribute('href');
      if (href === currentPage) {
        tab.classList.add('active');
      }
    });

    /* =========================
       Hamburger Menu Toggle
    ========================= */
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (hamburgerBtn && mobileMenu) {
      hamburgerBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
        
        // Optional: Change hamburger icon to X when open
        const icon = hamburgerBtn.querySelector('.hamburger-icon path');
        if (mobileMenu.classList.contains('open')) {
          // Change to X icon
          icon.setAttribute('d', 'M6 18L18 6M6 6l12 12');
        } else {
          // Change back to hamburger
          icon.setAttribute('d', 'M4 6h16M4 12h16M4 18h16');
        }
      });

      // Close mobile menu when clicking on a link
      document.querySelectorAll('.mobile-nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          mobileMenu.classList.remove('open');
          const icon = hamburgerBtn.querySelector('.hamburger-icon path');
          icon.setAttribute('d', 'M4 6h16M4 12h16M4 18h16');
        });
      });
    }

    /* =========================
       Tab click handling (Desktop)
    ========================= */
    const tabs = document.querySelectorAll('.nav-tab');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        console.log('Switched to:', tab.getAttribute('href'));
      });
    });

    /* =========================
       Logout button
    ========================= */
    const logoutBtn = document.querySelector('.logout-btn');

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        console.log('Logout clicked');
        // Clear any session data
        localStorage.clear();
        sessionStorage.clear();
        // Redirect to login page
        window.location.href = '/hawkers-app-ignatius/login-vendor.html';
      });
    }
  })
  .catch(err => console.error('Failed to load nav:', err));