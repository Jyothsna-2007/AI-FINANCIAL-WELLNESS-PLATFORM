const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { calculateBudgetSummary } = require('./budgetLogic');

const app = express();
const PORT = process.env.PORT || 3000;
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');
const budgetsFile = path.join(dataDir, 'budgets.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function loadJson(file, fallback) {
  if (!fs.existsSync(file)) {
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    return fallback;
  }
}

function saveJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

let users = loadJson(usersFile, []);
let budgets = loadJson(budgetsFile, []);

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/budget.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'budget.html'));
});

app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, email, and password.' });
  }

  const existing = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ message: 'An account with that email already exists.' });
  }

  const user = {
    id: Date.now().toString(),
    name,
    email,
    password,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  saveJson(usersFile, users);
  res.json({ message: 'Account created', user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password.' });
  }

  const user = users.find((entry) => entry.email.toLowerCase() === email.toLowerCase() && entry.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  res.json({ message: 'Login successful', user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/budget', (req, res) => {
  const result = calculateBudgetSummary(req.body);
  const { email, ...payload } = req.body;

  if (email) {
    const user = users.find((entry) => entry.email.toLowerCase() === email.toLowerCase());
    if (user) {
      budgets.push({
        id: Date.now().toString(),
        name: user.name,
        email: user.email,
        createdAt: new Date().toISOString(),
        ...payload,
        ...result
      });
      saveJson(budgetsFile, budgets);
    }
  }

  res.json(result);
});

app.get('/api/budgets/:email', (req, res) => {
  const email = req.params.email.toLowerCase();
  const userBudgets = budgets.filter((entry) => entry.email.toLowerCase() === email);
  res.json(userBudgets.slice(-6).reverse());
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
