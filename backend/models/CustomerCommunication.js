// models/CustomerCommunication.js
// ─────────────────────────────────────────────────────────────────────────────
// Tracks every email / SMS sent to a customer (from admin panel or automated).
// Powers the "Communication History" section in Customer 360° view.
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from "mongoose";

const communicationSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "user",
      required: true,
      index:    true,
    },
    type: {
      type:     String,
      enum:     ["email", "sms", "note"],
      required: true,
    },
    subject:    { type: String, default: "" },
    body:       { type: String, default: "" },
    status: {
      type:     String,
      enum:     ["sent", "draft", "failed"],
      default:  "sent",
    },
    // For emails — store the recipient email address at time of send
    recipient:  { type: String, default: "" },
    // Who triggered this communication (admin user ID)
    sentBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "user",
      default:  null,
    },
  },
  {
    timestamps: true,
  }
);

communicationSchema.index({ userId: 1, createdAt: -1 });

const CustomerCommunication =
  mongoose.models?.CustomerCommunication ??
  mongoose.model("CustomerCommunication", communicationSchema);

export default CustomerCommunication;
