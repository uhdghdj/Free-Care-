// netlify/functions/create-payment.js
export async function handler(event, context) {
  const API_KEY = "ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpiR0Z6Y3lJNklrMWxjbU5vWVc1MElpd2ljSEp2Wm1sc1pWOXdheUk2TVRBM01EYzRPU3dpYm1GdFpTSTZJakUzTlRrMU5EZzBPREV1Tnprek1UYzFJbjAuaXRlRmd2cEdIbXBXRV8zQ2QwRVpyQ2QxOXlqX3lXbVI0RXl4bElnQXJtVkN4dEhhcjlRWmRKc2NoUi1qd1VvbHJJTURiMzVOZ01vVUFlYnVibElydXc=";

  try {
    const body = JSON.parse(event.body);
    const { integration_id, amount_cents } = body;

    // 1️⃣ Auth
    const authRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: API_KEY })
    });
    const authData = await authRes.json();
    const token = authData.token;

    // 2️⃣ Order
    const orderRes = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: token,
        delivery_needed: false,
        amount_cents,
        currency: "EGP",
        items: []
      })
    });
    const orderData = await orderRes.json();

    // 3️⃣ Payment key
    const payRes = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: token,
        amount_cents,
        expiration: 3600,
        order_id: orderData.id,
        billing_data: {
          apartment: "NA",
          email: "customer@example.com",
          floor: "NA",
          first_name: "عميل",
          street: "NA",
          building: "NA",
          phone_number: "+201000000000",
          shipping_method: "NA",
          postal_code: "NA",
          city: "Cairo",
          country: "EG",
          last_name: "تجريبي",
          state: "NA"
        },
        currency: "EGP",
        integration_id
      })
    });
    const payData = await payRes.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        payment_url: `https://accept.paymob.com/api/acceptance/payments/pay?payment_token=${payData.token}`
      })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
        }
