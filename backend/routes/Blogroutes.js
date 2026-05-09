import express from "express";
import { getAll, adminGetAll, getById, create, update, remove } from "../controllers/Blogcontroller1.js";
import { adminAuth } from "../middleware/adminAuth.js";

const BlogRouter = express.Router();

// ── PUBLIC ────────────────────────────────────────────────────────────────────
BlogRouter.get("/", getAll);

// ── ADMIN ─────────────────────────────────────────────────────────────────────
BlogRouter.get("/admin/all", adminAuth, adminGetAll);
BlogRouter.get("/:id",       adminAuth, getById);
BlogRouter.post("/",         adminAuth, create);
BlogRouter.put("/:id",       adminAuth, update);
BlogRouter.delete("/:id",    adminAuth, remove);

export default BlogRouter;