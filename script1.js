let transactions = JSON.parse(
    localStorage.getItem("transactions")
) || [];

let budget = Number(localStorage.getItem("budget")) || 0;

let editingId = null;

let expenseChart = null;
let comparisonChart = null;

const form = document.getElementById("transactionForm");

// Set today's date
document.getElementById("today").textContent =
    new Date().toLocaleDateString();

document.getElementById("date").value =
    new Date().toISOString().split("T")[0];

// Add or update transaction
form.addEventListener("submit", function(event) {

    event.preventDefault();

    const title = document.getElementById("title").value.trim();
    const amount = Number(document.getElementById("amount").value);
    const type = document.getElementById("type").value;
    const category = document.getElementById("category").value;
    const date = document.getElementById("date").value;

    if (!title || !Number.isFinite(amount) ||
        amount <= 0 || !date) {
        alert("Enter valid transaction details.");
        return;
    }

    if (editingId !== null) {

        transactions = transactions.map(item => {
            if (item.id === editingId) {
                return {
                    ...item,
                    title,
                    amount,
                    type,
                    category,
                    date
                };
            }
            return item;
        });

        editingId = null;
        document.getElementById("submitBtn").textContent =
            "Add Transaction";

    } else {

        const transaction = {
            id: Date.now(),
            title,
            amount,
            type,
            category,
            date
        };

        transactions.push(transaction);
    }

    form.reset();

    document.getElementById("date").value =
        new Date().toISOString().split("T")[0];

    document.getElementById("cancelEdit").hidden = true;

    saveData();

});

// Save data
function saveData() {

    localStorage.setItem(
        "transactions",
        JSON.stringify(transactions)
    );

    updateDashboard();
    displayTransactions();
    updateBudget();
    updateCharts();

}

// Dashboard calculations
function updateDashboard() {

    let income = 0;
    let expense = 0;

    transactions.forEach(item => {

        if (item.type === "income") {
            income += item.amount;
        } else {
            expense += item.amount;
        }

    });

    document.getElementById("income").textContent =
        "₹" + income.toFixed(2);

    document.getElementById("expense").textContent =
        "₹" + expense.toFixed(2);

    document.getElementById("balance").textContent =
        "₹" + (income - expense).toFixed(2);

}

// Display transactions
function displayTransactions() {

    const list = document.getElementById("transactionList");

    const search = document.getElementById("search")
        .value.toLowerCase();

    const filter = document.getElementById("filter").value;

    list.innerHTML = "";

    const filtered = transactions.filter(item => {

        const matchesSearch =
            item.title.toLowerCase().includes(search) ||
            item.category.toLowerCase().includes(search);

        const matchesType =
            filter === "all" || item.type === filter;

        return matchesSearch && matchesType;

    }).sort((a, b) => b.id - a.id);

    if (filtered.length === 0) {
        list.innerHTML =
            '<p class="empty">No transactions found.</p>';
        return;
    }

    filtered.forEach(item => {

        const div = document.createElement("div");
        div.className = "transaction-item";

        const details = document.createElement("div");

        const heading = document.createElement("h3");
        heading.textContent = item.title;

        const small = document.createElement("small");
        small.textContent = item.category + " | " + item.date;

        details.append(heading, small);

        const amount = document.createElement("strong");

        amount.textContent =
            (item.type === "income" ? "+ ₹" : "- ₹") +
            item.amount.toFixed(2);

        amount.className =
            item.type === "income" ? "income-text" : "expense-text";

        const actions = document.createElement("div");
        actions.className = "actions";

        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.className = "edit";
        editBtn.addEventListener("click", () => editTransaction(item.id));

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "delete";
        deleteBtn.addEventListener("click", () => deleteTransaction(item.id));

        actions.append(editBtn, deleteBtn);

        div.append(details, amount, actions);

        list.appendChild(div);

    });

}

// Edit transaction
function editTransaction(id) {

    const item = transactions.find(t => t.id === id);

    if (!item) return;

    document.getElementById("title").value = item.title;
    document.getElementById("amount").value = item.amount;
    document.getElementById("type").value = item.type;
    document.getElementById("category").value = item.category;
    document.getElementById("date").value = item.date;

    editingId = id;

    document.getElementById("submitBtn").textContent =
        "Update Transaction";

    document.getElementById("cancelEdit").hidden = false;

    document.getElementById("title").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}

