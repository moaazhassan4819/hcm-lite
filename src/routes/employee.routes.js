import express from "express";
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
} from "../controllers/employee.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", authorize("admin", "hr"), getEmployees);
router.post("/", authorize("admin", "hr"), createEmployee);
router.get("/:id", getEmployee);
router.put("/:id", updateEmployee);
router.delete("/:id", authorize("admin", "hr"), deactivateEmployee);

export default router;
