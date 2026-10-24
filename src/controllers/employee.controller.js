import User from "../models/User.js";
import LeaveType from "../models/LeaveType.js";

// Generate simple employee ID
const generateEmployeeId = async () => {
  const count = await User.countDocuments({ role: "employee" });
  return `EMP${String(count + 1).padStart(4, "0")}`;
};

// Get all employees (HR / Admin)
export const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: { $in: ["employee", "hr"] } })
      .select("-password")
      .populate("department", "name")
      .populate("leaveBalances.leaveType", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single employee
export const getEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id)
      .select("-password")
      .populate("department", "name")
      .populate("leaveBalances.leaveType", "name defaultDays");

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Employees can only view themselves
    if (req.user.role === "employee" && req.user._id.toString() !== employee._id.toString()) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    res.json({ success: true, employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Register new employee (HR / Admin)
export const createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      department,
      designation,
      phone,
      joiningDate,
      basicSalary,
      hra,
      allowances,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    // Only admin can create HR
    const finalRole = role === "hr" && req.user.role === "admin" ? "hr" : "employee";

    const employeeId = await generateEmployeeId();

    // Assign default leave balances from active leave types
    const leaveTypes = await LeaveType.find({ isActive: true });
    const leaveBalances = leaveTypes.map((lt) => ({
      leaveType: lt._id,
      balance: lt.defaultDays,
    }));

    const employee = await User.create({
      name,
      email,
      password,
      role: finalRole,
      employeeId,
      department: department || undefined,
      designation: designation || "",
      phone: phone || "",
      joiningDate: joiningDate || new Date(),
      basicSalary: basicSalary || 0,
      hra: hra || 0,
      allowances: allowances || 0,
      leaveBalances,
      mustChangePassword: true, // force change on first login
    });

    const populated = await User.findById(employee._id)
      .select("-password")
      .populate("department", "name")
      .populate("leaveBalances.leaveType", "name");

    res.status(201).json({
      success: true,
      message: "Employee created successfully. Temporary password set.",
      employee: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update employee
export const updateEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Employees can only update limited fields of themselves
    if (req.user.role === "employee") {
      if (req.user._id.toString() !== employee._id.toString()) {
        return res.status(403).json({ success: false, message: "Not allowed" });
      }
      // Only allow phone
      if (req.body.phone !== undefined) employee.phone = req.body.phone;
      await employee.save();
      return res.json({ success: true, message: "Profile updated", employee });
    }

    // HR / Admin can update more
    const fields = [
      "name",
      "department",
      "designation",
      "phone",
      "joiningDate",
      "basicSalary",
      "hra",
      "allowances",
      "isActive",
    ];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) employee[f] = req.body[f];
    });

    // Only admin can change role
    if (req.user.role === "admin" && req.body.role) {
      if (["hr", "employee"].includes(req.body.role)) {
        employee.role = req.body.role;
      }
    }

    await employee.save();

    const updated = await User.findById(employee._id)
      .select("-password")
      .populate("department", "name")
      .populate("leaveBalances.leaveType", "name");

    res.json({ success: true, message: "Employee updated", employee: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Soft delete / deactivate
export const deactivateEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }
    if (employee.role === "admin") {
      return res.status(400).json({ success: false, message: "Cannot deactivate admin" });
    }
    employee.isActive = false;
    await employee.save();
    res.json({ success: true, message: "Employee deactivated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
