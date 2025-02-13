import { ApiResponse } from "../utils/ApiResonse.js";
import { Post } from "../models/post.model.js";
import { v2 as cloudinary } from "cloudinary";
import { Notification } from "../models/notification.model.js";
import { User } from "../models/user.model.js";

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password -refreshToken",
      })
      .populate({
        path: "comments.user",
        select: "-password -refreshToken",
      })
      .populate({
        path: "likes",
        select: "-password -refreshToken",
      });

    if (posts.length === 0) {
      return res.status(404).json(new ApiResponse(404, [], "No posts found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, posts, "Posts fetched successfully"));
  } catch (error) {
    console.error("Error in getAllPosts:", error);
    return res.status(500).json(new ApiResponse(500, [], error.message));
  }
};

export const createPost = async (req, res) => {
  try {
    const { description } = req.body;
    let { img } = req.body;

    const userId = req.user?._id?.toString();
    if (!userId) {
      return res.status(401).json(new ApiResponse(401, {}, "User not found"));
    }

    if (!description && !img) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Post must have a title or an image"));
    }

    let uploadedImageUrl = null;
    if (img) {
      console.log("Uploading image:", img);
      const response = await cloudinary.uploader.upload(img, {
        resource_type: "auto",
      });

      if (!response || !response.url) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "Image upload failed"));
      }

      uploadedImageUrl = response.secure_url;
    }

    const post = await Post.create({
      user: userId,
      description: description || "",
      img: uploadedImageUrl || "",
    });

    return res
      .status(200)
      .json(new ApiResponse(200, post, "Post created successfully"));
  } catch (error) {
    console.error("Error in createPost:", error);
    return res.status(500).json(new ApiResponse(500, {}, error.message));
  }
};

export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    console.log("Received postId:", postId);

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json(new ApiResponse(404, {}, "Post not found"));
    }
    if (post.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json(new ApiResponse(403, {}, "Unauthorized to delete this post"));
    }

    if (post.img) {
      const publicId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }

    // Delete all comments associated with the post
    await Post.updateMany(
      { _id: postId },
      { $set: { comments: [] } },
      { new: true }
    );

    // Delete all likes associated with the post
    await Post.updateMany(
      { _id: postId },
      { $set: { likes: [] } },
      { new: true }
    );
    const deletedPost = await Post.findByIdAndDelete(postId);
    if (!deletedPost) {
      return res.status(404).json(new ApiResponse(404, {}, "Post not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, deletedPost, "Post deleted successfully"));
  } catch (error) {
    console.error("Error in deletePost:", error);
    return res.status(500).json(new ApiResponse(500, {}, error.message));
  }
};

export const commentOnPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;

    console.log("Received postId:", postId);
    console.log("Received text:", text);

    if (!text) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Comment is required"));
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json(new ApiResponse(404, {}, "Post not found"));
    }

    const createdComment = { user: req.user._id, text };
    post.comments.push(createdComment);
    await post.save();
    return res
      .status(200)
      .json(new ApiResponse(200, post, "Comment added successfully"));
  } catch (error) {
    console.error("Error in commentOnPost:", error);
    return res.status(500).json(new ApiResponse(500, {}, error.message));
  }
};
export const likeUnlikePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { postId } = req.params;

    console.log("Received postId:", postId);
    console.log("Received userId:", userId);

    // Perform like/unlike operation in a single query
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json(new ApiResponse(404, {}, "Post not found"));
    }

    const userLikedPost = post.likes.includes(userId);

    if (userLikedPost) {
      // Unlike post
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
      await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });

      const updatedLikes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
      res.status(200).json(new ApiResponse(200, updatedLikes, "Unliked"));
    } else {
      // Like post
      post.likes.push(userId);
      await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
      await post.save();

      const notification = new Notification({
        from: userId,
        to: post.user,
        type: "like",
      });
      await notification.save();

      const updatedLikes = post.likes;
      //   res.status(200).json(updatedLikes);
      res
        .status(200)
        .json(new ApiResponse(200, notification, "Liked successfully"));
    }
  } catch (error) {
    console.error("Error in likeUnlikePost:", error);
    return res.status(500).json(new ApiResponse(500, {}, error.message));
  }
};

export const getLikedPosts = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log("Received UserId:", userId);
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found in database.");
      return res.status(404).json(new ApiResponse(404, {}, "User not found"));
    }
    const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
      .populate({
        path: "user",
        select: "-password -refreshToken",
      })
      .populate({
        path: "comments.user",
        select: "-password -refreshToken",
      })
      .populate({
        path: "likes",
        select: "-password -refreshToken",
      });
    res.status(200).json(new ApiResponse(200, likedPosts, "Liked posts"));
  } catch (error) {
    console.error("Error in getLikedPosts:", error);
    return res.status(500).json(new ApiResponse(500, {}, error.message));
  }
};

export const getFollowingPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("Received UserId:", userId);
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found in database.");
      return res.status(404).json(new ApiResponse(404, {}, "User not found"));
    }
    const followingPosts = await Post.find({ user: { $in: user.following } })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password -refreshToken",
      })
      .populate({
        path: "comments.user",
        select: "-password -refreshToken",
      })
      .populate({
        path: "likes",
        select: "-password -refreshToken",
      });
    res
      .status(200)
      .json(new ApiResponse(200, followingPosts, "Following posts"));
  } catch (error) {
    console.error("Error in getFollowingPosts:", error);
    return res.status(500).json(new ApiResponse(500, {}, error.message));
  }
};

export const getCurrentUserPosts = async (req, res) => {
  try {
    const { userName } = req.query; // Get userName from query params
    let userId = req.user._id;

    console.log("Received userName:", userName);
    console.log("Received UserId:", userId);

    // If userName is provided, find user by userName
    if (userName) {
      const user = await User.findOne({ userName });
      if (!user) {
        console.log("User with given userName not found.");
        return res.status(404).json(new ApiResponse(404, {}, "User not found"));
      }
      userId = user._id; // Use the found user's ID
    }

    // Fetch posts for the determined userId
    const currentUserPosts = await Post.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password -refreshToken",
      })
      .populate({
        path: "comments.user",
        select: "-password -refreshToken",
      })
      .populate({
        path: "likes",
        select: "-password -refreshToken",
      });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          currentUserPosts,
          "User posts fetched successfully"
        )
      );
  } catch (error) {
    console.error("Error in getCurrentUserPosts:", error);
    return res.status(500).json(new ApiResponse(500, {}, error.message));
  }
};
