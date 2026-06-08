// ─────────────────────────────────────────────────────────────────────
//  backend/scripts/seed-blogs.js
//  Run with:  node scripts/seed-blogs.js
//  Seeds 15 blog posts — 5 per category (Blog, Project, News Updates)
//  with proper SEO-friendly content for Google ranking.
// ─────────────────────────────────────────────────────────────────────
import mongoose from "mongoose";
import blogModel from "../models/blogModel.js";

const MONGO_URI = "mongodb://127.0.0.1:27017/ecom";
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.getTime();
};

// ─── CATEGORY 1: "Blog" (tutorials, guides, how-tos) ─────────────────
const BLOG_POSTS = [
  {
    title: "Getting Started with Arduino: A Beginner's Guide to Electronics",
    slug: "getting-started-with-arduino-beginners-guide",
    description:
      "Learn everything you need to know to start your Arduino journey — from choosing the right board to writing your first program and building real projects.",
    content: `<p>Arduino is the world's most popular open-source electronics platform. Whether you're a student, hobbyist, or professional, Arduino makes it easy to bring your electronic projects to life. This comprehensive guide will walk you through everything you need to get started.</p>

<h2>What is Arduino?</h2>
<p>Arduino is an open-source electronics platform based on easy-to-use hardware and software. Arduino boards can read inputs — light on a sensor, a finger on a button, or a Twitter message — and turn them into outputs — activating a motor, turning on an LED, or publishing something online.</p>

<h2>Choosing Your First Arduino Board</h2>
<p>For beginners, we recommend the <strong>Arduino Uno R3</strong>. It's the most documented board with the largest community. Features include 14 digital I/O pins, 6 analog inputs, and a USB connection for programming.</p>

<h2>What You'll Need to Start</h2>
<ul>
<li><strong>Arduino Uno R3 board</strong> — available at Amulya Electronics for just ₹699</li>
<li><strong>USB cable</strong> — Type A to Type B</li>
<li><strong>Breadboard</strong> — 830-point solderless breadboard</li>
<li><strong>Jumper wires</strong> — Male-to-Male and Male-to-Female</li>
<li><strong>LEDs and resistors</strong> — basic components for your first project</li>
</ul>

<h2>Writing Your First Sketch</h2>
<p>Download the Arduino IDE from arduino.cc, install it, and connect your board via USB. Select your board and port from the Tools menu. Let's write the classic Blink sketch:</p>

<p><strong>void setup() {</strong><br />
pinMode(LED_BUILTIN, OUTPUT);<br />
<strong>}</strong></p>

<p><strong>void loop() {</strong><br />
digitalWrite(LED_BUILTIN, HIGH);<br />
delay(1000);<br />
digitalWrite(LED_BUILTIN, LOW);<br />
delay(1000);<br />
<strong>}</strong></p>

<p>Upload this sketch and watch the built-in LED blink at 1-second intervals. Congratulations — you've just programmed your first microcontroller!</p>

<h2>Next Steps</h2>
<p>Once you've mastered the basics, explore sensors (DHT22 for temperature, HC-SR04 for distance), displays (OLED 128×64), and motor drivers (L293D). Visit Amulya Electronics in Dharwad or shop online for all your components.</p>`,
    image: "",
    category: "Blog",
    tags: ["Arduino", "Beginners", "Tutorial", "Electronics", "Maker"],
    author: "Amulya Electronics Team",
    published: true,
    views: 1520,
    date: daysAgo(2),
  },
  {
    title: "ESP32 vs Arduino: Which Microcontroller Should You Choose?",
    slug: "esp32-vs-arduino-which-microcontroller-to-choose",
    description:
      "A detailed comparison between ESP32 and Arduino boards to help you pick the right microcontroller for your next IoT or electronics project.",
    content: `<p>Choosing between ESP32 and Arduino can be confusing, especially for beginners. Both platforms have their strengths, and the right choice depends entirely on your project requirements. This guide breaks down the differences to help you decide.</p>

<h2>Arduino: The Beginner-Friendly Choice</h2>
<p>Arduino boards are perfect for beginners, simple automation projects, and applications where battery life matters more than connectivity. The Arduino Uno R3 (₹699) is the most popular board worldwide.</p>
<p><strong>Best for:</strong> Learning electronics, simple sensors, LED projects, basic robotics.</p>

<h2>ESP32: The IoT Powerhouse</h2>
<p>The ESP32 development board (₹549) features built-in WiFi and Bluetooth, dual-core processing, and lower power consumption. It's ideal for IoT applications, smart home devices, and wireless sensor networks.</p>
<p><strong>Best for:</strong> IoT projects, home automation, WiFi-controlled devices, Bluetooth applications.</p>

<h2>Quick Comparison</h2>
<ul>
<li><strong>Price:</strong> Arduino Uno (₹699) vs ESP32 (₹549) — ESP32 is more affordable</li>
<li><strong>Connectivity:</strong> Arduino has none built-in; ESP32 has WiFi + Bluetooth</li>
<li><strong>Processing:</strong> Arduino runs at 16MHz; ESP32 at 240MHz dual-core</li>
<li><strong>Ease of use:</strong> Arduino is more beginner-friendly with larger community</li>
<li><strong>Power consumption:</strong> Arduino uses ~50mA; ESP32 uses ~80mA with WiFi on</li>
</ul>

<h2>Our Recommendation</h2>
<p>Start with Arduino if you're a complete beginner. Once you're comfortable, move to ESP32 for wireless projects. Many enthusiasts keep both on hand! Shop both at Amulya Electronics — we stock Arduino Uno R3, ESP32 Dev Boards, and all accessories.</p>`,
    image: "",
    category: "Blog",
    tags: ["ESP32", "Arduino", "Comparison", "IoT", "Microcontroller"],
    author: "Amulya Electronics Team",
    published: true,
    views: 980,
    date: daysAgo(5),
  },
  {
    title: "Understanding Electronic Components: A Complete Guide for Beginners",
    slug: "understanding-electronic-components-complete-guide",
    description:
      "A comprehensive guide to basic electronic components — resistors, capacitors, diodes, transistors, and sensors — and how to use them in your projects.",
    content: `<p>Electronic components are the building blocks of every circuit. Whether you're repairing a device or building a new project, understanding these fundamental components is essential. This guide covers the most common components you'll encounter.</p>

<h2>Resistors</h2>
<p>Resistors limit the flow of electric current. They're measured in ohms (Ω) and come with color-coded bands that indicate their value. Common values include 220Ω, 1kΩ, and 10kΩ. Use resistors to protect LEDs and set current levels in your circuits.</p>

<h2>Capacitors</h2>
<p>Capacitors store and release electrical energy. They're used for filtering, timing, and power supply smoothing. Common types include ceramic (small values) and electrolytic (large values up to 1000µF).</p>

<h2>Diodes</h2>
<p>Diodes allow current to flow in only one direction. The 1N4007 is a standard rectifier diode, while LEDs (Light Emitting Diodes) produce light when current flows through them.</p>

<h2>Transistors</h2>
<p>Transistors act as switches or amplifiers. The BC547 (NPN) and BC557 (PNP) are common general-purpose transistors used in countless projects.</p>

<h2>Sensors</h2>
<p>Sensors detect environmental changes. Popular sensors at Amulya Electronics include:</p>
<ul>
<li><strong>DHT22</strong> — Temperature and humidity (₹199)</li>
<li><strong>HC-SR04</strong> — Ultrasonic distance sensor (₹89)</li>
<li><strong>MQ-135</strong> — Air quality sensor (₹149)</li>
<li><strong>PIR Motion Sensor</strong> — Motion detection</li>
</ul>

<h2>Where to Buy Components in Dharwad</h2>
<p>Amulya Electronics in Dharwad stocks all these components and more. Visit our store or shop online for genuine, quality components at the best prices.</p>`,
    image: "",
    category: "Blog",
    tags: ["Electronics", "Components", "Tutorial", "Resistors", "Sensors"],
    author: "Amulya Electronics Team",
    published: true,
    views: 740,
    date: daysAgo(8),
  },
  {
    title: "How to Choose the Right Power Supply for Your Electronics Project",
    slug: "choose-right-power-supply-electronics-project",
    description:
      "A practical guide to selecting power supplies for your electronics projects — including voltage, current, and safety considerations for Arduino, ESP32, and more.",
    content: `<p>Choosing the right power supply is critical for any electronics project. An incorrect power supply can damage your components or cause your project to malfunction. This guide covers everything you need to know.</p>

<h2>Understanding Voltage and Current</h2>
<p>Every electronic component requires a specific voltage to operate. Arduino Uno runs on 5V, ESP32 on 3.3V, and most sensors work with either. Current (measured in amps) is drawn by the circuit as needed — the power supply must be able to provide at least that much current.</p>

<h2>Types of Power Supplies</h2>
<ul>
<li><strong>USB power</strong> — 5V, up to 2.4A. Great for Arduino and ESP32 boards</li>
<li><strong>Wall adapters (SMPS)</strong> — Available in 5V, 9V, 12V, 24V. Widely used for projects</li>
<li><strong>Battery packs</strong> — 18650 lithium cells, 9V batteries, or AA packs for portable projects</li>
<li><strong>Solar panels + charge controllers</strong> — For outdoor and off-grid projects</li>
</ul>

<h2>Power Requirements for Common Boards</h2>
<p>Arduino Uno R3: 5V, ~50mA (up to 500mA with shields)<br />
ESP32 Dev Board: 3.3V, ~80mA (up to 500mA with WiFi on)<br />
Raspberry Pi 5: 5V, 3A (requires quality power supply)<br />
Servo Motor SG90: 4.8V–6V, up to 750mA under load</p>

<h2>Safety Tips</h2>
<p>Always use a power supply with voltage matching your circuit's requirements. The current rating should be equal to or greater than what your circuit draws. Use a multimeter to verify voltage before connecting. Add a fuse for protection in high-power projects.</p>

<p>Visit Amulya Electronics in Dharwad for a wide range of power supplies, batteries, and solar products. Our team can help you select the right power solution for your project.</p>`,
    image: "",
    category: "Blog",
    tags: ["Power Supply", "Electronics", "Tutorial", "SMPS", "Battery"],
    author: "Amulya Electronics Team",
    published: true,
    views: 620,
    date: daysAgo(12),
  },
  {
    title: "Top 10 Arduino Projects for Engineering Students in 2026",
    slug: "top-10-arduino-projects-engineering-students-2026",
    description:
      "Discover 10 exciting Arduino projects perfect for engineering students — from smart home automation to robotics, with component lists available at Amulya Electronics.",
    content: `<p>Engineering students looking for practical projects to build their skills will find these Arduino projects both challenging and rewarding. Each project uses components available at Amulya Electronics in Dharwad.</p>

<h2>1. Smart Plant Watering System</h2>
<p>Use a soil moisture sensor and a water pump to automatically water your plants. Components: Arduino Uno, soil moisture sensor, relay module, mini water pump.</p>

<h2>2. Home Security System with ESP32-CAM</h2>
<p>Build a WiFi-enabled security camera that sends alerts when motion is detected. Components: ESP32-CAM, PIR sensor, buzzer.</p>

<h2>3. Weather Station with OLED Display</h2>
<p>Display temperature, humidity, and pressure on an OLED screen. Components: Arduino Uno, DHT22, BMP180, OLED 128×64.</p>

<h2>4. Line Following Robot</h2>
<p>Build an autonomous robot that follows a black line on a white surface. Components: Arduino Uno, L293D motor driver, IR sensors, DC motors.</p>

<h2>5. Bluetooth Controlled Car</h2>
<p>Control a robot car using your smartphone via Bluetooth. Components: Arduino Uno, HC-05 Bluetooth module, L293D, motors, chassis.</p>

<h2>6. Smart Energy Meter</h2>
<p>Monitor your home's energy consumption in real-time. Components: Arduino, current sensor (ACS712), voltage sensor, OLED display.</p>

<h2>7. RFID Door Lock System</h2>
<p>Secure access control using RFID cards. Components: Arduino Uno, RC522 RFID module, servo motor, buzzer.</p>

<h2>8. Digital Thermometer with Logging</h2>
<p>Log temperature data to an SD card. Components: Arduino, DHT22, DS3231 RTC module, SD card module.</p>

<h2>9. Ultrasonic Radar System</h2>
<p>Create a radar-like display using an ultrasonic sensor and servo. Components: Arduino, HC-SR04, servo motor, processing IDE.</p>

<h2>10. IoT Air Quality Monitor</h2>
<p>Monitor air quality and publish data to the cloud. Components: ESP32, MQ-135 sensor, DHT22, OLED display.</p>

<p>All components are available at Amulya Electronics — visit our store or shop online for quick delivery across India!</p>`,
    image: "",
    category: "Blog",
    tags: ["Arduino", "Projects", "Engineering", "IoT", "DIY"],
    author: "Amulya Electronics Team",
    published: true,
    views: 1850,
    date: daysAgo(1),
  },
];

