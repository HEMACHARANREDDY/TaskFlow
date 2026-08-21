import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/User.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID ||
    "283041959943-khp0prjf4jlcubrmcf5fbjfohpcl43p1.apps.googleusercontent.com",
);

const generateToken = (id: string, role: string): string => {
  const secret = process.env.JWT_SECRET || "taskflow_super_secret_jwt_key_2026";
  return jwt.sign({ id, role }, secret, {
    expiresIn: "7d",
  });
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Please provide an email and password",
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
      return;
    }

    const user = await User.create({
      name: name?.trim() || email.split("@")[0],
      email: email.toLowerCase().trim(),
      password,
    });

    const token = generateToken(user._id.toString(), user.role);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const token = generateToken(user._id.toString(), user.role);

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: req.user._id.toString(),
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { credential, token: googleToken, name: inputName, email: inputEmail } = req.body;

    let email = inputEmail;
    let name = inputName;

    // Verify Google ID token if provided
    const idToken = credential || googleToken;
    if (idToken) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken,
          audience:
            process.env.GOOGLE_CLIENT_ID ||
            "283041959943-khp0prjf4jlcubrmcf5fbjfohpcl43p1.apps.googleusercontent.com",
        });
        const payload = ticket.getPayload();
        if (payload?.email) {
          email = payload.email;
          name = payload.name || name;
        }
      } catch (verifyError) {
        console.warn("[Google Auth] Token verification notice:", verifyError);
      }
    }

    if (!email) {
      res.status(400).json({
        success: false,
        message: "Email or valid Google token is required for Google authentication",
      });
      return;
    }

    let user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // Create user with a secure random password if first time Google sign-in
      const randomPassword = Math.random().toString(36).slice(-10) + "Aa1!";
      user = await User.create({
        name: name?.trim() || email.split("@")[0],
        email: email.toLowerCase().trim(),
        password: randomPassword,
      });
    }

    const token = generateToken(user._id.toString(), user.role);

    res.status(200).json({
      success: true,
      message: "Authenticated with Google successfully",
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};
