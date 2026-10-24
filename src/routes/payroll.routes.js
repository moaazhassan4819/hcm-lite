import express from "express";
import {
  generatePayroll,
  getPayrolls,
  finalizePayroll,
  getPayrollById,
} from "../controllers/payroll.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getPayrolls);
router.get("/:id", getPayrollById);
router.post("/generate", authorize("admin", "hr"), generatePayroll);
router.post("/finalize", authorize("admin"), finalizePayroll);

export default router;
