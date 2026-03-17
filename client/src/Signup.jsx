import { useState } from "react";
import { API_BASE_URL, parseApiResponse } from "./api";
import "./Auth.css";

function Signup({ onAuthSuccess, onSwitchToLogin, apiBaseUrl }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup(event) {
    event.preventDefault();
    setError("");

    try {
      const baseUrl = apiBaseUrl || API_BASE_URL;
      const res = await fetch(`${baseUrl}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await parseApiResponse(res);
      onAuthSuccess(data.token);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="todo-form auth-form" onSubmit={handleSignup} style={{ flexDirection: "column" }}>
      <div className="auth-input-wrap">
        <input
          className="todo-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={event => setEmail(event.target.value)}
          required
        />
      </div>

      <div className="auth-input-wrap">
        <input
          className="todo-input"
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          required
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setShowPassword(prev => !prev)}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>

      {error && <p style={{ color: "#ff6b6b", margin: 0 }}>{error}</p>}

      <button className="todo-button auth-action-btn" type="submit">
        Sign Up
      </button>

      <button className="clear-btn auth-action-btn" type="button" onClick={onSwitchToLogin} style={{ marginTop: 0 }}>
        Already have account
      </button>
    </form>
  );
}

export default Signup;
