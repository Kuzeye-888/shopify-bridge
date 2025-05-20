# Shopify API Bridge

This Node.js app acts as a secure bridge between ChatGPT (or any service) and your Shopify store.

## Usage

Send a POST request to `/shopify` with a valid API key and action like:

```
POST /shopify
Headers:
  x-api-key: YOUR_API_KEY
Body:
  {
    "action": "get_products",
    "payload": {}
  }
```

## Deploying on Render

1. Connect this repo to Render
2. Set Environment Variables:
   - `API_KEY`
   - `SHOPIFY_STORE` (e.g., yourstore.myshopify.com)
   - `SHOPIFY_ACCESS_TOKEN` (from your Shopify app)
3. Render will give you a public HTTPS URL to use with ChatGPT