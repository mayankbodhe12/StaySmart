import User from "../models/User.js";

export async function becomeHost(req, res, next) {
  try {
    const user = await User.findById(req.user.sub);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // already host
    if (user.role === "host") {
      return res.status(400).json({
        message: "User is already a host",
      });
    }

    // upgrade role
    user.role = "host";
    await user.save();

    res.json({
      message: "You are now a host",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    next(e);
  }
}