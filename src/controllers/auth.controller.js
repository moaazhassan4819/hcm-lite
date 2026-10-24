import User from "../models/User.js";
import Company from "../models/Company.js";
import generateToken from "../utils/generateToken.js";

// Check if system is fresh (no admin exists)
export const checkSetup = async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: "admin" });
    const company = await Company.findOne();

    res.json({
      success: true,
      isSetupComplete: adminCount > 0 && company?.isSetupComplete === true,
      hasAdmin: adminCount > 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// First-run: Register Admin + Company
export const setupAdmin = async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount > 0) {
      return res.status(400).json({ success: false, message: "Admin already exists. Setup already done." });
    }

    const { name, email, password, companyName, address } = req.body;

    if (!name || !email || !password || !companyName) {
      return res.status(400).json({ success: false, message: "Name, email, password and company name are required" });
    }

    // Create company
    const company = await Company.create({
      name: companyName,
      address: address || "",
      isSetupComplete: true,
    });

    // Create admin user
    const admin = await User.create({
      name,
      email,
      password,
      role: "admin",
    });

    const token = generateToken(admin._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: "Admin and company setup successful",
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      company: {
        id: company._id,
        name: company.name,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        employeeId: user.employeeId,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Logout
export const logout = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.json({ success: true, message: "Logged out successfully" });
};

// Get current user
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("department", "name")
      .populate("leaveBalances.leaveType", "name defaultDays");

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Change password (for temporary passwords)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
