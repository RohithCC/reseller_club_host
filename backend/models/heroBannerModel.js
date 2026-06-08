// models/heroBannerModel.js
import mongoose from 'mongoose'

const heroBannerSchema = new mongoose.Schema(
  {
    title:       { type: String, default: 'Hero Slide',  trim: true },
    link:        { type: String, default: '/collection',  trim: true },  // click-through URL
    image:       { type: String, default: '',             trim: true },  // desktop banner image
    imageMobile: { type: String, default: '',             trim: true },  // mobile banner image (optional)
    badge:       { type: String, default: '',             trim: true },
    titleAccent: { type: String, default: '',             trim: true },
    subtitle:    { type: String, default: '',             trim: true },
    desc:        { type: String, default: '',             trim: true },
    cta:         { type: String, default: 'Shop Now',     trim: true },
    ctaLink:     { type: String, default: '/collection',  trim: true },
    bg:          { type: String, default: 'from-blue-800 via-blue-700 to-blue-900', trim: true },
    accentColor: { type: String, default: 'text-yellow-300', trim: true },
    bgImage:     { type: String, default: '',             trim: true },
    order:       { type: Number, default: 0 },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
)

const heroBannerModel =
  mongoose.models.HeroBanner || mongoose.model('HeroBanner', heroBannerSchema)

export default heroBannerModel