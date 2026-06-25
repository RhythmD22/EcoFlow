import { EcoData } from './data.js';

function initImpact(appData) {
  const totalCO2 = document.getElementById('impact-total-co2');
  const equivalent = document.getElementById('impact-equivalent');

  if (totalCO2) totalCO2.textContent = appData.totalCO2.toFixed(1);

  const treesVal = appData.totalCO2 / 21;
  const carMiles = appData.totalCO2 / 0.404;
  const waterLiters = appData.totalCO2 / 0.001;
  const energyKWh = appData.totalCO2 / 0.4;

  document.getElementById('eq-trees').textContent = treesVal.toFixed(1);
  document.getElementById('eq-car-miles').textContent = Math.round(carMiles);
  document.getElementById('eq-water').textContent = Math.round(waterLiters);
  document.getElementById('eq-energy').textContent = energyKWh.toFixed(1);

  if (equivalent) {
    if (appData.totalCO2 < 1) {
      equivalent.textContent = 'Every action counts. Keep going to see your impact grow.';
    } else if (appData.totalCO2 < 10) {
      equivalent.textContent = `That's like planting ${Math.ceil(treesVal)} tree seedling${Math.ceil(treesVal) > 1 ? 's' : ''} — keep it up!`;
    } else if (appData.totalCO2 < 50) {
      equivalent.textContent = `Impressive! Equivalent to taking a car off the road for ${Math.round(carMiles / 40)} days.`;
    } else {
      equivalent.textContent = `Outstanding! You've matched the annual carbon capture of ${treesVal.toFixed(1)} mature trees.`;
    }
  }

  renderBreakdown(appData);
}

function renderBreakdown(appData) {
  const list = document.getElementById('breakdown-list');
  if (!list) return;

  const breakdown = EcoData.getCategoryBreakdown(appData);
  const maxCO2 = Math.max(1, ...Object.values(breakdown).map(b => b.co2));

  const icons = {
    transport: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>',
    food: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 21h10"/><path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"/><path d="M11.38 12a2.4 2.4 0 0 1-.4-4.77 2.4 2.4 0 0 1 3.2-2.77 2.4 2.4 0 0 1 3.47-.63 2.4 2.4 0 0 1 3.37 3.37 2.4 2.4 0 0 1-1.1 3.7 2.51 2.51 0 0 1 .03 1.1"/><path d="m13 12 4-4"/><path d="M10.9 7.25A3.99 3.99 0 0 0 4 10c0 .73.2 1.41.54 2"/></svg>',
    energy: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
    shopping: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 10a4 4 0 0 1-8 0"/><path d="M3.103 6.034h17.794"/><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/></svg>',
    waste: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    water: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/></svg>',
  };

  list.innerHTML = Object.entries(breakdown)
    .sort((a, b) => b[1].co2 - a[1].co2)
    .map(([cat, data]) => `
      <div class="breakdown-item glass">
        <span class="breakdown-icon">${icons[cat] || '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/><path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/><path d="M5 21h14"/></svg>'}</span>
        <div class="breakdown-info">
          <div class="breakdown-name">${cat.charAt(0).toUpperCase() + cat.slice(1)}</div>
          <div class="breakdown-count">${data.count} action${data.count !== 1 ? 's' : ''}</div>
        </div>
        <div class="breakdown-bar-track">
          <div class="breakdown-bar-fill" style="width: ${(data.co2 / maxCO2) * 100}%"></div>
        </div>
        <span class="breakdown-co2">${data.co2.toFixed(1)} kg</span>
      </div>
    `).join('');
}

export { initImpact };