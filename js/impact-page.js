import { EcoData } from './data.js';
import { EcoClimate } from './climate.js';
import { Icons } from './icons.js';
import { CO2_PER_TREE_KG, CO2_PER_CAR_MILE_KG, CO2_PER_LITER_WATER_KG, CO2_PER_KWH_KG } from './constants.js';

async function initImpact() {
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
      equivalent.textContent = `That's like planting ${Math.ceil(treesVal)} tree seedling${Math.ceil(treesVal) > 1 ? 's' : ''} — keep it up!`;
    } else if (appData.totalCO2 < 50) {
      equivalent.textContent = `Impressive! Equivalent to taking a car off the road for ${Math.round(carMiles / 40)} days.`;
    } else {
      equivalent.textContent = `Outstanding! You've matched the annual carbon capture of ${treesVal.toFixed(1)} mature trees.`;
    }
  }

  if (national) {
    try {
      const comparison = await EcoClimate.fetchCountryEmissions();
      if (comparison && comparison.countryCode && appData.totalCO2 > 0) {
        const pct = ((appData.totalCO2 / comparison.kgPerYear) * 100).toFixed(2);
        national.textContent = `The average person in ${comparison.country} emits ${comparison.kgPerYear.toLocaleString()} kg CO₂ per year — you've offset ${pct}% of that.`;
      } else {
        national.textContent = '';
      }
    } catch (_) {
      national.textContent = '';
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
}

export { initImpact };