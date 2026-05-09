import express from "express";
import {
  getAll, adminGetAll, getById, create, update, remove,
} from "../controllers/ProjectController.js";
import { adminAuth } from "../middleware/adminAuth.js";

const ProjectRouter = express.Router();

// ── PUBLIC ────────────────────────────────────────────────────────────────────
ProjectRouter.get("/", getAll);

// ── ADMIN ─────────────────────────────────────────────────────────────────────
ProjectRouter.get("/admin/all", adminAuth, adminGetAll);
ProjectRouter.get("/:id",       adminAuth, getById);
ProjectRouter.post("/",         adminAuth, create);
ProjectRouter.put("/:id",       adminAuth, update);
ProjectRouter.delete("/:id",    adminAuth, remove);

export default ProjectRouter;