import { 
  db, 
  collection, 
  getDocs, 
  doc,
  onSnapshot,
  getDoc
} from './kiki_firebase.js';

let currentVendorId = '4I9X843cHGcdTZINaPiAY0DRwFx2'; // YOUR ACTUAL UID
let ordersChart = null;
let revenueChart = null;

// Real-time listener for stats
function listenToStats() {
  const statsRef = doc(db, 'vendors', currentVendorId, 'performance', 'stats');
  
  onSnapshot(statsRef, (docSnap) => {
    if (docSnap.exists()) {
      const stats = docSnap.data();
      console.log('Stats loaded:', stats); // Debug log
      updateStatsCards(stats);
    } else {
      console.error('Stats document does not exist!');
    }
  }, (error) => {
    console.error('Error loading stats:', error);
  });
}

// Real-time listener for monthly data
async function listenToMonthlyData() {
  const monthlyRef = collection(db, 'vendors', currentVendorId, 'monthly_data');
  
  onSnapshot(monthlyRef, async (snapshot) => {
    const monthlyData = [];
    snapshot.forEach((doc) => {
      monthlyData.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('Monthly data loaded:', monthlyData); // Debug log
    
    // Sort by timestamp
    monthlyData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    if (monthlyData.length > 0) {
      updateCharts(monthlyData);
    } else {
      console.error('No monthly data found!');
    }
  }, (error) => {
    console.error('Error loading monthly data:', error);
  });
}

// Update stats cards
function updateStatsCards(stats) {
  if (!stats) {
    console.error('Stats is undefined!');
    return;
  }

  // Total Orders
  const totalOrdersEl = document.querySelector('.stat-card:nth-child(1) .stat-value');
  if (totalOrdersEl && stats.totalOrders !== undefined) {
    totalOrdersEl.textContent = stats.totalOrders.toLocaleString();
  }
  
  // Total Revenue
  const totalRevenueEl = document.querySelector('.stat-card:nth-child(2) .stat-value');
  if (totalRevenueEl && stats.totalRevenue !== undefined) {
    totalRevenueEl.textContent = `S$${stats.totalRevenue.toLocaleString()}`;
  }
  
  // Average Order Value
  const avgOrderEl = document.querySelector('.stat-card:nth-child(3) .stat-value');
  if (avgOrderEl && stats.avgOrderValue !== undefined) {
    avgOrderEl.textContent = `S$${stats.avgOrderValue.toFixed(2)}`;
  }
  
  // Repeat Customers
  const repeatCustomersEl = document.querySelector('.stat-card:nth-child(4) .stat-value');
  if (repeatCustomersEl && stats.repeatCustomers !== undefined) {
    repeatCustomersEl.textContent = stats.repeatCustomers.toLocaleString();
  }
}

// Update charts with real data
function updateCharts(monthlyData) {
  if (!monthlyData || monthlyData.length === 0) {
    console.error('No monthly data to display!');
    return;
  }

  const labels = monthlyData.map(item => item.month);
  const ordersData = monthlyData.map(item => item.orders);
  const revenueData = monthlyData.map(item => item.revenue);
  
  console.log('Chart labels:', labels);
  console.log('Orders data:', ordersData);
  console.log('Revenue data:', revenueData);
  
  // Destroy existing charts if they exist
  if (ordersChart) ordersChart.destroy();
  if (revenueChart) revenueChart.destroy();
  
  // Orders Chart
  const ordersCanvas = document.getElementById('ordersChart');
  if (ordersCanvas) {
    const ordersCtx = ordersCanvas.getContext('2d');
    ordersChart = new Chart(ordersCtx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Orders',
          data: ordersData,
          backgroundColor: '#ea580c',
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#e5e7eb'
            },
            ticks: {
              color: '#6b7280'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#6b7280'
            }
          }
        }
      }
    });
  }

  // Revenue Chart
  const revenueCanvas = document.getElementById('revenueChart');
  if (revenueCanvas) {
    const revenueCtx = revenueCanvas.getContext('2d');
    revenueChart = new Chart(revenueCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Revenue',
          data: revenueData,
          borderColor: '#ea580c',
          backgroundColor: 'rgba(234, 88, 12, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          pointBackgroundColor: '#ea580c',
          pointBorderColor: '#ea580c',
          pointRadius: 5,
          pointHoverRadius: 7,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return 'S$' + context.parsed.y.toLocaleString();
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#e5e7eb'
            },
            ticks: {
              color: '#6b7280',
              callback: function(value) {
                return 'S$' + value.toLocaleString();
              }
            }
          },
          x: {
            grid: {
              color: '#e5e7eb'
            },
            ticks: {
              color: '#6b7280'
            }
          }
        }
      }
    });
  }
}

// Initialize
console.log('Initializing performance page for vendor:', currentVendorId);
listenToStats();
listenToMonthlyData();