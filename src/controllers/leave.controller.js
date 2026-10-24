import Leave from "../models/Leave.js";
import User from "../models/User.js";
import LeaveType from "../models/LeaveType.js";
import { countWorkingDays } from "../utils/helpers.js";
import Company from "../models/Company.js";

// Apply for leave
export const applyLeave = async (req, res) => {
  try {
    const { leaveTypeId, startDate, endDate, reason } = req.body;

    if (!leaveTypeId || !startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const leaveType = await LeaveType.findById(leaveTypeId);
    if (!leaveType || !leaveType.isActive) {
      return res.status(400).json({ success: false, message: "Invalid leave type" });
    }

    const company = await Company.findOne();
    const workingDays = company?.workingDays || [1, 2, 3, 4, 5];
    const days = countWorkingDays(startDate, endDate, workingDays);

    if (days <= 0) {
      return res.status(400).json({ success: false, message: "No working days in selected range" });
    }

    // Check balance
    const user = await User.findById(req.user._id);
    const balanceEntry = user.leaveBalances.find(
      (b) => b.leaveType.toString() === leaveTypeId
    );
    const balance = balanceEntry ? balanceEntry.balance : 0;

    if (balance < days) {
      return res.status(400).json({
        success: false,
        message: `Insufficient leave balance. Available: ${balance}, Requested: ${days}`,
      });
    }

    const leave = await Leave.create({
      employee: req.user._id,
      leaveType: leaveTypeId,
      startDate,
      endDate,
      days,
      reason,
      status: "pending",
    });

    const populated = await Leave.findById(leave._id)
      .populate("leaveType", "name isPaid")
      .populate("employee", "name email employeeId");

    res.status(201).json({ success: true, message: "Leave applied successfully", leave: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get my leaves
export const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.user._id })
      .populate("leaveType", "name isPaid")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all leaves (HR / Admin)
export const getAllLeaves = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const leaves = await Leave.find(query)
      .populate("employee", "name email employeeId department")
      .populate("leaveType", "name isPaid")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve / Reject leave
export const reviewLeave = async (req, res) => {
  try {
    const { status, reviewComment } = req.body; // status: approved | rejected

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be approved or rejected" });
    }

    const leave = await Leave.findById(req.params.id).populate("leaveType");
    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave not found" });
    }
    if (leave.status !== "pending") {
      return res.status(400).json({ success: false, message: "Leave already reviewed" });
    }

    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    leave.reviewComment = reviewComment || "";

    // Deduct balance only if approved
    if (status === "approved") {
      const employee = await User.findById(leave.employee);
      const bal = employee.leaveBalances.find(
        (b) => b.leaveType.toString() === leave.leaveType._id.toString()
      );
      if (bal) {
        bal.balance = Math.max(0, bal.balance - leave.days);
        await employee.save();
      }
    }

    await leave.save();

    const populated = await Leave.findById(leave._id)
      .populate("employee", "name email employeeId")
      .populate("leaveType", "name isPaid")
      .populate("reviewedBy", "name");

    res.json({ success: true, message: `Leave ${status}`, leave: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel own pending leave
export const cancelLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave not found" });
    }
    if (leave.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }
    if (leave.status !== "pending") {
      return res.status(400).json({ success: false, message: "Only pending leaves can be cancelled" });
    }

    leave.status = "cancelled";
    await leave.save();

    res.json({ success: true, message: "Leave cancelled" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
