import { useState } from "react";

function TodoItem({ task, onDelete, onToggle, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);

  function handleSave() {
    if (!editText.trim()) return;

    onEdit(editText);   // send new text to parent
    setIsEditing(false);
  }

  return (
    <div className={`todo-item ${task.completed ? "completed" : ""}`}>
    {isEditing ? (
  <div className="todo-edit">
    <input
      value={editText}
      onChange={(e) => setEditText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") {
          setIsEditing(false);
          setEditText(task.text);
        }
      }}
    />

    <button className="save-btn" onClick={handleSave}>
      Save
    </button>
  </div>
) : (

        <>
          <div>
            <input
              type="checkbox"
              checked={task.completed}
              onChange={onToggle}
            />

            <span
              style={{
                textDecoration: task.completed ? "line-through" : "none",
                opacity: task.completed ? 0.6 : 1,
                marginLeft: "8px",
              }}
            >
              {task.text}
            </span>
          </div>

          <div className="todo-actions">
            {/* Edit just enables editing */}
            <button
              className="edit-btn"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>

            <button className="delete-btn" onClick={onDelete}>
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default TodoItem;
