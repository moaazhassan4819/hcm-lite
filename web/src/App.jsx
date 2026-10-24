import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Setup from "./pages/Setup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Leaves from "./pages/Leaves";
import Payroll from "./pages/Payroll";
import Settings from "./pages/Settings";
import AIAssistant from "./pages/AIAssistant";
import ChangePassword from "./pages/ChangePassword";

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="auth-page"><div className="auth-card">Loading...</div></div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  if (user.mustChangePassword) return <Navigate to="/change-password" />;
  return children;
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">Loading HCM Lite...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/setup" element={<Setup />} />
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/change-password" element={user ? <ChangePassword /> : <Navigate to="/login" />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="employees" element={<PrivateRoute roles={["admin", "hr"]}><Employees /></PrivateRoute>} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leaves" element={<Leaves />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="settings" element={<PrivateRoute roles={["admin", "hr"]}><Settings /></PrivateRoute>} />
        <Route path="ai" element={<AIAssistant />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
