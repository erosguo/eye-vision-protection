let totalRestSeconds = 300

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function updateDisplay(data) {
  const timerEl = document.getElementById('timer')
  const progressEl = document.getElementById('progressFill')

  if (data.restRemaining !== undefined) {
    timerEl.textContent = formatTime(data.restRemaining)
    if (totalRestSeconds > 0) {
      const pct = (data.restRemaining / totalRestSeconds) * 100
      progressEl.style.width = `${Math.max(0, pct)}%`
    }
  }
}

const cleanup = api.onBreakUpdate((data) => {
  if (data.totalRestSeconds) {
    totalRestSeconds = data.totalRestSeconds
  }
  updateDisplay(data)
})

api.sendBreakReady()
