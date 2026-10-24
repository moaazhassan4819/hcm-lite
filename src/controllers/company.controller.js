import Company from "../models/Company.js";
import Department from "../models/Department.js";
import LeaveType from "../models/LeaveType.js";

// Get company settings
export const getCompany = async (req, res) => {
  try {
    const company = await Company.findOne();
    if (!company) {
      return res.status(404).json({ success: false, message: "Company not set up yet" });
    }
    res.json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update company settings (Admin only)
export const updateCompany = async (req, res) => {
  try {
    let company = await Company.findOne();
    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    const allowed = [
      "name",
      "address",
      "latitude",
      "longitude",
      "radiusMeters",
      "workStartTime",
      "workEndTime",
      "lateThresholdMinutes",
      "workingDays",
    ];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        company[field] = req.body[field];
      }
    });

    await company.save();
    res.json({ success: true, message: "Company updated", company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Departments ----------
export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json({ success: true, departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Department name is required" });
    }
    const exists = await Department.findOne({ name });
    if (exists) {
      return res.status(400).json({ success: false, message: "Department already exists" });
    }
    const department = await Department.create({ name, description });
    res.status(201).json({ success: true, department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }
    res.json({ success: true, department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }
    res.json({ success: true, message: "Department deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Leave Types ----------
export const getLeaveTypes = async (req, res) => {
  try {
    const leaveTypes = await LeaveType.find().sort({ name: 1 });
    res.json({ success: true, leaveTypes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createLeaveType = async (req, res) => {
  try {
    const { name, description, defaultDays, isPaid } = req.body;
    if (!name || defaultDays === undefined) {
      return res.status(400).json({ success: false, message: "Name and defaultDays are required" });
    }
    const leaveType = await LeaveType.create({
      name,
      description,
      defaultDays,
      isPaid: isPaid !== false,
    });
    res.status(201).json({ success: true, leaveType });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLeaveType = async (req, res) => {
  try {
    const leaveType = await LeaveType.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!leaveType) {
      return res.status(404).json({ success: false, message: "Leave type not found" });
    }
    res.json({ success: true, leaveType });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteLeaveType = async (req, res) => {
  try {
    const leaveType = await LeaveType.findByIdAndDelete(req.params.id);
    if (!leaveType) {
      return res.status(404).json({ success: false, message: "Leave type not found" });
    }
    res.json({ success: true, message: "Leave type deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
