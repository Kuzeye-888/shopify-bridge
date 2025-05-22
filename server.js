
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

    if (action === "order_paid") {
      const order = payload;
      console.log("✅ New paid order received:", order.id);

      let orders = [];
      try {
        const data = fs.readFileSync("pending_orders.json", "utf8");
        orders = JSON.parse(data);
      } catch (err) {
        orders = [];
      }

      orders.push({
        order_id: order.id,
        customer: order.customer?.email,
        total: order.total_price,
        currency: order.currency,
        created_at: new Date().toISOString()
      });

      fs.writeFileSync("pending_orders.json", JSON.stringify(orders, null, 2));

      return res.json({
        status: "Order received and logged",
        order_id: order.id
      });
    }

    if (action === "fulfill_order") {
      const { order_id } = payload;

      let pending = [];
      try {
        pending = JSON.parse(fs.readFileSync("pending_orders.json", "utf8"));
      } catch (err) {
        return res.status(404).json({ error: "No pending orders found." });
      }

      const index = pending.findIndex(o => o.order_id === order_id);
      if (index === -1) {
        return res.status(404).json({ error: "Order not found in pending list." });
      }

      const order = pending.splice(index, 1)[0];
      fs.writeFileSync("pending_orders.json", JSON.stringify(pending, null, 2));

      let fulfilled = [];
      try {
        fulfilled = JSON.parse(fs.readFileSync("fulfilled_orders.json", "utf8"));
      } catch (err) {
        fulfilled = [];
      }

      order.fulfilled_at = new Date().toISOString();
      fulfilled.push(order);
      fs.writeFileSync("fulfilled_orders.json", JSON.stringify(fulfilled, null, 2));

      return res.json({
        status: "Order marked as fulfilled",
        order_id: order.order_id
      });
    }

    if (action === "add_product") {
      const { title, cost_price, shipping_cost, markup_percent, description, image_url } = payload;

      const platform_fee = 1.0;
      const final_price = parseFloat(cost_price) + parseFloat(shipping_cost) + platform_fee + (parseFloat(cost_price) * (markup_percent / 100));
      const rounded_price = final_price.toFixed(2);

      const product = {
        product: {
          title,
          body_html: description,
          variants: [
            {
              price: rounded_price
            }
          ],
          images: [
            {
              src: image_url
            }
          ]
        }
      };

      const response = await axios.post(
        `https://${SHOPIFY_STORE}/admin/api/2023-07/products.json`,
        product,
        {
          headers: {
            "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
            "Content-Type": "application/json"
          }
        }
      );

      let productLog = [];
      try {
        productLog = JSON.parse(fs.readFileSync("products.json", "utf8"));
      } catch (err) {
        productLog = [];
      }

      productLog.push({
        title,
        price: rounded_price,
        cost_price,
        shipping_cost,
        markup_percent,
        created_at: new Date().toISOString()
      });

      fs.writeFileSync("products.json", JSON.stringify(productLog, null, 2));

      return res.json({
        status: "Product created successfully",
        title,
        final_price: rounded_price
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

