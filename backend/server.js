import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
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
import CaegoryRoutes from "./routes/categoryRoute.js"
import blogRoutes from "./routes/Blogroutes.js"
import testimonialRoutes from "./routes/Testimonialroutes.js"
import searchRouter from './routes/searchRoute.js'
import projectRoutes from "./routes/projectRoutes.js"

// App Config
const app = express()
const port = process.env.PORT || 10000
connectDB()
connectCloudinary()

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
app.use("/api/category", CaegoryRoutes)
app.use('/api/search', searchRouter)
app.use("/api/testimonials", testimonialRoutes)
app.use("/api/blogs", blogRoutes)
app.use("/api/projects", projectRoutes)

// delivery and coupons
app.use("/api/coupons", couponRoutes)
app.use("/api/delivery", deliveryRoutes)

app.get('/', (req, res) => {
  res.send("API Working ✅")
})

app.listen(port, () => console.log('Server started on PORT: ' + port))