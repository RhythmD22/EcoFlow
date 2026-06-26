import { EcoGeo } from './geo.js';
import { CLIMATE_CACHE_MS } from './constants.js';
import { debugWarn } from './utils.js';

const EcoClimate = (() => {
  'use strict';

  let cachedData = null;
  let cacheTime = 0;

  const FALLBACK_EMISSIONS = {
    default: { value: 4.7, country: 'global average' },
  };

  async function fetchCountryEmissions() {
    if (cachedData && (Date.now() - cacheTime) < CLIMATE_CACHE_MS) {
      return cachedData;
    }

    try {
      const countryInfo = await EcoGeo.getCountry();
      const country = countryInfo?.code;

      if (!country) {
        cachedData = FALLBACK_EMISSIONS.default;
        cacheTime = Date.now();
        return cachedData;
      }

      const url = `https://api.worldbank.org/v2/country/${country}/indicator/EN.GHG.CO2.PC.CE.AR5?format=json&per_page=1&mrv=1`;
      const response = await fetch(url);
      if (!response.ok) {
        cachedData = FALLBACK_EMISSIONS.default;
        cacheTime = Date.now();
        return cachedData;
      }

      const data = await response.json();
      const records = data[1];
      if (!records || records.length === 0) {
        cachedData = FALLBACK_EMISSIONS.default;
        cacheTime = Date.now();
        return cachedData;
      }

      const latest = records[0];
      const tonsPerCapita = latest.value || 4.7;
      const kgPerYear = Math.round(tonsPerCapita * 1000);

      cachedData = {
        country: latest.country?.value || 'your country',
        countryCode: country,
        tonsPerCapita,
        kgPerYear,
        year: latest.date,
      };
      cacheTime = Date.now();
      return cachedData;
    } catch (err) {
      debugWarn('EcoFlow: World Bank climate data fetch failed:', err.message);
      cachedData = FALLBACK_EMISSIONS.default;
      cacheTime = Date.now();
      return cachedData;
    }
  }

  return { fetchCountryEmissions };
})();

export { EcoClimate };