const workInterval = document.getElementById('workInterval')
const workIntervalValue = document.getElementById('workIntervalValue')
const restDuration = document.getElementById('restDuration')
const restDurationValue = document.getElementById('restDurationValue')
const soundEnabled = document.getElementById('soundEnabled')
const autoStart = document.getElementById('autoStart')
const saveBtn = document.getElementById('saveBtn')
const saveHint = document.getElementById('saveHint')

workInterval.addEventListener('input', () => {
  workIntervalValue.textContent = workInterval.value
})

restDuration.addEventListener('input', () => {
  restDurationValue.textContent = restDuration.value
})

async function loadSettings() {
  const settings = await api.getSettings()
  workInterval.value = settings.workInterval
  workIntervalValue.textContent = settings.workInterval
  restDuration.value = settings.restDuration
  restDurationValue.textContent = settings.restDuration
  soundEnabled.checked = settings.soundEnabled
  autoStart.checked = settings.autoStart
}

saveBtn.addEventListener('click', async () => {
  const settings = {
    workInterval: parseInt(workInterval.value),
    restDuration: parseInt(restDuration.value),
    soundEnabled: soundEnabled.checked,
    autoStart: autoStart.checked
  }
  await api.saveSettings(settings)
  saveHint.textContent = '设置已保存 ✓'
  saveHint.classList.add('show')
  setTimeout(() => saveHint.classList.remove('show'), 2000)
})

loadSettings()
