import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: {
      type: Number, // 1-12
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    // Snapshot of salary at calculation time
    basicSalary: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    // Attendance based
    totalWorkingDays: { type: Number, default: 0 },
    presentDays: { type: Number, default: 0 },
    lateDays: { type: Number, default: 0 },
    absentDays: { type: Number, default: 0 },
    leaveDays: { type: Number, default: 0 }, // paid leave days
    unpaidLeaveDays: { type: Number, default: 0 },
    // Calculations
    grossSalary: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },
    // Status
    status: {
      type: String,
      enum: ["draft", "finalized"],
      default: "draft",
    },
    finalizedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    finalizedAt: {
      type: Date,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// One payroll per employee per month
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

const Payroll = mongoose.model("Payroll", payrollSchema);
export default Payroll;
