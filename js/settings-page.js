import { EcoData } from './data.js';
import { showToast, showConfirm } from './utils.js';

let apiStatusCache = null;

async function fetchApiStatus() {
  try {
    const response = await fetch('/api/api-status');
    if (!response.ok) return null;
    const status = await response.json();
    apiStatusCache = status;
    return status;
  } catch (err) {
    console.warn('API status check failed:', err);
    return null;
  }
}

function prefetchApiStatus() {
  fetchApiStatus();
}

function applyApiStatus(status) {
  if (!status) return;
  updateBadge('status-gemini', status.gemini);
  updateBadge('status-openweathermap', status.openweathermap);
  toggleLocalInput('settings-gemini-local', status.gemini);
  toggleLocalInput('settings-weather-local', status.openweathermap);
}

function updateBadge(id, isConfigured) {
  const badge = document.getElementById(id);
  if (!badge) return;
  if (isConfigured) {
    badge.textContent = 'Active';
    badge.classList.add('setting-status-badge--active');
  } else {
    badge.textContent = 'Not configured';
    badge.classList.remove('setting-status-badge--active');
  }
}

function toggleLocalInput(id, serverActive) {
  const container = document.getElementById(id);
  if (!container) return;
  container.hidden = serverActive;
}

function initSettings() {
  if (apiStatusCache) {
    applyApiStatus(apiStatusCache);
  }
  fetchApiStatus().then(status => {
    if (status) applyApiStatus(status);
  });

  const appData = EcoData.load();

  const apiInput = document.getElementById('settings-api-key');
  const saveBtn = document.getElementById('btn-save-settings-key');
  const weatherInput = document.getElementById('settings-weather-key');
  const saveWeatherBtn = document.getElementById('btn-save-weather-key');
  const resetBtn = document.getElementById('btn-reset-data');
  const exportBtn = document.getElementById('btn-export-data');
  const importBtn = document.getElementById('btn-import-data');

  if (apiInput) apiInput.value = EcoData.getAPIKey();
  if (weatherInput) weatherInput.value = EcoData.getWeatherKey();

  if (importBtn) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.hidden = true;
    document.body.appendChild(fileInput);

    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        const confirmed = await showConfirm('Import Data', 'Import data from this file? Your current data will be replaced.');
        if (!confirmed) return;
        try {
          EcoData.importData(reader.result);
          EcoData.refreshData(appData);
          showToast('Data imported successfully', 'success');
        } catch (err) {
          showToast(err.message || 'Failed to import data', 'error');
        }
        fileInput.value = '';
      };
      reader.readAsText(file);
    });

    importBtn.addEventListener('click', () => fileInput.click());
  }

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

export { initSettings, prefetchApiStatus };