// Dapatkan referensi ke elemen-elemen HTML yang akan dimanipulasi
const balanceElement = document.getElementById('balance');
const moneyPlus = document.getElementById('money-plus');
const moneyMinus = document.getElementById('money-minus');
const transactionList = document.getElementById('transaction-list');
const form = document.getElementById('transaction-form');
const textInput = document.getElementById('text');
const amountInput = document.getElementById('amount');
const dateInput = document.getElementById('date');
const expenseChartCanvas = document.getElementById('expenseChart').getContext('2d');
const monthSelect = document.getElementById('month-select');
const currentMonthBtn = document.getElementById('current-month-btn');

let expenseChart;
let currentFilterMonth = 'all';

// ----------------------------------------------------
// FUNGSI UNTUK LOCAL STORAGE
// ----------------------------------------------------

function getTransactionsFromLocalStorage() {
    const storedTransactions = localStorage.getItem('transactions');
    return storedTransactions ? JSON.parse(storedTransactions) : [];
}

function saveTransactionsToLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// ----------------------------------------------------
// INISIALISASI DATA TRANSAKSI
// ----------------------------------------------------
let transactions = getTransactionsFromLocalStorage();

// ----------------------------------------------------
// FUNGSI UTAMA UNTUK MEMPERBARUI UI
// ----------------------------------------------------

function updateUI() {
    const filteredTransactions = transactions.filter(transaction => {
        if (currentFilterMonth === 'all') {
            return true;
        }
        const transactionMonthYear = transaction.date.substring(0, 7);
        return transactionMonthYear === currentFilterMonth;
    });

    const totalBalance = filteredTransactions.reduce((acc, transaction) => acc + transaction.amount, 0);
    balanceElement.textContent = `Rp${totalBalance.toLocaleString('id-ID')}`;

    const income = filteredTransactions
        .filter(item => item.amount > 0)
        .reduce((acc, item) => acc + item.amount, 0);

    const expense = filteredTransactions
        .filter(item => item.amount < 0)
        .reduce((acc, item) => acc + item.amount, 0);

    moneyPlus.textContent = `+Rp${income.toLocaleString('id-ID')}`;
    moneyMinus.textContent = `Rp${expense.toLocaleString('id-ID')}`;

    transactionList.innerHTML = '';

    if (filteredTransactions.length === 0) {
        const noDataMessage = document.createElement('li');
        noDataMessage.textContent = currentFilterMonth === 'all' && transactions.length === 0
            ? 'Belum ada transaksi. Tambahkan yang pertama!'
            : 'Tidak ada transaksi untuk bulan ini.';
        noDataMessage.style.textAlign = 'center';
        noDataMessage.style.fontStyle = 'italic';
        noDataMessage.style.color = 'var(--text-secondary)'; /* Menggunakan variabel CSS */
        transactionList.appendChild(noDataMessage);
    } else {
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        filteredTransactions.forEach(transaction => {
            const sign = transaction.amount < 0 ? '-' : '+';
            const item = document.createElement('li');

            item.classList.add(transaction.amount < 0 ? 'minus' : 'plus');

            const transactionDate = new Date(transaction.date + 'T00:00:00');
            const formattedDate = transactionDate.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            item.innerHTML = `
                <div>
                    ${transaction.text} <br>
                    <small>${formattedDate}</small>
                </div>
                <span>${sign}Rp${Math.abs(transaction.amount).toLocaleString('id-ID')}</span>
                <button class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button>
            `;

            transactionList.appendChild(item);
        });
    }
    updateChart(filteredTransactions);
}

// ----------------------------------------------------
// FUNGSI UNTUK CHART.JS
// ----------------------------------------------------

