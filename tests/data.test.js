import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { EcoData } from '../js/data.js';
import { freshLocalStorage } from './helpers.js';

beforeEach(() => {
  freshLocalStorage();
  EcoData.resetAll();
});

describe('load', () => {
  it('returns default data when nothing is stored', () => {
    const data = EcoData.load();
    assert.ok(Array.isArray(data.habits));
    assert.ok(data.habits.length > 0);
    assert.strictEqual(data.totalCO2, 0);
    assert.strictEqual(data.totalActions, 0);
    assert.strictEqual(data.version, 1);
  });

  it('returns cached data from localStorage', () => {
    const data = EcoData.load();
    data.totalCO2 = 42;
    EcoData.save(data);
    const loaded = EcoData.load();
    assert.strictEqual(loaded.totalCO2, 42);
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('ecoflow_data', 'not json');
    const data = EcoData.load();
    assert.ok(Array.isArray(data.habits));
  });
});

describe('save', () => {
  it('persists data to localStorage', () => {
    const data = EcoData.load();
    data.totalCO2 = 100;
    EcoData.save(data);
    const raw = JSON.parse(localStorage.getItem('ecoflow_data'));
    assert.strictEqual(raw.totalCO2, 100);
  });
});

describe('_getDefaultData', () => {
  it('returns a fresh default state', () => {
    const data = EcoData._getDefaultData();
    assert.ok(Array.isArray(data.habits));
    assert.strictEqual(data.totalCO2, 0);
    assert.strictEqual(data.totalActions, 0);
    assert.deepStrictEqual(data.streaks, { current: 0, longest: 0, lastDate: null });
    assert.strictEqual(data.challengeDate, null);
    assert.strictEqual(data.challengeCompleted, false);
    assert.strictEqual(data.challengeId, null);
    assert.deepStrictEqual(data.chatHistory, []);
    assert.strictEqual(data.version, 1);
  });
});

describe('_formatDateKey', () => {
  it('formats a Date to YYYY-MM-DD', () => {
    assert.strictEqual(EcoData._formatDateKey(new Date(2024, 0, 15)), '2024-01-15');
    assert.strictEqual(EcoData._formatDateKey(new Date(2024, 11, 31)), '2024-12-31');
  });
});

describe('getTodayKey', () => {
  it('returns today in YYYY-MM-DD format', () => {
    const key = EcoData.getTodayKey();
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(key));
  });
});

describe('isHabitDone', () => {
  it('returns false when no habits are completed', () => {
    const data = EcoData._getDefaultData();
    assert.strictEqual(EcoData.isHabitDone(data, 'bike_walk'), false);
  });

  it('returns true after toggling a habit', () => {
    const data = EcoData._getDefaultData();
    EcoData.toggleHabit(data, 'bike_walk');
    assert.ok(EcoData.isHabitDone(data, 'bike_walk'));
  });

  it('returns false after toggling a habit off', () => {
    const data = EcoData._getDefaultData();
    EcoData.toggleHabit(data, 'bike_walk');
    EcoData.toggleHabit(data, 'bike_walk');
    assert.strictEqual(EcoData.isHabitDone(data, 'bike_walk'), false);
  });

  it('works with explicit date keys', () => {
    const data = EcoData._getDefaultData();
    EcoData.toggleHabit(data, 'bike_walk', '2024-01-15');
    assert.ok(EcoData.isHabitDone(data, 'bike_walk', '2024-01-15'));
    assert.strictEqual(EcoData.isHabitDone(data, 'bike_walk', '2024-01-16'), false);
  });
});

describe('toggleHabit', () => {
  it('returns true when adding a habit', () => {
    const data = EcoData._getDefaultData();
    const result = EcoData.toggleHabit(data, 'bike_walk');
    assert.strictEqual(result, true);
  });

  it('returns false when removing a habit', () => {
    const data = EcoData._getDefaultData();
    EcoData.toggleHabit(data, 'bike_walk');
    const result = EcoData.toggleHabit(data, 'bike_walk');
    assert.strictEqual(result, false);
  });

  it('removes empty date keys', () => {
    const data = EcoData._getDefaultData();
    const key = EcoData.getTodayKey();
    EcoData.toggleHabit(data, 'bike_walk');
    assert.ok(data.completedDates[key]);
    EcoData.toggleHabit(data, 'bike_walk');
    assert.strictEqual(data.completedDates[key], undefined);
  });
});

describe('getHabitsForDate', () => {
  it('returns empty array for a date with no completions', () => {
    const data = EcoData._getDefaultData();
    assert.deepStrictEqual(EcoData.getHabitsForDate(data, '2024-01-15'), []);
  });

  it('returns completed habit IDs for a date', () => {
    const data = EcoData._getDefaultData();
    EcoData.toggleHabit(data, 'bike_walk', '2024-01-15');
    EcoData.toggleHabit(data, 'veg_meal', '2024-01-15');
    const habits = EcoData.getHabitsForDate(data, '2024-01-15');
    assert.strictEqual(habits.length, 2);
    assert.ok(habits.includes('bike_walk'));
    assert.ok(habits.includes('veg_meal'));
  });
});

