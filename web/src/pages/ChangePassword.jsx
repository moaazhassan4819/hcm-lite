import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function ChangePassword() {
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { updateUser, user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.put("/auth/change-password", { currentPassword, newPassword });
      setSuccess("Password changed! Redirecting...");
      updateUser({ ...user, mustChangePassword: false });
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Change Password</h1>
        <p className="subtitle">You must change your temporary password</p>
        {error && <div className="error-msg">{error}</div>}
        {success && <div className="success-msg">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Current Password</label>
            <input type="password" required value={currentPassword} onChange={(e) => setCurrent(e.target.value)} />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNew(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
