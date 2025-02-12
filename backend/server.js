import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import express from "express";
import { v2 as cloudinary } from "cloudinary";

dotenv.config({
  path: "./.env",
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

// app.get("/", (req, res) => {
//   res.send("Hello World");
// });

// DB connection
connectDB()
  .then(() => {
    console.log("Connected to database");

    /*  // Serve Frontend in Production
    if (process.env.NODE_ENV === "production") {
      app.use(express.static(path.join(__dirname, "frontend", "dist")));

      app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
      });
    } */

    app.listen(process.env.PORT || 5000, "0.0.0.0", () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed: " + err);
  });
