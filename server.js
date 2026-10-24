import dns from "node:dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import express from "express";
import cors from "cors";
import "dotenv/config";
import path from "path";
import cookieParser from "cookie-parser";
import connectDB from "./src/config/db.js";

import authRoutes from "./src/routes/auth.routes.js";
import companyRoutes from "./src/routes/company.routes.js";
import employeeRoutes from "./src/routes/employee.routes.js";
import attendanceRoutes from "./src/routes/attendance.routes.js";
import leaveRoutes from "./src/routes/leave.routes.js";
import payrollRoutes from "./src/routes/payroll.routes.js";
import dashboardRoutes from "./src/routes/dashboard.routes.js";
import aiRoutes from "./src/routes/ai.routes.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "success", message: "HCM Lite API is Working" });
});

// Serve React frontend (production build)
const __dirname = path.resolve();
const __frontend = path.join(__dirname, "./web/dist");
app.use("/", express.static(__frontend));
app.use("/*splat", express.static(__frontend));

const startServer = async () => {
  const PORT = process.env.PORT || 8000;
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`HCM Lite API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
  }
};

startServer();
