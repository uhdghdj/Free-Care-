export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");

    // 👇 ثوابت التكامل (integration)
    const CONFIG = {
      card: { integration_id: 5369099, iframe_id: 972116 },
      wallet: { integration_id:5371332 , iframe_id:972117  },
      kiosk: { integration_id: 5369208},
    };

    const integrationType = body.integration_type || "card";
    const cfg = CONFIG[integrationType];
    if (!cfg) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "integration_type غير صحيح" }),
      };
    }

    const API_KEY =
      process.env.PAYMOB_API_KEY ||
    "ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpiR0Z6Y3lJNklrMWxjbU5vWVc1MElpd2ljSEp2Wm1sc1pWOXdheUk2TVRBNU5qVXpOQ3dpYm1GdFpTSTZJbWx1YVhScFlXd2lmUS4zWWIyZ09PS1pwMDNxbUI4LWpFV1lQcDFMWmc1eFU3LVRHUllWVUNmUmlXWkJ5RS1TVUJ0aDZ3cUhhemp4MVRINVlpNHM0UTFaNGxFYUJSLVZSTXRXdw==";

    // 1️⃣ Auth token
    const authRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: API_KEY }),
    });
    const authData = await authRes.json();
    if (!authData.token) throw new Error("Auth فشل");

    // 2️⃣ Create order
    const orderRes = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: authData.token,
        delivery_needed: false,
        amount_cents: "1000",
        currency: "EGP",
        items: [],
      }),
    });
    const orderData = await orderRes.json();
    if (!orderData.id) throw new Error("Order creation failed");

    // 3️⃣ Payment key
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
          state: "NA",
        },
        currency: "EGP",
        integration_id: cfg.integration_id,
      }),
    });
    const payData = await payRes.json();
    if (!payData.token) throw new Error("Payment key فشل");

    // 4️⃣ تحديد نوع الدفع
    if (integrationType === "kiosk") {
      // كيوسك محتاج طلب إضافي علشان يرجع reference
      const kioskRes = await fetch(
        "https://accept.paymob.com/api/acceptance/payments/pay",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: { identifier: "AGGREGATOR", subtype: "AGGREGATOR" },
            payment_token: payData.token,
          }),
        }
      );
      const kioskData = await kioskRes.json();

      const ref = kioskData?.data?.bill_reference;
      if (!ref) throw new Error("فشل في إنشاء كود الكيوسك");

      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          method: "kiosk",
          message: "ادفع باستخدام كود فوري/مصاري",
          bill_reference: ref,
        }),
      };
    }

    // ✳️ لو Card أو Wallet: نفتح iframe
    const iframeUrl = cfg.iframe_id
      ? `https://accept.paymob.com/api/acceptance/iframes/${cfg.iframe_id}?payment_token=${payData.token}`
      : `https://accept.paymob.com/api/acceptance/payments/pay?payment_token=${payData.token}`;

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, method: integrationType, payment_url: iframeUrl }),
    };
  } catch (err) {
    console.error("Error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
