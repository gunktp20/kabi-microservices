import express from "express";
import "express-async-errors";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { PORT , CLIENT_URL } from "./config/application.config";
import sequelize from "./db/connection";
import errorHandlerMiddleware from "./middlewares/error-handler";
import notFound from "./middlewares/not-found";

import boardRoutes from "./routes/board.route";
import columnRoutes from "./routes/column.route";

// Import models with associations initialized
import "./models/associations";

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

app.use(limiter);
app.use(helmet());
app.use(cors({
  origin: CLIENT_URL, 
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", service: "board-service" });
});

app.use("/api/boards", boardRoutes);
app.use("/api/columns", columnRoutes);

app.use(notFound);
app.use(errorHandlerMiddleware);

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully");
    
    await sequelize.sync({ force: false });
    console.log("Database synced");
    
    app.listen(PORT, () => {
      console.log(`Board service is listening on port ${PORT}...`);
    });
  } catch (error) {
    console.error("Failed to start board service:", error);
    process.exit(1);
  }
};

start();