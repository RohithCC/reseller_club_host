import express from "express";
import {
  getAll, adminGetAll, getById, create, update, remove,
} from "../controllers/ProjectController.js";
import { adminOrSuperAdminAuth } from "../middleware/adminAuth.js";

const ProjectRouter = express.Router();

// ── PUBLIC ────────────────────────────────────────────────────────────────────
ProjectRouter.get("/", getAll);

// ── ADMIN ─────────────────────────────────────────────────────────────────────
ProjectRouter.get("/admin/all", adminOrSuperAdminAuth, adminGetAll);
ProjectRouter.get("/:id",       adminOrSuperAdminAuth, getById);
ProjectRouter.post("/",         adminOrSuperAdminAuth, create);
ProjectRouter.put("/:id",       adminOrSuperAdminAuth, update);
ProjectRouter.delete("/:id",    adminOrSuperAdminAuth, remove);

export default ProjectRouter;