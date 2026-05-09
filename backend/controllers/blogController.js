import { v2 as cloudinary } from "cloudinary";
import blogModel from "../models/blogModel.js"
// ─── Helper: unique slug ──────────────────────────────────────────────────────
const buildUniqueSlug = async (title, excludeId = null) => {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  let slug = base;
  let n = 0;
  while (true) {
    const q = { slug };
    if (excludeId) q._id = { $ne: excludeId };
    const exists = await blogModel.findOne(q);
    if (!exists) return slug;
    slug = `${base}-${++n}`;
  }
};

// ════════════════════════════════════════════════════════════════════════════════
//  CREATE  —  POST /api/blog/add          (admin only)
// ════════════════════════════════════════════════════════════════════════════════
const addBlog = async (req, res) => {
  try {
    const {
      title, description, content,
      category, tags, author, published,
    } = req.body;

    if (!title || !description || !content) {
      return res.json({ success: false, message: "title, description and content are required" });
    }

    // Upload cover image to Cloudinary if provided
    let imageUrl = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "image",
        folder: "amulya-blogs",
      });
      imageUrl = result.secure_url;
    }

    const slug = await buildUniqueSlug(title);

    const blog = new blogModel({
      title,
      slug,
      description,
      content,
      image: imageUrl,
      category: category || "General",
      tags: tags ? JSON.parse(tags) : [],
      author: author || "Admin",
      published: published === "true",
      date: Date.now(),
    });

    await blog.save();
    res.json({ success: true, message: "Blog Added", blog });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════════
//  READ ALL  —  GET /api/blog/list        (public)
//  Query params: category, published, page, limit, tag
// ════════════════════════════════════════════════════════════════════════════════
const listBlogs = async (req, res) => {
  try {
    const {
      category,
      published,
      tag,
      page  = 1,
      limit = 10,
    } = req.query;

    const filter = {};
    if (category)            filter.category  = category;
    if (published !== undefined) filter.published = published === "true";
    if (tag)                 filter.tags      = { $in: [tag] };

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await blogModel.countDocuments(filter);

    const blogs = await blogModel
      .find(filter, { content: 0, comments: 0 })  // exclude heavy fields in list
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      blogs,
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════════
//  READ ONE  —  POST /api/blog/single     (public)
//  Body: { blogId } OR { slug }
// ════════════════════════════════════════════════════════════════════════════════
const singleBlog = async (req, res) => {
  try {
    const { blogId, slug } = req.body;

    let blog;
    if (blogId) {
      blog = await blogModel.findById(blogId);
    } else if (slug) {
      blog = await blogModel.findOne({ slug });
    }

    if (!blog) {
      return res.json({ success: false, message: "Blog not found" });
    }

    // Increment view count on public slug access
    if (slug) {
      blog.views += 1;
      await blog.save();
    }

    res.json({ success: true, blog });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════════
//  UPDATE  —  POST /api/blog/update       (admin only)
//  Body: { blogId, ...fields }
// ════════════════════════════════════════════════════════════════════════════════
const updateBlog = async (req, res) => {
  try {
    const {
      blogId, title, description, content,
      category, tags, author, published,
    } = req.body;

    const blog = await blogModel.findById(blogId);
    if (!blog) return res.json({ success: false, message: "Blog not found" });

    // New cover image
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "image",
        folder: "amulya-blogs",
      });
      blog.image = result.secure_url;
    }

    // Regenerate slug if title changed
    if (title && title !== blog.title) {
      blog.slug  = await buildUniqueSlug(title, blogId);
      blog.title = title;
    }

    if (description !== undefined) blog.description = description;
    if (content     !== undefined) blog.content     = content;
    if (category    !== undefined) blog.category    = category;
    if (tags        !== undefined) blog.tags        = JSON.parse(tags);
    if (author      !== undefined) blog.author      = author;
    if (published   !== undefined) blog.published   = published === "true";

    await blog.save();
    res.json({ success: true, message: "Blog Updated", blog });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════════
//  DELETE  —  POST /api/blog/remove       (admin only)
//  Body: { id }
// ════════════════════════════════════════════════════════════════════════════════
const removeBlog = async (req, res) => {
  try {
    await blogModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Blog Removed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════════
//  TOGGLE PUBLISH  —  POST /api/blog/toggle-publish  (admin only)
//  Body: { blogId }
// ════════════════════════════════════════════════════════════════════════════════
const togglePublish = async (req, res) => {
  try {
    const blog = await blogModel.findById(req.body.blogId);
    if (!blog) return res.json({ success: false, message: "Blog not found" });

    blog.published = !blog.published;
    await blog.save();

    res.json({
      success:   true,
      message:   blog.published ? "Blog Published" : "Blog Unpublished",
      published: blog.published,
    });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════════
//  ADD COMMENT  —  POST /api/blog/comment/add   (user auth)
//  Body: { blogId, comment }  |  req.user from userAuth middleware
// ════════════════════════════════════════════════════════════════════════════════
const addComment = async (req, res) => {
  try {
    const { blogId, comment } = req.body;
    const { userId, name, email } = req.user;   // set by userAuth middleware

    if (!comment || comment.trim() === "") {
      return res.json({ success: false, message: "Comment cannot be empty" });
    }

    const blog = await blogModel.findById(blogId);
    if (!blog) return res.json({ success: false, message: "Blog not found" });

    blog.comments.push({
      userId,
      name,
      email,
      comment: comment.trim(),
      approved: false,
      date: Date.now(),
    });

    await blog.save();
    res.json({ success: true, message: "Comment submitted for review" });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════════
//  APPROVE / DELETE COMMENT  —  POST /api/blog/comment/approve  (admin only)
//  Body: { blogId, commentId, action: "approve"|"delete" }
// ════════════════════════════════════════════════════════════════════════════════
const manageComment = async (req, res) => {
  try {
    const { blogId, commentId, action } = req.body;

    const blog = await blogModel.findById(blogId);
    if (!blog) return res.json({ success: false, message: "Blog not found" });

    const idx = blog.comments.findIndex((c) => c._id.toString() === commentId);
    if (idx === -1) return res.json({ success: false, message: "Comment not found" });

    if (action === "approve") {
      blog.comments[idx].approved = true;
      await blog.save();
      return res.json({ success: true, message: "Comment Approved" });
    }

    if (action === "delete") {
      blog.comments.splice(idx, 1);
      await blog.save();
      return res.json({ success: true, message: "Comment Deleted" });
    }

    res.json({ success: false, message: "Invalid action. Use 'approve' or 'delete'" });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════════
//  LIKE BLOG  —  POST /api/blog/like      (public — simple increment)
//  Body: { blogId }
// ════════════════════════════════════════════════════════════════════════════════
const likeBlog = async (req, res) => {
  try {
    const blog = await blogModel.findByIdAndUpdate(
      req.body.blogId,
      { $inc: { likes: 1 } },
      { new: true }
    );
    if (!blog) return res.json({ success: false, message: "Blog not found" });
    res.json({ success: true, likes: blog.likes });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


// controller
const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await blogModel.findById(id);

    if (!blog) {
      return res.json({ success: false, message: "Blog not found" });
    }

    res.json({ success: true, blog });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  addBlog,
  listBlogs,
  singleBlog,
  updateBlog,
  removeBlog,
  togglePublish,
  addComment,
  manageComment,
  likeBlog,
  getBlogById,
};
