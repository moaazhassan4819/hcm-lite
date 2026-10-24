import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function Attendance() {
  const { user } = useAuth();
  const isAdminOrHR = user?.role === "admin" || user?.role === "hr";
  const [today, setToday] = useState(null);
  const [records, setRecords] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => {
    api.get("/attendance/today").then((r) => setToday(r.data.attendance)).catch(console.error);
    if (isAdminOrHR) {
      api.get("/attendance").then((r) => setRecords(r.data.records)).catch(console.error);
    } else {
      api.get("/attendance/me").then((r) => setRecords(r.data.records)).catch(console.error);
    }
  };

  useEffect(() => { load(); }, [isAdminOrHR]);

  const getLocation = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve({});
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve({})
      );
    });

  const handleCheckIn = async () => {
    setLoading(true);
    setMsg("");
    try {
      const loc = await getLocation();
      const res = await api.post("/attendance/check-in", loc);
      setMsg(res.data.message);
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || "Check-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    setMsg("");
    try {
      const loc = await getLocation();
      const res = await api.post("/attendance/check-out", loc);
      setMsg(res.data.message);
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || "Check-out failed");
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (s) => {
    const map = { present: "badge-green", late: "badge-orange", absent: "badge-red", "half-day": "badge-blue", "on-leave": "badge-gray" };
    return <span className={`badge ${map[s] || "badge-gray"}`}>{s}</span>;
  };

  return (
    <div>
      <h1 className="page-title">Attendance</h1>

      {!isAdminOrHR && (
        <div className="card">
          <div className="card-title">Today's Attendance</div>
          {msg && <div className={msg.includes("fail") || msg.includes("Already") || msg.includes("outside") ? "error-msg" : "success-msg"}>{msg}</div>}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
            <div>
              Status: {today ? statusBadge(today.status) : <span className="badge badge-gray">Not checked in</span>}
            </div>
            {today?.checkIn?.time && (
              <div style={{ fontSize: 13, color: "#666" }}>
                In: {new Date(today.checkIn.time).toLocaleTimeString()}
                {today.checkOut?.time && ` | Out: ${new Date(today.checkOut.time).toLocaleTimeString()}`}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-success" onClick={handleCheckIn} disabled={loading || today?.checkIn?.time}>
              Check In
            </button>
            <button className="btn btn-primary" onClick={handleCheckOut} disabled={loading || !today?.checkIn?.time || today?.checkOut?.time}>
              Check Out
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title">{isAdminOrHR ? "Today's Attendance (All)" : "My Attendance History"}</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {isAdminOrHR && <th>Employee</th>}
                <th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th><th>Work (min)</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan={isAdminOrHR ? 6 : 5} className="empty">No records</td></tr>
              ) : (
                records.map((r) => (
                  <tr key={r._id}>
                    {isAdminOrHR && <td>{r.employee?.name || "—"}</td>}
                    <td>{r.dateString}</td>
                    <td>{r.checkIn?.time ? new Date(r.checkIn.time).toLocaleTimeString() : "—"}</td>
                    <td>{r.checkOut?.time ? new Date(r.checkOut.time).toLocaleTimeString() : "—"}</td>
                    <td>{statusBadge(r.status)}</td>
                    <td>{r.workMinutes || "—"}</td>
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
