import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
  {
    name:     { type: String,  required: true, trim: true },
    role:     { type: String,  required: true, trim: true },
    text:     { type: String,  required: true, trim: true },
    rating:   { type: Number,  required: true, min: 1, max: 5, default: 5 },
    avatar:   { type: String,  default: "" },
    isActive: { type: Boolean, default: true },
    order:    { type: Number,  default: 0 },
  },
  { timestamps: true }
);

// ✅ ESM export instead of module.exports
export default mongoose.model("Testimonial", testimonialSchema);