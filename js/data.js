const EcoData = (() => {
  'use strict';

  const STORAGE_KEY = 'ecoflow_data';
  const API_KEY_STORAGE = 'ecoflow_api_key';

  const defaultHabits = [
    { id: 'public_transit', name: 'Used public transit', category: 'transport', co2PerAction: 2.5, icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>' },
    { id: 'bike_walk', name: 'Biked or walked instead of driving', category: 'transport', co2PerAction: 3.2, icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>' },
    { id: 'carpool', name: 'Carpooled', category: 'transport', co2PerAction: 2.0, icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>' },
    { id: 'veg_meal', name: 'Ate a meat-free meal', category: 'food', co2PerAction: 1.5, icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 21h10"/><path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"/><path d="M11.38 12a2.4 2.4 0 0 1-.4-4.77 2.4 2.4 0 0 1 3.2-2.77 2.4 2.4 0 0 1 3.47-.63 2.4 2.4 0 0 1 3.37 3.37 2.4 2.4 0 0 1-1.1 3.7 2.51 2.51 0 0 1 .03 1.1"/><path d="m13 12 4-4"/><path d="M10.9 7.25A3.99 3.99 0 0 0 4 10c0 .73.2 1.41.54 2"/></svg>' },
    { id: 'local_food', name: 'Bought local produce', category: 'food', co2PerAction: 0.8, icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.27 21.7s9.87-3.5 12.73-6.36a4.5 4.5 0 0 0-6.36-6.37C5.77 11.84 2.27 21.7 2.27 21.7zM8.64 14l-2.05-2.04M15.34 15l-2.46-2.46"/><path d="M22 9s-1.33-2-3.5-2C16.86 7 15 9 15 9s1.33 2 3.5 2S22 9 22 9z"/><path d="M15 2s-2 1.33-2 3.5S15 9 15 9s2-1.84 2-3.5C17 3.33 15 2 15 2z"/></svg>' },
    { id: 'no_food_waste', name: 'Zero food waste today', category: 'food', co2PerAction: 1.2, icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>' },
    { id: 'reusable_bag', name: 'Used reusable bags', category: 'shopping', co2PerAction: 0.1, icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 10a4 4 0 0 1-8 0"/><path d="M3.103 6.034h17.794"/><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/></svg>' },
    { id: 'secondhand', name: 'Bought secondhand', category: 'shopping', co2PerAction: 3.0, icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/><path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/><path d="m14 16-3 3 3 3"/><path d="M8.293 13.596 7.196 9.5 3.1 10.598"/><path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843"/><path d="m13.378 9.633 4.096 1.098 1.097-4.096"/></svg>' },
    { id: 'lights_off', name: 'Turned off unused lights', category: 'energy', co2PerAction: 0.3, icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>' },
    { id: 'unplugged', name: 'Unplugged idle devices', category: 'energy', co2PerAction: 0.15, icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2v6"/><path d="M15 2v6"/><path d="M12 17v5"/><path d="M5 8h14"/><path d="M6 11V8h12v3a6 6 0 1 1-12 0Z"/></svg>' },
    { id: 'cold_wash', name: 'Washed clothes in cold water', category: 'energy', co2PerAction: 0.5, icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>' },
    { id: 'recycled', name: 'Recycled properly', category: 'waste', co2PerAction: 0.4, icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' },
    { id: 'composted', name: 'Composted food scraps', category: 'waste', co2PerAction: 0.6, icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22c1.25-.987 2.27-1.975 3.9-2.2a5.56 5.56 0 0 1 3.8 1.5 4 4 0 0 0 6.187-2.353 3.5 3.5 0 0 0 3.69-5.116A3.5 3.5 0 0 0 20.95 8 3.5 3.5 0 1 0 16 3.05a3.5 3.5 0 0 0-5.831 1.373 3.5 3.5 0 0 0-5.116 3.69 4 4 0 0 0-2.348 6.155C3.499 15.42 4.409 16.712 4.2 18.1 3.926 19.743 3.014 20.732 2 22"/><path d="M2 22 17 7"/></svg>' },
    { id: 'no_plastic', name: 'Avoided single-use plastic', category: 'waste', co2PerAction: 0.25, icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M4.929 4.929 19.07 19.071"/></svg>' },
    { id: 'short_shower', name: 'Took a short shower (<5 min)', category: 'water', co2PerAction: 0.2, icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 4 2.5 2.5"/><path d="M13.5 6.5a4.95 4.95 0 0 0-7 7"/><path d="M15 5 5 15"/><path d="M14 17v.01"/><path d="M10 16v.01"/><path d="M13 13v.01"/><path d="M16 10v.01"/><path d="M11 20v.01"/><path d="M17 14v.01"/><path d="M20 11v.01"/></svg>' },
    { id: 'tap_over_bottled', name: 'Drank tap water instead of bottled', category: 'water', co2PerAction: 0.15, icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/></svg>' },
  ];

  const challenges = [
    { id: 'ch1', title: 'Use a reusable water bottle', desc: 'Skip single-use plastic today. Every refill saves ~0.02 kg of CO₂.', co2Bonus: 0.15 },
    { id: 'ch2', title: 'Take public transit or walk', desc: 'Leave the car at home. A 5-mile bus trip saves ~1 kg of CO₂ vs. driving alone.', co2Bonus: 1.5 },
    { id: 'ch3', title: 'Eat a fully plant-based day', desc: 'Three meat-free meals. Going plant-based for one day saves ~4 kg of CO₂.', co2Bonus: 2.0 },
    { id: 'ch4', title: 'Unplug electronics before bed', desc: 'Standby power accounts for 5-10% of home energy. Unplug and save.', co2Bonus: 0.3 },
    { id: 'ch5', title: 'Shop at a farmers market', desc: 'Locally grown food travels fewer miles. Find a market near you today.', co2Bonus: 1.0 },
    { id: 'ch6', title: 'No food waste challenge', desc: 'Use every leftover. The average person wastes 74 kg of food per year.', co2Bonus: 1.2 },
    { id: 'ch7', title: 'Line-dry your laundry', desc: 'Skip the dryer today. Line drying saves ~2 kg of CO₂ per load.', co2Bonus: 2.0 },
    { id: 'ch8', title: 'Bring your own cup', desc: 'Disposable coffee cups create 3 billion pounds of waste annually. Bring yours.', co2Bonus: 0.1 },
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
      version: 1,
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return getDefaultData();
      const data = JSON.parse(raw);
      if (data.version !== 1) return migrate(data);
      return { ...getDefaultData(), ...data };
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
    return getDefaultData();
  }

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
      save(data);
      return false;
    } else {
      today.push(habitId);
      const habit = data.habits.find(h => h.id === habitId);
      data.totalCO2 += habit ? habit.co2PerAction : 0;
      data.totalActions += 1;
      if (!dateKey) updateStreak(data, key);
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

  function updateStreak(data, dateKey) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    if (data.streaks.lastDate === yKey) {
      data.streaks.current += 1;
    } else if (data.streaks.lastDate !== dateKey) {
      data.streaks.current = 1;
    }
    data.streaks.lastDate = dateKey;
    if (data.streaks.current > data.streaks.longest) {
      data.streaks.longest = data.streaks.current;
    }
  }

  function recalculate(data) {
    data.totalCO2 = 0;
    data.totalActions = 0;
    for (const [dateKey, habitIds] of Object.entries(data.completedDates)) {
      for (const hId of habitIds) {
        const habit = data.habits.find(h => h.id === hId);
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
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
    const breakdown = {};
    for (const habitIds of Object.values(data.completedDates)) {
      for (const hId of habitIds) {
        const habit = data.habits.find(h => h.id === hId);
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
    const id = 'custom_' + Date.now();
    data.habits.push({ id, name, category, co2PerAction: co2PerAction || 0.5, icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/><path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/><path d="M5 21h14"/></svg>' });
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

  return {
    load,
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
    defaultHabits,
  };
})();

export { EcoData };