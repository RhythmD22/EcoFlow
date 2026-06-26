import { CO2_VALIDATION_MIN, CO2_VALIDATION_MAX } from './constants.js';
import { Icons } from './icons.js';

const EcoData = (() => {
  'use strict';

  const STORAGE_KEY = 'ecoflow_data';
  const API_KEY_STORAGE = 'ecoflow_api_key';
  const WEATHER_KEY_STORAGE = 'ecoflow_weather_key';

  const defaultHabits = [
    { id: 'public_transit', name: 'Used public transit', category: 'transport', co2PerAction: 2.5, icon: Icons.bus },
    { id: 'bike_walk', name: 'Biked or walked instead of driving', category: 'transport', co2PerAction: 3.2, icon: Icons.bike },
    { id: 'carpool', name: 'Carpooled', category: 'transport', co2PerAction: 2.0, icon: Icons.carpool },
    { id: 'veg_meal', name: 'Ate a meat-free meal', category: 'food', co2PerAction: 1.5, icon: Icons.plate },
    { id: 'local_food', name: 'Bought local produce', category: 'food', co2PerAction: 0.8, icon: Icons.localFood },
    { id: 'no_food_waste', name: 'Zero food waste today', category: 'food', co2PerAction: 1.2, icon: Icons.noFoodWaste },
    { id: 'reusable_bag', name: 'Used reusable bags', category: 'shopping', co2PerAction: 0.1, icon: Icons.bag },
    { id: 'secondhand', name: 'Bought secondhand', category: 'shopping', co2PerAction: 3.0, icon: Icons.secondhand },
    { id: 'lights_off', name: 'Turned off unused lights', category: 'energy', co2PerAction: 0.3, icon: Icons.lightBulb },
    { id: 'unplugged', name: 'Unplugged idle devices', category: 'energy', co2PerAction: 0.15, icon: Icons.battery },
    { id: 'cold_wash', name: 'Washed clothes in cold water', category: 'energy', co2PerAction: 0.5, icon: Icons.coldWash },
    { id: 'recycled', name: 'Recycled properly', category: 'waste', co2PerAction: 0.4, icon: Icons.recycle },
    { id: 'composted', name: 'Composted food scraps', category: 'waste', co2PerAction: 0.6, icon: Icons.compost },
    { id: 'no_plastic', name: 'Avoided single-use plastic', category: 'waste', co2PerAction: 0.25, icon: Icons.noPlastic },
    { id: 'short_shower', name: 'Took a short shower (<5 min)', category: 'water', co2PerAction: 0.2, icon: Icons.shower },
    { id: 'tap_over_bottled', name: 'Drank tap water instead of bottled', category: 'water', co2PerAction: 0.15, icon: Icons.waterDrop },
  ];

  const challenges = [
    { id: 'ch1', title: 'Use a reusable water bottle', desc: 'Skip single-use plastic for all your drinks today.', co2Bonus: 0.15 },
    { id: 'ch2', title: 'Take public transit or walk', desc: 'Leave the car behind for one trip you\'d normally drive.', co2Bonus: 1.5 },
    { id: 'ch3', title: 'Eat a fully plant-based day', desc: 'Three meals, zero animal products. See how it feels.', co2Bonus: 2.0 },
    { id: 'ch4', title: 'Unplug electronics before bed', desc: 'Pull the plug on anything not in use overnight.', co2Bonus: 0.3 },
    { id: 'ch5', title: 'Shop at a farmers market', desc: 'Find a local market and buy directly from growers.', co2Bonus: 1.0 },
    { id: 'ch6', title: 'No food waste challenge', desc: 'Use every scrap. Plan portions, save leftovers, get creative.', co2Bonus: 1.2 },
    { id: 'ch7', title: 'Line-dry your laundry', desc: 'Skip the dryer and hang your clothes to dry.', co2Bonus: 2.0 },
    { id: 'ch8', title: 'Bring your own cup', desc: 'No disposable cups today. Bring a reusable one.', co2Bonus: 0.1 },
  ];

  function getDefaultData() {
    return {
      habits: [...defaultHabits],
      completedDates: {},
      streaks: { current: 0, longest: 0, lastDate: null },
      totalCO2: 0,
      totalActions: 0,
      challengeDate: null,
      challengeCompleted: false,
      challengeId: null,
      chatHistory: [],
      version: 1,
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return getDefaultData();
      const data = JSON.parse(raw);
      if (!data.version || data.version < 1) return migrate(data);
      const merged = { ...getDefaultData(), ...data };
      recomputeStreak(merged);
      return merged;
    } catch {
      return getDefaultData();
    }
  }

  function save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn('EcoFlow: localStorage quota exceeded');
      }
    }
  }

  function migrate(data) {
    const migrated = { ...getDefaultData() };
    if (data.habits) migrated.habits = data.habits;
    if (data.completedDates) migrated.completedDates = data.completedDates;
    if (data.streaks) migrated.streaks = data.streaks;
    if (typeof data.totalCO2 === 'number') migrated.totalCO2 = data.totalCO2;
    if (typeof data.totalActions === 'number') migrated.totalActions = data.totalActions;
    if (data.challengeDate) migrated.challengeDate = data.challengeDate;
    if (typeof data.challengeCompleted === 'boolean') migrated.challengeCompleted = data.challengeCompleted;
    if (data.challengeId) migrated.challengeId = data.challengeId;
    if (Array.isArray(data.chatHistory)) migrated.chatHistory = data.chatHistory;
    save(migrated);
    return migrated;
  }

  function formatDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function todayKey() {
    return formatDateKey(new Date());
  }

  function getTodayHabits(data) {
    const key = todayKey();
    return data.completedDates[key] || [];
  }

  function toggleHabit(data, habitId, dateKey = null) {
    const key = dateKey || todayKey();
    if (!data.completedDates[key]) data.completedDates[key] = [];
    const today = data.completedDates[key];
    const idx = today.indexOf(habitId);

    if (idx >= 0) {
      today.splice(idx, 1);
      if (today.length === 0) delete data.completedDates[key];
      recalculate(data);
      recomputeStreak(data);
      save(data);
      return false;
    } else {
      today.push(habitId);
      recalculate(data);
      recomputeStreak(data);
      save(data);
      return true;
    }
  }

  function isHabitDone(data, habitId, dateKey = null) {
    const key = dateKey || todayKey();
    const today = data.completedDates[key] || [];
    return today.includes(habitId);
  }

  function getHabitsForDate(data, dateKey) {
    return data.completedDates[dateKey] || [];
  }

  function recomputeStreak(data) {
    const dates = Object.keys(data.completedDates).sort().reverse();
    if (dates.length === 0) {
      data.streaks.current = 0;
      data.streaks.lastDate = null;
      return;
    }

    const latest = dates[0];
    const todayStr = todayKey();

    if (latest !== todayStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = formatDateKey(yesterday);
      if (latest !== yesterdayStr) {
        data.streaks.current = 0;
        data.streaks.lastDate = latest;
        return;
      }
    }

    let current = 1;

    for (let i = 1; i < dates.length; i++) {
      const d1 = new Date(dates[i - 1] + 'T12:00:00');
      const d2 = new Date(dates[i] + 'T12:00:00');
      const diffDays = Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        current++;
      } else {
        break;
      }
    }

    data.streaks.current = current;
    data.streaks.lastDate = latest;
    if (current > data.streaks.longest) {
      data.streaks.longest = current;
    }
  }

  function buildHabitMap(habits) {
    const map = new Map();
    for (const h of habits) {
      map.set(h.id, h);
    }
    return map;
  }

  function recalculate(data) {
    const habitMap = buildHabitMap(data.habits);
    data.totalCO2 = 0;
    data.totalActions = 0;
    for (const habitIds of Object.values(data.completedDates)) {
      for (const hId of habitIds) {
        const habit = habitMap.get(hId);
        if (habit) {
          data.totalCO2 += habit.co2PerAction;
          data.totalActions += 1;
        }
      }
    }
  }

  function getWeeklyHeatmap(data) {
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = formatDateKey(d);
      const count = (data.completedDates[key] || []).length;
      days.push({
        key,
        day: d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
        count,
      });
    }
    return days;
  }

  function getCategoryBreakdown(data) {
    const habitMap = buildHabitMap(data.habits);
    const breakdown = {};
    for (const habitIds of Object.values(data.completedDates)) {
      for (const hId of habitIds) {
        const habit = habitMap.get(hId);
        if (!habit) continue;
        if (!breakdown[habit.category]) {
          breakdown[habit.category] = { count: 0, co2: 0 };
        }
        breakdown[habit.category].count += 1;
        breakdown[habit.category].co2 += habit.co2PerAction;
      }
    }
    return breakdown;
  }

  function getDailyChallenge(data) {
    const today = todayKey();
    if (data.challengeDate !== today) {
      const idx = Math.floor(Math.random() * challenges.length);
      data.challengeDate = today;
      data.challengeId = challenges[idx].id;
      data.challengeCompleted = false;
      save(data);
    }
    return challenges.find(c => c.id === data.challengeId) || challenges[0];
  }

  function completeChallenge(data) {
    const challenge = data.challengeId ? challenges.find(c => c.id === data.challengeId) : null;
    if (challenge && !data.challengeCompleted) {
      data.challengeCompleted = true;
      data.totalCO2 += challenge.co2Bonus;
      data.totalActions += 1;
      save(data);
      return true;
    }
    return false;
  }

  function addCustomHabit(data, name, category, co2PerAction) {
    const safeCO2 = co2PerAction == null ? 0.5 : co2PerAction;
    const validCO2 = safeCO2 === 0 ? 0 : Math.min(CO2_VALIDATION_MAX, Math.max(CO2_VALIDATION_MIN, safeCO2));
    const id = 'custom_' + Date.now();
    data.habits.push({ id, name, category, co2PerAction: validCO2, icon: Icons.tree });
    save(data);
    return id;
  }

  function removeHabit(data, habitId) {
    data.habits = data.habits.filter(h => h.id !== habitId);
    for (const key of Object.keys(data.completedDates)) {
      data.completedDates[key] = data.completedDates[key].filter(id => id !== habitId);
      if (data.completedDates[key].length === 0) delete data.completedDates[key];
    }
    recalculate(data);
    save(data);
  }

  function addChatMessage(data, role, text, time) {
    if (!data.chatHistory) data.chatHistory = [];
    data.chatHistory.push({ role, text, time });
    save(data);
  }

  function getChatHistory(data) {
    return data.chatHistory || [];
  }

  function clearChatHistory(data) {
    data.chatHistory = [];
    save(data);
  }

  function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function exportData() {
    return JSON.stringify(load(), null, 2);
  }

  function getAPIKey() {
    return localStorage.getItem(API_KEY_STORAGE) || '';
  }

  function setAPIKey(key) {
    localStorage.setItem(API_KEY_STORAGE, key.trim());
  }

  function getWeatherKey() {
    return localStorage.getItem(WEATHER_KEY_STORAGE) || '';
  }

  function setWeatherKey(key) {
    localStorage.setItem(WEATHER_KEY_STORAGE, key.trim());
  }

  function refreshData(target) {
    const fresh = load();
    for (const key of Object.keys(target)) {
      if (!(key in fresh)) delete target[key];
    }
    for (const key of Object.keys(fresh)) {
      target[key] = fresh[key];
    }
    return target;
  }

  return {
    load,
    refreshData,
    toggleHabit,
    isHabitDone,
    getTodayKey: todayKey,
    getHabitsForDate,
    getWeeklyHeatmap,
    getCategoryBreakdown,
    getDailyChallenge,
    completeChallenge,
    addCustomHabit,
    removeHabit,
    resetAll,
    exportData,
    getAPIKey,
    setAPIKey,
    getWeatherKey,
    setWeatherKey,
    addChatMessage,
    getChatHistory,
    clearChatHistory,
    defaultHabits,
  };
})();

export { EcoData };