// ─── CATEGORY 2: "Project" (real-world builds & case studies) ─────────
const PROJECT_POSTS = [
  {
    title: "DIY Smart Home Automation System Using ESP32 — Complete Project Guide",
    slug: "diy-smart-home-automation-esp32-complete-guide",
    description:
      "Build your own smart home automation system using ESP32 microcontroller. Control lights, fans, and appliances from your smartphone — full step-by-step guide with code.",
    content: `<p>Smart home automation doesn't have to be expensive. With an ESP32 microcontroller and a few relays, you can build a complete home automation system controllable from your phone. This project costs under ₹1,500 and is perfect for beginners.</p>

<h2>Components Required</h2>
<ul>
<li>ESP32 Development Board — ₹549</li>
<li>4-Channel Relay Module (5V) — ₹299</li>
<li>Jumper Wires (M-M, M-F) — ₹99</li>
<li>5V 2A Power Supply — ₹249</li>
<li>Smartphone with WiFi</li>
</ul>

<h2>Circuit Connections</h2>
<p>Connect the relay module to the ESP32 as follows:<br />
Relay IN1 → GPIO 26<br />
Relay IN2 → GPIO 27<br />
Relay IN3 → GPIO 14<br />
Relay IN4 → GPIO 12<br />
Relay VCC → ESP32 5V<br />
Relay GND → ESP32 GND</p>

<h2>Programming the ESP32</h2>
<p>Install the ESP32 board package in Arduino IDE, then upload our web server code. The ESP32 creates a WiFi access point and serves a control panel. You can connect to it from any browser on your phone or computer.</p>

<h2>Testing</h2>
<p>Once programmed, connect to the ESP32's WiFi network (SSID: SmartHome), open 192.168.4.1 in your browser, and you'll see toggle switches for each relay. Tap to control your appliances!</p>

<h2>Expanding the System</h2>
<p>Add more relays for additional appliances, integrate with Google Assistant or Alexa using IFTTT, or add sensors for automatic control based on temperature or motion.</p>

<p>All components are available at Amulya Electronics in Dharwad. Visit us or order online!</p>`,
    image: "",
    category: "Project",
    tags: ["ESP32", "Home Automation", "IoT", "DIY", "Project"],
    author: "Amulya Electronics Team",
    published: true,
    views: 3200,
    date: daysAgo(3),
  },
  {
    title: "Building a Weather Station with Arduino, DHT22, and OLED Display",
    slug: "weather-station-arduino-dht22-oled-display",
    description:
      "A step-by-step project guide to build your own digital weather station using Arduino Uno, DHT22 sensor, and OLED display — perfect for learning sensors and displays.",
    content: `<p>Building a weather station is one of the most rewarding Arduino projects. You'll learn how to read sensor data, drive an OLED display, and package everything into a neat desktop gadget.</p>

<h2>What You'll Need</h2>
<ul>
<li>Arduino Uno R3 — ₹699</li>
<li>DHT22 Temperature & Humidity Sensor — ₹199</li>
<li>BMP180 Barometric Pressure Sensor — ₹249</li>
<li>0.96" OLED Display 128×64 (I2C) — ₹249</li>
<li>Breadboard + Jumper Wires — ₹238</li>
<li>USB power supply</li>
</ul>

<h2>How It Works</h2>
<p>The DHT22 sensor measures temperature (-40°C to 80°C, ±0.5°C accuracy) and humidity (0–100%, ±2%). The BMP180 measures barometric pressure. Both communicate over a single-wire digital interface. The OLED display shows all readings on a crisp, bright screen.</p>

<h2>Wiring</h2>
<p>DHT22 Data → Pin 7<br />
BMP180 SDA → A4, SCL → A5<br />
OLED SDA → A4, SCL → A5 (shared I2C bus)<br />
All VCC → 5V, GND → GND</p>

<h2>The Code</h2>
<p>Download the DHT22 and Adafruit SSD1306 libraries from the Arduino Library Manager. The code reads all sensors every 2 seconds and updates the display. It shows temperature in °C and °F, humidity percentage, and pressure in hPa.</p>

<h2>Customization Ideas</h2>
<p>Add an RTC module (DS3231) for date/time display, log data to an SD card, or add WiFi with an ESP32 to upload data to the cloud.</p>

<p>Get all components at Amulya Electronics in Dharwad. We stock everything you need for this project!</p>`,
    image: "",
    category: "Project",
    tags: ["Arduino", "Weather Station", "DHT22", "OLED", "Project"],
    author: "Amulya Electronics Team",
    published: true,
    views: 2100,
    date: daysAgo(7),
  },
  {
    title: "How to Build a Line Following Robot with Arduino and IR Sensors",
    slug: "line-following-robot-arduino-ir-sensors",
    description:
      "Build your own autonomous line-following robot using Arduino Uno, IR sensors, and L293D motor driver. Complete guide with circuit diagram, code, and testing tips.",
    content: `<p>Line-following robots are a classic robotics project that teaches you about sensors, motor control, and feedback systems. This robot uses IR sensors to detect a black line on a white surface and adjusts its motors to follow the line.</p>

<h2>Components List</h2>
<ul>
<li>Arduino Uno R3 — ₹699</li>
<li>L293D Motor Driver Shield — ₹349</li>
<li>2 × IR Sensor Modules — ₹180</li>
<li>2 × DC Motors with Wheels — ₹300</li>
<li>Robot Chassis Kit — ₹399</li>
<li>18650 Battery Pack (7.4V) — ₹449</li>
<li>Jumper Wires — ₹99</li>
</ul>

<h2>How Line Following Works</h2>
<p>IR sensors emit infrared light and measure the reflected amount. Black surfaces absorb IR light (low reflection), while white surfaces reflect it (high reflection). By placing two IR sensors side by side, the robot can detect when it's veering off the line and correct its direction.</p>

<h2>Wiring Guide</h2>
<p>Left IR Sensor OUT → Pin 8<br />
Right IR Sensor OUT → Pin 9<br />
Motor Driver → Arduino stackable shield<br />
Battery → Motor driver power input</p>

<h2>The Logic</h2>
<p>Both sensors on white → move forward<br />
Left sensor on black → turn right<br />
Right sensor on black → turn left<br />
Both sensors on black → stop (end of line)</p>

<h2>Testing Your Robot</h2>
<p>Create a track using black electrical tape on a white surface. Start with gentle curves and gradually increase difficulty. Adjust sensor sensitivity using the potentiometer on the IR modules.</p>

<p>All components available at Amulya Electronics in Dharwad. Visit us for robotics workshops and expert guidance!</p>`,
    image: "",
    category: "Project",
    tags: ["Robot", "Arduino", "Line Follower", "IR Sensor", "Motor Driver"],
    author: "Amulya Electronics Team",
    published: true,
    views: 2800,
    date: daysAgo(10),
  },
  {
    title: "ESP32-CAM Security Camera Project — Motion Detection with Email Alerts",
    slug: "esp32-cam-security-camera-motion-detection-email",
    description:
      "Build a WiFi-enabled security camera using ESP32-CAM that captures photos on motion detection and sends email alerts — all for under ₹1,000.",
    content: `<p>The ESP32-CAM is one of the most versatile and affordable modules for IoT camera projects. Build a complete motion-activated security camera that captures photos and sends them to your email — all for under ₹1,000.</p>

<h2>Components Needed</h2>
<ul>
<li>ESP32-CAM Module — ₹549</li>
<li>FTDI Programmer (if no USB port) — ₹199</li>
<li>PIR Motion Sensor — ₹149</li>
<li>5V Power Supply — ₹249</li>
<li>Jumper Wires — ₹99</li>
</ul>

<h2>How It Works</h2>
<p>The ESP32-CAM runs a web server that streams video. When the PIR sensor detects motion, the ESP32-CAM captures a photo and sends it via email using an SMTP server (Gmail works well). The camera also records the event timestamp.</p>

<h2>Wiring</h2>
<p>PIR Sensor VCC → ESP32-CAM 3.3V<br />
PIR Sensor GND → GND<br />
PIR Sensor OUT → GPIO 13<br />
ESP32-CAM → FTDI programmer (for initial programming)</p>

<h2>Setting Up Email Alerts</h2>
<p>Configure the ESP32-CAM to use Gmail's SMTP server. Create an app-specific password for security. The code captures a photo when motion is detected, saves it to SPIFFS, and attaches it to an email sent to your address.</p>

<h2>Installation Tips</h2>
<p>Mount the camera in a location where it has a clear view. The PIR sensor works best within 5 meters. Use a weatherproof enclosure for outdoor installation. Power via a USB adapter for reliable 24/7 operation.</p>

<p>Get your ESP32-CAM and all components at Amulya Electronics in Dharwad — your trusted electronics store in North Karnataka!</p>`,
    image: "",
    category: "Project",
    tags: ["ESP32-CAM", "Security", "IoT", "Camera", "Motion Detection"],
    author: "Amulya Electronics Team",
    published: true,
    views: 1900,
    date: daysAgo(14),
  },
  {
    title: "DIY Digital Voltmeter Using Arduino and OLED Display",
    slug: "diy-digital-voltmeter-arduino-oled",
    description:
      "Build your own digital voltmeter with Arduino Uno and OLED display. Measure DC voltages from 0V to 30V with high accuracy — a practical project for electronics enthusiasts.",
    content: `<p>Every electronics enthusiast needs a voltmeter. Building your own digital voltmeter using Arduino is not only cost-effective but also a great learning experience. This project measures DC voltages from 0V to 30V with reasonable accuracy.</p>

<h2>Components Required</h2>
<ul>
<li>Arduino Uno R3 — ₹699</li>
<li>0.96" OLED Display 128×64 — ₹249</li>
<li>Voltage Divider Circuit (2 resistors)</li>
<li>Breadboard + Jumper Wires — ₹238</li>
</ul>

<h2>The Voltage Divider</h2>
<p>Since Arduino's analog input can only measure 0–5V, we need a voltage divider to measure higher voltages. Use a 100kΩ and 10kΩ resistor in series. This divides the input voltage by 11, allowing measurements up to 55V (safe limit: 30V).</p>

<h2>Wiring</h2>
<p>Voltage to measure → 100kΩ resistor → A0 → 10kΩ resistor → GND<br />
OLED SDA → A4, SCL → A5<br />
OLED VCC → 5V, GND → GND</p>

<h2>The Code</h2>
<p>Read the analog value on A0, convert it to voltage (0–5V), multiply by the divider ratio (11), and display on the OLED. Add averaging for stable readings and a battery indicator.</p>

<h2>Calibration</h2>
<p>Use a known voltage source (like a multimeter) to calibrate your voltmeter. Adjust the divider ratio in the code until readings match. For best accuracy, use 1% tolerance resistors.</p>

<h2>Applications</h2>
<p>Monitor battery voltages, test power supplies, check solar panel output, or use it as a panel meter in your projects.</p>

<p>Find all components at Amulya Electronics in Dharwad. We stock precision resistors, OLED displays, and all Arduino accessories!</p>`,
    image: "",
    category: "Project",
    tags: ["Voltmeter", "Arduino", "OLED", "DIY", "Measurement"],
    author: "Amulya Electronics Team",
    published: true,
    views: 1560,
    date: daysAgo(18),
  },
];

