import mongoose from "mongoose";

const blogPostSchema = new mongoose.Schema(
  {
    title:    { type: String, required: true, trim: true },
    excerpt:  { type: String, required: true, trim: true },
    content:  { type: String, default: "" },
    img:      { type: String, default: "" },
    cat:      { type: String, required: true, trim: true },
    date:     { type: String, required: true },
    link:     { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    order:    { type: Number, default: 0 },
  },
  { timestamps: true },
);

const BlogPost = mongoose.model("BlogPost", blogPostSchema);

export default BlogPost;