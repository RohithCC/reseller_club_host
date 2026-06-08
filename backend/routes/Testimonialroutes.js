import express from "express";
import {
  getAll,       // public
  adminGetAll,
  getById,
  create,
  update,
  remove,
} from "../controllers/Testimonialcontroller.js";
import { adminOrSuperAdminAuth } from "../middleware/adminAuth.js";

const TestimonialRouter = express.Router();

// ── PUBLIC ────────────────────────────────────────────────────────────────────
TestimonialRouter.get("/", getAll);                          // GET  /api/testimonials

// ── ADMIN ─────────────────────────────────────────────────────────────────────
TestimonialRouter.get("/admin/all", adminOrSuperAdminAuth, adminGetAll); // GET  /api/testimonials/admin/all
TestimonialRouter.get("/:id",       adminOrSuperAdminAuth, getById);     // GET  /api/testimonials/:id
TestimonialRouter.post("/",         adminOrSuperAdminAuth, create);      // POST /api/testimonials
TestimonialRouter.put("/:id",       adminOrSuperAdminAuth, update);      // PUT  /api/testimonials/:id
TestimonialRouter.delete("/:id",    adminOrSuperAdminAuth, remove);      // DEL  /api/testimonials/:id

export default TestimonialRouter;