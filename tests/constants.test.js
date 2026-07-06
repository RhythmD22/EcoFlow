import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as constants from '../js/constants.js';

describe('TREE_THRESHOLDS', () => {
  it('has 8 thresholds', () => {
    assert.strictEqual(constants.TREE_THRESHOLDS.length, 8);
  });

  it('is sorted ascending', () => {
    for (let i = 1; i < constants.TREE_THRESHOLDS.length; i++) {
      assert.ok(constants.TREE_THRESHOLDS[i] > constants.TREE_THRESHOLDS[i - 1]);
    }
  });
});

describe('Tree crown thresholds', () => {
  it('are in correct order', () => {
    assert.ok(constants.TREE_CROWN_PARTIAL < constants.TREE_CROWN_FULL);
    assert.ok(constants.TREE_CROWN_FULL < constants.TREE_CROWN_ANIMATE);
  });
});

describe('LEAF_THRESHOLDS', () => {
  it('has 13 leaf entries', () => {
    assert.strictEqual(Object.keys(constants.LEAF_THRESHOLDS).length, 13);
  });
});

describe('CO2 validation bounds', () => {
  it('min is less than max', () => {
    assert.ok(constants.CO2_VALIDATION_MIN < constants.CO2_VALIDATION_MAX);
  });

  it('min is positive', () => {
    assert.ok(constants.CO2_VALIDATION_MIN > 0);
  });
});

describe('CO2 equivalents', () => {
  it('are positive numbers', () => {
    assert.ok(constants.CO2_PER_TREE_KG > 0);
    assert.ok(constants.CO2_PER_CAR_MILE_KG > 0);
    assert.ok(constants.CO2_PER_LITER_WATER_KG > 0);
    assert.ok(constants.CO2_PER_KWH_KG > 0);
  });
});

describe('Cache durations', () => {
  it('are in ascending order of duration', () => {
    assert.ok(constants.WEATHER_CACHE_MS < constants.AQI_CACHE_MS);
    assert.ok(constants.AQI_CACHE_MS < constants.COUNTRY_CACHE_MS);
    assert.ok(constants.COUNTRY_CACHE_MS < constants.CLIMATE_CACHE_MS);
  });
});