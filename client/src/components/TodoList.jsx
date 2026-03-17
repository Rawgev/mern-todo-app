import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { createPortal } from "react-dom";
import TodoItem from "./TodoItem";

function TodoList({ tasks, totalTasks, deleteTask, toggleComplete, editTask, setTasks }) {

  function getTaskId(task, fallbackIndex) {
    return task._id ?? `task-${fallbackIndex}`;
  }

  function handleDragEnd(result) {
    if (!result.destination) return;

    const items = Array.from(tasks);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);

    setTasks(items);
  }

  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <p>✨ Nothing here yet</p>
        <span>Add your first task above to get started</span>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="todoList">
        {(provided) => (
          <ul
            className="todo-list"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {tasks.map((task, index) => (
              <Draggable
                key={getTaskId(task, index)}
                draggableId={String(getTaskId(task, index))}
                index={index}
              >
                {(provided, snapshot) => {

                  const child = (
                    <li
                      className="todo-list-item-animated"
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        "--stagger-delay": `${index * 55}ms`,
                        ...provided.draggableProps.style
                      }}
                    >
                      <TodoItem
                        task={task}
                        onDelete={() => deleteTask(task._id)}
                        onToggle={() => toggleComplete(task._id, task.completed)}
                        onEdit={(newText) => editTask(task._id, newText)}
                      />
                    </li>
                  );

                  if (snapshot.isDragging) {
                    return createPortal(child, document.body);
                  }

                  return child;
                }}
              </Draggable>
            ))}

            {provided.placeholder}
          </ul>
        )}
      </Droppable>
    </DragDropContext>
  );
}

export default TodoList;
