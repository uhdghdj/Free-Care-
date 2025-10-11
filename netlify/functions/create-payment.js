import fetch from "node-fetch";

export async function handler(event) {
  try {
    const { amount, type } = JSON.parse(event.body);

    const API_KEY =
      "ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpiR0Z6Y3lJNklrMWxjbU5vWVc1MElpd2ljSEp2Wm1sc1pWOXdheUk2TVRBM01EYzRPU3dpYm1GdFpTSTZJakUzTlRrMU5EZzBPREV1Tnprek1UYzFJbjAuaXRlRmd2cEdIbXBXRV8zQ2QwRVpyQ2QxOXlqX3lXbVI0RXl4bElnQXJtVkN4dEhhcjlRWmRKc2NoUi1qd1VvbHJJTURiMzVOZ01vVUFlYnVibElydXc=";

    const INTEGRATIONS = {
      card: 5245183,
      wallet: 5245282,
      kiosk: 5345183,
    };

    // 1️⃣ التوكن
    const authRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: API_KEY }),
    });
    const { token } = await authRes.json();

    // 2️⃣ إنشاء الأوردر
    const orderRes = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: token,
        delivery_needed: false,
        amount_cents: amount * 100,
        currency: "EGP",
        items: [],
      }),
    });
    const order = await orderRes.json();

    // 3️⃣ إنشاء payment key
    const paymentKeyRes = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: token,
        amount_cents: amount * 100,
        expiration: 3600,
        order_id: order.id,
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
          state: "NA",
        },
        currency: "EGP",
        integration_id: INTEGRATIONS[type],
      }),
    });
    const paymentKey = await paymentKeyRes.json();

    // 4️⃣ لو كيوسك
    if (type === "kiosk") {
      const kioskRes = await fetch("https://accept.paymob.com/api/acceptance/payments/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: { identifier: "AGGREGATOR", subtype: "KIOSK" },
          payment_token: paymentKey.token,
        }),
      });
      const kioskData = await kioskRes.json();
      return {
        statusCode: 200,
        body: JSON.stringify({ type: "kiosk", ref: kioskData.data?.bill_reference }),
      };
    }

    // 5️⃣ باقي الطرق (Card / Wallet)
    const iframeId = type === "wallet" ? 952340 : 952326;
    const paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey.token}`;
    return {
      statusCode: 200,
      body: JSON.stringify({ type, url: paymentUrl }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "خطأ في إنشاء الدفع" }) };
  }
                }
