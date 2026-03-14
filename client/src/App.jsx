import "./App.css";
import { useState, useEffect } from "react";
import TodoForm from "./components/TodoForm";
import TodoList from "./components/TodoList";

function App() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("tasks");
    if (!saved) return [];

    const parsed = JSON.parse(saved);

    return parsed.map(t =>
      typeof t === "string" ? { text: t, completed: false } : t
    );
  });

  function addTask(text) {
    if (!text.trim()) return;

    setTasks([...tasks, { text, completed: false }]);
  }

  function deleteTask(indexToDelete) {
    const updated = tasks.filter((_, i) => i !== indexToDelete);
    setTasks(updated);
  }
  function editTask(indexToEdit, newText) {
    const updated = tasks.map((t, i) =>
      i === indexToEdit ? { ...t, text: newText } : t
    );
    setTasks(updated);
  }


  function toggleComplete(indexToToggle) {
    const updated = tasks.map((t, i) =>
      i === indexToToggle ? { ...t, completed: !t.completed } : t
    );
    setTasks(updated);
  }

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);
  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);


  const filteredTasks = tasks
    .map((task, index) => ({
      ...task,
      originalIndex: index,
    }))
    .filter(task => {
      if (filter === "completed") return task.completed;
      if (filter === "pending") return !task.completed;
      return true;
    })
    .filter(task =>
      task.text.toLowerCase().includes(search.toLowerCase())
    );

  // counters
  const pendingCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;

  // clear completed
  function clearCompleted() {
    setTasks(tasks.filter(t => !t.completed));
  }
  return (
    <div className={`app-container ${theme}`}>
      <div className="todo-card">
        <h1 className="todo-title">React To-Do App 📝</h1>
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

        <TodoForm addTask={addTask} />

        {/* COUNTER */}
        <p className="task-counter">
          {pendingCount} pending • {completedCount} completed
        </p>

        {/* FILTER BUTTONS */}
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
          placeholder="🔍 Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <TodoList
          tasks={filteredTasks}
          totalTasks={tasks.length}
          deleteTask={deleteTask}
          toggleComplete={toggleComplete}
          editTask={editTask}
          setTasks={setTasks}
        />



        {/* CLEAR COMPLETED BUTTON */}
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
