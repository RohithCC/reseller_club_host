import mongoose from "mongoose"

const codAvailabilitySchema = new mongoose.Schema({
  state: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  enabled: {
    type: Boolean,
    default: false,
  },
  minOrderValue: {
    type: Number,
    default: 0,
    min: 0,
  },
  maxOrderValue: {
    type: Number,
    default: 0,
    min: 0,
  },
}, { timestamps: true })

export default mongoose.model("CodAvailability", codAvailabilitySchema)
