import { EcoData } from './data.js';
import { showToast, showConfirm } from './utils.js';

function initSettings(appData) {
  const apiInput = document.getElementById('settings-api-key');
  const saveBtn = document.getElementById('btn-save-settings-key');
  const resetBtn = document.getElementById('btn-reset-data');
  const exportBtn = document.getElementById('btn-export-data');

  if (apiInput) apiInput.value = EcoData.getAPIKey();

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const key = apiInput ? apiInput.value.trim() : '';
      EcoData.setAPIKey(key);
      showToast('API key saved', 'success');
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      const confirmed = await showConfirm('Reset Data', 'Delete all your EcoFlow data? This cannot be undone.');
      if (confirmed) {
        EcoData.resetAll();
        const fresh = EcoData.load();
        Object.assign(appData, fresh);
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