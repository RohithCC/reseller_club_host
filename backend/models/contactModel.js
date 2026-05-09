import mongoose from 'mongoose'

const contactSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true },
    email:   { type: String, required: true, trim: true, lowercase: true },
    phone:   { type: String, trim: true, default: '' },
    subject: { type: String, required: true },
    message: { type: String, required: true, trim: true },
    status:  { type: String, enum: ['new', 'read', 'replied'], default: 'new' },
  },
  { timestamps: true }   // createdAt, updatedAt
)

const contactModel =
  mongoose.models.Contact || mongoose.model('Contact', contactSchema)

export default contactModel
