import express from "express";
import {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  reviewLeave,
  cancelLeave,
} from "../controllers/leave.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/", applyLeave);
router.get("/me", getMyLeaves);
router.get("/", authorize("admin", "hr"), getAllLeaves);
router.put("/:id/review", authorize("admin", "hr"), reviewLeave);
router.put("/:id/cancel", cancelLeave);

export default router;
