import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    // Store as YYYY-MM-DD for easy querying
    dateString: {
      type: String,
      required: true,
    },
    checkIn: {
      time: Date,
      latitude: Number,
      longitude: Number,
    },
    checkOut: {
      time: Date,
      latitude: Number,
      longitude: Number,
    },
    status: {
      type: String,
      enum: ["present", "late", "absent", "half-day", "on-leave"],
      default: "absent",
    },
    // Working minutes (calculated on checkout)
    workMinutes: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// One record per employee per day
attendanceSchema.index({ employee: 1, dateString: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
