import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "./ApiError.js";

export const isAuthenticated = async (req, res, next) => {
  try {
    const token =
      req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return next(new ApiError(401, "Unauthorized - No token provided"));
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.ACCES_TOKEN_SECRET);
    console.log("Decoded Token:", decoded);

    if (!decoded || !decoded._id) {
      return next(new ApiError(401, "Unauthorized - Invalid token payload"));
    }

    const user = await User.findById(decoded._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    req.user = user;
    console.log("Authenticated User:", req.user);

    next();
  } catch (error) {
    return next(new ApiError(401, "Unauthorized - Invalid token"));
  }
};
