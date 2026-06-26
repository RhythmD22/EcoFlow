import { EcoData } from './data.js';
import { showToast, showConfirm } from './utils.js';

function initSettings() {
  const appData = EcoData.load();

  const apiInput = document.getElementById('settings-api-key');
  const saveBtn = document.getElementById('btn-save-settings-key');
  const weatherInput = document.getElementById('settings-weather-key');
  const saveWeatherBtn = document.getElementById('btn-save-weather-key');
  const resetBtn = document.getElementById('btn-reset-data');
  const exportBtn = document.getElementById('btn-export-data');

  if (apiInput) apiInput.value = EcoData.getAPIKey();
  if (weatherInput) weatherInput.value = EcoData.getWeatherKey();

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const key = apiInput ? apiInput.value.trim() : '';
      EcoData.setAPIKey(key);
      showToast('API key saved', 'success');
    });
  }

  if (saveWeatherBtn) {
    saveWeatherBtn.addEventListener('click', () => {
      const key = weatherInput ? weatherInput.value.trim() : '';
      EcoData.setWeatherKey(key);
      showToast('Weather API key saved', 'success');
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      const confirmed = await showConfirm('Reset Data', 'Delete all your EcoFlow data? This cannot be undone.');
      if (confirmed) {
        EcoData.resetAll();
        EcoData.refreshData(appData);
        showToast('All data has been reset', '');
      }
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const json = EcoData.exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ecoflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Data exported!', 'success');
    });
  }
}

export { initSettings };