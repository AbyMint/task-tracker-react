import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'task-tracker-react.tasks'

function createTask(title, notes, subtasksText) {
  return {
    id: crypto.randomUUID(),
    title,
    notes,
    completed: false,
    subtasks: subtasksText
      .split('\n')
      .map((subtask) => subtask.trim())
      .filter(Boolean)
      .map((text) => ({ id: crypto.randomUUID(), text, completed: false })),
  }
}

function canCompleteTask(task) {
  return task.subtasks.every((subtask) => subtask.completed)
}

function App() {
  const [tasks, setTasks] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return []
    }

    try {
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })
  const [filter, setFilter] = useState('all')
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [subtasksText, setSubtasksText] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  const filteredTasks = useMemo(() => {
    if (filter === 'completed') {
      return tasks.filter((task) => task.completed)
    }

    if (filter === 'pending') {
      return tasks.filter((task) => !task.completed)
    }

    return tasks
  }, [filter, tasks])

  const resetForm = () => {
    setEditingTaskId(null)
    setTitle('')
    setNotes('')
    setSubtasksText('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const cleanTitle = title.trim()

    if (!cleanTitle) {
      return
    }

    if (editingTaskId) {
      setTasks((currentTasks) =>
        currentTasks.map((task) => {
          if (task.id !== editingTaskId) {
            return task
          }

          const existingSubtaskState = new Map(
            task.subtasks.map((subtask) => [subtask.text.toLowerCase(), subtask.completed]),
          )
          const nextSubtasks = subtasksText
            .split('\n')
            .map((subtask) => subtask.trim())
            .filter(Boolean)
            .map((text) => ({
              id: crypto.randomUUID(),
              text,
              completed: existingSubtaskState.get(text.toLowerCase()) ?? false,
            }))

          const nextTask = {
            ...task,
            title: cleanTitle,
            notes: notes.trim(),
            subtasks: nextSubtasks,
          }

          return {
            ...nextTask,
            completed: nextTask.completed && canCompleteTask(nextTask),
          }
        }),
      )
      resetForm()
      return
    }

    setTasks((currentTasks) => [
      ...currentTasks,
      createTask(cleanTitle, notes.trim(), subtasksText),
    ])
    resetForm()
  }

  const toggleTask = (taskId) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== taskId) {
          return task
        }

        if (!task.completed && !canCompleteTask(task)) {
          return task
        }

        return { ...task, completed: !task.completed }
      }),
    )
  }

  const toggleSubtask = (taskId, subtaskId) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== taskId) {
          return task
        }

        const nextTask = {
          ...task,
          subtasks: task.subtasks.map((subtask) =>
            subtask.id === subtaskId
              ? { ...subtask, completed: !subtask.completed }
              : subtask,
          ),
        }

        if (nextTask.completed && !canCompleteTask(nextTask)) {
          nextTask.completed = false
        }

        return nextTask
      }),
    )
  }

  const deleteTask = (taskId) => {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId))
    if (editingTaskId === taskId) {
      resetForm()
    }
  }

  const startEdit = (task) => {
    setEditingTaskId(task.id)
    setTitle(task.title)
    setNotes(task.notes)
    setSubtasksText(task.subtasks.map((subtask) => subtask.text).join('\n'))
  }

  return (
    <main className="app">
      <h1>Task Tracker</h1>

      <form className="task-form" onSubmit={handleSubmit}>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Task title"
          aria-label="Task title"
          required
        />
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Notes"
          aria-label="Task notes"
          rows={3}
        />
        <textarea
          value={subtasksText}
          onChange={(event) => setSubtasksText(event.target.value)}
          placeholder="One subtask per line (optional)"
          aria-label="Task subtasks"
          rows={3}
        />
        <div className="form-actions">
          <button type="submit">{editingTaskId ? 'Save task' : 'Add task'}</button>
          {editingTaskId && (
            <button type="button" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="filters" role="group" aria-label="Task filters">
        {['all', 'completed', 'pending'].map((value) => (
          <button
            key={value}
            type="button"
            className={filter === value ? 'active' : ''}
            onClick={() => setFilter(value)}
          >
            {value[0].toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>

      <ul className="task-list">
        {filteredTasks.map((task) => {
          const blocked = !task.completed && !canCompleteTask(task)

          return (
            <li key={task.id} className="task-item">
              <label className="task-header">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                />
                <span className={task.completed ? 'done' : ''}>{task.title}</span>
              </label>

              {task.notes && <p className="notes">{task.notes}</p>}

              {task.subtasks.length > 0 && (
                <ul className="subtasks">
                  {task.subtasks.map((subtask) => (
                    <li key={subtask.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          onChange={() => toggleSubtask(task.id, subtask.id)}
                        />
                        <span className={subtask.completed ? 'done' : ''}>{subtask.text}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}

              {blocked && (
                <p className="hint">Complete all subtasks before finishing this task.</p>
              )}

              <div className="task-actions">
                <button type="button" onClick={() => startEdit(task)}>
                  Edit
                </button>
                <button type="button" onClick={() => deleteTask(task.id)}>
                  Delete
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </main>
  )
}

export default App
