import express from "express";
import {
  getAll,       // public
  adminGetAll,
  getById,
  create,
  update,
  remove,
} from "../controllers/Testimonialcontroller.js";
import { adminAuth } from "../middleware/adminAuth.js";

const TestimonialRouter = express.Router();

// ── PUBLIC ────────────────────────────────────────────────────────────────────
TestimonialRouter.get("/", getAll);                          // GET  /api/testimonials

// ── ADMIN ─────────────────────────────────────────────────────────────────────
TestimonialRouter.get("/admin/all", adminAuth, adminGetAll); // GET  /api/testimonials/admin/all
TestimonialRouter.get("/:id",       adminAuth, getById);     // GET  /api/testimonials/:id
TestimonialRouter.post("/",         adminAuth, create);      // POST /api/testimonials
TestimonialRouter.put("/:id",       adminAuth, update);      // PUT  /api/testimonials/:id
TestimonialRouter.delete("/:id",    adminAuth, remove);      // DEL  /api/testimonials/:id

export default TestimonialRouter;