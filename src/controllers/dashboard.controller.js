import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import Payroll from "../models/Payroll.js";
import Department from "../models/Department.js";
import { getTodayString } from "../utils/helpers.js";

// Admin / HR Dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const today = getTodayString();

    const totalEmployees = await User.countDocuments({ role: "employee", isActive: true });
    const totalHR = await User.countDocuments({ role: "hr", isActive: true });
    const totalDepartments = await Department.countDocuments({ isActive: true });

    // Today's attendance
    const todayAttendance = await Attendance.find({ dateString: today });
    const presentToday = todayAttendance.filter((a) => ["present", "late"].includes(a.status)).length;
    const lateToday = todayAttendance.filter((a) => a.status === "late").length;
    const absentToday = totalEmployees - presentToday; // rough (those not checked in)

    // Pending leaves
    const pendingLeaves = await Leave.countDocuments({ status: "pending" });

    // This month leaves
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const approvedLeavesThisMonth = await Leave.countDocuments({
      status: "approved",
      startDate: { $gte: monthStart },
    });

    // Recent pending leaves
    const recentPendingLeaves = await Leave.find({ status: "pending" })
      .populate("employee", "name employeeId")
      .populate("leaveType", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    // Department wise employee count
    const deptStats = await User.aggregate([
      { $match: { role: "employee", isActive: true, department: { $ne: null } } },
      { $group: { _id: "$department", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "dept",
        },
      },
      { $unwind: "$dept" },
      { $project: { name: "$dept.name", count: 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalEmployees,
        totalHR,
        totalDepartments,
        presentToday,
        lateToday,
        absentToday: Math.max(0, absentToday),
        pendingLeaves,
        approvedLeavesThisMonth,
      },
      recentPendingLeaves,
      deptStats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Employee personal dashboard
export const getEmployeeDashboard = async (req, res) => {
  try {
    const today = getTodayString();
    const userId = req.user._id;

    const todayAttendance = await Attendance.findOne({ employee: userId, dateString: today });

    const user = await User.findById(userId)
      .populate("leaveBalances.leaveType", "name")
      .populate("department", "name");

    const myPendingLeaves = await Leave.countDocuments({ employee: userId, status: "pending" });

    // This month attendance summary
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthRecords = await Attendance.find({
      employee: userId,
      date: { $gte: monthStart },
    });

    const presentDays = monthRecords.filter((r) => ["present", "late"].includes(r.status)).length;
    const lateDays = monthRecords.filter((r) => r.status === "late").length;

    // Latest payroll
    const latestPayroll = await Payroll.findOne({ employee: userId })
      .sort({ year: -1, month: -1 })
      .limit(1);

    res.json({
      success: true,
      todayAttendance,
      leaveBalances: user.leaveBalances,
      department: user.department,
      myPendingLeaves,
      monthSummary: { presentDays, lateDays },
      latestPayroll,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
