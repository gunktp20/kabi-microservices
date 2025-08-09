import express from "express";
import {
  register,
  login,
  verifyEmailWithToken,
  verifyAccessToken,
  getUserProfile,
} from "../controllers/auth.controller";
import rateLimit from "express-rate-limit";
import auth from "../middlewares/auth";

const router = express.Router();

const registerLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message:
    "Too many accounts created request, please try again after 1 minutes",
});

router.route("/register").post(registerLimiter, register);
router.route("/login").post(login);
router.route("/email/").put(verifyEmailWithToken);
router.route("/verify").post(verifyAccessToken);
router.route("/profile/:userId").get(auth, getUserProfile);

export default router;