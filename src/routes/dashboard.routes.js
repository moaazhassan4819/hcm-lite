import express from "express";
import { getDashboardStats, getEmployeeDashboard } from "../controllers/dashboard.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/admin", authorize("admin", "hr"), getDashboardStats);
router.get("/employee", getEmployeeDashboard);

export default router;
