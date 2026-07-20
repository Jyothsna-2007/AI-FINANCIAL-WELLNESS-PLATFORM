const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

function calculateBudgetSummary(data) {
  const income = Number(data.income) || 0;
  const food = Number(data.food) || 0;
  const transport = Number(data.transport) || 0;
  const shopping = Number(data.shopping) || 0;
  const rent = Number(data.rent) || 0;
  const other = Number(data.other) || 0;

  const total = food + transport + shopping + rent + other;
  const remaining = income - total;
  const savingsRate = income > 0 ? (remaining / income) * 100 : 0;

  let advice = '';
  let insight = '';

  if (income <= 0) {
    advice = '⚠ Enter your monthly income to get AI-based recommendations.';
  } else if (remaining > income * 0.3) {
    advice = '✅ Excellent! Your budget is healthy and you are saving well.';
    insight = 'AI Insight: You can increase your emergency fund or invest a part of your savings.';
  } else if (remaining > 0) {
    advice = '⚠ You are spending close to your limit. Reduce non-essential spending.';
    insight = 'AI Insight: Try cutting shopping or dining costs to improve your savings rate to 20%+.';
  } else {
    advice = '❌ Your expenses exceed your income. Consider reducing discretionary spending.';
    insight = 'AI Insight: Prioritize essentials, review subscriptions, and set a strict spending cap.';
  }

  return {
    income,
    total,
    remaining,
    savingsRate,
    advice,
    insight: `${insight} Savings rate: ${savingsRate.toFixed(1)}%`.trim(),
  };
}

app.get('/', (req, res) => {
  res.send('AI Financial Wellness API is running');
});

app.post('/api/budget', (req, res) => {
  const result = calculateBudgetSummary(req.body);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
