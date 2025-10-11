export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");

    // 👇 إعدادات التكامل
    const CONFIG = {
      card: { integration_id: 5245183, iframe_id: 952326 },
      wallet: { integration_id: 5245282, iframe_id: 952340 },
      kiosk: { integration_id: 5345183 }
    };

    const integrationType = body.integration_type || "card";
    const cfg = CONFIG[integrationType];
    if (!cfg) {
      return { statusCode: 400, body: JSON.stringify({ error: "integration_type غير صحيح" }) };
    }

    const API_KEY =
      process.env.PAYMOB_API_KEY ||
      "ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpiR0Z6Y3lJNklrMWxjbU5vWVc1MElpd2ljSEp2Wm1sc1pWOXdheUk2TVRBM01EYzRPU3dpYm1GdFpTSTZJakUzTlRrMU5EZzBPREV1Tnprek1UYzFJbjAuaXRlRmd2cEdIbXBXRV8zQ2QwRVpyQ2QxOXlqX3lXbVI0RXl4bElnQXJtVkN4dEhhcjlRWmRKc2NoUi1qd1VvbHJJTURiMzVOZ01vVUFlYnVibElydXc=";

    // 1️⃣ Auth token
    const authRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: API_KEY })
    });
    const authData = await authRes.json();
    if (!authData.token) throw new Error("Auth فشل");

    // 2️⃣ إنشاء الأوردر
    const orderRes = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: authData.token,
        delivery_needed: false,
        amount_cents: "1000",
        currency: "EGP",
        items: []
      })
    });
    const orderData = await orderRes.json();
    if (!orderData.id) throw new Error("Order creation failed");

    // 3️⃣ إنشاء payment key
    const payRes = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: authData.token,
        amount_cents: "1000",
        expiration: 3600,
        order_id: orderData.id,
        billing_data: {
          apartment: "NA",
          email: "test@example.com",
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
        integration_id: cfg.integration_id
      })
    });
    const payData = await payRes.json();
    if (!payData.token) throw new Error("Payment key فشل");

    // 4️⃣ التعامل حسب نوع التكامل
    if (integrationType === "kiosk") {
      // كيوسـك بيحتاج reference number
      const kioskRes = await fetch("https://accept.paymob.com/api/acceptance/payments/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: { identifier: "AGGREGATOR", subtype: "AGGREGATOR" },
          payment_token: payData.token
        })
      });

      const kioskData = await kioskRes.json();
      if (!kioskData.id && !kioskData.data?.bill_reference)
        throw new Error("Kiosk payment فشل");

      const ref = kioskData.data.bill_reference;

      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          type: "kiosk",
          bill_reference: ref,
          message: `✅ تم إنشاء رقم الدفع بنجاح!\n\nرقم المرجع الخاص بك: ${ref}\n\nتوجه لأي ماكينة فوري أو مصاري أو Bee، واختار خدمة "Paymob" أو "كود الدفع"، وادخل الرقم ده علشان تكمل الدفع.`
        })
      };
    }

    // غير كده (بطاقة أو محفظة)
    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${cfg.iframe_id}?payment_token=${payData.token}`;

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        type: integrationType,
        payment_url: iframeUrl
      })
    };
  } catch (err) {
    console.error("Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
