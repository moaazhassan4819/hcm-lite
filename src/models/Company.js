import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      default: "",
    },
    // Office location for attendance geo-check (optional)
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    // Radius in meters for check-in
    radiusMeters: {
      type: Number,
      default: 200,
    },
    // Working hours
    workStartTime: {
      type: String,
      default: "09:00", // HH:mm
    },
    workEndTime: {
      type: String,
      default: "18:00",
    },
    // Late threshold in minutes after workStartTime
    lateThresholdMinutes: {
      type: Number,
      default: 15,
    },
    // Working days (0=Sun, 1=Mon ... 6=Sat)
    workingDays: {
      type: [Number],
      default: [1, 2, 3, 4, 5], // Mon-Fri
    },
    isSetupComplete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Only one company document for this lite version
const Company = mongoose.model("Company", companySchema);
export default Company;
