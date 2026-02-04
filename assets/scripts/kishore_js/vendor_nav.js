fetch('vendor_nav.html')
  .then(response => response.text())
  .then(html => {
    // Inject nav HTML
    document.getElementById('nav-container').innerHTML = html;

    /* =========================
       Highlight active tab
    ========================= */
    const currentPage = window.location.pathname.split('/').pop();

    document.querySelectorAll('.nav-tab').forEach(tab => {
      const href = tab.getAttribute('href');
      if (href === currentPage) {
        tab.classList.add('active');
      }
    });

    /* =========================
       Tab click handling
    ========================= */
    const tabs = document.querySelectorAll('.nav-tab');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        console.log('Switched to:', tab.dataset.tab);
      });
    });

    /* =========================
       Logout button
    ========================= */
    const logoutBtn = document.querySelector('.logout-btn');

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        console.log('Logout clicked');
        alert('Logout functionality would be implemented here');
      });
    }
  })
  .catch(err => console.error('Failed to load nav:', err));
