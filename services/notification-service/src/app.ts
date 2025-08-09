import express from "express";
import "express-async-errors";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { PORT } from "./config/application.config";
import sequelize from "./db/connection";
import errorHandlerMiddleware from "./middlewares/error-handler";
import notFound from "./middlewares/not-found";

import notificationRoutes from "./routes/notification.route";
import invitationRoutes from "./routes/invitation.route";
import assignmentRoutes from "./routes/assignment.route";

// import Invitation from "./models/Invitation";
// import Assignment from "./models/Assignment";

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

app.use(limiter);
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", service: "notification-service" });
});

app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/invitations", invitationRoutes);
app.use("/api/v1/assignments", assignmentRoutes);

app.use(notFound);
app.use(errorHandlerMiddleware);

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully");
    
    await sequelize.sync({ force: false });
    console.log("Database synced");
    
    app.listen(PORT, () => {
      console.log(`Notification service is listening on port ${PORT}...`);
    });
  } catch (error) {
    console.error("Failed to start notification service:", error);
    process.exit(1);
  }
};

start();