import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 Paymob API Key بتاعتك
const API_KEY = "ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpiR0Z6Y3lJNklrMWxjb";

// 🆔 Integration IDs لكل وسيلة دفع
const INTEGRATION_IDS = {
  card: 5245183,
  wallet: 5245282,
  kiosk: 5345183,
};

// 📦 إنشاء الدفع
app.post("/create-payment", async (req, res) => {
  const { amount, type } = req.body;
  const integration_id = INTEGRATION_IDS[type];

  if (!integration_id) return res.status(400).json({ error: "نوع الدفع غير صالح" });

  try {
    // 1️⃣ إنشاء توكن
    const authRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: API_KEY }),
    });
    const { token: auth_token } = await authRes.json();

    // 2️⃣ إنشاء الطلب
    const orderRes = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token,
        delivery_needed: false,
        amount_cents: amount * 100,
        currency: "EGP",
        items: [],
      }),
    });
    const order = await orderRes.json();

    // 3️⃣ إنشاء Payment Key
    const payRes = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token,
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
        integration_id,
      }),
    });

    const payData = await payRes.json();

    // 4️⃣ لو النوع كارد → رابط مباشر
    if (type === "card") {
      const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/952326?payment_token=${payData.token}`;
      return res.json({ url: iframeUrl });
    }

    // 5️⃣ لو Wallet → نجيب اللينك من endpoint الخاص بالمحافظ
    if (type === "wallet") {
      const walletRes = await fetch("https://accept.paymob.com/api/acceptance/payments/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: { identifier: "01010101010", subtype: "WALLET" },
          payment_token: payData.token,
        }),
      });
      const walletData = await walletRes.json();
      return res.json(walletData);
    }

    // 6️⃣ لو Kiosk → نجيب رقم المرجع
    if (type === "kiosk") {
      const kioskRes = await fetch("https://accept.paymob.com/api/acceptance/payments/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: { identifier: "AGGREGATOR", subtype: "KIOSK" },
          payment_token: payData.token,
        }),
      });
      const kioskData = await kioskRes.json();
      return res.json(kioskData);
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "حدث خطأ أثناء إنشاء الدفع" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