function updateChart(filteredTransactions) {
    const incomeTotal = filteredTransactions
        .filter(t => t.amount > 0)
        .reduce((acc, t) => acc + t.amount, 0);

    const expenseTotal = filteredTransactions
        .filter(t => t.amount < 0)
        .reduce((acc, t) => acc + t.amount, 0);

    if (expenseChart) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(expenseChartCanvas, {
        type: 'doughnut',
        data: {
            labels: ['Total Pemasukan', 'Total Pengeluaran'],
            datasets: [{
                label: 'Jumlah',
                data: [incomeTotal, Math.abs(expenseTotal)],
                backgroundColor: [
                    'rgba(2, 82, 255, 0.8)', // Income Color
                    'rgba(248, 0, 25, 0.8)'  // Expense Color
                ],
                borderColor: [
                    'rgb(243, 245, 243)',
                    'rgb(250, 250, 250)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: 'var(--text-primary)' // Ensure legend text color changes
                    }
                },
                title: {
                    display: true,
                    text: 'Distribusi Keuangan' + (currentFilterMonth === 'all' ? ' (Semua Waktu)' : ` (${monthSelect.options[monthSelect.selectedIndex].text})`),
                    color: 'var(--text-primary)' // Ensure title text color changes
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            let label = tooltipItem.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += 'Rp' + tooltipItem.raw.toLocaleString('id-ID');
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// ----------------------------------------------------
// FUNGSI UNTUK MANIPULASI TRANSAKSI
// ----------------------------------------------------

function removeTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    saveTransactionsToLocalStorage();
    populateMonthSelect();
    updateUI();
}

function addTransaction(e) {
    e.preventDefault();

    const text = textInput.value.trim();
    const amount = +amountInput.value;
    const date = dateInput.value;

    if (text === '' || isNaN(amount) || date === '') {
        alert('Mohon masukkan deskripsi, jumlah, dan tanggal yang valid!');
        return;
    }

    const newTransaction = {
        id: generateID(),
        text,
        amount,
        date
    };

    transactions.push(newTransaction);
    saveTransactionsToLocalStorage();
    populateMonthSelect();
    
    currentFilterMonth = date.substring(0, 7);
    monthSelect.value = currentFilterMonth;
    
    updateUI();

    textInput.value = '';
    amountInput.value = '';
    dateInput.value = '';
}

function generateID() {
    return Math.floor(Math.random() * 100000000);
}

// ----------------------------------------------------
// FUNGSI UNTUK FILTER BULAN
// ----------------------------------------------------

function populateMonthSelect() {
    const monthYears = [...new Set(transactions.map(t => t.date.substring(0, 7)))];
    monthYears.sort((a, b) => new Date(b) - new Date(a));

    monthSelect.innerHTML = '<option value="all">Semua Waktu</option>';

    monthYears.forEach(monthYear => {
        const [year, month] = monthYear.split('-');
        const dateObj = new Date(year, parseInt(month) - 1);
        const monthName = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

        const option = document.createElement('option');
        option.value = monthYear;
        option.textContent = monthName;
        monthSelect.appendChild(option);
    });

    if (currentFilterMonth !== 'all') {
        monthSelect.value = currentFilterMonth;
    }
}

function setMonthFilter(monthYear) {
    currentFilterMonth = monthYear;
    updateUI();
}

// ----------------------------------------------------
// FUNGSI UNTUK DARK MODE
// ----------------------------------------------------

// Fungsi untuk menerapkan tema (dark/light) pada body
// Fung

// Event listener untuk tombol toggle tema


// ----------------------------------------------------
// EVENT LISTENERS & INISIALISASI
// ----------------------------------------------------

form.addEventListener('submit', addTransaction);
monthSelect.addEventListener('change', (e) => {
    setMonthFilter(e.target.value);
});
currentMonthBtn.addEventListener('click', () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthNum = String(today.getMonth() + 1).padStart(2, '0');
    const currentMonthFormatted = `${currentYear}-${currentMonthNum}`;
    
    setMonthFilter(currentMonthFormatted);
    monthSelect.value = currentMonthFormatted;
});


// Fungsi inisialisasi aplikasi
function init() {
    // Muat preferensi tema dari Local Storage saat aplikasi dimuat
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        applyTheme(true); // Terapkan dark mode jika tersimpan
    } else {
        applyTheme(false); // Terapkan light mode (default)
    }

    populateMonthSelect();
    updateUI(); // Ini akan memanggil updateChart()
}
