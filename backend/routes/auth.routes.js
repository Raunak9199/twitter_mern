import express from "express";

import {
  signup,
  login,
  logout,
  getMe,
} from "../controllers/auth.controller.js";
import { isAuthenticated } from "../utils/isAuthenticated.js";

const router = express.Router();

router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/logout").post(isAuthenticated, logout);
router.route("/profile").post(isAuthenticated, getMe);

export default router;
