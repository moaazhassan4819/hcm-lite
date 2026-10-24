import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function Setup() {
  const [form, setForm] = useState({ name: "", email: "", password: "", companyName: "", address: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    api.get("/auth/setup-status").then((res) => {
      if (res.data.isSetupComplete) navigate("/login");
    }).catch(() => {});
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/setup", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setUser(res.data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Welcome to HCM Lite</h1>
        <p className="subtitle">First-time setup: Create Admin & Company</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Admin Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
          </div>
          <div className="form-group">
            <label>Admin Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@company.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" />
          </div>
          <div className="form-group">
            <label>Company Name</label>
            <input required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Your company" />
          </div>
          <div className="form-group">
            <label>Address (optional)</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Office address" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Setting up..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}
