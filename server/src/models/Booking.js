import mongoose from "mongoose";

const SplitMemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    paid: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const BookingSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
      index: true,
    },

    guestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    checkIn: {
      type: Date,
      required: true,
    },

    checkOut: {
      type: Date,
      required: true,
    },

    guests: {
      type: Number,
      required: true,
      min: 1,
    },

    pricePerNight: {
      type: Number,
      required: true,
      min: 0,
    },

    nights: {
      type: Number,
      required: true,
      min: 1,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
      index: true,
    },

    groupId: {
      type: String,
    },

    splitMembers: {
      type: [SplitMemberSchema],
      default: [],
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid"],
      default: "pending",
      index: true,
    },

    razorpay: {
      orderId: {
        type: String,
        default: null,
      },
      paymentId: {
        type: String,
        default: null,
      },
      signature: {
        type: String,
        default: null,
      },
    },
  },
  { timestamps: true },
);

BookingSchema.index(
  { groupId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      groupId: { $type: "string" },
    },
  },
);

export default mongoose.model("Booking", BookingSchema);
