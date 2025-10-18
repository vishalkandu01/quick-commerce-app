import { useContext } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";

import { AuthContext } from "./context/auth-context.js";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import CustomerDashboard from "./pages/customerDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

const HomePage = () => (
  <div>
    <h2>Home Page</h2>
    <nav>
      <Link to="/login">Login</Link> | <Link to="/register">Register</Link>
    </nav>
  </div>
);

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  switch (user?.role) {
    case "customer":
      return <CustomerDashboard />;
    case "delivery_partner":
      return <DeliveryDashboard />;
    case "admin":
      return <AdminDashboard />;
    default:
      return <Navigate to="/login" />;
  }
};

function App() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "1rem",
          borderBottom: "1px solid #ccc",
        }}
      >
        <h1>Quick Commerce App</h1>
        {user && (
          <div>
            <span>Welcome, {user.role}!</span>
            <button onClick={logout} style={{ marginLeft: "1rem" }}>
              Logout
            </button>
          </div>
        )}
      </header>
      <main style={{ padding: "1rem" }}>
        <Routes>
          <Route
            path="/"
            element={!user ? <HomePage /> : <Navigate to="/dashboard" />}
          />
          <Route
            path="/login"
            element={!user ? <LoginPage /> : <Navigate to="/dashboard" />}
          />
          <Route
            path="/register"
            element={!user ? <RegisterPage /> : <Navigate to="/dashboard" />}
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
