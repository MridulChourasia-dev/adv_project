/* eslint-disable no-undef */
import mongoose from "mongoose";
import { DB_URL, NODE_ENV } from "../config/env.js";

if (!DB_URL) {
  throw new Error(
    "Please define the Mongoose_url envrioment variable inside .env.local/developement.local file"
  );
}

const connectToDatabase = async () => {
  try {
    await mongoose.connect(DB_URL);
    console.log(
      `Connected to MongoDB in ${NODE_ENV} mode successfully`
    );
  } catch (error) {
    console.log("Error is Connecting to MongoDB", error);
    console.log("⚠️  WARNING: MongoDB is not available. Some API endpoints may not work properly.");
    // Don't exit process for testing purposes
    // process.exit(1);
  }
};

export default connectToDatabase;
