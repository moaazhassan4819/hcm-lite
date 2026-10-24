import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function Leaves() {
  const { user } = useAuth();
  const isAdminOrHR = user?.role === "admin" || user?.role === "hr";
  const [leaves, setLeaves] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ leaveTypeId: "", startDate: "", endDate: "", reason: "" });
  const [msg, setMsg] = useState("");

  const load = () => {
    if (isAdminOrHR) {
      api.get("/leaves").then((r) => setLeaves(r.data.leaves)).catch(console.error);
    } else {
      api.get("/leaves/me").then((r) => setLeaves(r.data.leaves)).catch(console.error);
    }
    api.get("/company/leave-types").then((r) => setLeaveTypes(r.data.leaveTypes)).catch(console.error);
  };

  useEffect(() => { load(); }, [isAdminOrHR]);

  const handleApply = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await api.post("/leaves", form);
      setMsg("Leave applied successfully");
      setShowForm(false);
      setForm({ leaveTypeId: "", startDate: "", endDate: "", reason: "" });
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed");
    }
  };

  const handleReview = async (id, status) => {
    try {
      await api.put(`/leaves/${id}/review`, { status });
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    }
  };

  const statusBadge = (s) => {
    const map = { pending: "badge-orange", approved: "badge-green", rejected: "badge-red", cancelled: "badge-gray" };
    return <span className={`badge ${map[s] || "badge-gray"}`}>{s}</span>;
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Leaves</h1>
        {!isAdminOrHR && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ Apply Leave"}
          </button>
        )}
      </div>

      {msg && <div className={msg.includes("success") ? "success-msg" : "error-msg"}>{msg}</div>}

      {showForm && (
        <div className="card">
          <div className="card-title">Apply for Leave</div>
          <form onSubmit={handleApply}>
            <div className="form-group">
              <label>Leave Type</label>
              <select required value={form.leaveTypeId} onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}>
                <option value="">— Select —</option>
                {leaveTypes.filter((lt) => lt.isActive).map((lt) => (
                  <option key={lt._id} value={lt._id}>{lt.name} ({lt.defaultDays} days)</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Start Date</label><input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div className="form-group"><label>End Date</label><input type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            </div>
            <div className="form-group">
              <label>Reason</label>
              <textarea required rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
            <button className="btn btn-primary" type="submit">Submit</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {isAdminOrHR && <th>Employee</th>}
                <th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th>
                {isAdminOrHR && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 ? (
                <tr><td colSpan={8} className="empty">No leave requests</td></tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l._id}>
                    {isAdminOrHR && <td>{l.employee?.name}</td>}
                    <td>{l.leaveType?.name}</td>
                    <td>{new Date(l.startDate).toLocaleDateString()}</td>
                    <td>{new Date(l.endDate).toLocaleDateString()}</td>
                    <td>{l.days}</td>
                    <td>{l.reason}</td>
                    <td>{statusBadge(l.status)}</td>
                    {isAdminOrHR && (
                      <td>
                        {l.status === "pending" && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => handleReview(l._id, "approved")}>Approve</button>{" "}
                            <button className="btn btn-danger btn-sm" onClick={() => handleReview(l._id, "rejected")}>Reject</button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
