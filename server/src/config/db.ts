import mongoose from "mongoose";

export const connectDB = async (): Promise<typeof mongoose | null> => {
  const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/taskflow_db";

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[Database] MongoDB Connection Notice: Could not connect to ${mongoURI}.`);
    console.warn(
      `[Database] Ensure MongoDB is running locally or set MONGODB_URI in .env for full persistence.`,
    );
    return null;
  }
};
