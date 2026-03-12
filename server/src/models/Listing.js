import mongoose from "mongoose";

const PricingRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
      trim: true,
    },

    type: {
      type: String,
      enum: ["weekend", "date_range", "discount"],
      required: true,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    price: {
      type: Number,
      default: null,
    },

    percentage: {
      type: Number,
      default: null,
    },
  },
  { _id: false },
);

const BlockedRangeSchema = new mongoose.Schema(
  {
    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    reason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },
  },
  { timestamps: true },
);

const ListingSchema = new mongoose.Schema(
  {
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    locationText: {
      type: String,
      required: true,
      trim: true,
    },

    lat: {
      type: Number,
      required: true,
    },

    lng: {
      type: Number,
      required: true,
    },

    priceBase: {
      type: Number,
      required: true,
      min: 0,
    },

    pricingRules: {
      type: [PricingRuleSchema],
      default: [],
    },

    blockedRanges: {
      type: [BlockedRangeSchema],
      default: [],
    },

    images: {
      type: [String],
      default: [],
    },

    amenities: {
      type: [String],
      default: [],
    },

    rules: {
      type: [String],
      default: [],
    },

    maxGuests: {
      type: Number,
      default: 2,
      min: 1,
    },

    ecoTags: {
      type: [String],
      default: [],
    },

    safetyFeatures: {
      cctv: { type: Boolean, default: false },
      guard: { type: Boolean, default: false },
      wellLit: { type: Boolean, default: false },
      emergencyContact: { type: Boolean, default: false },
      fireExtinguisher: { type: Boolean, default: false },
      firstAid: { type: Boolean, default: false },
    },

    status: {
      type: String,
      enum: ["pending", "active", "blocked"],
      default: "active",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Listing", ListingSchema);