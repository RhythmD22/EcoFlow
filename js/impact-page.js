import { EcoData } from './data.js';
import { EcoClimate } from './climate.js';
import { Icons } from './icons.js';
import { cssVar } from './utils.js';
import { CO2_PER_TREE_KG, CO2_PER_CAR_MILE_KG, CO2_PER_LITER_WATER_KG, CO2_PER_KWH_KG } from './constants.js';

function getCategoryColors() {
  return {
    transport: cssVar('--brand', '#15803d'),
    food: cssVar('--cyan', '#0e7490'),
    energy: cssVar('--energy', '#92400e'),
    shopping: cssVar('--accent-purple', '#a78bfa'),
    waste: cssVar('--danger', '#b91c1c'),
    water: cssVar('--info', '#0369a1'),
  };
}

function getCategoryColorsAlpha() {
  const colors = getCategoryColors();
  const alpha = {};
  for (const [cat, hex] of Object.entries(colors)) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    alpha[cat] = `rgba(${r},${g},${b},0.7)`;
  }
  return alpha;
}

function initImpact() {
  const appData = EcoData.load();

  const totalCO2 = document.getElementById('impact-total-co2');
  const equivalent = document.getElementById('impact-equivalent');
  const national = document.getElementById('impact-national');

  if (totalCO2) totalCO2.textContent = appData.totalCO2.toFixed(1);

  const treesVal = appData.totalCO2 / CO2_PER_TREE_KG;
  const carMiles = appData.totalCO2 / CO2_PER_CAR_MILE_KG;
  const waterLiters = appData.totalCO2 / CO2_PER_LITER_WATER_KG;
  const energyKWh = appData.totalCO2 / CO2_PER_KWH_KG;

  document.getElementById('eq-trees').textContent = treesVal.toFixed(1);
  document.getElementById('eq-car-miles').textContent = Math.round(carMiles);
  document.getElementById('eq-water').textContent = Math.round(waterLiters);
  document.getElementById('eq-energy').textContent = energyKWh.toFixed(1);

  if (equivalent) {
    if (appData.totalCO2 < 1) {
      equivalent.textContent = 'Every action counts. Keep going to see your impact grow.';
    } else if (appData.totalCO2 < 10) {
      equivalent.textContent = `That's like planting ${Math.ceil(treesVal)} tree seedling${Math.ceil(treesVal) > 1 ? 's' : ''} - keep it up!`;
    } else if (appData.totalCO2 < 50) {
      equivalent.textContent = `Impressive! Equivalent to taking a car off the road for ${Math.round(carMiles / 40)} days.`;
    } else {
      equivalent.textContent = `Outstanding! You've matched the annual carbon capture of ${treesVal.toFixed(1)} mature trees.`;
    }
  }

  updateNationalText(national, appData, EcoClimate.getCachedEmissions());
  EcoClimate.fetchCountryEmissions()
    .then(comparison => updateNationalText(national, appData, comparison))
    .catch(() => { if (national) national.textContent = ''; });

  renderBreakdown(appData);
  renderEquivalentsChart(treesVal, carMiles, waterLiters, energyKWh);
}

function updateNationalText(national, appData, comparison) {
  if (!national) return;
  if (comparison && comparison.countryCode && appData.totalCO2 > 0) {
    const pct = ((appData.totalCO2 / comparison.kgPerYear) * 100).toFixed(2);
    national.textContent = `The average person in ${comparison.country} emits ${comparison.kgPerYear.toLocaleString()} kg CO₂ per year - you've offset ${pct}% of that.`;
  } else {
    national.textContent = '';
  }
}

function renderEquivalentsChart(treesVal, carMiles, waterLiters, energyKWh) {
  const canvas = document.getElementById('chart-equivalents');
  if (!canvas || typeof Chart === 'undefined') return;

  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();

  const brand = cssVar('--brand', '#15803d');
  const cyan = cssVar('--cyan', '#0e7490');
  const info = cssVar('--info', '#0369a1');
  const energy = cssVar('--energy', '#92400e');
  const textSecondary = cssVar('--text-secondary', '#56635b');
  const gridColor = cssVar('--grid-color', 'rgba(0,0,0,0.06)');

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['Trees Planted', 'Miles Not Driven', 'Liters Saved', 'kWh Saved'],
      datasets: [{
        data: [treesVal, Math.round(carMiles), Math.round(waterLiters), energyKWh],
        backgroundColor: [brand, cyan, info, energy],
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          ticks: { color: textSecondary, font: { size: 12 } },
          grid: { display: false },
        },
        y: {
          ticks: { color: textSecondary, font: { size: 11 } },
          grid: { color: gridColor },
          beginAtZero: true,
        },
      },
    },
  });
}

function renderBreakdown(appData) {
  const list = document.getElementById('breakdown-list');
  if (!list) return;

  const breakdown = EcoData.getCategoryBreakdown(appData);
  const maxCO2 = Math.max(1, ...Object.values(breakdown).map(b => b.co2));

  const icons = {
    transport: Icons.bus,
    food: Icons.plate,
    energy: Icons.lightBulb,
    shopping: Icons.bag,
    waste: Icons.recycle,
    water: Icons.shower,
  };

  list.innerHTML = Object.entries(breakdown)
    .sort((a, b) => b[1].co2 - a[1].co2)
    .map(([cat, data]) => `
      <div class="breakdown-item glass">
        <span class="breakdown-icon">${icons[cat] || Icons.tree}</span>
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

  renderDoughnutChart(breakdown);
}

function renderDoughnutChart(breakdown) {
  const canvas = document.getElementById('chart-category-doughnut');
  if (!canvas || typeof Chart === 'undefined') return;

  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();

  const entries = Object.entries(breakdown)
    .filter(([, d]) => d.co2 > 0)
    .sort((a, b) => b[1].co2 - a[1].co2);

  if (entries.length === 0) return;

  const catColors = getCategoryColors();
  const catColorsAlpha = getCategoryColorsAlpha();
  const textSecondary = cssVar('--text-secondary', '#9ca3a0');

  new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: entries.map(([cat]) => cat.charAt(0).toUpperCase() + cat.slice(1)),
      datasets: [{
        data: entries.map(([, d]) => d.co2),
        backgroundColor: entries.map(([cat]) => catColorsAlpha[cat] || catColors.transport),
        borderColor: entries.map(([cat]) => catColors[cat] || catColors.transport),
        borderWidth: 1,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textSecondary,
            padding: 16,
            font: { size: 12 },
            usePointStyle: true,
            pointStyleWidth: 8,
          },
        },
      },
      cutout: '65%',
    },
  });
}

export { initImpact };