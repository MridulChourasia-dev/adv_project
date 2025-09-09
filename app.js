/* eslint-disable no-undef */
import express from "express";
import { PORT } from "./config/env.js";
import userRouter from "./routes/user.routes.js";
import authRouter from "./routes/auth.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import connectToDatabase from "./database/mongodb.js";
import errorMiddleware from "./middleware/error.middleware.js";
import cookieParser from "cookie-parser";
import arcjetMiddleware from "./middleware/arcjet.middleware.js";
import workflowRouter from "./routes/workflow.routes.js";
import cors from "cors";

const app = express();
const corsOptions = {
  origin: "http://localhost:5500/", // or specify your frontend URL like "http://localhost:3000"
  credentials: true, // if you use cookies or auth headers
};

//swagger ui integration
import swaggerUi from "swagger-ui-express";
app.use(cors(corsOptions));
import { readFileSync } from "fs";
const swaggerDocument = JSON.parse(
  readFileSync(new URL("./swagger-output.json", import.meta.url))
);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(arcjetMiddleware);
//
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/workflows", workflowRouter);
app.use(errorMiddleware);

app.get("/", (req, res) => {
  res.send("<h1>Welcome to the Subscription Management API</h1>");
});
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  await connectToDatabase();
});

export default app;
