import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connString = process.env.MONGO_URI;
    const dbName = DB_NAME;

    // console.log("Connecting to MongoDB...", connString);
    // console.log("Connecting to MongoDB Name...", dbName);
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URI}/${DB_NAME}`
    );

    console.log(
      `\nMongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("\nMongo DB connection Failed", error);
    process.exit(1);
  }
};

export default connectDB;