describe('_recalculate', () => {
  it('sums totalCO2 and totalActions from all completed habits', () => {
    const data = EcoData._getDefaultData();
    EcoData.toggleHabit(data, 'bike_walk', '2024-01-15');
    assert.strictEqual(data.totalCO2, 3.2);
    assert.strictEqual(data.totalActions, 1);
  });

  it('ignores habits not in the habit list', () => {
    const data = EcoData._getDefaultData();
    data.completedDates = { '2024-01-15': ['nonexistent'] };
    EcoData._recalculate(data);
    assert.strictEqual(data.totalCO2, 0);
    assert.strictEqual(data.totalActions, 0);
  });
});

describe('_recomputeStreak', () => {
  it('sets current to 0 when no dates exist', () => {
    const data = EcoData._getDefaultData();
    EcoData._recomputeStreak(data);
    assert.strictEqual(data.streaks.current, 0);
    assert.strictEqual(data.streaks.lastDate, null);
  });

  it('counts consecutive days', () => {
    const data = EcoData._getDefaultData();
    const today = EcoData.getTodayKey();
    const yesterday = EcoData._formatDateKey(new Date(Date.now() - 86400000));
    data.completedDates = { [today]: ['bike_walk'], [yesterday]: ['veg_meal'] };
    EcoData._recomputeStreak(data);
    assert.strictEqual(data.streaks.current, 2);
  });

  it('breaks streak on missing day', () => {
    const data = EcoData._getDefaultData();
    const today = EcoData.getTodayKey();
    const twoDaysAgo = EcoData._formatDateKey(new Date(Date.now() - 2 * 86400000));
    data.completedDates = { [today]: ['bike_walk'], [twoDaysAgo]: ['veg_meal'] };
    EcoData._recomputeStreak(data);
    assert.strictEqual(data.streaks.current, 1);
  });

  it('updates longest streak', () => {
    const data = EcoData._getDefaultData();
    data.streaks.longest = 3;
    const today = EcoData.getTodayKey();
    const yesterday = EcoData._formatDateKey(new Date(Date.now() - 86400000));
    const day3 = EcoData._formatDateKey(new Date(Date.now() - 2 * 86400000));
    const day4 = EcoData._formatDateKey(new Date(Date.now() - 3 * 86400000));
    data.completedDates = { [today]: ['a'], [yesterday]: ['b'], [day3]: ['c'], [day4]: ['d'] };
    EcoData._recomputeStreak(data);
    assert.strictEqual(data.streaks.current, 4);
    assert.strictEqual(data.streaks.longest, 4);
  });
});

describe('getCategoryBreakdown', () => {
  it('returns empty object when nothing completed', () => {
    const data = EcoData._getDefaultData();
    const breakdown = EcoData.getCategoryBreakdown(data);
    assert.deepStrictEqual(breakdown, {});
  });

  it('groups by category with counts and CO2', () => {
    const data = EcoData._getDefaultData();
    EcoData.toggleHabit(data, 'bike_walk', '2024-01-15');
    EcoData.toggleHabit(data, 'veg_meal', '2024-01-15');
    const breakdown = EcoData.getCategoryBreakdown(data);
    assert.ok(breakdown.transport);
    assert.ok(breakdown.food);
    assert.strictEqual(breakdown.transport.co2, 3.2);
    assert.strictEqual(breakdown.food.co2, 1.5);
  });
});

describe('getWeeklyHeatmap', () => {
  it('returns 7 days', () => {
    const data = EcoData._getDefaultData();
    const heatmap = EcoData.getWeeklyHeatmap(data);
    assert.strictEqual(heatmap.length, 7);
  });

  it('counts completions per day', () => {
    const data = EcoData._getDefaultData();
    EcoData.toggleHabit(data, 'bike_walk', EcoData.getTodayKey());
    const heatmap = EcoData.getWeeklyHeatmap(data);
    const today = heatmap[heatmap.length - 1];
    assert.strictEqual(today.count, 1);
  });
});

describe('getTrendData', () => {
  it('returns 30 days by default', () => {
    const data = EcoData._getDefaultData();
    const trend = EcoData.getTrendData(data);
    assert.strictEqual(trend.length, 30);
  });

  it('accepts custom number of days', () => {
    const data = EcoData._getDefaultData();
    const trend = EcoData.getTrendData(data, 7);
    assert.strictEqual(trend.length, 7);
  });
});

