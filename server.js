const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  const key = req.headers['x-api-key'];
  if (key !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

app.post('/shopify', async (req, res) => {
  const { action, payload } = req.body;
  try {
    if (action === 'get_products') {
      const response = await axios.get(`https://${process.env.SHOPIFY_STORE}/admin/api/2023-10/products.json`, {
        headers: {
          'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN
        }
      });
      return res.json(response.data);
    }
    res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Shopify bridge running on port ${PORT}`));