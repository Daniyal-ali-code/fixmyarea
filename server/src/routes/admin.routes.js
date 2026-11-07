import { Router } from "express";
import {
  listAllReports,
  updateStatus,
  deleteReport,
} from "../controllers/admin.controller.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/reports", listAllReports);
router.patch("/reports/:id/status", updateStatus);
router.delete("/reports/:id", deleteReport);

export default router;
