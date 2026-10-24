import express from "express";
import {
  checkIn,
  checkOut,
  getMyAttendance,
  getTodayStatus,
  getAllAttendance,
  markAbsents,
} from "../controllers/attendance.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/check-in", checkIn);
router.post("/check-out", checkOut);
router.get("/me", getMyAttendance);
router.get("/today", getTodayStatus);
router.get("/", authorize("admin", "hr"), getAllAttendance);
router.post("/mark-absents", authorize("admin", "hr"), markAbsents);

export default router;
