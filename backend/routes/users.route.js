import express from "express";

import {
  getUserProfile,
  suggestedUser,
  followUnfollowUser,
  updateUserProfile,
} from "../controllers/user.controller.js";
import { isAuthenticated } from "../utils/isAuthenticated.js";

const router = express.Router();

router.route("/userProfile/:userName").get(isAuthenticated, getUserProfile);
router.route("/suggested").get(isAuthenticated, suggestedUser);
router.route("/follow/:id").post(isAuthenticated, followUnfollowUser);
router.route("/update").post(isAuthenticated, updateUserProfile);

export default router;
