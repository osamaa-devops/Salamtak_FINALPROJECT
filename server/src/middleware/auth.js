import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { User } from "../models/User.js";

export async function protect(req, _res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(new AppError("Authentication required", 401));
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id).select("-passwordHash");

    if (!user || !user.isActive) {
      return next(new AppError("User no longer exists or is inactive", 401));
    }

    req.user = user;
    next();
  } catch (_error) {
    next(new AppError("Invalid or expired token", 401));
  }
}

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(new AppError("You are not allowed to perform this action", 403));
    }

    next();
  };
}
