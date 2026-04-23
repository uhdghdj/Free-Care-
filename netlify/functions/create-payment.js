export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");

    const CONFIG = {
      card: { integration_id:5245183 , iframe_id: 952327 },
      wallet: { integration_id:5245282 , iframe_id:972789  },
      kiosk: { integration_id: 5345183 },
    };

    const integrationType = body.integration_type || "card";
    const cfg = CONFIG[integrationType];

    if (!cfg) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "integration_type غير صحيح" }),
      };
    }

    const amount = Number(body.amount || 0);

    if (!amount || amount <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "amount غير صحيح" }),
      };
    }

    const amount_cents = Math.round(amount * 100);

    // 🔥 API KEY محطوط مباشرة (للتجربة فقط)
    const API_KEY = "ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpiR0Z6Y3lJNklrMWxjbU5vWVc1MElpd2ljSEp2Wm1sc1pWOXdheUk2TVRBM01EYzRPU3dpYm1GdFpTSTZJakUzTmpBeE9UUXlNamN1TXpBNU1UZ3pJbjAuODdYUkRfenRZSWp6YkhrbWZvLXlpMmh2dDZlZEloMzBwSjctUE9GSkItRzdVMUc1NzhBeVRacGFfVXI3VHVlRnZ4VDYxSklxUDFTQzBSV2N4eHRKcHc=";

    // 1️⃣ Auth
    const authRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: API_KEY }),
    });

    const authData = await authRes.json();
    if (!authData.token) throw new Error("Auth فشل");

    // 2️⃣ Order
    const orderRes = await fetch(
      "https://accept.paymob.com/api/ecommerce/orders",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_token: authData.token,
          delivery_needed: false,
          amount_cents,
          currency: "EGP",
          items: [],
        }),
      }
    );

    const orderData = await orderRes.json();
    if (!orderData.id) throw new Error("Order failed");

    // 3️⃣ Payment Key
    const payRes = await fetch(
      "https://accept.paymob.com/api/acceptance/payment_keys",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_token: authData.token,
          amount_cents,
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
            last_name: "User",
            state: "NA",
          },
          currency: "EGP",
          integration_id: cfg.integration_id,
        }),
      }
    );

    const payData = await payRes.json();
    if (!payData.token) throw new Error("Payment key فشل");

    // 4️⃣ Kiosk
    if (integrationType === "kiosk") {
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

      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          method: "kiosk",
          bill_reference: kioskData?.data?.bill_reference,
        }),
      };
    }

    // 5️⃣ Card / Wallet
    const iframeUrl =
      `https://accept.paymob.com/api/acceptance/iframes/${cfg.iframe_id}?payment_token=${payData.token}`;

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        method: integrationType,
        payment_url: iframeUrl,
      }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
