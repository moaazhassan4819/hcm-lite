import Payroll from "../models/Payroll.js";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import Company from "../models/Company.js";
import { countWorkingDays } from "../utils/helpers.js";

// Calculate / generate payroll for a month (HR / Admin)
export const generatePayroll = async (req, res) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) {
      return res.status(400).json({ success: false, message: "Month and year are required" });
    }

    const company = await Company.findOne();
    const workingDaysArr = company?.workingDays || [1, 2, 3, 4, 5];

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const totalWorkingDays = countWorkingDays(startDate, endDate, workingDaysArr);

    const employees = await User.find({ role: "employee", isActive: true });

    const results = [];

    for (const emp of employees) {
      // Skip if already finalized
      const existing = await Payroll.findOne({ employee: emp._id, month, year });
      if (existing && existing.status === "finalized") {
        results.push({ employee: emp.name, status: "already finalized", payroll: existing });
        continue;
      }

      // Attendance stats
      const attendanceRecords = await Attendance.find({
        employee: emp._id,
        date: { $gte: startDate, $lte: endDate },
      });

      let presentDays = 0;
      let lateDays = 0;
      let absentDays = 0;

      attendanceRecords.forEach((r) => {
        if (r.status === "present") presentDays++;
        else if (r.status === "late") {
          presentDays++;
          lateDays++;
        } else if (r.status === "absent") absentDays++;
        else if (r.status === "half-day") presentDays += 0.5;
      });

      // Approved leaves in this month
      const leaves = await Leave.find({
        employee: emp._id,
        status: "approved",
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
      }).populate("leaveType");

      let leaveDays = 0;
      let unpaidLeaveDays = 0;

      leaves.forEach((l) => {
        if (l.leaveType?.isPaid) leaveDays += l.days;
        else unpaidLeaveDays += l.days;
      });

      // Simple calculation:
      // Gross = basic + hra + allowances
      // Per day = gross / totalWorkingDays
      // Deduction for unpaid leave + absent
      const basic = emp.basicSalary || 0;
      const hra = emp.hra || 0;
      const allowances = emp.allowances || 0;
      const gross = basic + hra + allowances;
      const perDay = totalWorkingDays > 0 ? gross / totalWorkingDays : 0;

      const deductions = (absentDays + unpaidLeaveDays) * perDay;
      const net = Math.max(0, Math.round(gross - deductions));

      const payrollData = {
        employee: emp._id,
        month,
        year,
        basicSalary: basic,
        hra,
        allowances,
        totalWorkingDays,
        presentDays,
        lateDays,
        absentDays,
        leaveDays,
        unpaidLeaveDays,
        grossSalary: gross,
        deductions: Math.round(deductions),
        netSalary: net,
        status: "draft",
      };

      let payroll;
      if (existing) {
        Object.assign(existing, payrollData);
        payroll = await existing.save();
      } else {
        payroll = await Payroll.create(payrollData);
      }

      results.push({
        employee: emp.name,
        employeeId: emp.employeeId,
        status: "calculated",
        payroll,
      });
    }

    res.json({ success: true, message: "Payroll generated", results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get payroll list
export const getPayrolls = async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;
    const query = {};

    if (month) query.month = Number(month);
    if (year) query.year = Number(year);
    if (employeeId) query.employee = employeeId;

    // Employees only see their own
    if (req.user.role === "employee") {
      query.employee = req.user._id;
    }

    const payrolls = await Payroll.find(query)
      .populate("employee", "name email employeeId department")
      .populate("finalizedBy", "name")
      .sort({ year: -1, month: -1 });

    res.json({ success: true, payrolls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Finalize payroll (Admin only)
export const finalizePayroll = async (req, res) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) {
      return res.status(400).json({ success: false, message: "Month and year required" });
    }

    const result = await Payroll.updateMany(
      { month, year, status: "draft" },
      {
        status: "finalized",
        finalizedBy: req.user._id,
        finalizedAt: new Date(),
      }
    );

    res.json({
      success: true,
      message: `Finalized ${result.modifiedCount} payroll records for ${month}/${year}`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single payroll
export const getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate("employee", "name email employeeId department")
      .populate("finalizedBy", "name");

    if (!payroll) {
      return res.status(404).json({ success: false, message: "Payroll not found" });
    }

    if (req.user.role === "employee" && payroll.employee._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    res.json({ success: true, payroll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
