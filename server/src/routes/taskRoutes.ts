import { Router } from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  seedDemoTasks,
} from "../controllers/taskController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// All task routes are protected by JWT auth middleware
router.use(protect);

router.route("/").post(createTask).get(getTasks);
router.post("/seed", seedDemoTasks);
router.route("/:id").get(getTaskById).put(updateTask).delete(deleteTask);
router.patch("/:id/status", updateTaskStatus);

export default router;
