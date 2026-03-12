import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing access token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // DB se latest user lao
    const user = await User.findById(payload.sub).select("_id name email role");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      sub: String(user._id),
      email: user.email,
      role: user.role,
      name: user.name,
    };

    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}