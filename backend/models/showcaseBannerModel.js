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
      default:   '',
      trim:      true,
      maxlength: [300, 'Subtitle cannot exceed 300 characters'],
    },
    cta: {
      type:      String,
      trim:      true,
      default:   'Shop Now',
      maxlength: [40, 'CTA cannot exceed 40 characters'],
    },
    link: {
      type:     String,
      default:  '',
      trim:     true,
    },
    // Background colour for the section (Tailwind class or hex)
    bgColor: {
      type:    String,
      default: 'bg-white',
      trim:    true,
    },
    // Description shown below title (for CTA section variant)
    description: {
      type:    String,
      default: '',
      trim:    true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    // Array of CTA buttons [{ label, link, icon }]
    buttons: [{
      label: { type: String, trim: true, maxlength: 40 },
      link:  { type: String, trim: true },
      icon:  { type: String, default: '', trim: true },
    }],
    // Desktop banner image (1400x440 recommended)
    image: {
      type:     String,
      required: [true, 'Image URL is required'],
      trim:     true,
    },
    // Mobile banner image (600x800 recommended) — falls back to desktop image if empty
    imageMobile: {
      type:    String,
      default: '',
      trim:    true,
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