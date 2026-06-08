// ─────────────────────────────────────────────────────────────────────
//  backend/scripts/seed-orders.js
//  Run with:  node scripts/seed-orders.js
//  Seeds 50 dummy orders from Jan 1, 2026 to today.
//  Also creates 6 dummy customer accounts if they don't exist.
// ─────────────────────────────────────────────────────────────────────
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import userModel from "../models/userModel.js";
import Order from "../models/Order.js";

const MONGO_URI = "mongodb://127.0.0.1:27017/ecom";

// ── Product catalog (reuse same items as main seed) ────────────────────
const PRODUCTS = [
  { id: "prod_arduino_uno", name: "Arduino Uno R3 Compatible Board",         price: 699,  mrp: 899,  subcat: "Arduino Boards" },
  { id: "prod_esp32",       name: "ESP32 Development Board WiFi + Bluetooth", price: 549,  mrp: 699,  subcat: "ESP32" },
  { id: "prod_rpi5",        name: "Raspberry Pi 5 (4GB RAM)",                price: 5499, mrp: 5999, subcat: "Raspberry Pi" },
  { id: "prod_dht22",       name: "DHT22 Temperature & Humidity Sensor",      price: 199,  mrp: 249,  subcat: "Sensors" },
  { id: "prod_hcsr04",      name: "HC-SR04 Ultrasonic Distance Sensor",      price: 89,   mrp: 129,  subcat: "Sensors" },
  { id: "prod_mq135",       name: "MQ-135 Air Quality Sensor Module",        price: 149,  mrp: 179,  subcat: "Sensors" },
  { id: "prod_oled",        name: "0.96\" OLED Display 128x64 (I2C)",        price: 249,  mrp: 299,  subcat: "Displays" },
  { id: "prod_lcd16x2",     name: "16x2 LCD Display Module (Blue)",          price: 279,  mrp: 329,  subcat: "Displays" },
  { id: "prod_sg90",        name: "SG90 Micro Servo Motor",                  price: 149,  mrp: 199,  subcat: "Motors" },
  { id: "prod_l293d",       name: "L293D Motor Driver Shield for Arduino",   price: 349,  mrp: 449,  subcat: "Motors" },
  { id: "prod_jumper_wires",name: "Jumper Wire Kit (120pcs)",                price: 99,   mrp: 149,  subcat: "Cables" },
  { id: "prod_breadboard",  name: "Breadboard 830 Points",                   price: 139,  mrp: 179,  subcat: "Tools" },
];

const CUSTOMERS = [
  { name: "Rahul Sharma", email: "rahul@gmail.com",     phone: "8765432109", city: "Dharwad",  street: "123 MG Road",          pincode: "580001" },
  { name: "Pooja Desai",  email: "pooja@yahoo.com",     phone: "7654321098", city: "Hubli",    street: "456 Lamington Road",   pincode: "580020" },
  { name: "Vikram Jadhav",email: "vikram.jadhav@gmail.com", phone: "9988776655", city: "Belgaum", street: "789 College Road",    pincode: "590001" },
  { name: "Shweta Patil", email: "shweta.patil@outlook.com", phone: "8877665544", city: "Dharwad", street: "22 Market Lane",      pincode: "580004" },
  { name: "Arun Kumar",   email: "arun.kumar@rediffmail.com", phone: "7766554433", city: "Hubli", street: "55 Gandhi Nagar",     pincode: "580030" },
  { name: "Meena Iyer",   email: "meena.iyer@gmail.com", phone: "6655443322", city: "Dharwad", street: "12 Lake View Apartments", pincode: "580008" },
];

const PASSWORD_HASH = "$2a$10$bjQFmjKPTp5mERzjUSKEXel.LcJQh4yDTR93hVblAQ2NkO0qzfI6.";
const STATUSES = ["placed", "confirmed", "processing", "shipped", "delivered"];
const PAYMENT_METHODS = ["cod", "razorpay"];
const DELIVERY_METHODS = ["standard", "standard", "standard", "standard", "pickup"]; // ~20% pickup

// ── Helpers ────────────────────────────────────────────────────────────
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const randomDate = () => {
  const start = new Date("2026-01-01T00:00:00Z");
  const end = new Date();
  const diff = end.getTime() - start.getTime();
  return new Date(start.getTime() + Math.random() * diff);
};

const pickItems = () => {
  const count = randomInt(1, 4);
  const shuffled = [...PRODUCTS].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);
  return selected.map(p => ({
    productId: p.id,
    name: p.name,
    price: p.price,
    mrp: p.mrp,
    quantity: randomInt(1, 5),
    subcat: p.subcat,
    image: "",
  }));
};

const calcSubtotal = (items) => items.reduce((s, i) => s + i.price * i.quantity, 0);
const calcMrpTotal = (items) => items.reduce((s, i) => s + i.mrp * i.quantity, 0);

const makeStatusHistory = (status, createdAt) => {
  const history = [
    { status: "placed",     message: "Order placed successfully",            at: new Date(createdAt.getTime() - 3600000) },
    { status: "confirmed",  message: "Payment confirmed",                     at: new Date(createdAt.getTime() - 1800000) },
    { status: "processing", message: "Order is being prepared",               at: new Date(createdAt.getTime() - 600000) },
  ];
  if (status !== "placed" && status !== "confirmed") {
    history.push({
      status: "shipped",
      message: "Package shipped via Delhivery",
      at: new Date(createdAt.getTime() + 3600000),
    });
  }
  if (status === "delivered") {
    history.push({
      status: "delivered",
      message: "Package delivered successfully",
      at: new Date(createdAt.getTime() + 86400000 * 2),
    });
  }
  return history;
};

