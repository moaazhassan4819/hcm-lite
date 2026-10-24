import express from "express";
import {
  getCompany,
  updateCompany,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
} from "../controllers/company.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getCompany);
router.put("/", authorize("admin"), updateCompany);

router.get("/departments", getDepartments);
router.post("/departments", authorize("admin", "hr"), createDepartment);
router.put("/departments/:id", authorize("admin", "hr"), updateDepartment);
router.delete("/departments/:id", authorize("admin"), deleteDepartment);

router.get("/leave-types", getLeaveTypes);
router.post("/leave-types", authorize("admin", "hr"), createLeaveType);
router.put("/leave-types/:id", authorize("admin", "hr"), updateLeaveType);
router.delete("/leave-types/:id", authorize("admin"), deleteLeaveType);

export default router;
