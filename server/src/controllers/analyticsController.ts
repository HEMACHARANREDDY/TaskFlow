import { Response, NextFunction } from "express";
import { Task } from "../models/Task.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

export const getAnalytics = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!._id;

    // Fetch all user's tasks for aggregation
    const tasks = await Task.find({ user: userId }).select(
      "status priority dueDate completedAt createdAt title",
    );

    const total = tasks.length;
    const todo = tasks.filter((t) => t.status === "todo").length;
    const in_progress = tasks.filter((t) => t.status === "in_progress").length;
    const done = tasks.filter((t) => t.status === "done").length;
    const pending = todo + in_progress;

    const low = tasks.filter((t) => t.priority === "low").length;
    const medium = tasks.filter((t) => t.priority === "medium").length;
    const high = tasks.filter((t) => t.priority === "high").length;

    const rate = total > 0 ? Math.round((done / total) * 100) : 0;

    // Weekly output for past 7 days
    const weekly: { day: string; completed: number }[] = [];
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const isoDay = d.toISOString().slice(0, 10);

      const count = tasks.filter((t) => {
        if (!t.completedAt) return false;
        return t.completedAt.toISOString().slice(0, 10) === isoDay;
      }).length;

      weekly.push({ day: isoDay, completed: count });
    }

    // 30-day cumulative trend
    const trend: { day: string; completed: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const isoDay = d.toISOString().slice(0, 10);

      const count = tasks.filter((t) => {
        if (!t.completedAt) return false;
        return t.completedAt.toISOString().slice(0, 10) === isoDay;
      }).length;

      trend.push({ day: isoDay, completed: count });
    }

    res.status(200).json({
      success: true,
      analytics: {
        total,
        todo,
        in_progress,
        done,
        pending,
        rate,
        priority: { low, medium, high },
        weekly,
        trend,
      },
    });
  } catch (error) {
    next(error);
  }
};
