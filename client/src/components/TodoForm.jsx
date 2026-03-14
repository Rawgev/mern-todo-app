import { useState } from "react";

function TodoForm({ addTask, isLoading = false }) {
  const [input, setInput] = useState("");

  function handleSubmit(e) {
    console.log("BUTTON CLICKED");
    console.log("INPUT VALUE:", input);

    e.preventDefault();
    if (!input.trim() || isLoading) return;

    addTask(input);
    setInput("");
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <input
        className="todo-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter a task..."
        disabled={isLoading}
      />

      <button
        className="todo-button"
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? "Adding..." : "Add"}
      </button>
    </form>
  );
}

export default TodoForm;