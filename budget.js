function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("financialUser"));
  } catch (error) {
    return null;
  }
}

function saveHistory(record) {
  const history = JSON.parse(localStorage.getItem("budgetHistory") || "[]");
  history.unshift(record);
  const trimmed = history.slice(0, 6);
  localStorage.setItem("budgetHistory", JSON.stringify(trimmed));
  renderHistory(trimmed);
}

function fillFormFromEntry(entry) {
  document.getElementById("income").value = entry.income || 0;
  document.getElementById("food").value = entry.food || 0;
  document.getElementById("transport").value = entry.transport || 0;
  document.getElementById("shopping").value = entry.shopping || 0;
  document.getElementById("rent").value = entry.rent || 0;
  document.getElementById("other").value = entry.other || 0;
}

function clearForm() {
  ["income", "food", "transport", "shopping", "rent", "other"].forEach((id) => {
    document.getElementById(id).value = "";
  });
}

function renderHistory(history) {
  const list = document.getElementById("historyList");
  if (!list) return;

  if (!history.length) {
    list.innerHTML = "<li>No saved budget history yet.</li>";
    return;
  }

  list.innerHTML = history
    .map((entry) => {
      const savedAt = entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "Just now";
      return `<li><strong>${entry.name || "Budget"}</strong> • ${savedAt}<br/>Income: ₹${entry.income} • Remaining: ₹${entry.remaining}<br/><button type="button" data-reuse-entry='${JSON.stringify(entry).replace(/'/g, "&apos;")}'>Use this budget again</button></li>`;
    })
    .join("");

  document.querySelectorAll("[data-reuse-entry]").forEach((button) => {
    button.addEventListener("click", () => {
      const entry = JSON.parse(button.getAttribute("data-reuse-entry"));
      fillFormFromEntry(entry);
      calculateBudget();
    });
  });
}

async function loadSavedHistory() {
  const user = getStoredUser();
  if (!user?.email) {
    renderHistory(JSON.parse(localStorage.getItem("budgetHistory") || "[]"));
    return;
  }

  try {
    const response = await fetch(`/api/budgets/${encodeURIComponent(user.email)}`);
    if (!response.ok) {
      throw new Error("Unable to load saved history");
    }

    const history = await response.json();
    renderHistory(history);
  } catch (error) {
    renderHistory(JSON.parse(localStorage.getItem("budgetHistory") || "[]"));
  }
}

function renderBudgetResult(result) {
  document.getElementById("totalExpense").innerHTML = "Total Expenses: ₹" + result.total;
  document.getElementById("remaining").innerHTML = "Remaining Balance: ₹" + result.remaining;
  document.getElementById("advice").innerHTML = result.advice;
  document.getElementById("insight").innerHTML = result.insight;
}

async function calculateBudget() {
  const payload = {
    income: Number(document.getElementById("income").value) || 0,
    food: Number(document.getElementById("food").value) || 0,
    transport: Number(document.getElementById("transport").value) || 0,
    shopping: Number(document.getElementById("shopping").value) || 0,
    rent: Number(document.getElementById("rent").value) || 0,
    other: Number(document.getElementById("other").value) || 0,
  };

  const localResult = typeof window.calculateBudgetSummary === "function"
    ? window.calculateBudgetSummary(payload)
    : null;

  if (localResult) {
    renderBudgetResult(localResult);
  }

  const user = getStoredUser();
  const userBadge = document.getElementById("userBadge");
  if (userBadge) {
    userBadge.textContent = user ? `Signed in: ${user.name}` : "Guest mode";
  }

  try {
    const response = await fetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user ? { ...payload, email: user.email } : payload),
    });

    if (!response.ok) {
      throw new Error("Server responded with an error");
    }

    const result = await response.json();
    renderBudgetResult(result);
    saveHistory({ ...result, ...payload, name: user ? user.name : "Guest", createdAt: new Date().toISOString() });
  } catch (error) {
    if (localResult) {
      saveHistory({ ...localResult, ...payload, name: user ? user.name : "Guest", createdAt: new Date().toISOString() });
      document.getElementById("advice").innerHTML = "⚠ Budget calculated locally. Start the server to sync data to the account.";
    } else {
      document.getElementById("advice").innerHTML = "⚠ Backend not connected. Start the server using: npm start";
      document.getElementById("insight").innerHTML = error.message;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadSavedHistory();

  const button = document.getElementById("calculateBudgetButton");
  if (button) {
    button.addEventListener("click", calculateBudget);
  }

  const clearButton = document.getElementById("clearFormButton");
  if (clearButton) {
    clearButton.addEventListener("click", clearForm);
  }
});
