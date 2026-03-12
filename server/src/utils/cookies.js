export function refreshCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,          // true in production (https)
    sameSite: isProd ? "none" : "lax",
    path: "/api/auth/refresh",
    maxAge: (Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 7) * 24 * 60 * 60 * 1000),
  };
}