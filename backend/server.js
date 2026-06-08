import { fileURLToPath } from 'url'
import { dirname, join, extname } from 'path'
import { mkdirSync, writeFileSync, existsSync } from 'fs'
import multer from 'multer'
import { randomUUID } from 'crypto'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import xss from 'xss-clean'
import hpp from 'hpp'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import userRouter from './routes/userRoute.js'
import productRouter from './routes/productRoute.js'
import cartRouter from './routes/cartRoute.js'
import orderRouter from './routes/orderRoute.js'
import BlogRouter from './routes/blogRouter.js'
import contactRouter from './routes/contactRoute.js'
import footerRouter from './routes/footerRoute.js'
import heroBannerRouter from './routes/heroBannerRoute.js'
import showcaseBannerRouter from './routes/showcaseBannerRoute.js'
import paymentRoutes from './routes/PaymentRouter.js'
import orderRoutes from './routes/OrderRouter.js'
import couponRoutes from "./routes/couponRoutes.js"
import deliveryRoutes from "./routes/deliveryRoutes.js"
import codRoutes from "./routes/codRoutes.js"
import CategoryRoutes from "./routes/categoryRoute.js"
import blogRoutes from "./routes/Blogroutes.js"
import testimonialRoutes from "./routes/Testimonialroutes.js"
import searchRouter from './routes/searchRoute.js'
import projectRoutes from "./routes/projectRoutes.js"
import dashboardRouter from './routes/dashboardRoute.js'
import youtubeVideoRouter from './routes/youtubeVideoRoute.js'

// App Config
const app = express()
const port = process.env.PORT || 10000
connectDB()
// Images stored locally in uploads/ — no Cloudinary needed

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

// ── Ensure upload directories exist ────────────────────────────────────────────
mkdirSync(join(__dirname, 'uploads'),            { recursive: true })
mkdirSync(join(__dirname, 'uploads/avatars'),     { recursive: true })
mkdirSync(join(__dirname, 'uploads/editor-images'), { recursive: true })

// ── Serve uploaded images statically ──────────────────────────────────────────
app.use('/uploads', express.static(join(__dirname, 'uploads')))

// middlewares
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// ✅ Allowed Origins
const allowedOrigins = [
  "https://askpoint.online",
  "https://www.askpoint.online",
  "https://admin.askpoint.online",
  "https://api.askpoint.online",
  "http://localhost:5173",
  "http://localhost:5174",
]

const corsOptions = {
  origin: function (origin, callback) {
    // Allow Postman, mobile apps (no origin)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      console.log("❌ CORS BLOCKED FROM:", origin)
      callback(new Error(`CORS blocked: ${origin}`))
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "token"],
}

// ✅ MUST BE BEFORE ALL ROUTES - Handle preflight OPTIONS requests
app.options('*', cors(corsOptions))

// ✅ Apply CORS to all routes
app.use(cors(corsOptions))

// api endpoints
app.use('/api/user', userRouter)
app.use('/api/product', productRouter)
app.use('/api/cart', cartRouter)
app.use('/api/order', orderRouter)
app.use('/api/blog', BlogRouter)
app.use('/api/contact', contactRouter)
app.use('/api/footer', footerRouter)
app.use('/api/hero-banner', heroBannerRouter)
app.use('/api/showcase', showcaseBannerRouter)
app.use("/api/payment", paymentRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/category", CategoryRoutes)
app.use('/api/search', searchRouter)
app.use("/api/testimonials", testimonialRoutes)
app.use("/api/blogs", blogRoutes)
app.use("/api/projects", projectRoutes)
app.use("/api/youtube-videos", youtubeVideoRouter)

// dashboard
app.use("/api/dashboard", dashboardRouter)

// delivery and coupons
app.use("/api/coupons", couponRoutes)
app.use("/api/delivery", deliveryRoutes)
app.use("/api/cod", codRoutes)

// ── Editor image upload (rich text editor inline images) ─────────────────────
const editorUpload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/editor-images/',
    filename: (req, file, cb) => {
      const ext = extname(file.originalname) || '.jpg'
      cb(null, `editor-${Date.now()}-${randomUUID().slice(0, 6)}${ext}`)
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
})

import { adminAuth } from './middleware/adminAuth.js'

app.post('/api/upload/editor-image', adminAuth, editorUpload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' })
    const url = `/uploads/editor-images/${req.file.filename}`
    res.json({ success: true, url })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.get('/', (req, res) => {
  res.send("API Working ✅")
})

// ═══════════════════════════════════════════════════════════════════════════════
//  WebSocket (Socket.io) — Real-time dashboard updates
// ═══════════════════════════════════════════════════════════════════════════════
import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        console.log("❌ WS CORS BLOCKED:", origin)
        callback(new Error('CORS blocked'))
      }
    },
    credentials: true,
  },
})

// Make io accessible to controllers via app
app.set('io', io)

// ─── Admin room — all admin panel users join 'admin' room ─────────────────────
io.on('connection', (socket) => {
  console.log('[WS] Client connected:', socket.id)

  // Client sends 'join-admin' to identify itself as an admin
  socket.on('join-admin', () => {
    socket.join('admin')
    console.log('[WS] Socket joined admin room:', socket.id)
  })

  socket.on('disconnect', () => {
    console.log('[WS] Client disconnected:', socket.id)
  })
})

// Start the HTTP server with Socket.io attached
httpServer.listen(port, () => console.log('Server started on PORT: ' + port))