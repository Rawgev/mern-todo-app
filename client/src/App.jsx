import "./App.css";
import { useState, useEffect, useCallback } from "react";
import TodoForm from "./components/TodoForm";
import TodoList from "./components/TodoList";
import Login from "./Login";
import Signup from "./Signup";
import { API_BASE_URL, buildHeaders, parseApiResponse } from "./api";

const TODOS_API_URL = `${API_BASE_URL}/todos`;

function App() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [tasks, setTasks] = useState([]);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [authView, setAuthView] = useState("login");
  const [accountEmail, setAccountEmail] = useState("");
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [emailForm, setEmailForm] = useState({ newEmail: "", currentPassword: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [showResetPasswords, setShowResetPasswords] = useState(false);
  const [accountMessage, setAccountMessage] = useState("");
  const [accountError, setAccountError] = useState("");

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setTasks([]);
    setAuthView("login");
  }, []);

  const authHeaders = useCallback(
    (includeJson = false) => buildHeaders(token, includeJson),
    [token]
  );

  const fetchTodos = useCallback(async () => {
    if (!token) {
      setTasks([]);
      return;
    }

    try {
      const res = await fetch(TODOS_API_URL, {
        headers: authHeaders()
      });

      if (res.status === 401) {
        logout();
        return;
      }

      const data = await parseApiResponse(res);
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  }, [token, authHeaders, logout]);

  const fetchProfile = useCallback(async () => {
    if (!token) {
      setAccountEmail("");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: authHeaders()
      });

      if (res.status === 401) {
        logout();
        return;
      }

      const data = await parseApiResponse(res);
      setAccountEmail(data.email || "");
    } catch (error) {
      console.error(error);
    }
  }, [token, authHeaders, logout]);

  useEffect(() => {
    console.log("Using API base URL:", API_BASE_URL);
    fetchTodos();
    fetchProfile();
  }, [fetchTodos, fetchProfile]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  async function addTask(text) {
    if (!text.trim()) return;

    const res = await fetch(TODOS_API_URL, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ text })
    });

    if (res.status === 401) {
      logout();
      return;
    }

    const newTodo = await parseApiResponse(res);
    setTasks(prev => [newTodo, ...prev]);
  }

  async function deleteTask(id) {
    const res = await fetch(`${TODOS_API_URL}/${id}`, {
      method: "DELETE",
      headers: authHeaders()
    });

    if (res.status === 401) {
      logout();
      return;
    }

    await parseApiResponse(res);
    setTasks(prev => prev.filter(task => task._id !== id));
  }

  async function editTask(id, newText) {
    const res = await fetch(`${TODOS_API_URL}/${id}`, {
      method: "PUT",
      headers: authHeaders(true),
      body: JSON.stringify({ text: newText })
    });

    if (res.status === 401) {
      logout();
      return;
    }

    const updated = await parseApiResponse(res);
    setTasks(prev => prev.map(task => (task._id === id ? updated : task)));
  }

  async function toggleComplete(id, completed) {
    const res = await fetch(`${TODOS_API_URL}/${id}`, {
      method: "PUT",
      headers: authHeaders(true),
      body: JSON.stringify({ completed: !completed })
    });

    if (res.status === 401) {
      logout();
      return;
    }

    const updated = await parseApiResponse(res);
    setTasks(prev => prev.map(task => (task._id === id ? updated : task)));
  }

  const filteredTasks = tasks
    .filter(task => {
      if (filter === "completed") return task.completed;
      if (filter === "pending") return !task.completed;
      return true;
    })
    .filter(task => task.text.toLowerCase().includes(search.toLowerCase()));

  const pendingCount = tasks.filter(task => !task.completed).length;
  const completedCount = tasks.filter(task => task.completed).length;

  function clearCompleted() {
    setTasks(tasks.filter(task => !task.completed));
  }

  function handleAuthSuccess(newToken) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }

  async function handleEmailChange(event) {
    event.preventDefault();
    setAccountError("");
    setAccountMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/auth/change-email`, {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify(emailForm)
      });

      if (res.status === 401) {
        logout();
        return;
      }

      const data = await parseApiResponse(res);
      setAccountMessage(data.message || "Email updated");
      setAccountEmail(data.email || emailForm.newEmail);
      setEmailForm({ newEmail: "", currentPassword: "" });
    } catch (error) {
      setAccountError(error.message);
    }
  }

  async function handlePasswordChange(event) {
    event.preventDefault();
    setAccountError("");
    setAccountMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify(passwordForm)
      });

      if (res.status === 401) {
        logout();
        return;
      }

      const data = await parseApiResponse(res);
      setAccountMessage(data.message || "Password updated");
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch (error) {
      setAccountError(error.message);
    }
  }

  if (!token) {
    return (
      <div className={`app-container ${theme} interactive-scene auth-bg`}>
        <div className="todo-card interactive-card">
          <h1 className="todo-title">React To-Do App</h1>
          <div className="theme-toggle">
            <label className="switch">
              <input
                type="checkbox"
                checked={theme === "light"}
                onChange={() => setTheme(theme === "dark" ? "light" : "dark")}
              />
              <span className="slider"></span>
            </label>
          </div>

          {authView === "login" ? (
            <Login
              onAuthSuccess={handleAuthSuccess}
              onSwitchToSignup={() => setAuthView("signup")}
              apiBaseUrl={API_BASE_URL}
            />
          ) : (
            <Signup
              onAuthSuccess={handleAuthSuccess}
              onSwitchToLogin={() => setAuthView("login")}
              apiBaseUrl={API_BASE_URL}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container ${theme} interactive-scene logged-in-bg`}>
      <div className="todo-card logged-in-ui interactive-card">
        <h1 className="todo-title">React To-Do App</h1>

        <div className="top-actions">
          <div className="top-actions-left">
            <button
              className="clear-btn top-action-btn"
              type="button"
              onClick={() => setShowAccountSettings(prev => !prev)}
            >
              {showAccountSettings ? "Hide Reset" : "Reset Email/Password"}
            </button>

            <button className="clear-btn top-action-btn" onClick={logout} type="button">
              Logout
            </button>
          </div>

          <label className="switch">
            <input
              type="checkbox"
              checked={theme === "light"}
              onChange={() => setTheme(theme === "dark" ? "light" : "dark")}
            />
            <span className="slider"></span>
          </label>
        </div>

        <TodoForm addTask={addTask} />

        {showAccountSettings && (
          <div className="account-settings">
            <p className="task-counter" style={{ marginTop: "12px" }}>
              Logged in as: {accountEmail || "Loading..."}
            </p>
            <label style={{ display: "block", marginBottom: "10px", fontSize: "14px" }}>
              <input
                type="checkbox"
                checked={showResetPasswords}
                onChange={event => setShowResetPasswords(event.target.checked)}
                style={{ marginRight: "8px" }}
              />
              Show passwords
            </label>

            <form className="todo-form" onSubmit={handleEmailChange} style={{ flexDirection: "column" }}>
              <input
                className="todo-input"
                type="email"
                placeholder="New email"
                value={emailForm.newEmail}
                onChange={event => setEmailForm(prev => ({ ...prev, newEmail: event.target.value }))}
                required
              />
              <input
                className="todo-input"
                type={showResetPasswords ? "text" : "password"}
                placeholder="Current password"
                value={emailForm.currentPassword}
                onChange={event => setEmailForm(prev => ({ ...prev, currentPassword: event.target.value }))}
                required
              />
              <button className="todo-button" type="submit">Update Email</button>
            </form>

            <form className="todo-form" onSubmit={handlePasswordChange} style={{ flexDirection: "column" }}>
              <input
                className="todo-input"
                type={showResetPasswords ? "text" : "password"}
                placeholder="Current password"
                value={passwordForm.currentPassword}
                onChange={event => setPasswordForm(prev => ({ ...prev, currentPassword: event.target.value }))}
                required
              />
              <input
                className="todo-input"
                type={showResetPasswords ? "text" : "password"}
                placeholder="New password (min 6)"
                value={passwordForm.newPassword}
                onChange={event => setPasswordForm(prev => ({ ...prev, newPassword: event.target.value }))}
                required
              />
              <button className="todo-button" type="submit">Update Password</button>
            </form>

            {accountMessage && <p style={{ color: "#a7f3a1", marginTop: 6 }}>{accountMessage}</p>}
            {accountError && <p style={{ color: "#ff6b6b", marginTop: 6 }}>{accountError}</p>}
          </div>
        )}

        <p className="task-counter">
          {pendingCount} pending | {completedCount} completed
        </p>

        <div className="filters">
          <button onClick={() => setFilter("all")} className={filter === "all" ? "active" : ""}>
            All
          </button>
          <button onClick={() => setFilter("pending")} className={filter === "pending" ? "active" : ""}>
            Pending
          </button>
          <button onClick={() => setFilter("completed")} className={filter === "completed" ? "active" : ""}>
            Completed
          </button>
        </div>

        <input
          className="search-input"
          placeholder="Search tasks..."
          value={search}
          onChange={event => setSearch(event.target.value)}
        />

        <TodoList
          tasks={filteredTasks}
          totalTasks={tasks.length}
          deleteTask={deleteTask}
          toggleComplete={toggleComplete}
          editTask={editTask}
          setTasks={setTasks}
        />

        {completedCount > 0 && (
          <button className="clear-btn" onClick={clearCompleted}>
            Clear completed
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
