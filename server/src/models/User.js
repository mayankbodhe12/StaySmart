import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["guest", "host", "admin"],
      default: "guest",
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    verifiedKyc: {
      type: Boolean,
      default: false,
    },

    refreshTokenHash: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", UserSchema);