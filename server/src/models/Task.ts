import mongoose, { Document, Schema, Model } from "mongoose";

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  completedAt: Date | null;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters long"],
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: {
        values: ["todo", "in_progress", "done"],
        message: "Status must be either todo, in_progress, or done",
      },
      default: "todo",
      index: true,
    },
    priority: {
      type: String,
      enum: {
        values: ["low", "medium", "high"],
        message: "Priority must be either low, medium, or high",
      },
      default: "medium",
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Task must belong to a user"],
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        ret.user_id = ret.user ? ret.user.toString() : "";
        ret.due_date = ret.dueDate ? ret.dueDate.toISOString().slice(0, 10) : null;
        ret.completed_at = ret.completedAt ? ret.completedAt.toISOString() : null;
        ret.created_at = ret.createdAt ? ret.createdAt.toISOString() : "";
        ret.updated_at = ret.updatedAt ? ret.updatedAt.toISOString() : "";
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Compound indexes for optimized querying, filtering, and sorting
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, priority: 1 });
taskSchema.index({ user: 1, dueDate: 1 });
taskSchema.index({ user: 1, createdAt: -1 });

// Full text index on title and description for fast search
taskSchema.index({ title: "text", description: "text" });

export const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>("Task", taskSchema);
