import { EcoGeo } from './geo.js';
import { AQI_CACHE_MS } from './constants.js';
import { debugWarn } from './utils.js';

const EcoAQI = (() => {
  'use strict';

  let cachedAQI = null;
  let cacheTime = 0;

  function getCached() {
    if (cachedAQI && (Date.now() - cacheTime) < AQI_CACHE_MS) {
      return cachedAQI;
    }
    return null;
  }

  async function fetchAQI() {
    if (cachedAQI && (Date.now() - cacheTime) < AQI_CACHE_MS) {
      return cachedAQI;
    }

    try {
      const pos = await EcoGeo.getPosition();
      const coords = `${pos.lat.toFixed(4)},${pos.lon.toFixed(4)}`;

      const locResponse = await fetch(
        `https://api.openaq.org/v3/locations?coordinates=${coords}&radius=10000&limit=3`
      );
      if (!locResponse.ok) return null;

      const locData = await locResponse.json();
      const locations = locData.results || [];
      if (locations.length === 0) return null;

      const location = locations[0];
      const locId = location.id;
      const locName = location.name || location.locality || 'nearby';

      const latestResponse = await fetch(
        `https://api.openaq.org/v3/locations/${locId}/latest`
      );
      if (!latestResponse.ok) return null;

      const latestData = await latestResponse.json();
      const measurements = latestData.results || [];

      const pm25 = measurements.find(m => m.parameter?.name === 'pm25');
      const pm10 = measurements.find(m => m.parameter?.name === 'pm10');
      const no2 = measurements.find(m => m.parameter?.name === 'no2');
      const o3 = measurements.find(m => m.parameter?.name === 'o3');

      const pm25Value = pm25 ? pm25.value : null;

      let level = 'unknown';
      let summary = '';
      let recommendation = '';

      if (pm25Value !== null) {
        if (pm25Value <= 12) {
          level = 'good';
          summary = `Air quality is excellent (PM2.5: ${pm25Value.toFixed(0)} µg/m³)`;
          recommendation = 'Great day for outdoor activities — walk, bike, or exercise outside.';
        } else if (pm25Value <= 35.4) {
          level = 'moderate';
          summary = `Air quality is moderate (PM2.5: ${pm25Value.toFixed(0)} µg/m³)`;
          recommendation = 'Generally safe to be outside, but sensitive individuals may want to limit prolonged exertion.';
        } else if (pm25Value <= 55.4) {
          level = 'unhealthy-sensitive';
          summary = `Air quality is unhealthy for sensitive groups (PM2.5: ${pm25Value.toFixed(0)} µg/m³)`;
          recommendation = 'Consider indoor activities today — reduce outdoor exercise and keep windows closed.';
        } else {
          level = 'unhealthy';
          summary = `Air quality is poor (PM2.5: ${pm25Value.toFixed(0)} µg/m³)`;
          recommendation = 'Stay indoors if possible. Avoid outdoor exercise. Unplug idle devices to reduce energy demand.';
        }
      }

      const result = {
        locationName: locName,
        pm25: pm25Value,
        pm10: pm10 ? pm10.value : null,
        no2: no2 ? no2.value : null,
        o3: o3 ? o3.value : null,
        level,
        summary,
        recommendation,
        isGood: level === 'good',
        isPoor: level === 'unhealthy' || level === 'unhealthy-sensitive',
      };

      cachedAQI = result;
      cacheTime = Date.now();
      return result;
    } catch (err) {
      debugWarn('EcoFlow: OpenAQ fetch failed:', err.message);
      return null;
    }
  }

  return { fetchAQI };
})();

export { EcoAQI };