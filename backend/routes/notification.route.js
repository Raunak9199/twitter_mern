import express from "express";

import {
  getNotifications,
  deleteNotifications,
  markNotificationAsRead,
  deleteSingleNotification,
} from "../controllers/notification.controller.js";
import { isAuthenticated } from "../utils/isAuthenticated.js";

const router = express.Router();

router.route("/").get(isAuthenticated, getNotifications);
router.route("/").delete(isAuthenticated, deleteNotifications);
router
  .route("/markNotificationRead")
  .post(isAuthenticated, markNotificationAsRead);
router.route("/:id").post(isAuthenticated, deleteSingleNotification);

export default router;
