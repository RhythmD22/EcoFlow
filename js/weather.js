import { EcoData } from './data.js';
import { EcoGeo } from './geo.js';
import { WEATHER_CACHE_MS } from './constants.js';
import { debugWarn } from './utils.js';

const EcoWeather = (() => {
  'use strict';

  let cachedWeather = null;
  let cacheTime = 0;

  function hasKey() {
    return EcoData.getWeatherKey().length > 0;
  }

  async function fetchWeather() {
    if (!hasKey()) return null;

    if (cachedWeather && (Date.now() - cacheTime) < WEATHER_CACHE_MS) {
      return cachedWeather;
    }

    try {
      const pos = await EcoGeo.getPosition();
      const key = EcoData.getWeatherKey();
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${pos.lat}&lon=${pos.lon}&appid=${key}&units=metric`;

      const response = await fetch(url);
      if (!response.ok) {
        debugWarn('EcoFlow: OpenWeatherMap API error:', response.status);
        return null;
      }

      const data = await response.json();
      const weather = {
        temp: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        condition: data.weather[0].main,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        clouds: data.clouds.all,
        rain: data.rain ? (data.rain['1h'] || 0) : 0,
        city: data.name,
        country: data.sys?.country || '',
      };

      if (weather.country) {
        EcoGeo.setCountry({ code: weather.country, name: '' });
      }

      cachedWeather = weather;
      cacheTime = Date.now();
      return weather;
    } catch (err) {
      debugWarn('EcoFlow: Weather fetch failed:', err.message);
      return null;
    }
  }

  function describeWeather(weather) {
    if (!weather) return null;

    const tempF = Math.round(weather.temp * 9 / 5 + 32);
    const cond = weather.description;

    return {
      summary: `It's ${tempF}°F with ${cond} in ${weather.city}.`,
      isGoodForBiking: weather.temp >= 10 && weather.temp <= 30 && weather.rain === 0 && weather.windSpeed < 8,
      isGoodForWalking: weather.temp >= 5 && weather.temp <= 35 && weather.rain === 0,
      isRainy: weather.rain > 0 || weather.condition === 'Rain' || weather.condition === 'Drizzle' || weather.condition === 'Thunderstorm',
      isSunny: weather.condition === 'Clear',
      isHot: weather.temp > 30,
      isCold: weather.temp < 5,
      condition: weather.condition,
      temp: weather.temp,
      tempF,
    };
  }

  return { fetchWeather, describeWeather, hasKey };
})();

export { EcoWeather };