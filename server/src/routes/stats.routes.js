import { Router } from "express";
import { getStats } from "../controllers/admin.controller.js";

const router = Router();

router.get("/", getStats);

export default router;