describe('addCustomHabit', () => {
  it('adds a new habit to the list', () => {
    const data = EcoData._getDefaultData();
    const len = data.habits.length;
    const id = EcoData.addCustomHabit(data, 'Test Habit', 'transport', 1.5);
    assert.strictEqual(data.habits.length, len + 1);
    assert.strictEqual(typeof id, 'string');
    assert.ok(id.startsWith('custom_'));
  });

  it('clamps CO2 to valid range', () => {
    const data = EcoData._getDefaultData();
    EcoData.addCustomHabit(data, 'Too High', 'transport', 999);
    const habit = data.habits[data.habits.length - 1];
    assert.strictEqual(habit.co2PerAction, 100);
  });

  it('defaults CO2 to 0.5 when omitted', () => {
    const data = EcoData._getDefaultData();
    EcoData.addCustomHabit(data, 'No CO2', 'transport');
    const habit = data.habits[data.habits.length - 1];
    assert.strictEqual(habit.co2PerAction, 0.5);
  });
});

describe('removeHabit', () => {
  it('removes the habit from the list and all completed dates', () => {
    const data = EcoData._getDefaultData();
    EcoData.toggleHabit(data, 'bike_walk', '2024-01-15');
    EcoData.removeHabit(data, 'bike_walk');
    assert.strictEqual(data.habits.find(h => h.id === 'bike_walk'), undefined);
    const dateHabits = EcoData.getHabitsForDate(data, '2024-01-15');
    assert.strictEqual(dateHabits.length, 0);
  });
});

describe('getDailyChallenge', () => {
  it('assigns a challenge for today', () => {
    const data = EcoData._getDefaultData();
    const challenge = EcoData.getDailyChallenge(data);
    assert.ok(challenge.id);
    assert.ok(challenge.title);
    assert.strictEqual(data.challengeDate, EcoData.getTodayKey());
  });

  it('returns the same challenge on repeated calls', () => {
    const data = EcoData._getDefaultData();
    const c1 = EcoData.getDailyChallenge(data);
    const c2 = EcoData.getDailyChallenge(data);
    assert.strictEqual(c1.id, c2.id);
  });
});

describe('completeChallenge', () => {
  it('adds bonus CO2 when completing', () => {
    const data = EcoData._getDefaultData();
    EcoData.getDailyChallenge(data);
    const before = data.totalCO2;
    const result = EcoData.completeChallenge(data);
    assert.strictEqual(result, true);
    assert.ok(data.totalCO2 > before);
  });

  it('returns false if already completed', () => {
    const data = EcoData._getDefaultData();
    EcoData.getDailyChallenge(data);
    EcoData.completeChallenge(data);
    const result = EcoData.completeChallenge(data);
    assert.strictEqual(result, false);
  });
});

describe('exportData / importData / resetAll', () => {
  it('exports and imports data round-trip', () => {
    const data = EcoData._getDefaultData();
    EcoData.toggleHabit(data, 'bike_walk', '2024-01-15');
    EcoData.save(data);

    const exported = EcoData.exportData();
    assert.strictEqual(typeof exported, 'string');

    EcoData.resetAll();
    const empty = EcoData.load();
    assert.strictEqual(empty.totalCO2, 0);

    EcoData.importData(exported);
    const restored = EcoData.load();
    assert.strictEqual(restored.totalCO2, 3.2);
  });

  it('throws on invalid JSON', () => {
    assert.throws(() => EcoData.importData('not json'), /Invalid JSON/);
  });

  it('throws on data without version', () => {
    assert.throws(() => EcoData.importData('{}'), /Missing data version/);
  });
});

describe('chatHistory', () => {
  it('starts empty', () => {
    const data = EcoData._getDefaultData();
    assert.deepStrictEqual(EcoData.getChatHistory(data), []);
  });

  it('adds and retrieves messages', () => {
    const data = EcoData._getDefaultData();
    EcoData.addChatMessage(data, 'user', 'Hello', Date.now());
    EcoData.addChatMessage(data, 'assistant', 'Hi there', Date.now());
    const history = EcoData.getChatHistory(data);
    assert.strictEqual(history.length, 2);
    assert.strictEqual(history[0].role, 'user');
    assert.strictEqual(history[1].role, 'assistant');
  });

  it('clears all messages', () => {
    const data = EcoData._getDefaultData();
    EcoData.addChatMessage(data, 'user', 'Hello', Date.now());
    EcoData.clearChatHistory(data);
    assert.strictEqual(EcoData.getChatHistory(data).length, 0);
  });
});

describe('defaultHabits', () => {
  it('contains 16 habits', () => {
    assert.strictEqual(EcoData.defaultHabits.length, 16);
  });

  it('has unique IDs', () => {
    const ids = EcoData.defaultHabits.map(h => h.id);
    assert.strictEqual(new Set(ids).size, ids.length);
  });
});