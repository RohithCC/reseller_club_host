// models/heroBannerModel.js
import mongoose from 'mongoose'

const heroBannerSchema = new mongoose.Schema(
  {
    badge:       { type: String, required: true, trim: true },
    title:       { type: String, required: true, trim: true },
    titleAccent: { type: String, required: true, trim: true },
    subtitle:    { type: String, default: '',    trim: true },
    desc:        { type: String, default: '',    trim: true },
    cta:         { type: String, required: true, trim: true },  // button label
    ctaLink:     { type: String, required: true, trim: true },  // button href
    bg:          { type: String, required: true, trim: true },  // tailwind gradient class
    accentColor: { type: String, required: true, trim: true },  // tailwind text color
    image:       { type: String, required: true, trim: true },  // foreground product image URL
    bgImage:     { type: String, default: '',    trim: true },  // ← NEW: background image URL (optional)
    order:       { type: Number, default: 0 },                  // display order
    isActive:    { type: Boolean, default: true },              // show/hide slide
  },
  { timestamps: true }
)

const heroBannerModel =
  mongoose.models.HeroBanner || mongoose.model('HeroBanner', heroBannerSchema)

export default heroBannerModel