const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const fs = require("fs");
const app = express();
const port = process.env.PORT || 10000;

require("dotenv").config();

const API_KEY = process.env.API_KEY;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

app.use(bodyParser.json());

app.post("/shopify", async (req, res) => {
  const key = req.headers["x-api-key"];

  if (key !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { action, payload } = req.body;

  try {
    // ✅ GET PRODUCTS
    if (action === "get_products") {
      const response = await axios.get(
        `https://${SHOPIFY_STORE}/admin/api/2023-07/products.json`,
        {
          headers: {
            "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
            "Content-Type": "application/json",
          },
        }
      );
      return res.json({ products: response.data.products });
    }

    // ✅ ORDER PAID: Log to pending_orders.json
    if (action === "order_paid") {
      const order = payload;
      console.log("✅ New paid order received:", order.id);

      // Step 1: Load existing orders from file
      let orders = [];
      try {
        const data = fs.readFileSync("pending_orders.json", "utf8");
        orders = JSON.parse(data);
      } catch (err) {
        orders = [];
      }

      // Step 2: Add new order
      orders.push({
        order_id: order.id,
        customer: order.customer?.email,
        total: order.total_price,
        currency: order.currency,
        created_at: new Date().toISOString()
      });

      // Step 3: Save back to file
      fs.writeFileSync("pending_orders.json", JSON.stringify(orders, null, 2));

      return res.json({
        status: "Order received and logged",
        order_id: order.id
      });
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (error) {
    console.error("❌ Error:", error.message);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Shopify bridge running on port ${port}`);
});
