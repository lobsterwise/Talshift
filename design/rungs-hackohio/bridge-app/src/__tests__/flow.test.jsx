import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act, within } from '@testing-library/react'
import App from '../App'

const tick = async (ms) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms) }) }
const clickText = async (text, opts) => { fireEvent.click(screen.getAllByText(text, opts)[0]); await tick(50) }

describe('end-to-end demo flow', () => {
  it('runs all 5 steps', async () => {
    vi.useFakeTimers()
    Object.assign(navigator, { clipboard: { writeText: () => Promise.resolve() } })
    render(<App />)
    // 1 analyze
    await clickText('Analyze my real work'); await tick(4000)
    expect(screen.getByText('Standardized Rating')).toBeTruthy()
    const ringBefore = screen.getAllByText('55').length
    expect(ringBefore).toBeGreaterThan(0)
    expect(screen.getByText('5/8 proven')).toBeTruthy()
    fireEvent.click(screen.getByText('JSON')); await tick(10)
    expect(screen.getByText(/"missingGaps"/)).toBeTruthy()
    // role switch rescoring
    fireEvent.click(screen.getByText('AI / ML')); await tick(10)
    fireEvent.click(screen.getByText('Robotics')); await tick(10)
    // 2 plan + commit
    await clickText('Action Plan')
    expect(screen.getByText('Kalman Filter Tracker in a Day')).toBeTruthy()
    await clickText('Commit to challenge')
    await clickText('Commit'); await tick(500)
    expect(screen.getAllByText('Committed').length).toBeGreaterThan(0)
    fireEvent.click(screen.getAllByText(/AI talking points/)[0]); await tick(10)
    await clickText('Book 15-min slot'); await clickText('Commit'); await tick(500)
    // 3 community
    await clickText('Compare & Team')
    expect(screen.getByText('Tale of the Tape')).toBeTruthy()
    await clickText('Team up'); await tick(3000)
    expect(screen.getAllByText(/Teamed up/).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByText('30-day growth')); await tick(10)
    fireEvent.click(screen.getByText('Everyone')); await tick(10)
    // 4 mentor
    await clickText('Mentor View')
    expect(screen.getByText('Buckeye Rover Lane Perception', { selector: 'h3' })).toBeTruthy()
    await tick(20000)
    fireEvent.click(screen.getByLabelText('5 stars')); await tick(10)
    fireEvent.click(screen.getByText("Endorse this student's growth")); await tick(10)
    fireEvent.change(screen.getByPlaceholderText('What should they do next?'), { target: { value: 'Add temporal smoothing and a pytest suite next.' } })
    await clickText('Submit review'); await tick(1000)
    expect(screen.getByText(/55 →/)).toBeTruthy()
    expect(document.body.textContent).toMatch(/55 → 65/)
    await clickText('Next project')
    // 5 recruiter
    await clickText('Recruiter View')
    const row = screen.getByText('Newly verified').closest('tr')
    fireEvent.click(within(row).getByText('Invite')); await tick(10)
    await clickText('Send Two-Way Fast-Track Invite'); await tick(1000)
    expect(within(row).getByText('Invited')).toBeTruthy()
    // move slider + toggle
    fireEvent.change(screen.getAllByRole('slider')[0], { target: { value: 90 } }); await tick(10)
    fireEvent.click(screen.getByText('Passing')); await tick(10)
    // back to student: badge + notification
    await clickText('Student View')
    expect(screen.getByText(/sent you a Two-Way Fast-Track invite/)).toBeTruthy()
    fireEvent.click(screen.getByLabelText('Notifications')); await tick(10)
    await clickText('Accept')
    expect(document.body.textContent).toMatch(/Demo flow · 5\/5/)
    await clickText('Compare & Team')
    expect(screen.getByText(/Up 2 since your mentor review/)).toBeTruthy()
    vi.useRealTimers()
  }, 60000)
})