// Cancel editing
document.getElementById("cancelEdit").addEventListener("click", function() {

    editingId = null;
    form.reset();

    document.getElementById("date").value =
        new Date().toISOString().split("T")[0];

    document.getElementById("submitBtn").textContent =
        "Add Transaction";

    this.hidden = true;

});

// Delete transaction
function deleteTransaction(id) {

    if (!confirm("Delete this transaction?")) return;

    transactions = transactions.filter(item => item.id !== id);

    saveData();

}

// Search and filter
document.getElementById("search").addEventListener(
    "input", displayTransactions
);

document.getElementById("filter").addEventListener(
    "change", displayTransactions
);

// Save monthly budget
document.getElementById("saveBudget").addEventListener("click", function() {

    const value = document.getElementById("budgetInput").value;

    if (value.trim() === "" || !Number.isFinite(Number(value)) ||
        Number(value) <= 0) {
        alert("Enter a valid budget.");
        return;
    }

    budget = Number(value);

    localStorage.setItem("budget", budget);

    updateBudget();

});

// Budget calculations for current month
function updateBudget() {

    const currentMonth = new Date().toISOString().slice(0, 7);

    const monthlyExpense = transactions
        .filter(item =>
            item.type === "expense" &&
            item.date.startsWith(currentMonth)
        )
        .reduce((total, item) => total + item.amount, 0);

    document.getElementById("budgetInput").value =
        budget || "";

    if (budget === 0) {
        document.getElementById("budgetText").textContent =
            "No budget set";

        document.getElementById("progressBar").style.width = "0%";
        document.getElementById("budgetMessage").textContent = "";
        return;
    }

    const percentage = monthlyExpense / budget * 100;

    document.getElementById("budgetText").textContent =
        "Spent ₹" + monthlyExpense.toFixed(2) +
        " of ₹" + budget.toFixed(2);

    document.getElementById("progressBar").style.width =
        Math.min(percentage, 100) + "%";

    document.getElementById("progressBar").style.background =
        percentage >= 100 ? "#dc2626" :
        percentage >= 80 ? "#f59e0b" : "#16a34a";

    document.getElementById("budgetMessage").textContent =
        percentage >= 100 ? "Budget exceeded!" :
        percentage >= 80 ? "Warning: You are close to your budget." :
        "You are within your budget.";

}

// Expense charts
function updateCharts() {

    const categories = {};

    transactions.forEach(item => {

        if (item.type === "expense") {
            categories[item.category] =
                (categories[item.category] || 0) + item.amount;
        }

    });

    if (expenseChart) expenseChart.destroy();
    if (comparisonChart) comparisonChart.destroy();

    expenseChart = new Chart(
        document.getElementById("expenseChart"),
        {
            type: "doughnut",
            data: {
                labels: Object.keys(categories),
                datasets: [{
                    data: Object.values(categories),
                    backgroundColor: [
                        "#4f46e5",
                        "#16a34a",
                        "#f59e0b",
                        "#dc2626",
                        "#0ea5e9",
                        "#9333ea",
                        "#64748b"
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true
            }
        }
    );

    const income = transactions
        .filter(item => item.type === "income")
        .reduce((sum, item) => sum + item.amount, 0);

    const expense = transactions
        .filter(item => item.type === "expense")
        .reduce((sum, item) => sum + item.amount, 0);

    comparisonChart = new Chart(
        document.getElementById("comparisonChart"),
        {
            type: "bar",
            data: {
                labels: ["Income", "Expenses"],
                datasets: [{
                    label: "Amount (₹)",
                    data: [income, expense],
                    backgroundColor: ["#16a34a", "#dc2626"]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        }
    );

}

// Dark mode
document.getElementById("themeBtn").addEventListener("click", function() {

    document.body.classList.toggle("dark");

    localStorage.setItem(
        "darkMode",
        document.body.classList.contains("dark")
    );

});

if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
}

// Initial display
updateDashboard();
displayTransactions();
updateBudget();
updateCharts();