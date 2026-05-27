import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'task-tracker-react.tasks'
const THEME_STORAGE_KEY = 'task-tracker-react.theme'

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

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" />
    </svg>
  )
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
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme
    }

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    return 'light'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

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
    const shouldDelete = window.confirm('Delete this task? This action cannot be undone.')
    if (!shouldDelete) {
      return
    }

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

  const isDark = theme === 'dark'

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
  }

  return (
    <main className="app">
      <button
        type="button"
        className="theme-toggle"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={toggleTheme}
      >
        <span className="theme-toggle-icon">{isDark ? <SunIcon /> : <MoonIcon />}</span>
        <span className="theme-toggle-label">{isDark ? 'Light mode' : 'Dark mode'}</span>
      </button>

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
