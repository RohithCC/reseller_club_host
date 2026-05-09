// models/showcaseBannerModel.js
import mongoose from 'mongoose'

const showcaseBannerSchema = new mongoose.Schema(
  {
    title: {
      type:      String,
      required:  [true, 'Banner title is required'],
      trim:      true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    subtitle: {
      type:      String,
      required:  [true, 'Subtitle is required'],
      trim:      true,
      maxlength: [300, 'Subtitle cannot exceed 300 characters'],
    },
    cta: {
      type:      String,
      required:  [true, 'CTA text is required'],
      trim:      true,
      default:   'Shop Now',
      maxlength: [40, 'CTA cannot exceed 40 characters'],
    },
    link: {
      type:     String,
      required: [true, 'Link is required'],
      trim:     true,
    },
    image: {
      type:     String,
      required: [true, 'Image URL is required'],
      trim:     true,
    },
    // Tailwind gradient string e.g. "from-slate-900/85 via-slate-900/50 to-transparent"
    overlay: {
      type:    String,
      default: 'from-slate-900/85 via-slate-900/50 to-transparent',
      trim:    true,
    },
    // Lower number = shown first
    order: {
      type:    Number,
      default: 0,
    },
    // Hidden banners excluded from public GET
    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

showcaseBannerSchema.index({ isActive: 1, order: 1 })

const showcaseBannerModel =
  mongoose.models.ShowcaseBanner ||
  mongoose.model('ShowcaseBanner', showcaseBannerSchema)

export default showcaseBannerModel