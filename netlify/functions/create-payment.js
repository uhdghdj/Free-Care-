exports.handler = async function(event) {
  try {
    const body = JSON.parse(event.body);
    const apiKey = "ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpiR0Z6Y3lJNklrMWxjb"; // مفتاحك من Paymob
    const integrationId = 5245282; // 🔁 هنا اكتب الـ Integration ID بتاع البطاقة أو الـ Kiosk حسب ما تستخدم

    // 1️⃣ إنشاء التوكن
    const tokenRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey }),
    });
    const tokenData = await tokenRes.json();

    // 2️⃣ إنشاء الطلب
    const orderRes = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: tokenData.token,
        delivery_needed: "false",
        amount_cents: body.amount * 100,
        currency: "EGP",
        items: [],
      }),
    });
    const orderData = await orderRes.json();

    // 3️⃣ إنشاء الدفع
    const paymentRes = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: tokenData.token,
        amount_cents: body.amount * 100,
        expiration: 3600,
        order_id: orderData.id,
        billing_data: {
          apartment: "NA",
          email: "test@example.com",
          floor: "NA",
          first_name: "Youssef",
          street: "Cairo",
          building: "NA",
          phone_number: "+201000000000",
          shipping_method: "NA",
          postal_code: "NA",
          city: "Cairo",
          country: "EG",
          last_name: "Mohammed",
          state: "NA",
        },
        currency: "EGP",
        integration_id: integrationId,
      }),
    });
    const paymentData = await paymentRes.json();

    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/847892?payment_token=${paymentData.token}`;
    return {
      statusCode: 200,
      body: JSON.stringify({ iframeUrl }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
