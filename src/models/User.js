import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
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
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["admin", "hr", "employee"],
      default: "employee",
    },
    // Employee-specific fields
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    designation: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    joiningDate: {
      type: Date,
    },
    // Salary structure
    basicSalary: {
      type: Number,
      default: 0,
    },
    hra: {
      type: Number,
      default: 0,
    },
    allowances: {
      type: Number,
      default: 0,
    },
    // Leave balances (synced from leave types)
    leaveBalances: [
      {
        leaveType: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "LeaveType",
        },
        balance: {
          type: Number,
          default: 0,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
