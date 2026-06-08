// ─────────────────────────────────────────────────────────────────────
//  backend/scripts/seed.js
//  Run with:  npm run seed
//  Seeds ALL dummy data for testing the admin panel.
// ─────────────────────────────────────────────────────────────────────
import mongoose from "mongoose";

// ── Models ───────────────────────────────────────────────────────────
import Coupon          from "../models/Coupon.js";
import DeliveryCharge  from "../models/DeliveryCharge.js";
import categoryModel   from "../models/categoryModel.js";
import productModel    from "../models/productModel.js";
import blogModel       from "../models/blogModel.js";
import Testimonial     from "../models/Testimonial.js";
import heroBannerModel from "../models/heroBannerModel.js";
import showcaseBannerModel from "../models/showcaseBannerModel.js";
import Project         from "../models/Project.js";
import userModel       from "../models/userModel.js";
import contactModel    from "../models/contactModel.js";
import Order           from "../models/Order.js";

// ── Config ───────────────────────────────────────────────────────────
const MONGO_URI = "mongodb://127.0.0.1:27017/ecom";

const oneYearFromNow = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d;
};

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

// ─────────────────────────────────────────────────────────────────────
async function run() {
  console.log("→ Connecting to local MongoDB (ecom)...");
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected\n");

  // ═══════════════════════════════════════════════════════════════════
  //  1. COUPONS
  // ═══════════════════════════════════════════════════════════════════
  console.log("── COUPONS ──");
  await Coupon.deleteMany({});
  await Coupon.insertMany([
    {
      code: "AMULYA10", label: "10% off your order",
      description: "Save 10% on your entire order.",
      type: "percent", value: 10, minOrderValue: 0, maxDiscount: 500,
      validTill: oneYearFromNow(),
    },
    {
      code: "FIRST50", label: "₹50 flat off",
      description: "Flat ₹50 off for first-time customers.",
      type: "flat", value: 50, minOrderValue: 199,
      eligibility: "firstOrder", validTill: oneYearFromNow(),
    },
    {
      code: "SAVE20", label: "20% off your order",
      description: "20% off on orders above ₹999.",
      type: "percent", value: 20, minOrderValue: 999, maxDiscount: 1000,
      validTill: oneYearFromNow(),
    },
  ]);
  console.log("✅ 3 coupons seeded\n");

  // ═══════════════════════════════════════════════════════════════════
  //  2. DELIVERY CHARGES
  // ═══════════════════════════════════════════════════════════════════
  console.log("── DELIVERY CHARGES ──");
  await DeliveryCharge.deleteMany({});
  await DeliveryCharge.insertMany([
    { name: "Standard Delivery", method: "standard", freeAbove: 499, charge: 49, estimatedDaysMin: 4, estimatedDaysMax: 7, priority: 10 },
    { name: "Express Delivery",  method: "express",  freeAbove: 1999, charge: 149, estimatedDaysMin: 1, estimatedDaysMax: 2, priority: 20 },
  ]);
  console.log("✅ 2 delivery rules seeded\n");

  // ═══════════════════════════════════════════════════════════════════
  //  3. CATEGORIES
  // ═══════════════════════════════════════════════════════════════════
  console.log("── CATEGORIES ──");
  await categoryModel.deleteMany({});
  await categoryModel.insertMany([
    {
      name: "Arduino & Development Boards",
      slug: "arduino-development-boards",
      description: "Microcontroller boards, shields, and development kits for prototyping and DIY projects.",
      isActive: true, sortOrder: 1,
      subCategories: [
        { name: "Arduino Boards", slug: "arduino-boards", description: "Uno, Nano, Mega, and more" },
        { name: "ESP32 & ESP8266", slug: "esp32-esp8266", description: "Wi-Fi enabled microcontrollers" },
        { name: "Raspberry Pi", slug: "raspberry-pi", description: "Single-board computers" },
        { name: "Shields & Modules", slug: "shields-modules", description: "Add-on boards for Arduino" },
      ],
    },
    {
      name: "Sensors & Modules",
      slug: "sensors-modules",
      description: "Environmental, motion, distance, and other sensor modules for electronics projects.",
      isActive: true, sortOrder: 2,
      subCategories: [
        { name: "Temperature & Humidity", slug: "temperature-humidity", description: "DHT11, DHT22, LM35" },
        { name: "Motion & Distance", slug: "motion-distance", description: "Ultrasonic, PIR, IR sensors" },
        { name: "Gas & Air Quality", slug: "gas-air-quality", description: "MQ series, PM2.5 sensors" },
      ],
    },
    {
      name: "Power & Batteries",
      slug: "power-batteries",
      description: "Battery management systems, power supplies, solar panels, and inverters.",
      isActive: true, sortOrder: 3,
      subCategories: [
        { name: "Battery Management", slug: "battery-management", description: "BMS, chargers, protection boards" },
        { name: "Solar Products", slug: "solar-products", description: "Panels, charge controllers" },
        { name: "Power Supplies", slug: "power-supplies", description: "SMPS, adapters, voltage regulators" },
      ],
    },
    {
      name: "Displays & OLED",
      slug: "displays-oled",
      description: "LCD, OLED, TFT, and e-paper displays for your projects.",
      isActive: true, sortOrder: 4,
      subCategories: [
        { name: "OLED Displays", slug: "oled-displays", description: "0.96\", 1.3\" monochrome & color" },
        { name: "LCD Modules", slug: "lcd-modules", description: "16×2, 20×4 character LCDs" },
        { name: "TFT & Touch", slug: "tft-touch", description: "Color TFT displays with touch" },
      ],
    },
    {
      name: "Motors & Drivers",
      slug: "motors-drivers",
      description: "DC motors, stepper motors, servo motors, and motor driver modules.",
      isActive: true, sortOrder: 5,
      subCategories: [
        { name: "DC Motors", slug: "dc-motors", description: "Standard & geared DC motors" },
        { name: "Stepper Motors", slug: "stepper-motors", description: "NEMA 17, 28BYJ-48" },
        { name: "Servo Motors", slug: "servo-motors", description: "SG90, MG995, continuous rotation" },
      ],
    },
    {
      name: "Cables & Connectors",
      slug: "cables-connectors",
      description: "Jumper wires, USB cables, header pins, and interconnect solutions.",
      isActive: true, sortOrder: 6,
    },
    {
      name: "Tools & Accessories",
      slug: "tools-accessories",
      description: "Soldering irons, multimeters, breadboards, and maker essentials.",
      isActive: true, sortOrder: 7,
    },
  ]);
  console.log("✅ 7 categories (with subcategories) seeded\n");

  // ═══════════════════════════════════════════════════════════════════
  //  4. PRODUCTS
  // ═══════════════════════════════════════════════════════════════════
  console.log("── PRODUCTS ──");
  await productModel.deleteMany({});
  await productModel.insertMany([
    {
      name: "Arduino Uno R3 Compatible Board",
      description: "High-quality Arduino Uno R3 compatible board based on ATmega328P. Features 14 digital I/O pins, 6 analog inputs, USB connection, and ICSP header. Perfect for beginners and advanced projects alike.",
      price: 699, originalPrice: 899,
      image: [],
      category: "Arduino & Development Boards", subCategory: "Arduino Boards",
      inStock: true, stockCount: 45,
      bestseller: true, isHot: true, isPopular: true, isFeatured: true,
      keyFeatures: ["ATmega328P microcontroller", "14 Digital I/O pins (6 PWM)", "6 Analog inputs", "USB-TTL CH340G", "5V operating voltage"],
      specifications: { Microcontroller: "ATmega328P", "Operating Voltage": "5V", "Digital I/O Pins": "14 (6 PWM)", "Analog Input Pins": "6", "Flash Memory": "32 KB", "Clock Speed": "16 MHz" },
      tags: ["#Arduino", "#Uno", "#ATmega328P", "#Maker"],
      warranty: "1 Year Warranty",
      averageRating: 4.5, totalReviews: 28, views: 1520,
      date: daysAgo(2).getTime(),
    },
    {
      name: "ESP32 Development Board WiFi + Bluetooth",
      description: "Dual-core ESP32 development board with built-in WiFi and Bluetooth. Ideal for IoT projects, home automation, and wireless sensor networks. CP2102 USB-to-serial converter.",
      price: 549, originalPrice: 699,
      image: [],
      category: "Arduino & Development Boards", subCategory: "ESP32 & ESP8266",
      inStock: true, stockCount: 32,
      bestseller: true, isHot: true, isFeatured: true,
      keyFeatures: ["Dual-core Xtensa LX6 @ 240 MHz", "WiFi 802.11 b/g/n + Bluetooth 4.2", "4 MB Flash memory", "CP2102 USB interface", "Low power consumption"],
      specifications: { Processor: "Xtensa LX6 Dual-Core", "Clock Speed": "240 MHz", WiFi: "802.11 b/g/n", Bluetooth: "v4.2 BR/EDR + BLE", Flash: "4 MB", "Operating Voltage": "3.3V" },
      tags: ["#ESP32", "#IoT", "#WiFi", "#Bluetooth"],
      warranty: "1 Year Warranty",
      averageRating: 4.7, totalReviews: 42, views: 2300,
      date: daysAgo(3).getTime(),
    },
    {
      name: "Raspberry Pi 5 (4GB RAM)",
      description: "Latest generation Raspberry Pi 5 single-board computer with 4GB RAM. 2.4GHz quad-core processor, dual 4K HDMI output, USB 3.0, and PCIe 2.0 x1 interface.",
      price: 5499, originalPrice: 5999,
      image: [],
      category: "Arduino & Development Boards", subCategory: "Raspberry Pi",
      inStock: true, stockCount: 8,
      bestseller: false, isHot: true, isFeatured: true,
      keyFeatures: ["Broadcom BCM2712 quad-core @ 2.4GHz", "4GB LPDDR4X RAM", "Dual 4K HDMI output", "USB 3.0 × 2, USB 2.0 × 2", "PCIe 2.0 x1 interface"],
      specifications: { SoC: "Broadcom BCM2712", CPU: "Quad-core Cortex-A76 @ 2.4GHz", RAM: "4GB LPDDR4X", USB: "2× USB 3.0 + 2× USB 2.0", Video: "Dual 4K HDMI", GPIO: "40-pin header" },
      tags: ["#RaspberryPi", "#RPi5", "#Linux", "#SBC"],
      warranty: "1 Year Warranty",
      averageRating: 4.8, totalReviews: 15, views: 890,
      date: daysAgo(5).getTime(),
    },
    {
      name: "DHT22 Temperature & Humidity Sensor",
      description: "High-precision digital temperature and humidity sensor module. Uses capacitive humidity sensor and thermistor. Single-wire digital interface, works great with Arduino and ESP32.",
      price: 199, originalPrice: 249,
      image: [],
      category: "Sensors & Modules", subCategory: "Temperature & Humidity",
      inStock: true, stockCount: 78,
      bestseller: true, isPopular: true,
      keyFeatures: ["3.3V to 5V operating range", "−40°C to 80°C temperature range", "0–100% humidity range", "±0.5°C accuracy", "Single-wire digital interface"],
      specifications: { "Temperature Range": "−40°C to 80°C", "Temperature Accuracy": "±0.5°C", "Humidity Range": "0–100% RH", "Humidity Accuracy": "±2% RH", Interface: "Single-wire digital", "Supply Voltage": "3.3V–5V" },
      tags: ["#DHT22", "#Temperature", "#Humidity", "#Sensor"],
      warranty: "6 Months Warranty",
      averageRating: 4.3, totalReviews: 56, views: 3400,
      date: daysAgo(1).getTime(),
    },
    {
      name: "HC-SR04 Ultrasonic Distance Sensor",
      description: "Popular HC-SR04 ultrasonic distance sensor module. Measures distance from 2cm to 400cm with high accuracy. Perfect for obstacle avoidance robots, distance measurement, and parking sensors.",
      price: 89, originalPrice: 129,
      image: [],
      category: "Sensors & Modules", subCategory: "Motion & Distance",
      inStock: true, stockCount: 120,
      bestseller: true, isHot: true, isPopular: true,
      keyFeatures: ["2cm to 400cm sensing range", "3mm accuracy", "5V operating voltage", "15° beam angle", "Trigger/Echo interface"],
      specifications: { "Sensing Range": "2cm – 400cm", Accuracy: "±3mm", "Beam Angle": "15°", "Supply Voltage": "5V DC", "Operating Current": "15 mA", "Trigger Pin": "10µs TTL pulse" },
      tags: ["#HC-SR04", "#Ultrasonic", "#Distance", "#Robot"],
      warranty: "6 Months Warranty",
      averageRating: 4.4, totalReviews: 83, views: 5100,
      date: daysAgo(4).getTime(),
    },
    {
      name: "MQ-135 Air Quality Sensor Module",
      description: "Air quality sensor module for detecting NH3, NOx, alcohol, benzene, smoke, and CO2. Features both digital and analog outputs with adjustable sensitivity via potentiometer.",
      price: 149, originalPrice: 179,
      image: [],
      category: "Sensors & Modules", subCategory: "Gas & Air Quality",
      inStock: true, stockCount: 55,
      isPopular: true,
      keyFeatures: ["Detects NH3, NOx, alcohol, benzene, smoke", "Analog + digital outputs", "Adjustable sensitivity", "Fast response time", "5V operation"],
      specifications: { "Detection Gases": "NH3, NOx, Alcohol, Benzene, Smoke, CO2", "Output Type": "Analog + Digital", "Sensitivity": "Adjustable via potentiometer", "Response Time": "< 10 seconds", "Supply Voltage": "5V" },
      tags: ["#MQ135", "#AirQuality", "#GasSensor", "#Environment"],
      warranty: "6 Months Warranty",
      averageRating: 4.1, totalReviews: 22, views: 980,
      date: daysAgo(6).getTime(),
    },
    {
      name: "0.96\" OLED Display 128×64 (I2C)",
      description: "Compact 0.96-inch OLED display with 128×64 resolution. I2C interface, requires only 2 pins. White or blue pixels on black background. Great for wearables and compact projects.",
      price: 249, originalPrice: 299,
      image: [],
      category: "Displays & OLED", subCategory: "OLED Displays",
      inStock: true, stockCount: 40,
      bestseller: true, isFeatured: true,
      keyFeatures: ["128×64 resolution", "0.96\" diagonal", "I2C interface (only 2 wires)", "3.3V / 5V compatible", "Ultra-low power"],
      specifications: { Diagonal: "0.96\"", Resolution: "128×64", Color: "White", Interface: "I2C", "Driver IC": "SSD1306", "Supply Voltage": "3.3V–5V" },
      tags: ["#OLED", "#Display", "#I2C", "#SSD1306"],
      warranty: "6 Months Warranty",
      averageRating: 4.6, totalReviews: 38, views: 2100,
      date: daysAgo(3).getTime(),
    },
    {
      name: "16×2 LCD Display Module (Blue Backlight)",
      description: "Standard 16×2 character LCD display with blue backlight and I2C adapter. Display 32 characters in 2 rows. I2C adapter included for easy 2-wire connection.",
      price: 279, originalPrice: 329,
      image: [],
      category: "Displays & OLED", subCategory: "LCD Modules",
      inStock: true, stockCount: 35,
      isPopular: true,
      keyFeatures: ["16 characters × 2 lines", "Blue backlit display", "I2C adapter included", "Adjustable contrast", "5V operation"],
      specifications: { Format: "16×2 characters", Backlight: "Blue", Interface: "I2C / Parallel", "Supply Voltage": "5V", "I2C Address": "0x27 / 0x3F" },
      tags: ["#LCD", "#16x2", "#Display", "#I2C"],
      warranty: "6 Months Warranty",
      averageRating: 4.2, totalReviews: 45, views: 1800,
      date: daysAgo(7).getTime(),
    },
    {
      name: "SG90 Micro Servo Motor",
      description: "Popular SG90 micro servo motor. 180° rotation, plastic gears, ideal for robotics projects, camera gimbals, and small automation. Includes mounting screws and horns.",
      price: 149, originalPrice: 199,
      image: [],
      category: "Motors & Drivers", subCategory: "Servo Motors",
      inStock: true, stockCount: 90,
      bestseller: true, isHot: true,
      keyFeatures: ["180° rotation (0°–180°)", "9g lightweight", "4.8V–6V operation", "Plastic gears", "Includes mounting hardware"],
      specifications: { "Operating Voltage": "4.8V–6V", Weight: "9g", "Stall Torque": "1.8 kg·cm @ 4.8V", Speed: "0.1s / 60° @ 4.8V", Rotation: "180°", Gears: "Plastic" },
      tags: ["#SG90", "#Servo", "#Robot", "#Motor"],
      warranty: "3 Months Warranty",
      averageRating: 4.0, totalReviews: 67, views: 4200,
      date: daysAgo(2).getTime(),
    },
    {
      name: "L293D Motor Driver Shield for Arduino",
      description: "L293D based motor driver shield for Arduino. Drives 4 DC motors or 2 stepper motors simultaneously. Includes all necessary connectors and headers. Stackable design.",
      price: 349, originalPrice: 449,
      image: [],
      category: "Motors & Drivers", subCategory: "DC Motors",
      inStock: true, stockCount: 25,
      isFeatured: true,
      keyFeatures: ["4 DC motor / 2 stepper motor drive", "L293D dual H-bridge", "Stackable shield design", "On-board connectors", "Arduino Uno/Mega compatible"],
      specifications: { Channels: "4 DC motors / 2 steppers", Driver: "L293D × 2", "Motor Voltage": "4.5V–36V", "Current per Channel": "600 mA (peak 1.2A)", Compatibility: "Arduino Uno, Mega" },
      tags: ["#L293D", "#MotorDriver", "#Shield", "#Arduino"],
      warranty: "1 Year Warranty",
      averageRating: 4.3, totalReviews: 31, views: 1600,
      date: daysAgo(5).getTime(),
    },
    {
      name: "Jumper Wire Kit (M-M / M-F / F-F) 120pcs",
      description: "Premium Dupont jumper wire kit with 120 pieces. 40 each of Male-to-Male, Male-to-Female, and Female-to-Female. Color-coded for easy identification. Perfect for breadboard prototyping.",
      price: 99, originalPrice: 149,
      image: [],
      category: "Cables & Connectors",
      inStock: true, stockCount: 200,
      isPopular: true,
      keyFeatures: ["120 pieces total", "3 types: M-M, M-F, F-F", "Color-coded wires", "20cm length each", "Durable Dupont connectors"],
      specifications: { Quantity: "120 (40× M-M, 40× M-F, 40× F-F)", Length: "20 cm", Connector: "Dupont 2.54mm pitch", Wire: "28 AWG stranded" },
      tags: ["#JumperWires", "#Dupont", "#Breadboard", "#Prototyping"],
      warranty: "No Warranty (consumable)",
      averageRating: 4.5, totalReviews: 93, views: 6700,
      date: daysAgo(1).getTime(),
    },
    {
      name: "Breadboard 830 Points (Transparent Base)",
      description: "Large 830-point solderless breadboard with transparent base. Self-adhesive backing. 128×70mm work area. Perfect for prototyping circuits without soldering.",
      price: 139, originalPrice: 179,
      image: [],
      category: "Tools & Accessories",
      inStock: true, stockCount: 60,
      bestseller: true,
      keyFeatures: ["830 tie points", "Solderless prototyping", "Self-adhesive backing", "ABS plastic body", "Nickel-silver plated clips"],
      specifications: { Points: "830", "Power Rails": "2 rows on each side", Dimensions: "128×70 mm", Material: "ABS + nickel-silver clips", Backing: "Self-adhesive foam" },
      tags: ["#Breadboard", "#Prototyping", "#Solderless"],
      warranty: "No Warranty (consumable)",
      averageRating: 4.4, totalReviews: 71, views: 3900,
      date: daysAgo(1).getTime(),
    },
  ]);

  console.log("✅ 12 products seeded\n");

  // ═══════════════════════════════════════════════════════════════════
  //  5. BLOG POSTS  —  SKIPPED (no dummy blogs)
  // ═══════════════════════════════════════════════════════════════════
  console.log("── BLOGS ──  (skipped — no dummy blogs to seed)");
  // Blog seeding has been disabled to avoid polluting the storefront with dummy content.
  // Use the admin BlogManager to create real blog posts instead.
  console.log("✅ 0 blog posts seeded\n");

  // ═══════════════════════════════════════════════════════════════════
  //  6. TESTIMONIALS
  // ═══════════════════════════════════════════════════════════════════
  console.log("── TESTIMONIALS ──");
  await Testimonial.deleteMany({});
  await Testimonial.insertMany([
    { name: "Suresh Patil", role: "Hobbyist, Dharwad", text: "Excellent collection of electronic components! I found everything I needed for my Arduino project. The staff was very helpful in recommending the right sensors.", rating: 5, order: 1 },
    { name: "Anita Kulkarni", role: "Engineering Student, Hubli", text: "Best place for robotics components in North Karnataka. Great prices and the quality is top-notch. Highly recommend for students! ✨", rating: 5, order: 2 },
    { name: "Ramesh Hegde", role: "Small Business Owner", text: "I buy bulk components from Amulya for my repair shop. Competitive wholesale pricing and always in stock. Never been disappointed.", rating: 4, order: 3 },
    { name: "Priya Deshmukh", role: "Teacher, Dharwad", text: "Ordered a Raspberry Pi 5 online — delivered next day! Perfect packaging and the product was genuine. Will definitely shop again.", rating: 5, order: 4 },
    { name: "Vikram Joshi", role: "Freelance IoT Developer", text: "Good store for basic electronics but could expand their advanced IC selection. Staff knowledge is decent and they accept orders via WhatsApp.", rating: 4, order: 5 },
  ]);
  console.log("✅ 5 testimonials seeded\n");

  // ═══════════════════════════════════════════════════════════════════
  //  7. HERO BANNERS
  // ═══════════════════════════════════════════════════════════════════
  console.log("── HERO BANNERS ──");
  await heroBannerModel.deleteMany({});
  await heroBannerModel.insertMany([
    {
      badge: "⚡ New Arrivals", title: "Raspberry Pi 5",
      titleAccent: "Now in Stock!", subtitle: "Quad-core 2.4GHz · Up to 8GB RAM · Dual 4K HDMI",
      desc: "The most powerful Raspberry Pi yet — available exclusively at Amulya Electronics.",
      cta: "Shop Now", ctaLink: "/collection/raspberry-pi",
      bg: "from-indigo-900 via-purple-900 to-slate-900",
      accentColor: "text-purple-400", image: "/placeholder-hero.png", order: 1,
    },
    {
      badge: "🔥 Best Seller", title: "Arduino Starter Kit",
      titleAccent: "Limited Edition", subtitle: "Everything you need to start your electronics journey",
      desc: "Includes Uno R3, breadboard, sensors, LEDs, motors, and 30+ components with a project guide.",
      cta: "Get Yours", ctaLink: "/collection/arduino",
      bg: "from-emerald-900 via-teal-900 to-slate-900",
      accentColor: "text-emerald-400", image: "/placeholder-hero.png", order: 2,
    },
    {
      badge: "🌿 Smart Living", title: "Home Automation",
      titleAccent: "Made Easy", subtitle: "Control your home from anywhere",
      desc: "ESP32-based automation kits with voice control, smartphone app, and smart switches.",
      cta: "Explore", ctaLink: "/collection/home-automation",
      bg: "from-orange-900 via-rose-900 to-slate-900",
      accentColor: "text-orange-400", image: "/placeholder-hero.png", order: 3,
    },
  ]);
  console.log("✅ 3 hero banners seeded\n");

  // ═══════════════════════════════════════════════════════════════════
  //  8. SHOWCASE BANNERS
  // ═══════════════════════════════════════════════════════════════════
  console.log("── SHOWCASE BANNERS ──");
  await showcaseBannerModel.deleteMany({});
  await showcaseBannerModel.insertMany([
    {
      title: "🚀 IoT Project Essentials",
      subtitle: "Everything you need to build connected devices — ESP32, sensors, relays, and more. Start your IoT journey today!",
      cta: "Browse IoT Components", link: "/collection/esp32",
      image: "/placeholder-banner.jpg", overlay: "from-slate-900/85 via-slate-900/50 to-transparent", order: 1,
    },
    {
      title: "🔧 Maker's Tool Kit",
      subtitle: "Soldering stations, multimeters, oscilloscopes, and precision tools for every maker's workshop.",
      cta: "Shop Tools", link: "/collection/tools",
      image: "/placeholder-banner.jpg", overlay: "from-slate-900/85 via-slate-900/50 to-transparent", order: 2,
    },
    {
      title: "🎓 Student Discount Program",
      subtitle: "Special pricing for engineering and polytechnic students. Show your ID card and save 10% on all components!",
      cta: "Learn More", link: "/student-offer",
      image: "/placeholder-banner.jpg", overlay: "from-indigo-900/85 via-indigo-900/50 to-transparent", order: 3,
    },
  ]);
  console.log("✅ 3 showcase banners seeded\n");

  // ═══════════════════════════════════════════════════════════════════
  //  9. PROJECTS
  // ═══════════════════════════════════════════════════════════════════
  console.log("── PROJECTS ──");
  await Project.deleteMany({});
  await Project.insertMany([
    { title: "Smart Plant Watering System", description: "Automatic plant watering system using Arduino, soil moisture sensor, and a water pump. Sends alerts to your phone when soil is dry.", img: "", cat: "IoT", date: "2026-05-20", link: "/project/smart-plant-watering", order: 1 },
    { title: "Home Security with ESP32-CAM", description: "Build a WiFi-enabled security camera using ESP32-CAM. Motion detection, photo capture, and email alerts — all for under ₹1,000.", img: "", cat: "Security", date: "2026-05-15", link: "/project/esp32-cam-security", order: 2 },
    { title: "Weather Station with OLED Display", description: "DIY weather station using DHT22, BMP180 sensors, and an OLED display. Shows temperature, humidity, and barometric pressure.", img: "", cat: "IoT", date: "2026-05-10", link: "/project/weather-station", order: 3 },
    { title: "Line Following Robot", description: "Autonomous line-following robot using Arduino Uno, IR sensors, and L293D motor driver. Great robotics project for beginners.", img: "", cat: "Robotics", date: "2026-04-28", link: "/project/line-following-robot", order: 4 },
  ]);
  console.log("✅ 4 projects seeded\n");

  // ═══════════════════════════════════════════════════════════════════
  //  10. USERS (test accounts)
  // ═══════════════════════════════════════════════════════════════════
  console.log("── USERS ──");
  await userModel.deleteMany({});
  // note: password hashing is done in the controller, so we just store
  // a placeholder hash. For login testing, use the test-admin account
  // via the admin panel (email is test@amulya.com).
  const createdUsers = await userModel.create([
    {
      name: "Test Admin", email: "test@amulya.com",
      authProvider: "local",
      password: "$2a$10$bjQFmjKPTp5mERzjUSKEXel.LcJQh4yDTR93hVblAQ2NkO0qzfI6.",
      role: "admin", isVerified: true,
      phone: "9876543210",
      date: Date.now(),
    },
    {
      name: "Rahul Sharma", email: "rahul@gmail.com",
      authProvider: "local",
      password: "$2a$10$bjQFmjKPTp5mERzjUSKEXel.LcJQh4yDTR93hVblAQ2NkO0qzfI6.",
      role: "customer", isVerified: true,
      phone: "8765432109",
      addresses: [{ fullName: "Rahul Sharma", phone: "8765432109", street: "123 MG Road", city: "Dharwad", state: "Karnataka", pincode: "580001", isDefault: true }],
      date: Date.now(),
    },
    {
      name: "Pooja Desai", email: "pooja@yahoo.com",
      authProvider: "local",
      password: "$2a$10$bjQFmjKPTp5mERzjUSKEXel.LcJQh4yDTR93hVblAQ2NkO0qzfI6.",
      role: "customer", isVerified: true,
      phone: "7654321098",
      addresses: [{ fullName: "Pooja Desai", phone: "7654321098", street: "456 Lamington Road", city: "Hubli", state: "Karnataka", pincode: "580020", isDefault: true }],
      date: Date.now(),
    },
    {
      name: "Vikram Jadhav", email: "vikram.jadhav@gmail.com",
      authProvider: "local",
      password: "$2a$10$bjQFmjKPTp5mERzjUSKEXel.LcJQh4yDTR93hVblAQ2NkO0qzfI6.",
      role: "customer", isVerified: true,
      phone: "9988776655",
      addresses: [{ fullName: "Vikram Jadhav", phone: "9988776655", street: "789 College Road", city: "Belgaum", state: "Karnataka", pincode: "590001", isDefault: true }],
      date: Date.now(),
    },
    {
      name: "Shweta Patil", email: "shweta.patil@outlook.com",
      authProvider: "local",
      password: "$2a$10$bjQFmjKPTp5mERzjUSKEXel.LcJQh4yDTR93hVblAQ2NkO0qzfI6.",
      role: "customer", isVerified: true,
      phone: "8877665544",
      addresses: [{ fullName: "Shweta Patil", phone: "8877665544", street: "22 Market Lane", city: "Dharwad", state: "Karnataka", pincode: "580004", isDefault: true }],
      date: Date.now(),
    },
    {
      name: "Arun Kumar", email: "arun.kumar@rediffmail.com",
      authProvider: "local",
      password: "$2a$10$bjQFmjKPTp5mERzjUSKEXel.LcJQh4yDTR93hVblAQ2NkO0qzfI6.",
      role: "customer", isVerified: true,
      phone: "7766554433",
      addresses: [{ fullName: "Arun Kumar", phone: "7766554433", street: "55 Gandhi Nagar", city: "Hubli", state: "Karnataka", pincode: "580030", isDefault: true }],
      date: Date.now(),
    },
    {
      name: "Meena Iyer", email: "meena.iyer@gmail.com",
      authProvider: "local",
      password: "$2a$10$bjQFmjKPTp5mERzjUSKEXel.LcJQh4yDTR93hVblAQ2NkO0qzfI6.",
      role: "customer", isVerified: true,
      phone: "6655443322",
      addresses: [{ fullName: "Meena Iyer", phone: "6655443322", street: "12 Lake View Apartments", city: "Dharwad", state: "Karnataka", pincode: "580008", isDefault: true }],
      date: Date.now(),
    },
  ]);
  const adminUser = createdUsers[0];
  const rahul     = createdUsers[1];
  const pooja     = createdUsers[2];
  const vikram    = createdUsers[3];
  const shweta    = createdUsers[4];
  const arun      = createdUsers[5];
  const meena     = createdUsers[6];
  console.log("✅ 3 users seeded\n");

  // ═══════════════════════════════════════════════════════════════════
  //  11. CONTACTS (dummy inquiries)
  // ═══════════════════════════════════════════════════════════════════
  console.log("── CONTACTS ──");
  await contactModel.deleteMany({});
  await contactModel.insertMany([
    { name: "Ravi Patil", email: "ravi.patil@gmail.com", phone: "9876543210", subject: "Product Inquiry", message: "Hi, I'm looking for a 5kW solar inverter for my home. Do you have any in stock? Also, what is the warranty period?", status: "new", createdAt: daysAgo(0) },
    { name: "Sneha Kulkarni", email: "sneha.k@yahoo.com", phone: "8765432109", subject: "Installation Support", message: "We recently purchased a CCTV system from your store. One of the cameras stopped working. Can you send someone to check?", status: "new", createdAt: daysAgo(1) },
    { name: "Anil Hegde", email: "anil.hegde@outlook.com", phone: "7654321098", subject: "Bulk Order", message: "I run an electronics shop in Hubli. Can you share a wholesale price list for MCBs, wire cables, and switches?", status: "replied", createdAt: daysAgo(2) },
    { name: "Priya Desai", email: "priya.desai@gmail.com", phone: "", subject: "Returns & Refund", message: "I ordered a table fan but received a damaged product. Please initiate a return and refund.", status: "read", createdAt: daysAgo(3) },
    { name: "Mahesh Joshi", email: "mahesh.joshi@rediffmail.com", phone: "9988776655", subject: "Technical Support", message: "My UPS is beeping continuously. I bought it from your store 6 months ago. Is it covered under warranty?", status: "replied", createdAt: daysAgo(5) },
    { name: "Kavita Rao", email: "kavita.rao@gmail.com", phone: "8877665544", subject: "Product Availability", message: "Do you sell solar water heaters? I need one for a 3-person household.", status: "new", createdAt: daysAgo(7) },
    { name: "Vikram Shetty", email: "vikram.shetty@gmail.com", phone: "7766554433", subject: "Feedback", message: "Excellent service! Very happy with my home automation kit purchase. Keep it up!", status: "read", createdAt: daysAgo(10) },
    { name: "Lata Naik", email: "lata.naik@hotmail.com", phone: "6655443322", subject: "Express Delivery Request", message: "I need an emergency inverter battery delivered today. I have medical equipment that needs power backup.", status: "new", createdAt: daysAgo(12) },
  ]);
  console.log("✅ 8 contacts seeded\n");

  // ═══════════════════════════════════════════════════════════════════
  //  12. ORDERS (dummy orders linked to customers)
  // ═══════════════════════════════════════════════════════════════════
  console.log("── ORDERS ──");
  await Order.deleteMany({});

  const orderItems = {
    arduinoKit: [
      { productId: "prod_arduino_uno", name: "Arduino Uno R3", price: 699, mrp: 899, quantity: 1, subcat: "Arduino Boards" },
      { productId: "prod_jumper_wires", name: "Jumper Wire Kit (120pcs)", price: 99, mrp: 149, quantity: 2, subcat: "Cables" },
      { productId: "prod_breadboard", name: "Breadboard 830 Points", price: 139, mrp: 179, quantity: 1, subcat: "Tools" },
    ],
    esp32Project: [
      { productId: "prod_esp32", name: "ESP32 Dev Board WiFi+BT", price: 549, mrp: 699, quantity: 2, subcat: "ESP32" },
      { productId: "prod_dht22", name: "DHT22 Sensor Module", price: 199, mrp: 249, quantity: 1, subcat: "Sensors" },
    ],
    displayOrder: [
      { productId: "prod_oled", name: "0.96\" OLED Display 128×64", price: 249, mrp: 299, quantity: 3, subcat: "Displays" },
    ],
    sensorKit: [
      { productId: "prod_hcsr04", name: "HC-SR04 Ultrasonic Sensor", price: 89, mrp: 129, quantity: 5, subcat: "Sensors" },
      { productId: "prod_mq135", name: "MQ-135 Air Quality Sensor", price: 149, mrp: 179, quantity: 2, subcat: "Sensors" },
      { productId: "prod_jumper_wires", name: "Jumper Wire Kit (120pcs)", price: 99, mrp: 149, quantity: 1, subcat: "Cables" },
    ],
    servoMotors: [
      { productId: "prod_sg90", name: "SG90 Micro Servo Motor", price: 149, mrp: 199, quantity: 4, subcat: "Motors" },
    ],
    rpiKit: [
      { productId: "prod_rpi5", name: "Raspberry Pi 5 (4GB)", price: 5499, mrp: 5999, quantity: 1, subcat: "Raspberry Pi" },
      { productId: "prod_oled", name: "0.96\" OLED Display 128×64", price: 249, mrp: 299, quantity: 1, subcat: "Displays" },
    ],
  };

  const calcSubtotal = (items) => items.reduce((s, i) => s + i.price * i.quantity, 0);
  const calcMrpTotal = (items) => items.reduce((s, i) => s + i.mrp * i.quantity, 0);

  const mkOrder = (user, items, overrides = {}) => {
    const subtotal = calcSubtotal(items);
    const mrpTotal = calcMrpTotal(items);
    const deliveryCharge = subtotal >= 499 ? 0 : 49;
    const grandTotal = subtotal + deliveryCharge;
    const savedAmount = mrpTotal - subtotal;
    return {
      userId: user._id,
      items,
      billing: {
        firstName: user.name.split(' ')[0] || user.name,
        lastName:  user.name.split(' ').slice(1).join(' ') || '',
        email:     user.email,
        phone:     user.phone || '9876543210',
        address:   user.addresses?.[0]?.street || '123 Main Street',
        city:      user.addresses?.[0]?.city || 'Dharwad',
        state:     user.addresses?.[0]?.state || 'Karnataka',
        pincode:   user.addresses?.[0]?.pincode || '580001',
        country:   'India',
      },
      payment: {
        method: overrides.paymentMethod || 'cod',
        status: overrides.paymentStatus || 'paid',
        ...(overrides.razorpayOrderId ? { razorpayOrderId: overrides.razorpayOrderId, razorpayPaymentId: 'pay_' + Math.random().toString(36).slice(2,10), razorpaySignature: 'sig_' + Math.random().toString(36).slice(2,18) } : {}),
        ...(overrides.paymentStatus === 'paid' ? { paidAt: overrides.createdAt || new Date() } : {}),
      },
      delivery: {
        name:   'Standard Delivery',
        method: overrides.deliveryMethod || 'standard',
        charge: deliveryCharge,
      },
      subtotal,
      mrpTotal,
      deliveryCharge,
      grandTotal,
      savedAmount,
      discountOnMrp: mrpTotal - subtotal,
      status: overrides.status || 'delivered',
      orderNumber: overrides.orderNumber || `AE-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.random().toString(36).slice(2,6).toUpperCase()}`,
      statusHistory: [
        { status: 'placed',     message: 'Order placed successfully',                at: overrides.createdAt ? new Date(overrides.createdAt.getTime() - 3600000) : new Date(Date.now() - 86400000) },
        { status: 'confirmed',  message: 'Payment confirmed',                         at: overrides.createdAt ? new Date(overrides.createdAt.getTime() - 1800000) : new Date(Date.now() - 43200000) },
        { status: 'processing', message: 'Order is being prepared',                   at: overrides.createdAt ? new Date(overrides.createdAt.getTime() - 600000) : new Date(Date.now() - 14400000) },
        ...(overrides.status !== 'placed' && overrides.status !== 'confirmed'
          ? [{ status: overrides.status === 'shipped' ? 'shipped' : overrides.status === 'delivered' ? 'shipped' : 'delivered',
               message: overrides.status === 'shipped' ? 'Package shipped via Delhivery' : 'Package shipped via Delhivery',
               at: overrides.createdAt || new Date(Date.now() - 7200000) }]
          : []),
        ...(overrides.status === 'delivered'
          ? [{ status: 'delivered', message: 'Package delivered successfully', at: overrides.createdAt || new Date(Date.now() - 3600000) }]
          : []),
      ],
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: overrides.createdAt || new Date(),
    };
  };

  const ordersData = [
    // ── Rahul Sharma: 4 orders (2 COD, 2 Razorpay) ──
    mkOrder(rahul, orderItems.arduinoKit, {
      status: 'delivered', paymentMethod: 'cod', paymentStatus: 'paid',
      createdAt: daysAgo(45), orderNumber: 'AE-20260419-XK7M',
    }),
    mkOrder(rahul, orderItems.esp32Project, {
      status: 'delivered', paymentMethod: 'razorpay', paymentStatus: 'paid',
      createdAt: daysAgo(30), orderNumber: 'AE-20260504-PL9R',
      razorpayOrderId: 'order_' + Math.random().toString(36).slice(2,14),
    }),
    mkOrder(rahul, orderItems.servoMotors, {
      status: 'shipped', paymentMethod: 'cod', paymentStatus: 'paid',
      createdAt: daysAgo(7), orderNumber: 'AE-20260527-QW3B',
    }),
    mkOrder(rahul, orderItems.sensorKit, {
      status: 'placed', paymentMethod: 'razorpay', paymentStatus: 'paid',
      createdAt: daysAgo(1), orderNumber: 'AE-20260602-VN8H',
      razorpayOrderId: 'order_' + Math.random().toString(36).slice(2,14),
    }),
    // ── Pooja Desai: 2 orders (1 COD, 1 Razorpay) ──
    mkOrder(pooja, orderItems.displayOrder, {
      status: 'delivered', paymentMethod: 'cod', paymentStatus: 'paid',
      createdAt: daysAgo(20), orderNumber: 'AE-20260514-TF2G',
    }),
    mkOrder(pooja, orderItems.rpiKit, {
      status: 'processing', paymentMethod: 'razorpay', paymentStatus: 'paid',
      createdAt: daysAgo(3), orderNumber: 'AE-20260531-HD4J',
      razorpayOrderId: 'order_' + Math.random().toString(36).slice(2,14),
    }),
    // ── Vikram Jadhav: 3 orders (2 Razorpay, 1 Pickup) ──
    mkOrder(vikram, [
      { productId: 'prod_l293d', name: 'L293D Motor Driver Shield', price: 349, mrp: 449, quantity: 1, subcat: 'Motors' },
      { productId: 'prod_jumper_wires', name: 'Jumper Wire Kit (120pcs)', price: 99, mrp: 149, quantity: 2, subcat: 'Cables' },
    ], {
      status: 'delivered', paymentMethod: 'razorpay', paymentStatus: 'paid',
      createdAt: daysAgo(25), orderNumber: 'AE-20260509-RT3Y',
      razorpayOrderId: 'order_' + Math.random().toString(36).slice(2,14),
    }),
    mkOrder(vikram, [
      { productId: 'prod_dht22', name: 'DHT22 Sensor Module', price: 199, mrp: 249, quantity: 2, subcat: 'Sensors' },
      { productId: 'prod_hcsr04', name: 'HC-SR04 Ultrasonic Sensor', price: 89, mrp: 129, quantity: 3, subcat: 'Sensors' },
    ], {
      status: 'delivered', paymentMethod: 'razorpay', paymentStatus: 'paid',
      createdAt: daysAgo(15), orderNumber: 'AE-20260519-UJ5K',
      razorpayOrderId: 'order_' + Math.random().toString(36).slice(2,14),
    }),
    mkOrder(vikram, orderItems.arduinoKit, {
      status: 'delivered', paymentMethod: 'cod', paymentStatus: 'paid',
      deliveryMethod: 'pickup',
      createdAt: daysAgo(4), orderNumber: 'AE-20260530-PB8W',
    }),
    // ── Shweta Patil: 1 order (Pickup) ──
    mkOrder(shweta, [
      { productId: 'prod_sg90', name: 'SG90 Micro Servo Motor', price: 149, mrp: 199, quantity: 2, subcat: 'Motors' },
      { productId: 'prod_oled', name: '0.96\" OLED Display 128×64', price: 249, mrp: 299, quantity: 1, subcat: 'Displays' },
    ], {
      status: 'delivered', paymentMethod: 'cod', paymentStatus: 'paid',
      deliveryMethod: 'pickup',
      createdAt: daysAgo(10), orderNumber: 'AE-20260524-LM9N',
    }),
    // ── Arun Kumar: 5 orders (3 COD, 2 Razorpay) ──
    mkOrder(arun, [
      { productId: 'prod_jumper_wires', name: 'Jumper Wire Kit (120pcs)', price: 99, mrp: 149, quantity: 1, subcat: 'Cables' },
    ], {
      status: 'delivered', paymentMethod: 'cod', paymentStatus: 'paid',
      createdAt: daysAgo(60), orderNumber: 'AE-20260404-HJ1V',
    }),
    mkOrder(arun, [
      { productId: 'prod_breadboard', name: 'Breadboard 830 Points', price: 139, mrp: 179, quantity: 2, subcat: 'Tools' },
      { productId: 'prod_jumper_wires', name: 'Jumper Wire Kit (120pcs)', price: 99, mrp: 149, quantity: 1, subcat: 'Cables' },
    ], {
      status: 'delivered', paymentMethod: 'cod', paymentStatus: 'paid',
      createdAt: daysAgo(50), orderNumber: 'AE-20260414-QW9P',
    }),
    mkOrder(arun, [
      { productId: 'prod_lcd16x2', name: '16×2 LCD Display Module', price: 279, mrp: 329, quantity: 1, subcat: 'Displays' },
    ], {
      status: 'delivered', paymentMethod: 'cod', paymentStatus: 'paid',
      createdAt: daysAgo(40), orderNumber: 'AE-20260424-MN6R',
    }),
    mkOrder(arun, [
      { productId: 'prod_arduino_uno', name: 'Arduino Uno R3', price: 699, mrp: 899, quantity: 1, subcat: 'Arduino Boards' },
      { productId: 'prod_dht22', name: 'DHT22 Sensor Module', price: 199, mrp: 249, quantity: 1, subcat: 'Sensors' },
    ], {
      status: 'delivered', paymentMethod: 'razorpay', paymentStatus: 'paid',
      createdAt: daysAgo(20), orderNumber: 'AE-20260514-XC3Z',
      razorpayOrderId: 'order_' + Math.random().toString(36).slice(2,14),
    }),
    mkOrder(arun, [
      { productId: 'prod_esp32', name: 'ESP32 Dev Board WiFi+BT', price: 549, mrp: 699, quantity: 1, subcat: 'ESP32' },
    ], {
      status: 'shipped', paymentMethod: 'razorpay', paymentStatus: 'paid',
      createdAt: daysAgo(5), orderNumber: 'AE-20260529-VK2H',
      razorpayOrderId: 'order_' + Math.random().toString(36).slice(2,14),
    }),
    // ── Meena Iyer: 1 order (Razorpay) ──
    mkOrder(meena, orderItems.rpiKit, {
      status: 'delivered', paymentMethod: 'razorpay', paymentStatus: 'paid',
      createdAt: daysAgo(12), orderNumber: 'AE-20260522-RD6F',
      razorpayOrderId: 'order_' + Math.random().toString(36).slice(2,14),
    }),
  ];

  // Use insertMany to bypass the pre-save hook (orderNumber is already set)
  for (const order of ordersData) {
    await Order.create(order);
  }
  console.log("✅ 6 orders seeded (Rahul: 4, Pooja: 2)\n");

  // ═══════════════════════════════════════════════════════════════════
  //  DONE
  // ═══════════════════════════════════════════════════════════════════
  await mongoose.disconnect();
  console.log("═══════════════════════════════════════════════════════");
  console.log("✅ ALL DATA SEEDED SUCCESSFULLY!");
  console.log("  • 3 Coupons");
  console.log("  • 2 Delivery Rules");
  console.log("  • 7 Categories (with subcategories)");
  console.log("  • 12 Products");
  console.log("  • 4 Blog Posts");
  console.log("  • 5 Testimonials");
  console.log("  • 3 Hero Banners");
  console.log("  • 3 Showcase Banners");
  console.log("  • 4 Projects");
  console.log("  • 7 Users (test-admin, 6 customers)");
  console.log("  • 8 Contacts");
  console.log("  • 16 Orders (Rahul:4, Pooja:2, Vikram:3, Shweta:1, Arun:5, Meena:1)");
  console.log("");
  console.log("🔑 TEST LOGIN:   test@amulya.com  /  test123");
  console.log("═══════════════════════════════════════════════════════");
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ Seed failed:", e.message);
  process.exit(1);
});
