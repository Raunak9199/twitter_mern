import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResonse.js";

export const signup = async (req, res, next) => {
  try {
    const { userName, password, fullName, email } = req.body;
    console.log("Signup Request Email:", email);

    // Check if all fields are provided
    if (!email || !password || !userName || !fullName) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "All fields are required"));
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json(new ApiResponse(400, {}, "Invalid email"));
    }

    // Password validation
    if (password.length < 5) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Password must be at least 6 characters")
        );
    }

    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(userName)) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid username format"));
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({ $or: [{ userName }, { email }] });
    if (existingUser) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Username or Email already in use"));
    }

    // Create and save the new user
    const newUser = new User({
      userName,
      fullName,
      email,
      password,
      profileImg: "",
      coverImg: "",
      followers: [],
      following: [],
      bio: "",
      link: "",
    });

    await newUser.save(); // Save user first

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      newUser._id
    );

    // Retrieve the created user without password & refreshToken
    const createdUser = await User.findById(newUser._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(500, "User not found after registration.");
    }

    // Set cookies
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "Strict",
    };

    return res
      .status(201)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(new ApiResponse(201, createdUser, "User Registered Successfully"));
  } catch (error) {
    console.error("Signup Error:", error);
    return next(new ApiError(500, error.message));
  }
};

export const login = async (req, res, next) => {
  try {
    const { userName, password } = req.body;

    // Check if fields are provided
    if (!userName || !password) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Username and Password are required"));
    }

    // Find user by userName
    const user = await User.findOne({ userName }); /* .select(
      "+password +refreshToken"
    ); */
    if (!user) {
      return res
        .status(401)
        .json(new ApiResponse(401, {}, "Invalid Username or Password"));
    }

    // Use the isPasswordCorrect() method from userSchema
    const isPasswordValid = await user.isPasswordCorrect(password ?? "");
    if (!isPasswordValid) {
      return res
        .status(401)
        .json(new ApiResponse(401, {}, "Invalid Username or Password"));
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    // Set cookies
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "Strict",
    };

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { user: loggedInUser, accessToken, refreshToken },
          "Login successful"
        )
      );
  } catch (error) {
    console.error("Login Error:", error);
    return next(new ApiError(500, error.message));
  }
};

export const logout = async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: 1 }, // this removes the field from document ( 1 is used to unset a value in mongo DB),
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully."));
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    return res.status(200).json(new ApiResponse(200, user));
  } catch (error) {
    return next(new ApiError(500, error.message));
  }
};

// Generate access & refresh tokens
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found for token generation.");
    }

    console.log("Generating tokens for:", user._id);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Token Generation Error:", error);
    throw new ApiError(500, "Something went wrong while generating tokens.");
  }
};
