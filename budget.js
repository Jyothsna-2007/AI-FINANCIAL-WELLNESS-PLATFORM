async function calculateBudget() {
  const payload = {
    income: Number(document.getElementById("income").value) || 0,
    food: Number(document.getElementById("food").value) || 0,
    transport: Number(document.getElementById("transport").value) || 0,
    shopping: Number(document.getElementById("shopping").value) || 0,
    rent: Number(document.getElementById("rent").value) || 0,
    other: Number(document.getElementById("other").value) || 0,
  };

  try {
    const response = await fetch("http://localhost:3000/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    document.getElementById("totalExpense").innerHTML = "Total Expenses: ₹" + result.total;
    document.getElementById("remaining").innerHTML = "Remaining Balance: ₹" + result.remaining;
    document.getElementById("advice").innerHTML = result.advice;
    document.getElementById("insight").innerHTML = result.insight;
  } catch (error) {
    document.getElementById("advice").innerHTML = "⚠ Backend not connected. Start the server using: npm start";
    document.getElementById("insight").innerHTML = error.message;
  }
}
