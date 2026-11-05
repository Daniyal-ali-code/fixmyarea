import { Router } from "express";
import {
  createReport,
  listReports,
  getReport,
  toggleSupport,
} from "../controllers/reports.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", listReports);
router.post("/", requireAuth, createReport);
router.get("/:id", getReport);
router.post("/:id/support", requireAuth, toggleSupport);

export default router;
