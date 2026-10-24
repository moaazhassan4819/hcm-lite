import { useEffect, useState } from "react";
import api from "../api";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "employee", department: "",
    designation: "", phone: "", basicSalary: "", hra: "", allowances: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = () => {
    api.get("/employees").then((r) => setEmployees(r.data.employees)).catch(console.error);
    api.get("/company/departments").then((r) => setDepartments(r.data.departments)).catch(console.error);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await api.post("/employees", {
        ...form,
        basicSalary: Number(form.basicSalary) || 0,
        hra: Number(form.hra) || 0,
        allowances: Number(form.allowances) || 0,
        department: form.department || undefined,
      });
      setSuccess("Employee created with temporary password");
      setShowForm(false);
      setForm({ name: "", email: "", password: "", role: "employee", department: "", designation: "", phone: "", basicSalary: "", hra: "", allowances: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Employees</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Employee"}
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      {showForm && (
        <div className="card">
          <div className="card-title">Register New Employee</div>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group"><label>Name *</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="form-group"><label>Email *</label><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Temp Password *</label><input required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
              <div className="form-group"><label>Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="employee">Employee</option>
                  <option value="hr">HR</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Department</label>
                <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                  <option value="">— Select —</option>
                  {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Designation</label><input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Basic Salary</label><input type="number" value={form.basicSalary} onChange={(e) => setForm({ ...form, basicSalary: e.target.value })} /></div>
              <div className="form-group"><label>HRA</label><input type="number" value={form.hra} onChange={(e) => setForm({ ...form, hra: e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Allowances</label><input type="number" value={form.allowances} onChange={(e) => setForm({ ...form, allowances: e.target.value })} /></div>
              <div className="form-group"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <button className="btn btn-primary" type="submit">Create Employee</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Salary</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr><td colSpan={7} className="empty">No employees yet. Add the first one!</td></tr>
              ) : (
                employees.map((e) => (
                  <tr key={e._id}>
                    <td>{e.employeeId || "—"}</td>
                    <td>{e.name}</td>
                    <td>{e.email}</td>
                    <td><span className="badge badge-blue">{e.role}</span></td>
                    <td>{e.department?.name || "—"}</td>
                    <td>{e.basicSalary?.toLocaleString() || 0}</td>
                    <td>
                      <span className={`badge ${e.isActive ? "badge-green" : "badge-red"}`}>
                        {e.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
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
