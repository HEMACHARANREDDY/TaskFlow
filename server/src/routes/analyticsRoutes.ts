import { Router } from "express";
import { getAnalytics } from "../controllers/analyticsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Analytics routes are protected by JWT auth middleware
router.use(protect);

router.get("/", getAnalytics);

export default router;
