import OpenAI from "openai";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import Payroll from "../models/Payroll.js";
import Department from "../models/Department.js";
import Company from "../models/Company.js";
import { getTodayString } from "../utils/helpers.js";

const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

// Tool definitions for Groq
const tools = [
  {
    type: "function",
    function: {
      name: "get_employee_count",
      description: "Get total number of active employees",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_today_attendance_summary",
      description: "Get today's attendance summary (present, late, absent counts)",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pending_leaves_count",
      description: "Get number of pending leave requests",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_leave_balance",
      description: "Get leave balance of the current logged-in user",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_department_list",
      description: "List all departments with employee counts",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_company_info",
      description: "Get company name and basic settings",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];

// Execute tool calls
async function executeTool(name, args, currentUser) {
  switch (name) {
    case "get_employee_count": {
      const count = await User.countDocuments({ role: "employee", isActive: true });
      return { totalEmployees: count };
    }
    case "get_today_attendance_summary": {
      const today = getTodayString();
      const total = await User.countDocuments({ role: "employee", isActive: true });
      const records = await Attendance.find({ dateString: today });
      const present = records.filter((r) => ["present", "late"].includes(r.status)).length;
      const late = records.filter((r) => r.status === "late").length;
      return { date: today, present, late, absent: Math.max(0, total - present), total };
    }
    case "get_pending_leaves_count": {
      // Privacy: employees only see their own
      if (currentUser.role === "employee") {
        const count = await Leave.countDocuments({ employee: currentUser._id, status: "pending" });
        return { myPendingLeaves: count };
      }
      const count = await Leave.countDocuments({ status: "pending" });
      return { pendingLeaves: count };
    }
    case "get_my_leave_balance": {
      const user = await User.findById(currentUser._id).populate("leaveBalances.leaveType", "name");
      return {
        balances: user.leaveBalances.map((b) => ({
          leaveType: b.leaveType?.name,
          balance: b.balance,
        })),
      };
    }
    case "get_department_list": {
      if (currentUser.role === "employee") {
        return { message: "Only HR/Admin can view department list" };
      }
      const depts = await Department.find({ isActive: true });
      const result = [];
      for (const d of depts) {
        const count = await User.countDocuments({ department: d._id, isActive: true });
        result.push({ name: d.name, employees: count });
      }
      return { departments: result };
    }
    case "get_company_info": {
      const company = await Company.findOne();
      return {
        name: company?.name,
        workStartTime: company?.workStartTime,
        workEndTime: company?.workEndTime,
      };
    }
    default:
      return { error: "Unknown tool" };
  }
}

export const chatWithAI = async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "GROQ_API_KEY is not configured. Please add it to .env",
      });
    }

    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    // Privacy guardrails in system prompt
    const systemPrompt = `You are an AI Assistant for HCM Lite (Human Capital Management system).
Current user: ${req.user.name} (Role: ${req.user.role})

RULES:
1. Only answer questions related to HR, attendance, leave, payroll, company stats.
2. NEVER reveal personal salary, phone, or private data of other employees to non-admin users.
3. Employees can only ask about their own data.
4. HR/Admin can ask company-wide stats.
5. Be concise, friendly and professional.
6. If you need real data, use the available tools.
7. Do not invent numbers — always use tools when data is needed.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ];

    // First call
    let response = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.3,
    });

    let assistantMessage = response.choices[0].message;

    // Handle tool calls
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      messages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls) {
        const fnName = toolCall.function.name;
        let args = {};
        try {
          args = JSON.parse(toolCall.function.arguments || "{}");
        } catch (e) {}

        const result = await executeTool(fnName, args, req.user);

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }

      // Second call with tool results
      response = await client.chat.completions.create({
        model: GROQ_MODEL,
        messages,
        temperature: 0.3,
      });
      assistantMessage = response.choices[0].message;
    }

    res.json({
      success: true,
      reply: assistantMessage.content || "I could not generate a response.",
    });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ success: false, message: error.message || "AI service error" });
  }
};
