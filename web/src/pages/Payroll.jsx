import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function Payroll() {
  const { user } = useAuth();
  const isAdminOrHR = user?.role === "admin" || user?.role === "hr";
  const isAdmin = user?.role === "admin";
  const [payrolls, setPayrolls] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => {
    api.get(`/payroll?month=${month}&year=${year}`).then((r) => setPayrolls(r.data.payrolls)).catch(console.error);
  };

  useEffect(() => { load(); }, [month, year]);

  const handleGenerate = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await api.post("/payroll/generate", { month, year });
      setMsg(res.data.message);
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!confirm("Finalize all draft payrolls for this month? This cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await api.post("/payroll/finalize", { month, year });
      setMsg(res.data.message);
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Payroll</h1>

      <div className="card" style={{ display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Month</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString("default", { month: "long" })}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Year</label>
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ width: 100 }} />
        </div>
        {isAdminOrHR && (
          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>Generate</button>
        )}
        {isAdmin && (
          <button className="btn btn-success" onClick={handleFinalize} disabled={loading}>Finalize</button>
        )}
      </div>

      {msg && <div className="success-msg">{msg}</div>}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th><th>Present</th><th>Late</th><th>Absent</th>
                <th>Gross</th><th>Deductions</th><th>Net</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.length === 0 ? (
                <tr><td colSpan={8} className="empty">No payroll records. Generate to calculate.</td></tr>
              ) : (
                payrolls.map((p) => (
                  <tr key={p._id}>
                    <td>{p.employee?.name || "—"}</td>
                    <td>{p.presentDays}</td>
                    <td>{p.lateDays}</td>
                    <td>{p.absentDays}</td>
                    <td>{p.grossSalary?.toLocaleString()}</td>
                    <td>{p.deductions?.toLocaleString()}</td>
                    <td><strong>{p.netSalary?.toLocaleString()}</strong></td>
                    <td>
                      <span className={`badge ${p.status === "finalized" ? "badge-green" : "badge-orange"}`}>
                        {p.status}
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
