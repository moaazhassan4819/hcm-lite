import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [empData, setEmpData] = useState(null);
  const isAdminOrHR = user?.role === "admin" || user?.role === "hr";

  useEffect(() => {
    if (isAdminOrHR) {
      api.get("/dashboard/admin").then((res) => setStats(res.data)).catch(console.error);
    } else {
      api.get("/dashboard/employee").then((res) => setEmpData(res.data)).catch(console.error);
    }
  }, [isAdminOrHR]);

  if (isAdminOrHR) {
    if (!stats) return <div>Loading dashboard...</div>;
    const s = stats.stats;
    return (
      <div>
        <h1 className="page-title">Dashboard</h1>
        <div className="stats-grid">
          <div className="stat-card blue"><div className="label">Employees</div><div className="value">{s.totalEmployees}</div></div>
          <div className="stat-card green"><div className="label">Present Today</div><div className="value">{s.presentToday}</div></div>
          <div className="stat-card orange"><div className="label">Late Today</div><div className="value">{s.lateToday}</div></div>
          <div className="stat-card red"><div className="label">Absent Today</div><div className="value">{s.absentToday}</div></div>
          <div className="stat-card purple"><div className="label">Pending Leaves</div><div className="value">{s.pendingLeaves}</div></div>
          <div className="stat-card"><div className="label">Departments</div><div className="value">{s.totalDepartments}</div></div>
        </div>

        <div className="card">
          <div className="card-title">Recent Pending Leaves</div>
          {stats.recentPendingLeaves?.length === 0 ? (
            <div className="empty">No pending leaves</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Employee</th><th>Type</th><th>Days</th><th>Reason</th></tr></thead>
                <tbody>
                  {stats.recentPendingLeaves?.map((l) => (
                    <tr key={l._id}>
                      <td>{l.employee?.name}</td>
                      <td>{l.leaveType?.name}</td>
                      <td>{l.days}</td>
                      <td>{l.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Employee dashboard
  if (!empData) return <div>Loading...</div>;
  return (
    <div>
      <h1 className="page-title">My Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="label">Today Status</div>
          <div className="value" style={{ fontSize: 18 }}>
            {empData.todayAttendance?.status || "Not checked in"}
          </div>
        </div>
        <div className="stat-card green">
          <div className="label">Present this month</div>
          <div className="value">{empData.monthSummary?.presentDays || 0}</div>
        </div>
        <div className="stat-card orange">
          <div className="label">Late this month</div>
          <div className="value">{empData.monthSummary?.lateDays || 0}</div>
        </div>
        <div className="stat-card purple">
          <div className="label">Pending Leaves</div>
          <div className="value">{empData.myPendingLeaves || 0}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Leave Balances</div>
        {empData.leaveBalances?.length === 0 ? (
          <div className="empty">No leave types assigned</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Leave Type</th><th>Balance</th></tr></thead>
              <tbody>
                {empData.leaveBalances?.map((b, i) => (
                  <tr key={i}>
                    <td>{b.leaveType?.name || "—"}</td>
                    <td>{b.balance} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