const makeOrderNumber = (date) => {
  const d = date.toISOString().slice(0, 10).replace(/-/g, "");
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AE-${d}-${r}`;
};

// ─────────────────────────────────────────────────────────────────────
async function run() {
  console.log("→ Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected\n");

  // ── 1. Create customers (if not exist) ──────────────────────────────
  console.log("── CUSTOMERS ──");
  const customerUsers = [];
  for (const c of CUSTOMERS) {
    let user = await userModel.findOne({ email: c.email });
    if (!user) {
      user = await userModel.create({
        name: c.name,
        email: c.email,
        authProvider: "local",
        password: PASSWORD_HASH,
        role: "customer",
        isVerified: true,
        phone: c.phone,
        addresses: [{
          fullName: c.name,
          phone: c.phone,
          street: c.street,
          city: c.city,
          state: "Karnataka",
          pincode: c.pincode,
          isDefault: true,
        }],
        date: Date.now(),
      });
      console.log(`  Created: ${c.name}`);
    } else {
      console.log(`  Already exists: ${c.name}`);
    }
    customerUsers.push(user);
  }
  console.log(`✅ ${customerUsers.length} customers ready\n`);

  // ── 2. Seed 50 orders ───────────────────────────────────────────────
  console.log("── ORDERS ──");
  await Order.deleteMany({});
  console.log("  Cleared existing orders");

  const orders = [];
  for (let i = 0; i < 50; i++) {
    const user = randomItem(customerUsers);
    const items = pickItems();
    const subtotal = calcSubtotal(items);
    const mrpTotal = calcMrpTotal(items);
    const deliveryCharge = subtotal >= 499 ? 0 : 49;
    const grandTotal = subtotal + deliveryCharge;
    const savedAmount = mrpTotal - subtotal;
    const createdAt = randomDate();
    const status = randomItem(STATUSES);
    const paymentMethod = randomItem(PAYMENT_METHODS);
    const deliveryMethod = randomItem(DELIVERY_METHODS);
    const isRazorpay = paymentMethod === "razorpay";

    const order = {
      userId: user._id,
      orderNumber: makeOrderNumber(createdAt),
      items: items.map(i => ({ ...i, image: "" })),
      billing: {
        firstName: user.name.split(" ")[0] || user.name,
        lastName: user.name.split(" ").slice(1).join(" ") || "",
        email: user.email,
        phone: user.phone || "9876543210",
        address: user.addresses?.[0]?.street || "123 Main Street",
        city: user.addresses?.[0]?.city || "Dharwad",
        state: "Karnataka",
        pincode: user.addresses?.[0]?.pincode || "580001",
        country: "India",
      },
      payment: {
        method: paymentMethod,
        status: "paid",
        ...(isRazorpay ? {
          razorpayOrderId: "order_" + Math.random().toString(36).slice(2, 14),
          razorpayPaymentId: "pay_" + Math.random().toString(36).slice(2, 10),
          razorpaySignature: "sig_" + Math.random().toString(36).slice(2, 18),
        } : {}),
        paidAt: createdAt,
      },
      delivery: {
        name: deliveryMethod === "pickup" ? "Office Pickup" : "Standard Delivery",
        method: deliveryMethod,
        charge: deliveryMethod === "pickup" ? 0 : deliveryCharge,
      },
      subtotal,
      mrpTotal,
      deliveryCharge,
      grandTotal,
      savedAmount,
      discountOnMrp: savedAmount,
      status,
      statusHistory: makeStatusHistory(status, createdAt),
      estimatedDelivery: new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000),
      createdAt,
    };

    orders.push(order);
  }

  // Sort by createdAt ascending
  orders.sort((a, b) => a.createdAt - b.createdAt);

  for (const order of orders) {
    await Order.create(order);
  }

  console.log(`✅ ${orders.length} orders seeded`);

  // Count by status
  const statusCounts = {};
  for (const o of orders) {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  }
  console.log("  Status breakdown:", Object.entries(statusCounts).map(([k, v]) => `${k}: ${v}`).join(", "));

  const methodCounts = {};
  for (const o of orders) {
    methodCounts[o.payment.method] = (methodCounts[o.payment.method] || 0) + 1;
  }
  console.log("  Payment methods:", Object.entries(methodCounts).map(([k, v]) => `${k}: ${v}`).join(", "));

  const pickupCount = orders.filter(o => o.delivery.method === "pickup").length;
  console.log(`  Pickup orders: ${pickupCount}`);

  const dateRange = {
    from: orders[0]?.createdAt?.toISOString().slice(0, 10) || "N/A",
    to: orders[orders.length - 1]?.createdAt?.toISOString().slice(0, 10) || "N/A",
  };
  console.log(`  Date range: ${dateRange.from} to ${dateRange.to}`);

  // ═══════════════════════════════════════════════════════════════════
  await mongoose.disconnect();
  console.log("\n✅ DONE! 50 orders seeded successfully.");
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ Failed:", e.message);
  process.exit(1);
});
