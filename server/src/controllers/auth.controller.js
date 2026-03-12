import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../models/User.js";
import { registerSchema, loginSchema } from "../validators/auth.validators.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/tokens.js";
import { refreshCookieOptions } from "../utils/cookies.js";

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);

    const exists = await User.findOne({ email: data.email });
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await User.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role: "guest",
    });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    res.cookie("refresh_token", refreshToken, refreshCookieOptions());

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
    });
  } catch (e) {
    if (e?.name === "ZodError") {
      return res.status(400).json({ message: "Validation error", details: e.errors });
    }
    next(e);
  }
}

export async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);

    const user = await User.findOne({ email: data.email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    res.cookie("refresh_token", refreshToken, refreshCookieOptions());

    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
    });
  } catch (e) {
    if (e?.name === "ZodError") {
      return res.status(400).json({ message: "Validation error", details: e.errors });
    }
    next(e);
  }
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) return res.status(401).json({ message: "Missing refresh token" });

    let payload;
    try {
      payload = verifyRefreshToken(token); // { sub }
    } catch {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findById(payload.sub);
    if (!user || !user.refreshTokenHash) return res.status(401).json({ message: "Session expired" });

    const matches = user.refreshTokenHash === hashToken(token);
    if (!matches) return res.status(401).json({ message: "Session expired" });

    const newAccess = signAccessToken(user);

    res.json({ accessToken: newAccess });
  } catch (e) {
    next(e);
  }
}

export async function logout(req, res, next) {
  try {
    const token = req.cookies?.refresh_token;

    if (token) {
      // best effort invalidate
      try {
        const payload = verifyRefreshToken(token);
        await User.findByIdAndUpdate(payload.sub, { refreshTokenHash: null });
      } catch {}
    }

    res.clearCookie("refresh_token", { path: "/api/auth/refresh" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}