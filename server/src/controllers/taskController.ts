import { Response, NextFunction } from "express";
import { Task, TaskPriority, TaskStatus } from "../models/Task.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

export const createTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { title, description, status, priority, due_date, dueDate } = req.body;

    if (!title || title.trim().length < 3) {
      res.status(400).json({
        success: false,
        message: "Title is required and must be at least 3 characters long",
      });
      return;
    }

    const taskStatus: TaskStatus = status || "todo";
    const parsedDueDate = due_date || dueDate ? new Date(due_date || dueDate) : null;
    const completedAt = taskStatus === "done" ? new Date() : null;

    const task = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : "",
      status: taskStatus,
      priority: (priority as TaskPriority) || "medium",
      dueDate: parsedDueDate,
      completedAt,
      user: req.user!._id,
    });

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    next(error);
  }
};

export const getTasks = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { search, status, priority, sort, page = "1", limit = "10" } = req.query;

    const query: Record<string, unknown> = { user: req.user!._id };

    // Status filter
    if (status && status !== "all") {
      query["status"] = status;
    }

    // Priority filter
    if (priority && priority !== "all") {
      query["priority"] = priority;
    }

    // Search by title or description
    if (search && typeof search === "string" && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      query["$or"] = [{ title: searchRegex }, { description: searchRegex }];
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    let sortOptions: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === "oldest") {
      sortOptions = { createdAt: 1 };
    } else if (sort === "due") {
      sortOptions = { dueDate: 1, createdAt: -1 };
    } else if (sort === "priority") {
      // Sorting priority: high -> medium -> low
      sortOptions = { priority: 1, dueDate: 1 };
    }

    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query).sort(sortOptions).skip(skip).limit(limitNum);

    const pages = Math.max(1, Math.ceil(total / limitNum));

    res.status(200).json({
      success: true,
      tasks,
      total,
      page: pageNum,
      pages,
      limit: limitNum,
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user!._id,
    });

    if (!task) {
      res.status(404).json({
        success: false,
        message: "Task not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { title, description, status, priority, due_date, dueDate } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user!._id,
    });

    if (!task) {
      res.status(404).json({
        success: false,
        message: "Task not found",
      });
      return;
    }

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (priority !== undefined) task.priority = priority;
    if (due_date !== undefined || dueDate !== undefined) {
      const rawDate = due_date !== undefined ? due_date : dueDate;
      task.dueDate = rawDate ? new Date(rawDate) : null;
    }

    if (status !== undefined) {
      task.status = status;
      if (status === "done" && !task.completedAt) {
        task.completedAt = new Date();
      } else if (status !== "done") {
        task.completedAt = null;
      }
    }

    await task.save();

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { status } = req.body;

    if (!status || !["todo", "in_progress", "done"].includes(status)) {
      res.status(400).json({
        success: false,
        message: "Valid status (todo, in_progress, done) is required",
      });
      return;
    }

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user!._id,
    });

    if (!task) {
      res.status(404).json({
        success: false,
        message: "Task not found",
      });
      return;
    }

    task.status = status;
    task.completedAt = status === "done" ? new Date() : null;
    await task.save();

    res.status(200).json({
      success: true,
      message: "Task status updated successfully",
      task,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user!._id,
    });

    if (!task) {
      res.status(404).json({
        success: false,
        message: "Task not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const seedDemoTasks = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const offset = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d;
    };

    const demoTasks = [
      {
        title: "Complete portfolio website",
        description: "Polish case studies and ship the new landing page.",
        status: "in_progress",
        priority: "high",
        dueDate: offset(2),
        completedAt: null,
        user: req.user!._id,
      },
      {
        title: "Build authentication API",
        description: "Sessions, password rules and protected routes.",
        status: "done",
        priority: "high",
        dueDate: offset(-3),
        completedAt: offset(-3),
        user: req.user!._id,
      },
      {
        title: "Prepare hackathon presentation",
        description: "Slides, demo script and a two minute walkthrough.",
        status: "todo",
        priority: "high",
        dueDate: offset(1),
        completedAt: null,
        user: req.user!._id,
      },
      {
        title: "Fix database indexes",
        description: "Add compound indexes for status and due date lookups.",
        status: "done",
        priority: "medium",
        dueDate: offset(-1),
        completedAt: offset(-1),
        user: req.user!._id,
      },
      {
        title: "Design dashboard",
        description: "Editorial layout with productivity ring and weekly chart.",
        status: "done",
        priority: "medium",
        dueDate: offset(-2),
        completedAt: offset(-2),
        user: req.user!._id,
      },
      {
        title: "Deploy application",
        description: "Production build, environment checks and smoke test.",
        status: "todo",
        priority: "medium",
        dueDate: offset(5),
        completedAt: null,
        user: req.user!._id,
      },
      {
        title: "Write documentation",
        description: "README, API reference and setup instructions.",
        status: "todo",
        priority: "low",
        dueDate: offset(7),
        completedAt: null,
        user: req.user!._id,
      },
      {
        title: "Review analytics queries",
        description: "Ensure aggregates read from live task data only.",
        status: "in_progress",
        priority: "low",
        dueDate: offset(4),
        completedAt: null,
        user: req.user!._id,
      },
    ];

    await Task.insertMany(demoTasks);

    res.status(201).json({
      success: true,
      message: "Demo tasks seeded successfully",
    });
  } catch (error) {
    next(error);
  }
};
