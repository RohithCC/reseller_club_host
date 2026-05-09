import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    img:         { type: String, default: "" },
    cat:         { type: String, required: true, trim: true },
    date:        { type: String, required: true },
    link:        { type: String, default: "" },
    isActive:    { type: Boolean, default: true },
    order:       { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);
export default Project;