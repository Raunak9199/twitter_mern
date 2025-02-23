import { Notification } from "../models/notification.model.js";
import { ApiResponse } from "../utils/ApiResonse.js";

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      to: req.user._id,
    }).populate({
      path: "from",
      select: "userName profileImg",
    });

    if (!notifications) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Notifications not found"));
    }

    await Notification.updateMany(
      {
        to: req.user._id,
      },
      {
        read: true,
      }
    );

    return res.status(200).json(new ApiResponse(200, notifications, ""));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Something went wrong"));
  }
};

export const deleteNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ to: req.user._id });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Notifications deleted successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Something went wrong"));
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        to: req.user._id,
        read: false,
      },
      {
        read: true,
      }
    );
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Notifications marked as read"));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Something went wrong"));
  }
};

export const deleteSingleNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Notification not found"));
    }

    if (notification.to.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json(new ApiResponse(403, {}, "You can not delete this notification"));
    }

    await Notification.findByIdAndDelete(req.params.id);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Notification deleted successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Something went wrong"));
  }
};
