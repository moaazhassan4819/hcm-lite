import Attendance from "../models/Attendance.js";
import Company from "../models/Company.js";
import User from "../models/User.js";
import { getTodayString, timeToMinutes, getDistanceMeters } from "../utils/helpers.js";

// Check-in
export const checkIn = async (req, res) => {
  try {
    const today = getTodayString();
    const employeeId = req.user._id;

    // Already checked in?
    let record = await Attendance.findOne({ employee: employeeId, dateString: today });
    if (record && record.checkIn?.time) {
      return res.status(400).json({ success: false, message: "Already checked in today" });
    }

    const company = await Company.findOne();
    const now = new Date();
    const { latitude, longitude } = req.body;

    // Optional geo check
    if (company?.latitude != null && company?.longitude != null && latitude != null && longitude != null) {
      const dist = getDistanceMeters(company.latitude, company.longitude, latitude, longitude);
      if (dist > (company.radiusMeters || 200)) {
        return res.status(400).json({
          success: false,
          message: `You are outside the office radius (${Math.round(dist)}m away). Allowed: ${company.radiusMeters}m`,
        });
      }
    }

    // Determine late status
    let status = "present";
    if (company?.workStartTime) {
      const startMinutes = timeToMinutes(company.workStartTime);
      const lateThreshold = company.lateThresholdMinutes || 15;
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (nowMinutes > startMinutes + lateThreshold) {
        status = "late";
      }
    }

    if (record) {
      record.checkIn = { time: now, latitude, longitude };
      record.status = status;
      await record.save();
    } else {
      record = await Attendance.create({
        employee: employeeId,
        date: now,
        dateString: today,
        checkIn: { time: now, latitude, longitude },
        status,
      });
    }

    res.json({
      success: true,
      message: status === "late" ? "Checked in (Late)" : "Checked in successfully",
      attendance: record,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Check-out
export const checkOut = async (req, res) => {
  try {
    const today = getTodayString();
    const employeeId = req.user._id;

    const record = await Attendance.findOne({ employee: employeeId, dateString: today });
    if (!record || !record.checkIn?.time) {
      return res.status(400).json({ success: false, message: "Please check-in first" });
    }
    if (record.checkOut?.time) {
      return res.status(400).json({ success: false, message: "Already checked out today" });
    }

    const now = new Date();
    const { latitude, longitude } = req.body;

    const workMinutes = Math.round((now - new Date(record.checkIn.time)) / 60000);

    record.checkOut = { time: now, latitude, longitude };
    record.workMinutes = workMinutes;
    await record.save();

    res.json({
      success: true,
      message: "Checked out successfully",
      attendance: record,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get my attendance (Employee)
export const getMyAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;
    const query = { employee: req.user._id };

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(query).sort({ date: -1 });
    res.json({ success: true, records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get today's status for current user
export const getTodayStatus = async (req, res) => {
  try {
    const today = getTodayString();
    const record = await Attendance.findOne({ employee: req.user._id, dateString: today });
    res.json({ success: true, attendance: record || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all attendance (HR / Admin) - with filters
export const getAllAttendance = async (req, res) => {
  try {
    const { date, employeeId, month, year } = req.query;
    const query = {};

    if (date) {
      query.dateString = date;
    } else if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    } else {
      // default today
      query.dateString = getTodayString();
    }

    if (employeeId) {
      query.employee = employeeId;
    }

    const records = await Attendance.find(query)
      .populate("employee", "name email employeeId department")
      .sort({ date: -1 });

    res.json({ success: true, records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark absent for employees who didn't check in (can be called by cron or manually by HR)
export const markAbsents = async (req, res) => {
  try {
    const dateStr = req.body.date || getTodayString();
    const company = await Company.findOne();
    const workingDays = company?.workingDays || [1, 2, 3, 4, 5];
    const dayOfWeek = new Date(dateStr).getDay();

    if (!workingDays.includes(dayOfWeek)) {
      return res.json({ success: true, message: "Not a working day", marked: 0 });
    }

    const employees = await User.find({ role: "employee", isActive: true });
    let marked = 0;

    for (const emp of employees) {
      const existing = await Attendance.findOne({ employee: emp._id, dateString: dateStr });
      if (!existing) {
        await Attendance.create({
          employee: emp._id,
          date: new Date(dateStr),
          dateString: dateStr,
          status: "absent",
        });
        marked++;
      }
    }

    res.json({ success: true, message: `Marked ${marked} absents for ${dateStr}`, marked });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
