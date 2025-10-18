import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/auth-context.js";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      setError("Failed to log in. Please check your credentials.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Login</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} />

          <label style={styles.label}>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.input} />

          <button type="submit" style={styles.button}>Login</button>
        </form>
        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex", justifyContent: "center", alignItems: "center",
    height: "80vh",
  },
  card: {
    width: "100%", maxWidth: "400px", backgroundColor: "#fff",
    padding: "2rem", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  },
  title: { textAlign: "center", marginBottom: "1rem" },
  form: { display: "flex", flexDirection: "column", gap: "0.8rem" },
  label: { fontWeight: "500", color: "#374151" },
  input: {
    padding: "0.6rem", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "1rem",
  },
  button: {
    marginTop: "1rem", padding: "0.6rem", border: "none",
    borderRadius: "8px", backgroundColor: "#2563eb",
    color: "white", cursor: "pointer", fontWeight: "600",
  },
  error: { color: "red", textAlign: "center", marginTop: "0.8rem" },
};

export default LoginPage;