export function errorHandler(err, req, res, next) {
  console.error("❌ Error:", err);

  // Multer errors
  if (err?.name === "MulterError") {
    return res.status(400).json({ message: err.message, details: err.code });
  }

  const status = err.status || 500;
  const message = err.message || String(err) || "Server error";

  res.status(status).json({
    message,
    details: err.details || null,
  });
}