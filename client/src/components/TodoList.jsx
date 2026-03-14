import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { createPortal } from "react-dom";
import TodoItem from "./TodoItem";

function TodoList({ tasks, totalTasks, deleteTask, toggleComplete, editTask, setTasks }) {
  function getTaskId(task, fallbackIndex) {
    return task.id ?? task._id ?? `task-${fallbackIndex}`;
  }

  function handleDragEnd(result) {
    if (!result.destination) return;
    if (tasks.length !== totalTasks) return;

    const items = Array.from(tasks);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);

    setTasks(items.map(({ originalIndex, ...task }) => task));
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
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        ...provided.draggableProps.style,
                      }}
                    >
                      <TodoItem
                        task={task}
                        onDelete={() => deleteTask(task.originalIndex)}
                        onToggle={() => toggleComplete(task.originalIndex)}
                        onEdit={(newText) => editTask(task.originalIndex, newText)}
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


