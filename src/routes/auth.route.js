import express from "express";
import {
  checkAuth,
  deleteProfile,
  getUserProfile,
  login,
  logout,
  signup,
  updateProfile,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Públicas
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

// Protegidas
router.get("/check", protectRoute, checkAuth);
router.put("/update", protectRoute, updateProfile);
router.delete("/delete", protectRoute, deleteProfile);
router.get("/profile/:id", protectRoute, getUserProfile);

export default router;
