import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [company, setCompany] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [deptName, setDeptName] = useState("");
  const [ltForm, setLtForm] = useState({ name: "", defaultDays: 12, isPaid: true });
  const [msg, setMsg] = useState("");

  const load = () => {
    api.get("/company").then((r) => setCompany(r.data.company)).catch(console.error);
    api.get("/company/departments").then((r) => setDepartments(r.data.departments)).catch(console.error);
    api.get("/company/leave-types").then((r) => setLeaveTypes(r.data.leaveTypes)).catch(console.error);
  };

  useEffect(() => { load(); }, []);

  const saveCompany = async (e) => {
    e.preventDefault();
    try {
      await api.put("/company", company);
      setMsg("Company settings saved");
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed");
    }
  };

  const addDept = async (e) => {
    e.preventDefault();
    try {
      await api.post("/company/departments", { name: deptName });
      setDeptName("");
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    }
  };

  const addLeaveType = async (e) => {
    e.preventDefault();
    try {
      await api.post("/company/leave-types", ltForm);
      setLtForm({ name: "", defaultDays: 12, isPaid: true });
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    }
  };

  if (!company) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="page-title">Settings</h1>
      {msg && <div className="success-msg">{msg}</div>}

      {isAdmin && (
        <div className="card">
          <div className="card-title">Company Settings</div>
          <form onSubmit={saveCompany}>
            <div className="form-row">
              <div className="form-group"><label>Company Name</label>
                <input value={company.name || ""} onChange={(e) => setCompany({ ...company, name: e.target.value })} />
              </div>
              <div className="form-group"><label>Address</label>
                <input value={company.address || ""} onChange={(e) => setCompany({ ...company, address: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Work Start (HH:mm)</label>
                <input value={company.workStartTime || "09:00"} onChange={(e) => setCompany({ ...company, workStartTime: e.target.value })} />
              </div>
              <div className="form-group"><label>Work End (HH:mm)</label>
                <input value={company.workEndTime || "18:00"} onChange={(e) => setCompany({ ...company, workEndTime: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Late Threshold (minutes)</label>
                <input type="number" value={company.lateThresholdMinutes || 15} onChange={(e) => setCompany({ ...company, lateThresholdMinutes: Number(e.target.value) })} />
              </div>
              <div className="form-group"><label>Office Radius (meters)</label>
                <input type="number" value={company.radiusMeters || 200} onChange={(e) => setCompany({ ...company, radiusMeters: Number(e.target.value) })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Office Latitude</label>
                <input type="number" step="any" value={company.latitude ?? ""} onChange={(e) => setCompany({ ...company, latitude: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div className="form-group"><label>Office Longitude</label>
                <input type="number" step="any" value={company.longitude ?? ""} onChange={(e) => setCompany({ ...company, longitude: e.target.value ? Number(e.target.value) : null })} />
              </div>
            </div>
            <button className="btn btn-primary" type="submit">Save Settings</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-title">Departments</div>
        <form onSubmit={addDept} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input placeholder="New department name" value={deptName} onChange={(e) => setDeptName(e.target.value)} required style={{ flex: 1, padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6 }} />
          <button className="btn btn-primary" type="submit">Add</button>
        </form>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Status</th></tr></thead>
            <tbody>
              {departments.length === 0 ? (
                <tr><td colSpan={2} className="empty">No departments yet</td></tr>
              ) : (
                departments.map((d) => (
                  <tr key={d._id}><td>{d.name}</td><td><span className="badge badge-green">Active</span></td></tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Leave Types</div>
        <form onSubmit={addLeaveType} style={{ marginBottom: 16 }}>
          <div className="form-row">
            <div className="form-group"><label>Name</label>
              <input required value={ltForm.name} onChange={(e) => setLtForm({ ...ltForm, name: e.target.value })} />
            </div>
            <div className="form-group"><label>Default Days</label>
              <input type="number" required value={ltForm.defaultDays} onChange={(e) => setLtForm({ ...ltForm, defaultDays: Number(e.target.value) })} />
            </div>
          </div>
          <div className="form-group">
            <label><input type="checkbox" checked={ltForm.isPaid} onChange={(e) => setLtForm({ ...ltForm, isPaid: e.target.checked })} /> Paid Leave</label>
          </div>
          <button className="btn btn-primary" type="submit">Add Leave Type</button>
        </form>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Days</th><th>Paid</th></tr></thead>
            <tbody>
              {leaveTypes.length === 0 ? (
                <tr><td colSpan={3} className="empty">No leave types yet</td></tr>
              ) : (
                leaveTypes.map((lt) => (
                  <tr key={lt._id}>
                    <td>{lt.name}</td>
                    <td>{lt.defaultDays}</td>
                    <td>{lt.isPaid ? "Yes" : "No"}</td>
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
