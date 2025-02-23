import { User } from "../models/user.model.js";
import { Notification } from "../models/notification.model.js";
import { ApiResponse } from "../utils/ApiResonse.js";

import { v2 as cloudinary } from "cloudinary";

export const getUserProfile = async (req, res) => {
  const { userName } = req.params;
  try {
    const user = await User.findOne({ userName }).select(
      "-password -refreshToken"
    );
    if (!user) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Couldn't get the profile"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, user, "Profile fetched successfully"));
  } catch (error) {
    console.log("Error getting user profile:", error.message);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Something went wrong"));
  }
};

export const suggestedUser = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json(new ApiResponse(401, {}, "Unauthorized"));
    }

    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: req.user._id, $nin: req.user.following }, // Exclude logged-in user & already followed users
        },
      },
      {
        $project: {
          password: 0, // Exclude password
          refreshToken: 0, // Exclude refreshToken
        },
      },
      //   { $sample: { size: 10 } }, // Get 10 random users (Optional)
      { $sort: { followersCount: -1 } }, // Most followed users first
      { $limit: 8 },
    ]);

    if (users.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, [], "No suggested users available"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, users, "Suggested users fetched successfully")
      );
  } catch (error) {
    console.error("Error getting suggested users:", error.message);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Something went wrong"));
  }
};

export const followUnfollowUser = async (req, res) => {
  //   console.log("Request User:", req.user);
  try {
    const { id } = req.params;
    const userToFollow = await User.findById(id).select(
      "-password -refreshToken"
    );
    const loggedInUser = await User.findById(req.user._id).select(
      "-password -refreshToken"
    );
    // console.log("Follow/Unfollow", userToFollow, loggedInUser);

    if (!userToFollow || !loggedInUser) {
      return res.status(404).json(new ApiResponse(404, {}, "User not found"));
    }

    let message = "";

    if (userToFollow.followers.includes(req.user._id)) {
      // Unfollow
      userToFollow.followers = userToFollow.followers.filter(
        (follower) => follower.toString() !== req.user._id.toString()
      );
      loggedInUser.following = loggedInUser.following.filter(
        (following) => following.toString() !== id.toString()
      );
      message = "Unfollowed successfully";
    } else {
      // Follow
      userToFollow.followers.push(req.user._id);
      loggedInUser.following.push(id);
      message = "Followed successfully";
    }

    await userToFollow.save();
    await loggedInUser.save();

    const user = await User.findById(id).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json(new ApiResponse(404, {}, "User not found"));
    }

    // Send Notifications
    const newNotifications = new Notification({
      type: "follow",
      from: req.user._id,
      to: id,
      message: `You've ${
        message.includes("Followed") ? "followed" : "unfollowed"
      } ${user?.fullName.split(" ")[0]} successfully`,
    });
    await newNotifications.save();

    return res.status(200).json(new ApiResponse(200, user, message));
  } catch (error) {
    console.error("Follow/Unfollow Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Something went wrong"));
  }
};

export const updateUserProfile = async (req, res) => {
  const { fullName, email, username, currentPassword, newPassword, bio, link } =
    req.body;
  let { profileImg, coverImg } = req.body;

  const userId = req.user?._id;
  if (!userId) {
    return res.status(401).json(new ApiResponse(401, {}, "Unauthorized"));
  }

  try {
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(new ApiResponse(404, {}, "User not found"));
    }

    // Handle password update securely
    if (currentPassword || newPassword) {
      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              "Please provide both current and new passwords"
            )
          );
      }

      const isMatch = await user.isPasswordCorrect(currentPassword);
      if (!isMatch) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "Current password is incorrect"));
      }

      if (newPassword.length < 6) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              "Password must be at least 6 characters long"
            )
          );
      }

      user.password = newPassword; // Pre-save hook will hash it
    }

    // Handle profile image upload
    if (profileImg) {
      if (user.profileImg) {
        await cloudinary.uploader.destroy(
          user.profileImg.split("/").pop().split(".")[0]
        );
      }
      const uploadedResponse = await cloudinary.uploader.upload(profileImg);
      user.profileImg = uploadedResponse.secure_url;
    }

    // Handle cover image upload
    if (coverImg) {
      if (user.coverImg) {
        await cloudinary.uploader.destroy(
          user.coverImg.split("/").pop().split(".")[0]
        );
      }
      const uploadedResponse = await cloudinary.uploader.upload(coverImg);
      user.coverImg = uploadedResponse.secure_url;
    }

    // Update user details
    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.userName = username || user.userName;
    user.bio = bio || user.bio;
    user.link = link || user.link;

    await user.save(); // Save updates (password will be hashed if changed)

    // Fetch updated user without sensitive fields
    const updatedUser = await User.findById(userId).select(
      "-password -refreshToken"
    );

    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
  } catch (error) {
    console.error("Error in updateUserProfile:", error.message);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Something went wrong"));
  }
};
