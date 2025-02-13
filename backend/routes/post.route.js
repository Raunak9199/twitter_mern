import express from "express";

import {
  getAllPosts,
  createPost,
  deletePost,
  commentOnPost,
  likeUnlikePost,
  getLikedPosts,
  getFollowingPosts,
  getCurrentUserPosts,
} from "../controllers/post.controller.js";
import { isAuthenticated } from "../utils/isAuthenticated.js";

const router = express.Router();

router.route("/getAllPosts").get(isAuthenticated, getAllPosts);
router.route("/createPost").post(isAuthenticated, createPost);
router.route("/deletePost/:postId").delete(isAuthenticated, deletePost);
router.route("/commentOnPost/:postId").post(isAuthenticated, commentOnPost);
router.route("/likeUnlikePost/:postId").post(isAuthenticated, likeUnlikePost);
router.route("/likes/:id").get(isAuthenticated, getLikedPosts);

router.route("/followingPosts").get(isAuthenticated, getFollowingPosts);
router.route("/getCurrentUserPosts").get(isAuthenticated, getCurrentUserPosts);

export default router;
