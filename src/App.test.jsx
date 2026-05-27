import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('adds a task from the form', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.type(screen.getByLabelText(/task title/i), 'Plan sprint')
    await user.click(screen.getByRole('button', { name: /add task/i }))

    expect(screen.getByText('Plan sprint')).toBeInTheDocument()
  })

  it('requires all subtasks before a task can be completed', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.type(screen.getByLabelText(/task title/i), 'Ship feature')
    await user.type(screen.getByLabelText(/task subtasks/i), 'Write tests')
    await user.click(screen.getByRole('button', { name: /add task/i }))

    const [taskCheckbox, subtaskCheckbox] = screen.getAllByRole('checkbox')

    await user.click(taskCheckbox)
    expect(taskCheckbox).not.toBeChecked()
    expect(
      screen.getByText(/complete all subtasks before finishing this task/i),
    ).toBeInTheDocument()

    await user.click(subtaskCheckbox)
    await user.click(taskCheckbox)

    expect(taskCheckbox).toBeChecked()
  })

  it('switches to dark mode from the selector', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: /switch to dark mode/i }))

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })

  it('does not delete a task when confirmation is canceled', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

    render(<App />)

    await user.type(screen.getByLabelText(/task title/i), 'Keep me')
    await user.click(screen.getByRole('button', { name: /add task/i }))
    await user.click(screen.getByRole('button', { name: /delete/i }))

    expect(confirmSpy).toHaveBeenCalledOnce()
    expect(screen.getByText('Keep me')).toBeInTheDocument()
  })

  it('deletes a task when confirmation is accepted', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<App />)

    await user.type(screen.getByLabelText(/task title/i), 'Remove me')
    await user.click(screen.getByRole('button', { name: /add task/i }))
    await user.click(screen.getByRole('button', { name: /delete/i }))

    expect(confirmSpy).toHaveBeenCalledOnce()
    expect(screen.queryByText('Remove me')).not.toBeInTheDocument()
  })
})
