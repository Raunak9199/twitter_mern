import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

// import swaggerUi from "swagger-ui-express";
// import swaggerJsdoc from "swagger-jsdoc";

const app = express();

app.use(
  cors({
    origin: [
      process.env.CORS_ORIGIN,
      "http://localhost:5173",
      "http://localhost:5000",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// app.use(express.static("public"));
app.use(cookieParser());

// routes import
import authROuter from "./routes/auth.routes.js";
import userRouter from "./routes/users.route.js";
import postRouter from "./routes/post.route.js";

// routes declaration
app.use("/api/v1/auth", authROuter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/post", postRouter);

export { app };
