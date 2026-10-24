import express from "express";
import {
  checkSetup,
  setupAdmin,
  login,
  logout,
  getMe,
  changePassword,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/setup-status", checkSetup);
router.post("/setup", setupAdmin);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);

export default router;
