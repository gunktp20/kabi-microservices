import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { errorHandler, notFound } from "./errors/index";
import authRouter from "./routes/auth.route";
import userRouter from "./routes/user.route";
import dotenv from "dotenv";
import "express-async-errors";
import sequelize from "./db/connection";
import { PORT, SERVICE_NAME, CLIENT_URL } from "./config/application.config";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const logger = (req: Request, res: Response, next: NextFunction) => {
  console.log(`[${SERVICE_NAME}] ${req.method} ${req.originalUrl}`);
  next();
};

app.use(logger);

app.get("/health", (req: Request, res: Response) => {
  res.json({
    service: SERVICE_NAME,
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  try {
    await sequelize.sync({
      alter: true,
    });
    app.listen(PORT, () => {
      console.log(`🚀 ${SERVICE_NAME} is running on port : ${PORT}`);
    });
  } catch (err) {
    console.log("Error starting user service:", err);
  }
};

start();
