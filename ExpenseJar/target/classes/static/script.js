/* =========================================================
   EXPENSEJAR FRONTEND
   ========================================================= */

const API = "/api";

let currentUserId = null;

let users = [];
let categories = [];
let expenses = [];
let budgets = [];

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    setDefaultDates();

    populateTrendSelectors();

    await loadAllData();

});


/* =========================================================
   DEFAULT VALUES
   ========================================================= */

function setDefaultDates() {

    const today =
        new Date().toISOString().split("T")[0];

    const expenseDate =
        document.getElementById("expenseDate");

    if (expenseDate) {
        expenseDate.value = today;
    }

    const budgetMonth =
        document.getElementById("budgetMonth");

    if (budgetMonth) {

        budgetMonth.value =
            `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

    }

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function showSection(sectionId, button) {

    document
        .querySelectorAll(".page-section")
        .forEach(section => {

            section.classList.remove("active");

        });

    const section =
        document.getElementById(sectionId);

    if (section) {
        section.classList.add("active");
    }


    document
        .querySelectorAll(".nav-item")
        .forEach(item => {

            item.classList.remove("active");

        });

    if (button) {
        button.classList.add("active");
    }


    const titles = {

        dashboard: "Dashboard",

        expenses: "Expenses",

        budgets: "Budgets",

        categories: "Categories",

        users: "Users"

    };

    document.getElementById("pageTitle").textContent =
        titles[sectionId] || "ExpenseJar";

}


function showSectionById(sectionId) {

    const button =
        document.querySelector(
            `.nav-item[onclick*="'${sectionId}'"]`
        );

    showSection(sectionId, button);

}


function openExpenseSection() {

    showSectionById("expenses");

    setTimeout(() => {

        const form =
            document.getElementById("expenseFormCard");

        form.classList.remove("hidden");

    }, 100);

}


function toggleForm(formId) {

    const form =
        document.getElementById(formId);

    if (!form) return;

    form.classList.toggle("hidden");

}


/* =========================================================
   API HELPER
   ========================================================= */

async function apiRequest(
    endpoint,
    options = {}
) {

    try {

        const response =
            await fetch(API + endpoint, {

                headers: {

                    "Content-Type":
                        "application/json",

                    ...(options.headers || {})

                },

                ...options

            });


        const text =
            await response.text();


        let data = null;

        try {

            data = text
                ? JSON.parse(text)
                : null;

        } catch {

            data = text;

        }


        if (!response.ok) {

            let message =
                "Something went wrong.";

            if (data?.message) {

                message = data.message;

            } else if (data?.messages) {

                message =
                    Object.values(data.messages)
                        .join(", ");

            } else if (typeof data === "string") {

                message = data;

            }

            throw new Error(message);

        }


        return data;

    } catch (error) {

        console.error(error);

        throw error;

    }

}


/* =========================================================
   LOAD ALL DATA
   ========================================================= */

async function loadAllData() {

    try {

        await Promise.all([

            loadUsers(),

            loadCategories()

        ]);

        await loadUserDependentData();

        updateProfile();

    } catch (error) {

        console.error(
            "Initial loading failed:",
            error
        );

        showToast(
            "Error",
            "Unable to load backend data.",
            true
        );

    }

}


async function loadUserDependentData() {

    if (!currentUserId) {

        expenses = [];
        budgets = [];

        renderExpenses();
        renderBudgets();

        updateDashboard();

        return;

    }


    try {

        await Promise.all([

            loadExpenses(),

            loadBudgets()

        ]);

        updateDashboard();

        loadTrend();

    } catch (error) {

        console.error(error);

    }

}


/* =========================================================
   USERS
   ========================================================= */

async function loadUsers() {

    try {

        users =
            await apiRequest("/users");

        renderUsers();

        if (users.length > 0) {

            currentUserId =
                users[0].id;

        }

    } catch (error) {

        users = [];

        renderUsers();

    }

}


function renderUsers() {

    const table =
        document.getElementById("usersTable");

    if (!table) return;


    if (!users.length) {

        table.innerHTML = `

            <tr>
                <td colspan="4"
                    class="empty-state">

                    No users found.
                    Create your first user.

                </td>
            </tr>

        `;

        return;

    }


    table.innerHTML =
        users.map(user => `

            <tr>

                <td>
                    <strong>#${user.id}</strong>
                </td>

                <td>
                    ${escapeHtml(user.name)}
                </td>

                <td>
                    ${escapeHtml(user.email)}
                </td>

                <td>

                    <button
                        class="delete-btn"
                        onclick="deleteUser(${user.id})">

                        Delete

                    </button>

                </td>

            </tr>

        `).join("");

}


async function createUser(event) {

    event.preventDefault();


    const request = {

        name:
            document
                .getElementById("userName")
                .value
                .trim(),

        email:
            document
                .getElementById("userEmail")
                .value
                .trim()

    };


    try {

        const user =
            await apiRequest(
                "/users",
                {

                    method: "POST",

                    body:
                        JSON.stringify(request)

                }
            );


        showToast(
            "Success",
            "User created successfully."
        );


        event.target.reset();

        toggleForm("userFormCard");

        await loadUsers();

        if (!currentUserId) {

            currentUserId =
                user.id;

        }

        await loadUserDependentData();

        updateProfile();

    } catch (error) {

        showToast(
            "Error",
            error.message,
            true
        );

    }

}


async function deleteUser(id) {

    if (!confirm(
        "Delete this user?"
    )) return;


    try {

        await apiRequest(
            `/users/${id}`,
            {
                method: "DELETE"
            }
        );


        showToast(
            "Success",
            "User deleted."
        );


        await loadUsers();

        if (currentUserId === id) {

            currentUserId =
                users.length
                    ? users[0].id
                    : null;

        }

        await loadUserDependentData();

        updateProfile();

    } catch (error) {

        showToast(
            "Error",
            error.message,
            true
        );

    }

}


/* =========================================================
   PROFILE
   ========================================================= */

function updateProfile() {

    const user =
        users.find(
            item => item.id === currentUserId
        );


    const name =
        document.getElementById(
            "currentUserName"
        );

    const email =
        document.getElementById(
            "currentUserEmail"
        );


    if (user) {

        name.textContent =
            user.name;

        email.textContent =
            user.email;

    } else {

        name.textContent =
            "Expense User";

        email.textContent =
            "No user selected";

    }

}


/* =========================================================
   CATEGORIES
   ========================================================= */

async function loadCategories() {

    try {

        categories =
            await apiRequest("/categories");

        populateCategorySelects();

        renderCategoryCards();

    } catch (error) {

        categories = [];

        populateCategorySelects();

        renderCategoryCards();

    }

}


function populateCategorySelects() {

    const expenseSelect =
        document.getElementById(
            "expenseCategory"
        );

    const budgetSelect =
        document.getElementById(
            "budgetCategory"
        );


    const options = categories.map(category => `

        <option value="${category.id}">
            ${escapeHtml(category.name)}
        </option>

    `).join("");


    if (expenseSelect) {

        expenseSelect.innerHTML =
            `<option value="">Select category</option>`
            + options;

    }


    if (budgetSelect) {

        budgetSelect.innerHTML =
            `<option value="">Select category</option>`
            + options;

    }

}


function renderCategoryCards() {

    const container =
        document.getElementById(
            "categoryCards"
        );

    if (!container) return;


    if (!categories.length) {

        container.innerHTML = `

            <div class="empty-state">

                No categories yet.
                Create one to organize your expenses.

            </div>

        `;

        return;

    }


    container.innerHTML =
        categories.map((category, index) => `

            <div class="category-card">

                <button
                    class="delete-btn"
                    onclick="deleteCategory(${category.id})">

                    Delete

                </button>

                <div class="category-card-icon">
                    ${getCategoryIcon(index)}
                </div>

                <h3>
                    ${escapeHtml(category.name)}
                </h3>

                <p>
                    Expense category #${category.id}
                </p>

            </div>

        `).join("");

}


function getCategoryIcon(index) {

    const icons = [
        "🍴",
        "🚗",
        "📚",
        "🎬",
        "🛍",
        "🏠",
        "💊",
        "✈"
    ];

    return icons[index % icons.length];

}


async function createCategory(event) {

    event.preventDefault();


    const request = {

        name:
            document
                .getElementById("categoryName")
                .value
                .trim()

    };


    try {

        await apiRequest(
            "/categories",
            {

                method: "POST",

                body:
                    JSON.stringify(request)

            }
        );


        showToast(
            "Success",
            "Category created."
        );


        event.target.reset();

        toggleForm("categoryFormCard");

        await loadCategories();

    } catch (error) {

        showToast(
            "Error",
            error.message,
            true
        );

    }

}


async function deleteCategory(id) {

    if (!confirm(
        "Delete this category?"
    )) return;


    try {

        await apiRequest(
            `/categories/${id}`,
            {
                method: "DELETE"
            }
        );


        showToast(
            "Success",
            "Category deleted."
        );


        await loadCategories();

    } catch (error) {

        showToast(
            "Error",
            error.message,
            true
        );

    }

}


/* =========================================================
   EXPENSES
   ========================================================= */

async function loadExpenses() {

    if (!currentUserId) {

        expenses = [];

        renderExpenses();

        return;

    }


    try {

        expenses =
            await apiRequest(
                `/expenses/user/${currentUserId}`
            );

        renderExpenses();

    } catch (error) {

        expenses = [];

        renderExpenses();

    }

}


function renderExpenses() {

    const table =
        document.getElementById(
            "expensesTable"
        );

    const recentTable =
        document.getElementById(
            "recentExpensesTable"
        );


    if (!table) return;


    if (!expenses.length) {

        table.innerHTML = `

            <tr>

                <td colspan="6"
                    class="empty-state">

                    No expenses found.

                </td>

            </tr>

        `;

        if (recentTable) {

            recentTable.innerHTML = `

                <tr>

                    <td colspan="4"
                        class="empty-state">

                        No expenses yet.

                    </td>

                </tr>

            `;

        }

        return;

    }


    const sorted =
        [...expenses].sort(
            (a, b) =>
                new Date(b.expenseDate)
                -
                new Date(a.expenseDate)
        );


    table.innerHTML =
        sorted.map(expense => `

            <tr>

                <td>
                    #${expense.id}
                </td>

                <td>
                    ${escapeHtml(
            expense.description
            || "No description"
        )}
                </td>

                <td>

                    <span class="category-pill">

                        ${escapeHtml(
            expense.category?.name
            || "Unknown"
        )}

                    </span>

                </td>

                <td>
                    ${formatDate(
            expense.expenseDate
        )}
                </td>

                <td class="amount">
                    ${formatCurrency(
            expense.amount
        )}
                </td>

                <td>

                    <button
                        class="delete-btn"
                        onclick="deleteExpense(${expense.id})">

                        Delete

                    </button>

                </td>

            </tr>

        `).join("");


    if (recentTable) {

        recentTable.innerHTML =
            sorted
                .slice(0, 5)
                .map(expense => `

                    <tr>

                        <td>
                            ${escapeHtml(
                    expense.description
                    || "Expense"
                )}
                        </td>

                        <td>

                            <span class="category-pill">

                                ${escapeHtml(
                    expense.category?.name
                    || "Unknown"
                )}

                            </span>

                        </td>

                        <td>
                            ${formatDate(
                    expense.expenseDate
                )}
                        </td>

                        <td class="amount">
                            ${formatCurrency(
                    expense.amount
                )}
                        </td>

                    </tr>

                `).join("");

    }

}


async function createExpense(event) {

    event.preventDefault();


    if (!currentUserId) {

        showToast(
            "Error",
            "Create a user first.",
            true
        );

        return;

    }


    const request = {

        amount:
            Number(
                document
                    .getElementById(
                        "expenseAmount"
                    )
                    .value
            ),

        expenseDate:
        document
            .getElementById(
                "expenseDate"
            )
            .value,

        description:
            document
                .getElementById(
                    "expenseDescription"
                )
                .value
                .trim(),

        userId:
        currentUserId,

        categoryId:
            Number(
                document
                    .getElementById(
                        "expenseCategory"
                    )
                    .value
            )

    };


    try {

        const response =
            await apiRequest(
                "/expenses",
                {

                    method: "POST",

                    body:
                        JSON.stringify(request)

                }
            );


        showToast(
            "Expense Added",
            response?.budgetAlert
            || "Expense added successfully."
        );


        event.target.reset();

        setDefaultDates();

        toggleForm("expenseFormCard");

        await loadExpenses();

        updateDashboard();

        loadTrend();

    } catch (error) {

        showToast(
            "Error",
            error.message,
            true
        );

    }

}


async function deleteExpense(id) {

    if (!confirm(
        "Delete this expense?"
    )) return;


    try {

        await apiRequest(
            `/expenses/${id}`,
            {
                method: "DELETE"
            }
        );


        showToast(
            "Success",
            "Expense deleted."
        );


        await loadExpenses();

        updateDashboard();

        loadTrend();

    } catch (error) {

        showToast(
            "Error",
            error.message,
            true
        );

    }

}


function filterExpenses() {

    const search =
        document
            .getElementById(
                "expenseSearch"
            )
            .value
            .toLowerCase();


    const rows =
        document.querySelectorAll(
            "#expensesTable tr"
        );


    rows.forEach(row => {

        const text =
            row.textContent
                .toLowerCase();

        row.style.display =
            text.includes(search)
                ? ""
                : "none";

    });

}


/* =========================================================
   BUDGETS
   ========================================================= */

async function loadBudgets() {

    if (!currentUserId) {

        budgets = [];

        renderBudgets();

        return;

    }


    try {

        budgets =
            await apiRequest(
                `/budgets/user/${currentUserId}`
            );

        renderBudgets();

    } catch (error) {

        budgets = [];

        renderBudgets();

    }

}


function renderBudgets() {

    const table =
        document.getElementById(
            "budgetsTable"
        );

    if (!table) return;


    if (!budgets.length) {

        table.innerHTML = `

            <tr>

                <td colspan="6"
                    class="empty-state">

                    No budgets created yet.

                </td>

            </tr>

        `;

        return;

    }


    table.innerHTML =
        budgets.map(budget => {

            const spent =
                getCategoryMonthSpending(
                    budget.category?.id,
                    budget.budgetMonth
                );


            const percentage =
                Number(budget.amount) > 0
                    ? (
                    spent /
                    Number(budget.amount)
                ) * 100
                    : 0;


            let status =
                "Safe";

            let statusClass =
                "status-safe";


            if (percentage >= 100) {

                status = "Exceeded";

                statusClass =
                    "status-danger";

            } else if (percentage >= 90) {

                status = "90% Alert";

                statusClass =
                    "status-warning";

            }


            return `

                <tr>

                    <td>
                        #${budget.id}
                    </td>

                    <td>

                        <span class="category-pill">

                            ${escapeHtml(
                budget.category?.name
                || "Unknown"
            )}

                        </span>

                    </td>

                    <td>
                        ${formatMonth(
                budget.budgetMonth
            )}
                    </td>

                    <td class="amount">
                        ${formatCurrency(
                budget.amount
            )}
                    </td>

                    <td>

                        <span class="status-pill ${statusClass}">

                            ${status}

                        </span>

                    </td>

                    <td>

                        <button
                            class="delete-btn"
                            onclick="deleteBudget(${budget.id})">

                            Delete

                        </button>

                    </td>

                </tr>

            `;

        }).join("");

}


function getCategoryMonthSpending(
    categoryId,
    budgetMonth
) {

    if (!categoryId) return 0;


    const month =
        String(budgetMonth)
            .substring(0, 7);


    return expenses
        .filter(expense => {

            return expense.category?.id === categoryId
                &&
                String(
                    expense.expenseDate
                ).startsWith(month);

        })
        .reduce(
            (sum, expense) =>
                sum + Number(expense.amount),
            0
        );

}


async function createBudget(event) {

    event.preventDefault();


    if (!currentUserId) {

        showToast(
            "Error",
            "Create a user first.",
            true
        );

        return;

    }


    const month =
        document
            .getElementById(
                "budgetMonth"
            )
            .value;


    const request = {

        amount:
            Number(
                document
                    .getElementById(
                        "budgetAmount"
                    )
                    .value
            ),

        budgetMonth:
            `${month}-01`,

        userId:
        currentUserId,

        categoryId:
            Number(
                document
                    .getElementById(
                        "budgetCategory"
                    )
                    .value
            )

    };


    try {

        await apiRequest(
            "/budgets",
            {

                method: "POST",

                body:
                    JSON.stringify(request)

            }
        );


        showToast(
            "Success",
            "Monthly budget created."
        );


        event.target.reset();

        setDefaultDates();

        toggleForm("budgetFormCard");

        await loadBudgets();

        updateDashboard();

    } catch (error) {

        showToast(
            "Error",
            error.message,
            true
        );

    }

}


async function deleteBudget(id) {

    if (!confirm(
        "Delete this budget?"
    )) return;


    try {

        await apiRequest(
            `/budgets/${id}`,
            {
                method: "DELETE"
            }
        );


        showToast(
            "Success",
            "Budget deleted."
        );


        await loadBudgets();

        updateDashboard();

    } catch (error) {

        showToast(
            "Error",
            error.message,
            true
        );

    }

}


/* =========================================================
   DASHBOARD
   ========================================================= */

function updateDashboard() {

    const totalSpending =
        expenses.reduce(
            (sum, expense) =>
                sum + Number(expense.amount),
            0
        );


    const totalBudget =
        budgets.reduce(
            (sum, budget) =>
                sum + Number(budget.amount),
            0
        );


    const remaining =
        totalBudget - totalSpending;


    const alertCount =
        budgets.filter(budget => {

            const spent =
                getCategoryMonthSpending(
                    budget.category?.id,
                    budget.budgetMonth
                );

            return (
                spent >=
                Number(budget.amount) * 0.9
            );

        }).length;


    document.getElementById(
        "totalSpending"
    ).textContent =
        formatCurrency(totalSpending);


    document.getElementById(
        "totalBudget"
    ).textContent =
        formatCurrency(totalBudget);


    document.getElementById(
        "remainingBudget"
    ).textContent =
        formatCurrency(remaining);


    document.getElementById(
        "alertCount"
    ).textContent =
        alertCount;


    renderCategorySummary();

    renderBudgets();

}


function renderCategorySummary() {

    const container =
        document.getElementById(
            "categorySummary"
        );

    if (!container) return;


    if (!expenses.length) {

        container.innerHTML = `

            <div class="empty-state">

                No category spending yet.

            </div>

        `;

        return;

    }


    const totals = {};


    expenses.forEach(expense => {

        const category =
            expense.category?.name
            || "Other";


        totals[category] =
            (totals[category] || 0)
            + Number(expense.amount);

    });


    const entries =
        Object.entries(totals);


    const max =
        Math.max(
            ...entries.map(
                item => item[1]
            )
        );


    container.innerHTML =
        entries.map(([name, amount]) => {

            const percentage =
                max > 0
                    ? (amount / max) * 100
                    : 0;


            return `

                <div class="category-row">

                    <div class="category-info">

                        <strong>
                            ${escapeHtml(name)}
                        </strong>

                        <span>
                            ${formatCurrency(amount)}
                        </span>

                    </div>

                    <div class="progress-track">

                        <div
                            class="progress-fill"
                            style="width:${percentage}%">
                        </div>

                    </div>

                </div>

            `;

        }).join("");

}


/* =========================================================
   TREND
   ========================================================= */

function populateTrendSelectors() {

    const yearSelect =
        document.getElementById(
            "trendYear"
        );

    const monthSelect =
        document.getElementById(
            "trendMonth"
        );


    if (!yearSelect ||
        !monthSelect) return;


    yearSelect.innerHTML = "";

    for (
        let year = currentYear - 2;
        year <= currentYear + 1;
        year++
    ) {

        yearSelect.innerHTML += `

            <option value="${year}"
                ${year === currentYear
            ? "selected"
            : ""}>

                ${year}

            </option>

        `;

    }


    monthSelect.innerHTML = "";


    const months = [

        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"

    ];


    months.forEach(
        (month, index) => {

            const monthNumber =
                index + 1;


            monthSelect.innerHTML += `

                <option
                    value="${monthNumber}"
                    ${monthNumber === currentMonth
                ? "selected"
                : ""}>

                    ${month}

                </option>

            `;

        }
    );

}


async function loadTrend() {

    if (!currentUserId) {

        renderEmptyTrend();

        return;

    }


    const year =
        Number(
            document
                .getElementById(
                    "trendYear"
                )
                .value
        );


    const month =
        Number(
            document
                .getElementById(
                    "trendMonth"
                )
                .value
        );


    try {

        const trend =
            await apiRequest(
                `/expenses/trend?userId=${currentUserId}&year=${year}&month=${month}`
            );


        renderTrend(trend);

    } catch (error) {

        renderEmptyTrend();

    }

}


function renderTrend(trend) {

    const container =
        document.getElementById(
            "trendChart"
        );


    if (!container) return;


    const entries =
        Object.entries(trend || {});


    if (!entries.length) {

        renderEmptyTrend();

        return;

    }


    const max =
        Math.max(
            ...entries.map(
                item => Number(item[1])
            ),
            1
        );


    container.innerHTML =
        entries.map(([month, amount]) => {

            const height =
                Math.max(
                    5,
                    (Number(amount) / max)
                    * 130
                );


            return `

                <div class="chart-bar-container">

                    <div class="chart-value">

                        ${formatCurrency(amount)}

                    </div>

                    <div
                        class="chart-bar"
                        style="height:${height}px">
                    </div>

                    <div class="chart-label">

                        ${month}

                    </div>

                </div>

            `;

        }).join("");

}


function renderEmptyTrend() {

    const container =
        document.getElementById(
            "trendChart"
        );


    if (!container) return;


    container.innerHTML = `

        <div class="empty-state">

            No trend data available.

        </div>

    `;

}


/* =========================================================
   REFRESH
   ========================================================= */

async function refreshDashboard() {

    showToast(
        "Refreshing",
        "Loading latest data..."
    );


    await loadAllData();


    showToast(
        "Updated",
        "Dashboard refreshed successfully."
    );

}


/* =========================================================
   FORMS
   ========================================================= */

document
    .getElementById("userForm")
    ?.addEventListener(
        "submit",
        createUser
    );


document
    .getElementById("categoryForm")
    ?.addEventListener(
        "submit",
        createCategory
    );


document
    .getElementById("expenseForm")
    ?.addEventListener(
        "submit",
        createExpense
    );


document
    .getElementById("budgetForm")
    ?.addEventListener(
        "submit",
        createBudget
    );


/* =========================================================
   HELPERS
   ========================================================= */

function formatCurrency(value) {

    const number =
        Number(value) || 0;


    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }
    ).format(number);

}


function formatDate(value) {

    if (!value) return "-";


    const date =
        new Date(value);


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


function formatMonth(value) {

    if (!value) return "-";


    const date =
        new Date(value);


    return date.toLocaleDateString(
        "en-IN",
        {
            month: "long",
            year: "numeric"
        }
    );

}


function escapeHtml(value) {

    if (value === null ||
        value === undefined) {

        return "";

    }


    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function showToast(
    title,
    message,
    isError = false
) {

    const toast =
        document.getElementById(
            "toast"
        );


    const icon =
        document.getElementById(
            "toastIcon"
        );


    document.getElementById(
        "toastTitle"
    ).textContent =
        title;


    document.getElementById(
        "toastMessage"
    ).textContent =
        message;


    icon.textContent =
        isError ? "!" : "✓";


    if (isError) {

        icon.style.background =
            "var(--red-light)";

        icon.style.color =
            "var(--red)";

    } else {

        icon.style.background =
            "var(--green-light)";

        icon.style.color =
            "var(--green)";

    }


    toast.classList.add("show");


    clearTimeout(
        window.toastTimeout
    );


    window.toastTimeout =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 3500);

}