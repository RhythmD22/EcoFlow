import { COUNTRY_CACHE_MS } from './constants.js';
import { debugWarn } from './utils.js';

const EcoGeo = (() => {
  'use strict';

  function getPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => reject(new Error('Location access denied')),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 30 * 60 * 1000 }
      );
    });
  }

  let cachedCountry = null;
  let countryCacheTime = 0;

  async function getCountry() {
    if (cachedCountry && (Date.now() - countryCacheTime) < COUNTRY_CACHE_MS) {
      return cachedCountry;
    }

    try {
      const pos = await getPosition();
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lon}&zoom=3`;

      const response = await fetch(url, {
        headers: { 'Accept-Language': 'en' },
      });

      if (!response.ok) return null;

      const data = await response.json();
      const countryCode = data?.address?.country_code?.toUpperCase();

      if (countryCode) {
        cachedCountry = {
          code: countryCode,
          name: data.address.country,
        };
        countryCacheTime = Date.now();
        return cachedCountry;
      }

      return null;
    } catch (err) {
      debugWarn('EcoFlow: Nominatim geocoding failed:', err.message);
      return null;
    }
  }

  function setCountry(country) {
    if (country) {
      if (!country.name && cachedCountry && cachedCountry.name) {
        cachedCountry = { code: country.code || cachedCountry.code, name: cachedCountry.name };
      } else {
        cachedCountry = country;
      }
      countryCacheTime = Date.now();
    }
  }

  return { getPosition, getCountry, setCountry };
})();

export { EcoGeo };