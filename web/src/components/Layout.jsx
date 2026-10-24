import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isAdminOrHR = user?.role === "admin" || user?.role === "hr";

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="logo">
          HCM <span>Lite</span>
        </div>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          {isAdminOrHR && <NavLink to="/employees">Employees</NavLink>}
          <NavLink to="/attendance">Attendance</NavLink>
          <NavLink to="/leaves">Leaves</NavLink>
          <NavLink to="/payroll">Payroll</NavLink>
          {isAdminOrHR && <NavLink to="/settings">Settings</NavLink>}
          <NavLink to="/ai">AI Assistant</NavLink>
        </nav>
        <div className="user-info">
          <div>{user?.name}</div>
          <div className="role">{user?.role}</div>
          <button className="btn btn-outline btn-sm" style={{ marginTop: 10, color: "#fff", borderColor: "#555" }} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