// ─── CATEGORY 3: "News Updates" (store news, arrivals, announcements) ─
const NEWS_POSTS = [
  {
    title: "Raspberry Pi 5 Now Available at Amulya Electronics — Full Specifications",
    slug: "raspberry-pi-5-available-amulya-electronics-specifications",
    description:
      "The highly anticipated Raspberry Pi 5 is now in stock at Amulya Electronics in Dharwad. Check out full specifications, pricing, and availability.",
    content: `<p>We're excited to announce that the Raspberry Pi 5 is now available at Amulya Electronics! After months of anticipation, the latest generation of the world's most popular single-board computer has arrived.</p>

<h2>Raspberry Pi 5 Key Specifications</h2>
<ul>
<li><strong>Processor:</strong> Broadcom BCM2712 quad-core Cortex-A76 @ 2.4GHz</li>
<li><strong>RAM Options:</strong> 4GB or 8GB LPDDR4X</li>
<li><strong>Video:</strong> Dual 4K HDMI output (supports dual displays)</li>
<li><strong>USB:</strong> 2× USB 3.0 + 2× USB 2.0</li>
<li><strong>Connectivity:</strong> Gigabit Ethernet, WiFi 5, Bluetooth 5.0</li>
<li><strong>Storage:</strong> microSD card slot + PCIe 2.0 x1 interface for NVMe SSDs</li>
<li><strong>GPIO:</strong> Standard 40-pin header</li>
<li><strong>Power:</strong> 5V/3A via USB-C</li>
</ul>

<h2>Pricing at Amulya Electronics</h2>
<p>Raspberry Pi 5 (4GB): ₹5,499<br />
Raspberry Pi 5 (8GB): ₹6,999<br />
Official 27W USB-C Power Supply: ₹799<br />
Official Case: ₹499</p>

<h2>What's New in Pi 5?</h2>
<p>The Raspberry Pi 5 offers 2–3× the performance of Raspberry Pi 4. The new chip includes a built-in I/O controller that dramatically improves USB and SD card speeds. The dual HDMI outputs support 4K at 60fps on both displays simultaneously.</p>

<h2>Availability</h2>
<p>Visit our store in Dharwad or order online for delivery across India. Limited stock available — grab yours before they sell out!</p>

<p>Amulya Electronics — Dharwad's trusted electronics components store since 2020.</p>`,
    image: "",
    category: "News Updates",
    tags: ["Raspberry Pi", "New Arrival", "Single Board Computer", "News"],
    author: "Amulya Electronics Team",
    published: true,
    views: 890,
    date: daysAgo(1),
  },
  {
    title: "New Store Hours and Services at Amulya Electronics Dharwad — 2026 Update",
    slug: "new-store-hours-services-amulya-electronics-dharwad-2026",
    description:
      "Updated store hours, new repair services, and expanded workshop facilities at Amulya Electronics in Dharwad. Visit us for all your electronics needs.",
    content: `<p>We're pleased to announce updated store hours and new services at Amulya Electronics in Dharwad. We've expanded our facilities to better serve the growing electronics community in North Karnataka.</p>

<h2>Updated Store Hours</h2>
<p><strong>Monday – Saturday:</strong> 9:00 AM – 8:00 PM<br />
<strong>Sunday:</strong> 10:00 AM – 6:00 PM<br />
<strong>Public Holidays:</strong> 10:00 AM – 4:00 PM</p>

<h2>New Services We Offer</h2>
<ul>
<li><strong>Component Testing:</strong> Bring your components in for free testing using our oscilloscopes and multimeters</li>
<li><strong>Soldering Services:</strong> Need something soldered? We do it for ₹50 per joint</li>
<li><strong>Project Consultation:</strong> Not sure which components to buy? Our team can help design your project</li>
<li><strong>Workshop Space:</strong> Use our workshop area with soldering stations, power supplies, and test equipment</li>
<li><strong>Online Order Pickup:</strong> Order online and pick up from our store — no shipping charges</li>
</ul>

<h2>Expanded Product Range</h2>
<p>We've added over 500 new products this year including: Raspberry Pi 5 accessories, advanced sensor modules, robotics kits, drone components, and IoT development boards.</p>

<h2>Student Discount Program</h2>
<p>Engineering and polytechnic students get 10% off on all components. Just show your valid student ID at the counter. We also offer bulk discounts for college projects and labs.</p>

<p>Visit Amulya Electronics — your one-stop shop for electronics in Dharwad. Call us at 8310787546 for any inquiries!</p>`,
    image: "",
    category: "News Updates",
    tags: ["Store Update", "Services", "Dharwad", "Workshop", "News"],
    author: "Amulya Electronics Team",
    published: true,
    views: 450,
    date: daysAgo(6),
  },
  {
    title: "Amulya Electronics Launches Online Store — Free Delivery Above ₹999",
    slug: "amulya-electronics-online-store-launch-free-delivery",
    description:
      "Shop from our complete catalog online with home delivery across India. Free shipping on orders above ₹999. Same-day dispatch in Dharwad.",
    content: `<p>We're thrilled to announce the launch of our new online store! Now you can browse our complete catalog of electronic components, development boards, sensors, and tools from the comfort of your home and get them delivered to your doorstep.</p>

<h2>Online Store Features</h2>
<ul>
<li><strong>Complete product catalog</strong> — over 2,000 products available</li>
<li><strong>Secure checkout</strong> — Pay via Razorpay (UPI, card, netbanking) or Cash on Delivery</li>
<li><strong>Order tracking</strong> — Real-time order status updates</li>
<li><strong>Customer accounts</strong> — Save addresses, track orders, manage returns</li>
<li><strong>Wishlist</strong> — Save products for later</li>
</ul>

<h2>Delivery Information</h2>
<p>Free delivery on orders above ₹999<br />
Standard delivery (4–7 business days): ₹49<br />
Express delivery (1–3 business days): ₹149<br />
Free in-store pickup always available</p>

<h2>Same-Day Dispatch for Dharwad</h2>
<p>Order before 2:00 PM and get your order dispatched the same day. Dharwad residents can also choose same-day delivery for an additional ₹29.</p>

<h2>Exclusive Online Launch Offers</h2>
<ul>
<li>Use code <strong>AMULYA10</strong> for 10% off your first order</li>
<li>Free delivery on orders above ₹999</li>
<li>Free Arduino starter guide with every development board purchase</li>
</ul>

<p>Visit our online store now and experience the convenience of shopping for electronics from Amulya Electronics!</p>`,
    image: "",
    category: "News Updates",
    tags: ["Online Store", "Ecommerce", "Launch", "Delivery", "News"],
    author: "Amulya Electronics Team",
    published: true,
    views: 720,
    date: daysAgo(4),
  },
  {
    title: "Upcoming Robotics Workshop at Amulya Electronics — Register Now!",
    slug: "robotics-workshop-amulya-electronics-register",
    description:
      "Join our hands-on robotics workshop in Dharwad. Learn to build and program line-following and obstacle-avoidance robots. All components provided. Limited seats!",
    content: `<p>Amulya Electronics is organizing a hands-on robotics workshop for students and enthusiasts. This is a fantastic opportunity to learn robotics fundamentals and build your own robot from scratch.</p>

<h2>Workshop Details</h2>
<p><strong>Date:</strong> Saturday, June 20, 2026<br />
<strong>Time:</strong> 10:00 AM – 5:00 PM<br />
<strong>Venue:</strong> Amulya Electronics, Dharwad<br />
<strong>Fee:</strong> ₹999 (includes all components and kit)</p>

<h2>What You'll Learn</h2>
<ul>
<li>Basics of robotics and microcontrollers</li>
<li>Understanding motor drivers (L293D)</li>
<li>Working with IR and ultrasonic sensors</li>
<li>Programming Arduino for robotics</li>
<li>Building a line-following robot</li>
<li>Building an obstacle-avoidance robot</li>
</ul>

<h2>What's Included in the Kit</h2>
<p>Arduino Uno R3, L293D motor driver, 2 × DC motors with wheels, robot chassis, IR sensors, ultrasonic sensor, battery pack, jumper wires, and all accessories — yours to keep after the workshop!</p>

<h2>Who Can Attend</h2>
<p>Students (Class 8 and above), hobbyists, and anyone interested in robotics. No prior experience required. All materials provided.</p>

<h2>How to Register</h2>
<p>Visit our store in Dharwad or call us at 8310787546 to reserve your spot. Limited to 20 participants — register early!</p>

<p>Amulya Electronics — building the maker community in North Karnataka, one workshop at a time.</p>`,
    image: "",
    category: "News Updates",
    tags: ["Workshop", "Robotics", "Event", "Dharwad", "Learning"],
    author: "Amulya Electronics Team",
    published: true,
    views: 340,
    date: daysAgo(9),
  },
  {
    title: "Amulya Electronics Wins 'Best Electronics Retailer' Award 2026",
    slug: "amulya-electronics-best-electronics-retailer-award-2026",
    description:
      "Amulya Electronics has been awarded the 'Best Electronics Retailer in North Karnataka' for 2026. We thank our customers for their continued trust and support.",
    content: `<p>We're proud to announce that Amulya Electronics has been awarded the <strong>Best Electronics Retailer in North Karnataka</strong> for 2026 by the Karnataka Electronics Dealers Association (KEDA).</p>

<h2>A Recognition of Excellence</h2>
<p>This award recognizes our commitment to quality products, competitive pricing, and exceptional customer service. Over the past six years, we've grown from a small components shop to Dharwad's premier electronics destination.</p>

<h2>Why We Won</h2>
<ul>
<li><strong>Genuine products</strong> — 100% authentic components from trusted brands</li>
<li><strong>Competitive pricing</strong> — Best prices guaranteed on all products</li>
<li><strong>Knowledgeable staff</strong> — Our team provides expert guidance for every project</li>
<li><strong>Wide selection</strong> — Over 2,000 products in stock at all times</li>
<li><strong>Community involvement</strong> — Workshops, college sponsorships, and student discounts</li>
</ul>

<h2>Our Journey</h2>
<p>Founded in 2020 in Dharwad, Amulya Electronics has served thousands of customers — from hobbyists and students to professional engineers and businesses. We've expanded our product range, launched an online store, and built a community of makers and innovators.</p>

<h2>Thank You!</h2>
<p>This award belongs to our wonderful customers who have trusted us with their electronics needs. We promise to continue providing the best products, prices, and service. Visit us in Dharwad or shop online!</p>

<p>Amulya Electronics — Dharwad's trusted electronics components store.</p>`,
    image: "",
    category: "News Updates",
    tags: ["Award", "Recognition", "Electronics", "Dharwad", "Achievement"],
    author: "Amulya Electronics Team",
    published: true,
    views: 1250,
    date: daysAgo(15),
  },
];

// ─────────────────────────────────────────────────────────────────────
async function run() {
  console.log("→ Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected\n");

  // Clear existing blogs
  await blogModel.deleteMany({});
  console.log("🗑️  Cleared existing blog posts\n");

  // Insert all 15 blogs
  const allPosts = [...BLOG_POSTS, ...PROJECT_POSTS, ...NEWS_POSTS];
  
  for (const post of allPosts) {
    await blogModel.create(post);
    console.log(`  📝 Created: "${post.title}"`);
  }

  console.log(`\n✅ ${allPosts.length} blog posts seeded successfully!`);
  console.log(`   • Blog: ${BLOG_POSTS.length}`);
  console.log(`   • Project: ${PROJECT_POSTS.length}`);
  console.log(`   • News Updates: ${NEWS_POSTS.length}`);

  await mongoose.disconnect();
  console.log("\n✅ Done! Visit http://localhost:5173/blog to see your blogs.");
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ Failed:", e.message);
  process.exit(1);
});
