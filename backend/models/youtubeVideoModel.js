import mongoose from 'mongoose'

const youtubeVideoSchema = new mongoose.Schema(
  {
    videoId:  { type: String, required: true, trim: true },
    title:    { type: String, default: '',    trim: true },
    category: { type: String, enum: ['tutorials', 'reviews'], default: 'tutorials' },
    order:    { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

youtubeVideoSchema.index({ category: 1, order: 1 })

const YoutubeVideoModel =
  mongoose.models.YoutubeVideo || mongoose.model('YoutubeVideo', youtubeVideoSchema)

export default YoutubeVideoModel
