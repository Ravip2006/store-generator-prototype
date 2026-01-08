const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- Simple prototype data (replace with DB later)
const stores = {
  "green-mart": { name: "Green Mart", phone: "919999999999", themeColor: "#0A7C2F" },
  "sydney-spice": { name: "Sydney Spice", phone: "61400111222", themeColor: "#1E3A8A" }
};

const products = {
  "green-mart": [
    { id: 1, name: "Basmati Rice 5kg", price: 32.0 },
    { id: 2, name: "Toor Dal 2kg", price: 18.5 }
  ],
  "sydney-spice": [
    { id: 1, name: "Garam Masala 200g", price: 6.5 },
    { id: 2, name: "Aashirvaad Atta 10kg", price: 24.0 }
  ]
};

// --- Tenant resolver: reads x-tenant-id header
app.use((req, res, next) => {
  req.tenant = req.headers['x-tenant-id'];
  next();
});

// Health check
app.get('/', (req, res) => res.send('API is running'));

// Get store info
app.get('/store', (req, res) => {
  const store = stores[req.tenant];
  if (!store) return res.status(404).json({ error: 'Store not found' });
  res.json(store);
});

// Get products
app.get('/products', (req, res) => {
  res.json(products[req.tenant] || []);
});

const PORT = 3001;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
